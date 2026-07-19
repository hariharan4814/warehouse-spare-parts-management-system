from django.db import models
from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from spare_parts.models import SparePart
from spare_parts.serializers import SparePartSerializer
from inventory.models import StockMovement, StockMovementType, InventoryAdjustment
from inventory.serializers import (
    StockMovementSerializer,
    InventoryAdjustmentSerializer,
)


class StockMovementPermission(permissions.BasePermission):
    """
    Admin, Warehouse Manager, Store Keeper can write (create).
    Technicians can only read (safe methods).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"]


class InventoryAdjustmentPermission(permissions.BasePermission):
    """
    Admin, Warehouse Manager can write (create).
    Store Keeper and Technician can only read (safe methods).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER"]


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by("-created_at")
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated, StockMovementPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["movement_type", "spare_part", "reference_type"]
    search_fields = [
        "spare_part__part_name",
        "spare_part__part_number",
        "reference_number",
        "reason",
    ]
    ordering_fields = ["created_at", "quantity"]

    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)


class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = InventoryAdjustment.objects.all().order_by("-created_at")
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated, InventoryAdjustmentPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["adjustment_type", "spare_part"]
    search_fields = ["spare_part__part_name", "spare_part__part_number", "reason"]
    ordering_fields = ["created_at", "quantity"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class InventoryPartViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides current, low stock, out of stock, dashboard metrics,
    and summary actions for the spare parts.
    """
    queryset = SparePart.objects.all().order_by("part_number")
    serializer_class = SparePartSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "storage_location", "status", "brand", "manufacturer"]
    search_fields = ["part_number", "part_name", "manufacturer", "brand"]
    ordering_fields = ["part_number", "part_name", "current_stock", "created_at"]

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        queryset = self.filter_queryset(
            SparePart.objects.filter(
                current_stock__lte=models.F("minimum_stock")
            ).order_by("part_number")
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="out-of-stock")
    def out_of_stock(self, request):
        queryset = self.filter_queryset(
            SparePart.objects.filter(current_stock=0).order_by("part_number")
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="current")
    def current(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        total_items = SparePart.objects.count()
        total_stock = SparePart.objects.aggregate(total=models.Sum("current_stock"))["total"] or 0
        total_value = SparePart.objects.annotate(
            item_value=models.ExpressionWrapper(
                models.F("current_stock") * models.F("cost_price"),
                output_field=models.DecimalField()
            )
        ).aggregate(total=models.Sum("item_value"))["total"] or 0
        low_stock_count = SparePart.objects.filter(
            current_stock__lte=models.F("minimum_stock")
        ).count()
        out_of_stock_count = SparePart.objects.filter(current_stock=0).count()

        return Response({
            "total_items": total_items,
            "total_stock": total_stock,
            "total_value": total_value,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
        })

    @action(detail=False, methods=["get"], url_path="recent-transactions")
    def recent_transactions(self, request):
        recent = StockMovement.objects.all().order_by("-created_at")[:10]
        serializer = StockMovementSerializer(recent, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        total_items = SparePart.objects.count()
        total_stock = SparePart.objects.aggregate(total=models.Sum("current_stock"))["total"] or 0
        total_value = SparePart.objects.annotate(
            item_value=models.ExpressionWrapper(
                models.F("current_stock") * models.F("cost_price"),
                output_field=models.DecimalField()
            )
        ).aggregate(total=models.Sum("item_value"))["total"] or 0
        low_stock_count = SparePart.objects.filter(
            current_stock__lte=models.F("minimum_stock")
        ).count()
        out_of_stock_count = SparePart.objects.filter(current_stock=0).count()

        recent_movements = StockMovement.objects.all().order_by("-created_at")[:10]
        recent_serializer = StockMovementSerializer(recent_movements, many=True)

        movement_counts = StockMovement.objects.values("movement_type").annotate(count=models.Count("id"))
        movement_summary = {item["movement_type"]: item["count"] for item in movement_counts}

        low_stock_parts = SparePart.objects.filter(
            current_stock__lte=models.F("minimum_stock")
        ).order_by("current_stock")[:5]
        low_stock_serializer = SparePartSerializer(low_stock_parts, many=True)

        return Response({
            "summary": {
                "total_items": total_items,
                "total_stock": total_stock,
                "total_value": total_value,
                "low_stock_count": low_stock_count,
                "out_of_stock_count": out_of_stock_count,
            },
            "recent_transactions": recent_serializer.data,
            "movement_summary": movement_summary,
            "low_stock_items": low_stock_serializer.data,
        })
