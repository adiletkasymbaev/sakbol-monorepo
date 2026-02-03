from django.contrib import admin

from sos.models import AlertSignal, AlertSignalAnswer, Contact, Location, SosSignal

admin.site.register(Contact)
admin.site.register(Location)
admin.site.register(AlertSignal)
admin.site.register(AlertSignalAnswer)
admin.site.register(SosSignal)