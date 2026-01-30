"""
Script tạo dữ liệu bệnh viện mẫu cho TP.HCM
Chạy: python manage.py shell < create_sample_data.py
"""

from hospitals.models import Hospital

# Xóa dữ liệu cũ
print("🗑️  Đang xóa dữ liệu cũ...")
Hospital.objects.all().delete()
print("✓ Đã xóa xong")

# Danh sách bệnh viện TP.HCM
hospitals_data = [
    {
        'name': 'Bệnh viện Chợ Rẫy',
        'name_en': 'Cho Ray Hospital',
        'address': '120 Hồng Bàng, Phường 12, Quận 5',
        'phone': '028 3855 4138',
        'hospital_type': 'public',
        'main_specialty': 'general',
        'emergency_services': True,
        'latitude': 10.7506,
        'longitude': 106.6550,
        'district': 'quan5',
    },
    {
        'name': 'Bệnh viện Đại học Y Dược TP.HCM',
        'name_en': 'University Medical Center',
        'address': '215 Hồng Bàng, Phường 12, Quận 5',
        'phone': '028 3855 4138',
        'hospital_type': 'public',
        'main_specialty': 'general',
        'emergency_services': True,
        'latitude': 10.7498,
        'longitude': 106.6560,
        'district': 'quan5',
    },
    {
        'name': 'Bệnh viện FV',
        'name_en': 'FV Hospital',
        'address': '6 Nguyễn Lương Bằng, Quận 7',
        'phone': '028 5411 3333',
        'hospital_type': 'private',
        'main_specialty': 'general',
        'emergency_services': True,
        'latitude': 10.7290,
        'longitude': 106.7023,
        'district': 'quan7',
    },
    {
        'name': 'Bệnh viện Nhi Đồng 1',
        'name_en': 'Children Hospital 1',
        'address': '3 Lê Văn Dĩnh, Quận Bình Thạnh',
        'phone': '028 3841 3829',
        'hospital_type': 'public',
        'main_specialty': 'pediatrics',
        'emergency_services': True,
        'latitude': 10.8030,
        'longitude': 106.7180,
        'district': 'binhthanh',
    },
    {
        'name': 'Bệnh viện 115',
        'name_en': 'Hospital 115',
        'address': '527 Sư Vạn Hạnh, Quận 10',
        'phone': '028 3865 1115',
        'hospital_type': 'public',
        'main_specialty': 'general',
        'emergency_services': True,
        'latitude': 10.7910,
        'longitude': 106.6680,
        'district': 'quan10',
    },
    {
        'name': 'Bệnh viện Tai Mũi Họng TP.HCM',
        'name_en': 'ENT Hospital HCMC',
        'address': '155-157 Trần Quốc Thảo, Quận 3',
        'phone': '028 3931 0774',
        'hospital_type': 'public',
        'main_specialty': 'ent',
        'emergency_services': False,
        'latitude': 10.7862,
        'longitude': 106.6861,
        'district': 'quan3',
    },
    {
        'name': 'Bệnh viện Mắt TP.HCM',
        'name_en': 'Eye Hospital HCMC',
        'address': '280 Điện Biên Phủ, Quận 3',
        'phone': '028 3932 5565',
        'hospital_type': 'public',
        'main_specialty': 'ophthalmology',
        'emergency_services': False,
        'latitude': 10.7823,
        'longitude': 106.6849,
        'district': 'quan3',
    },
    {
        'name': 'Bệnh viện Đa khoa Tâm Đức',
        'name_en': 'Tam Duc Hospital',
        'address': '138 Nguyễn Gia Trí, Quận Bình Thạnh',
        'phone': '028 3516 5000',
        'hospital_type': 'private',
        'main_specialty': 'cardiology',
        'emergency_services': True,
        'latitude': 10.8100,
        'longitude': 106.7200,
        'district': 'binhthanh',
    },
    {
        'name': 'Bệnh viện Quận Gò Vấp',
        'name_en': 'Go Vap District Hospital',
        'address': '212 Lê Đức Thọ, Quận Gò Vấp',
        'phone': '028 3588 9246',
        'hospital_type': 'public',
        'main_specialty': 'general',
        'emergency_services': True,
        'latitude': 10.8389,
        'longitude': 106.6722,
        'district': 'govap',
    },
    {
        'name': 'Bệnh viện Quận Thủ Đức',
        'name_en': 'Thu Duc District Hospital',
        'address': '64 Lê Văn Chí, TP. Thủ Đức',
        'phone': '028 3896 0187',
        'hospital_type': 'public',
        'main_specialty': 'general',
        'emergency_services': True,
        'latitude': 10.8542,
        'longitude': 106.7556,
        'district': 'thuduc',
    },
]

# Thêm dữ liệu mới
print("📝  Đang thêm dữ liệu bệnh viện mới...")
for h in hospitals_data:
    try:
        Hospital.objects.create(**h)
        print(f"  ✓ {h['name']}")
    except Exception as e:
        print(f"  ✗ {h['name']}: {e}")

# Thống kê
total = Hospital.objects.count()
print(f"\n📊 Thống kê:")
print(f"  Tổng số bệnh viện: {total}")
print(f"  Công lập: {Hospital.objects.filter(hospital_type='public').count()}")
print(f"  Tư nhân: {Hospital.objects.filter(hospital_type='private').count()}")
print(f"  Có cấp cứu: {Hospital.objects.filter(emergency_services=True).count()}")
print(f"\n✅ Hoàn tất!")

