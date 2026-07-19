from django.urls import path
from reports.views import (
    ReportsDashboardView,
    InventoryReportView,
    PurchaseReportView,
    WarehouseReportView,
    WorkOrderReportView,
    StockMovementReportView,
)

urlpatterns = [
    path("dashboard/", ReportsDashboardView.as_view(), name="reports-dashboard"),
    path("inventory/", InventoryReportView.as_view(), name="reports-inventory"),
    path("purchases/", PurchaseReportView.as_view(), name="reports-purchases"),
    path("warehouses/", WarehouseReportView.as_view(), name="reports-warehouses"),
    path("work-orders/", WorkOrderReportView.as_view(), name="reports-work-orders"),
    path("stock-movements/", StockMovementReportView.as_view(), name="reports-stock-movements"),
]
