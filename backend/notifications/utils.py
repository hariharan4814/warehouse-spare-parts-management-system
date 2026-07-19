from notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()


def notify_user(user, title, message, notification_type="INFO"):
    if user:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type
        )


def notify_managers_and_admins(title, message, notification_type="INFO"):
    users = User.objects.filter(role__in=["ADMIN", "WAREHOUSE_MANAGER"])
    for u in users:
        notify_user(u, title, message, notification_type)
