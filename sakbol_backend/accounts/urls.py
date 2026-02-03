from django.urls import path
from .views import AvatarUpdateView, EmailLoginView, ProfileDetailView, RegisterView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', EmailLoginView.as_view(), name='auth_token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('profile/avatar/', AvatarUpdateView.as_view(), name='profile-avatar-update'),
    path('profile/me/', ProfileDetailView.as_view(), name='profile-me'),
    path('profile/<int:user_id>/', ProfileDetailView.as_view(), name='profile-detail'),
]