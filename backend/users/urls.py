from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    UserProfileView,
)

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="auth-login"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("profile/", UserProfileView.as_view(), name="auth-profile"),
]

