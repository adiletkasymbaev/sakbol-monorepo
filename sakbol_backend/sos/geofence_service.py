from django.utils import timezone
from datetime import time as dt_time
from .models import Geofence, GeofenceState
from .geometry import is_point_inside_polygon
from push.service import push_to_user

DEFAULT_THRESHOLDS = [2, 5, 10, 30, 60, 120]

def _combine_today(now, t: dt_time):
    if not t:
        return None
    return now.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)


def check_geofences_on_location_update(child_user, lat: float, lng: float):
    now = timezone.now()
    today = now.date()

    fences = Geofence.objects.filter(
        children=child_user, is_active=True
    ).select_related("parent")

    for fence in fences:
        inside = is_point_inside_polygon(lat, lng, fence.polygon)

        state, _ = GeofenceState.objects.get_or_create(
            geofence=fence, child=child_user
        )

        if state.notify_date != today:
            state.notify_date = today
            state.arrive_notified = []
            state.depart_notified = []

        if inside != state.is_inside:
            state.is_inside = inside
            if inside:
                state.last_entered_at = now
                push_to_user(
                    fence.parent,
                    title="Гео-зона",
                    body=f"{child_user.email} вошёл в зону «{fence.name}»"
                )
            else:
                state.last_exited_at = now
                push_to_user(
                    fence.parent,
                    title="Гео-зона",
                    body=f"{child_user.email} вышел из зоны «{fence.name}»"
                )

        thresholds = fence.remind_minutes or DEFAULT_THRESHOLDS
        arrive_dt = _combine_today(now, fence.arrive_time)
        depart_dt = _combine_today(now, fence.depart_time)

        if arrive_dt and now >= arrive_dt and not inside:
            minutes_late = int((now - arrive_dt).total_seconds() // 60)
            for m in thresholds:
                if minutes_late >= m and m not in state.arrive_notified:
                    state.arrive_notified.append(m)
                    push_to_user(
                        fence.parent,
                        title="Ребёнок не дошёл",
                        body=f"Прошло {m} мин — {child_user.email} не в зоне «{fence.name}»."
                    )

        if depart_dt and now >= depart_dt and inside:
            minutes_over = int((now - depart_dt).total_seconds() // 60)
            for m in thresholds:
                if minutes_over >= m and m not in state.depart_notified:
                    state.depart_notified.append(m)
                    push_to_user(
                        fence.parent,
                        title="Ребёнок не вышел",
                        body=f"Прошло {m} мин — {child_user.email} всё ещё в зоне «{fence.name}»."
                    )

        state.save()


def check_child_outside_geofence(geofence: Geofence, child_user) -> dict:
    """
    Checks whether child_user is currently outside the given geofence.
    If outside, pushes a notification to ALL devices of the parent.
    Returns a result dict.
    """
    try:
        location = child_user.location
        lat, lng = location.latitude, location.longitude
    except Exception:
        return {"outside": None, "reason": "no_location"}

    if lat is None or lng is None:
        return {"outside": None, "reason": "no_location"}

    inside = is_point_inside_polygon(lat, lng, geofence.polygon)

    if not inside:
        push_to_user(
            geofence.parent,
            title="Ребёнок за пределами зоны",
            body=f"{child_user.email} сейчас вне зоны «{geofence.name}».",
            data={"geofence_id": geofence.id, "child_id": child_user.id},
        )

    return {
        "outside": not inside,
        "child_id": child_user.id,
        "geofence_id": geofence.id,
        "latitude": lat,
        "longitude": lng,
    }