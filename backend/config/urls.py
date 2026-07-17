"""
URL configuration for Warehouse Spare Parts Management System.
"""

from django.contrib import admin
from django.urls import path

urlpatterns = [
    path("admin/", admin.site.urls),
]
