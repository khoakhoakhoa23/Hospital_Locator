#!/usr/bin/env python
import os
import sys

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'hospital_locator', 'backend')
sys.path.insert(0, backend_path)

print("Backend path:", backend_path)
print("Python path includes:", backend_path in sys.path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

try:
    import django
    django.setup()
    print("✓ Django imported successfully")

    from hospitals.models import Hospital
    print("✓ Hospital model imported successfully")
    print("✓ Model fields:", [f.name for f in Hospital._meta.fields[:5]])

    print("\n🎉 Backend setup is correct!")

except Exception as e:
    print("❌ Error:", str(e))
    import traceback
    traceback.print_exc()

