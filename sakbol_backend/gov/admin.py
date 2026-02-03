from django.contrib import admin
from .models import Service, ServicePoint

admin.site.register(Service)
admin.site.register(ServicePoint)