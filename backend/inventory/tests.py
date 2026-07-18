import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from spare_parts.models import SparePartCategory, StorageLocation, SparePart
from inventory.models import StockMovement, InventoryAdjustment

User = get_user_model()


class InventoryAPITests(TestCase):

    def setUp(self):
        self.client = Client()

        # Create Category
        self.category = SparePartCategory.objects.create(
            name="Mechanical",
            description="Mechanical items",
            status="active"
        )

        # Create Location
        self.location = StorageLocation.objects.create(
            warehouse="Warehouse A",
            rack="R-01",
            shelf="S-02",
            bin="B-03"
        )

        # Create Users
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
        self.technician = User.objects.create_user(
            username="tech_user",
            password="password123",
            email="tech@example.com",
            employee_id="EMP-TCH",
            role="TECHNICIAN"
        )

        # Create Spare Part
        self.part = SparePart.objects.create(
            part_number="PN-100",
            part_name="Ball Bearing",
            category=self.category,
            manufacturer="SKF",
            brand="SKF Premium",
            unit_of_measure="Pcs",
            cost_price=10.00,
            selling_price=15.00,
            minimum_stock=5,
            current_stock=10,
            maximum_stock=50,
            storage_location=self.location,
            created_by=self.admin
        )

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_stock_in_success(self):
        url = reverse("stockmovement-list")
        data = {
            "spare_part_id": self.part.id,
            "movement_type": "STOCK_IN",
            "quantity": 5,
            "reason": "Purchase receipt",
            "reference_number": "PO-999"
        }
        headers = self.get_auth_headers(self.keeper)
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json",
            **headers
        )
        self.assertEqual(response.status_code, 201)
        
        # Verify part stock
        self.part.refresh_from_db()
        self.assertEqual(self.part.current_stock, 15)
        self.assertEqual(self.part.status, "active")

        # Verify movement logged
        movement = StockMovement.objects.last()
        self.assertIsNotNone(movement)
        self.assertEqual(movement.spare_part, self.part)
        self.assertEqual(movement.quantity, 5)
        self.assertEqual(movement.previous_stock, 10)
        self.assertEqual(movement.new_stock, 15)
        self.assertEqual(movement.performed_by, self.keeper)

    def test_stock_out_success(self):
        url = reverse("stockmovement-list")
        data = {
            "spare_part_id": self.part.id,
            "movement_type": "STOCK_OUT",
            "quantity": 6,
            "reason": "Maintenance issue"
        }
        headers = self.get_auth_headers(self.manager)
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json",
            **headers
        )
        self.assertEqual(response.status_code, 201)

        # Verify part stock and status updated to low_stock (current_stock 4 <= minimum_stock 5)
        self.part.refresh_from_db()
        self.assertEqual(self.part.current_stock, 4)
        self.assertEqual(self.part.status, "low_stock")

    def test_stock_out_negative_prevented(self):
        url = reverse("stockmovement-list")
        data = {
            "spare_part_id": self.part.id,
            "movement_type": "STOCK_OUT",
            "quantity": 12,
            "reason": "Exceeding stock"
        }
        headers = self.get_auth_headers(self.keeper)
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json",
            **headers
        )
        self.assertEqual(response.status_code, 400)
        
        # Verify stock unchanged
        self.part.refresh_from_db()
        self.assertEqual(self.part.current_stock, 10)

    def test_zero_or_negative_quantity_rejected(self):
        url = reverse("stockmovement-list")
        for qty in [0, -5]:
            data = {
                "spare_part_id": self.part.id,
                "movement_type": "STOCK_IN",
                "quantity": qty,
                "reason": "Invalid qty"
            }
            headers = self.get_auth_headers(self.keeper)
            response = self.client.post(
                url,
                data=json.dumps(data),
                content_type="application/json",
                **headers
            )
            self.assertEqual(response.status_code, 400)

    def test_adjustment_increase_success(self):
        url = reverse("inventoryadjustment-list")
        data = {
            "spare_part_id": self.part.id,
            "adjustment_type": "INCREASE",
            "quantity": 15,
            "reason": "Annual stock audit correction"
        }
        headers = self.get_auth_headers(self.manager)
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json",
            **headers
        )
        self.assertEqual(response.status_code, 201)

        # Verify stock and adjustment record
        self.part.refresh_from_db()
        self.assertEqual(self.part.current_stock, 25)

        adjustment = InventoryAdjustment.objects.last()
        self.assertIsNotNone(adjustment)
        self.assertEqual(adjustment.quantity, 15)
        self.assertEqual(adjustment.created_by, self.manager)

        # Verify corresponding StockMovement logged
        movement = StockMovement.objects.last()
        self.assertIsNotNone(movement)
        self.assertEqual(movement.movement_type, "STOCK_ADJUSTMENT")
        self.assertEqual(movement.quantity, 15)
        self.assertEqual(movement.previous_stock, 10)
        self.assertEqual(movement.new_stock, 25)

    def test_adjustment_decrease_negative_prevented(self):
        url = reverse("inventoryadjustment-list")
        data = {
            "spare_part_id": self.part.id,
            "adjustment_type": "DECREASE",
            "quantity": 11,
            "reason": "Too much reduction"
        }
        headers = self.get_auth_headers(self.manager)
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json",
            **headers
        )
        self.assertEqual(response.status_code, 400)

    def test_role_permissions(self):
        # 1. Technician cannot post movements
        url_mov = reverse("stockmovement-list")
        headers_tech = self.get_auth_headers(self.technician)
        data_mov = {
            "spare_part_id": self.part.id,
            "movement_type": "STOCK_IN",
            "quantity": 1,
            "reason": "Tech In"
        }
        response = self.client.post(
            url_mov,
            data=json.dumps(data_mov),
            content_type="application/json",
            **headers_tech
        )
        self.assertEqual(response.status_code, 403)

        # 2. Store Keeper cannot post adjustments
        url_adj = reverse("inventoryadjustment-list")
        headers_keeper = self.get_auth_headers(self.keeper)
        data_adj = {
            "spare_part_id": self.part.id,
            "adjustment_type": "INCREASE",
            "quantity": 2,
            "reason": "Keeper adjustment"
        }
        response = self.client.post(
            url_adj,
            data=json.dumps(data_adj),
            content_type="application/json",
            **headers_keeper
        )
        self.assertEqual(response.status_code, 403)

    def test_dashboard_endpoint(self):
        url = reverse("inventory-dashboard")
        headers = self.get_auth_headers(self.technician)
        response = self.client.get(url, **headers)
        self.assertEqual(response.status_code, 200)
        
        content = json.loads(response.content)
        self.assertIn("summary", content)
        self.assertIn("recent_transactions", content)
        self.assertIn("movement_summary", content)
        self.assertIn("low_stock_items", content)

        summary = content["summary"]
        self.assertEqual(summary["total_items"], 1)
        self.assertEqual(summary["total_stock"], 10)
        self.assertEqual(float(summary["total_value"]), 100.0) # 10 stock * 10 cost_price
