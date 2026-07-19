import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from warehouses.models import (
    Warehouse,
    WarehouseInventory,
    StockTransfer,
    StockTransferItem,
    TransferStatus,
    WarehouseStatus,
)
from spare_parts.models import SparePartCategory, StorageLocation, SparePart
from inventory.models import StockMovement

User = get_user_model()


class WarehouseAPITests(TestCase):

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

        # Warehouses
        self.source_wh = Warehouse.objects.create(
            warehouse_code="WH-0001",
            name="North Hub",
            description="Main North Warehouse",
            address="100 North Rd",
            city="Northville",
            state="State",
            country="USA",
            postal_code="11111",
            status=WarehouseStatus.ACTIVE
        )
        self.dest_wh = Warehouse.objects.create(
            warehouse_code="WH-0002",
            name="South Depot",
            description="South Depot Warehouse",
            address="200 South Rd",
            city="Southville",
            state="State",
            country="USA",
            postal_code="22222",
            status=WarehouseStatus.ACTIVE
        )

        # Spare Part & Warehouse Inventory
        self.category = SparePartCategory.objects.create(name="Electrical", status="active")
        self.location = StorageLocation.objects.create(warehouse="North Hub", rack="R-1", shelf="S-1", bin="B-1")
        self.part = SparePart.objects.create(
            part_number="FUS-100",
            part_name="10A Fuse",
            category=self.category,
            cost_price=5.00,
            selling_price=10.00,
            minimum_stock=10,
            current_stock=50,
            maximum_stock=500,
            storage_location=self.location,
            created_by=self.admin
        )

        self.source_inv = WarehouseInventory.objects.create(
            warehouse=self.source_wh,
            spare_part=self.part,
            current_stock=40,
            minimum_stock=5,
            maximum_stock=200
        )

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_warehouse_crud(self):
        headers = self.get_auth_headers(self.admin)
        url = reverse("warehouse-list")

        # Create
        data = {
            "name": "East Plant Warehouse",
            "description": "East region facility",
            "address": "300 East Ave",
            "city": "Eastport",
            "state": "State",
            "country": "USA",
            "postal_code": "33333"
        }
        res = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.json()["warehouse_code"].startswith("WH-"))

    def test_self_transfer_rejected(self):
        headers = self.get_auth_headers(self.manager)
        url = reverse("stocktransfer-list")

        data = {
            "source_warehouse_id": self.source_wh.id,
            "destination_warehouse_id": self.source_wh.id,
            "remarks": "Invalid self-transfer",
            "items": [
                {
                    "spare_part_id": self.part.id,
                    "quantity": 5
                }
            ]
        }
        res = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(res.status_code, 400)

    def test_stock_transfer_lifecycle(self):
        headers_mgr = self.get_auth_headers(self.manager)
        headers_keeper = self.get_auth_headers(self.keeper)

        # 1. Create Stock Transfer
        url_create = reverse("stocktransfer-list")
        trf_data = {
            "source_warehouse_id": self.source_wh.id,
            "destination_warehouse_id": self.dest_wh.id,
            "remarks": "Inter-branch transfer of fuses",
            "items": [
                {
                    "spare_part_id": self.part.id,
                    "quantity": 15
                }
            ]
        }
        res = self.client.post(url_create, data=json.dumps(trf_data), content_type="application/json", **headers_mgr)
        self.assertEqual(res.status_code, 201)
        trf_id = res.json()["id"]

        trf = StockTransfer.objects.get(pk=trf_id)
        self.assertEqual(trf.status, TransferStatus.DRAFT)

        # 2. Submit Transfer
        url_submit = reverse("stocktransfer-submit-transfer", kwargs={"pk": trf_id})
        res_sub = self.client.post(url_submit, **headers_mgr)
        self.assertEqual(res_sub.status_code, 200)

        # 3. Approve Transfer
        url_approve = reverse("stocktransfer-approve-transfer", kwargs={"pk": trf_id})
        res_app = self.client.post(url_approve, **headers_mgr)
        self.assertEqual(res_app.status_code, 200)

        # 4. Complete Transfer as Store Keeper
        url_complete = reverse("stocktransfer-complete-transfer", kwargs={"pk": trf_id})
        res_comp = self.client.post(url_complete, **headers_keeper)
        self.assertEqual(res_comp.status_code, 200)

        # Verify source warehouse inventory decreased (40 - 15 = 25)
        self.source_inv.refresh_from_db()
        self.assertEqual(self.source_inv.current_stock, 25)

        # Verify destination warehouse inventory created/increased (0 + 15 = 15)
        dest_inv = WarehouseInventory.objects.get(warehouse=self.dest_wh, spare_part=self.part)
        self.assertEqual(dest_inv.current_stock, 15)

        # Verify 2 StockMovement entries were logged
        movements = StockMovement.objects.filter(reference_number=trf.transfer_number)
        self.assertEqual(movements.count(), 2)

        # Verify status COMPLETED
        trf.refresh_from_db()
        self.assertEqual(trf.status, TransferStatus.COMPLETED)
