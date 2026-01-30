from django.db.models import Count, Avg, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Hospital
from .serializers import (
    HospitalSerializer, HospitalListSerializer, HospitalSearchSerializer,
    HospitalStatsSerializer, NearestHospitalSerializer
)


class HospitalViewSet(viewsets.ModelViewSet):
    """ViewSet cho quản lý bệnh viện"""
    queryset = Hospital.objects.filter(is_active=True)
    permission_classes = [AllowAny]  # Cho phép truy cập công khai
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['hospital_type', 'district', 'main_specialty', 'emergency_services']
    search_fields = ['name', 'name_en', 'address', 'phone']
    ordering_fields = ['name', 'created_at', 'capacity']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return HospitalListSerializer
        return HospitalSerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        """API tìm kiếm nâng cao - dùng GET để tránh CSRF"""
        if request.query_params:
            data = {
                'query': request.query_params.get('query'),
                'district': request.query_params.get('district'),
                'hospital_type': request.query_params.get('hospital_type'),
                'specialty': request.query_params.get('specialty'),
                'emergency_only': request.query_params.get('emergency_only') == 'true',
                'latitude': request.query_params.get('latitude'),
                'longitude': request.query_params.get('longitude'),
                'radius': float(request.query_params.get('radius') or 5),
            }
        else:
            serializer = HospitalSearchSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            data = serializer.validated_data

        queryset = self.get_queryset()

        # Tìm kiếm theo từ khóa
        if data.get('query'):
            queryset = queryset.filter(
                Q(name__icontains=data['query']) |
                Q(name_en__icontains=data['query']) |
                Q(address__icontains=data['query'])
            )

        # Lọc theo quận
        if data.get('district'):
            queryset = queryset.filter(district=data['district'])

        # Lọc theo loại bệnh viện
        if data.get('hospital_type'):
            queryset = queryset.filter(hospital_type=data['hospital_type'])

        # Lọc theo chuyên khoa
        if data.get('specialty'):
            queryset = queryset.filter(
                Q(main_specialty=data['specialty']) |
                Q(specialties__contains=[data['specialty']])
            )

        # Chỉ hiển thị bệnh viện có cấp cứu
        if data.get('emergency_only'):
            queryset = queryset.filter(emergency_services=True)

        results = list(queryset)

        # GIS: Tìm kiếm theo vị trí với spatial analysis (Python calculation)
        if data.get('latitude') and data.get('longitude'):
            lat = float(data['latitude'])
            lng = float(data['longitude'])
            radius = float(data.get('radius', 5.0))
            
            # Filter and sort by distance using Python
            filtered_results = []
            import math
            
            for hospital in results:
                if hospital.latitude is not None and hospital.longitude is not None:
                    # Haversine formula
                    dlat = math.radians(hospital.latitude - lat)
                    dlon = math.radians(hospital.longitude - lng)
                    a = math.sin(dlat/2) * math.sin(dlat/2) + \
                        math.cos(math.radians(lat)) * math.cos(math.radians(hospital.latitude)) * \
                        math.sin(dlon/2) * math.sin(dlon/2)
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                    d = 6371 * c # Radius of earth in km
                    
                    if d <= radius:
                        hospital.distance_val = d
                        filtered_results.append(hospital)
            
            # Sort by distance
            filtered_results.sort(key=lambda x: x.distance_val)
            results = filtered_results

        serializer_class = self.get_serializer_class()
        # Serialize list of objects
        serialized_data = serializer_class(results, many=True, context={'request': request}).data
        return Response(serialized_data)

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Tìm bệnh viện gần vị trí hiện tại"""
        try:
            lat = float(request.query_params.get('lat'))
            lng = float(request.query_params.get('lng'))
            radius = float(request.query_params.get('radius', 5.0))
        except (ValueError, TypeError):
            return Response(
                {'error': 'Vui lòng cung cấp tọa độ lat, lng và radius hợp lệ'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all active hospitals with coordinates
        hospitals = Hospital.objects.filter(
            is_active=True,
            latitude__isnull=False,
            longitude__isnull=False
        )

        # Calculate distance in Python
        import math
        nearby_hospitals = []
        
        for hospital in hospitals:
            dlat = math.radians(hospital.latitude - lat)
            dlon = math.radians(hospital.longitude - lng)
            a = math.sin(dlat/2) * math.sin(dlat/2) + \
                math.cos(math.radians(lat)) * math.cos(math.radians(hospital.latitude)) * \
                math.sin(dlon/2) * math.sin(dlon/2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            d = 6371 * c # Distance in km
            
            if d <= radius:
                hospital.distance_val = d
                nearby_hospitals.append(hospital)

        # Sort by distance
        nearby_hospitals.sort(key=lambda x: x.distance_val)
        
        # Limit to 20
        nearby_hospitals = nearby_hospitals[:20]

        serializer = HospitalListSerializer(nearby_hospitals, many=True, context={'request': request})
        # Inject distance into response if needed, for now just returning sorted list
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def nearest(self, request):
        """Tìm bệnh viện gần nhất"""
        serializer = NearestHospitalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        lat = data['latitude']
        lng = data['longitude']
        limit = data['limit']
        max_distance = data['max_distance']

        hospitals = Hospital.objects.filter(
            is_active=True,
            latitude__isnull=False,
            longitude__isnull=False
        )

        import math
        processed_hospitals = []
        
        for hospital in hospitals:
            dlat = math.radians(hospital.latitude - lat)
            dlon = math.radians(hospital.longitude - lng)
            a = math.sin(dlat/2) * math.sin(dlat/2) + \
                math.cos(math.radians(lat)) * math.cos(math.radians(hospital.latitude)) * \
                math.sin(dlon/2) * math.sin(dlon/2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            d = 6371 * c # km
            
            if d <= max_distance:
                # Add dynamic distance attribute for the serializer or response
                # We can't easily add to serializer without modifying it to accept context or extra fields
                # So we structure the response manually or annotating the object won't work with standard fields easily
                processed_hospitals.append({
                    'hospital': hospital,
                    'distance': d
                })

        # Sort
        processed_hospitals.sort(key=lambda x: x['distance'])
        processed_hospitals = processed_hospitals[:limit]

        results = []
        for item in processed_hospitals:
            hospital = item['hospital']
            dist_km = item['distance']
            
            hospital_data = HospitalListSerializer(hospital, context={'request': request}).data
            hospital_data['distance'] = {
                'km': round(dist_km, 2),
                'm': round(dist_km * 1000, 0)
            }
            results.append(hospital_data)

        return Response(results)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Thống kê bệnh viện"""
        try:
            queryset = Hospital.objects.filter(is_active=True)
            total = queryset.count()

            # Thống kê theo loại
            by_type = {}
            for htype, hname in Hospital.HOSPITAL_TYPES:
                by_type[htype] = queryset.filter(hospital_type=htype).count()

            # Thống kê theo quận
            by_district = {}
            for dcode, dname in Hospital.DISTRICTS:
                by_district[dcode] = queryset.filter(district=dcode).count()

            # Thống kê theo chuyên khoa
            by_specialty = {}
            for scode, sname in Hospital.SPECIALTIES:
                by_specialty[scode] = queryset.filter(main_specialty=scode).count()

            stats = {
                'total_hospitals': total,
                'by_type': by_type,
                'by_district': by_district,
                'by_specialty': by_specialty,
                'emergency_count': queryset.filter(emergency_services=True).count(),
            }

            avg_cap = queryset.filter(capacity__isnull=False).aggregate(avg=Avg('capacity'))
            stats['average_capacity'] = round(avg_cap['avg'] or 0, 1)

            return Response(stats)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def districts(self, request):
        """Danh sách các quận/huyện có bệnh viện"""
        districts = Hospital.objects.filter(
            is_active=True
        ).values('district').distinct().order_by('district')

        result = []
        for item in districts:
            district_code = item['district']
            district_name = dict(Hospital.DISTRICTS).get(district_code, district_code)
            count = Hospital.objects.filter(district=district_code, is_active=True).count()
            result.append({
                'code': district_code,
                'name': district_name,
                'hospital_count': count
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def specialties(self, request):
        """Danh sách các chuyên khoa"""
        specialties = []
        for code, name in Hospital.SPECIALTIES:
            # Đếm bệnh viện theo chuyên khoa chính
            count_by_main = Hospital.objects.filter(
                main_specialty=code,
                is_active=True
            ).count()

            # Đếm bệnh viện có chuyên khoa trong danh sách JSON
            count_by_specialties = 0
            try:
                count_by_specialties = Hospital.objects.filter(
                    specialties__icontains=f'"{code}"',
                    is_active=True
                ).exclude(main_specialty=code).count()
            except:
                pass  # JSON query có thể không hoạt động trên SQLite

            total_count = count_by_main + count_by_specialties

            specialties.append({
                'code': code,
                'name': name,
                'hospital_count': total_count
            })

        return Response(specialties)

# Template views removed - using React frontend
# Django now serves only REST APIs for GIS data
