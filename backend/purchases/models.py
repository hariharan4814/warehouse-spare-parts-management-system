from django.db import models
from django.conf import settings
from django.utils import timezone
from suppliers.models import Supplier
from spare_parts.models import SparePart


class PurchaseOrderStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
    APPROVED = "APPROVED", "Approved"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED", "Partially Received"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class PurchaseOrder(models.Model):
    po_number = models.CharField(max_length=50, unique=True, db_index=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="purchase_orders"
    )
    order_date = models.DateField(default=timezone.localdate)
    expected_delivery_date = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=25,
        choices=PurchaseOrderStatus.choices,
        default=PurchaseOrderStatus.DRAFT
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="pos_created"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pos_approved"
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.po_number:
            last_po = PurchaseOrder.objects.order_by("-id").first()
            last_id = last_po.id if last_po else 0
            self.po_number = f"PO-{last_id + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.po_number} - {self.supplier.company_name} ({self.status})"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items"
    )
    spare_part = models.ForeignKey(
        SparePart,
        on_delete=models.PROTECT,
        related_name="po_items"
    )
    ordered_quantity = models.PositiveIntegerField()
    received_quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.ordered_quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.purchase_order.po_number} - {self.spare_part.part_name} ({self.ordered_quantity})"


class GoodsReceipt(models.Model):
    grn_number = models.CharField(max_length=50, unique=True, db_index=True)
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.PROTECT,
        related_name="goods_receipts"
    )
    received_date = models.DateTimeField(auto_now_add=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="goods_received"
    )
    remarks = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.grn_number:
            last_grn = GoodsReceipt.objects.order_by("-id").first()
            last_id = last_grn.id if last_grn else 0
            self.grn_number = f"GRN-{last_id + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.grn_number} for {self.purchase_order.po_number}"


class GoodsReceiptItem(models.Model):
    goods_receipt = models.ForeignKey(
        GoodsReceipt,
        on_delete=models.CASCADE,
        related_name="items"
    )
    po_item = models.ForeignKey(
        PurchaseOrderItem,
        on_delete=models.PROTECT,
        related_name="grn_items"
    )
    received_quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.goods_receipt.grn_number} - {self.po_item.spare_part.part_name} ({self.received_quantity})"
