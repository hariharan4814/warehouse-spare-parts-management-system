from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from suppliers.models import Supplier
from suppliers.serializers import SupplierSerializer
from spare_parts.models import SparePart
from inventory.models import StockMovement, StockMovementType, ReferenceType
from purchases.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    GoodsReceipt,
    GoodsReceiptItem,
)

User = get_user_model()


class SparePartMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = SparePart
        fields = ["id", "part_number", "part_name"]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    spare_part_id = serializers.PrimaryKeyRelatedField(
        queryset=SparePart.objects.all(),
        source="spare_part",
        write_only=True
    )
    spare_part = SparePartMiniSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id",
            "spare_part",
            "spare_part_id",
            "ordered_quantity",
            "received_quantity",
            "unit_price",
            "total_price",
        ]
        read_only_fields = ["received_quantity", "total_price"]


class GoodsReceiptItemSerializer(serializers.ModelSerializer):
    po_item_id = serializers.PrimaryKeyRelatedField(
        queryset=PurchaseOrderItem.objects.all(),
        source="po_item",
        write_only=True
    )
    spare_part_name = serializers.CharField(source="po_item.spare_part.part_name", read_only=True)
    spare_part_number = serializers.CharField(source="po_item.spare_part.part_number", read_only=True)

    class Meta:
        model = GoodsReceiptItem
        fields = [
            "id",
            "po_item",
            "po_item_id",
            "spare_part_name",
            "spare_part_number",
            "received_quantity",
        ]


class GoodsReceiptSerializer(serializers.ModelSerializer):
    items = GoodsReceiptItemSerializer(many=True, read_only=True)
    received_by_username = serializers.CharField(source="received_by.username", read_only=True)
    po_number = serializers.CharField(source="purchase_order.po_number", read_only=True)

    class Meta:
        model = GoodsReceipt
        fields = [
            "id",
            "grn_number",
            "purchase_order",
            "po_number",
            "received_date",
            "received_by",
            "received_by_username",
            "remarks",
            "items",
        ]
        read_only_fields = ["grn_number", "received_date", "received_by"]


class GoodsReceiptCreateSerializer(serializers.ModelSerializer):
    purchase_order_id = serializers.PrimaryKeyRelatedField(
        queryset=PurchaseOrder.objects.all(),
        source="purchase_order",
        write_only=True
    )
    receipt_items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )

    class Meta:
        model = GoodsReceipt
        fields = [
            "id",
            "grn_number",
            "purchase_order_id",
            "remarks",
            "receipt_items",
        ]
        read_only_fields = ["grn_number"]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None

        po = validated_data["purchase_order"]
        if po.status not in [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PARTIALLY_RECEIVED]:
            raise serializers.ValidationError(
                {"purchase_order_id": f"Cannot receive goods for PO in status '{po.status}'. PO must be Approved."}
            )

        receipt_items_data = validated_data.get("receipt_items", [])
        if not receipt_items_data:
            raise serializers.ValidationError({"receipt_items": "At least one receipt item is required."})

        # Create GoodsReceipt
        grn = GoodsReceipt.objects.create(
            purchase_order=po,
            received_by=user,
            remarks=validated_data.get("remarks", "")
        )

        has_any_received = False

        for item_data in receipt_items_data:
            po_item_id = item_data.get("po_item_id")
            qty_received = int(item_data.get("received_quantity", 0))

            if qty_received <= 0:
                continue

            try:
                po_item = PurchaseOrderItem.objects.get(pk=po_item_id, purchase_order=po)
            except PurchaseOrderItem.DoesNotExist:
                raise serializers.ValidationError(
                    {"receipt_items": f"Invalid item ID {po_item_id} for Purchase Order {po.po_number}."}
                )

            remaining_qty = po_item.ordered_quantity - po_item.received_quantity
            if qty_received > remaining_qty:
                raise serializers.ValidationError(
                    {"receipt_items": f"Received quantity ({qty_received}) for {po_item.spare_part.part_name} exceeds remaining ordered quantity ({remaining_qty})."}
                )

            # Update PO item received quantity
            po_item.received_quantity += qty_received
            po_item.save()

            # Create GoodsReceiptItem
            GoodsReceiptItem.objects.create(
                goods_receipt=grn,
                po_item=po_item,
                received_quantity=qty_received
            )

            # Lock and update spare part stock
            part = SparePart.objects.select_for_update().get(pk=po_item.spare_part.pk)
            previous_stock = part.current_stock
            new_stock = previous_stock + qty_received

            part.current_stock = new_stock
            if part.current_stock == 0:
                part.status = "out_of_stock"
            elif part.current_stock <= part.minimum_stock:
                part.status = "low_stock"
            else:
                part.status = "active"
            part.save()

            # Create audited StockMovement
            StockMovement.objects.create(
                spare_part=part,
                movement_type=StockMovementType.STOCK_IN,
                quantity=qty_received,
                previous_stock=previous_stock,
                new_stock=new_stock,
                reference_type=ReferenceType.PURCHASE,
                reference_number=grn.grn_number,
                reason=f"Goods Receipt {grn.grn_number} for PO {po.po_number}",
                performed_by=user
            )

            has_any_received = True

        if not has_any_received:
            raise serializers.ValidationError({"receipt_items": "Quantity received must be greater than zero."})

        # Recalculate PO overall status
        total_ordered = sum(item.ordered_quantity for item in po.items.all())
        total_received = sum(item.received_quantity for item in po.items.all())

        if total_received >= total_ordered:
            po.status = PurchaseOrderStatus.COMPLETED
        elif total_received > 0:
            po.status = PurchaseOrderStatus.PARTIALLY_RECEIVED
        po.save()

        return grn


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(),
        source="supplier",
        write_only=True
    )
    supplier = SupplierSerializer(read_only=True)
    items = PurchaseOrderItemSerializer(many=True, required=False)
    goods_receipts = GoodsReceiptSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "po_number",
            "supplier",
            "supplier_id",
            "order_date",
            "expected_delivery_date",
            "status",
            "total_amount",
            "remarks",
            "created_by",
            "created_by_username",
            "approved_by",
            "approved_by_username",
            "approved_at",
            "created_at",
            "updated_at",
            "items",
            "goods_receipts",
        ]
        read_only_fields = [
            "po_number",
            "status",
            "total_amount",
            "created_by",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None

        items_data = validated_data.pop("items", [])
        validated_data["created_by"] = user
        validated_data["status"] = PurchaseOrderStatus.DRAFT

        po = PurchaseOrder.objects.create(**validated_data)

        total_amount = 0
        for item_data in items_data:
            qty = item_data["ordered_quantity"]
            price = item_data["unit_price"]
            item_total = qty * price

            PurchaseOrderItem.objects.create(
                purchase_order=po,
                spare_part=item_data["spare_part"],
                ordered_quantity=qty,
                unit_price=price,
                total_price=item_total
            )
            total_amount += item_total

        po.total_amount = total_amount
        po.save()

        return po

    @transaction.atomic
    def update(self, instance, validated_data):
        if instance.status not in [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING_APPROVAL]:
            raise serializers.ValidationError(
                {"status": f"Cannot modify Purchase Order in '{instance.status}' status."}
            )

        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if items_data is not None:
            instance.items.all().delete()
            total_amount = 0
            for item_data in items_data:
                qty = item_data["ordered_quantity"]
                price = item_data["unit_price"]
                item_total = qty * price

                PurchaseOrderItem.objects.create(
                    purchase_order=instance,
                    spare_part=item_data["spare_part"],
                    ordered_quantity=qty,
                    unit_price=price,
                    total_price=item_total
                )
                total_amount += item_total

            instance.total_amount = total_amount

        instance.save()
        return instance
