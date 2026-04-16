from django.urls import path
from .views import (
    SavePushSubscriptionView, 
    PushPublicKeyView, 
    FCMDeviceRegisterView, 
    FCMDeviceListView,
    FCMDeviceUnregisterView
)

urlpatterns = [
    path("subscribe/", SavePushSubscriptionView.as_view()),
    path("public-key/", PushPublicKeyView.as_view()),
    
    # FCM endpoints
    path("fcm/register/", FCMDeviceRegisterView.as_view()),
    path("fcm/devices/", FCMDeviceListView.as_view()),
    path("fcm/unregister/", FCMDeviceUnregisterView.as_view()),
]