import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from spare_parts.models import SparePartCategory, StorageLocation, SparePart
from warehouses.models import Warehouse, WarehouseInventory, WarehouseStatus
from suppliers.models import Supplier
from purchases.models import PurchaseOrder
from issue_return.models import WorkOrder, WorkOrderItem, WorkOrderPriority, WorkOrderStatus

User = get_user_model()


class ReportsAPITests(TestCase):

    def setUp(self):
        self.client = Client()

        # Users
        self.admin = User.objects.create_user(
            username="admin_user",
            password="password123",
            email="admin@example.com",
            employee_id="EMP-ADM",
            role="ADMIN"
        )

        # Warehouse
        self.warehouse = Warehouse.objects.create(
            warehouse_code="WH-0001",
            name="Main Central Hub",
            address="100 Logistics Blvd",
            city="Metropolis",
            state="State",
            country="USA",
            postal_code="12345",
            status=WarehouseStatus.ACTIVE
        )

        # Supplier
        self.supplier = Supplier.objects.create(
            supplier_code="SUP-0001",
            company_name="Acme Industrial",
            contact_person="John Acme",
            email="john@acme.com",
            phone="1234567890",
            address="123 Industrial Pkwy",
            city="Metropolis",
            state="State",
            country="USA",
            postal_code="12345"
        )

        # Spare Part
        self.category = SparePartCategory.objects.create(name="Pneumatic", status="active")
        self.location = StorageLocation.objects.create(warehouse="Main Central Hub", rack="R-1", shelf="S-1", bin="B-1")
        self.part = SparePart.objects.create(
            part_number="PN-100",
            part_name="Air Cylinder 50mm",
            category=self.category,
            cost_price=100.00,
            selling_price=150.00,
            minimum_stock=10,
            current_stock=20,
            maximum_stock=100,
            storage_location=self.location,
            created_by=self.admin
        )

        self.wh_inv = WarehouseInventory.objects.create(
            warehouse=self.warehouse,
            spare_part=self.part,
            current_stock=20,
            minimum_stock=10,
            maximum_stock=100
        )

        # PO & WO
        self.po = PurchaseOrder.objects.create(
            supplier=self.supplier,
            order_date="2026-07-19",
            status="APPROVED",
            total_amount=2000.00,
            created_by=self.admin
        )

        self.wo = WorkOrder.objects.create(
            title="Overhaul Pneumatic Valve",
            priority=WorkOrderPriority.HIGH,
            created_by=self.admin,
            status=WorkOrderStatus.OPEN
        )

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_reports_dashboard_view(self):
        headers = self.get_auth_headers(self.admin)
        url = reverse("reports-dashboard")
        res = self.client.get(url, **headers)
        self.assertEqual(res.status_code, 200)

        data = res.json()
        self.assertEqual(data["total_spare_parts"], 1)
        self.assertEqual(data["total_warehouses"], 1)
        self.assertEqual(data["total_suppliers"], 1)
        self.assertEqual(data["total_inventory_value"], 2000.0)

    def test_inventory_report_view(self):
        headers = self.get_auth_headers(self.admin)
        url = reverse("reports-inventory")
        res = self.client.get(url, **headers)
        self.assertEqual(res.status_code, 200)

        data = res.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["part_number"], "PN-100")
        self.assertEqual(data["results"][0]["valuation"], 2000.0)

    def test_purchase_report_view(self):
        headers = self.get_auth_headers(self.admin)
        url = reverse("reports-purchases")
        res = self.client.get(url, **headers)
        self.assertEqual(res.status_code, 200)

        data = res.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["total_spend"], 2000.0)
        self.assertEqual(data["results"][0]["supplier_name"], "Acme Industrial")
