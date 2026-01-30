import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

// GIS Services
import { hospitalAPI } from '../services/api';

const HospitalsPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    district: '',
    type: ''
  });

  // GIS: Load hospitals
  useEffect(() => {
    loadHospitals();
  }, []);

  // GIS: Filter hospitals when search changes
  useEffect(() => {
    filterHospitals();
  });

  const loadHospitals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hospitalAPI.getHospitals();
      setHospitals(response.data);
    } catch (err) {
      console.error('GIS Load hospitals error:', err);
      setError('Không thể tải danh sách bệnh viện.');
    } finally {
      setLoading(false);
    }
  };

  const filterHospitals = () => {
    let filtered = [...hospitals];

    // GIS: Text search
    if (searchFilters.query) {
      filtered = filtered.filter(hospital =>
        hospital.name.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchFilters.query.toLowerCase())
      );
    }

    // GIS: District filter
    if (searchFilters.district) {
      filtered = filtered.filter(hospital => hospital.district === searchFilters.district);
    }

    // GIS: Type filter
    if (searchFilters.type) {
      filtered = filtered.filter(hospital => hospital.hospital_type === searchFilters.type);
    }

    setFilteredHospitals(filtered);
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải danh sách bệnh viện...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* GIS Page Title */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        📋 Danh sách Bệnh viện TP.HCM
      </Typography>

      {/* GIS Search Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 Bộ lọc tìm kiếm
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tìm kiếm"
                value={searchFilters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="Tên bệnh viện hoặc địa chỉ..."
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Quận/Huyện</InputLabel>
                <Select
                  value={searchFilters.district}
                  label="Quận/Huyện"
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                >
                  <MenuItem value="">Tất cả quận</MenuItem>
                  <MenuItem value="quan1">Quận 1</MenuItem>
                  <MenuItem value="quan2">Quận 2</MenuItem>
                  <MenuItem value="quan3">Quận 3</MenuItem>
                  <MenuItem value="quan4">Quận 4</MenuItem>
                  <MenuItem value="quan5">Quận 5</MenuItem>
                  {/* Add more districts as needed */}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại bệnh viện</InputLabel>
                <Select
                  value={searchFilters.type}
                  label="Loại bệnh viện"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">Tất cả loại</MenuItem>
                  <MenuItem value="public">🏥 Công lập</MenuItem>
                  <MenuItem value="private">🏨 Tư nhân</MenuItem>
                  <MenuItem value="clinic">🏥 Phòng khám</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* GIS Results Summary */}
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Hiển thị {filteredHospitals.length} / {hospitals.length} bệnh viện
      </Typography>

      {/* GIS Hospitals Grid */}
      <Grid container spacing={3}>
        {filteredHospitals.map((hospital) => (
          <Grid item xs={12} sm={6} lg={4} key={hospital.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {hospital.name}
                </Typography>

                {/* GIS Type & Emergency badges */}
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={hospital.hospital_type_display}
                    color={
                      hospital.hospital_type === 'public' ? 'success' :
                      hospital.hospital_type === 'private' ? 'error' : 'warning'
                    }
                    size="small"
                  />
                  {hospital.emergency_services && (
                    <Chip label="🚑 Cấp cứu" color="error" size="small" />
                  )}
                </Box>

                {/* GIS Address */}
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                  <LocationIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
                  <Typography variant="body2" color="text.secondary">
                    {hospital.address}
                  </Typography>
                </Box>

                {/* GIS Phone */}
                {hospital.phone && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ mr: 1, color: 'success.main', fontSize: '1rem' }} />
                    <Typography variant="body2">
                      {hospital.phone}
                    </Typography>
                  </Box>
                )}

                {/* GIS Specialty */}
                <Typography variant="body2" color="primary">
                  <HospitalIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1rem' }} />
                  {hospital.main_specialty_display}
                </Typography>

                {/* GIS Coordinates */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  GPS: {hospital.latitude?.toFixed(4)}, {hospital.longitude?.toFixed(4)}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  component={Link}
                  to={`/hospital/${hospital.id}`}
                  variant="contained"
                  fullWidth
                  size="small"
                >
                  Xem chi tiết
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* GIS No results */}
      {filteredHospitals.length === 0 && !loading && (
        <Box textAlign="center" py={6}>
          <HospitalIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy bệnh viện nào phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Thử điều chỉnh bộ lọc tìm kiếm
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default HospitalsPage;

