from django.db import transaction
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import serializers

from sos.models import Location
from .models import Profile, EmailVerificationCode, ActionOTP
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.conf import settings
from shared.enums import ProfileRole
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from gov.serializers import ServiceSerializer as GovServiceSerializer
from gov.serializers import ServicePointSerializer as GovServicePointSerializer

User = get_user_model()

class RegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    # Поля profile
    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=255)
    birth_date = serializers.DateField()
    city = serializers.CharField(max_length=400, required=False, allow_blank=True)
    street = serializers.CharField(max_length=400, required=False, allow_blank=True)
    house_number = serializers.CharField(max_length=400, required=False, allow_blank=True)
    apartment_number = serializers.CharField(max_length=400, required=False, allow_blank=True)
    med_info = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=ProfileRole.choices, default=ProfileRole.USER)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def validate_phone_number(self, value):
        if not value:
            return value
        if Profile.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Номер телефона уже используется.")
        return value

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        profile_data = {
            k: validated_data.get(k)
            for k in (
                'first_name', 'last_name', 'birth_date', 'city', 'street',
                'house_number', 'apartment_number', 'med_info', 'role', 'phone_number'
            )
        }
        # Получаем роль из profile_data для синхронизации с User
        role = profile_data.get('role', ProfileRole.USER)

        with transaction.atomic():
            user = User.objects.create(email=email, role=role, is_active=False)
            user.set_password(password)
            user.save()

            # Создание profile по profile_data
            Profile.objects.create(user=user, **profile_data)

            # Создание пустой location
            Location.objects.create(user=user)

            # Генерация кода и отправка
            code = get_random_string(length=6, allowed_chars='0123456789')
            EmailVerificationCode.objects.create(user=user, code=code)

            send_mail(
                'Подтверждение почты Sakbol',
                f'Ваш код подтверждения почты: {code}\nВведите его для завершения регистрации.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )

        return user

class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get('email')
        code = attrs.get('code')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "Пользователь не найден."})

        if user.is_active:
            raise serializers.ValidationError({"email": "Пользователь уже активирован."})

        try:
            verification = EmailVerificationCode.objects.get(user=user)
        except EmailVerificationCode.DoesNotExist:
            raise serializers.ValidationError({"code": "Код не найден. Возможно, нужно запросить новый."})

        if verification.code != code:
            raise serializers.ValidationError({"code": "Неверный код."})

        # Активация
        user.is_active = True
        user.save(update_fields=['is_active'])
        verification.delete()

        # Генерация токенов
        refresh = TokenObtainPairSerializer.get_token(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.id,
            'email': user.email,
            'role': user.role
        }


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(email=email, password=password)

        if user is None:
            raise AuthenticationFailed("Неверный email, пароль, или аккаунт не активирован")

        refresh = self.get_token(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.id,
            'email': user.email,
            'role': user.role
        }
    
class AvatarUpdateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    avatar = serializers.ImageField()

    def validate_user_id(self, value):
        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Пользователь не найден.")
        return value

    def validate(self, data):
        request = self.context.get('request')
        user_id = data.get('user_id')
        if request and not (request.user.is_staff or request.user.pk == user_id):
            raise serializers.ValidationError("Нет прав для обновления аватара этого пользователя.")
        return data

    def save(self, **kwargs):
        user_id = self.validated_data['user_id']
        avatar = self.validated_data['avatar']
        user = get_object_or_404(User, pk=user_id)
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.avatar = avatar
        profile.save(update_fields=['avatar'])
        return profile


class ProfileDetailSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    is_gov = serializers.BooleanField(source='user.is_gov', read_only=True)

    service = serializers.SerializerMethodField()
    service_point = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "user_email",
            "is_gov",
            "first_name",
            "last_name",
            "birth_date",
            "city",
            "street",
            "house_number",
            "apartment_number",
            "med_info",
            "role",
            "phone_number",
            "avatar",
            "identifier",
            "service",
            "service_point",
        ]
        read_only_fields = fields

    def get_service(self, obj):
        user = getattr(obj, 'user', None)
        if not user or not getattr(user, 'is_gov', False):
            return None
        svc = getattr(user, 'service', None)
        if not svc:
            return None
        return GovServiceSerializer(svc).data

    def get_service_point(self, obj):
        user = getattr(obj, 'user', None)
        if not user or not getattr(user, 'is_gov', False):
            return None
        sp = getattr(user, 'service_point', None)
        if not sp:
            return None
        return GovServicePointSerializer(sp).data
    
class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email")

class ProfileMiniSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = ("user", "first_name", "last_name", "identifier", "avatar")

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "first_name", "last_name", "birth_date", "city", 
            "street", "house_number", "apartment_number", 
            "med_info", "phone_number"
        ]

class RequestChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)

class VerifyChangePasswordSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

class RequestChangeEmailSerializer(serializers.Serializer):
    new_email = serializers.EmailField()

    def validate_new_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Эта почта уже занята.")
        return value

class VerifyChangeEmailSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)