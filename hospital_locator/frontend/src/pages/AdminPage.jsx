import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, FormHelperText } from '@mui/material';
import { Edit, Delete, Add, Visibility, Map as MapIcon, Download, Refresh, Save } from '@mui/icons-material';
import { hospitalAPI } from '../services/api';

const DISTRICTS = [
  { code: 'quan1', name: 'Quận 1' },
  { code: 'quan3', name: 'Quận 3' },
  { code: 'quan4', name: 'Quận 4' },
  { code: 'quan5', name: 'Quận 5' },
  { code: 'quan6', name: 'Quận 6' },
  { code: 'quan7', name: 'Quận 7' },
  { code: 'quan8', name: 'Quận 8' },
  { code: 'quan10', name: 'Quận 10' },
  { code: 'quan11', name: 'Quận 11' },
  { code: 'quan12', name: 'Quận 12' },
  { code: 'binhthanh', name: 'Quận Bình Thạnh' },
  { code: 'phunhuan', name: 'Quận Phú Nhuận' },
  { code: 'tanbinh', name: 'Quận Tân Bình' },
  { code: 'tanphu', name: 'Quận Tân Phú' },
  { code: 'govap', name: 'Quận Gò Vấp' },  // FIX: 'govap' instead of 'go vap'
  { code: 'thuduc', name: 'Quận Thủ Đức' },
  { code: 'binhtan', name: 'Quận Bình Tân' },
  { code: 'hocmon', name: 'Huyện Hóc Môn' },
  { code: 'cuchi', name: 'Huyện Củ Chi' },
  { code: 'nhabe', name: 'Huyện Nhà Bè' },  // FIX: 'nhabe' instead of 'nhabbe'
  { code: 'canggio', name: 'Huyện Cần Giờ' },
];

const SPECIALTIES = [
  { code: 'general', name: 'Đa khoa' },
  { code: 'cardiology', name: 'Tim mạch' },
  { code: 'orthopedics', name: 'Chấn thương chỉnh hình' },
  { code: 'neurology', name: 'Thần kinh' },
  { code: 'pediatrics', name: 'Nhi khoa' },
  { code: 'obstetrics', name: 'Sản phụ khoa' },
  { code: 'oncology', name: 'Ung bướu' },
  { code: 'ophthalmology', name: 'Mắt' },
  { code: 'ent', name: 'Tai mũi họng' },
  { code: 'dermatology', name: 'Da liễu' },
  { code: 'dentistry', name: 'Răng hàm mặt' },
  { code: 'psychiatry', name: 'Tâm thần' },
  { code: 'urology', name: 'Tiết niệu' },
  { code: 'gastroenterology', name: 'Tiêu hóa' },
  { code: 'respiratory', name: 'Hô hấp' },
  { code: 'endocrinology', name: 'Nội tiết' },
  { code: 'nephrology', name: 'Thận' },
  { code: 'rheumatology', name: 'Khớp' },
  { code: 'infectious', name: 'Truyền nhiễm' },
  { code: 'emergency', name: 'Cấp cứu' },
];

const AdminPage = () => {
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    clinic: 0,
    emergency: 0,
    active: 0
  });
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    hospital_type: 'private',
    description: '',
    address: '',
    district: '',
    ward: '',
    phone: '',
    email: '',
    website: '',
    main_specialty: 'general',
    specialties: [],
    latitude: '',
    longitude: '',
    working_hours: '24/7',
    emergency_services: false,
    ambulance_services: false,
    capacity: '',
    doctors_count: '',
    nurses_count: '',
    is_active: true,
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await hospitalAPI.getHospitals({ limit: 200 });
      const data = response.data;
      
      setHospitals(data.results || data);
      
      setStats({
        total: data.count || data.length,
        public: (data.results || data).filter(h => h.hospital_type === 'public').length,
        private: (data.results || data).filter(h => h.hospital_type === 'private').length,
        clinic: (data.results || data).filter(h => h.hospital_type === 'clinic').length,
        emergency: (data.results || data).filter(h => h.emergency_services).length,
        active: (data.results || data).filter(h => h.is_active).length
      });
    } catch (err) {
      setError('Không thể tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'public': return 'success';
      case 'private': return 'error';
      case 'clinic': return 'warning';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'public': return 'Công lập';
      case 'private': return 'Tư nhân';
      case 'clinic': return 'Phòng khám';
      default: return type;
    }
  };

  const getDistrictName = (code) => {
    const d = DISTRICTS.find(d => d.code === code);
    return d ? d.name : code;
  };

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          h.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || h.hospital_type === filterType;
    return matchesSearch && matchesType;
  });

  const exportToCSV = () => {
    const headers = ['Tên', 'Tên tiếng Anh', 'Loại', 'Địa chỉ', 'Quận', 'Điện thoại', 'Email', 'Website', 'Cấp cứu', 'Hoạt động'];
    const rows = filteredHospitals.map(h => [
      h.name,
      h.name_en || '',
      getTypeLabel(h.hospital_type),
      h.address || '',
      h.district || '',
      h.phone || '',
      h.email || '',
      h.website || '',
      h.emergency_services ? 'Có' : 'Không',
      h.is_active ? 'Có' : 'Không'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `hospitals_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setSuccess('Đã xuất CSV thành công!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tên bệnh viện là bắt buộc';
    if (!formData.address.trim()) errors.address = 'Địa chỉ là bắt buộc';
    if (!formData.phone.trim()) errors.phone = 'Điện thoại là bắt buộc';
    if (!formData.district) errors.district = 'Vui lòng chọn quận/huyện';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError('');
    
    try {
      const dataToSubmit = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        doctors_count: formData.doctors_count ? parseInt(formData.doctors_count) : null,
        nurses_count: formData.nurses_count ? parseInt(formData.nurses_count) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        working_hours: formData.working_hours ? { 'default': formData.working_hours } : { 'default': '24/7' }, // FIX: Convert to JSON object
      };
      
      await hospitalAPI.createHospital(dataToSubmit);
      
      setSuccess('Thêm bệnh viện thành công!');
      setAddDialogOpen(false);
      resetForm();
      fetchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Lỗi khi thêm bệnh viện. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      hospital_type: 'private',
      description: '',
      address: '',
      district: '',
      ward: '',
      phone: '',
      email: '',
      website: '',
      main_specialty: 'general',
      specialties: [],
      latitude: '',
      longitude: '',
      working_hours: '24/7',
      emergency_services: false,
      ambulance_services: false,
      capacity: '',
      doctors_count: '',
      nurses_count: '',
      is_active: true,
    });
    setFormErrors({});
  };

  const StatCard = ({ icon, label, value, color }) => (
    <Card sx={{ height: '100%', borderTop: 4, borderColor: `${color}.main` }}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ fontSize: 40, mb: 1 }}>{icon}</Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Hospital Locator Admin
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hệ thống Quản lý Bản đồ Y tế TP. Hồ Chí Minh
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>
            Làm mới
          </Button>
          <Button variant="contained" startIcon={<MapIcon />} href="http://localhost:3000">
            Xem bản đồ
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon="🏥" label="Tổng cơ sở" value={stats.total} color="primary" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon="🏥" label="Công lập" value={stats.public} color="success" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon="🏨" label="Tư nhân" value={stats.private} color="error" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon="🏥" label="Phòng khám" value={stats.clinic} color="warning" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon="🚑" label="Có cấp cứu" value={stats.emergency} color="secondary" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard icon="✅" label="Hoạt động" value={stats.active} color="info" />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ⚡ Thao tác nhanh
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
              Thêm bệnh viện
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={exportToCSV}>
              Xuất CSV
            </Button>
            <Button variant="outlined" startIcon={<MapIcon />} href="http://localhost:3000" target="_blank">
              Xem bản đồ
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Hospital List */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label="Tìm kiếm bệnh viện..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Loại cơ sở</InputLabel>
              <Select
                value={filterType}
                label="Loại cơ sở"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="public">Công lập</MenuItem>
                <MenuItem value="private">Tư nhân</MenuItem>
                <MenuItem value="clinic">Phòng khám</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#1976d2' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tên bệnh viện</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Loại</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Quận/Huyện</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Điện thoại</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cấp cứu</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 1 }}>Đang tải dữ liệu...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredHospitals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">Không tìm thấy bệnh viện nào</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHospitals.map((hospital) => (
                    <TableRow key={hospital.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {hospital.name}
                        </Typography>
                        {hospital.name_en && (
                          <Typography variant="caption" color="text.secondary">
                            {hospital.name_en}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getTypeLabel(hospital.hospital_type)} 
                          color={getTypeColor(hospital.hospital_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {hospital.district ? getDistrictName(hospital.district) : '-'}
                      </TableCell>
                      <TableCell>{hospital.phone || '-'}</TableCell>
                      <TableCell>
                        {hospital.emergency_services ? (
                          <Chip label="Có" color="success" size="small" />
                        ) : (
                          <Chip label="Không" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={hospital.is_active ? 'Hoạt động' : 'Tạm dừng'}
                          color={hospital.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton size="small" color="primary" href={`/hospital/${hospital.id}`}>
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {filteredHospitals.length} / {stats.total} bệnh viện
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Add Hospital Dialog */}
      <Dialog open={addDialogOpen} onClose={() => !saving && setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add /> Thêm bệnh viện mới
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}>
                Thông tin cơ bản
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên bệnh viện *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên tiếng Anh"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Loại cơ sở *</InputLabel>
                <Select
                  name="hospital_type"
                  value={formData.hospital_type}
                  label="Loại cơ sở *"
                  onChange={handleInputChange}
                  disabled={saving}
                >
                  <MenuItem value="public">Bệnh viện công lập</MenuItem>
                  <MenuItem value="private">Bệnh viện tư nhân</MenuItem>
                  <MenuItem value="clinic">Phòng khám</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Chuyên khoa chính</InputLabel>
                <Select
                  name="main_specialty"
                  value={formData.main_specialty}
                  label="Chuyên khoa chính"
                  onChange={handleInputChange}
                  disabled={saving}
                >
                  {SPECIALTIES.map(s => (
                    <MenuItem key={s.code} value={s.code}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1, mt: 1 }}>
                Địa chỉ
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ *"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                error={!!formErrors.address}
                helperText={formErrors.address}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.district}>
                <InputLabel>Quận/Huyện *</InputLabel>
                <Select
                  name="district"
                  value={formData.district}
                  label="Quận/Huyện *"
                  onChange={handleInputChange}
                  disabled={saving}
                >
                  {DISTRICTS.map(d => (
                    <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>
                  ))}
                </Select>
                {formErrors.district && <FormHelperText>{formErrors.district}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phường/Xã"
                name="ward"
                value={formData.ward}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1, mt: 1 }}>
                Thông tin liên hệ
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Điện thoại *"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1, mt: 1 }}>
                Dịch vụ
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Giờ hoạt động"
                name="working_hours"
                value={formData.working_hours}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Số giường"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    name="emergency_services"
                    checked={formData.emergency_services}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                  Cấp cứu 24/7
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    name="ambulance_services"
                    checked={formData.ambulance_services}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                  Xe cứu thương
                </label>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1, mt: 1 }}>
                Tọa độ GPS
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vĩ độ (Latitude)"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="10.8231"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kinh độ (Longitude)"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="106.6297"
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                  <strong>Đang hoạt động</strong>
                </label>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} disabled={saving}>Hủy</Button>
          <Button 
            variant="contained" 
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu bệnh viện'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;
