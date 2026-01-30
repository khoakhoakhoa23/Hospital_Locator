import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Chip, Button, Alert,
  CircularProgress, useTheme, useMediaQuery, Dialog,
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Card, CardContent,
  IconButton
} from '@mui/material';
import {
  MyLocation as LocationIcon, Refresh as RefreshIcon,
  Navigation as NavigationIcon,
  Close as CloseIcon, Route as RouteIcon
} from '@mui/icons-material';

// GIS Components
import MapContainer from '../components/MapContainer';
import SearchFilters from '../components/SearchFilters';
import HospitalPopup from '../components/HospitalPopup';

// GIS Services
import { hospitalAPI, routingAPI, gisUtils, hospitalRecommendation } from '../services/api';

const MapPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);

  // GIS State
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Routing state
  const [routingDialogOpen, setRoutingDialogOpen] = useState(false);
  const [selectedRouteHospital, setSelectedRouteHospital] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routingMode, setRoutingMode] = useState('driving');
  const [gettingRoute, setGettingRoute] = useState(false);

  // Recommendation state
  const [recommendationCriteria, setRecommendationCriteria] = useState({
    specialty: '',
    hospitalType: '',
    emergency: false,
    preferPublic: false,
    maxDistance: 10
  });
  const [recommendedHospital, setRecommendedHospital] = useState(null);

  // GIS Map reference
  const mapRef = useRef();

  // Load hospitals on component mount
  useEffect(() => {
    loadHospitals();
  }, []);

  // GIS: Load tất cả bệnh viện từ spatial database
  const loadHospitals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hospitalAPI.getHospitals();
      console.log('API Response:', response);

      // Handle different response formats
      let hospitalData = [];
      if (Array.isArray(response.data)) {
        hospitalData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        hospitalData = response.data.results;
      } else if (response.data.features && Array.isArray(response.data.features)) {
        hospitalData = response.data.features;
      }

      console.log('Hospitals loaded:', hospitalData.length);

      setHospitals(hospitalData);
      setFilteredHospitals(hospitalData);

      console.log('GIS Data loaded:', hospitalData.length, 'hospitals');
    } catch (err) {
      console.error('GIS API Error:', err);
      setError(`Không thể tải dữ liệu bệnh viện. ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setLoading(false);
    }
  };

  // GIS: Get user location using Geolocation API
  const getUserLocation = () => {
    // If we already have a location, zoom to it immediately for better UX
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 16);
    }

    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (!gisUtils.isValidCoordinate(latitude, longitude)) {
          setError('Tọa độ GPS không hợp lệ.');
          setLoading(false);
          return;
        }

        const location = { lat: latitude, lng: longitude };
        setUserLocation(location);
        setError(null);

        // GIS: Center map on user location
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }

        console.log('GIS User location:', location);
        setLoading(false);
      },
      (error) => {
        console.error('GIS Geolocation error:', error);
        let errorMessage = 'Không thể lấy vị trí hiện tại.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Không thể xác định vị trí hiện tại. Vui lòng kiểm tra kết nối mạng/GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Quá thời gian xác định vị trí. Vui lòng thử lại.';
            break;
          default:
            errorMessage = `Lỗi định vị: ${error.message}`;
        }

        // Don't show error if we already have a location (just a background refresh failed)
        if (!userLocation) {
          setError(errorMessage);
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // GIS: Handle manual location selection
  const handleManualLocationSelect = (latlng) => {
    const location = { lat: latlng.lat, lng: latlng.lng };
    setUserLocation(location);
    setIsSelectingLocation(false);

    // Zoom to selected location
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 16);
    }

    // Auto-calculate route if dialog is open
    if (selectedRouteHospital) {
      calculateRoute(location, selectedRouteHospital);
    }
  };


  // GIS: Search hospitals with filters
  const handleSearch = async (filters) => {
    setLoading(true);
    setError(null);

    try {
      // Determine if this is a spatial search or regular search
      const isSpatialSearch = filters.latitude && filters.longitude;

      let response;
      if (isSpatialSearch) {
        // Spatial search with coordinates and radius
        response = await hospitalAPI.searchHospitals({
          latitude: filters.latitude,
          longitude: filters.longitude,
          radius: filters.radius
        });
      } else {
        // Regular search with text and filters
        response = await hospitalAPI.searchHospitals({
          query: filters.query,
          district: filters.district || undefined,
          hospital_type: filters.hospital_type || undefined,
          specialty: filters.specialty || undefined,
          emergency_only: filters.emergency_only || undefined
        });
      }

      console.log('Search response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        setFilteredHospitals(response.data);

        if (response.data.length === 0) {
          setError('Không tìm thấy bệnh viện nào phù hợp với tìm kiếm.');
        } else {
          setError(null);
        }
      } else {
        console.error('Invalid search response format:', response.data);
        setError('Định dạng dữ liệu không hợp lệ.');
        setFilteredHospitals([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.detail || 'Lỗi tìm kiếm: ' + (error.message || 'Unknown error'));
      setFilteredHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  // GIS: Open routing dialog
  const openRoutingDialog = (hospital) => {
    setSelectedRouteHospital(hospital);
    setRouteInfo(null);
    setRoutingDialogOpen(true);

    // Auto calculate if location is available
    if (userLocation) {
      calculateRoute(userLocation, hospital);
    }
  };

  // GIS: Check for Rush Hour in Vietnam (Mon-Fri: 7-9h, 16-19h)
  const checkRushHour = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 is Sunday

    // Skip weekends
    if (day === 0 || day === 6) return false;

    // Morning rush: 7:00 - 9:00
    if (hour >= 7 && hour < 9) return true;

    // Evening rush: 16:00 - 19:00
    if (hour >= 16 && hour < 19) return true;

    return false;
  };

  const [isRushHour, setIsRushHour] = useState(false);

  // GIS: Get directions from user location to hospital
  const getDirections = async () => {
    // Check if we have user location, if not try to get it
    if (!userLocation) {
      if (!navigator.geolocation) {
        setError('Trình duyệt không hỗ trợ định vị GPS.');
        return;
      }

      setLoading(true);
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Continue with routing after setting location
        await calculateRoute({ lat: latitude, lng: longitude }, selectedRouteHospital);
      } catch (err) {
        console.error('Geolocation error:', err);
        setError('Vui lòng cho phép truy cập vị trí để sử dụng tính năng chỉ đường.');
      } finally {
        setLoading(false);
      }
      return;
    }

    await calculateRoute(userLocation, selectedRouteHospital);
  };

  const calculateRoute = async (startLoc, endLoc) => {
    if (!startLoc || !endLoc) return;

    setGettingRoute(true);
    setError(null);
    setIsRushHour(checkRushHour());

    try {
      const result = await routingAPI.getDirections(
        startLoc.lat,
        startLoc.lng,
        endLoc.latitude,
        endLoc.longitude,
        routingMode
      );

      if (result.success) {
        // Traffic logic: If rush hour, add 30-50% to duration
        let durationSeconds = result.duration;
        let trafficNote = '';

        if (checkRushHour() && (routingMode === 'driving' || routingMode === 'bicycling')) {
          const delayFactor = 1.35; // +35% delay
          durationSeconds = Math.round(durationSeconds * delayFactor);
          trafficNote = '(Đã cộng thêm thời gian dự kiến do Giờ Cao Điểm)';
        }

        setRouteInfo({
          distance: gisUtils.formatDistance(result.distance),
          duration: gisUtils.formatDuration(durationSeconds),
          geometry: result.geometry,
          steps: result.steps,
          trafficNote: trafficNote
        });
      } else {
        // Fallback to straight-line distance
        const straightDistance = gisUtils.calculateDistance(
          startLoc.lat, startLoc.lng,
          endLoc.latitude, endLoc.longitude
        );
        setRouteInfo({
          distance: `${straightDistance.toFixed(2)} km`,
          duration: `${Math.round(straightDistance * 3)} phút`, // Rough estimate
          geometry: null,
          isEstimate: true
        });
        setError('Không thể lấy chỉ đường chi tiết. Hiển thị khoảng cách thẳng.');
      }
    } catch (err) {
      console.error('Routing error:', err);
      // Use straight-line distance as fallback
      const straightDistance = gisUtils.calculateDistance(
        startLoc.lat, startLoc.lng,
        endLoc.latitude, endLoc.longitude
      );
      setRouteInfo({
        distance: `${straightDistance.toFixed(2)} km`,
        duration: `${Math.round(straightDistance * 3)} phút`,
        isEstimate: true
      });
    } finally {
      setGettingRoute(false);
    }
  };

  // GIS: Open directions in external map
  const openExternalMap = () => {
    if (!selectedRouteHospital) return;

    if (!userLocation) {
      setError('Vui lòng lấy vị trí của bạn trước khi xem chỉ đường.');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedRouteHospital.latitude},${selectedRouteHospital.longitude}&travelmode=${routingMode === 'walking' ? 'walking' : 'driving'}`;
    window.open(url, '_blank');
  };

  // GIS: Find best hospital based on criteria
  const findBestHospital = () => {
    if (!userLocation) {
      setError('Vui lòng lấy vị trí của bạn trước.');
      return;
    }

    const results = hospitalRecommendation.findBestHospital(
      userLocation,
      hospitals,
      recommendationCriteria
    );

    if (results && results.length > 0) {
      setRecommendedHospital(results[0]);
      // Focus on recommended hospital
      if (mapRef.current && results[0].latitude && results[0].longitude) {
        mapRef.current.setView([results[0].latitude, results[0].longitude], 15);
      }
    } else {
      setRecommendedHospital(null);
      setError('Không tìm thấy bệnh viện phù hợp.');
    }
  };

  // GIS: Handle hospital marker click
  const handleHospitalClick = (hospital) => {
    setSelectedHospital(hospital);
  };

  // GIS: Update route hospital from selected hospital
  useEffect(() => {
    if (selectedHospital && routingDialogOpen) {
      setSelectedRouteHospital(selectedHospital);
      // Auto-update route when hospital changes
      if (userLocation) {
        calculateRoute(userLocation, selectedHospital);
      }
    }
  }, [selectedHospital, routingDialogOpen, userLocation]);

  // GIS Statistics display
  const hospitalStats = useMemo(() => {
    const validHospitals = hospitals.filter(h => h && h.id);
    return {
      total: validHospitals.length,
      public: validHospitals.filter(h => h.hospital_type === 'public').length,
      private: validHospitals.filter(h => h.hospital_type === 'private').length,
      clinic: validHospitals.filter(h => h.hospital_type === 'clinic').length,
      emergency: validHospitals.filter(h => h.emergency_services === true).length
    };
  }, [hospitals]);

  return (
    <Box>
      {/* GIS Page Title */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        🗺️ Bản đồ Bệnh viện TP.HCM
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* GIS Search and Controls */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              🔍 Bộ lọc & Tìm kiếm
            </Typography>

            <SearchFilters onSearch={handleSearch} />

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={isSelectingLocation ? "contained" : "outlined"}
                color={isSelectingLocation ? "error" : "primary"}
                startIcon={<LocationIcon />}
                onClick={() => setIsSelectingLocation(!isSelectingLocation)}
                fullWidth={isMobile}
              >
                {isSelectingLocation ? "Hủy chọn" : "Chọn trên bản đồ"}
              </Button>

              <Button
                variant="contained"
                startIcon={<LocationIcon />}
                onClick={getUserLocation}
                disabled={loading}
                fullWidth={isMobile}
              >
                Vị trí của tôi
              </Button>


              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadHospitals}
                disabled={loading}
              >
                Tải lại
              </Button>
            </Box>
          </Paper>

          {/* GIS Statistics */}
          {!loading && (
            <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                📊 Thống kê
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label={`Tổng: ${hospitalStats.total}`} color="primary" />
                <Chip label={`Công lập: ${hospitalStats.public}`} color="success" />
                <Chip label={`Tư nhân: ${hospitalStats.private}`} color="error" />
                <Chip label={`Phòng khám: ${hospitalStats.clinic}`} color="warning" />
                <Chip label={`Cấp cứu: ${hospitalStats.emergency}`} color="secondary" />
              </Box>
            </Paper>
          )}

          {/* Recommended Hospital */}
          {recommendedHospital && (
            <Card elevation={3} sx={{ mt: 2, bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    ⭐ Gợi ý tốt nhất
                  </Typography>
                  <IconButton size="small" onClick={() => setRecommendedHospital(null)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {recommendedHospital.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📍 {recommendedHospital.address}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={`${recommendedHospital.distance.toFixed(2)} km`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={recommendedHospital.hospital_type === 'public' ? 'Công lập' :
                      recommendedHospital.hospital_type === 'private' ? 'Tư nhân' : 'Phòng khám'}
                    size="small"
                    color={recommendedHospital.hospital_type === 'public' ? 'success' :
                      recommendedHospital.hospital_type === 'private' ? 'error' : 'warning'}
                  />
                </Box>
                {recommendedHospital.reasons && recommendedHospital.reasons.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {recommendedHospital.reasons.map((reason, idx) => (
                      <Chip key={idx} label={reason} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<NavigationIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setSelectedRouteHospital(recommendedHospital);
                    setRoutingDialogOpen(true);
                  }}
                >
                  Chỉ đường
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Recommendation Buttons */}
          {userLocation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🚑 Tìm nhanh:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setRecommendationCriteria({ ...recommendationCriteria, emergency: true });
                    setTimeout(() => findBestHospital(), 100);
                  }}
                >
                  Bệnh viện cấp cứu gần nhất
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => {
                    setRecommendationCriteria({
                      specialty: 'general',
                      hospitalType: 'public',
                      preferPublic: true,
                      maxDistance: 10
                    });
                    setTimeout(() => findBestHospital(), 100);
                  }}
                >
                  Bệnh viện công lập
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setRecommendationCriteria({ ...recommendationCriteria, specialty: 'pediatrics' });
                    setTimeout(() => findBestHospital(), 100);
                  }}
                >
                  Bệnh viện Nhi
                </Button>
              </Box>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} lg={8}>
          {/* GIS Map Container */}
          <Paper elevation={2} sx={{ height: isMobile ? '400px' : '650px', position: 'relative' }}>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000
                }}
              >
                <CircularProgress />
                <Typography sx={{ mt: 1 }}>Đang tải dữ liệu GIS...</Typography>
              </Box>
            )}

            <MapContainer
              ref={mapRef}
              hospitals={filteredHospitals}
              userLocation={userLocation}
              onHospitalClick={handleHospitalClick}
              height="100%"
              recommendedHospital={recommendedHospital}
              routeGeometry={routeInfo?.geometry}
              isSelectingLocation={isSelectingLocation}
              onLocationSelect={handleManualLocationSelect}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* GIS Hospital Detail Modal */}
      <HospitalPopup
        hospital={selectedHospital}
        open={!!selectedHospital}
        onClose={() => setSelectedHospital(null)}
        onGetDirections={openRoutingDialog}
      />

      {/* Routing Dialog */}
      <Dialog
        open={routingDialogOpen}
        onClose={() => setRoutingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          🧭 Chỉ đường đến {selectedRouteHospital?.name}
        </DialogTitle>
        <DialogContent>
          {selectedRouteHospital && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                📍 {selectedRouteHospital.address}
              </Typography>
              {userLocation && (
                <Typography variant="body2" color="primary">
                  📏 Khoảng cách: {gisUtils.calculateDistance(
                    userLocation.lat, userLocation.lng,
                    selectedRouteHospital.latitude, selectedRouteHospital.longitude
                  ).toFixed(2)} km
                </Typography>
              )}
            </Box>
          )}

          {/* Routing mode selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Phương tiện</InputLabel>
            <Select
              value={routingMode}
              label="Phương tiện"
              onChange={(e) => setRoutingMode(e.target.value)}
            >
              <MenuItem value="driving">🚗 Ô tô/Xe máy</MenuItem>
              <MenuItem value="walking">🚶 Đi bộ</MenuItem>
              <MenuItem value="bicycling">🚴 Xe đạp</MenuItem>
            </Select>
          </FormControl>

          {/* Route info */}
          {routeInfo && (
            <Card variant="outlined" sx={{ mb: 2, bgcolor: isRushHour ? '#fff3e0' : '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {routeInfo.isEstimate ? '📏 Khoảng cách ước tính:' : '🛣️ Tuyến đường:'}
                </Typography>

                {isRushHour && (
                  <Chip
                    label="⚠️ Đang là Giờ Cao Điểm"
                    color="warning"
                    size="small"
                    sx={{ mb: 1, mt: 0.5 }}
                  />
                )}

                <Typography variant="h5" fontWeight="bold">
                  {routeInfo.distance}
                </Typography>
                <Typography variant="body1">
                  ⏱️ Thời gian: {routeInfo.duration}
                </Typography>
                {routeInfo.trafficNote && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    {routeInfo.trafficNote}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {gettingRoute && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<NavigationIcon />}
            onClick={openExternalMap}
            sx={{ fontWeight: 'bold', py: 1 }}
          >
            Dẫn đường ngay (Tránh kẹt xe)
            <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>(Google Maps)</Typography>
          </Button>

          <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
            <Button onClick={() => setRoutingDialogOpen(false)} fullWidth color="inherit">
              Đóng
            </Button>
            <Button
              variant="outlined"
              startIcon={<RouteIcon />}
              onClick={getDirections}
              disabled={!userLocation || gettingRoute}
              fullWidth
            >
              Xem đường đi mẫu
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapPage;
