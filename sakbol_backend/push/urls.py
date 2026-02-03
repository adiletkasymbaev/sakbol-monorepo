from django.urls import path
from .views import SavePushSubscriptionView, PushPublicKeyView

urlpatterns = [
    path("subscribe/", SavePushSubscriptionView.as_view()),
    path("public-key/", PushPublicKeyView.as_view())
]