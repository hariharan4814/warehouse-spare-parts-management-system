from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from audit_logs.models import AuditLog
from audit_logs.utils import log_action

User = get_user_model()


class AuditLogsAPITests(TestCase):

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

        log_action(self.tech, "PASSWORD_CHANGE", "AUTHENTICATION")

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_log_action_created(self):
        self.assertEqual(AuditLog.objects.count(), 1)
        log = AuditLog.objects.first()
        self.assertEqual(log.user, self.tech)
        self.assertEqual(log.action, "PASSWORD_CHANGE")

    def test_tech_cannot_read_audit_logs(self):
        headers = self.get_auth_headers(self.tech)
        url = reverse("auditlog-list")
        res = self.client.get(url, **headers)
        self.assertEqual(res.status_code, 403)

    def test_admin_can_read_audit_logs(self):
        headers = self.get_auth_headers(self.admin)
        url = reverse("auditlog-list")
        res = self.client.get(url, **headers)
        self.assertEqual(res.status_code, 200)

        data = res.json()
        if isinstance(data, dict) and "results" in data:
            self.assertEqual(len(data["results"]), 1)
            self.assertEqual(data["results"][0]["username"], "tech_user")
        else:
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["username"], "tech_user")
