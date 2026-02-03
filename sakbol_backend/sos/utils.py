from django.db import models
from .models import Contact
from shared.enums import ProfileRole

def get_my_children(user):
    # user = parent
    qs = Contact.objects.filter(
        is_accepted=True
    ).filter(
        models.Q(from_user=user) | models.Q(to_user=user)
    ).select_related("from_user", "to_user")

    children = []
    for c in qs:
        other = c.to_user if c.from_user_id == user.id else c.from_user
        if getattr(other, "role", None) == ProfileRole.CHILD:
            children.append(other)
    return children


def get_my_parents(user):
    # user = child
    qs = Contact.objects.filter(
        is_accepted=True
    ).filter(
        models.Q(from_user=user) | models.Q(to_user=user)
    ).select_related("from_user", "to_user")

    parents = []
    for c in qs:
        other = c.to_user if c.from_user_id == user.id else c.from_user
        if getattr(other, "role", None) == ProfileRole.PARENT:
            parents.append(other)
    return parents