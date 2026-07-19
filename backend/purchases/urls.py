from django.urls import path, include
from rest_framework.routers import DefaultRouter
from purchases.views import PurchaseOrderViewSet, GoodsReceiptViewSet

router = DefaultRouter()
router.register("orders", PurchaseOrderViewSet, basename="purchaseorder")
router.register("goods-receipts", GoodsReceiptViewSet, basename="goodsreceipt")

urlpatterns = [
    path("", include(router.urls)),
]
