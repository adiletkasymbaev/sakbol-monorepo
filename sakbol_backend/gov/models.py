from django.db import models

class Service(models.Model):
    name = models.CharField(max_length=500, verbose_name="Название")
    
    class Meta:
        verbose_name = 'Гос. служба'
        verbose_name_plural = 'Гос. службы'

    def __str__(self):
        return f"{self.name}"

class ServicePoint(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="points", verbose_name="Гос. служба")
    additional = models.CharField(max_length=500, verbose_name="Дополнительно (необязательно)", null=True, blank=True)
    city = models.CharField(max_length=400, verbose_name="Город")
    street = models.CharField(max_length=400, verbose_name="Улица")
    house_number = models.CharField(max_length=400, verbose_name="Номер здания")

    class Meta:
        verbose_name = 'Пункт гос. службы'
        verbose_name_plural = 'Пункты гос. служб'

    def __str__(self):
        return f"Пункт {self.service.name} {f'({self.additional})' if self.additional else ''} г. {self.city}, ул. {self.street} {self.house_number}"