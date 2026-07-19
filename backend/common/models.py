from django.db import models


class SystemSetting(models.Model):
    company_name = models.CharField(max_length=200, default="WSPMS ERP Enterprise Systems")
    company_logo = models.FileField(upload_to="settings/", null=True, blank=True)
    warehouse_address = models.TextField(blank=True, null=True)
    default_currency = models.CharField(max_length=10, default="USD")
    low_stock_threshold = models.PositiveIntegerField(default=10)
    system_time_zone = models.CharField(max_length=100, default="UTC")
    theme_settings = models.JSONField(default=dict, blank=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"System Setting: {self.company_name}"
