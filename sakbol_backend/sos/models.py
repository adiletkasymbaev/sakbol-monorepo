from django.db import models
from accounts.models import User
from gov.models import Service, ServicePoint
from shared.enums import AlertStatus, SosStatus
from django.conf import settings

class Contact(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests', verbose_name='От пользователя')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests', verbose_name='К пользователю')
    is_accepted = models.BooleanField(default=False, verbose_name='Принята')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Контакт'
        verbose_name_plural = 'Контакты'
        constraints = [
            models.UniqueConstraint(
                fields=['from_user', 'to_user'],
                name='unique_contact_request_from_to'
            ),
        ]

    def __str__(self):
        return f"Заявка на добавление в контакты от {self.from_user.email} для {self.to_user.email} ({self.created_at})"
    
class Location(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='Пользователь')
    latitude = models.FloatField(verbose_name='Широта', null=True, blank=True)
    longitude = models.FloatField(verbose_name='Долгота', null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Местоположение'
        verbose_name_plural = 'Местоположения'

    def __str__(self):
        return f"{self.user.email} (широта: {self.latitude}, долгота: {self.longitude}) - {self.updated_at}"

class AlertSignal(models.Model):
    sender_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_alert', verbose_name='Отправитель')
    latitude = models.FloatField(verbose_name='Широта')
    longitude = models.FloatField(verbose_name='Долгота')
    status = models.CharField(max_length=20, choices=AlertStatus, default=AlertStatus.INACTIVE, verbose_name="Статус")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Предупреждающий сигнал'
        verbose_name_plural = 'Предупреждающие сигналы'

    def __str__(self):
        return f"{self.id}: {self.sender_user.email} (Статус: {self.status}) - {self.created_at}"
    
class AlertSignalAnswer(models.Model):
    alert_signal = models.ForeignKey(AlertSignal, on_delete=models.CASCADE, related_name='answers', verbose_name="Предупреждающий сигнал")
    responder_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_answer_to_alert', verbose_name='Отправитель')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Ответ на предупреждающий сигнал'
        verbose_name_plural = 'Ответы на предупреждающие сигналы'

    def __str__(self):
        return f"От {self.responder_user.email} ({self.created_at}) - на сигнал {self.alert_signal.id}"

class SosSignal(models.Model):
    sender_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_sos', verbose_name='Отправитель')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="sos_signals", blank=True, null=True)
    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name="sos_signals", blank=True, null=True)
    latitude = models.FloatField(verbose_name='Широта')
    longitude = models.FloatField(verbose_name='Долгота')
    status = models.CharField(max_length=20, choices=SosStatus, default=SosStatus.INACTIVE, verbose_name="Статус")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'СОС сигнал'
        verbose_name_plural = 'СОС сигналы'

    def __str__(self):
        return f"{self.id}: {self.sender_user.email} (Статус: {self.status}) - {self.created_at}"

class Geofence(models.Model):
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="geofences",
        verbose_name="Родитель-владелец"
    )
    children = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="geofences_as_child",
        verbose_name="Дети",
    )

    name = models.CharField(max_length=120, default="Зона")
    polygon = models.JSONField()

    arrive_time = models.TimeField(null=True, blank=True)
    depart_time = models.TimeField(null=True, blank=True)
    remind_minutes = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["parent", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} (parent={self.parent_id})"


class GeofenceState(models.Model):
    geofence = models.ForeignKey(
        Geofence,
        on_delete=models.CASCADE,
        related_name="states"
    )
    child = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="geofence_states"
    )

    is_inside = models.BooleanField(default=False)
    last_entered_at = models.DateTimeField(null=True, blank=True)
    last_exited_at = models.DateTimeField(null=True, blank=True)

    arrive_notified = models.JSONField(default=list)
    depart_notified = models.JSONField(default=list)
    notify_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("geofence", "child")]