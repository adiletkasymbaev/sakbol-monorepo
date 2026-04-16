from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ContactViewSet, ContactsLocationsView, GeofenceViewSet, LocationUpdateView, SosSignalViewSet, AlertSignalViewSet

router = DefaultRouter()
router.register(r"contacts", ContactViewSet, basename="contact")
router.register(r"geofences", GeofenceViewSet, basename="geofence")
router.register(r"sos", SosSignalViewSet, basename="sos")
router.register(r"alerts", AlertSignalViewSet, basename="alert")

urlpatterns = [
    path("contacts_module/", include(router.urls)),
    path("locations_module/update/", LocationUpdateView.as_view(), name="location-update"),
    path("locations_module/contacts/", ContactsLocationsView.as_view(), name="contacts-locations"),
]