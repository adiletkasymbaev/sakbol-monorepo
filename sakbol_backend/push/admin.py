from django.contrib import admin
from .models import WebPushSubscription, FCMDevice

@admin.register(WebPushSubscription)
class WebPushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "endpoint", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "endpoint")
    readonly_fields = ("id", "user", "endpoint", "p256dh", "auth", "created_at")

@admin.register(FCMDevice)
class FCMDeviceAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "device_type", "is_active", "created_at", "updated_at")
    list_filter = ("device_type", "is_active", "created_at")
    search_fields = ("user__email", "device_id", "registration_id")
    readonly_fields = ("id", "user", "device_id", "registration_id", "device_type", "is_active", "created_at", "updated_at")