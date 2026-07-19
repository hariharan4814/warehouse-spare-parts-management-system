from django.utils import timezone
from django.db import models
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from issue_return.models import (
    WorkOrder,
    WorkOrderItem,
    IssueTransaction,
    IssueTransactionItem,
    WorkOrderPriority,
    WorkOrderStatus,
)
from issue_return.serializers import (
    WorkOrderSerializer,
    IssueTransactionSerializer,
    IssueTransactionCreateSerializer,
)


class WorkOrderPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER", "TECHNICIAN"]


class IssueTransactionPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"]


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all().order_by("-created_at")
    serializer_class = WorkOrderSerializer
    permission_classes = [permissions.IsAuthenticated, WorkOrderPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "priority", "assigned_technician"]
    search_fields = ["work_order_number", "title", "description", "equipment_name", "location"]
    ordering_fields = ["work_order_number", "priority", "created_at"]

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        open_count = WorkOrder.objects.filter(status=WorkOrderStatus.OPEN).count()
        in_progress_count = WorkOrder.objects.filter(status=WorkOrderStatus.IN_PROGRESS).count()
        completed_count = WorkOrder.objects.filter(status=WorkOrderStatus.COMPLETED).count()
        total_issues = IssueTransaction.objects.count()

        recent_wo = WorkOrder.objects.all().order_by("-created_at")[:5]
        recent_wo_serializer = WorkOrderSerializer(recent_wo, many=True)

        recent_issues = IssueTransaction.objects.all().order_by("-issued_at")[:5]
        recent_issues_serializer = IssueTransactionSerializer(recent_issues, many=True)

        return Response({
            "open_work_orders": open_count,
            "in_progress_work_orders": in_progress_count,
            "completed_work_orders": completed_count,
            "total_issue_transactions": total_issues,
            "recent_work_orders": recent_wo_serializer.data,
            "recent_issues": recent_issues_serializer.data,
        })


class IssueTransactionViewSet(viewsets.ModelViewSet):
    queryset = IssueTransaction.objects.all().order_by("-issued_at")
    permission_classes = [permissions.IsAuthenticated, IssueTransactionPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["work_order", "warehouse", "issued_by"]
    search_fields = ["issue_number", "work_order__work_order_number", "warehouse__name", "remarks"]
    ordering_fields = ["issue_number", "issued_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return IssueTransactionCreateSerializer
        return IssueTransactionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        issue_tx = serializer.save()

        read_serializer = IssueTransactionSerializer(issue_tx, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
