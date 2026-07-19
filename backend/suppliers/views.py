from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from suppliers.models import Supplier, SupplierStatus
from suppliers.serializers import SupplierSerializer


class SupplierPermission(permissions.BasePermission):
    """
    Admin & Warehouse Manager can write.
    Store Keeper & Technician can view (SAFE_METHODS).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "WAREHOUSE_MANAGER"]


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("-created_at")
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, SupplierPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "city", "state", "country"]
    search_fields = [
        "supplier_code",
        "company_name",
        "contact_person",
        "email",
        "phone",
        "city",
    ]
    ordering_fields = ["supplier_code", "company_name", "created_at"]

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        total_suppliers = Supplier.objects.count()
        active_suppliers = Supplier.objects.filter(status=SupplierStatus.ACTIVE).count()
        inactive_suppliers = Supplier.objects.filter(status=SupplierStatus.INACTIVE).count()

        return Response({
            "total_suppliers": total_suppliers,
            "active_suppliers": active_suppliers,
            "inactive_suppliers": inactive_suppliers,
        })
