from django.db import models
from django.conf import settings
from spare_parts.models import SparePart


class WarehouseStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"


class TransferStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING = "PENDING", "Pending Approval"
    APPROVED = "APPROVED", "Approved"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class Warehouse(models.Model):
    warehouse_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_warehouses"
    )
    status = models.CharField(
        max_length=20,
        choices=WarehouseStatus.choices,
        default=WarehouseStatus.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.warehouse_code:
            last_wh = Warehouse.objects.order_by("-id").first()
            last_id = last_wh.id if last_wh else 0
            self.warehouse_code = f"WH-{last_id + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.warehouse_code})"


class WarehouseInventory(models.Model):
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="inventory_records"
    )
    spare_part = models.ForeignKey(
        SparePart,
        on_delete=models.PROTECT,
        related_name="warehouse_inventory_records"
    )
    current_stock = models.PositiveIntegerField(default=0)
    minimum_stock = models.PositiveIntegerField(default=5)
    maximum_stock = models.PositiveIntegerField(default=100)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("warehouse", "spare_part")
        verbose_name_plural = "Warehouse Inventories"

    def __str__(self):
        return f"{self.warehouse.name} - {self.spare_part.part_name}: {self.current_stock}"


class StockTransfer(models.Model):
    transfer_number = models.CharField(max_length=50, unique=True, db_index=True)
    source_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="transfers_sent"
    )
    destination_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="transfers_received"
    )
    status = models.CharField(
        max_length=20,
        choices=TransferStatus.choices,
        default=TransferStatus.DRAFT
    )
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="transfers_created"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transfers_approved"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.transfer_number:
            last_trf = StockTransfer.objects.order_by("-id").first()
            last_id = last_trf.id if last_trf else 0
            self.transfer_number = f"TRF-{last_id + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transfer_number}: {self.source_warehouse.name} -> {self.destination_warehouse.name} ({self.status})"


class StockTransferItem(models.Model):
    transfer = models.ForeignKey(
        StockTransfer,
        on_delete=models.CASCADE,
        related_name="items"
    )
    spare_part = models.ForeignKey(
        SparePart,
        on_delete=models.PROTECT,
        related_name="transfer_items"
    )
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.transfer.transfer_number} - {self.spare_part.part_name} ({self.quantity})"
