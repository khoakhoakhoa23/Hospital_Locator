import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
  Link,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebIcon,
  Facebook as FacebookIcon,
  LocalHospital as HospitalIcon,
  Schedule as ScheduleIcon,
  Directions as DirectionsIcon
} from '@mui/icons-material';

const HospitalPopup = ({ hospital, open, onClose, onGetDirections }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!hospital) return null;



  // GIS: Share location
  const handleShare = async () => {
    const url = window.location.origin + `/hospital/${hospital.id}`;

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <HospitalIcon />
        {hospital.name}
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* GIS: Hospital Information */}
          <Grid item xs={12} md={8}>
            {/* Basic Info */}
            <Box sx={{ mb: 3 }}>
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

              <Typography variant="h6" gutterBottom color="primary">
                📍 Địa chỉ
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {hospital.full_address}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                GPS: {hospital.latitude?.toFixed(6)}, {hospital.longitude?.toFixed(6)}
              </Typography>
            </Box>

            {/* Contact Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                📞 Liên hệ
              </Typography>

              {hospital.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Link href={`tel:${hospital.phone}`} variant="body1">
                    {hospital.phone}
                  </Link>
                </Box>
              )}

              {hospital.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Link href={`mailto:${hospital.email}`} variant="body1">
                    {hospital.email}
                  </Link>
                </Box>
              )}

              {hospital.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WebIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Link href={hospital.website} target="_blank" rel="noopener noreferrer" variant="body1">
                    Website
                  </Link>
                </Box>
              )}

              {hospital.facebook && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FacebookIcon sx={{ mr: 1, color: 'blue' }} />
                  <Link href={hospital.facebook} target="_blank" rel="noopener noreferrer" variant="body1">
                    Facebook
                  </Link>
                </Box>
              )}
            </Box>

            {/* Specialty Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                🩺 Chuyên khoa
              </Typography>

              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Chuyên khoa chính:</strong> {hospital.main_specialty_display}
              </Typography>

              {hospital.specialties && hospital.specialties.length > 0 && (
                <Box sx={{ mt: 1 }}>
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
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {hospital.description}
                </Typography>
              )}
            </Box>

            {/* Working Hours */}
            {hospital.working_hours && (
              <Box sx={{ mb: 3 }}>
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
              </Box>
            )}

            {/* Capacity & Staff */}
            {(hospital.capacity || hospital.doctors_count || hospital.nurses_count) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  📊 Thông tin cơ sở vật chất
                </Typography>

                <Grid container spacing={2}>
                  {hospital.capacity && (
                    <Grid item xs={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 1 }}>
                          <Typography variant="h5" color="primary">
                            {hospital.capacity}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Giường bệnh
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {hospital.doctors_count && (
                    <Grid item xs={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 1 }}>
                          <Typography variant="h5" color="success.main">
                            {hospital.doctors_count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Bác sĩ
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {hospital.nurses_count && (
                    <Grid item xs={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 1 }}>
                          <Typography variant="h5" color="info.main">
                            {hospital.nurses_count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Y tá
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Grid>

          {/* GIS: Map Preview */}
          <Grid item xs={12} md={4}>
            <Card>
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
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" align="center">
                    Tọa độ: {hospital.latitude?.toFixed(4)}, {hospital.longitude?.toFixed(4)}
                    <br />
                    <small>WGS84 Coordinate System</small>
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  * Click "Chỉ đường" để xem trên bản đồ đầy đủ
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>

        <Button
          onClick={handleShare}
          color="secondary"
          variant="outlined"
        >
          📤 Chia sẻ
        </Button>

        {hospital.latitude && hospital.longitude && (
          <Button
            onClick={() => {
              if (onClose) onClose();
              onClose();
              if (onGetDirections) {
                onGetDirections(hospital);
              }
            }}
            variant="contained"
            startIcon={<DirectionsIcon />}
          >
            Chỉ đường
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default HospitalPopup;

