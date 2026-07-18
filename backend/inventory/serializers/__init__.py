from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from spare_parts.models import SparePart, StorageLocation
from inventory.models import StockMovement, StockMovementType, InventoryAdjustment, AdjustmentType

User = get_user_model()


class SparePartMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = SparePart
        fields = ["id", "part_number", "part_name"]


class StockMovementSerializer(serializers.ModelSerializer):
    spare_part_id = serializers.PrimaryKeyRelatedField(
        queryset=SparePart.objects.all(),
        source="spare_part",
        write_only=True
    )
    spare_part = SparePartMiniSerializer(read_only=True)
    performed_by_username = serializers.CharField(source="performed_by.username", read_only=True)
    
    new_storage_location_id = serializers.PrimaryKeyRelatedField(
        queryset=StorageLocation.objects.all(),
        source="new_storage_location",
        required=False,
        write_only=True
    )

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "spare_part",
            "spare_part_id",
            "movement_type",
            "quantity",
            "previous_stock",
            "new_stock",
            "reason",
            "reference_number",
            "remarks",
            "performed_by",
            "performed_by_username",
            "new_storage_location_id",
            "created_at",
        ]
        read_only_fields = ["previous_stock", "new_stock", "performed_by", "created_at"]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        
        spare_part = validated_data["spare_part"]
        # Lock spare part
        part = SparePart.objects.select_for_update().get(pk=spare_part.pk)
        
        movement_type = validated_data["movement_type"]
        quantity = validated_data["quantity"]
        
        if quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})
            
        previous_stock = part.current_stock
        
        if movement_type == StockMovementType.STOCK_IN:
            new_stock = previous_stock + quantity
        elif movement_type == StockMovementType.STOCK_OUT:
            if quantity > previous_stock:
                raise serializers.ValidationError({"quantity": "Stock Out quantity cannot exceed available stock."})
            new_stock = previous_stock - quantity
        elif movement_type == StockMovementType.STOCK_TRANSFER:
            if quantity > previous_stock:
                raise serializers.ValidationError({"quantity": "Transfer quantity cannot exceed available stock."})
            new_stock = previous_stock
            
            # If location is provided, update the part's location
            new_loc = validated_data.get("new_storage_location")
            if new_loc:
                part.storage_location = new_loc
        elif movement_type == StockMovementType.STOCK_ADJUSTMENT:
            # Handled primarily via adjustments endpoint, but if created directly:
            new_stock = previous_stock + quantity
        else:
            raise serializers.ValidationError({"movement_type": "Invalid movement type."})
            
        # Update part stock
        part.current_stock = new_stock
        
        # Update part status
        if part.current_stock == 0:
            part.status = "out_of_stock"
        elif part.current_stock <= part.minimum_stock:
            part.status = "low_stock"
        else:
            part.status = "active"
            
        part.save()
        
        # Create StockMovement
        movement = StockMovement.objects.create(
            spare_part=part,
            movement_type=movement_type,
            quantity=quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reason=validated_data.get("reason", ""),
            reference_number=validated_data.get("reference_number", ""),
            remarks=validated_data.get("remarks", ""),
            performed_by=user
        )
        return movement


class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    spare_part_id = serializers.PrimaryKeyRelatedField(
        queryset=SparePart.objects.all(),
        source="spare_part",
        write_only=True
    )
    spare_part = SparePartMiniSerializer(read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)
    approved_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="approved_by",
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = InventoryAdjustment
        fields = [
            "id",
            "spare_part",
            "spare_part_id",
            "adjustment_type",
            "quantity",
            "reason",
            "created_by",
            "created_by_username",
            "approved_by",
            "approved_by_id",
            "approved_by_username",
            "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        
        spare_part = validated_data["spare_part"]
        # Lock spare part
        part = SparePart.objects.select_for_update().get(pk=spare_part.pk)
        
        adjustment_type = validated_data["adjustment_type"]
        quantity = validated_data["quantity"]
        reason = validated_data["reason"]
        
        if quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})
            
        if not reason or not reason.strip():
            raise serializers.ValidationError({"reason": "Reason is required for inventory adjustments."})
            
        previous_stock = part.current_stock
        
        if adjustment_type == AdjustmentType.INCREASE:
            new_stock = previous_stock + quantity
        elif adjustment_type == AdjustmentType.DECREASE:
            if quantity > previous_stock:
                raise serializers.ValidationError({"quantity": "Adjustment decrease cannot exceed available stock."})
            new_stock = previous_stock - quantity
        else:
            raise serializers.ValidationError({"adjustment_type": "Invalid adjustment type."})
            
        # Update part stock
        part.current_stock = new_stock
        
        # Update part status
        if part.current_stock == 0:
            part.status = "out_of_stock"
        elif part.current_stock <= part.minimum_stock:
            part.status = "low_stock"
        else:
            part.status = "active"
            
        part.save()
        
        # Create InventoryAdjustment
        adjustment = InventoryAdjustment.objects.create(
            spare_part=part,
            adjustment_type=adjustment_type,
            quantity=quantity,
            reason=reason,
            created_by=user,
            approved_by=validated_data.get("approved_by")
        )
        
        # Create corresponding StockMovement
        StockMovement.objects.create(
            spare_part=part,
            movement_type=StockMovementType.STOCK_ADJUSTMENT,
            quantity=quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reason=f"Adjustment #{adjustment.id}: {reason}",
            reference_number=f"ADJ-{adjustment.id}",
            performed_by=user
        )
        
        return adjustment
