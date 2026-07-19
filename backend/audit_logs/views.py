from rest_framework import viewsets, permissions
from audit_logs.models import AuditLog
from audit_logs.serializers import AuditLogSerializer


class DenyAll(permissions.BasePermission):
    def has_permission(self, request, view):
        return False


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user").order_by("-timestamp")
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.user and self.request.user.role == "ADMIN":
            return [permissions.IsAuthenticated()]
        return [DenyAll()]
