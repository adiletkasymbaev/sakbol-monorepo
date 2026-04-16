from django.contrib import admin
from django.utils.html import format_html
from sos.models import AlertSignal, AlertSignalAnswer, Contact, Location, SosSignal
from sos.models import Geofence, GeofenceState


admin.site.register(Contact)
admin.site.register(Location)


@admin.register(AlertSignal)
class AlertSignalAdmin(admin.ModelAdmin):
    list_display = ("id", "sender_user", "latitude", "longitude", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("sender_user__email", "id")
    readonly_fields = ("id", "sender_user", "latitude", "longitude", "status", "created_at", "map_display")

    fieldsets = (
        ("Основная информация", {
            "fields": ("id", "sender_user", "status", "created_at")
        }),
        ("Местоположение", {
            "fields": ("latitude", "longitude", "map_display"),
            "description": "Координаты, где был отправлен Alert-сигнал"
        }),
    )

    def map_display(self, obj):
        if obj.latitude is None or obj.longitude is None:
            return "Координаты недоступны"
        return format_html(
            """
            <div style="width: 100%; height: 400px; border: 1px solid #ccc; border-radius: 4px;">
                <iframe 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    scrolling="no" 
                    marginheight="0" 
                    marginwidth="0"
                    src="https://www.openstreetmap.org/export/embed.html?bbox={lng_min},{lat_min},{lng_max},{lat_max}&amp;layer=mapnik&amp;marker={lat},{lng}">
                </iframe>
            </div>
            <p style="margin-top: 8px;">
                <a href="https://www.openstreetmap.org/?mlat={lat}&amp;mlon={lng}#map=15/{lat}/{lng}" 
                   target="_blank" 
                   style="color: #4176c0; text-decoration: underline;">
                    Открыть карту в новом окне
                </a>
            </p>
            """,
            lng_min=obj.longitude - 0.01,
            lat_min=obj.latitude - 0.01,
            lng_max=obj.longitude + 0.01,
            lat_max=obj.latitude + 0.01,
            lat=obj.latitude,
            lng=obj.longitude,
        )

    map_display.short_description = "Карта местоположения"


@admin.register(AlertSignalAnswer)
class AlertSignalAnswerAdmin(admin.ModelAdmin):
    list_display = ("id", "alert_signal", "responder_user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("responder_user__email", "alert_signal__id")
    readonly_fields = ("id", "alert_signal", "responder_user", "created_at")


@admin.register(SosSignal)
class SosSignalAdmin(admin.ModelAdmin):
    list_display = ("id", "sender_user", "latitude", "longitude", "status", "service", "service_point", "created_at")
    list_filter = ("status", "service", "service_point", "created_at")
    search_fields = ("sender_user__email", "id")
    readonly_fields = ("id", "sender_user", "latitude", "longitude", "status", "service", "service_point", "created_at", "map_display")

    fieldsets = (
        ("Основная информация", {
            "fields": ("id", "sender_user", "status", "created_at")
        }),
        ("Местоположение", {
            "fields": ("latitude", "longitude", "map_display"),
            "description": "Координаты, где был отправлен SOS-сигнал"
        }),
        ("Сервис", {
            "fields": ("service", "service_point"),
            "description": "Связанный сервис и точка обслуживания (если указаны)"
        }),
    )

    def map_display(self, obj):
        if obj.latitude is None or obj.longitude is None:
            return "Координаты недоступны"
        return format_html(
            """
            <div style="width: 100%; height: 400px; border: 1px solid #ccc; border-radius: 4px;">
                <iframe 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    scrolling="no" 
                    marginheight="0" 
                    marginwidth="0"
                    src="https://www.openstreetmap.org/export/embed.html?bbox={lng_min},{lat_min},{lng_max},{lat_max}&amp;layer=mapnik&amp;marker={lat},{lng}">
                </iframe>
            </div>
            <p style="margin-top: 8px;">
                <a href="https://www.openstreetmap.org/?mlat={lat}&amp;mlon={lng}#map=15/{lat}/{lng}" 
                   target="_blank" 
                   style="color: #4176c0; text-decoration: underline;">
                    Открыть карту в новом окне
                </a>
            </p>
            """,
            lng_min=obj.longitude - 0.01,
            lat_min=obj.latitude - 0.01,
            lng_max=obj.longitude + 0.01,
            lat_max=obj.latitude + 0.01,
            lat=obj.latitude,
            lng=obj.longitude,
        )

    map_display.short_description = "Карта местоположения"


class GeofenceStateInline(admin.TabularInline):
    model = GeofenceState
    extra = 0
    readonly_fields = ("child", "is_inside", "last_entered_at", "last_exited_at",
                       "arrive_notified", "depart_notified", "notify_date", "updated_at")
    can_delete = False


@admin.register(Geofence)
class GeofenceAdmin(admin.ModelAdmin):
    list_display  = ("id", "name", "parent", "is_active", "arrive_time", "depart_time", "created_at")
    list_filter   = ("is_active",)
    search_fields = ("name", "parent__email")
    filter_horizontal = ("children",)          # nice dual-list widget for M2M
    readonly_fields   = ("created_at",)
    inlines           = [GeofenceStateInline]


@admin.register(GeofenceState)
class GeofenceStateAdmin(admin.ModelAdmin):
    list_display  = ("id", "geofence", "child", "is_inside", "last_entered_at",
                     "last_exited_at", "notify_date", "updated_at")
    list_filter   = ("is_inside",)
    search_fields = ("geofence__name", "child__email")
    readonly_fields = ("updated_at",)