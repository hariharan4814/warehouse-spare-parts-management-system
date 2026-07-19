from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash

from .serializers import CustomTokenObtainPairSerializer, UserSerializer
from audit_logs.utils import log_action


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Returns custom JSON response with access token, refresh token, and user profile data.
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        res = super().post(request, *args, **kwargs)
        if res.status_code == 200:
            # Login action audit logging
            try:
                username = request.data.get("username")
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.filter(username=username).first()
                if user:
                    log_action(user, "LOGIN", "AUTHENTICATION")
            except Exception:
                pass
        return res


class CustomTokenRefreshView(TokenRefreshView):
    """
    Standard refresh view subclass for consistency.
    """

    pass


class LogoutView(APIView):
    """
    Logs out user by blacklisting the provided refresh token.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            log_action(request.user, "LOGOUT", "AUTHENTICATION")
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProfileView(APIView):
    """
    Returns or updates profile information for the authenticated user.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        old_data = UserSerializer(user).data
        serializer = UserSerializer(user, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            new_data = UserSerializer(user).data
            log_action(user, "UPDATE", "USER_PROFILE", old_value=old_data, new_value=new_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Changes password for the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "Both old_password and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {"detail": "Incorrect old password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)  # Keep user logged in
        log_action(user, "PASSWORD_CHANGE", "AUTHENTICATION")
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
