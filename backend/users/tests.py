import json
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse

User = get_user_model()


class AuthAPITests(TestCase):

    def setUp(self):
        self.client = Client()
        self.username = "testuser"
        self.password = "SecurePassword123"
        self.email = "testuser@example.com"
        self.employee_id = "EMP-001"
        self.role = "TECHNICIAN"

        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email,
            employee_id=self.employee_id,
            role=self.role,
        )

    def test_login_successful(self):
        url = reverse("auth-login")
        data = {"username": self.username, "password": self.password}
        response = self.client.post(
            url, data=json.dumps(data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertIn("access", response_data)
        self.assertIn("refresh", response_data)
        self.assertEqual(response_data["user"]["username"], self.username)
        self.assertEqual(response_data["user"]["role"], self.role)

    def test_login_invalid_credentials(self):
        url = reverse("auth-login")
        data = {"username": self.username, "password": "WrongPassword"}
        response = self.client.post(
            url, data=json.dumps(data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)

    def test_profile_endpoint_unauthenticated(self):
        url = reverse("auth-profile")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)

    def test_profile_endpoint_authenticated(self):
        # Obtain token
        login_url = reverse("auth-login")
        login_data = {"username": self.username, "password": self.password}
        login_response = self.client.post(
            login_url,
            data=json.dumps(login_data),
            content_type="application/json",
        )
        access_token = json.loads(login_response.content)["access"]

        # Call profile with authorization header
        url = reverse("auth-profile")
        response = self.client.get(
            url, HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )
        self.assertEqual(response.status_code, 200)

        profile_data = json.loads(response.content)
        self.assertEqual(profile_data["username"], self.username)
        self.assertEqual(profile_data["employee_id"], self.employee_id)
        self.assertEqual(profile_data["role"], self.role)

    def test_logout(self):
        # Obtain token
        login_url = reverse("auth-login")
        login_data = {"username": self.username, "password": self.password}
        login_response = self.client.post(
            login_url,
            data=json.dumps(login_data),
            content_type="application/json",
        )
        tokens = json.loads(login_response.content)
        access_token = tokens["access"]
        refresh_token = tokens["refresh"]

        # Call logout
        url = reverse("auth-logout")
        logout_data = {"refresh": refresh_token}
        response = self.client.post(
            url,
            data=json.dumps(logout_data),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content), {"detail": "Successfully logged out."}
        )

        # Confirm token is blacklisted by trying to refresh
        refresh_url = reverse("auth-refresh")
        refresh_response = self.client.post(
            refresh_url,
            data=json.dumps({"refresh": refresh_token}),
            content_type="application/json",
        )
        self.assertEqual(refresh_response.status_code, 401)
