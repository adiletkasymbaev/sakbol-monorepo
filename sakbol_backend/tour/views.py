from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from drf_spectacular.types import OpenApiTypes

from .models import TourGroup, TourGroupMember, TourZone, TourSession, ZoneViolation, MemberStatus, TourStatus
from shared.enums import ProfileRole
from .serializers import (
    TourGroupSerializer,
    TourGroupDetailSerializer,
    TourGroupCreateSerializer,
    TourGroupMemberSerializer,
    TourGroupMemberListSerializer,
    TourZoneSerializer,
    TourZoneListSerializer,
    TourSessionSerializer,
    TourSessionDetailSerializer,
    JoinGroupByCodeSerializer,
    StartTourSerializer,
    ZoneViolationSerializer,
    TourGroupStatsSerializer,
)
from .permissions import IsTourAgent, IsTourMember
from .geofence_service import check_member_location


@extend_schema_view(
    list=extend_schema(
        summary="Список групп турагента",
        description="Получение списка всех групп, созданных текущим тур-агентом."
    ),
    create=extend_schema(
        summary="Создать группу",
        description="Создание новой группы для туристов. Только для тур-агентов."
    ),
    retrieve=extend_schema(
        summary="Детали группы",
        description="Получение подробной информации о группе."
    ),
    update=extend_schema(
        summary="Обновить группу",
        description="Обновление информации о группе."
    ),
    partial_update=extend_schema(
        summary="Частичное обновление группы",
        description="Частичное обновление информации о группе."
    ),
    destroy=extend_schema(
        summary="Удалить группу",
        description="Удаление группы (распускает группу)."
    ),
)
class TourGroupViewSet(viewsets.ModelViewSet):
    """
    CRUD для групп туристов.
    Только тур-агенты могут создавать группы.
    """
    serializer_class = TourGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsTourAgent]

    def get_queryset(self):
        user = self.request.user
        if user.role == ProfileRole.TOUR_AGENCY.value:
            return TourGroup.objects.filter(agent=user)
        # Туристы видят только группы, в которых состоят
        member_groups = TourGroupMember.objects.filter(
            user=user,
            status__in=['pending', 'active']
        ).values_list('group_id', flat=True)
        return TourGroup.objects.filter(id__in=member_groups)

    def get_serializer_class(self):
        if self.action == 'create':
            return TourGroupCreateSerializer
        elif self.action == 'retrieve':
            return TourGroupDetailSerializer
        return TourGroupSerializer

    def perform_create(self, serializer):
        # Проверка: у агента может быть только одна активная группа
        if TourGroup.objects.filter(agent=self.request.user, is_active=True).exists():
            raise permissions.PermissionDenied(
                'У вас уже есть активная группа. Распустите её перед созданием новой.'
            )
        serializer.save(agent=self.request.user)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Статистика группы"""
        group = self.get_object()
        stats = {
            'total_members': group.members.count(),
            'active_members': group.active_members_count(),
            'pending_members': group.pending_members_count(),
            'total_zones': group.zones.count(),
            'active_zones': group.zones.filter(is_active=True).count(),
            'total_sessions': group.tour_sessions.count(),
            'active_sessions': group.tour_sessions.filter(status='active').count(),
            'total_violations': ZoneViolation.objects.filter(
                session__group=group
            ).count(),
            'unresolved_violations': ZoneViolation.objects.filter(
                session__group=group,
                is_resolved=False
            ).count(),
        }
        serializer = TourGroupStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def members_locations(self, request, pk=None):
        """Получить местоположения всех участников группы"""
        group = self.get_object()
        
        # Получаем всех активных участников
        members = TourGroupMember.objects.filter(
            group=group,
            status=MemberStatus.ACTIVE
        ).select_related('user', 'user__location')
        
        locations = []
        for member in members:
            location = getattr(member.user, 'location', None)
            if location and location.latitude and location.longitude:
                locations.append({
                    'member_id': member.id,
                    'user_id': member.user.id,
                    'first_name': member.user.first_name,
                    'last_name': member.user.last_name,
                    'email': member.user.email,
                    'latitude': float(location.latitude),
                    'longitude': float(location.longitude),
                    'is_online': member.user.is_online,
                    'last_seen': member.user.last_seen.isoformat() if member.user.last_seen else None,
                })
        
        return Response(locations)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Распустить группу"""
        group = self.get_object()
        group.is_active = False
        group.save()

        # Помечаем всех участников как покинувших
        group.members.update(
            status='left',
            left_at=timezone.now()
        )

        # Завершаем активные сессии
        group.tour_sessions.filter(status='active').update(
            status='completed',
            ended_at=timezone.now()
        )

        return Response({'status': 'Группа распущена'})


@extend_schema_view(
    list=extend_schema(
        summary="Список участников",
        description="Получение списка участников группы."
    ),
    create=extend_schema(
        summary="Добавить участника",
        description="Добавление участника в группу (только агент)."
    ),
    retrieve=extend_schema(
        summary="Детали участника",
        description="Получение информации об участнике."
    ),
)
class TourGroupMemberViewSet(viewsets.ModelViewSet):
    """
    CRUD для участников группы.
    """
    serializer_class = TourGroupMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Агент видит участников своих групп, туристы видят только свои членства
        if user.role == ProfileRole.TOUR_AGENCY.value:
            queryset = TourGroupMember.objects.filter(group__agent=user)
        else:
            queryset = TourGroupMember.objects.filter(user=user)
        
        # Фильтрация по group_id если указан
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return TourGroupMemberListSerializer
        return TourGroupMemberSerializer

    def create(self, request, *args, **kwargs):
        """Добавление участника агентом"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        group = get_object_or_404(TourGroup, id=serializer.validated_data['user_id'])
        if group.agent != request.user:
            return Response(
                {'detail': 'Только агент может добавлять участников'},
                status=status.HTTP_403_FORBIDDEN
            )

        user = get_object_or_404(
            request.user.__class__,
            id=serializer.validated_data['user_id']
        )

        member, created = TourGroupMember.objects.get_or_create(
            group=group,
            user=user,
            defaults={'status': 'pending'}
        )

        if not created:
            return Response(
                {'detail': 'Пользователь уже в группе'},
                status=status.HTTP_400_BAD_REQUEST
            )

        out_serializer = TourGroupMemberSerializer(member)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Принять участника (только агент)"""
        member = self.get_object()
        if member.group.agent != request.user:
            return Response(
                {'detail': 'Только агент может принимать участников'},
                status=status.HTTP_403_FORBIDDEN
            )
        member.accept_membership()
        return Response({'status': 'Принят в группу'})

    @action(detail=True, methods=['post'])
    def remove(self, request, pk=None):
        """Удалить участника из группы"""
        member = self.get_object()
        group = member.group

        # Проверка прав
        if group.agent != request.user and member.user != request.user:
            return Response(
                {'detail': 'Нет прав'},
                status=status.HTTP_403_FORBIDDEN
            )

        member.status = 'removed'
        member.left_at = timezone.now()
        member.save()

        return Response({'status': 'Удален из группы'})

    @action(detail=False, methods=['post'])
    def join_by_code(self, request):
        """Вступить в группу по коду приглашения"""
        serializer = JoinGroupByCodeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        group = serializer.group
        user = request.user

        member = TourGroupMember.objects.create(
            group=group,
            user=user,
            status='pending' if group.agent != user else 'active'
        )

        return Response(
            TourGroupMemberSerializer(member).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Покинуть группу"""
        member = self.get_object()
        if member.user != request.user:
            return Response(
                {'detail': 'Вы можете покинуть только свою группу'},
                status=status.HTTP_403_FORBIDDEN
            )
        member.leave_group()
        return Response({'status': 'Вы покинули группу'})


@extend_schema_view(
    list=extend_schema(
        summary="Список зон",
        description="Получение списка зон группы."
    ),
    create=extend_schema(
        summary="Создать зону",
        description="Создание новой зоны для группы. Только для тур-агента."
    ),
    retrieve=extend_schema(
        summary="Детали зоны",
        description="Получение информации о зоне."
    ),
    update=extend_schema(
        summary="Обновить зону",
        description="Обновление зоны."
    ),
    partial_update=extend_schema(
        summary="Частичное обновление зоны",
        description="Частичное обновление зоны."
    ),
    destroy=extend_schema(
        summary="Удалить зону",
        description="Удаление зоны."
    ),
)
class TourZoneViewSet(viewsets.ModelViewSet):
    """
    CRUD для зон тура.
    Только тур-агенты могут создавать и управлять зонами.
    """
    serializer_class = TourZoneSerializer
    permission_classes = [permissions.IsAuthenticated, IsTourAgent]

    def get_queryset(self):
        user = self.request.user
        # Агент видит все свои зоны, туристы видят зоны своих групп
        if user.role == ProfileRole.TOUR_AGENCY.value:
            queryset = TourZone.objects.filter(group__agent=user)
        else:
            member_group_ids = TourGroupMember.objects.filter(
                user=user,
                status__in=['pending', 'active']
            ).values_list('group_id', flat=True)
            queryset = TourZone.objects.filter(group_id__in=member_group_ids)
        
        # Фильтрация по group_id если указан
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return TourZoneListSerializer
        return TourZoneSerializer

    def perform_create(self, serializer):
        group_id = self.request.data.get('group')
        group = get_object_or_404(TourGroup, id=group_id)
        if group.agent != self.request.user:
            raise permissions.PermissionDenied(
                'Только агент группы может создавать зоны'
            )
        serializer.save(group=group)


@extend_schema_view(
    list=extend_schema(
        summary="Список сессий",
        description="Получение списка сессий группы."
    ),
    create=extend_schema(
        summary="Создать сессию",
        description="Создание новой сессии тура. Только для тур-агента."
    ),
    retrieve=extend_schema(
        summary="Детали сессии",
        description="Получение информации о сессии."
    ),
)
class TourSessionViewSet(viewsets.ModelViewSet):
    """
    CRUD для сессий тура.
    """
    serializer_class = TourSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTourAgent]

    def get_queryset(self):
        user = self.request.user
        # Агент видит все свои сессии, туристы видят сессии своих групп
        if user.role == ProfileRole.TOUR_AGENCY.value:
            queryset = TourSession.objects.filter(group__agent=user)
        else:
            member_group_ids = TourGroupMember.objects.filter(
                user=user,
                status__in=['pending', 'active']
            ).values_list('group_id', flat=True)
            queryset = TourSession.objects.filter(group_id__in=member_group_ids)
        
        # Фильтрация по group_id если указан
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TourSessionDetailSerializer
        return TourSessionSerializer

    def create(self, request, *args, **kwargs):
        """Создание сессии тура"""
        group_id = request.data.get('group')
        group = get_object_or_404(TourGroup, id=group_id)

        if group.agent != request.user:
            return Response(
                {'detail': 'Только агент группы может создавать сессии'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def perform_create(self, serializer):
        group_id = self.request.data.get('group')
        group = get_object_or_404(TourGroup, id=group_id)
        serializer.save(group=group)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Начать тур"""
        session = self.get_object()
        if session.group.agent != request.user:
            return Response(
                {'detail': 'Только агент может начать тур'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = StartTourSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session.duration_minutes = serializer.validated_data.get(
            'duration_minutes', 60
        )
        session.start_tour()

        return Response(TourSessionDetailSerializer(session).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Завершить тур"""
        session = self.get_object()
        if session.group.agent != request.user:
            return Response(
                {'detail': 'Только агент может завершить тур'},
                status=status.HTTP_403_FORBIDDEN
            )
        session.complete_tour()
        return Response(TourSessionDetailSerializer(session).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отменить тур"""
        session = self.get_object()
        if session.group.agent != request.user:
            return Response(
                {'detail': 'Только агент может отменить тур'},
                status=status.HTTP_403_FORBIDDEN
            )
        session.cancel_tour()
        return Response(TourSessionDetailSerializer(session).data)

    @action(detail=True, methods=['get'])
    def violations(self, request, pk=None):
        """Получить нарушения за сессию"""
        session = self.get_object()
        violations = session.violations.select_related(
            'member', 'zone', 'member__user'
        )
        serializer = ZoneViolationSerializer(violations, many=True)
        return Response(serializer.data)


class TourLocationUpdateView(APIView):
    """
    Обновление местоположения участника тура.
    Автоматически проверяет нарушение зон.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Обновить местоположение",
        description=(
            "Обновление местоположения участника тура. "
            "Автоматически проверяет нарушение зон и отправляет уведомления."
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'latitude': {'type': 'number', 'format': 'float'},
                    'longitude': {'type': 'number', 'format': 'float'},
                },
                'required': ['latitude', 'longitude']
            }
        },
        responses={
            200: {'type': 'object', 'properties': {'status': {'type': 'string'}}},
            400: {'type': 'object', 'properties': {'detail': {'type': 'string'}}},
        }
    )
    def post(self, request):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        if not latitude or not longitude:
            return Response(
                {'detail': 'Требуется latitude и longitude'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Обновляем основное местоположение пользователя
        from sos.models import Location
        location, _ = Location.objects.get_or_create(user=request.user)
        location.latitude = latitude
        location.longitude = longitude
        location.save()

        # Проверяем нарушения в активных турах
        from .models import TourGroupMember, MemberStatus
        memberships = TourGroupMember.objects.filter(
            user=request.user,
            status=MemberStatus.ACTIVE
        ).select_related('group')

        for membership in memberships:
            check_member_location(membership, latitude, longitude)

        return Response({'status': 'Местоположение обновлено'})


class TourGroupInviteView(APIView):
    """
    Получение информации о группе по коду приглашения.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Информация о группе по коду",
        description="Получение информации о группе для вступления.",
        responses={
            200: TourGroupDetailSerializer,
            404: {'type': 'object', 'properties': {'detail': {'type': 'string'}}},
        }
    )
    def get(self, request, invite_code):
        group = get_object_or_404(
            TourGroup,
            invite_code=invite_code,
            is_active=True
        )

        serializer = TourGroupDetailSerializer(group)
        return Response(serializer.data)
