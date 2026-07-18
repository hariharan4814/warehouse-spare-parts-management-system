from django.urls import path, include
from rest_framework.routers import DefaultRouter
from spare_parts.views import (
    SparePartCategoryViewSet,
    StorageLocationViewSet,
    SparePartViewSet,
)

router = DefaultRouter()
router.register(r"categories", SparePartCategoryViewSet, basename="category")
router.register(r"locations", StorageLocationViewSet, basename="location")
router.register(r"parts", SparePartViewSet, basename="spare-part")

urlpatterns = [
    path("", include(router.urls)),
]
