import json
from django.test import TestCase, Client
from django.urls import reverse


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

