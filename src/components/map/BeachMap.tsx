import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Paper, Chip, Alert } from '@mui/material';
import { BeachAccess, Warning, CheckCircle, LocationOn } from '@mui/icons-material';

// Fix for default markers in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icons for different types of markers
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `)}`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const centerIcon = createCustomIcon('#1976d2');
const lifeguardIcon = createCustomIcon('#4caf50');
const alertIcon = createCustomIcon('#f44336');
const warningIcon = createCustomIcon('#ff9800');

interface BeachCenter {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'open' | 'closed' | 'warning';
  lifeguards_on_duty: number;
  weather_condition: string;
  water_temperature: number;
  air_temperature: number;
  wind_speed: number;
  visibility: number;
}

interface EmergencyAlert {
  id: string;
  center_id: string;
  type: 'sos' | 'medical' | 'weather' | 'safety';
  location: {
    lat: number;
    lng: number;
  };
  description: string;
  status: 'active' | 'resolved';
  created_at: string;
}

interface SafetyZone {
  id: string;
  center_id: string;
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  type: 'swimming' | 'surfing' | 'restricted' | 'safe';
  description: string;
}

interface BeachMapProps {
  centers?: BeachCenter[];
  alerts?: EmergencyAlert[];
  safetyZones?: SafetyZone[];
  userLocation?: { lat: number; lng: number };
  onCenterClick?: (center: BeachCenter) => void;
  onAlertClick?: (alert: EmergencyAlert) => void;
  showUserLocation?: boolean;
  showSafetyZones?: boolean;
  showAlerts?: boolean;
  view?: 'satellite' | 'street' | 'hybrid';
}

// Component to handle map updates
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

// Component to show user location
const UserLocationMarker: React.FC<{ location: { lat: number; lng: number } }> = ({ location }) => {
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={centerIcon}
    >
      <Popup>
        <Typography variant="subtitle2" fontWeight="bold">
          Your Location
        </Typography>
        <Typography variant="body2">
          Lat: {location.lat.toFixed(6)}<br />
          Lng: {location.lng.toFixed(6)}
        </Typography>
      </Popup>
    </Marker>
  );
};

const BeachMap: React.FC<BeachMapProps> = ({
  centers = [],
  alerts = [],
  safetyZones = [],
  userLocation,
  onCenterClick,
  onAlertClick,
  showUserLocation = true,
  showSafetyZones = true,
  showAlerts = true,
  view = 'street',
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.7617, -80.1918]); // Miami Beach default
  const [mapZoom, setMapZoom] = useState(12);
  const [userLocationState, setUserLocationState] = useState<{ lat: number; lng: number } | null>(userLocation || null);

  // Get user location on component mount
  useEffect(() => {
    if (showUserLocation && !userLocationState) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocationState({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.log('Error getting user location:', error);
        }
      );
    }
  }, [showUserLocation, userLocationState]);

  // Update map center when centers are provided
  useEffect(() => {
    if (centers.length > 0) {
      const avgLat = centers.reduce((sum, center) => sum + center.location.lat, 0) / centers.length;
      const avgLng = centers.reduce((sum, center) => sum + center.location.lng, 0) / centers.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [centers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'closed': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircle fontSize="small" />;
      case 'closed': return <Warning fontSize="small" />;
      case 'warning': return <Warning fontSize="small" />;
      default: return <BeachAccess fontSize="small" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'sos': return <Warning color="error" />;
      case 'medical': return <Warning color="error" />;
      case 'weather': return <Warning color="warning" />;
      case 'safety': return <Warning color="info" />;
      default: return <Warning />;
    }
  };

  const getSafetyZoneColor = (type: string) => {
    switch (type) {
      case 'swimming': return '#4caf50';
      case 'surfing': return '#2196f3';
      case 'restricted': return '#f44336';
      case 'safe': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box sx={{ width: '100%', height: '600px', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* Base tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {showUserLocation && userLocationState && (
          <UserLocationMarker location={userLocationState} />
        )}

        {/* Beach centers */}
        {centers.map((center) => (
          <Marker
            key={center.id}
            position={[center.location.lat, center.location.lng]}
            icon={centerIcon}
            eventHandlers={{
              click: () => onCenterClick?.(center),
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {center.name}
                </Typography>
                
                <Chip
                  icon={getStatusIcon(center.status)}
                  label={center.status.toUpperCase()}
                  color={getStatusColor(center.status) as any}
                  size="small"
                  sx={{ mb: 1 }}
                />
                
                <Typography variant="body2" gutterBottom>
                  <strong>Lifeguards on Duty:</strong> {center.lifeguards_on_duty}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Weather:</strong> {center.weather_condition}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Water Temp:</strong> {center.water_temperature}°C
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Air Temp:</strong> {center.air_temperature}°C
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Wind:</strong> {center.wind_speed} km/h
                </Typography>
                
                <Typography variant="body2">
                  <strong>Visibility:</strong> {center.visibility} km
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}

        {/* Safety zones */}
        {showSafetyZones && safetyZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.location.lat, zone.location.lng]}
            radius={zone.radius}
            pathOptions={{
              color: getSafetyZoneColor(zone.type),
              fillColor: getSafetyZoneColor(zone.type),
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {zone.type.toUpperCase()} Zone
                </Typography>
                <Typography variant="body2">
                  {zone.description}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Radius:</strong> {zone.radius}m
                </Typography>
              </Box>
            </Popup>
          </Circle>
        ))}

        {/* Emergency alerts */}
        {showAlerts && alerts.map((alert) => (
          <Marker
            key={alert.id}
            position={[alert.location.lat, alert.location.lng]}
            icon={alertIcon}
            eventHandlers={{
              click: () => onAlertClick?.(alert),
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getAlertIcon(alert.type)}
                  <Typography variant="h6" fontWeight="bold" sx={{ ml: 1 }}>
                    {alert.type.toUpperCase()} Alert
                  </Typography>
                </Box>
                
                <Chip
                  label={alert.status.toUpperCase()}
                  color={alert.status === 'active' ? 'error' : 'success'}
                  size="small"
                  sx={{ mb: 1 }}
                />
                
                <Typography variant="body2" gutterBottom>
                  {alert.description}
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  {new Date(alert.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default BeachMap; 