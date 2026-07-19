from audit_logs.models import AuditLog


def log_action(user, action, module, ip_address=None, old_value=None, new_value=None):
    AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        module=module,
        ip_address=ip_address,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
    )
