"""
URL configuration for Warehouse Spare Parts Management System.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("common.urls")),
    path("api/auth/", include("users.urls")),
    path("api/spare-parts/", include("spare_parts.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/suppliers/", include("suppliers.urls")),
    path("api/purchases/", include("purchases.urls")),
    path("api/warehouses/", include("warehouses.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
