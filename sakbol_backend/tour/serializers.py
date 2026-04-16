from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TourGroup, TourGroupMember, TourZone, TourSession, ZoneViolation, MemberStatus
from accounts.serializers import ProfileMiniSerializer
from shared.enums import ProfileRole

User = get_user_model()


class TourGroupMemberSerializer(serializers.ModelSerializer):
    """Сериализатор участника группы"""
    user = ProfileMiniSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = TourGroupMember
        fields = [
            'id', 'user', 'user_id', 'group', 'status',
            'joined_at', 'left_at'
        ]
        read_only_fields = ['id', 'joined_at', 'left_at', 'group']


class TourGroupMemberListSerializer(serializers.ModelSerializer):
    """Сериализатор участника группы для списка"""
    user = ProfileMiniSerializer(read_only=True)

    class Meta:
        model = TourGroupMember
        fields = [
            'id', 'user', 'status', 'joined_at', 'left_at'
        ]
        read_only_fields = fields


class TourZoneSerializer(serializers.ModelSerializer):
    """Сериализатор зоны тура"""
    class Meta:
        model = TourZone
        fields = [
            'id', 'group', 'name', 'description', 'polygon',
            'center_lat', 'center_lng', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'group']

    def validate_polygon(self, value):
        """Валидация полигона"""
        if not isinstance(value, list) or len(value) < 3:
            raise serializers.ValidationError(
                "Полигон должен содержать минимум 3 точки"
            )
        for point in value:
            if not isinstance(point, dict):
                raise serializers.ValidationError(
                    "Каждая точка должна быть объектом {lat, lng}"
                )
            if 'lat' not in point or 'lng' not in point:
                raise serializers.ValidationError(
                    "Каждая точка должна содержать 'lat' и 'lng'"
                )
        return value


class TourZoneListSerializer(serializers.ModelSerializer):
    """Сериализатор зоны для списка"""
    class Meta:
        model = TourZone
        fields = [
            'id', 'name', 'description', 'is_active', 'created_at'
        ]
        read_only_fields = fields


class TourSessionSerializer(serializers.ModelSerializer):
    """Сериализатор сессии тура"""
    group_name = serializers.CharField(source='group.name', read_only=True)
    elapsed_minutes = serializers.SerializerMethodField()
    remaining_minutes = serializers.SerializerMethodField()

    class Meta:
        model = TourSession
        fields = [
            'id', 'group', 'group_name', 'status', 'started_at',
            'ended_at', 'duration_minutes', 'created_at',
            'elapsed_minutes', 'remaining_minutes'
        ]
        read_only_fields = ['id', 'created_at', 'started_at', 'ended_at']

    def get_elapsed_minutes(self, obj):
        return obj.get_elapsed_minutes()

    def get_remaining_minutes(self, obj):
        return obj.get_remaining_minutes()


class TourSessionDetailSerializer(serializers.ModelSerializer):
    """Сериализатор сессии тура с деталями"""
    group_name = serializers.CharField(source='group.name', read_only=True)
    zones = TourZoneListSerializer(source='group.zones.filter(is_active=True)', many=True, read_only=True)
    members_count = serializers.SerializerMethodField()
    violations_count = serializers.SerializerMethodField()
    elapsed_minutes = serializers.SerializerMethodField()
    remaining_minutes = serializers.SerializerMethodField()

    class Meta:
        model = TourSession
        fields = [
            'id', 'group', 'group_name', 'status', 'started_at',
            'ended_at', 'duration_minutes', 'created_at',
            'zones', 'members_count', 'violations_count',
            'elapsed_minutes', 'remaining_minutes'
        ]
        read_only_fields = fields

    def get_members_count(self, obj):
        return obj.group.active_members_count()

    def get_violations_count(self, obj):
        return obj.violations.filter(is_resolved=False).count()

    def get_elapsed_minutes(self, obj):
        return obj.get_elapsed_minutes()

    def get_remaining_minutes(self, obj):
        return obj.get_remaining_minutes()


class TourGroupSerializer(serializers.ModelSerializer):
    """Сериализатор группы туристов"""
    agent = ProfileMiniSerializer(read_only=True)
    invite_link = serializers.SerializerMethodField()
    active_members_count = serializers.SerializerMethodField()
    pending_members_count = serializers.SerializerMethodField()
    zones_count = serializers.SerializerMethodField()
    has_active_session = serializers.SerializerMethodField()

    class Meta:
        model = TourGroup
        fields = [
            'id', 'agent', 'name', 'description', 'invite_code',
            'invite_link', 'is_active', 'created_at', 'updated_at',
            'active_members_count', 'pending_members_count',
            'zones_count', 'has_active_session'
        ]
        read_only_fields = ['id', 'agent', 'invite_code', 'created_at', 'updated_at']

    def get_invite_link(self, obj):
        request = self.context.get('request')
        return obj.get_invite_link(request)

    def get_active_members_count(self, obj):
        return obj.active_members_count()

    def get_pending_members_count(self, obj):
        return obj.pending_members_count()

    def get_zones_count(self, obj):
        return obj.zones.filter(is_active=True).count()

    def get_has_active_session(self, obj):
        return obj.tour_sessions.filter(status='active').exists()


class TourGroupDetailSerializer(serializers.ModelSerializer):
    """Сериализатор группы с деталями"""
    agent = ProfileMiniSerializer(read_only=True)
    invite_link = serializers.SerializerMethodField()
    members = TourGroupMemberListSerializer(source='members.all', many=True, read_only=True)
    zones = TourZoneListSerializer(source='zones.filter(is_active=True)', many=True, read_only=True)
    active_session = TourSessionSerializer(source='tour_sessions.filter(status=active).first', read_only=True)
    active_members_count = serializers.SerializerMethodField()
    pending_members_count = serializers.SerializerMethodField()
    zones_count = serializers.SerializerMethodField()
    has_active_session = serializers.SerializerMethodField()

    class Meta:
        model = TourGroup
        fields = [
            'id', 'agent', 'name', 'description', 'invite_code',
            'invite_link', 'is_active', 'created_at', 'updated_at',
            'members', 'zones', 'active_session',
            'active_members_count', 'pending_members_count',
            'zones_count', 'has_active_session'
        ]
        read_only_fields = fields

    def get_invite_link(self, obj):
        request = self.context.get('request')
        return obj.get_invite_link(request)

    def get_active_members_count(self, obj):
        return obj.active_members_count()

    def get_pending_members_count(self, obj):
        return obj.pending_members_count()

    def get_zones_count(self, obj):
        return obj.zones.count()

    def get_has_active_session(self, obj):
        return obj.tour_sessions.filter(status='active').exists()


class TourGroupCreateSerializer(serializers.ModelSerializer):
    """Сериализатор создания группы"""
    class Meta:
        model = TourGroup
        fields = ['name', 'description']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['agent'] = request.user
        return super().create(validated_data)


class ZoneViolationSerializer(serializers.ModelSerializer):
    """Сериализатор нарушения зоны"""
    member_name = serializers.CharField(source='member.user.email', read_only=True)
    zone_name = serializers.CharField(source='zone.name', read_only=True)

    class Meta:
        model = ZoneViolation
        fields = [
            'id', 'session', 'member', 'member_name', 'zone',
            'zone_name', 'latitude', 'longitude', 'notified_at',
            'is_resolved'
        ]
        read_only_fields = ['id', 'notified_at']


class JoinGroupByCodeSerializer(serializers.Serializer):
    """Сериализатор для вступления в группу по коду"""
    invite_code = serializers.CharField(max_length=8)

    def validate_invite_code(self, value):
        try:
            self.group = TourGroup.objects.get(
                invite_code=value,
                is_active=True
            )
        except TourGroup.DoesNotExist:
            raise serializers.ValidationError("Неверный код приглашения")
        return value

    def validate(self, data):
        user = self.context.get('request').user

        # Проверка роли
        if user.role not in [ProfileRole.TOURIST.value, ProfileRole.USER.value]:
            raise serializers.ValidationError(
                "Только туристы могут вступать в группы"
            )

        # Проверка, не состоит ли уже в группе
        if TourGroupMember.objects.filter(
            group=self.group,
            user=user
        ).exists():
            raise serializers.ValidationError(
                "Вы уже состоите в этой группе"
            )

        return data


class StartTourSerializer(serializers.Serializer):
    """Сериализатор для начала тура"""
    duration_minutes = serializers.IntegerField(min_value=1, max_value=1440, default=60)


class TourGroupStatsSerializer(serializers.Serializer):
    """Статистика группы"""
    total_members = serializers.IntegerField()
    active_members = serializers.IntegerField()
    pending_members = serializers.IntegerField()
    total_zones = serializers.IntegerField()
    active_zones = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    total_violations = serializers.IntegerField()
    unresolved_violations = serializers.IntegerField()
