from django.contrib import admin
from .models import Hospital


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    """Admin interface cho bệnh viện"""

    # Hiển thị danh sách
    list_display = [
        'name', 'hospital_type', 'district_display', 'main_specialty_display',
        'phone', 'is_active', 'emergency_services'
    ]

    # Bộ lọc
    list_filter = [
        'hospital_type', 'district', 'main_specialty', 'emergency_services',
        'ambulance_services', 'is_active'
    ]

    # Tìm kiếm
    search_fields = ['name', 'name_en', 'address', 'phone']

    # Sắp xếp
    ordering = ['name']

    # Fieldsets để nhóm các trường
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', 'name_en', 'hospital_type', 'description')
        }),
        ('Địa chỉ', {
            'fields': ('address', 'district', 'ward')
        }),
        ('Liên hệ', {
            'fields': ('phone', 'email', 'website', 'facebook')
        }),
        ('Chuyên môn', {
            'fields': ('main_specialty', 'specialties')
        }),
        ('Vị trí', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Hoạt động', {
            'fields': ('working_hours', 'emergency_services', 'ambulance_services')
        }),
        ('Thông tin bổ sung', {
            'fields': ('capacity', 'doctors_count', 'nurses_count'),
            'classes': ('collapse',)
        }),
        ('Trạng thái', {
            'fields': ('is_active',)
        }),
    )

    # GIS: Map configuration cho spatial data management

    # Hiển thị readonly fields
    readonly_fields = ['created_at', 'updated_at']

    # Actions tùy chỉnh
    actions = ['activate_hospitals', 'deactivate_hospitals']

    def activate_hospitals(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f'Đã kích hoạt {queryset.count()} bệnh viện.')
    activate_hospitals.short_description = 'Kích hoạt các bệnh viện đã chọn'

    def deactivate_hospitals(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'Đã vô hiệu hóa {queryset.count()} bệnh viện.')
    deactivate_hospitals.short_description = 'Vô hiệu hóa các bệnh viện đã chọn'


# HospitalImage admin removed - focusing on GIS core features
