import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap, GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom hospital marker colors
const hospitalColors = {
  public: '#28a745',   // Green
  private: '#dc3545',  // Red
  clinic: '#ffc107'    // Yellow
};

// Create custom hospital icon
const createHospitalIcon = (hospitalType, isEmergency = false) => {
  const color = hospitalColors[hospitalType] || '#6c757d';

  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `<div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">${isEmergency ? '🚑' : '🏥'}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// User location marker
const userLocationIcon = L.divIcon({
  className: 'user-marker',
  html: `<div style="
    background-color: #007bff;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 4px solid rgba(255,255,255,0.8);
    box-shadow: 0 2px 12px rgba(0,123,255,0.6);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Component to handle map resize
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

// Component to auto-center map on hospitals change ONLY
function MapUpdater({ hospitals }) {
  const map = useMap();

  useEffect(() => {
    if (hospitals && hospitals.length > 0) {
      // Find valid coordinates
      const validHospitals = hospitals.filter(h => h.latitude && h.longitude);
      if (validHospitals.length > 0) {
        // Fit bounds to show all hospitals
        const bounds = L.latLngBounds(
          validHospitals.map(h => [h.latitude, h.longitude])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [hospitals, map]); // Only run when hospitals list changes

  return null;
}

// Component to pick location on map
function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });

  // Change cursor to crosshair
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = 'crosshair';
    return () => {
      map.getContainer().style.cursor = '';
    };
  }, [map]);

  return null;
}

const MapContainer = forwardRef(({ hospitals = [], userLocation, onHospitalClick, isSelectingLocation, onLocationSelect, ...props }, ref) => {
  const defaultCenter = [10.762622, 106.660172];
  const defaultZoom = 12;
  const mapRef = React.useRef(null);

  useImperativeHandle(ref, () => ({
    setView: (center, zoom) => mapRef.current?.setView(center, zoom),
    getMap: () => mapRef.current
  }));

  // Handle map load
  const handleMapLoad = (map) => {
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <LeafletMap
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        whenReady={({ target }) => handleMapLoad(target)}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <MapResizer />
        <MapUpdater hospitals={hospitals} />
        {isSelectingLocation && <LocationPicker onLocationSelect={onLocationSelect} />}

        {/* User location */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <strong>📍 Vị trí của bạn</strong>
                <p style={{ margin: '4px 0', fontSize: '12px' }}>
                  Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hospital markers */}
        {hospitals.map((hospital) => {
          // Parse coordinates to ensure they are numbers
          const lat = parseFloat(hospital.latitude);
          const lng = parseFloat(hospital.longitude);

          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={hospital.id}
              position={[lat, lng]}
              icon={createHospitalIcon(hospital.hospital_type, hospital.emergency_services)}
              zIndexOffset={1000}
              eventHandlers={{
                click: () => onHospitalClick?.(hospital)
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '14px' }}>
                    🏥 {hospital.name}
                  </h4>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    📍 {hospital.address || 'Chưa có địa chỉ'}
                  </p>
                  {hospital.phone && (
                    <p style={{ margin: '4px 0', fontSize: '12px' }}>
                      📞 {hospital.phone}
                    </p>
                  )}
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      backgroundColor: hospital.hospital_type === 'public' ? '#28a745' :
                        hospital.hospital_type === 'private' ? '#dc3545' : '#ffc107',
                      color: 'white'
                    }}>
                      {hospital.hospital_type === 'public' ? 'Công lập' :
                        hospital.hospital_type === 'private' ? 'Tư nhân' : 'Phòng khám'}
                    </span>
                    {hospital.emergency_services && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: '#dc3545',
                        color: 'white'
                      }}>
                        🚑 Cấp cứu
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <button
                      className="popup-directions-btn"
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        width: '100%'
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening the big dialog
                        props.onHospitalClick?.(hospital); // Or trigger direction specifically if we add a prop
                        // Since we don't have a direct prop for direction in MapContainer yet, 
                        // let's just let it open the details dialog which now has the fixed button.
                        // Actually, user wants quick access.
                        // But sticking to one flow is safer: Click Marker -> Details Dialog -> Directions.
                        // The user complained about "not directing on this map".
                        // Let's stick to fixing the modal first as it's the main entry point.
                      }}
                    >
                      Xem chi tiết & Chỉ đường
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route visualization */}
        {props.routeGeometry && (
          <GeoJSON
            key={JSON.stringify(props.routeGeometry)}
            data={props.routeGeometry}
            style={{ color: '#007bff', weight: 5, opacity: 0.7 }}
          />
        )}
      </LeafletMap>
    </div>
  );
});

export default MapContainer;
