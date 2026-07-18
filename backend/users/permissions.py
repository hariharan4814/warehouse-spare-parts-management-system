from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Allows access only to Admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsWarehouseManager(permissions.BasePermission):
    """
    Allows access to Warehouse Managers and Admins.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "WAREHOUSE_MANAGER"]
        )


class IsStoreKeeper(permissions.BasePermission):
    """
    Allows access to Store Keepers and Admins.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "STORE_KEEPER"]
        )


class IsTechnician(permissions.BasePermission):
    """
    Allows access only to Technicians and Admins.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "TECHNICIAN"]
        )
