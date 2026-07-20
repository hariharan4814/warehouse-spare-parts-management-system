from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Creates or updates demo users for project demonstrations and placements."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding demo users..."))

        demo_users_data = [
            {
                "username": "Admin",
                "email": "admin@example.com",
                "password": "Admin@123",
                "role": "ADMIN",
                "is_superuser": True,
                "is_staff": True,
                "employee_id": "EMP-001",
                "designation": "System Administrator",
                "department": "IT Operations",
            },
            {
                "username": "warehousemanager",
                "email": "warehousemanager@example.com",
                "password": "WarehouseManager@123",
                "role": "WAREHOUSE_MANAGER",
                "is_superuser": False,
                "is_staff": True,
                "employee_id": "EMP-002",
                "designation": "Warehouse Manager",
                "department": "Logistics & Warehousing",
            },
            {
                "username": "storekeeper",
                "email": "storekeeper@example.com",
                "password": "Storekeeper@123",
                "role": "STORE_KEEPER",
                "is_superuser": False,
                "is_staff": False,
                "employee_id": "EMP-003",
                "designation": "Head Storekeeper",
                "department": "Inventory Management",
            },
            {
                "username": "technician",
                "email": "technician@example.com",
                "password": "Technician@123",
                "role": "TECHNICIAN",
                "is_superuser": False,
                "is_staff": False,
                "employee_id": "EMP-004",
                "designation": "Maintenance Technician",
                "department": "Plant Maintenance",
            },
        ]

        for u_data in demo_users_data:
            username = u_data["username"]
            password = u_data.pop("password")
            
            # Lookup user case-insensitively to prevent duplicates
            user = User.objects.filter(username__iexact=username).first()

            if user:
                # Update existing user credentials and attributes
                user.username = username
                user.email = u_data["email"]
                user.role = u_data["role"]
                user.is_superuser = u_data["is_superuser"]
                user.is_staff = u_data["is_staff"]
                user.is_active = True
                user.is_active_employee = True
                user.employee_id = u_data["employee_id"]
                user.designation = u_data["designation"]
                user.department = u_data["department"]
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[UPDATED] User '{username}' ({u_data['role']}) updated successfully."
                    )
                )
            else:
                # Create new user
                user = User.objects.create_user(
                    username=username,
                    email=u_data["email"],
                    password=password,
                    role=u_data["role"],
                    is_superuser=u_data["is_superuser"],
                    is_staff=u_data["is_staff"],
                    is_active=True,
                    is_active_employee=True,
                    employee_id=u_data["employee_id"],
                    designation=u_data["designation"],
                    department=u_data["department"],
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[CREATED] User '{username}' ({u_data['role']}) created successfully."
                    )
                )

        self.stdout.write(self.style.SUCCESS("All demo users seeded successfully!"))
