from rest_framework import serializers
from audit_logs.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "username",
            "user_email",
            "action",
            "module",
            "timestamp",
            "ip_address",
            "old_value",
            "new_value",
        ]
