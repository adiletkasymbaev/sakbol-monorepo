from rest_framework import serializers
from .models import Service, ServicePoint

class ServicePointSerializer(serializers.ModelSerializer):
    service = serializers.StringRelatedField(read_only=True)  # отображать имя службы

    class Meta:
        model = ServicePoint
        fields = [
            "id",
            "service",
            "additional",
            "city",
            "street",
            "house_number",
        ]
        read_only_fields = fields

class ServiceSerializer(serializers.ModelSerializer):
    # включаем связанные пункты
    points = ServicePointSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "points",  # связанные ServicePoint
        ]
        read_only_fields = fields