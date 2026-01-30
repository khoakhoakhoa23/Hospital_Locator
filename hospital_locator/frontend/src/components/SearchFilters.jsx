import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Grid,
  FormControlLabel,
  Checkbox,
  Chip,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

// GIS Services
import { hospitalAPI } from '../services/api';

const SearchFilters = ({ onSearch, initialFilters = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // GIS Filter state
  const [filters, setFilters] = useState({
    query: initialFilters.query || '',
    district: initialFilters.district || '',
    hospital_type: initialFilters.hospital_type || '',
    specialty: initialFilters.specialty || '',
    emergency_only: initialFilters.emergency_only || false,
    latitude: initialFilters.latitude || '',
    longitude: initialFilters.longitude || '',
    radius: initialFilters.radius || 5,
    ...initialFilters
  });

  // GIS Data for dropdowns
  const [districts, setDistricts] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load GIS reference data
  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      setLoading(true);
      const [districtsRes, specialtiesRes] = await Promise.all([
        hospitalAPI.getDistricts(),
        hospitalAPI.getSpecialties()
      ]);

      setDistricts(districtsRes.data);
      setSpecialties(specialtiesRes.data);
    } catch (error) {
      console.error('GIS Reference data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // GIS: Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // GIS: Execute search
  const handleSearch = () => {
    // Validate GIS coordinates if provided
    if ((filters.latitude || filters.longitude) &&
        (!filters.latitude || !filters.longitude)) {
      alert('Vui lòng nhập đầy đủ tọa độ (latitude và longitude) hoặc để trống để tìm kiếm thông thường.');
      return;
    }

    // Validate coordinate ranges (WGS84)
    if (filters.latitude && filters.longitude) {
      const lat = parseFloat(filters.latitude);
      const lng = parseFloat(filters.longitude);

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        alert('Tọa độ không hợp lệ. Latitude: -90 đến 90, Longitude: -180 đến 180.');
        return;
      }
    }

    // GIS: Call search function with spatial parameters
    onSearch({
      ...filters,
      latitude: filters.latitude ? parseFloat(filters.latitude) : null,
      longitude: filters.longitude ? parseFloat(filters.longitude) : null,
      radius: parseFloat(filters.radius) || 5
    });
  };

  // GIS: Clear all filters
  const handleClear = () => {
    setFilters({
      query: '',
      district: '',
      hospital_type: '',
      specialty: '',
      emergency_only: false,
      latitude: '',
      longitude: '',
      radius: 5
    });
  };

  // GIS: Get user location for spatial search
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFilters(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }));
      },
      (error) => {
        console.error('GIS Geolocation error:', error);
        alert('Không thể lấy vị trí. Vui lòng kiểm tra cài đặt GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* GIS: Text search */}
        <Grid item xs={12} sm={6} md={12}>
          <TextField
            fullWidth
            label="Tìm kiếm theo tên hoặc địa chỉ"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            placeholder="Ví dụ: Bệnh viện Chợ Rẫy, Quận 1..."
            variant="outlined"
            size="small"
          />
        </Grid>

        {/* GIS: District filter */}
        <Grid item xs={12} sm={6} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Quận/Huyện</InputLabel>
            <Select
              value={filters.district}
              label="Quận/Huyện"
              onChange={(e) => handleFilterChange('district', e.target.value)}
            >
              <MenuItem value="">
                <em>Tất cả quận</em>
              </MenuItem>
              {districts.map((district) => (
                <MenuItem key={district.code} value={district.code}>
                  {district.name} ({district.hospital_count} bệnh viện)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* GIS: Hospital type filter */}
        <Grid item xs={12} sm={6} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Loại bệnh viện</InputLabel>
            <Select
              value={filters.hospital_type}
              label="Loại bệnh viện"
              onChange={(e) => handleFilterChange('hospital_type', e.target.value)}
            >
              <MenuItem value="">
                <em>Tất cả loại</em>
              </MenuItem>
              <MenuItem value="public">🏥 Công lập</MenuItem>
              <MenuItem value="private">🏨 Tư nhân</MenuItem>
              <MenuItem value="clinic">🏥 Phòng khám</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* GIS: Specialty filter */}
        <Grid item xs={12} sm={6} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Chuyên khoa</InputLabel>
            <Select
              value={filters.specialty}
              label="Chuyên khoa"
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
            >
              <MenuItem value="">
                <em>Tất cả chuyên khoa</em>
              </MenuItem>
              {specialties.map((specialty) => (
                <MenuItem key={specialty.code} value={specialty.code}>
                  {specialty.name} ({specialty.hospital_count})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* GIS: Emergency services filter */}
        <Grid item xs={12} sm={6} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.emergency_only}
                onChange={(e) => handleFilterChange('emergency_only', e.target.checked)}
                color="secondary"
              />
            }
            label="🚑 Chỉ hiển thị bệnh viện có cấp cứu"
          />
        </Grid>

        {/* GIS: Spatial search coordinates */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              🔍 Tìm kiếm theo vị trí (GIS Spatial Query)
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Vĩ độ (Latitude)"
                  type="number"
                  value={filters.latitude}
                  onChange={(e) => handleFilterChange('latitude', e.target.value)}
                  placeholder="10.762622"
                  size="small"
                  inputProps={{ step: 0.000001, min: -90, max: 90 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Kinh độ (Longitude)"
                  type="number"
                  value={filters.longitude}
                  onChange={(e) => handleFilterChange('longitude', e.target.value)}
                  placeholder="106.660172"
                  size="small"
                  inputProps={{ step: 0.000001, min: -180, max: 180 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Bán kính (km)"
                  type="number"
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', e.target.value)}
                  size="small"
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<LocationIcon />}
                  onClick={handleGetLocation}
                  size="small"
                  fullWidth={isMobile}
                >
                  Lấy vị trí hiện tại
                </Button>
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              * Để trống để tìm kiếm thông thường, hoặc nhập tọa độ để tìm kiếm không gian (spatial search)
            </Typography>
          </Box>
        </Grid>

        {/* GIS: Action buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
              fullWidth={isMobile}
            >
              Tìm kiếm
            </Button>

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              disabled={loading}
            >
              Xóa bộ lọc
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* GIS: Active filters display */}
      {(filters.query || filters.district || filters.hospital_type || filters.specialty || filters.emergency_only) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Bộ lọc đang áp dụng:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.query && (
              <Chip label={`Tìm: "${filters.query}"`} onDelete={() => handleFilterChange('query', '')} size="small" />
            )}
            {filters.district && (
              <Chip label={`Quận: ${districts.find(d => d.code === filters.district)?.name || filters.district}`} onDelete={() => handleFilterChange('district', '')} size="small" color="primary" />
            )}
            {filters.hospital_type && (
              <Chip label={`Loại: ${filters.hospital_type === 'public' ? 'Công lập' : filters.hospital_type === 'private' ? 'Tư nhân' : 'Phòng khám'}`} onDelete={() => handleFilterChange('hospital_type', '')} size="small" color="secondary" />
            )}
            {filters.specialty && (
              <Chip label={`Chuyên khoa: ${specialties.find(s => s.code === filters.specialty)?.name || filters.specialty}`} onDelete={() => handleFilterChange('specialty', '')} size="small" color="success" />
            )}
            {filters.emergency_only && (
              <Chip label="🚑 Chỉ cấp cứu" onDelete={() => handleFilterChange('emergency_only', false)} size="small" color="error" />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SearchFilters;

