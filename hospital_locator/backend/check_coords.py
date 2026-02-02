import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from hospitals.models import Hospital

# Check dermatology hospital
h = Hospital.objects.filter(main_specialty='dermatology').first()
if h:
    print(f'Name: {h.name}')
    print(f'Address: {h.address}')
    print(f'Coords: {h.latitude}, {h.longitude}')
    
    # Check if coordinates are correct
    if h.latitude == 10.7949 and h.longitude == 106.6525:
        print('\nCoordinates are CORRECT!')
    else:
        print(f'\nCoordinates need to be updated!')
        print(f'Expected: 10.7949, 106.6525')
        print(f'Got: {h.latitude}, {h.longitude}')
else:
    print('No dermatology hospital found')

# Count all hospitals
print(f'\nTotal hospitals: {Hospital.objects.count()}')

