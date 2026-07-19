from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "employee_id",
            "phone_number",
            "designation",
            "department",
            "profile_picture",
            "role",
            "is_active_employee",
            "last_login",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Inject custom claims into the token
        token["username"] = user.username
        token["role"] = user.role
        token["employee_id"] = user.employee_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add profile info to the API response payload
        data["user"] = UserSerializer(self.user).data
        return data
