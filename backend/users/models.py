from django.contrib.auth.models import AbstractUser
from django.db import models


class RoleChoices(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER", "Warehouse Manager"
    STORE_KEEPER = "STORE_KEEPER", "Store Keeper"
    TECHNICIAN = "TECHNICIAN", "Technician"


class User(AbstractUser):
    employee_id = models.CharField(max_length=50, unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    profile_picture = models.FileField(upload_to="profile_pictures/", blank=True, null=True)
    role = models.CharField(
        max_length=25,
        choices=RoleChoices.choices,
        default=RoleChoices.TECHNICIAN,
    )
    is_active_employee = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS = ["email", "employee_id"]

    def save(self, *args, **kwargs):
        if self.is_superuser and not self.role:
            self.role = RoleChoices.ADMIN
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
