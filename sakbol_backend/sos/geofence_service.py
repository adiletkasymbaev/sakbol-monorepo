from django.utils import timezone
from datetime import datetime, time as dt_time
from .models import Geofence, GeofenceState
from .geometry import is_point_inside_polygon
from shared.enums import ProfileRole
from push.service import push_to_user

DEFAULT_THRESHOLDS = [2, 5, 10, 30, 60, 120]

def _today_in_tz(now):
    # now already tz-aware
    return now.date()

def _combine_today(now, t: dt_time):
    if not t:
        return None
    # combined in current timezone
    return now.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)

def check_geofences_on_location_update(child_user, lat: float, lng: float):
    now = timezone.now()
    today = _today_in_tz(now)

    fences = Geofence.objects.filter(child=child_user, is_active=True).select_related("parent")

    for fence in fences:
        # safety: only parents create fences for children via contacts (проверим в create)
        inside = is_point_inside_polygon(lat, lng, fence.polygon)

        state, _ = GeofenceState.objects.get_or_create(geofence=fence)

        # reset daily notified lists if date changed
        if state.notify_date != today:
            state.notify_date = today
            state.arrive_notified = []
            state.depart_notified = []

        # 1) State change notifications
        if inside != state.is_inside:
            state.is_inside = inside
            if inside:
                state.last_entered_at = now
                # "ребёнок в зоне"
                push_to_user(
                    fence.parent,
                    title="Гео-зона",
                    body=f"{child_user.email} вошёл в зону «{fence.name}»"
                )
            else:
                state.last_exited_at = now
                # "ребёнок вышел из зоны"
                push_to_user(
                    fence.parent,
                    title="Гео-зона",
                    body=f"{child_user.email} вышел из зоны «{fence.name}»"
                )

        # 2) Scheduled notifications (arrive/depart)
        thresholds = fence.remind_minutes or DEFAULT_THRESHOLDS

        arrive_dt = _combine_today(now, fence.arrive_time) if fence.arrive_time else None
        depart_dt = _combine_today(now, fence.depart_time) if fence.depart_time else None

        # 2a) "не дошёл к времени прибытия"
        if arrive_dt and now >= arrive_dt and not inside:
            minutes_late = int((now - arrive_dt).total_seconds() // 60)
            for m in thresholds:
                if minutes_late >= m and m not in state.arrive_notified:
                    state.arrive_notified.append(m)
                    push_to_user(
                        fence.parent,
                        title="Ребёнок не дошёл",
                        body=f"Прошло {m} мин после времени прибытия — ребёнок не в зоне «{fence.name}»."
                    )

        # 2b) "не вышел к времени отбытия"
        if depart_dt and now >= depart_dt and inside:
            minutes_over = int((now - depart_dt).total_seconds() // 60)
            for m in thresholds:
                if minutes_over >= m and m not in state.depart_notified:
                    state.depart_notified.append(m)
                    push_to_user(
                        fence.parent,
                        title="Ребёнок не вышел",
                        body=f"Прошло {m} мин после времени отбытия — ребёнок всё ещё в зоне «{fence.name}»."
                    )

        state.save()