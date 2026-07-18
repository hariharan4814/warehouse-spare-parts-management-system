from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = [
        "username",
        "email",
        "employee_id",
        "role",
        "is_active_employee",
        "is_staff",
    ]
    list_filter = ["role", "is_active_employee", "is_staff", "is_superuser"]
    fieldsets = UserAdmin.fieldsets + (
        (
            "Employee Information",
            {
                "fields": (
                    "employee_id",
                    "role",
                    "designation",
                    "department",
                    "phone_number",
                    "profile_picture",
                    "is_active_employee",
                )
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Employee Information",
            {
                "fields": (
                    "employee_id",
                    "role",
                    "designation",
                    "department",
                    "phone_number",
                    "profile_picture",
                    "is_active_employee",
                )
            },
        ),
    )


admin.site.register(User, CustomUserAdmin)
