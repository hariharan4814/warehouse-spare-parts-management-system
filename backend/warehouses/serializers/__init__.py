from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from warehouses.models import (
    Warehouse,
    WarehouseInventory,
    StockTransfer,
    StockTransferItem,
    TransferStatus,
    WarehouseStatus,
)
from spare_parts.models import SparePart
from inventory.models import StockMovement, StockMovementType, ReferenceType

User = get_user_model()


class WarehouseMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "warehouse_code", "name", "city"]


class SparePartMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = SparePart
        fields = ["id", "part_number", "part_name"]


class WarehouseSerializer(serializers.ModelSerializer):
    manager_username = serializers.CharField(source="manager.username", read_only=True)
    manager_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="manager",
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = Warehouse
        fields = [
            "id",
            "warehouse_code",
            "name",
            "description",
            "address",
            "city",
            "state",
            "country",
            "postal_code",
            "manager",
            "manager_id",
            "manager_username",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["warehouse_code", "created_at", "updated_at"]

    def create(self, validated_data):
        if not validated_data.get("warehouse_code"):
            last_wh = Warehouse.objects.order_by("-id").first()
            last_id = last_wh.id if last_wh else 0
            validated_data["warehouse_code"] = f"WH-{last_id + 1:04d}"
        return super().create(validated_data)


class WarehouseInventorySerializer(serializers.ModelSerializer):
    warehouse_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        source="warehouse",
        write_only=True
    )
    warehouse = WarehouseMiniSerializer(read_only=True)
    spare_part_id = serializers.PrimaryKeyRelatedField(
        queryset=SparePart.objects.all(),
        source="spare_part",
        write_only=True
    )
    spare_part = SparePartMiniSerializer(read_only=True)

    class Meta:
        model = WarehouseInventory
        fields = [
            "id",
            "warehouse",
            "warehouse_id",
            "spare_part",
            "spare_part_id",
            "current_stock",
            "minimum_stock",
            "maximum_stock",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class StockTransferItemSerializer(serializers.ModelSerializer):
    spare_part_id = serializers.PrimaryKeyRelatedField(
        queryset=SparePart.objects.all(),
        source="spare_part",
        write_only=True
    )
    spare_part = SparePartMiniSerializer(read_only=True)

    class Meta:
        model = StockTransferItem
        fields = [
            "id",
            "spare_part",
            "spare_part_id",
            "quantity",
        ]


class StockTransferSerializer(serializers.ModelSerializer):
    source_warehouse_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        source="source_warehouse",
        write_only=True
    )
    source_warehouse = WarehouseMiniSerializer(read_only=True)
    destination_warehouse_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        source="destination_warehouse",
        write_only=True
    )
    destination_warehouse = WarehouseMiniSerializer(read_only=True)
    items = StockTransferItemSerializer(many=True, required=False)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model = StockTransfer
        fields = [
            "id",
            "transfer_number",
            "source_warehouse",
            "source_warehouse_id",
            "destination_warehouse",
            "destination_warehouse_id",
            "status",
            "remarks",
            "created_by",
            "created_by_username",
            "approved_by",
            "approved_by_username",
            "created_at",
            "completed_at",
            "items",
        ]
        read_only_fields = [
            "transfer_number",
            "status",
            "created_by",
            "approved_by",
            "created_at",
            "completed_at",
        ]

    def validate(self, attrs):
        source = attrs.get("source_warehouse", getattr(self.instance, "source_warehouse", None))
        destination = attrs.get("destination_warehouse", getattr(self.instance, "destination_warehouse", None))

        if source and destination and source.id == destination.id:
            raise serializers.ValidationError(
                {"destination_warehouse_id": "A warehouse cannot transfer stock to itself. Source and destination must differ."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None

        items_data = validated_data.pop("items", [])
        if not items_data:
            raise serializers.ValidationError({"items": "At least one item is required for a stock transfer."})

        validated_data["created_by"] = user
        validated_data["status"] = TransferStatus.DRAFT

        source_wh = validated_data["source_warehouse"]

        # Validate stock availability at source warehouse
        for item_data in items_data:
            part = item_data["spare_part"]
            qty = item_data["quantity"]

            if qty <= 0:
                raise serializers.ValidationError({"items": f"Quantity for {part.part_name} must be greater than zero."})

            wh_inv = WarehouseInventory.objects.filter(warehouse=source_wh, spare_part=part).first()
            available = wh_inv.current_stock if wh_inv else part.current_stock

            if qty > available:
                raise serializers.ValidationError(
                    {"items": f"Transfer quantity ({qty}) for '{part.part_name}' exceeds available stock ({available}) at {source_wh.name}."}
                )

        transfer = StockTransfer.objects.create(**validated_data)

        for item_data in items_data:
            StockTransferItem.objects.create(
                transfer=transfer,
                spare_part=item_data["spare_part"],
                quantity=item_data["quantity"]
            )

        return transfer
