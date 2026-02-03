from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ServiceViewSet, ServicePointViewSet

router = DefaultRouter()
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"service-points", ServicePointViewSet, basename="servicepoint")

urlpatterns = [
    path("", include(router.urls)),
]