from django.db import models
from django.contrib.auth.models import AbstractUser

from gov.models import Service, ServicePoint
from shared.enums import ProfileRole
from .utils import generate_simple_id

class User(AbstractUser):
    is_gov = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ProfileRole, default=ProfileRole.USER, verbose_name='Роль')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="users", blank=True, null=True)
    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name="users", blank=True, null=True)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=False, blank=True, null=True)
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return f"{self.email} {f'(Госслужащий в {self.service_point if self.service_point else "не указано"})' if self.is_gov else '(Гражданский)'}"
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=255, verbose_name="Имя")
    last_name = models.CharField(max_length=255, verbose_name="Фамилия")
    birth_date = models.DateField(verbose_name="Дата рождения")
    city = models.CharField(max_length=400, verbose_name="Город", null=True, blank=True)
    street = models.CharField(max_length=400, verbose_name="Улица", null=True, blank=True)
    house_number = models.CharField(max_length=400, verbose_name="Номер дома", null=True, blank=True)
    apartment_number = models.CharField(max_length=400, verbose_name="Номер квартиры", null=True, blank=True)
    med_info = models.TextField(max_length=2000, verbose_name="Медицинская информация", null=True, blank=True)
    role = models.CharField(max_length=20, choices=ProfileRole, default=ProfileRole.USER, verbose_name='Роль')
    is_online = models.BooleanField(default=False, verbose_name='Онлайн статус')
    last_seen = models.DateTimeField(null=True, blank=True, verbose_name='Последний раз в сети')
    identifier = models.CharField(max_length=6, unique=True, blank=True, null=True, verbose_name='Идентификатор')
    avatar = models.ImageField(null=True, blank=True, upload_to="avatars/", verbose_name='Миниатюра')
    phone_number = models.CharField(max_length=20, unique=True, verbose_name='Номер телефона', null=True, blank=True)

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'

    def __str__(self):
        return f"{self.user.email}: {self.first_name} {self.last_name} ({self.birth_date})"
    
    def save(self, *args, **kwargs):
        if not self.identifier:
            new_id = generate_simple_id()
            # Проверяем уникальность
            while Profile.objects.filter(identifier=new_id).exists():
                new_id = generate_simple_id()
            self.identifier = new_id

        super().save(*args, **kwargs)