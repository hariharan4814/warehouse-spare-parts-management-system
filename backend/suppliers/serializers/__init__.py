from rest_framework import serializers
from suppliers.models import Supplier, SupplierStatus


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id",
            "supplier_code",
            "company_name",
            "contact_person",
            "email",
            "phone",
            "address",
            "city",
            "state",
            "country",
            "postal_code",
            "gst_number",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["supplier_code", "created_at", "updated_at"]

    def create(self, validated_data):
        if not validated_data.get("supplier_code"):
            last_supplier = Supplier.objects.order_by("-id").first()
            last_id = last_supplier.id if last_supplier else 0
            validated_data["supplier_code"] = f"SUP-{last_id + 1:04d}"
        return super().create(validated_data)
