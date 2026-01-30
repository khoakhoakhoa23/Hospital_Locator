from django.db import models


class Hospital(models.Model):
    """Model đại diện cho bệnh viện"""

    # Loại bệnh viện
    HOSPITAL_TYPES = [
        ('public', 'Công lập'),
        ('private', 'Tư nhân'),
        ('clinic', 'Phòng khám'),
    ]

    # Các quận/huyện của TP.HCM
    DISTRICTS = [
        ('quan1', 'Quận 1'),
        ('quan2', 'Quận 2'),
        ('quan3', 'Quận 3'),
        ('quan4', 'Quận 4'),
        ('quan5', 'Quận 5'),
        ('quan6', 'Quận 6'),
        ('quan7', 'Quận 7'),
        ('quan8', 'Quận 8'),
        ('quan9', 'Quận 9'),
        ('quan10', 'Quận 10'),
        ('quan11', 'Quận 11'),
        ('quan12', 'Quận 12'),
        ('binhthanh', 'Quận Bình Thạnh'),
        ('govap', 'Quận Gò Vấp'),
        ('phunhuan', 'Quận Phú Nhuận'),
        ('tanbinh', 'Quận Tân Bình'),
        ('tanphu', 'Quận Tân Phú'),
        ('thuduc', 'Quận Thủ Đức'),
        ('binhtan', 'Quận Bình Tân'),
        ('hocmon', 'Huyện Hóc Môn'),
        ('cuchi', 'Huyện Củ Chi'),
        ('nhabe', 'Huyện Nhà Bè'),
        ('canggio', 'Huyện Cần Giờ'),
    ]

    # Chuyên khoa chính
    SPECIALTIES = [
        ('general', 'Đa khoa'),
        ('pediatrics', 'Nhi'),
        ('obstetrics', 'Sản'),
        ('cardiology', 'Tim mạch'),
        ('oncology', 'Ung bướu'),
        ('neurology', 'Thần kinh'),
        ('orthopedics', 'Chỉnh hình'),
        ('ophthalmology', 'Mắt'),
        ('dentistry', 'Răng hàm mặt'),
        ('dermatology', 'Da liễu'),
    ]

    # Thông tin cơ bản
    name = models.CharField('Tên bệnh viện', max_length=200)
    name_en = models.CharField('Tên tiếng Anh', max_length=200, blank=True)
    hospital_type = models.CharField('Loại bệnh viện', max_length=20, choices=HOSPITAL_TYPES, default='public')

    # Thông tin địa chỉ
    address = models.TextField('Địa chỉ')
    district = models.CharField('Quận/Huyện', max_length=20, choices=DISTRICTS)
    ward = models.CharField('Phường/Xã', max_length=100, blank=True)

    # Thông tin liên hệ
    phone = models.CharField('Số điện thoại', max_length=20, blank=True)
    email = models.EmailField('Email', blank=True)
    website = models.URLField('Website', blank=True)
    facebook = models.URLField('Facebook', blank=True)

    # Thông tin chuyên môn
    main_specialty = models.CharField('Chuyên khoa chính', max_length=20, choices=SPECIALTIES, default='general')
    specialties = models.JSONField('Các chuyên khoa', default=list, blank=True)
    description = models.TextField('Mô tả', blank=True)

    # Thông tin vị trí (GIS - WGS84 coordinate system)
    latitude = models.FloatField('Vĩ độ', null=True, blank=True)
    longitude = models.FloatField('Kinh độ', null=True, blank=True)

    # Thông tin hoạt động
    working_hours = models.JSONField('Giờ làm việc', default=dict, blank=True)  # {'monday': '8:00-17:00', ...}
    emergency_services = models.BooleanField('Có cấp cứu', default=False)
    ambulance_services = models.BooleanField('Có xe cứu thương', default=False)

    # Thông tin bổ sung
    capacity = models.PositiveIntegerField('Sức chứa giường bệnh', null=True, blank=True)
    doctors_count = models.PositiveIntegerField('Số bác sĩ', null=True, blank=True)
    nurses_count = models.PositiveIntegerField('Số y tá', null=True, blank=True)

    # Metadata
    is_active = models.BooleanField('Đang hoạt động', default=True)
    created_at = models.DateTimeField('Ngày tạo', auto_now_add=True)
    updated_at = models.DateTimeField('Ngày cập nhật', auto_now=True)

    class Meta:
        verbose_name = 'Bệnh viện'
        verbose_name_plural = 'Bệnh viện'
        ordering = ['name']
        indexes = [
            models.Index(fields=['hospital_type']),
            models.Index(fields=['district']),
            models.Index(fields=['main_specialty']),
            # GIS: Spatial index cho hiệu suất truy vấn không gian
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    @property
    def full_address(self):
        """Địa chỉ đầy đủ"""
        parts = [self.address]
        if self.ward:
            parts.append(f"Phường {self.ward}")
        if self.district:
            district_name = dict(self.DISTRICTS).get(self.district, self.district)
            parts.append(district_name)
        parts.append("TP. Hồ Chí Minh")
        return ", ".join(parts)

    @property
    def hospital_type_display(self):
        """Hiển thị loại bệnh viện"""
        return dict(self.HOSPITAL_TYPES).get(self.hospital_type, self.hospital_type)

    @property
    def district_display(self):
        """Hiển thị tên quận/huyện"""
        return dict(self.DISTRICTS).get(self.district, self.district)

    @property
    def main_specialty_display(self):
        """Hiển thị chuyên khoa chính"""
        return dict(self.SPECIALTIES).get(self.main_specialty, self.main_specialty)


# HospitalImage model removed - focusing on GIS core features
# Images can be added later if needed
