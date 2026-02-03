from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import Service, ServicePoint
from .serializers import ServiceSerializer, ServicePointSerializer

class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list/retrieve для гос. служб. Включены связанные пункты через сериализатор.
    """
    queryset = Service.objects.all().order_by("name")
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]

class ServicePointViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list/retrieve для пунктов. Поддерживает фильтрацию по city и service через query params:
    /api/service-points/?city=Bishkek
    /api/service-points/?service=3  (id службы)
    """
    queryset = ServicePoint.objects.select_related("service").all().order_by("city", "street")
    serializer_class = ServicePointSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        city = self.request.query_params.get("city")
        service_id = self.request.query_params.get("service")
        if city:
            qs = qs.filter(city__iexact=city)
        if service_id:
            qs = qs.filter(service_id=service_id)
        return qs