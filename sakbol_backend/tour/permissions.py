from rest_framework import permissions
from shared.enums import ProfileRole


class IsTourAgent(permissions.BasePermission):
    """
    Разрешение только для тур-агентов.
    """
    message = "Только тур-агенты могут выполнять это действие"

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == ProfileRole.TOUR_AGENCY.value


class IsTourMember(permissions.BasePermission):
    """
    Разрешение для участников группы.
    """
    message = "Только участники группы могут выполнять это действие"

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [ProfileRole.TOURIST.value, ProfileRole.USER.value]

    def has_object_permission(self, request, view, obj):
        # Проверка, что пользователь состоит в группе
        from .models import TourGroupMember
        return TourGroupMember.objects.filter(
            group=obj.group,
            user=request.user,
            status__in=['pending', 'active']
        ).exists()


class IsGroupAgent(permissions.BasePermission):
    """
    Разрешение только для агента группы.
    """
    message = "Только агент группы может выполнять это действие"

    def has_object_permission(self, request, view, obj):
        return obj.group.agent == request.user
