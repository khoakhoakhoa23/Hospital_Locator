import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs
} from '@mui/material';
import {
  NavigateBefore as BackIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebIcon,
  Facebook as FacebookIcon,
  LocalHospital as HospitalIcon,
  Schedule as ScheduleIcon,
  Directions as DirectionsIcon,
  Share as ShareIcon
} from '@mui/icons-material';

// GIS Services
import { hospitalAPI } from '../services/api';

const HospitalDetailPage = () => {
  const { id } = useParams();

  const [hospital, setHospital] = useState(null);
  const [relatedHospitals, setRelatedHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // GIS: Load hospital details
  useEffect(() => {
    if (id) {
      loadHospitalDetail();
    }
  }, [id]);

  const loadHospitalDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hospitalAPI.getHospital(id);
      setHospital(response.data);

      // GIS: Load related hospitals in same district
      if (response.data.district) {
        const relatedResponse = await hospitalAPI.getHospitals({
          district: response.data.district
        });
        // Filter out current hospital
        const related = relatedResponse.data.filter(h => h.id !== parseInt(id)).slice(0, 6);
        setRelatedHospitals(related);
      }

    } catch (err) {
      console.error('GIS Load hospital detail error:', err);
      if (err.response?.status === 404) {
        setError('Không tìm thấy bệnh viện này.');
      } else {
        setError('Không thể tải thông tin bệnh viện.');
      }
    } finally {
      setLoading(false);
    }
  });

  // GIS: Get directions URL
  const getDirectionsUrl = (hospital) => {
    if (hospital.latitude && hospital.longitude) {
      return `https://www.openstreetmap.org/directions?to=${hospital.latitude}%2C${hospital.longitude}`;
    }
    return '#';
  };

  // GIS: Share hospital info
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: hospital.name,
          text: `Xem thông tin bệnh viện: ${hospital.name}`,
          url: url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert('Đã sao chép liên kết vào clipboard!');
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải thông tin bệnh viện...</Typography>
      </Box>
    );
  }

  if (error || !hospital) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Không thể tải thông tin bệnh viện.'}
        </Alert>
        <Button component={Link} to="/" startIcon={<BackIcon />}>
          Quay lại bản đồ
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* GIS Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Button component={Link} to="/" color="inherit">
          Bản đồ
        </Button>
        <Button component={Link} to="/hospitals" color="inherit">
          Danh sách bệnh viện
        </Button>
        <Typography color="text.primary">{hospital.name}</Typography>
      </Breadcrumbs>

      {/* GIS Hospital Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <HospitalIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          {hospital.name}
        </Typography>

        {/* GIS Type & Emergency badges */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={hospital.hospital_type_display}
            color={
              hospital.hospital_type === 'public' ? 'success' :
              hospital.hospital_type === 'private' ? 'error' : 'warning'
            }
            size="small"
          />
          {hospital.emergency_services && (
            <Chip label="🚑 Cấp cứu 24/7" color="error" size="small" />
          )}
          {hospital.ambulance_services && (
            <Chip label="🚐 Xe cứu thương" color="secondary" size="small" />
          )}
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* GIS Main Content */}
        <Grid item xs={12} lg={8}>
          {/* GIS Address Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📍 Địa chỉ & Vị trí
              </Typography>

              <Typography variant="h6" sx={{ mb: 1 }}>
                {hospital.full_address}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                GPS Coordinates (WGS84): {hospital.latitude?.toFixed(6)}, {hospital.longitude?.toFixed(6)}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  href={getDirectionsUrl(hospital)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  startIcon={<DirectionsIcon />}
                >
                  Chỉ đường đến đây
                </Button>

                <Button
                  onClick={handleShare}
                  variant="outlined"
                  startIcon={<ShareIcon />}
                >
                  Chia sẻ
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* GIS Contact Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📞 Thông tin liên hệ
              </Typography>

              <Grid container spacing={2}>
                {hospital.phone && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 2, color: 'success.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Điện thoại
                        </Typography>
                        <Typography variant="body1">
                          <a href={`tel:${hospital.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {hospital.phone}
                          </a>
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {hospital.email && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 2, color: 'info.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          <a href={`mailto:${hospital.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {hospital.email}
                          </a>
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {hospital.website && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WebIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Website
                        </Typography>
                        <Typography variant="body1">
                          <a href={hospital.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            {hospital.website}
                          </a>
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {hospital.facebook && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FacebookIcon sx={{ mr: 2, color: 'blue' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Facebook
                        </Typography>
                        <Typography variant="body1">
                          <a href={hospital.facebook} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            {hospital.facebook}
                          </a>
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* GIS Specialty Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🩺 Thông tin chuyên khoa
              </Typography>

              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Chuyên khoa chính:</strong> {hospital.main_specialty_display}
              </Typography>

              {hospital.specialties && hospital.specialties.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Các chuyên khoa khác:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {hospital.specialties.map((specialty, index) => (
                      <Chip key={index} label={specialty} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {hospital.description && (
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {hospital.description}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* GIS Working Hours */}
          {hospital.working_hours && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Giờ làm việc
                </Typography>

                <Grid container spacing={1}>
                  {Object.entries(hospital.working_hours).map(([day, hours]) => (
                    <Grid item xs={12} sm={6} key={day}>
                      <Typography variant="body2">
                        <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong> {hours}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* GIS Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* GIS Map Preview */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🗺️ Vị trí trên bản đồ
              </Typography>

              <Box
                sx={{
                  height: 200,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e0e0e0',
                  p: 2
                }}
              >
                <LocationIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" align="center" color="text.secondary">
                  Tọa độ GPS (WGS84):
                  <br />
                  <strong>{hospital.latitude?.toFixed(6)}</strong>,
                  <strong>{hospital.longitude?.toFixed(6)}</strong>
                </Typography>
              </Box>

              <Button
                href={getDirectionsUrl(hospital)}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
              >
                Xem trên bản đồ
              </Button>
            </CardContent>
          </Card>

          {/* GIS Capacity & Staff */}
          {(hospital.capacity || hospital.doctors_count || hospital.nurses_count) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Cơ sở vật chất
                </Typography>

                <Grid container spacing={2}>
                  {hospital.capacity && (
                    <Grid item xs={12}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {hospital.capacity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Giường bệnh
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="success.main">
                        {hospital.doctors_count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bác sĩ
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="info.main">
                        {hospital.nurses_count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Y tá
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* GIS Related Hospitals */}
      {relatedHospitals.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            🏥 Bệnh viện cùng quận
          </Typography>

          <Grid container spacing={2}>
            {relatedHospitals.map((relatedHospital) => (
              <Grid item xs={12} sm={6} md={4} key={relatedHospital.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" component={Link} to={`/hospital/${relatedHospital.id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                      {relatedHospital.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {relatedHospital.address}
                    </Typography>

                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={relatedHospital.hospital_type_display}
                        size="small"
                        color={relatedHospital.hospital_type === 'public' ? 'success' : relatedHospital.hospital_type === 'private' ? 'error' : 'warning'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default HospitalDetailPage;

