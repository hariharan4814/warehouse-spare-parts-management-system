from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from common.models import SystemSetting
from common.serializers import SystemSettingSerializer
from audit_logs.utils import log_action


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response(
        {
            "status": "healthy",
            "project": "Warehouse Spare Parts Management System",
        }
    )


class SystemSettingView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated()]  # Admin constraint will be checked in the view logic for PUT

    def get_object(self):
        obj, created = SystemSetting.objects.get_or_create(pk=1)
        return obj

    def get(self, request):
        obj = self.get_object()
        serializer = SystemSettingSerializer(obj, context={"request": request})
        return Response(serializer.data)

    def put(self, request):
        if request.user.role != "ADMIN":
            return Response({"detail": "Only Admins can modify system settings."}, status=status.HTTP_403_FORBIDDEN)

        obj = self.get_object()
        old_value = {
            "company_name": obj.company_name,
            "default_currency": obj.default_currency,
            "low_stock_threshold": obj.low_stock_threshold,
            "system_time_zone": obj.system_time_zone,
        }

        serializer = SystemSettingSerializer(obj, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            new_value = {
                "company_name": obj.company_name,
                "default_currency": obj.default_currency,
                "low_stock_threshold": obj.low_stock_threshold,
                "system_time_zone": obj.system_time_zone,
            }
            log_action(
                user=request.user,
                action="UPDATE",
                module="SYSTEM_SETTINGS",
                old_value=old_value,
                new_value=new_value
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
