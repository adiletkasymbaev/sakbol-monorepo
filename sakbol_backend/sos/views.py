from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction, models
from drf_spectacular.utils import (
    extend_schema, extend_schema_view,
    OpenApiParameter, OpenApiExample, OpenApiResponse
)
from drf_spectacular.types import OpenApiTypes

from accounts.models import Profile

from .models import Contact, Location, Geofence
from .serializers import ContactLocationItemSerializer, ContactSerializer, ContactCreateSerializer, LocationSerializer, LocationUpdateSerializer, GeofenceSerializer
from .permissions import IsParent

class GeofenceViewSet(viewsets.ModelViewSet):
    serializer_class = GeofenceSerializer
    permission_classes = [IsAuthenticated, IsParent]

    def get_queryset(self):
        return Geofence.objects.filter(parent=self.request.user).order_by("-created_at")

@extend_schema_view(
    list=extend_schema(
        tags=["Contacts"],
        summary="Список контактов пользователя",
        description=(
            "Возвращает список Contact, где текущий пользователь является "
            "`from_user` или `to_user`.\n\n"
            "Можно фильтровать по статусу принятия."
        ),
        parameters=[
            OpenApiParameter(
                name="status",
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Фильтр: accepted | pending",
                enum=["accepted", "pending"],
            ),
        ],
        responses={200: ContactSerializer},
    ),
    retrieve=extend_schema(
        tags=["Contacts"],
        summary="Получить контакт по id",
        description="Доступно только участникам контакта (from_user/to_user).",
        responses={
            200: ContactSerializer,
            403: OpenApiResponse(description="Нет доступа к этому контакту."),
            404: OpenApiResponse(description="Не найдено."),
        },
    ),
    create=extend_schema(
        tags=["Contacts"],
        summary="Создать заявку в контакты",
        description=(
            "Создаёт заявку в контакты по `identifier` профиля.\n"
            "`from_user` берётся из `request.user`."
        ),
        request=ContactCreateSerializer,
        examples=[
            OpenApiExample(
                name="Пример запроса",
                value={"identifier": "ABC123"},
                request_only=True,
            ),
        ],
        responses={
            201: ContactSerializer,
            400: OpenApiResponse(description="Валидация: профиль не найден / нельзя себя / запрос уже существует."),
            401: OpenApiResponse(description="Не авторизован."),
        },
    ),
    destroy=extend_schema(
        tags=["Contacts"],
        summary="Удалить контакт/заявку",
        description="Удалить может участник контакта (from_user/to_user) или staff.",
        responses={
            204: OpenApiResponse(description="Удалено."),
            403: OpenApiResponse(description="Нет прав удалять этот контакт."),
            404: OpenApiResponse(description="Не найдено."),
        },
    ),
)
class ContactViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ContactSerializer
    queryset = Contact.objects.all().select_related("from_user", "to_user", "from_user__profile", "to_user__profile")

    # ====== helper to restrict access ======
    def get_object_for_user(self, pk):
        obj = get_object_or_404(Contact, pk=pk)
        user = self.request.user
        if not (obj.from_user_id == user.id or obj.to_user_id == user.id):
            # пользователь не участник — нет доступа
            self.permission_denied(self.request, message="Нет доступа к этому контакту.")
        return obj

    # ====== list ======
    def list(self, request, *args, **kwargs):
        """
        Возвращает контакты, где пользователь — участник.
        Query params:
          ?status=accepted | pending  (опционально)
        """
        user = request.user
        qs = Contact.objects.filter(models.Q(from_user=user) | models.Q(to_user=user)).select_related("from_user__profile", "to_user__profile")

        status_filter = request.query_params.get("status")
        if status_filter == "accepted":
            qs = qs.filter(is_accepted=True)
        elif status_filter == "pending":
            qs = qs.filter(is_accepted=False)

        page = self.paginate_queryset(qs.order_by("-created_at"))
        if page is not None:
            serializer = ContactSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = ContactSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    # ====== retrieve ======
    def retrieve(self, request, pk=None):
        contact = self.get_object_for_user(pk)
        serializer = ContactSerializer(contact, context={"request": request})
        return Response(serializer.data)

    # ====== create ======
    def create(self, request, *args, **kwargs):
        serializer = ContactCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        contact = serializer.save()
        out = ContactSerializer(contact, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    # ====== destroy ======
    def destroy(self, request, pk=None):
        contact = get_object_or_404(Contact, pk=pk)
        user = request.user
        if not (contact.from_user_id == user.id or contact.to_user_id == user.id or user.is_staff):
            return Response({"detail": "Нет прав удалять этот контакт."}, status=status.HTTP_403_FORBIDDEN)
        contact.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ====== accept ======
    @extend_schema(
        tags=["Contacts"],
        summary="Принять заявку в контакты",
        description=(
            "Принять заявку может только получатель (`to_user`).\n"
            "Если уже принято — вернёт текущий объект."
        ),
        request=None,
        responses={
            200: ContactSerializer,
            403: OpenApiResponse(description="Только получатель запроса может принять контакт."),
            404: OpenApiResponse(description="Не найдено."),
        },
    )
    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        """
        Принять заявку: только пользователь, которому адресована заявка (to_user), может принять её.
        Если уже принято — возвращаем 200 и существующее состояние.
        """
        contact = get_object_or_404(Contact, pk=pk)
        user = request.user
        if contact.to_user_id != user.id:
            return Response({"detail": "Только получатель запроса может принять контакт."}, status=status.HTTP_403_FORBIDDEN)

        if contact.is_accepted:
            serializer = ContactSerializer(contact, context={"request": request})
            return Response(serializer.data)

        with transaction.atomic():
            contact.is_accepted = True
            contact.save(update_fields=["is_accepted"])

        # можно здесь отправить уведомление отправителю (webpush/websocket) — не реализовано
        serializer = ContactSerializer(contact, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ====== incoming ======
    @extend_schema(
        tags=["Contacts"],
        summary="Входящие заявки в контакты",
        description=(
            "Возвращает список заявок, которые другие пользователи отправили текущему пользователю.\n"
            "Только pending: to_user = текущий пользователь и is_accepted = false."
        ),
        responses={
            200: ContactSerializer(many=True),
            401: OpenApiResponse(description="Не авторизован."),
        },
    )
    @action(detail=False, methods=["get"], url_path="incoming")
    def incoming(self, request, *args, **kwargs):
        user = request.user

        qs = Contact.objects.filter(
            to_user=user,
            is_accepted=False
        ).select_related(
            "from_user", "to_user",
            "from_user__profile", "to_user__profile"
        ).order_by("-created_at")

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ContactSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = ContactSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

class LocationUpdateView(APIView):
    """
    POST /location/update/
    body: { latitude, longitude, optional: user_id }
    Возвращает сериализованный Location.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["Locations"],
        summary="Обновить текущую геолокацию",
        description="Создаёт или обновляет Location для текущего пользователя.",
        request=LocationUpdateSerializer,
        examples=[
            OpenApiExample(
                name="Пример запроса",
                value={"latitude": 42.8746, "longitude": 74.5698},
                request_only=True,
            ),
        ],
        responses={
            200: LocationSerializer,
            400: OpenApiResponse(description="Ошибка валидации."),
            401: OpenApiResponse(description="Не авторизован."),
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = LocationUpdateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Сохраняем
        with transaction.atomic():
            location = serializer.save()

        out = LocationSerializer(location, context={"request": request})
        return Response(out.data, status=status.HTTP_200_OK)


class ContactsLocationsView(APIView):
    """
    GET /locations/contacts/
    Возвращает список локаций контактных пользователей (accepted contacts) текущего пользователя.
    Формат: [{contact_id, first_name, last_name, avatar, latitude, longitude}, ...]
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["Locations"],
        summary="Локации контактов",
        description=(
            "Возвращает список локаций пользователей, которые находятся в принятых контактах "
            "с текущим пользователем (is_accepted=true)."
        ),
        responses={
            200: ContactLocationItemSerializer(many=True),
            401: OpenApiResponse(description="Не авторизован."),
        },
    )
    def get(self, request, *args, **kwargs):
        user = request.user

        # Получаем контакты, где пользователь — отправитель или получатель, и контакт принят
        contacts_qs = Contact.objects.filter(
            (models.Q(from_user=user) | models.Q(to_user=user)),
            is_accepted=True
        ).select_related("from_user__profile", "to_user__profile")

        results = []
        for contact in contacts_qs:
            # определяем "соседа" - другого участника контакта
            if contact.from_user_id == user.id:
                other = contact.to_user
            else:
                other = contact.from_user

            # profile may not exist theoretically, используем get_or_none-like
            try:
                profile = other.profile
                first_name = profile.first_name
                last_name = profile.last_name
                avatar = profile.avatar.url if profile.avatar else None
            except Profile.DoesNotExist:
                first_name = None
                last_name = None
                avatar = None

            # location may be absent
            try:
                loc = other.location  # OneToOneField -> reverse name 'location'
                latitude = loc.latitude
                longitude = loc.longitude
            except Location.DoesNotExist:
                latitude = None
                longitude = None

            item = {
                "contact_id": contact.id,
                "first_name": first_name,
                "last_name": last_name,
                "avatar": avatar,
                "latitude": latitude,
                "longitude": longitude,
            }
            results.append(item)

        serializer = ContactLocationItemSerializer(results, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)