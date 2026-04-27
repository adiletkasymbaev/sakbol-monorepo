from django.utils import timezone
from shapely.geometry import Point, Polygon
from push.service import push_to_user
from .models import TourGroupMember, TourSession, TourZone, ZoneViolation, MemberStatus, TourStatus
from shared.enums import ProfileRole


def is_point_inside_polygon(lat, lng, polygon_points):
    """
    Проверка, находится ли точка внутри полигона.
    
    Args:
        lat: Широта точки
        lng: Долгота точки
        polygon_points: Список точек полигона [{lat, lng}, ...]
    
    Returns:
        bool: True если точка внутри полигона
    """
    try:
        point = Point(lng, lat)
        polygon = Polygon([(p['lng'], p['lat']) for p in polygon_points])
        return point.within(polygon)
    except Exception:
        return False


def check_member_location(member, latitude, longitude):
    """
    Проверка местоположения участника группы.
    Если участник вышел из зоны во время активного тура,
    создается нарушение и отправляется уведомление агенту.
    
    Args:
        member: TourGroupMember
        latitude: Широта местоположения
        longitude: Долгота местоположения
    """
    # Получаем активную сессию тура
    active_session = TourSession.objects.filter(
        group=member.group,
        status=TourStatus.ACTIVE
    ).first()

    if not active_session:
        return

    # Получаем активные зоны группы
    active_zones = TourZone.objects.filter(
        group=member.group,
        is_active=True
    )

    # Проверяем, находится ли участник хотя бы в одной зоне
    is_inside_any = False
    outside_zones = []

    for zone in active_zones:
        is_inside = is_point_inside_polygon(
            latitude,
            longitude,
            zone.polygon
        )
        if is_inside:
            is_inside_any = True
        else:
            outside_zones.append(zone)

    # Нарушение только если участник вне ВСЕХ зон
    if not is_inside_any:
        for zone in outside_zones:
            violation, created = ZoneViolation.objects.get_or_create(
                session=active_session,
                member=member,
                zone=zone,
                defaults={
                    'is_resolved': False,
                    'latitude': latitude,
                    'longitude': longitude,
                }
            )

            if created:
                send_violation_notification(
                    agent=member.group.agent,
                    member=member,
                    zone=zone,
                    session=active_session
                )
            elif not violation.is_resolved:
                violation.latitude = latitude
                violation.longitude = longitude
                violation.save(update_fields=['latitude', 'longitude'])


def send_violation_notification(agent, member, zone, session):
    """
    Отправка уведомления тур-агенту о нарушении зоны.
    
    Args:
        agent: Пользователь-тур-агент
        member: TourGroupMember нарушитель
        zone: TourZone которую нарушили
        session: TourSession активная сессия
    """
    title = "🚨 Нарушение зоны тура"
    body = (
        f"Участник {member.user.email} вышел из зоны \"{zone.name}\". "
        f"Тур: {session.group.name}"
    )

    data = {
        'type': 'zone_violation',
        'session_id': str(session.id),
        'member_id': str(member.id),
        'zone_id': str(zone.id),
        'group_id': str(session.group.id),
    }

    push_to_user(agent, title, body, data)


def check_all_members_locations():
    """
    Массовая проверка местоположений всех участников активных туров.
    Вызывается периодически (например, по расписанию).
    """
    # Получаем всех участников активных туров
    active_sessions = TourSession.objects.filter(status=TourStatus.ACTIVE)
    group_ids = active_sessions.values_list('group_id', flat=True)

    members = TourGroupMember.objects.filter(
        group_id__in=group_ids,
        status=MemberStatus.ACTIVE
    ).select_related('group', 'user')

    for member in members:
        # Получаем последнее местоположение участника
        location = getattr(member.user, 'location', None)
        if location and location.latitude and location.longitude:
            check_member_location(
                member,
                location.latitude,
                location.longitude
            )


def get_active_session_for_user(user):
    """
    Получение активной сессии тура для пользователя.
    
    Args:
        user: Пользователь (тур-агент или участник)
    
    Returns:
        TourSession или None
    """
    # Для тур-агента
    if user.role == ProfileRole.TOUR_AGENCY.value:
        return TourSession.objects.filter(
            group__agent=user,
            status=TourStatus.ACTIVE
        ).first()

    # Для участника
    membership = TourGroupMember.objects.filter(
        user=user,
        status=MemberStatus.ACTIVE
    ).select_related('group').first()

    if membership:
        return TourSession.objects.filter(
            group=membership.group,
            status=TourStatus.ACTIVE
        ).first()

    return None
