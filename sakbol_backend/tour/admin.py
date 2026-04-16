from django.contrib import admin
from .models import TourGroup, TourGroupMember, TourZone, TourSession, ZoneViolation


@admin.register(TourGroup)
class TourGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'agent', 'invite_code', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'agent__email', 'invite_code']
    readonly_fields = ['invite_code', 'created_at', 'updated_at']

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ['agent']
        return self.readonly_fields


@admin.register(TourGroupMember)
class TourGroupMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'group', 'status', 'joined_at', 'left_at']
    list_filter = ['status', 'joined_at']
    search_fields = ['user__email', 'group__name']
    readonly_fields = ['joined_at', 'left_at']


@admin.register(TourZone)
class TourZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'group', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'group__name']
    readonly_fields = ['created_at']


@admin.register(TourSession)
class TourSessionAdmin(admin.ModelAdmin):
    list_display = ['group', 'status', 'started_at', 'ended_at', 'duration_minutes']
    list_filter = ['status', 'created_at']
    search_fields = ['group__name']
    readonly_fields = ['started_at', 'ended_at', 'created_at']


@admin.register(ZoneViolation)
class ZoneViolationAdmin(admin.ModelAdmin):
    list_display = ['member', 'zone', 'session', 'notified_at', 'is_resolved']
    list_filter = ['is_resolved', 'notified_at']
    search_fields = ['member__user__email', 'zone__name']
    readonly_fields = ['notified_at']
