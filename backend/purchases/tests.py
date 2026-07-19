import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from suppliers.models import Supplier, SupplierStatus
from spare_parts.models import SparePartCategory, StorageLocation, SparePart
from inventory.models import StockMovement
from purchases.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    GoodsReceipt,
)

User = get_user_model()


class PurchaseAPITests(TestCase):

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

        # Supplier
        self.supplier = Supplier.objects.create(
            supplier_code="SUP-0001",
            company_name="Apex Bearings Co",
            contact_person="Alice",
            email="alice@apex.com",
            phone="1112223333",
            address="100 Factory Rd",
            city="Industry",
            state="State",
            country="USA",
            postal_code="90000"
        )

        # Spare Part
        self.category = SparePartCategory.objects.create(name="Bearings", status="active")
        self.location = StorageLocation.objects.create(warehouse="Main", rack="R-1", shelf="S-1", bin="B-1")
        self.part = SparePart.objects.create(
            part_number="BRG-500",
            part_name="High Speed Bearing",
            category=self.category,
            cost_price=50.00,
            selling_price=75.00,
            minimum_stock=10,
            current_stock=20,
            maximum_stock=100,
            storage_location=self.location,
            created_by=self.admin
        )

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_po_lifecycle_and_goods_receipt(self):
        headers_admin = self.get_auth_headers(self.admin)
        headers_keeper = self.get_auth_headers(self.keeper)

        # 1. Create PO (Draft)
        url_create = reverse("purchaseorder-list")
        po_data = {
            "supplier_id": self.supplier.id,
            "remarks": "Urgent stock replenishment",
            "items": [
                {
                    "spare_part_id": self.part.id,
                    "ordered_quantity": 10,
                    "unit_price": "50.00"
                }
            ]
        }
        res = self.client.post(url_create, data=json.dumps(po_data), content_type="application/json", **headers_admin)
        self.assertEqual(res.status_code, 201)
        po_id = res.json()["id"]
        po = PurchaseOrder.objects.get(pk=po_id)
        self.assertEqual(po.status, PurchaseOrderStatus.DRAFT)
        self.assertEqual(po.total_amount, 500.00)

        # 2. Submit PO for approval
        url_submit = reverse("purchaseorder-submit-po", kwargs={"pk": po_id})
        res_sub = self.client.post(url_submit, **headers_admin)
        self.assertEqual(res_sub.status_code, 200)
        po.refresh_from_db()
        self.assertEqual(po.status, PurchaseOrderStatus.PENDING_APPROVAL)

        # 3. Store Keeper cannot approve PO
        url_approve = reverse("purchaseorder-approve-po", kwargs={"pk": po_id})
        res_app_keeper = self.client.post(url_approve, **headers_keeper)
        self.assertEqual(res_app_keeper.status_code, 403)

        # 4. Admin Approves PO
        res_app_admin = self.client.post(url_approve, **headers_admin)
        self.assertEqual(res_app_admin.status_code, 200)
        po.refresh_from_db()
        self.assertEqual(po.status, PurchaseOrderStatus.APPROVED)
        self.assertEqual(po.approved_by, self.admin)

        # 5. Goods Receipt (Partial - 4 items received)
        po_item = po.items.first()
        url_grn = reverse("goodsreceipt-list")
        grn_data_partial = {
            "purchase_order_id": po_id,
            "remarks": "First delivery batch",
            "receipt_items": [
                {
                    "po_item_id": po_item.id,
                    "received_quantity": 4
                }
            ]
        }
        res_grn1 = self.client.post(url_grn, data=json.dumps(grn_data_partial), content_type="application/json", **headers_keeper)
        self.assertEqual(res_grn1.status_code, 201)

        # Verify inventory increased (20 + 4 = 24)
        self.part.refresh_from_db()
        self.assertEqual(self.part.current_stock, 24)

        # Verify StockMovement created
        mov1 = StockMovement.objects.last()
        self.assertIsNotNone(mov1)
        self.assertEqual(mov1.movement_type, "STOCK_IN")
        self.assertEqual(mov1.reference_type, "PURCHASE")
        self.assertEqual(mov1.quantity, 4)

        # Verify PO status is PARTIALLY_RECEIVED
        po.refresh_from_db()
        self.assertEqual(po.status, PurchaseOrderStatus.PARTIALLY_RECEIVED)

        # 6. Goods Receipt (Remaining 6 items received)
        grn_data_final = {
            "purchase_order_id": po_id,
            "remarks": "Final delivery batch",
            "receipt_items": [
                {
                    "po_item_id": po_item.id,
                    "received_quantity": 6
                }
            ]
        }
        res_grn2 = self.client.post(url_grn, data=json.dumps(grn_data_final), content_type="application/json", **headers_keeper)
        self.assertEqual(res_grn2.status_code, 201)

        # Verify inventory increased (24 + 6 = 30)
        self.part.refresh_from_db()
        self.assertEqual(self.part.current_stock, 30)

        # Verify PO status is COMPLETED
        po.refresh_from_db()
        self.assertEqual(po.status, PurchaseOrderStatus.COMPLETED)
