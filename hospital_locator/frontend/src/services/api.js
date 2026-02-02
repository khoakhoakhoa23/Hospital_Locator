import axios from 'axios';

// GIS API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// External routing API (OSRM - Open Source Routing Machine)
const ROUTING_API_URL = 'https://router.project-osrm.org';

// Create axios instance với GIS-specific config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// GIS API Endpoints
export const hospitalAPI = {
  // Lấy tất cả bệnh viện
  getHospitals: (params = {}) => api.get('/hospitals/', { params }),

  // Tạo bệnh viện mới
  createHospital: (data) => api.post('/hospitals/', data),

  // Lấy chi tiết bệnh viện
  getHospital: (id) => api.get(`/hospitals/${id}/`),

  // Tìm bệnh viện gần vị trí (GIS Spatial Query)
  getNearbyHospitals: (lat, lng, radius = 5) =>
    api.get('/hospitals/nearby/', {
      params: { lat, lng, radius }
    }),

  // Tìm kiếm nâng cao với spatial filters (dùng GET thay vì POST để tránh CSRF)
  searchHospitals: (searchData) =>
    api.get('/hospitals/search/', { params: searchData }),

  // Tìm bệnh viện gần nhất (GIS Nearest Neighbor)
  getNearestHospitals: (lat, lng, limit = 5, maxDistance = 10) =>
    api.post('/hospitals/nearest/', {
      latitude: lat,
      longitude: lng,
      limit,
      max_distance: maxDistance
    }),

  // Thống kê GIS
  getStatistics: () => api.get('/hospitals/stats/'),

  // Lấy danh sách quận (GIS Administrative Divisions)
  getDistricts: () => api.get('/hospitals/districts/'),

  // Lấy danh sách chuyên khoa
  getSpecialties: () => api.get('/hospitals/specialties/'),
};

// Routing API - Tìm đường đi (using OSRM)
export const routingAPI = {
  // Lấy chỉ đường từ vị trí user đến bệnh viện
  getDirections: async (startLat, startLng, endLat, endLng, mode = 'driving') => {
    const profile = mode === 'walking' ? 'foot' : mode === 'bicycling' ? 'bike' : 'driving';
    const url = `${ROUTING_API_URL}/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}`;
    
    try {
      const response = await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true,
          alternatives: true
        }
      });
      
      if (response.data.code === 'Ok') {
        return {
          success: true,
          route: response.data.routes[0],
          geometry: response.data.routes[0].geometry,
          distance: response.data.routes[0].distance, // meters
          duration: response.data.routes[0].duration, // seconds
          steps: response.data.routes[0].legs[0].steps
        };
      }
      return { success: false, error: 'No route found' };
    } catch (error) {
      console.error('Routing API error:', error);
      return { success: false, error: error.message };
    }
  },

  // Tìm nhiều tuyến đường
  getMultipleRoutes: async (startLat, startLng, endLat, endLng, mode = 'driving') => {
    const profile = mode === 'walking' ? 'foot' : mode === 'bicycling' ? 'bike' : 'driving';
    const url = `${ROUTING_API_URL}/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}`;
    
    try {
      const response = await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true,
          alternatives: true,
          number_of_alternatives: 3
        }
      });
      
      if (response.data.code === 'Ok') {
        return {
          success: true,
          routes: response.data.routes.map((route, index) => ({
            id: index,
            geometry: route.geometry,
            distance: route.distance,
            duration: route.duration,
            color: ['#28a745', '#007bff', '#dc3545'][index] || '#6c757d'
          }))
        };
      }
      return { success: false, error: 'No routes found' };
    } catch (error) {
      console.error('Routing API error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Utility functions for GIS operations
export const gisUtils = {
  // Tính khoảng cách giữa 2 điểm (Haversine formula)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // kilometers
  },

  // Format khoảng cách
  formatDistance: (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  },

  // Format thời gian
  formatDuration: (seconds) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} giờ ${remainingMinutes} phút`;
  },

  // Validate tọa độ WGS84
  isValidCoordinate: (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  // Format tọa độ cho display
  formatCoordinate: (coord, precision = 6) => {
    return parseFloat(coord).toFixed(precision);
  },

  // Tạo GeoJSON Point
  createGeoJSONPoint: (lng, lat, properties = {}) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    properties: {
      ...properties,
      crs: 'EPSG:4326'
    }
  })
};

// Hospital Recommendation Engine
export const hospitalRecommendation = {
  // Tìm bệnh viện phù hợp nhất dựa trên nhiều tiêu chí
  findBestHospital: (userLocation, hospitals, criteria = {}) => {
    if (!hospitals.length || !userLocation.lat || !userLocation.lng) {
      return null;
    }

    const {
      specialty = null,        // Chuyên khoa mong muốn
      hospitalType = null,     // Loại bệnh viện (public/private/clinic)
      emergency = false,       // Cần dịch vụ cấp cứu
      maxDistance = 50,        // Bán kính tối đa (km)
      preferPublic = false,    // Ưu tiên bệnh viện công lập
      rating = null            // Đánh giá (nếu có)
    } = criteria;

    // Tính điểm cho từng bệnh viện
    const scoredHospitals = hospitals.map(hospital => {
      if (!hospital.latitude || !hospital.longitude) {
        return null;
      }

      const distance = gisUtils.calculateDistance(
        userLocation.lat, userLocation.lng,
        hospital.latitude, hospital.longitude
      );

      // Bỏ qua nếu quá xa
      if (distance > maxDistance) {
        return null;
      }

      let score = 100;
      let reasons = [];

      // Ưu tiên khoảng cách (càng gần càng tốt)
      score -= distance * 2;

      // Ưu tiên bệnh viện công lập
      if (preferPublic && hospital.hospital_type === 'public') {
        score += 20;
        reasons.push('Bệnh viện công lập');
      }

      // Ưu tiên bệnh viện có cấp cứu
      if (emergency && hospital.emergency_services) {
        score += 30;
        reasons.push('Có dịch vụ cấp cứu');
      } else if (emergency && !hospital.emergency_services) {
        score -= 50; // Phạt nặng nếu cần cấp cứu nhưng bệnh viện không có
      }

      // Ưu tiên đúng chuyên khoa
      if (specialty) {
        if (hospital.main_specialty === specialty) {
          score += 25;
          reasons.push(`Đúng chuyên khoa ${specialty}`);
        } else if (hospital.specialties && hospital.specialties.includes(specialty)) {
          score += 15;
          reasons.push(`Có chuyên khoa ${specialty}`);
        }
      }

      // Ưu tiên đúng loại bệnh viện
      if (hospitalType && hospital.hospital_type === hospitalType) {
        score += 10;
        reasons.push(`Đúng loại ${hospitalType}`);
      }

      // Ưu tiên bệnh viện lớn (có capacity)
      if (hospital.capacity && hospital.capacity > 500) {
        score += 5;
        reasons.push('Quy mô lớn');
      }

      return {
        ...hospital,
        distance: distance,
        score: score,
        reasons: reasons
      };
    }).filter(h => h !== null);

    // Sắp xếp theo điểm giảm dần
    scoredHospitals.sort((a, b) => b.score - a.score);

    return scoredHospitals;
  },

  // Lọc và sắp xếp bệnh viện theo nhiều tiêu chí
  sortByCriteria: (hospitals, userLocation, sortBy = 'distance') => {
    if (!hospitals.length) return [];

    const withDistance = hospitals.map(h => ({
      ...h,
      distance: h.latitude && h.longitude && userLocation.lat && userLocation.lng
        ? gisUtils.calculateDistance(userLocation.lat, userLocation.lng, h.latitude, h.longitude)
        : Infinity
    }));

    switch (sortBy) {
      case 'distance':
        return withDistance.sort((a, b) => a.distance - b.distance);
      case 'emergency':
        return withDistance.sort((a, b) => {
          if (a.emergency_services && !b.emergency_services) return -1;
          if (!a.emergency_services && b.emergency_services) return 1;
          return a.distance - b.distance;
        });
      case 'type':
        const typeOrder = { public: 0, private: 1, clinic: 2 };
        return withDistance.sort((a, b) => 
          (typeOrder[a.hospital_type] || 3) - (typeOrder[b.hospital_type] || 3)
        );
      case 'name':
        return withDistance.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return withDistance;
    }
  }
};

export default api;

