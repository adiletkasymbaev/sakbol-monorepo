from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, permissions
from django.contrib.auth import get_user_model

from .models import Profile
from .serializers import AvatarUpdateSerializer, ProfileDetailSerializer, RegistrationSerializer, EmailTokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema

User = get_user_model()

@extend_schema(
    request=RegistrationSerializer,
    responses={
        201: {
            "type": "object",
            "properties": {
                "refresh": {"type": "string", "description": "JWT refresh token"},
                "access": {"type": "string", "description": "JWT access token"},
                "user_id": {"type": "integer", "description": "ID созданного пользователя"},
                "email": {"type": "string", "format": "email", "description": "Email пользователя"}
            }
        }
    },
    description="""
Регистрация нового пользователя.

**Входные данные (multipart/json):**
- `email` (string, required) — email пользователя
- `password` (string, required) — пароль
- `first_name` (string, required) — имя
- `last_name` (string, required) — фамилия
- `birth_date` (string, required) — дата рождения в формате YYYY-MM-DD
- `phone_number` (string, required) — телефон в международном формате
- `city` (string, required)
- `street` (string, required)
- `house_number` (string, required)
- `apartment_number` (string, optional)
- `med_info` (string, optional)
- `role` (string, optional) — роль пользователя
"""
)
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user_id": user.pk,
            "email": user.email,
            "role": user.role
        }
        return Response(data, status=status.HTTP_201_CREATED)

@extend_schema(
    request=EmailTokenObtainPairSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "refresh": {"type": "string", "description": "JWT refresh token"},
                "access": {"type": "string", "description": "JWT access token"},
                "user_id": {"type": "integer", "description": "ID созданного пользователя"},
                "email": {"type": "string", "format": "email", "description": "Email пользователя"},
                "role": {"type": "string", "description": "Роль пользователя"}
            }
        }
    },
    description="""
Авторизация пользователя по email и паролю.

**Входные данные:**
- `email` (string, required) — email пользователя
- `password` (string, required) — пароль

**Выходные данные:**
- `access` — access token
- `refresh` — refresh token
- `user_id` — ID пользователя
- `email` — email пользователя
- `role` — роль пользователя
"""
)
class EmailLoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

@extend_schema(
    request=AvatarUpdateSerializer,
    responses={200: ProfileDetailSerializer},
    description="""
Обновление аватара пользователя.

**Входные данные (multipart/form-data):**
- `user_id` (integer, required) — ID пользователя
- `avatar` (file, required) — файл аватара

**Выходные данные:**
- `id` (integer)
- `user` (object):
    - `id` (integer)
    - `email` (string)
    - `first_name` (string)
    - `last_name` (string)
- `avatar` (string, URL до аватара)
- `created_at`, `updated_at` (string, datetime)
"""
)
class AvatarUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = AvatarUpdateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        target_user_id = serializer.validated_data['user_id']
        if not (request.user.is_staff or request.user.pk == target_user_id):
            return Response({"detail": "Нет прав"}, status=status.HTTP_403_FORBIDDEN)

        profile = serializer.save()
        out = ProfileDetailSerializer(profile, context={'request': request})
        return Response(out.data, status=status.HTTP_200_OK)

@extend_schema(
    responses={
        200: {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "user": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "email": {"type": "string", "format": "email"},
                        "first_name": {"type": "string"},
                        "last_name": {"type": "string"},
                    }
                },
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
                "birth_date": {"type": "string", "format": "date"},
                "city": {"type": "string", "nullable": True},
                "street": {"type": "string", "nullable": True},
                "house_number": {"type": "string", "nullable": True},
                "apartment_number": {"type": "string", "nullable": True},
                "med_info": {"type": "string", "nullable": True},
                "role": {"type": "string"},
                "is_online": {"type": "boolean"},
                "last_seen": {"type": "string", "format": "date-time", "nullable": True},
                "identifier": {"type": "string", "nullable": True},
                "avatar": {"type": "string", "format": "uri", "nullable": True},
                "phone_number": {"type": "string", "nullable": True},
            }
        }
    },
    description="Детальная информация о профиле пользователя"
)
class ProfileDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id=None, *args, **kwargs):
        if user_id in (None, 'me'):
            user = request.user
        else:
            user = get_object_or_404(User, pk=user_id)

        profile, _ = Profile.objects.get_or_create(user=user)
        serializer = ProfileDetailSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)