# Hospital Locator - Tích hợp thư viện GIS

## 🏗️ Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND (Port 3000)                 │
├─────────────────────────────────────────────────────────────────┤
│  React.js          │  Leaflet/React-Leaflet  │  Material-UI     │
│  React Router      │  Axios                  │  Chart.js        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                    DJANGO BACKEND (Port 8000)                   │
├─────────────────────────────────────────────────────────────────┤
│  Django REST Framework  │  Django Filters  │  CORS              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL/POSTGIS                         │
├─────────────────────────────────────────────────────────────────┤
│  Spatial Database  │  GeoDjango ORM  │  Spatial Queries         │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Thư viện Frontend (React)

### Cài đặt
```bash
cd hospital_locator/frontend
npm install
```

### Các thư viện chính

| Thư viện | Phiên bản | Mục đích |
|----------|-----------|----------|
| `react` | ^18.2.0 | Framework chính |
| `react-dom` | ^18.2.0 | React DOM rendering |
| `react-router-dom` | ^6.20.0 | Client-side routing |
| `leaflet` | ^1.9.4 | Thư viện bản đồ |
| `react-leaflet` | ^4.2.1 | React wrapper cho Leaflet |
| `@mui/material` | ^5.14.0 | UI components |
| `@mui/icons-material` | ^5.14.0 | Icons |
| `axios` | ^1.6.0 | HTTP client |
| `recharts` | ^2.9.0 | Charts/Statistics |
| `leaflet-geosearch` | ^3.11.0 | Tìm kiếm địa điểm |

### Cấu trúc Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx        # Navigation bar
│   │   ├── MapContainer.jsx  # Bản đồ GIS chính
│   │   ├── SearchFilters.jsx # Tìm kiếm & lọc
│   │   └── HospitalPopup.jsx # Popup thông tin bệnh viện
│   ├── pages/
│   │   ├── MapPage.jsx       # Trang bản đồ
│   │   ├── HospitalsPage.jsx # Danh sách bệnh viện
│   │   └── HospitalDetailPage.jsx # Chi tiết bệnh viện
│   ├── services/
│   │   └── api.js            # API service layer
│   ├── App.jsx               # Main app component
│   └── index.js              # Entry point
```

## 📦 Thư viện Backend (Django)

### Cài đặt
```bash
cd hospital_locator/backend
pip install -r requirements.txt
```

### Cấu trúc Backend
```
backend/
├── hospitals/
│   ├── models.py        # Hospital model với PointField
│   ├── views.py         # API viewsets (list, retrieve, nearby, stats)
│   ├── serializers.py   # GeoFeatureModelSerializer
│   ├── admin.py         # GISModelAdmin configuration
│   ├── urls.py          # App URL patterns
│   └── apps.py          # App configuration
├── settings.py          # Django settings với GIS config
├── urls.py              # Main URL routing
├── wsgi.py              # WSGI application
└── manage.py            # Django management
```

## 🔗 Tích hợp Frontend ↔ Backend

### 1. API Configuration (`frontend/src/services/api.js`)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const hospitalAPI = {
  // Lấy tất cả bệnh viện (GeoJSON)
  getAllHospitals: () => api.get('/hospitals/'),
  
  // Chi tiết 1 bệnh viện
  getHospitalById: (id) => api.get(`/hospitals/${id}/`),
  
  // Tìm kiếm & lọc
  searchHospitals: (params) => api.get('/hospitals/', { params }),
  
  // Tìm bệnh viện gần (GIS spatial query)
  getNearbyHospitals: (lat, lng, radius = 5) => 
    api.get(`/hospitals/nearby/?lat=${lat}&lng=${lng}&radius=${radius}`),
  
  // Tìm bệnh viện gần nhất
  getNearestHospital: (lat, lng) => 
    api.post('/hospitals/nearest/', { latitude: lat, longitude: lng }),
  
  // Thống kê
  getHospitalStats: () => api.get('/hospitals/stats/'),
  
  // Lấy danh sách quận/huyện
  getDistricts: () => api.get('/hospitals/districts/'),
};
```

### 2. Map Integration (`frontend/src/components/MapContainer.jsx`)

```jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons cho từng loại bệnh viện
const hospitalIcons = {
  public: new L.Icon({
    iconUrl: '/icons/hospital-public.png',
    iconSize: [30, 30],
  }),
  private: new L.Icon({
    iconUrl: '/icons/hospital-private.png',
    iconSize: [30, 30],
  }),
  clinic: new L.Icon({
    iconUrl: '/icons/clinic.png',
    iconSize: [25, 25],
  }),
};

function MapContainer({ hospitals, userLocation }) {
  return (
    <MapContainer center={[10.762622, 106.660172]} zoom={12}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap contributors'
      />
      
      {/* User location marker */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>Vị trí của bạn</Popup>
        </Marker>
      )}
      
      {/* Hospital markers */}
      {hospitals.map((hospital) => (
        <Marker
          key={hospital.id}
          position={[hospital.latitude, hospital.longitude]}
          icon={hospitalIcons[hospital.hospital_type]}
        >
          <Popup>
            <HospitalPopup hospital={hospital} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### 3. GIS Backend Views (`backend/hospitals/views.py`)

```python
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Hospital
from .serializers import HospitalSerializer

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    
    # Spatial query: Tìm bệnh viện gần
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        lat = float(request.query_params.get('lat'))
        lng = float(request.query_params.get('lng'))
        radius_km = float(request.query_params.get('radius', 5))
        
        user_location = Point(lng, lat, srid=4326)
        radius_m = radius_km * 1000
        
        # Spatial filtering với PostGIS
        hospitals = Hospital.objects.filter(
            location__distance_lte=(user_location, radius_m)
        ).annotate(
            distance=Distance('location', user_location)
        ).order_by('distance')
        
        serializer = self.get_serializer(hospitals, many=True)
        return Response(serializer.data)
    
    # Thống kê
    @action(detail=False, methods=['get'])
    def stats(self, request):
        stats = {
            'total': Hospital.objects.count(),
            'by_type': {
                'public': Hospital.objects.filter(hospital_type='public').count(),
                'private': Hospital.objects.filter(hospital_type='private').count(),
                'clinic': Hospital.objects.filter(hospital_type='clinic').count(),
            },
            'by_district': list(
                Hospital.objects.values('district')
                .annotate(count=models.Count('id'))
                .order_by('-count')
            ),
        }
        return Response(stats)
```

## 🗺️ GIS Features

### 1. Spatial Data Model
```python
from django.contrib.gis.db import models

class Hospital(models.Model):
    name = models.CharField(max_length=255)
    hospital_type = models.CharField(choices=[('public', 'Công lập'), ...])
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    # GIS Point Field (WGS84)
    location = models.PointField(srid=4326, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if self.latitude and self.longitude:
            self.location = Point(self.longitude, self.latitude, srid=4326)
        super().save(*args, **kwargs)
```

### 2. Spatial Queries
```python
# Tìm bệnh viện trong bán kính X km
from django.contrib.gis.db.models.functions import Distance

hospitals = Hospital.objects.annotate(
    distance=Distance('location', user_point)
).filter(
    distance__lte=radius_m
).order_by('distance')

# Tạo buffer zone
from django.contrib.gis.measure import D

buffer_area = user_location.buffer(1)  # 1km buffer

# Tìm bệnh viện trong vùng buffer
hospitals_in_area = Hospital.objects.filter(location__within=buffer_area)
```

## 🗂️ File cấu hình quan trọng

### 1. Backend Settings (`backend/settings.py`)
- Cấu hình PostGIS database
- GDAL/GEOS library paths
- CORS headers
- REST Framework settings

### 2. Frontend Environment (`.env`)
```
REACT_APP_API_URL=http://127.0.0.1:8000/api
REACT_APP_MAP_CENTER_LAT=10.762622
REACT_APP_MAP_CENTER_LNG=106.660172
REACT_APP_DEFAULT_RADIUS=5
```

## 🚀 Chạy dự án

### 1. Backend
```bash
cd hospital_locator/backend
python manage.py runserver 8000
```

### 2. Frontend
```bash
cd hospital_locator/frontend
npm start  # hoặc npm run dev
```

### 3. Truy cập
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin**: http://localhost:8000/admin/

## 📋 Ghi chú quan trọng

1. **GDAL Requirement**: GeoDjango yêu cầu GDAL library. Trên Windows, cài đặt từ OSGeo4W.
2. **PostGIS**: Để sử dụng đầy đủ spatial features, cần PostgreSQL với PostGIS extension.
3. **CORS**: Đã cấu hình CORS headers để frontend có thể giao tiếp với backend.
4. **Coordinate System**: Sử dụng WGS84 (EPSG:4326) - chuẩn GPS.
5. **Leaflet CRS**: Sử dụng L.CRS.EPSG4326 cho bản đồ với tọa độ địa lý thực.

