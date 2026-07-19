from django.urls import path, include
from rest_framework.routers import DefaultRouter
from issue_return.views import WorkOrderViewSet, IssueTransactionViewSet

router = DefaultRouter()
router.register("work-orders", WorkOrderViewSet, basename="workorder")
router.register("issue-transactions", IssueTransactionViewSet, basename="issuetransaction")

urlpatterns = [
    path("", include(router.urls)),
]
