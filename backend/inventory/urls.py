from django.urls import path, include
from rest_framework.routers import DefaultRouter
from inventory.views import (
    StockMovementViewSet,
    InventoryAdjustmentViewSet,
    InventoryPartViewSet,
)

router = DefaultRouter()
router.register("movements", StockMovementViewSet, basename="stockmovement")
router.register("adjustments", InventoryAdjustmentViewSet, basename="inventoryadjustment")
router.register("", InventoryPartViewSet, basename="inventory")

urlpatterns = [
    path("", include(router.urls)),
]
