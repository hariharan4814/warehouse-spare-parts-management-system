import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from spare_parts.models import SparePartCategory, StorageLocation, SparePart

User = get_user_model()


class SparePartAPITests(TestCase):

    def setUp(self):
        self.client = Client()

        # Create Categories
        self.category = SparePartCategory.objects.create(
            name="Mechanical",
            description="Mechanical items",
            status="active"
        )
        self.category_2 = SparePartCategory.objects.create(
            name="Electrical",
            description="Electrical items",
            status="active"
        )

        # Create Locations
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

    def test_view_list_authenticated_all_roles(self):
        url = reverse("spare-part-list")
        for user in [self.admin, self.manager, self.keeper, self.technician]:
            headers = self.get_auth_headers(user)
            response = self.client.get(url, **headers)
            self.assertEqual(response.status_code, 200, f"Failed for {user.role}")

    def test_create_spare_part_permissions(self):
        url = reverse("spare-part-list")
        data = {
            "part_number": "PN-200",
            "part_name": "Spark Plug",
            "category_id": self.category_2.id,
            "manufacturer": "NGK",
            "brand": "NGK Iridium",
            "unit_of_measure": "Pcs",
            "cost_price": 5.50,
            "minimum_stock": 10,
            "current_stock": 20,
            "maximum_stock": 100,
            "storage_location_id": self.location.id,
        }

        # Admin can create
        headers = self.get_auth_headers(self.admin)
        response = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 201)

        # Manager can create
        data["part_number"] = "PN-201"
        headers = self.get_auth_headers(self.manager)
        response = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 201)

        # Store Keeper cannot create
        data["part_number"] = "PN-202"
        headers = self.get_auth_headers(self.keeper)
        response = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 403)

        # Technician cannot create
        data["part_number"] = "PN-203"
        headers = self.get_auth_headers(self.technician)
        response = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 403)

    def test_delete_permissions_soft_delete(self):
        # Admin can delete (soft delete check)
        url = reverse("spare-part-detail", args=[self.part.id])
        headers = self.get_auth_headers(self.admin)
        response = self.client.delete(url, **headers)
        self.assertEqual(response.status_code, 204)
        
        # Verify soft delete
        part_db = SparePart.all_objects.get(id=self.part.id)
        self.assertTrue(part_db.is_deleted)
        self.assertFalse(SparePart.objects.filter(id=self.part.id).exists())

        # Create another part for manager test
        part2 = SparePart.objects.create(
            part_number="PN-102",
            part_name="Gasket",
            category=self.category,
            manufacturer="Acura",
            brand="OEM",
            unit_of_measure="Pcs",
            cost_price=12.00,
            minimum_stock=2,
            current_stock=5,
            maximum_stock=10,
            storage_location=self.location
        )
        # Manager cannot delete
        url = reverse("spare-part-detail", args=[part2.id])
        headers = self.get_auth_headers(self.manager)
        response = self.client.delete(url, **headers)
        self.assertEqual(response.status_code, 403)

    def test_store_keeper_can_only_update_stock(self):
        url = reverse("spare-part-detail", args=[self.part.id])
        headers = self.get_auth_headers(self.keeper)

        # Update stock count only - should succeed
        data = {
            "part_number": self.part.part_number,
            "part_name": self.part.part_name,
            "category_id": self.category.id,
            "manufacturer": self.part.manufacturer,
            "brand": self.part.brand,
            "unit_of_measure": self.part.unit_of_measure,
            "cost_price": float(self.part.cost_price),
            "minimum_stock": self.part.minimum_stock,
            "current_stock": 25,  # Changed from 10
            "maximum_stock": self.part.maximum_stock,
            "storage_location_id": self.location.id,
        }
        response = self.client.put(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["current_stock"], 25)

        # Try updating brand name - should fail validation
        data["brand"] = "Fakes"
        response = self.client.put(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 400)

    def test_validation_stock_levels_and_prices(self):
        url = reverse("spare-part-list")
        headers = self.get_auth_headers(self.admin)

        # Negative price
        data = {
            "part_number": "PN-301",
            "part_name": "Connector",
            "category_id": self.category.id,
            "manufacturer": "Generic",
            "brand": "Generic",
            "unit_of_measure": "Pcs",
            "cost_price": -2.00,  # Negative
            "minimum_stock": 5,
            "current_stock": 10,
            "maximum_stock": 50,
            "storage_location_id": self.location.id,
        }
        response = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("cost_price", json.loads(response.content))

        # Min stock exceeds Max stock
        data["cost_price"] = 1.00
        data["minimum_stock"] = 60  # > max_stock (50)
        response = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("minimum_stock", json.loads(response.content))

        # Current stock exceeds Max stock
        data["minimum_stock"] = 5
        data["current_stock"] = 70  # > max_stock (50)
        response = self.client.post(url, data=json.dumps(data), content_type="application/json", **headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("current_stock", json.loads(response.content))

    def test_custom_stock_endpoints(self):
        # Create an out-of-stock part
        SparePart.objects.create(
            part_number="PN-OUT",
            part_name="Zero Gear",
            category=self.category,
            manufacturer="Generic",
            brand="OEM",
            unit_of_measure="Pcs",
            cost_price=5.00,
            minimum_stock=5,
            current_stock=0,  # Out of stock
            maximum_stock=10,
            storage_location=self.location
        )
        
        # Create a low-stock part
        SparePart.objects.create(
            part_number="PN-LOW",
            part_name="Tight Spring",
            category=self.category,
            manufacturer="Generic",
            brand="OEM",
            unit_of_measure="Pcs",
            cost_price=5.00,
            minimum_stock=5,
            current_stock=3,  # <= 5
            maximum_stock=10,
            storage_location=self.location
        )

        headers = self.get_auth_headers(self.admin)

        # Test low-stock endpoint
        url = reverse("spare-part-low-stock")
        response = self.client.get(url, **headers)
        self.assertEqual(response.status_code, 200)
        results = json.loads(response.content)["results"]
        # PN-LOW is low stock, PN-OUT is out of stock (0 <= 5, so it is also low stock by definition)
        self.assertEqual(len(results), 2)

        # Test out-of-stock endpoint
        url = reverse("spare-part-out-of-stock")
        response = self.client.get(url, **headers)
        self.assertEqual(response.status_code, 200)
        results = json.loads(response.content)["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["part_number"], "PN-OUT")
