from django.urls import path, include
from rest_framework.routers import DefaultRouter
from suppliers.views import SupplierViewSet

router = DefaultRouter()
router.register("", SupplierViewSet, basename="supplier")

urlpatterns = [
    path("", include(router.urls)),
]
