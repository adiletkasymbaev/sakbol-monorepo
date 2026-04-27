from django.urls import path
from .views import (
    AvatarUpdateView, EmailLoginView, ProfileDetailView, RegisterView, VerifyEmailView,
    ChangePasswordRequestView, ChangePasswordVerifyView, ChangeEmailRequestView, ChangeEmailVerifyView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('login/', EmailLoginView.as_view(), name='auth_token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('profile/avatar/', AvatarUpdateView.as_view(), name='profile-avatar-update'),
    path('profile/me/', ProfileDetailView.as_view(), name='profile-me'),
    path('profile/<int:user_id>/', ProfileDetailView.as_view(), name='profile-detail'),
    
    path('password/change/request/', ChangePasswordRequestView.as_view(), name='password_change_request'),
    path('password/change/verify/', ChangePasswordVerifyView.as_view(), name='password_change_verify'),
    path('email/change/request/', ChangeEmailRequestView.as_view(), name='email_change_request'),
    path('email/change/verify/', ChangeEmailVerifyView.as_view(), name='email_change_verify'),
]