from django.db import models
from django.conf import settings

class WebPushSubscription(models.Model):
    """Подписка на Web Push уведомления (браузер)"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="web_push_subscriptions")
    endpoint = models.TextField(unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Web Push подписка"
        verbose_name_plural = "Web Push подписки"

    def __str__(self):
        return f"Web Push: {self.user.email} ({self.endpoint[:50]}...)"


class FCMDevice(models.Model):
    """FCM токен для мобильных уведомлений (Android/iOS)"""
    DEVICE_TYPES = (
        ('android', 'Android'),
        ('ios', 'iOS'),
        ('web', 'Web (FCM)'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="fcm_devices")
    device_id = models.CharField(max_length=255, blank=True, null=True, help_text="Уникальный ID устройства")
    registration_id = models.TextField(unique=True, help_text="FCM registration token")
    device_type = models.CharField(max_length=10, choices=DEVICE_TYPES, default='android')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "FCM устройство"
        verbose_name_plural = "FCM устройства"
        indexes = [
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self):
        return f"FCM: {self.user.email} ({self.device_type}) - {self.registration_id[:30]}..."