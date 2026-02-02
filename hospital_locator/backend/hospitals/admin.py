from django.contrib import admin
from django.contrib.admin import AdminSite
from django.shortcuts import render
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import Hospital


# ===========================
# Custom Admin Site
# ===========================
class HospitalAdminSite(AdminSite):
    """Custom Admin Site cho Hospital Locator"""
    
    site_header = _('🏥 Hospital Locator - Quản lý Bệnh viện')
    site_title = _('Hospital Locator Admin')
    index_title = _('Quản lý Hệ thống Bản đồ Y tế TP.HCM')
    
    def get_app_list(self, request, app_label=None):
        """Sắp xếp app list theo tùy chỉnh"""
        app_list = super().get_app_list(request, app_label)
        return app_list
    
    def index(self, request, extra_context=None):
        """Custom admin index với statistics"""
        from .models import Hospital
        
        # Tính toán thống kê
        total_hospitals = Hospital.objects.count()
        public_hospitals = Hospital.objects.filter(hospital_type='public').count()
        private_hospitals = Hospital.objects.filter(hospital_type='private').count()
        clinic_count = Hospital.objects.filter(hospital_type='clinic').count()
        emergency_count = Hospital.objects.filter(emergency_services=True).count()
        active_count = Hospital.objects.filter(is_active=True).count()
        recent_hospitals = Hospital.objects.all().order_by('-id')[:10]
        
        extra_context = extra_context or {}
        extra_context.update({
            'total_hospitals': total_hospitals,
            'public_hospitals': public_hospitals,
            'private_hospitals': private_hospitals,
            'clinic_count': clinic_count,
            'emergency_count': emergency_count,
            'active_count': active_count,
            'recent_hospitals': recent_hospitals,
        })
        
        return super().index(request, extra_context)
    
    index_template = 'admin/index/custom_index.html'
    def each_context(self, request):
        context = super().each_context(request)
        context['css_files'] = context.get('css_files', []) + ['admin/css/hospital_admin.css']
        return context


# Tạo instance admin site tùy chỉnh
admin_site = HospitalAdminSite(name='hospital_admin')


# ===========================
# Custom Hospital Admin
# ===========================
@admin.register(Hospital, site=admin_site)
class HospitalAdmin(admin.ModelAdmin):
    """Admin interface cho bệnh viện"""
    
    # Hiển thị danh sách
    list_display = [
        'name', 
        'hospital_type_icon',
        'district_icon',
        'main_specialty_display',
        'phone',
        'emergency_icon',
        'is_active'
    ]
    
    # Số dòng mỗi trang
    list_per_page = 25
    
    # Bộ lọc sidebar
    list_filter = [
        'hospital_type', 
        'district', 
        'main_specialty', 
        'emergency_services',
        'ambulance_services', 
        'is_active'
    ]
    
    # Tìm kiếm
    search_fields = ['name', 'name_en', 'address', 'phone', 'email']
    
    # Sắp xếp mặc định
    ordering = ['name']
    
    # Readonly fields
    readonly_fields = ['created_at', 'updated_at']
    
    # Actions tùy chỉnh
    actions = ['activate_hospitals', 'deactivate_hospitals', 'export_to_csv']
    
    # Fieldsets để nhóm các trường
    fieldsets = (
        (_('📋 Thông tin cơ bản'), {
            'fields': ('name', 'name_en', 'hospital_type', 'description'),
            'classes': ('wide',)
        }),
        (_('📍 Địa chỉ'), {
            'fields': ('address', 'district', 'ward'),
            'classes': ('wide',)
        }),
        (_('📞 Thông tin liên hệ'), {
            'fields': ('phone', 'email', 'website', 'facebook'),
            'classes': ('wide',)
        }),
        (_('🩺 Chuyên môn'), {
            'fields': ('main_specialty', 'specialties'),
            'classes': ('wide',)
        }),
        (_('🌍 Vị trí GIS'), {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse', 'wide'),
            'description': _('Tọa độ địa lý theo hệ thống WGS84 (EPSG:4326)')
        }),
        (_('⏰ Hoạt động'), {
            'fields': ('working_hours', 'emergency_services', 'ambulance_services'),
            'classes': ('wide',)
        }),
        (_('📊 Thông tin cơ sở'), {
            'fields': ('capacity', 'doctors_count', 'nurses_count'),
            'classes': ('collapse', 'wide')
        }),
        (_('✅ Trạng thái'), {
            'fields': ('is_active',),
            'classes': ('wide',)
        }),
        (_('📅 Metadata'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # ===========================
    # Custom Methods
    # ===========================
    
    def hospital_type_icon(self, obj):
        """Hiển thị icon theo loại bệnh viện"""
        if obj.hospital_type == 'public':
            icon = '🏥'
            color = 'green'
        elif obj.hospital_type == 'private':
            icon = '🏨'
            color = 'red'
        else:
            icon = '🏥'
            color = 'orange'
        
        return format_html(
            '<span style="color: {1}">{0}</span> {2}',
            icon,
            color,
            obj.get_hospital_type_display()
        )
    hospital_type_icon.short_description = _('Loại')
    hospital_type_icon.admin_order_field = 'hospital_type'
    
    def district_icon(self, obj):
        """Hiển thị tên quận với icon"""
        return format_html(
            '📍 {}',
            obj.get_district_display() if obj.district else '-'
        )
    district_icon.short_description = _('Quận/Huyện')
    district_icon.admin_order_field = 'district'
    
    def emergency_icon(self, obj):
        """Hiển thị icon cấp cứu"""
        if obj.emergency_services:
            return format_html(
                '<span style="background-color: #d32f2f; color: white; padding: 2px 8px; border-radius: 4px;">🚑 Có</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #757575; color: white; padding: 2px 8px; border-radius: 4px;">❌ Không</span>'
            )
    emergency_icon.short_description = _('Cấp cứu')
    emergency_icon.admin_order_field = 'emergency_services'
    
    # ===========================
    # Custom Actions
    # ===========================
    
    def activate_hospitals(self, request, queryset):
        """Kích hoạt bệnh viện"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            format_html(_('✅ Đã kích hoạt <b>{}</b> bệnh viện.'), updated)
        )
    activate_hospitals.short_description = _('Kích hoạt các bệnh viện đã chọn')
    
    def deactivate_hospitals(self, request, queryset):
        """Vô hiệu hóa bệnh viện"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            format_html(_('❌ Đã vô hiệu hóa <b>{}</b> bệnh viện.'), updated)
        )
    deactivate_hospitals.short_description = _('Vô hiệu hóa các bệnh viện đã chọn')
    
    def export_to_csv(self, request, queryset):
        """Xuất danh sách bệnh viện ra CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="hospitals.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Tên', 'Tên tiếng Anh', 'Loại', 'Địa chỉ', 'Quận',
            'Điện thoại', 'Email', 'Website', 'Chuyên khoa chính',
            'Cấp cứu', 'Sức chứa', 'Kinh độ', 'Vĩ độ', 'Hoạt động'
        ])
        
        for hospital in queryset:
            writer.writerow([
                hospital.name,
                hospital.name_en or '',
                hospital.get_hospital_type_display(),
                hospital.address,
                hospital.get_district_display() if hospital.district else '',
                hospital.phone or '',
                hospital.email or '',
                hospital.website or '',
                hospital.get_main_specialty_display() if hospital.main_specialty else '',
                'Có' if hospital.emergency_services else 'Không',
                hospital.capacity or '',
                hospital.longitude or '',
                hospital.latitude or '',
                'Có' if hospital.is_active else 'Không'
            ])
        
        self.message_user(request, _('📄 Đã xuất {} bệnh viện ra CSV.').format(queryset.count()))
        return response
    export_to_csv.short_description = _('Xuất ra CSV')
    
    # ===========================
    # Save Model
    # ===========================
    
    def save_model(self, request, obj, form, change):
        """Custom save method"""
        super().save_model(request, obj, form, change)
        if change:
            self.message_user(
                request,
                format_html(_('✅ Đã cập nhật bệnh viện: <b>{}</b>'), obj.name)
            )
        else:
            self.message_user(
                request,
                format_html(_('🆕 Đã thêm mới bệnh viện: <b>{}</b>'), obj.name)
            )


# ===========================
# Remove HospitalImage admin
# ===========================
# HospitalImage model đã được xóa khỏi models.py
# Nên không cần admin cho nó nữa
