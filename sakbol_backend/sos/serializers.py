from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts.models import Profile, User
from accounts.serializers import ProfileMiniSerializer, SimpleUserSerializer
from .models import Contact, Location, Geofence, SosSignal, AlertSignal, AlertSignalAnswer, Notification
from .permissions import parent_has_child_contact
from .geofence_service import check_geofences_on_location_update

class ContactSerializer(serializers.ModelSerializer):
    from_user = SimpleUserSerializer(read_only=True)
    to_user = SimpleUserSerializer(read_only=True)
    from_profile = serializers.SerializerMethodField()
    to_profile = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = ("id", "from_user", "from_profile", "to_user", "to_profile", "is_accepted", "created_at")
        read_only_fields = fields
    
    def validate(self, attrs):
        request = self.context["request"]
        from_user = request.user
        to_user = attrs["to_user"]

        if Contact.objects.filter(from_user=from_user, to_user=to_user).exists():
            raise serializers.ValidationError("Вы уже отправляли заявку этому пользователю.")

        if from_user == to_user:
            raise serializers.ValidationError("Нельзя отправить заявку самому себе.")

        return attrs

    def get_from_profile(self, obj):
        try:
            profile = obj.from_user.profile
            return ProfileMiniSerializer(profile).data
        except Exception:
            return None

    def get_to_profile(self, obj):
        try:
            profile = obj.to_user.profile
            return ProfileMiniSerializer(profile).data
        except Exception:
            return None


class ContactCreateSerializer(serializers.Serializer):
    """
    Serializer для создания запроса в контакты по identifier профиля.
    При создании from_user берётся из request.user.
    Вход: { "identifier": "ABC123" }
    """
    identifier = serializers.CharField(max_length=64)

    def validate_identifier(self, value):
        try:
            profile = Profile.objects.get(identifier=value)
        except Profile.DoesNotExist:
            raise serializers.ValidationError("Профиль с таким идентификатором не найден.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        identifier = attrs.get("identifier")
        profile = Profile.objects.get(identifier=identifier)
        target_user = profile.user

        if request.user == target_user:
            raise serializers.ValidationError("Нельзя добавить себя в контакты.")

        # Проверка на существующую заявку/контакт (в обе стороны)
        exists = Contact.objects.filter(
            from_user=request.user,
            to_user=target_user
        ).exists() or Contact.objects.filter(
            from_user=target_user,
            to_user=request.user
        ).exists()

        if exists:
            raise serializers.ValidationError("Запрос на этот контакт уже существует или вы уже в контактах.")

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        identifier = validated_data.get("identifier")
        profile = Profile.objects.get(identifier=identifier)
        target_user = profile.user

        contact = Contact.objects.create(
            from_user=request.user,
            to_user=target_user,
            is_accepted=False
        )
        return contact
    
class LocationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Location
        fields = ("user_id", "latitude", "longitude", "updated_at")
        read_only_fields = ("updated_at", "user_id")

class LocationUpdateSerializer(serializers.Serializer):
    """
    Для обновления координат.
    Принимает:
      - latitude
      - longitude
    """
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    def validate_user_id(self, value):
        try:
            User.objects.get(pk=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Пользователь не найден.")
        return value

    def save(self, **kwargs):
        request = self.context.get("request")
        target_user = request.user

        location, _ = Location.objects.get_or_create(user=target_user)
        location.latitude = self.validated_data["latitude"]
        location.longitude = self.validated_data["longitude"]
        location.save(update_fields=["latitude", "longitude", "updated_at"])

        # проверяем зоны после сохранения координат
        if location.latitude is not None and location.longitude is not None:
            check_geofences_on_location_update(
                child_user=target_user,
                lat=location.latitude,
                lng=location.longitude
            )

        return location


class ContactLocationItemSerializer(serializers.Serializer):
    """
    Формат выдачи для места контакта
    { contact_id, first_name, last_name, avatar, latitude, longitude, is_online, last_seen }
    """
    contact_id = serializers.IntegerField()
    first_name = serializers.CharField(allow_null=True)
    last_name = serializers.CharField(allow_null=True)
    avatar = serializers.ImageField(allow_null=True)
    latitude = serializers.FloatField(allow_null=True)
    longitude = serializers.FloatField(allow_null=True)

class GeofenceSerializer(serializers.ModelSerializer):
    children = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
    )

    class Meta:
        model = Geofence
        fields = (
            "id", "name", "children", "polygon",
            "arrive_time", "depart_time", "remind_minutes",
            "is_active", "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_polygon(self, value):
        if not isinstance(value, list) or len(value) < 3:
            raise serializers.ValidationError("Полигон должен содержать минимум 3 точки.")
        for p in value:
            if "lat" not in p or "lng" not in p:
                raise serializers.ValidationError("Каждая точка: {lat, lng}.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        children = attrs.get("children") or (
            list(self.instance.children.all()) if self.instance else []
        )


        for child in children:
            if not parent_has_child_contact(request.user, child):
                raise serializers.ValidationError(
                    f"Пользователь {child.id} не находится в ваших контактах."
                )
        return attrs

    def create(self, validated_data):
        children = validated_data.pop("children", [])
        validated_data["parent"] = self.context["request"].user
        geofence = super().create(validated_data)
        geofence.children.set(children)
        return geofence

    def update(self, instance, validated_data):
        children = validated_data.pop("children", None)
        geofence = super().update(instance, validated_data)
        if children is not None:
            geofence.children.set(children)
        return geofence


# ==================== SOS & Alert Serializers ====================

class SosSignalSerializer(serializers.ModelSerializer):
    sender_user = SimpleUserSerializer(read_only=True)
    service_name = serializers.SerializerMethodField()
    service_point_name = serializers.SerializerMethodField()

    class Meta:
        model = SosSignal
        fields = (
            "id", "sender_user", "service", "service_point",
            "service_name", "service_point_name",
            "latitude", "longitude", "status", "created_at"
        )
        read_only_fields = fields

    def get_service_name(self, obj):
        return obj.service.name if obj.service else None

    def get_service_point_name(self, obj):
        return obj.service_point.name if obj.service_point else None


class SosSignalCreateSerializer(serializers.Serializer):
    """
    Serializer для создания SOS-сигнала.
    Вход: { latitude, longitude, service_id?, service_point_id? }
    """
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    service_id = serializers.IntegerField(required=False, allow_null=True)
    service_point_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_service_id(self, value):
        if value is None:
            return None
        from gov.models import Service
        try:
            Service.objects.get(pk=value)
        except Service.DoesNotExist:
            raise serializers.ValidationError("Сервис не найден.")
        return value

    def validate_service_point_id(self, value):
        if value is None:
            return None
        from gov.models import ServicePoint
        try:
            ServicePoint.objects.get(pk=value)
        except ServicePoint.DoesNotExist:
            raise serializers.ValidationError("Точка сервиса не найдена.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        from gov.models import Service, ServicePoint

        service = None
        if validated_data.get("service_id"):
            service = Service.objects.get(pk=validated_data["service_id"])

        service_point = None
        if validated_data.get("service_point_id"):
            service_point = ServicePoint.objects.get(pk=validated_data["service_point_id"])

        sos_signal = SosSignal.objects.create(
            sender_user=request.user,
            latitude=validated_data["latitude"],
            longitude=validated_data["longitude"],
            service=service,
            service_point=service_point,
        )
        return sos_signal


class AlertSignalSerializer(serializers.ModelSerializer):
    sender_user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = AlertSignal
        fields = (
            "id", "sender_user", "latitude", "longitude",
            "status", "created_at"
        )
        read_only_fields = fields


class AlertSignalCreateSerializer(serializers.Serializer):
    """
    Serializer для создания Alert-сигнала.
    Вход: { latitude, longitude }
    """
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    def create(self, validated_data):
        request = self.context.get("request")
        alert_signal = AlertSignal.objects.create(
            sender_user=request.user,
            latitude=validated_data["latitude"],
            longitude=validated_data["longitude"],
        )
        return alert_signal


class AlertSignalAnswerSerializer(serializers.ModelSerializer):
    responder_user = SimpleUserSerializer(read_only=True)
    alert_signal_id = serializers.IntegerField(source='alert_signal.id', read_only=True)

    class Meta:
        model = AlertSignalAnswer
        fields = ("id", "alert_signal_id", "responder_user", "created_at")
        read_only_fields = fields


class AlertSignalAnswerCreateSerializer(serializers.Serializer):
    """
    Serializer для ответа на Alert-сигнал.
    Вход: { alert_signal_id }
    """
    alert_signal_id = serializers.IntegerField()

    def validate_alert_signal_id(self, value):
        try:
            AlertSignal.objects.get(pk=value)
        except AlertSignal.DoesNotExist:
            raise serializers.ValidationError("Сигнал не найден.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        alert_signal = AlertSignal.objects.get(pk=validated_data["alert_signal_id"])
        answer = AlertSignalAnswer.objects.create(
            alert_signal=alert_signal,
            responder_user=request.user,
        )
        return answer


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            "id", "recipient", "sender", "sender_name", "sender_avatar",
            "notification_type", "title", "body",
            "alert_signal", "sos_signal", "is_read", "created_at",
        )
        read_only_fields = fields

    def get_sender_name(self, obj):
        if not obj.sender:
            return None
        try:
            profile = obj.sender.profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.sender.email
        except Exception:
            return obj.sender.email

    def get_sender_avatar(self, obj):
        if not obj.sender:
            return None
        try:
            profile = obj.sender.profile
            return profile.avatar.url if profile.avatar else None
        except Exception:
            return None