from django.utils import timezone
from django.db import transaction, models
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from warehouses.models import (
    Warehouse,
    WarehouseInventory,
    StockTransfer,
    StockTransferItem,
    TransferStatus,
    WarehouseStatus,
)
from warehouses.serializers import (
    WarehouseSerializer,
    WarehouseInventorySerializer,
    StockTransferSerializer,
)
from spare_parts.models import SparePart
from inventory.models import StockMovement, StockMovementType, ReferenceType


class WarehousePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER"]


class StockTransferPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        # Complete action allowed for Store Keeper as well
        if view.action in ["complete", "complete_transfer"]:
            return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"]
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER"]


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all().order_by("-created_at")
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated, WarehousePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "city", "state", "country"]
    search_fields = ["warehouse_code", "name", "city", "address", "description"]
    ordering_fields = ["warehouse_code", "name", "created_at"]

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        total_warehouses = Warehouse.objects.count()
        total_inventory_records = WarehouseInventory.objects.count()
        total_stock_units = WarehouseInventory.objects.aggregate(total=models.Sum("current_stock"))["total"] or 0
        pending_transfers = StockTransfer.objects.filter(status=TransferStatus.PENDING).count()
        completed_transfers = StockTransfer.objects.filter(status=TransferStatus.COMPLETED).count()
        low_stock_count = WarehouseInventory.objects.filter(current_stock__lte=models.F("minimum_stock")).count()

        recent_transfers = StockTransfer.objects.all().order_by("-created_at")[:5]
        recent_serializer = StockTransferSerializer(recent_transfers, many=True)

        return Response({
            "total_warehouses": total_warehouses,
            "total_inventory_records": total_inventory_records,
            "total_stock_units": total_stock_units,
            "pending_transfers": pending_transfers,
            "completed_transfers": completed_transfers,
            "low_stock_count": low_stock_count,
            "recent_transfers": recent_serializer.data,
        })


class WarehouseInventoryViewSet(viewsets.ModelViewSet):
    queryset = WarehouseInventory.objects.all().order_by("-updated_at")
    serializer_class = WarehouseInventorySerializer
    permission_classes = [permissions.IsAuthenticated, WarehousePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["warehouse", "spare_part"]
    search_fields = ["spare_part__part_name", "spare_part__part_number", "warehouse__name"]
    ordering_fields = ["current_stock", "updated_at"]


class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.all().order_by("-created_at")
    serializer_class = StockTransferSerializer
    permission_classes = [permissions.IsAuthenticated, StockTransferPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "source_warehouse", "destination_warehouse"]
    search_fields = [
        "transfer_number",
        "source_warehouse__name",
        "destination_warehouse__name",
        "remarks",
    ]
    ordering_fields = ["transfer_number", "created_at"]

    @action(detail=True, methods=["post"], url_path="submit")
    def submit_transfer(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != TransferStatus.DRAFT:
            return Response(
                {"detail": f"Cannot submit transfer in '{transfer.status}' status."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not transfer.items.exists():
            return Response(
                {"detail": "Cannot submit transfer without line items."},
                status=status.HTTP_400_BAD_REQUEST
            )
        transfer.status = TransferStatus.PENDING
        transfer.save()
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve_transfer(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status not in [TransferStatus.DRAFT, TransferStatus.PENDING]:
            return Response(
                {"detail": f"Cannot approve transfer in '{transfer.status}' status."},
                status=status.HTTP_400_BAD_REQUEST
            )
        transfer.status = TransferStatus.APPROVED
        transfer.approved_by = request.user
        transfer.save()
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=["post"], url_path="complete")
    @transaction.atomic
    def complete_transfer(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != TransferStatus.APPROVED:
            return Response(
                {"detail": f"Cannot complete transfer in '{transfer.status}' status. Transfer must be APPROVED first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        source_wh = transfer.source_warehouse
        dest_wh = transfer.destination_warehouse

        for item in transfer.items.all():
            part = SparePart.objects.select_for_update().get(pk=item.spare_part.pk)
            qty = item.quantity

            # 1. Deduct stock from source warehouse inventory
            source_inv, _ = WarehouseInventory.objects.select_for_update().get_or_create(
                warehouse=source_wh,
                spare_part=part,
                defaults={"current_stock": part.current_stock}
            )

            if source_inv.current_stock < qty:
                return Response(
                    {"detail": f"Insufficient stock for '{part.part_name}' at {source_wh.name}. Available: {source_inv.current_stock}, Requested: {qty}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            prev_source_stock = source_inv.current_stock
            source_inv.current_stock -= qty
            source_inv.save()

            # 2. Add stock to destination warehouse inventory
            dest_inv, _ = WarehouseInventory.objects.select_for_update().get_or_create(
                warehouse=dest_wh,
                spare_part=part,
                defaults={"current_stock": 0}
            )
            prev_dest_stock = dest_inv.current_stock
            dest_inv.current_stock += qty
            dest_inv.save()

            # 3. Create StockMovement Audit Logs for both source and destination
            StockMovement.objects.create(
                spare_part=part,
                movement_type=StockMovementType.STOCK_TRANSFER,
                quantity=qty,
                previous_stock=prev_source_stock,
                new_stock=source_inv.current_stock,
                reference_type=ReferenceType.TRANSFER,
                reference_number=transfer.transfer_number,
                reason=f"Stock Transfer OUT from {source_wh.name} to {dest_wh.name} (TRF #{transfer.transfer_number})",
                performed_by=request.user
            )

            StockMovement.objects.create(
                spare_part=part,
                movement_type=StockMovementType.STOCK_TRANSFER,
                quantity=qty,
                previous_stock=prev_dest_stock,
                new_stock=dest_inv.current_stock,
                reference_type=ReferenceType.TRANSFER,
                reference_number=transfer.transfer_number,
                reason=f"Stock Transfer IN from {source_wh.name} to {dest_wh.name} (TRF #{transfer.transfer_number})",
                performed_by=request.user
            )

        transfer.status = TransferStatus.COMPLETED
        transfer.completed_at = timezone.now()
        transfer.save()

        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_transfer(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status in [TransferStatus.COMPLETED, TransferStatus.CANCELLED]:
            return Response(
                {"detail": f"Cannot cancel transfer in '{transfer.status}' status."},
                status=status.HTTP_400_BAD_REQUEST
            )
        transfer.status = TransferStatus.CANCELLED
        transfer.save()
        return Response(self.get_serializer(transfer).data)
