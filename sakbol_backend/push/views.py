from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import WebPushSubscriptionSerializer, FCMDeviceRegisterSerializer, FCMDeviceSerializer
from .models import WebPushSubscription, FCMDevice
from django.conf import settings
from .service import vapid_public_from_private_pem

class PushPublicKeyView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        public_key = vapid_public_from_private_pem(str(settings.VAPID_PRIVATE_KEY))
        return Response({"publicKey": public_key})

class SavePushSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.debug(f"Received push subscription data: {request.data}")
        logger.debug(f"endpoint: {request.data.get('endpoint', 'N/A')[:50]}...")
        logger.debug(f"p256dh: {request.data.get('p256dh', 'N/A')[:30] if request.data.get('p256dh') else 'None'}...")
        logger.debug(f"auth: {request.data.get('auth', 'N/A')[:30] if request.data.get('auth') else 'None'}...")
        
        s = WebPushSubscriptionSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        data = s.validated_data
        sub, _ = WebPushSubscription.objects.update_or_create(
            endpoint=data["endpoint"],
            defaults={
                "user": request.user,
                "p256dh": data["p256dh"],
                "auth": data["auth"],
            }
        )
        logger.info(f"Saved push subscription for user {request.user.id}")
        return Response({"ok": True}, status=status.HTTP_200_OK)

class FCMDeviceRegisterView(APIView):
    """
    Регистрация FCM токена для мобильных уведомлений.
    POST /push/fcm/register/
    body: { registration_id, device_type: "android"|"ios"|"web", device_id? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FCMDeviceRegisterSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        device = serializer.save()
        return Response({"ok": True, "device_id": device.id}, status=status.HTTP_201_CREATED)

class FCMDeviceListView(APIView):
    """
    Список всех FCM устройств пользователя.
    GET /push/fcm/devices/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        devices = FCMDevice.objects.filter(user=request.user).order_by("-created_at")
        serializer = FCMDeviceSerializer(devices, many=True)
        return Response(serializer.data)

class FCMDeviceUnregisterView(APIView):
    """
    Удаление FCM токена (отписка от уведомлений).
    DELETE /push/fcm/unregister/
    body: { registration_id } или { device_id }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        registration_id = request.data.get("registration_id")
        device_id = request.data.get("device_id")
        
        if registration_id:
            FCMDevice.objects.filter(
                user=request.user, 
                registration_id=registration_id
            ).delete()
        elif device_id:
            FCMDevice.objects.filter(
                user=request.user, 
                id=device_id
            ).delete()
        else:
            return Response(
                {"detail": "Укажите registration_id или device_id"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({"ok": True}, status=status.HTTP_200_OK)