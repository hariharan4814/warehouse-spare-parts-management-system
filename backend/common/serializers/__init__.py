from rest_framework import serializers
from common.models import SystemSetting


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = [
            "company_name",
            "company_logo",
            "warehouse_address",
            "default_currency",
            "low_stock_threshold",
            "system_time_zone",
            "theme_settings",
        ]
