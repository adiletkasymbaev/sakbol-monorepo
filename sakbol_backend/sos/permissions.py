from rest_framework.permissions import BasePermission
from django.db import models
from .models import Contact
from shared.enums import ProfileRole

class IsParent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == ProfileRole.PARENT)

def parent_has_child_contact(parent, child) -> bool:
    return Contact.objects.filter(
        is_accepted=True
    ).filter(
        (models.Q(from_user=parent, to_user=child) | models.Q(from_user=child, to_user=parent))
    ).exists()