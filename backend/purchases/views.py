from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from purchases.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    GoodsReceipt,
)
from purchases.serializers import (
    PurchaseOrderSerializer,
    PurchaseOrderItemSerializer,
    GoodsReceiptSerializer,
    GoodsReceiptCreateSerializer,
)


class PurchaseOrderPermission(permissions.BasePermission):
    """
    Admin & Warehouse Manager can create, update, approve, cancel.
    Store Keeper & Technician can view (SAFE_METHODS).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER"]


class GoodsReceiptPermission(permissions.BasePermission):
    """
    Admin, Warehouse Manager, Store Keeper can create Goods Receipts.
    Technician can only view.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"]


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by("-created_at")
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated, PurchaseOrderPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "supplier"]
    search_fields = ["po_number", "supplier__company_name", "supplier__supplier_code", "remarks"]
    ordering_fields = ["po_number", "order_date", "total_amount", "created_at"]

    @action(detail=True, methods=["post"], url_path="submit")
    def submit_po(self, request, pk=None):
        po = self.get_object()
        if po.status != PurchaseOrderStatus.DRAFT:
            return Response(
                {"detail": f"Cannot submit PO in '{po.status}' status. Must be DRAFT."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not po.items.exists():
            return Response(
                {"detail": "Cannot submit Purchase Order without line items."},
                status=status.HTTP_400_BAD_REQUEST
            )
        po.status = PurchaseOrderStatus.PENDING_APPROVAL
        po.save()
        return Response(self.get_serializer(po).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve_po(self, request, pk=None):
        po = self.get_object()
        if po.status not in [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING_APPROVAL]:
            return Response(
                {"detail": f"Cannot approve PO in '{po.status}' status."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not po.items.exists():
            return Response(
                {"detail": "Cannot approve Purchase Order without line items."},
                status=status.HTTP_400_BAD_REQUEST
            )
        po.status = PurchaseOrderStatus.APPROVED
        po.approved_by = request.user
        po.approved_at = timezone.now()
        po.save()
        return Response(self.get_serializer(po).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_po(self, request, pk=None):
        po = self.get_object()
        if po.status in [PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.CANCELLED]:
            return Response(
                {"detail": f"Cannot cancel PO in '{po.status}' status."},
                status=status.HTTP_400_BAD_REQUEST
            )
        po.status = PurchaseOrderStatus.CANCELLED
        po.save()
        return Response(self.get_serializer(po).data)

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        pending_count = PurchaseOrder.objects.filter(status=PurchaseOrderStatus.PENDING_APPROVAL).count()
        approved_count = PurchaseOrder.objects.filter(status=PurchaseOrderStatus.APPROVED).count()
        completed_count = PurchaseOrder.objects.filter(status=PurchaseOrderStatus.COMPLETED).count()
        draft_count = PurchaseOrder.objects.filter(status=PurchaseOrderStatus.DRAFT).count()
        partially_received_count = PurchaseOrder.objects.filter(status=PurchaseOrderStatus.PARTIALLY_RECEIVED).count()

        recent_receipts = GoodsReceipt.objects.all().order_by("-received_date")[:5]
        receipts_serializer = GoodsReceiptSerializer(recent_receipts, many=True)

        return Response({
            "pending_count": pending_count,
            "approved_count": approved_count,
            "completed_count": completed_count,
            "draft_count": draft_count,
            "partially_received_count": partially_received_count,
            "recent_receipts": receipts_serializer.data,
        })


class GoodsReceiptViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceipt.objects.all().order_by("-received_date")
    permission_classes = [permissions.IsAuthenticated, GoodsReceiptPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["purchase_order"]
    search_fields = ["grn_number", "purchase_order__po_number", "remarks"]
    ordering_fields = ["received_date", "grn_number"]

    def get_serializer_class(self):
        if self.action == "create":
            return GoodsReceiptCreateSerializer
        return GoodsReceiptSerializer
