from rest_framework import serializers
from .models import Hospital


# HospitalImage serializer removed - focusing on GIS core features


class HospitalSerializer(serializers.ModelSerializer):
    """Serializer GIS cho bệnh viện với coordinate system"""
    hospital_type_display = serializers.CharField(read_only=True)
    district_display = serializers.CharField(read_only=True)
    main_specialty_display = serializers.CharField(read_only=True)
    full_address = serializers.CharField(read_only=True)

    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'name_en', 'hospital_type', 'hospital_type_display',
            'address', 'district', 'district_display', 'ward', 'full_address',
            'phone', 'email', 'website', 'facebook',
            'main_specialty', 'main_specialty_display', 'specialties', 'description',
            'latitude', 'longitude',
            'working_hours', 'emergency_services', 'ambulance_services',
            'capacity', 'doctors_count', 'nurses_count',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HospitalListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách bệnh viện"""
    hospital_type_display = serializers.CharField(read_only=True)
    district_display = serializers.CharField(read_only=True)
    main_specialty_display = serializers.CharField(read_only=True)
    full_address = serializers.CharField(read_only=True)

    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'name_en', 'hospital_type', 'hospital_type_display',
            'address', 'district', 'district_display', 'ward', 'full_address',
            'phone', 'email', 'website', 'facebook',
            'main_specialty', 'main_specialty_display', 'specialties', 'description',
            'latitude', 'longitude',
            'working_hours', 'emergency_services', 'ambulance_services',
            'capacity', 'doctors_count', 'nurses_count',
            'is_active', 'created_at', 'updated_at'
        ]


class HospitalSearchSerializer(serializers.Serializer):
    """Serializer cho tìm kiếm bệnh viện"""
    query = serializers.CharField(required=False, allow_blank=True)
    district = serializers.ChoiceField(
        choices=[(k, v) for k, v in Hospital.DISTRICTS],
        required=False
    )
    hospital_type = serializers.ChoiceField(
        choices=Hospital.HOSPITAL_TYPES,
        required=False
    )
    specialty = serializers.ChoiceField(
        choices=Hospital.SPECIALTIES,
        required=False
    )
    emergency_only = serializers.BooleanField(default=False)
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)
    radius = serializers.FloatField(default=5.0)  # km


class HospitalStatsSerializer(serializers.Serializer):
    """Serializer cho thống kê bệnh viện"""
    total_hospitals = serializers.IntegerField()
    by_type = serializers.DictField()
    by_district = serializers.DictField()
    by_specialty = serializers.DictField()
    emergency_count = serializers.IntegerField()
    average_capacity = serializers.FloatField()


class NearestHospitalSerializer(serializers.Serializer):
    """Serializer cho tìm bệnh viện gần nhất"""
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    limit = serializers.IntegerField(default=5, min_value=1, max_value=20)
    max_distance = serializers.FloatField(default=10.0)  # km
