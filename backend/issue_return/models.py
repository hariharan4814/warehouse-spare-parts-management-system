from django.db import models
from django.conf import settings
from spare_parts.models import SparePart
from warehouses.models import Warehouse


class WorkOrderPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class WorkOrderStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class WorkOrder(models.Model):
    work_order_number = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(
        max_length=20,
        choices=WorkOrderPriority.choices,
        default=WorkOrderPriority.MEDIUM
    )
    status = models.CharField(
        max_length=20,
        choices=WorkOrderStatus.choices,
        default=WorkOrderStatus.OPEN
    )
    equipment_name = models.CharField(max_length=200, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    assigned_technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_work_orders"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_work_orders"
    )
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.work_order_number:
            last_wo = WorkOrder.objects.order_by("-id").first()
            last_id = last_wo.id if last_wo else 0
            self.work_order_number = f"WO-{last_id + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.work_order_number}: {self.title} ({self.status})"


class WorkOrderItem(models.Model):
    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name="items"
    )
    spare_part = models.ForeignKey(
        SparePart,
        on_delete=models.PROTECT,
        related_name="work_order_items"
    )
    requested_quantity = models.PositiveIntegerField()
    issued_quantity = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.work_order.work_order_number} - {self.spare_part.part_name}: {self.issued_quantity}/{self.requested_quantity}"


class IssueTransaction(models.Model):
    issue_number = models.CharField(max_length=50, unique=True, db_index=True)
    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.PROTECT,
        related_name="issue_transactions"
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="issue_transactions"
    )
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="issued_transactions"
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.issue_number:
            last_iss = IssueTransaction.objects.order_by("-id").first()
            last_id = last_iss.id if last_iss else 0
            self.issue_number = f"ISS-{last_id + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.issue_number} (WO #{self.work_order.work_order_number})"


class IssueTransactionItem(models.Model):
    issue_transaction = models.ForeignKey(
        IssueTransaction,
        on_delete=models.CASCADE,
        related_name="items"
    )
    spare_part = models.ForeignKey(
        SparePart,
        on_delete=models.PROTECT,
        related_name="issue_items"
    )
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.issue_transaction.issue_number} - {self.spare_part.part_name} ({self.quantity})"
