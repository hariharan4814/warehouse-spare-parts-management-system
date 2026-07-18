from django.db import models
from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from spare_parts.models import SparePartCategory, StorageLocation, SparePart
from spare_parts.serializers import (
    SparePartCategorySerializer,
    StorageLocationSerializer,
    SparePartSerializer,
)
from spare_parts.permissions import IsSparePartPermission


class SparePartCategoryViewSet(viewsets.ModelViewSet):
    queryset = SparePartCategory.objects.none()
    serializer_class = SparePartCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsSparePartPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        from spare_parts.utils import seed_data
        if not SparePartCategory.objects.exists():
            seed_data()
        return SparePartCategory.objects.all().order_by("name")


class StorageLocationViewSet(viewsets.ModelViewSet):
    queryset = StorageLocation.objects.none()
    serializer_class = StorageLocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSparePartPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["warehouse", "rack", "shelf", "bin"]
    search_fields = ["warehouse", "rack", "shelf", "bin"]
    ordering_fields = ["warehouse", "rack", "shelf", "bin"]

    def get_queryset(self):
        from spare_parts.utils import seed_data
        if not StorageLocation.objects.exists():
            seed_data()
        return StorageLocation.objects.all().order_by("warehouse", "rack", "shelf", "bin")


class SparePartViewSet(viewsets.ModelViewSet):
    queryset = SparePart.objects.all().order_by("part_number")
    serializer_class = SparePartSerializer
    permission_classes = [permissions.IsAuthenticated, IsSparePartPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "storage_location", "status", "brand", "manufacturer"]
    search_fields = [
        "part_number",
        "part_name",
        "manufacturer",
        "brand",
        "storage_location__warehouse",
        "category__name",
    ]
    ordering_fields = [
        "part_number",
        "part_name",
        "cost_price",
        "selling_price",
        "current_stock",
        "created_at",
    ]

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(
            updated_by=self.request.user
        )

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        """
        Returns a list of spare parts whose current stock is less than or equal to their minimum stock.
        """
        queryset = self.get_queryset().filter(current_stock__lte=models.F("minimum_stock"))
        
        # Apply filters, search and ordering if present in request params
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="out-of-stock")
    def out_of_stock(self, request):
        """
        Returns a list of spare parts whose current stock level is zero.
        """
        queryset = self.get_queryset().filter(current_stock=0)
        
        # Apply filters, search and ordering if present in request params
        queryset = self.filter_queryset(queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
