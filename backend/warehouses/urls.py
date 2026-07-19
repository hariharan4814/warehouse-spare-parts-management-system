from django.urls import path, include
from rest_framework.routers import DefaultRouter
from warehouses.views import (
    WarehouseViewSet,
    WarehouseInventoryViewSet,
    StockTransferViewSet,
)

router = DefaultRouter()
router.register("transfers", StockTransferViewSet, basename="stocktransfer")
router.register("inventory", WarehouseInventoryViewSet, basename="warehouseinventory")
router.register("", WarehouseViewSet, basename="warehouse")

urlpatterns = [
    path("", include(router.urls)),
]
