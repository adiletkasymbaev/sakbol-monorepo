from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.db import models
from .models import Contact
from shared.enums import ProfileRole

class IsParent(BasePermission):
    """
    Permission that allows:
    - Read access to authenticated users who are contacts of the zone owner
    - Write access only to PARENT role users
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow read access to any authenticated user
        if request.method in SAFE_METHODS:
            return True
        
        # Write access only for PARENT role
        return request.user.role == ProfileRole.PARENT

class IsParentForWrite(BasePermission):
    """Permission that only allows PARENT role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == ProfileRole.PARENT
        )

def parent_has_child_contact(parent, child) -> bool:
    return Contact.objects.filter(
        is_accepted=True
    ).filter(
        (models.Q(from_user=parent, to_user=child) | models.Q(from_user=child, to_user=parent))
    ).exists()

def user_has_contact_with(user, other_user) -> bool:
    """Check if user has an accepted contact relationship with other_user."""
    return Contact.objects.filter(
        is_accepted=True
    ).filter(
        (models.Q(from_user=user, to_user=other_user) | models.Q(from_user=other_user, to_user=user))
    ).exists()