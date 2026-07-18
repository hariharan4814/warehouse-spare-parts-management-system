from rest_framework import serializers
from django.contrib.auth import get_user_model
from spare_parts.models import SparePartCategory, StorageLocation, SparePart

User = get_user_model()


class SparePartCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SparePartCategory
        fields = ["id", "name", "description", "status", "created_at"]


class StorageLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageLocation
        fields = ["id", "warehouse", "rack", "shelf", "bin"]


class SparePartSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=SparePartCategory.objects.all(),
        source="category",
        write_only=True
    )
    category = SparePartCategorySerializer(read_only=True)

    storage_location_id = serializers.PrimaryKeyRelatedField(
        queryset=StorageLocation.objects.all(),
        source="storage_location",
        write_only=True
    )
    storage_location = StorageLocationSerializer(read_only=True)

    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True)

    class Meta:
        model = SparePart
        fields = [
            "id",
            "part_number",
            "part_name",
            "description",
            "category",
            "category_id",
            "manufacturer",
            "brand",
            "unit_of_measure",
            "cost_price",
            "selling_price",
            "minimum_stock",
            "current_stock",
            "maximum_stock",
            "storage_location",
            "storage_location_id",
            "barcode",
            "qr_code",
            "image",
            "status",
            "is_deleted",
            "created_by",
            "created_by_username",
            "updated_by",
            "updated_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "updated_by", "created_at", "updated_at", "is_deleted"]

    def validate(self, attrs):
        min_stock = attrs.get("minimum_stock")
        max_stock = attrs.get("maximum_stock")
        current_stock = attrs.get("current_stock")
        cost_price = attrs.get("cost_price")
        selling_price = attrs.get("selling_price")

        # Support partial updates
        if self.instance:
            if min_stock is None:
                min_stock = self.instance.minimum_stock
            if max_stock is None:
                max_stock = self.instance.maximum_stock
            if current_stock is None:
                current_stock = self.instance.current_stock
            if cost_price is None:
                cost_price = self.instance.cost_price
            if selling_price is None:
                selling_price = self.instance.selling_price

        # Minimum Stock cannot exceed Maximum Stock
        if min_stock is not None and max_stock is not None:
            if min_stock > max_stock:
                raise serializers.ValidationError({
                    "minimum_stock": "Minimum stock cannot exceed maximum stock."
                })

        # Current Stock cannot exceed Maximum Stock
        if current_stock is not None and max_stock is not None:
            if current_stock > max_stock:
                raise serializers.ValidationError({
                    "current_stock": "Current stock cannot exceed maximum stock."
                })

        # Prices cannot be negative
        if cost_price is not None and cost_price < 0:
            raise serializers.ValidationError({
                "cost_price": "Cost price cannot be negative."
            })

        if selling_price is not None and selling_price < 0:
            raise serializers.ValidationError({
                "selling_price": "Selling price cannot be negative."
            })

        # Enforce Store Keeper limitations
        request = self.context.get("request")
        if request and request.user and request.user.role == "STORE_KEEPER" and self.instance:
            for field, value in attrs.items():
                if field != "current_stock":
                    original_val = getattr(self.instance, field)
                    if original_val != value:
                        raise serializers.ValidationError({
                            field: "Store Keepers are only permitted to update the stock count."
                        })

        return attrs
