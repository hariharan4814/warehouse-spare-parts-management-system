from django.db import models


class SupplierStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"


class Supplier(models.Model):
    supplier_code = models.CharField(max_length=50, unique=True, db_index=True)
    company_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    gst_number = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=SupplierStatus.choices,
        default=SupplierStatus.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.supplier_code:
            last_supplier = Supplier.objects.order_by("-id").first()
            last_id = last_supplier.id if last_supplier else 0
            self.supplier_code = f"SUP-{last_id + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.company_name} ({self.supplier_code})"
