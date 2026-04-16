from rest_framework import serializers
from .models import WebPushSubscription, FCMDevice


class WebPushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebPushSubscription
        fields = ("endpoint", "p256dh", "auth")


class FCMDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCMDevice
        fields = ("id", "device_id", "registration_id", "device_type", "is_active")
        read_only_fields = ("id",)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class FCMDeviceRegisterSerializer(serializers.Serializer):
    """
    Serializer для регистрации FCM токена.
    Вход: { registration_id, device_type?, device_id? }
    """
    registration_id = serializers.CharField(max_length=500)
    device_type = serializers.ChoiceField(choices=FCMDevice.DEVICE_TYPES, default='android')
    device_id = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def create(self, validated_data):
        request = self.context.get("request")
        device, created = FCMDevice.objects.update_or_create(
            registration_id=validated_data["registration_id"],
            defaults={
                "user": request.user,
                "device_type": validated_data.get("device_type", "android"),
                "device_id": validated_data.get("device_id", ""),
                "is_active": True,
            }
        )
        return device