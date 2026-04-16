from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TourGroupViewSet,
    TourGroupMemberViewSet,
    TourZoneViewSet,
    TourSessionViewSet,
    TourLocationUpdateView,
    TourGroupInviteView,
)

router = DefaultRouter()
router.register(r'groups', TourGroupViewSet, basename='tour-group')
router.register(r'members', TourGroupMemberViewSet, basename='tour-member')
router.register(r'zones', TourZoneViewSet, basename='tour-zone')
router.register(r'sessions', TourSessionViewSet, basename='tour-session')

urlpatterns = [
    path('', include(router.urls)),
    path('location/update/', TourLocationUpdateView.as_view(), name='tour-location-update'),
    path('invite/<str:invite_code>/', TourGroupInviteView.as_view(), name='tour-invite'),
]
