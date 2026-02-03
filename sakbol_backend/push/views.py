from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import WebPushSubscriptionSerializer
from .models import WebPushSubscription
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
        return Response({"ok": True}, status=status.HTTP_200_OK)