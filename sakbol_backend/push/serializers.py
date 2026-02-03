from rest_framework import serializers
from .models import WebPushSubscription

class WebPushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebPushSubscription
        fields = ("endpoint", "p256dh", "auth")