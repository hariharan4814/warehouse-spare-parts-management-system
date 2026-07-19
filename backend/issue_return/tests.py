import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from issue_return.models import (
    WorkOrder,
    WorkOrderItem,
    IssueTransaction,
    IssueTransactionItem,
    WorkOrderPriority,
    WorkOrderStatus,
)
from spare_parts.models import SparePartCategory, StorageLocation, SparePart
from warehouses.models import Warehouse, WarehouseInventory, WarehouseStatus
from inventory.models import StockMovement

User = get_user_model()


class WorkOrderAPITests(TestCase):

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
        self.manager = User.objects.create_user(
            username="manager_user",
            password="password123",
            email="manager@example.com",
            employee_id="EMP-MGR",
            role="WAREHOUSE_MANAGER"
        )
        self.keeper = User.objects.create_user(
            username="keeper_user",
            password="password123",
            email="keeper@example.com",
            employee_id="EMP-KPR",
            role="STORE_KEEPER"
        )
        self.tech = User.objects.create_user(
            username="tech_user",
            password="password123",
            email="tech@example.com",
            employee_id="EMP-TCH",
            role="TECHNICIAN"
        )

        # Warehouse
        self.warehouse = Warehouse.objects.create(
            warehouse_code="WH-0001",
            name="Main Facility",
            address="100 Main St",
            city="Metropolis",
            state="State",
            country="USA",
            postal_code="12345",
            status=WarehouseStatus.ACTIVE
        )

        # Spare Part & Warehouse Inventory
        self.category = SparePartCategory.objects.create(name="Mechanical", status="active")
        self.location = StorageLocation.objects.create(warehouse="Main Facility", rack="R-1", shelf="S-1", bin="B-1")
        self.part = SparePart.objects.create(
            part_number="FLT-200",
            part_name="Oil Filter Heavy Duty",
            category=self.category,
            cost_price=15.00,
            selling_price=25.00,
            minimum_stock=5,
            current_stock=30,
            maximum_stock=100,
            storage_location=self.location,
            created_by=self.admin
        )

        self.wh_inv = WarehouseInventory.objects.create(
            warehouse=self.warehouse,
            spare_part=self.part,
            current_stock=30,
            minimum_stock=5,
            maximum_stock=100
        )

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_create_work_order_as_technician(self):
        headers = self.get_auth_headers(self.tech)
        url = reverse("workorder-list")

        data = {
            "title": "Replace Hydraulic Filters",
            "description": "Routine 500-hour maintenance",
            "priority": "HIGH",
            "equipment_name": "Excavator EX-90",
            "location": "Bay 3",
            "assigned_technician_id": self.tech.id,
            "items": [
                {
                    "spare_part_id": self.part.id,
                    "requested_quantity": 5
                }
            ]
        }
        res = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(res.status_code, 201)

        wo_data = res.json()
        self.assertTrue(wo_data["work_order_number"].startswith("WO-"))
        self.assertEqual(wo_data["status"], "OPEN")
        self.assertEqual(len(wo_data["items"]), 1)
        self.assertEqual(wo_data["items"][0]["requested_quantity"], 5)
        self.assertEqual(wo_data["items"][0]["issued_quantity"], 0)

    def test_issue_parts_partial_and_full(self):
        # 1. Create Work Order
        wo = WorkOrder.objects.create(
            title="Pump Overhaul",
            priority=WorkOrderPriority.CRITICAL,
            assigned_technician=self.tech,
            created_by=self.tech,
            status=WorkOrderStatus.OPEN
        )
        wo_item = WorkOrderItem.objects.create(
            work_order=wo,
            spare_part=self.part,
            requested_quantity=10,
            issued_quantity=0
        )

        headers_keeper = self.get_auth_headers(self.keeper)
        url_issue = reverse("issuetransaction-list")

        # 2. Issue 4 units (Partial Issuance)
        issue_data = {
            "work_order_id": wo.id,
            "warehouse_id": self.warehouse.id,
            "remarks": "First batch of parts issued",
            "items": [
                {
                    "spare_part_id": self.part.id,
                    "quantity": 4
                }
            ]
        }
        res = self.client.post(url_issue, data=json.dumps(issue_data), content_type="application/json", **headers_keeper)
        self.assertEqual(res.status_code, 201)

        # Verify stock deductions (30 - 4 = 26)
        self.part.refresh_from_db()
        self.wh_inv.refresh_from_db()
        self.assertEqual(self.part.current_stock, 26)
        self.assertEqual(self.wh_inv.current_stock, 26)

        # Verify WorkOrderItem issued_quantity updated
        wo_item.refresh_from_db()
        self.assertEqual(wo_item.issued_quantity, 4)

        # Verify WorkOrder status updated to IN_PROGRESS
        wo.refresh_from_db()
        self.assertEqual(wo.status, WorkOrderStatus.IN_PROGRESS)

        # Verify StockMovement entry created
        movements = StockMovement.objects.filter(reference_number=res.json()["issue_number"])
        self.assertEqual(movements.count(), 1)
        self.assertEqual(movements.first().quantity, 4)

        # 3. Issue remaining 6 units (Full Issuance)
        issue_data_2 = {
            "work_order_id": wo.id,
            "warehouse_id": self.warehouse.id,
            "remarks": "Final batch issued",
            "items": [
                {
                    "spare_part_id": self.part.id,
                    "quantity": 6
                }
            ]
        }
        res2 = self.client.post(url_issue, data=json.dumps(issue_data_2), content_type="application/json", **headers_keeper)
        self.assertEqual(res2.status_code, 201)

        # Verify stock deductions (26 - 6 = 20)
        self.part.refresh_from_db()
        self.assertEqual(self.part.current_stock, 20)

        # Verify WorkOrder status completed
        wo.refresh_from_db()
        self.assertEqual(wo.status, WorkOrderStatus.COMPLETED)
        self.assertIsNotNone(wo.completed_at)

    def test_issue_parts_exceeds_stock_rejected(self):
        wo = WorkOrder.objects.create(
            title="Overstock Request",
            created_by=self.tech,
            status=WorkOrderStatus.OPEN
        )
        WorkOrderItem.objects.create(
            work_order=wo,
            spare_part=self.part,
            requested_quantity=50,
            issued_quantity=0
        )

        headers = self.get_auth_headers(self.manager)
        url = reverse("issuetransaction-list")

        # Request to issue 40 units when available stock is 30
        data = {
            "work_order_id": wo.id,
            "warehouse_id": self.warehouse.id,
            "items": [
                {
                    "spare_part_id": self.part.id,
                    "quantity": 40
                }
            ]
        }
        res = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(res.status_code, 400)
