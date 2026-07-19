from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from issue_return.models import (
    WorkOrder,
    WorkOrderItem,
    IssueTransaction,
    IssueTransactionItem,
    WorkOrderPriority,
    WorkOrderStatus,
)
from spare_parts.models import SparePart
from warehouses.models import Warehouse, WarehouseInventory
from inventory.models import StockMovement, StockMovementType, ReferenceType

User = get_user_model()


class SparePartMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = SparePart
        fields = ["id", "part_number", "part_name", "current_stock"]


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "role"]


class WorkOrderItemSerializer(serializers.ModelSerializer):
    spare_part_id = serializers.PrimaryKeyRelatedField(
        queryset=SparePart.objects.all(),
        source="spare_part",
        write_only=True
    )
    spare_part = SparePartMiniSerializer(read_only=True)

    class Meta:
        model = WorkOrderItem
        fields = [
            "id",
            "spare_part",
            "spare_part_id",
            "requested_quantity",
            "issued_quantity",
        ]
        read_only_fields = ["issued_quantity"]


class WorkOrderSerializer(serializers.ModelSerializer):
    assigned_technician_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="assigned_technician",
        required=False,
        allow_null=True,
        write_only=True
    )
    assigned_technician = UserMiniSerializer(read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    items = WorkOrderItemSerializer(many=True, required=False)

    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "work_order_number",
            "title",
            "description",
            "priority",
            "status",
            "equipment_name",
            "location",
            "assigned_technician",
            "assigned_technician_id",
            "created_by",
            "created_by_username",
            "completed_at",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = [
            "work_order_number",
            "status",
            "created_by",
            "completed_at",
            "created_at",
            "updated_at",
        ]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None

        items_data = validated_data.pop("items", [])
        validated_data["created_by"] = user
        validated_data["status"] = WorkOrderStatus.OPEN

        work_order = WorkOrder.objects.create(**validated_data)

        for item_data in items_data:
            qty = item_data.get("requested_quantity", 1)
            if qty <= 0:
                raise serializers.ValidationError({"items": "Requested quantity must be greater than zero."})

            WorkOrderItem.objects.create(
                work_order=work_order,
                spare_part=item_data["spare_part"],
                requested_quantity=qty
            )

        return work_order


class IssueTransactionItemSerializer(serializers.ModelSerializer):
    spare_part_id = serializers.PrimaryKeyRelatedField(
        queryset=SparePart.objects.all(),
        source="spare_part",
        write_only=True
    )
    spare_part_number = serializers.CharField(source="spare_part.part_number", read_only=True)
    spare_part_name = serializers.CharField(source="spare_part.part_name", read_only=True)

    class Meta:
        model = IssueTransactionItem
        fields = [
            "id",
            "spare_part_id",
            "spare_part_number",
            "spare_part_name",
            "quantity",
        ]


class IssueTransactionSerializer(serializers.ModelSerializer):
    work_order_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkOrder.objects.all(),
        source="work_order",
        write_only=True
    )
    work_order_number = serializers.CharField(source="work_order.work_order_number", read_only=True)
    warehouse_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        source="warehouse",
        write_only=True
    )
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    issued_by_username = serializers.CharField(source="issued_by.username", read_only=True)
    items = IssueTransactionItemSerializer(many=True)

    class Meta:
        model = IssueTransaction
        fields = [
            "id",
            "issue_number",
            "work_order",
            "work_order_id",
            "work_order_number",
            "warehouse",
            "warehouse_id",
            "warehouse_name",
            "issued_by",
            "issued_by_username",
            "issued_at",
            "remarks",
            "items",
        ]
        read_only_fields = [
            "issue_number",
            "work_order",
            "warehouse",
            "issued_by",
            "issued_at",
        ]


class IssueTransactionCreateSerializer(serializers.Serializer):
    work_order_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkOrder.objects.all(),
        source="work_order"
    )
    warehouse_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        source="warehouse"
    )
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    items = IssueTransactionItemSerializer(many=True)

    def validate(self, attrs):
        work_order = attrs["work_order"]
        warehouse = attrs["warehouse"]
        items_data = attrs.get("items", [])

        if work_order.status in [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED]:
            raise serializers.ValidationError({"work_order_id": f"Cannot issue parts for Work Order in '{work_order.status}' status."})

        if not items_data:
            raise serializers.ValidationError({"items": "At least one item must be issued."})

        for item_data in items_data:
            part = item_data["spare_part"]
            qty = item_data["quantity"]

            if qty <= 0:
                raise serializers.ValidationError({"items": f"Quantity for '{part.part_name}' must be greater than zero."})

            wo_item = WorkOrderItem.objects.filter(work_order=work_order, spare_part=part).first()
            if not wo_item:
                raise serializers.ValidationError({"items": f"Spare part '{part.part_name}' is not in Work Order #{work_order.work_order_number}."})

            remaining = wo_item.requested_quantity - wo_item.issued_quantity
            if qty > remaining:
                raise serializers.ValidationError(
                    {"items": f"Cannot issue {qty} units of '{part.part_name}'. Only {remaining} units remaining for Work Order #{work_order.work_order_number}."}
                )

            # Stock check
            wh_inv = WarehouseInventory.objects.filter(warehouse=warehouse, spare_part=part).first()
            available = wh_inv.current_stock if wh_inv else part.current_stock
            if qty > available:
                raise serializers.ValidationError(
                    {"items": f"Insufficient stock for '{part.part_name}' at {warehouse.name}. Available: {available}, Requested to issue: {qty}."}
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None

        work_order = validated_data["work_order"]
        warehouse = validated_data["warehouse"]
        remarks = validated_data.get("remarks")
        items_data = validated_data["items"]

        issue_tx = IssueTransaction.objects.create(
            work_order=work_order,
            warehouse=warehouse,
            issued_by=user,
            remarks=remarks
        )

        for item_data in items_data:
            part = item_data["spare_part"]
            qty = item_data["quantity"]

            IssueTransactionItem.objects.create(
                issue_transaction=issue_tx,
                spare_part=part,
                quantity=qty
            )

            # 1. Update SparePart stock
            spare_part_obj = SparePart.objects.select_for_update().get(pk=part.pk)
            prev_overall_stock = spare_part_obj.current_stock
            spare_part_obj.current_stock = max(0, spare_part_obj.current_stock - qty)
            spare_part_obj.save()

            # 2. Update WarehouseInventory stock
            wh_inv, _ = WarehouseInventory.objects.select_for_update().get_or_create(
                warehouse=warehouse,
                spare_part=part,
                defaults={"current_stock": prev_overall_stock}
            )
            wh_inv.current_stock = max(0, wh_inv.current_stock - qty)
            wh_inv.save()

            # 3. Update WorkOrderItem issued quantity
            wo_item = WorkOrderItem.objects.select_for_update().get(work_order=work_order, spare_part=part)
            wo_item.issued_quantity += qty
            wo_item.save()

            # 4. Create StockMovement audit trail
            StockMovement.objects.create(
                spare_part=part,
                movement_type=StockMovementType.STOCK_OUT,
                quantity=qty,
                previous_stock=prev_overall_stock,
                new_stock=spare_part_obj.current_stock,
                reference_type=ReferenceType.ISSUE,
                reference_number=issue_tx.issue_number,
                reason=f"Parts Issued for Work Order #{work_order.work_order_number} ({warehouse.name})",
                performed_by=user
            )

        # 5. Check if WorkOrder is now fully fulfilled or in progress
        all_wo_items = work_order.items.all()
        fully_completed = all(i.issued_quantity >= i.requested_quantity for i in all_wo_items)

        if fully_completed:
            work_order.status = WorkOrderStatus.COMPLETED
            work_order.completed_at = timezone.now()
        else:
            work_order.status = WorkOrderStatus.IN_PROGRESS

        work_order.save()

        return issue_tx
