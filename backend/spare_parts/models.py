from django.db import models
from django.conf import settings

class SparePartCategory(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default="active") # active, inactive
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Spare Part Categories"

    def __str__(self):
        return self.name


class StorageLocation(models.Model):
    warehouse = models.CharField(max_length=255)
    rack = models.CharField(max_length=100)
    shelf = models.CharField(max_length=100)
    bin = models.CharField(max_length=100)

    class Meta:
        unique_together = ("warehouse", "rack", "shelf", "bin")

    def __str__(self):
        return f"{self.warehouse} - Rack {self.rack}, Shelf {self.shelf}, Bin {self.bin}"


class SparePartQuerySet(models.QuerySet):
    def delete(self):
        return self.update(is_deleted=True)


class SparePartManager(models.Manager):
    def get_queryset(self):
        return SparePartQuerySet(self.model, using=self._db).filter(is_deleted=False)


class SparePart(models.Model):
    part_number = models.CharField(max_length=100, unique=True)
    part_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(
        SparePartCategory,
        on_delete=models.PROTECT,
        related_name="parts"
    )
    manufacturer = models.CharField(max_length=255)
    brand = models.CharField(max_length=255)
    unit_of_measure = models.CharField(max_length=50) # e.g. Pcs, Box, Set
    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    minimum_stock = models.PositiveIntegerField()
    current_stock = models.PositiveIntegerField()
    maximum_stock = models.PositiveIntegerField()
    storage_location = models.ForeignKey(
        StorageLocation,
        on_delete=models.PROTECT,
        related_name="parts"
    )
    barcode = models.CharField(max_length=100, blank=True, null=True)
    qr_code = models.CharField(max_length=100, blank=True, null=True)
    image = models.ImageField(upload_to="parts/", blank=True, null=True)
    status = models.CharField(max_length=50, default="active") # active, inactive, low_stock, out_of_stock
    is_deleted = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="parts_created"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="parts_updated"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SparePartManager()
    all_objects = models.Manager()

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.save(update_fields=["is_deleted"])

    def __str__(self):
        return f"{self.part_name} ({self.part_number})"
