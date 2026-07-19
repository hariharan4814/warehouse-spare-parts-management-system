from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from notifications.models import Notification

User = get_user_model()


class NotificationsAPITests(TestCase):

    def setUp(self):
        self.client = Client()

        self.user = User.objects.create_user(
            username="tech_user",
            password="password123",
            email="tech@example.com",
            employee_id="EMP-TCH",
            role="TECHNICIAN"
        )

        self.notif1 = Notification.objects.create(
            user=self.user,
            title="Low Stock Alert",
            message="Item Air Cylinder is low on stock",
            notification_type="WARNING"
        )

        self.notif2 = Notification.objects.create(
            user=self.user,
            title="Work Order Assigned",
            message="WO-0001 has been assigned to you",
            notification_type="INFO"
        )

    def get_auth_headers(self, user):
        token = AccessToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_list_notifications(self):
        headers = self.get_auth_headers(self.user)
        url = reverse("notification-list")
        res = self.client.get(url, **headers)
        self.assertEqual(res.status_code, 200)
        # Handle paginated response
        data = res.json()
        if isinstance(data, dict) and "results" in data:
            self.assertEqual(len(data["results"]), 2)
        else:
            self.assertEqual(len(data), 2)

    def test_mark_read(self):
        headers = self.get_auth_headers(self.user)
        url = reverse("notification-mark-read", kwargs={"pk": self.notif1.pk})
        res = self.client.post(url, **headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["is_read"])

    def test_mark_all_read(self):
        headers = self.get_auth_headers(self.user)
        url = reverse("notification-mark-all-read")
        res = self.client.post(url, **headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Notification.objects.filter(user=self.user, is_read=False).count(), 0)

    def test_unread_count(self):
        headers = self.get_auth_headers(self.user)
        url = reverse("notification-unread-count")
        res = self.client.get(url, **headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["unread_count"], 2)
