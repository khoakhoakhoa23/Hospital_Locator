# 🗺️ **HỆ THỐNG THÔNG TIN ĐỊA LÝ (GIS) - BẢN ĐỒ BỆNH VIỆN TP.HCM**

## 📋 **Tổng quan về GIS trong dự án**

Dự án này triển khai một hệ thống thông tin địa lý hoàn chỉnh cho việc quản lý và trực quan hóa dữ liệu bệnh viện TP.HCM, sử dụng các công nghệ lập trình hiện đại để xử lý dữ liệu không gian.

## 🛰️ **Các thành phần GIS chính**

### **1. Coordinate Reference System (CRS)**
- **WGS84 (EPSG:4326)**: Hệ tọa độ địa lý tiêu chuẩn
- **Vĩ độ (Latitude)**: Từ -90° đến +90°
- **Kinh độ (Longitude)**: Từ -180° đến +180°

### **2. Spatial Data Types**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [longitude, latitude],  // GIS Standard: [x, y]
    "crs": {
      "type": "name",
      "properties": {
        "name": "EPSG:4326"
      }
    }
  },
  "properties": {
    "name": "Bệnh viện Chợ Rẫy",
    "type": "public",
    "district": "quan5"
  }
}
```

### **3. Spatial Analysis Functions**

#### **Haversine Distance Formula**
```python
# Tính khoảng cách giữa 2 điểm trên trái đất (km)
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c

    return distance
```

#### **Spatial Buffer Analysis**
```sql
-- Approximation trong SQL cho hiệu suất
SELECT *,
    111.045 * DEGREES(ACOS(COS(RADIANS(user_lat))
    * COS(RADIANS(latitude)) * COS(RADIANS(longitude - user_lng))
    + SIN(RADIANS(user_lat))
    * SIN(RADIANS(latitude)))) as distance_km
FROM hospitals
WHERE distance_km <= radius_km
ORDER BY distance_km;
```

### **4. GeoJSON Standard**

#### **Point Geometry**
```json
{
  "type": "Point",
  "coordinates": [106.660172, 10.762622]  // [longitude, latitude]
}
```

#### **Feature Collection**
```json
{
  "type": "FeatureCollection",
  "crs": {
    "type": "name",
    "properties": { "name": "EPSG:4326" }
  },
  "features": [...]
}
```

## 🛠️ **Công nghệ GIS sử dụng**

### **Backend GIS Processing**
- **Python/Django**: Xử lý logic GIS
- **PostgreSQL**: Database spatial với indexing
- **Haversine Formula**: Tính toán khoảng cách địa lý
- **REST API**: Cung cấp dữ liệu spatial qua GeoJSON

### **Frontend GIS Visualization**
- **Leaflet.js**: Thư viện bản đồ JavaScript
- **OpenStreetMap**: Dữ liệu bản đồ miễn phí
- **GeoJSON**: Format trao đổi dữ liệu spatial
- **Real-time rendering**: Hiển thị dữ liệu GIS động

### **Spatial Queries & Analysis**
- **Buffer Analysis**: Tìm bệnh viện trong bán kính
- **Nearest Neighbor**: Tìm bệnh viện gần nhất
- **Spatial Filtering**: Lọc theo khu vực địa lý
- **Distance Calculation**: Tính khoảng cách chính xác

## 📊 **Ứng dụng GIS trong dự án**

### **1. Quy hoạch đô thị**
- Phân tích mật độ bệnh viện theo quận
- Xác định vùng thiếu dịch vụ y tế
- Hỗ trợ quyết định xây dựng cơ sở mới

### **2. Quản lý tài nguyên**
- Theo dõi vị trí các cơ sở y tế
- Phân tích vùng phục vụ của từng bệnh viện
- Tối ưu hóa phân bố nguồn lực

### **3. Hỗ trợ ra quyết định**
- Tìm bệnh viện gần nhất trong tình huống khẩn cấp
- Phân tích khả năng tiếp cận dịch vụ y tế
- Đánh giá hiệu quả hệ thống y tế

## 🎯 **Tính năng GIS triển khai**

### ✅ **Spatial Data Management**
- Lưu trữ tọa độ WGS84
- Indexing cho truy vấn hiệu quả
- Validation dữ liệu địa lý

### ✅ **Spatial Analysis**
- Distance calculation
- Buffer analysis
- Nearest neighbor search
- Spatial aggregation

### ✅ **Geospatial Visualization**
- Interactive maps
- Multiple layers
- Real-time updates
- Responsive design

### ✅ **Geocoding & Reverse Geocoding**
- Address to coordinates
- GPS location services
- Route optimization

## 🔧 **Cách mở rộng GIS**

### **1. PostGIS Integration**
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'hospital_locator_db',
        # ... other settings
    }
}

# models.py
from django.contrib.gis.db import models as gis_models

class Hospital(models.Model):
    location = gis_models.PointField(srid=4326)
    # Spatial queries với PostGIS
    nearby = Hospital.objects.filter(
        location__distance_lte=(user_location, D(km=5))
    )
```

### **2. Advanced Spatial Functions**
- **Intersection**: Xác định overlap giữa các vùng
- **Union**: Kết hợp các khu vực
- **Centroid**: Tính tâm của vùng
- **Area calculation**: Tính diện tích

### **3. Map Services**
- **WMS/WFS**: Web Map Services
- **Tile servers**: Custom map tiles
- **Geoprocessing**: Server-side analysis

## 📈 **Hiệu suất GIS**

### **Spatial Indexing**
```sql
CREATE INDEX idx_hospital_location ON hospitals USING GIST (location);
CREATE INDEX idx_hospital_lat_lng ON hospitals (latitude, longitude);
```

### **Query Optimization**
- Sử dụng spatial indexes
- Haversine approximation cho performance
- Pagination cho large datasets
- Caching cho frequent queries

## 🌟 **Lợi ích của GIS trong dự án**

1. **Trực quan hóa**: Bản đồ tương tác dễ hiểu
2. **Phân tích**: Insights về phân bố dịch vụ y tế
3. **Hiệu quả**: Tìm kiếm nhanh chóng bệnh viện gần nhất
4. **Quyết định**: Hỗ trợ lập kế hoạch đô thị
5. **Khả năng mở rộng**: Dễ dàng thêm tính năng GIS mới

---

**🎯 Dự án này chứng minh việc ứng dụng lập trình GIS vào bài toán thực tế, kết nối dữ liệu vị trí với thông tin chuyên môn để tạo ra giải pháp hữu ích cho cộng đồng.**
