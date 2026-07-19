from django.db import models
from django.conf import settings
from spare_parts.models import SparePart


class StockMovementType(models.TextChoices):
    STOCK_IN = "STOCK_IN", "Stock In"
    STOCK_OUT = "STOCK_OUT", "Stock Out"
    STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT", "Stock Adjustment"
    STOCK_TRANSFER = "STOCK_TRANSFER", "Stock Transfer"


class ReferenceType(models.TextChoices):
    PURCHASE = "PURCHASE", "Purchase"
    ISSUE = "ISSUE", "Issue"
    RETURN = "RETURN", "Return"
    ADJUSTMENT = "ADJUSTMENT", "Adjustment"
    TRANSFER = "TRANSFER", "Transfer"


class StockMovement(models.Model):
    spare_part = models.ForeignKey(
        SparePart,
        on_delete=models.PROTECT,
        related_name="stock_movements"
    )
    movement_type = models.CharField(
        max_length=25,
        choices=StockMovementType.choices
    )
    quantity = models.PositiveIntegerField()
    previous_stock = models.IntegerField()
    new_stock = models.IntegerField()
    reference_type = models.CharField(
        max_length=25,
        choices=ReferenceType.choices,
        blank=True,
        null=True
    )
    reason = models.TextField()
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="movements_performed"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.movement_type} - {self.spare_part.part_name} ({self.quantity})"


class AdjustmentType(models.TextChoices):
    INCREASE = "INCREASE", "Increase"
    DECREASE = "DECREASE", "Decrease"


class InventoryAdjustment(models.Model):
    spare_part = models.ForeignKey(
        SparePart,
        on_delete=models.PROTECT,
        related_name="adjustments"
    )
    adjustment_type = models.CharField(
        max_length=15,
        choices=AdjustmentType.choices
    )
    quantity = models.PositiveIntegerField()
    reason = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="adjustments_created"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="adjustments_approved"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.adjustment_type} - {self.spare_part.part_name} ({self.quantity})"


# Alias to support both model names
StockAdjustment = InventoryAdjustment

