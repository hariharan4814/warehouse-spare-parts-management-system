import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from common.models import SystemSetting

User = get_user_model()


class HealthCheckTests(TestCase):
    def test_health_check_endpoint(self):
        client = Client()
        url = reverse("health-check")
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("Content-Type"), "application/json")

        response_data = json.loads(response.content)
        self.assertEqual(
            response_data,
            {
                "status": "healthy",
                "project": "Warehouse Spare Parts Management System",
            },
        )


class SystemSettingsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin = User.objects.create_user(
            username="admin_user",
            password="password123",
            email="admin@example.com",
            employee_id="EMP-ADM",
            role="ADMIN"
        )
        self.tech = User.objects.create_user(
            username="tech_user",
            password="password123",
            email="tech@example.com",
            employee_id="EMP-TCH",
            role="TECHNICIAN"
        )

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_get_settings(self):
        headers = self.get_auth_headers(self.tech)
        url = reverse("system-settings")
        res = self.client.get(url, **headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["company_name"], "WSPMS ERP Enterprise Systems")

    def test_update_settings_denied_to_tech(self):
        headers = self.get_auth_headers(self.tech)
        url = reverse("system-settings")
        res = self.client.put(url, data=json.dumps({"company_name": "New Company Name"}), content_type="application/json", **headers)
        self.assertEqual(res.status_code, 403)

    def test_update_settings_allowed_for_admin(self):
        headers = self.get_auth_headers(self.admin)
        url = reverse("system-settings")
        res = self.client.put(url, data=json.dumps({"company_name": "Branded Systems Corp"}), content_type="application/json", **headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["company_name"], "Branded Systems Corp")
