from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import uuid
from shared.enums import ProfileRole


class TourStatus(models.TextChoices):
    """Статусы тура"""
    DRAFT = 'draft', 'Черновик'
    ACTIVE = 'active', 'Активный'
    COMPLETED = 'completed', 'Завершен'
    CANCELLED = 'cancelled', 'Отменен'


class MemberStatus(models.TextChoices):
    """Статусы участника группы"""
    PENDING = 'pending', 'Ожидает подтверждения'
    ACTIVE = 'active', 'Активный участник'
    LEFT = 'left', 'Покинул группу'
    REMOVED = 'removed', 'Удален из группы'


class TourGroup(models.Model):
    """
    Группа туристов, созданная тур-агентом.
    Тур-агент может создать группу и пригласить туда туристов.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tour_groups',
        limit_choices_to={'role': ProfileRole.TOUR_AGENCY},
        verbose_name='Тур-агент'
    )
    name = models.CharField(max_length=255, verbose_name='Название группы')
    description = models.TextField(blank=True, verbose_name='Описание')
    invite_code = models.CharField(max_length=8, unique=True, verbose_name='Код приглашения')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Группа туристов'
        verbose_name_plural = 'Группы туристов'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.agent.email})"

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = self._generate_invite_code()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_invite_code():
        """Генерация уникального кода приглашения"""
        import random
        import string
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not TourGroup.objects.filter(invite_code=code).exists():
                return code

    def get_invite_link(self, request=None):
        """Получение ссылки для приглашения"""
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return f"{base_url}/tour/join/{self.invite_code}"

    def active_members_count(self):
        """Количество активных участников"""
        return self.members.filter(status=MemberStatus.ACTIVE).count()

    def pending_members_count(self):
        """Количество участников, ожидающих подтверждения"""
        return self.members.filter(status=MemberStatus.PENDING).count()

    def zones_count(self):
        """Количество зон"""
        return self.zones.count()


class TourGroupMember(models.Model):
    """
    Участник группы туристов.
    Турист может вступить в группу по приглашению.
    """
    group = models.ForeignKey(
        TourGroup,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name='Группа'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tour_group_memberships',
        limit_choices_to={'role__in': [ProfileRole.TOURIST, ProfileRole.USER]},
        verbose_name='Участник'
    )
    status = models.CharField(
        max_length=20,
        choices=MemberStatus.choices,
        default=MemberStatus.PENDING,
        verbose_name='Статус'
    )
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата вступления')
    left_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата выхода')

    class Meta:
        verbose_name = 'Участник группы'
        verbose_name_plural = 'Участники группы'
        unique_together = ['group', 'user']
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.email} в {self.group.name}"

    def accept_membership(self):
        """Принять участника в группу"""
        self.status = MemberStatus.ACTIVE
        self.save()

    def leave_group(self):
        """Покинуть группу"""
        self.status = MemberStatus.LEFT
        self.left_at = timezone.now()
        self.save()


class TourZone(models.Model):
    """
    Геозона тура.
    Тур-агент создает зону, в которой должен находиться турист во время тура.
    """
    group = models.ForeignKey(
        TourGroup,
        on_delete=models.CASCADE,
        related_name='zones',
        verbose_name='Группа'
    )
    name = models.CharField(max_length=255, verbose_name='Название зоны')
    description = models.TextField(blank=True, verbose_name='Описание')
    polygon = models.JSONField(
        verbose_name='Полигон зоны',
        help_text='Массив точек [{lat: number, lng: number}, ...]'
    )
    center_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        verbose_name='Широта центра'
    )
    center_lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        verbose_name='Долгота центра'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Зона тура'
        verbose_name_plural = 'Зоны тура'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.name} ({self.group.name})"

    def get_area_estimate(self):
        """Приблизительная площадь зоны (в м²)"""
        try:
            from shapely.geometry import Polygon
            points = [(p['lng'], p['lat']) for p in self.polygon]
            poly = Polygon(points)
            # Простая оценка площади (для небольших зон)
            return poly.area * 111000 * 111000  # примерный перевод в м²
        except Exception:
            return 0


class TourSession(models.Model):
    """
    Сессия тура.
    Тур-агент начинает тур, и начинается отслеживание участников.
    """
    group = models.ForeignKey(
        TourGroup,
        on_delete=models.CASCADE,
        related_name='tour_sessions',
        verbose_name='Группа'
    )
    status = models.CharField(
        max_length=20,
        choices=TourStatus.choices,
        default=TourStatus.DRAFT,
        verbose_name='Статус'
    )
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='Время начала')
    ended_at = models.DateTimeField(null=True, blank=True, verbose_name='Время завершения')
    duration_minutes = models.IntegerField(
        default=60,
        verbose_name='Планируемая длительность (мин)'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Сессия тура'
        verbose_name_plural = 'Сессии тура'
        ordering = ['-created_at']

    def __str__(self):
        return f"Тур {self.group.name} - {self.get_status_display()}"

    def start_tour(self):
        """Начать тур"""
        self.status = TourStatus.ACTIVE
        self.started_at = timezone.now()
        self.save()

    def complete_tour(self):
        """Завершить тур"""
        self.status = TourStatus.COMPLETED
        self.ended_at = timezone.now()
        self.save()

    def cancel_tour(self):
        """Отменить тур"""
        self.status = TourStatus.CANCELLED
        self.ended_at = timezone.now()
        self.save()

    def is_active(self):
        """Проверка активности тура"""
        return self.status == TourStatus.ACTIVE

    def get_elapsed_minutes(self):
        """Прошло времени с начала тура (минуты)"""
        if not self.started_at:
            return 0
        end_time = self.ended_at or timezone.now()
        delta = end_time - self.started_at
        return int(delta.total_seconds() / 60)

    def get_remaining_minutes(self):
        """Осталось времени до конца тура (минуты)"""
        if not self.started_at or self.ended_at:
            return 0
        elapsed = self.get_elapsed_minutes()
        return max(0, self.duration_minutes - elapsed)


class ZoneViolation(models.Model):
    """
    Нарушение зоны участником.
    Запись создается, когда участник выходит из зоны во время активного тура.
    """
    session = models.ForeignKey(
        TourSession,
        on_delete=models.CASCADE,
        related_name='violations',
        verbose_name='Сессия'
    )
    member = models.ForeignKey(
        TourGroupMember,
        on_delete=models.CASCADE,
        related_name='zone_violations',
        verbose_name='Участник'
    )
    zone = models.ForeignKey(
        TourZone,
        on_delete=models.CASCADE,
        related_name='violations',
        verbose_name='Зона'
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        verbose_name='Широта нарушения'
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        verbose_name='Долгота нарушения'
    )
    notified_at = models.DateTimeField(auto_now_add=True, verbose_name='Время уведомления')
    is_resolved = models.BooleanField(default=False, verbose_name='Решено')

    class Meta:
        verbose_name = 'Нарушение зоны'
        verbose_name_plural = 'Нарушения зоны'
        ordering = ['-notified_at']

    def __str__(self):
        return f"{self.member.user.email} нарушил {self.zone.name}"
