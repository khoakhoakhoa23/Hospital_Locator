# 🗺️ Hospital Locator - Bản đồ Bệnh viện TP.HCM

## 📖 Giới thiệu

Dự án xây dựng hệ thống thông tin địa lý (GIS) để quản lý và tra cứu thông tin các bệnh viện, phòng khám trên địa bàn Thành phố Hồ Chí Minh.

## 🏗️ Kiến trúc

```
hospital_locator/
├── backend/                 # Django REST API
│   ├── hospitals/          # Hospital app
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API views
│   │   ├── serializers.py  # REST serializers
│   │   └── urls.py         # API routes
│   ├── settings.py         # Django settings
│   └── manage.py
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── MapContainer.jsx
│   │   │   ├── SearchFilters.jsx
│   │   │   └── HospitalPopup.jsx
│   │   ├── pages/          # Main pages
│   │   │   ├── MapPage.jsx
│   │   │   ├── HospitalsPage.jsx
│   │   │   └── HospitalDetailPage.jsx
│   │   └── services/       # API services
│   │       └── api.js
│   └── public/
└── README.md
```

## 🚀 Công nghệ sử dụng

### Backend
- **Django 5.2** - Web framework
- **Django REST Framework** - REST API
- **SQLite** - Database (có thể mở rộng sang PostgreSQL)
- **CORS Headers** - Cross-origin resource sharing

### Frontend
- **React 18** - UI framework
- **Material-UI (MUI)** - Component library
- **React-Leaflet** - Interactive maps
- **Leaflet.js** - Map visualization
- **Axios** - HTTP client
- **React Router** - Navigation

### GIS Features
- **WGS84 Coordinate System** - Tiêu chuẩn tọa độ GPS
- **Haversine Formula** - Tính khoảng cách
- **OpenStreetMap** - Dữ liệu bản đồ
- **OSRM API** - Chỉ đường

## 📦 Cài đặt

### Yêu cầu
- Python 3.11+
- Node.js 18+
- npm hoặc yarn

### Cài đặt Backend

```bash
cd hospital_locator/backend

# Tạo virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy migrations
python manage.py migrate

# Import dữ liệu mẫu (109 bệnh viện)
python import_data.py

# Chạy server
python manage.py runserver
```

### Cài đặt Frontend

```bash
cd hospital_locator/frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm start
```

## 🔗 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/hospitals/` | Danh sách bệnh viện |
| GET | `/api/hospitals/{id}/` | Chi tiết bệnh viện |
| GET | `/api/hospitals/search/` | Tìm kiếm nâng cao |
| GET | `/api/hospitals/nearby/` | Bệnh viện gần đây |
| POST | `/api/hospitals/nearest/` | Bệnh viện gần nhất |
| GET | `/api/hospitals/stats/` | Thống kê |
| GET | `/api/hospitals/districts/` | Danh sách quận |
| GET | `/api/hospitals/specialties/` | Danh sách chuyên khoa |

## 🗺️ Tính năng

### Bản đồ tương tác
- Hiển thị vị trí bệnh viện trên bản đồ
- Marker màu theo loại (Công lập/Tư nhân/Phòng khám)
- Hiển thị thông tin khi click vào marker
- Tìm đường đến bệnh viện

### Tìm kiếm nâng cao
- Tìm theo tên/địa chỉ
- Lọc theo quận/huyện
- Lọc theo loại bệnh viện
- Lọc theo chuyên khoa
- Tìm theo bán kính (spatial search)

### Thống kê
- Tổng số bệnh viện
- Phân loại theo hình thức
- Bệnh viện có dịch vụ cấp cứu

## 📊 Thống kê dữ liệu

| Loại | Số lượng |
|------|----------|
| Tổng số | 109 |
| Bệnh viện công lập | ~28 |
| Bệnh viện tư nhân | ~35 |
| Phòng khám | ~46 |
| Có cấp cứu 24/7 | ~39 |

## 🛠️ Phát triển

```bash
# Backend
cd backend
python manage.py shell

# Frontend
cd frontend
npm start
```

## 📝 License

MIT License

## 👤 Tác giả

[Your Name]

## 📞 Liên hệ

[Your Email]



