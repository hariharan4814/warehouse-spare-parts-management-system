import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from suppliers.models import Supplier, SupplierStatus

User = get_user_model()


class SupplierAPITests(TestCase):

    def setUp(self):
        self.client = Client()

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
        self.tech = User.objects.create_user(
            username="tech_user",
            password="password123",
            email="tech@example.com",
            employee_id="EMP-TCH",
            role="TECHNICIAN"
        )

        self.supplier = Supplier.objects.create(
            supplier_code="SUP-0001",
            company_name="Acme Industrial",
            contact_person="John Doe",
            email="john@acme.com",
            phone="1234567890",
            address="123 Industrial Park",
            city="Techville",
            state="State",
            country="USA",
            postal_code="12345",
            gst_number="GST12345",
            status=SupplierStatus.ACTIVE
        )

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_list_suppliers(self):
        url = reverse("supplier-list")
        headers = self.get_auth_headers(self.tech)
        response = self.client.get(url, **headers)
        self.assertEqual(response.status_code, 200)

    def test_create_supplier_admin_success(self):
        url = reverse("supplier-list")
        data = {
            "company_name": "Global Parts Ltd",
            "contact_person": "Jane Smith",
            "email": "jane@globalparts.com",
            "phone": "9876543210",
            "address": "456 Logistics Way",
            "city": "Metro",
            "state": "State",
            "country": "USA",
            "postal_code": "54321",
            "status": "ACTIVE"
        }
        headers = self.get_auth_headers(self.admin)
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json",
            **headers
        )
        self.assertEqual(response.status_code, 201)
        res_data = response.json()
        self.assertTrue(res_data["supplier_code"].startswith("SUP-"))

    def test_create_supplier_tech_forbidden(self):
        url = reverse("supplier-list")
        data = {
            "company_name": "Forbidden Supplier",
            "contact_person": "Nobody",
            "email": "no@supplier.com",
            "phone": "000",
            "address": "Addr",
            "city": "City",
            "state": "State",
            "country": "Country",
            "postal_code": "00000"
        }
        headers = self.get_auth_headers(self.tech)
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json",
            **headers
        )
        self.assertEqual(response.status_code, 403)
