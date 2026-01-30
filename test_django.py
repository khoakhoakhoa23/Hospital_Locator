#!/usr/bin/env python
import os
import sys

# Add the project directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'hospital_locator', 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

try:
    import django
    django.setup()

    from hospitals.models import Hospital
    print("✓ Django setup successful")
    print("✓ Models imported successfully")
    print("✓ Hospital model:", Hospital.__name__)

    # Check database tables
    from django.db import connection
    tables = connection.introspection.table_names()
    print("✓ Database tables:", len(tables), "tables found")

    hospital_tables = [t for t in tables if 'hospital' in t.lower()]
    print("✓ Hospital-related tables:", hospital_tables)

    # Try to get hospital count
    count = Hospital.objects.count()
    print("✓ Hospital records in database:", count)

    print("\n🎉 Django project is working correctly!")

except Exception as e:
    print("❌ Error:", str(e))
    import traceback
    traceback.print_exc()
