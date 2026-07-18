from rest_framework import permissions

class IsSparePartPermission(permissions.BasePermission):
    """
    Enforces authorization limits across roles:
    - Admin: Full CRUD
    - Warehouse Manager: View, Create, Edit. No Delete.
    - Store Keeper: View, Update stock only (enforced in serializer/view). No Create. No Delete.
    - Technician: View only (GET/HEAD/OPTIONS).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = request.user.role

        # Admin has full CRUD
        if role == "ADMIN":
            return True

        # Warehouse Manager can read and edit (GET, POST, PUT, PATCH), no DELETE
        if role == "WAREHOUSE_MANAGER":
            return request.method in ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH"]

        # Store Keeper can read and perform updates (GET, PUT, PATCH), no POST, no DELETE
        if role == "STORE_KEEPER":
            return request.method in ["GET", "HEAD", "OPTIONS", "PUT", "PATCH"]

        # Technician can only perform safe/read-only operations
        if role == "TECHNICIAN":
            return request.method in permissions.SAFE_METHODS

        return False
