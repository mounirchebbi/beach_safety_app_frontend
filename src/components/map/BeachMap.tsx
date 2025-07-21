import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Paper, Chip, Alert, CircularProgress, Button } from '@mui/material';
import { BeachAccess, Warning, CheckCircle, LocationOn, WbSunny, Air, Visibility, Person } from '@mui/icons-material';
import { SafetyZone } from '../../types';

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
  wave_height: number;
  current_speed: number;
  flag_status: 'green' | 'yellow' | 'red' | 'black';
  flag_reason?: string;
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
  center?: [number, number];
  zoom?: number;
}

// Component to handle map updates
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && center && zoom) {
      // Add a shorter delay to ensure map is fully initialized
      const timer = setTimeout(() => {
        try {
          // Check if map container exists and is ready
          const container = map.getContainer();
          if (container && container.style) {
            // Check if map is properly initialized by checking if it has a size
            const size = map.getSize();
            if (size && size.x > 0 && size.y > 0) {
              map.setView(center, zoom, { animate: true });
            } else {
              // If map is not fully loaded, try again after a shorter delay
              setTimeout(() => {
                try {
                  const retrySize = map.getSize();
                  if (retrySize && retrySize.x > 0 && retrySize.y > 0) {
                    map.setView(center, zoom, { animate: true });
                  }
                } catch (error) {
                  console.warn('Map update retry failed:', error);
                }
              }, 100);
            }
          }
        } catch (error) {
          console.warn('Map update failed:', error);
        }
      }, 200); // Reduced delay to 200ms for faster response
      
      return () => clearTimeout(timer);
    }
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
  center,
  zoom,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.7617, -80.1918]); // Miami Beach default
  const [mapZoom, setMapZoom] = useState(12);
  const [userLocationState, setUserLocationState] = useState<{ lat: number; lng: number } | null>(userLocation || null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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

  // Set map as ready after a short delay to ensure proper initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapReady(true);
      setMapInitialized(true);
    }, 1000); // Give map time to initialize

    // Add a timeout to prevent infinite loading
    const timeoutTimer = setTimeout(() => {
      if (!mapReady) {
        setMapError('Map initialization timeout. Please try again.');
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
    };
  }, [mapReady]);

  // Handle map ready event
  const handleMapReady = () => {
    setMapReady(true);
    setMapError(null);
  };

  // Handle map error
  const handleMapError = (error: any) => {
    console.error('Map error:', error);
    setMapError('Failed to load map');
  };

  // Retry map loading
  const handleRetry = () => {
    setMapError(null);
    setMapReady(false);
    setMapInitialized(false);
    setRetryCount(prev => prev + 1);
  };

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
      case 'no_swim': return '#d32f2f';
      case 'caution': return '#ff9800';
      case 'safe': return '#4caf50';
      default: return '#757575';
    }
  };

  const getSafetyZoneLabel = (type: string) => {
    switch (type) {
      case 'no_swim': return 'No Swim Zone';
      case 'caution': return 'Caution Zone';
      case 'safe': return 'Safe Zone';
      default: return 'Safety Zone';
    }
  };

  const calculateRadiusFromGeometry = (geometry: GeoJSON.Polygon) => {
    if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
      return 100; // Default radius
    }

    const coordinates = geometry.coordinates[0];
    if (coordinates.length < 3) {
      return 100; // Default radius
    }

    // Calculate center point
    let centerLat = 0;
    let centerLng = 0;
    coordinates.forEach((coord: number[]) => {
      centerLat += coord[1];
      centerLng += coord[0];
    });
    centerLat /= coordinates.length;
    centerLng /= coordinates.length;

    // Calculate average radius
    let totalDistance = 0;
    coordinates.forEach((coord: number[]) => {
      const latDiff = coord[1] - centerLat;
      const lngDiff = coord[0] - centerLng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      totalDistance += distance;
    });

    return (totalDistance / coordinates.length) * 111000; // Convert to meters
  };

  const getFlagColor = (flagStatus: string) => {
    switch (flagStatus) {
      case 'green': return '#4caf50';
      case 'yellow': return '#ff9800';
      case 'red': return '#f44336';
      case 'black': return '#212121';
      default: return '#757575';
    }
  };

  const getFlagText = (flagStatus: string) => {
    switch (flagStatus) {
      case 'green': return 'SAFE CONDITIONS';
      case 'yellow': return 'CAUTION - MODERATE RISK';
      case 'red': return 'DANGER - HIGH RISK';
      case 'black': return 'EXTREME DANGER';
      default: return 'UNKNOWN CONDITIONS';
    }
  };

  const getZoneCenterAndRadius = (zone: SafetyZone) => {
    if (!zone.geometry || !zone.geometry.coordinates || zone.geometry.coordinates.length === 0) {
      return { center: [0, 0] as [number, number], radius: 100 };
    }

    const coordinates = zone.geometry.coordinates[0];
    if (coordinates.length < 3) {
      return { center: [0, 0] as [number, number], radius: 100 };
    }

    // Calculate center point
    let centerLat = 0;
    let centerLng = 0;
    coordinates.forEach((coord: number[]) => {
      centerLat += coord[1];
      centerLng += coord[0];
    });
    centerLat /= coordinates.length;
    centerLng /= coordinates.length;
    
    const radius = calculateRadiusFromGeometry(zone.geometry);
    
    return { center: [centerLat, centerLng] as [number, number], radius };
  };

  // Show error state if map fails to load
  if (mapError) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        borderRadius: 2
      }}>
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Map Loading Error
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {mapError}. Please try again.
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleRetry}
            sx={{ mt: 1 }}
          >
            Retry Loading Map
          </Button>
        </Alert>
      </Box>
    );
  }

  // Show loading state while map is initializing
  if (!mapReady) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        borderRadius: 2
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Loading Map...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while the map initializes
          </Typography>
          {retryCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Retry attempt: {retryCount}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '600px', position: 'relative' }}>
      <MapContainer
        center={center || mapCenter}
        zoom={zoom || mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        whenReady={handleMapReady}
        key={`map-${mapInitialized ? 'ready' : 'loading'}`} // Force re-render when ready
      >
        {center && zoom && mapInitialized && <MapUpdater center={center} zoom={zoom} />}
        
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
              <Box sx={{ 
                minWidth: 320, 
                p: 2,
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
              }}>
                {/* Professional Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2.5,
                  pb: 1.5,
                  borderBottom: '3px solid #1976d2',
                  position: 'relative'
                }}>
                  <Box sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: '#1976d2',
                    borderRadius: '2px'
                  }} />
                  <LocationOn sx={{ color: '#1976d2', mr: 1.5, fontSize: 28 }} />
                  <Typography 
                    variant="h6" 
                    fontWeight="700" 
                    color="primary"
                    sx={{ 
                      fontSize: '1.1rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {center.name}
                  </Typography>
                </Box>
                
                {/* Enhanced Safety Flag Status */}
                <Box sx={{ 
                  mb: 3, 
                  p: 2.5, 
                  borderRadius: 3, 
                  backgroundColor: getFlagColor(center.flag_status),
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }
                }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="800" 
                    sx={{ 
                      mb: 0.5,
                      fontSize: '1.1rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                  >
                    {getFlagText(center.flag_status)}
                  </Typography>
                  {center.flag_reason && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        opacity: 0.95, 
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      {center.flag_reason}
                    </Typography>
                  )}
                </Box>
                
                {/* Enhanced Status and Lifeguards Row */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2.5,
                  p: 1.5,
                  bgcolor: '#f8f9fa',
                  borderRadius: 2,
                  border: '1px solid #e9ecef'
                }}>
                  <Chip
                    icon={getStatusIcon(center.status)}
                    label={center.status.toUpperCase()}
                    color={getStatusColor(center.status) as any}
                    size="small"
                    sx={{ 
                      fontWeight: '700',
                      fontSize: '0.75rem',
                      height: 28
                    }}
                  />
                  <Box sx={{ 
                    textAlign: 'center',
                    p: 1.5,
                    bgcolor: '#e3f2fd',
                    borderRadius: 2,
                    border: '2px solid #bbdefb',
                    minWidth: 80
                  }}>
                    <Person sx={{ color: '#1976d2', mb: 0.5, fontSize: 20 }} />
                    <Typography 
                      variant="h5" 
                      fontWeight="800" 
                      color="primary"
                      sx={{ fontSize: '1.5rem', lineHeight: 1 }}
                    >
                      {center.lifeguards_on_duty}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      On Duty
                    </Typography>
                  </Box>
                </Box>
                
                {/* Enhanced Weather Information Grid */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: 2,
                  mb: 2.5
                }}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    bgcolor: '#fff', 
                    borderRadius: 2.5,
                    border: '2px solid #f0f0f0',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      bgcolor: '#fafafa',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      borderColor: '#ff9800'
                    }
                  }}>
                    <WbSunny sx={{ color: '#ff9800', mb: 1, fontSize: 24 }} />
                    <Typography 
                      variant="h6" 
                      fontWeight="800" 
                      color="primary"
                      sx={{ fontSize: '1.1rem', mb: 0.5 }}
                    >
                      {center.air_temperature}°C
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Air Temp
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    bgcolor: '#fff', 
                    borderRadius: 2.5,
                    border: '2px solid #f0f0f0',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      bgcolor: '#fafafa',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      borderColor: '#2196f3'
                    }
                  }}>
                    <Air sx={{ color: '#2196f3', mb: 1, fontSize: 24 }} />
                    <Typography 
                      variant="h6" 
                      fontWeight="800" 
                      color="primary"
                      sx={{ fontSize: '1.1rem', mb: 0.5 }}
                    >
                      {center.wind_speed} km/h
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Wind Speed
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    bgcolor: '#fff', 
                    borderRadius: 2.5,
                    border: '2px solid #f0f0f0',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      bgcolor: '#fafafa',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      borderColor: '#4caf50'
                    }
                  }}>
                    <Visibility sx={{ color: '#4caf50', mb: 1, fontSize: 24 }} />
                    <Typography 
                      variant="h6" 
                      fontWeight="800" 
                      color="primary"
                      sx={{ fontSize: '1.1rem', mb: 0.5 }}
                    >
                      {center.visibility}m
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Visibility
                    </Typography>
                  </Box>
                </Box>
                
                {/* Additional Weather Info */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 2,
                  mb: 2.5
                }}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    bgcolor: '#fff', 
                    borderRadius: 2.5,
                    border: '2px solid #f0f0f0',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      bgcolor: '#fafafa',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      borderColor: '#00bcd4'
                    }
                  }}>
                    <BeachAccess sx={{ color: '#00bcd4', mb: 1, fontSize: 24 }} />
                    <Typography 
                      variant="h6" 
                      fontWeight="800" 
                      color="primary"
                      sx={{ fontSize: '1.1rem', mb: 0.5 }}
                    >
                      {center.water_temperature}°C
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Water Temp
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    bgcolor: '#fff', 
                    borderRadius: 2.5,
                    border: '2px solid #f0f0f0',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      bgcolor: '#fafafa',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      borderColor: '#9c27b0'
                    }
                  }}>
                    <Air sx={{ color: '#9c27b0', mb: 1, fontSize: 24 }} />
                    <Typography 
                      variant="h6" 
                      fontWeight="800" 
                      color="primary"
                      sx={{ fontSize: '1.1rem', mb: 0.5 }}
                    >
                      {center.wave_height}m
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Wave Height
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Popup>
          </Marker>
        ))}

        {/* Safety zones */}
        {showSafetyZones && safetyZones.map((zone) => {
          const { center: zoneCenter, radius } = getZoneCenterAndRadius(zone);
          
          return (
            <Circle
              key={zone.id}
              center={zoneCenter}
              radius={radius}
              pathOptions={{
                color: getSafetyZoneColor(zone.zone_type),
                fillColor: getSafetyZoneColor(zone.zone_type),
                fillOpacity: 0.2,
                weight: 3
              }}
            >
              <Popup>
                <Box sx={{ 
                  minWidth: 280, 
                  p: 2,
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                }}>
                  {/* Professional Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    pb: 1,
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: getSafetyZoneColor(zone.zone_type),
                      mr: 1.5,
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                    <Typography 
                      variant="h6" 
                      fontWeight="700" 
                      sx={{ 
                        fontSize: '1rem',
                        color: getSafetyZoneColor(zone.zone_type),
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {getSafetyZoneLabel(zone.zone_type)}
                    </Typography>
                  </Box>
                  
                  {/* Zone Information */}
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="body1" 
                      fontWeight="600" 
                      sx={{ 
                        mb: 1,
                        color: '#2c3e50',
                        fontSize: '0.95rem'
                      }}
                    >
                      {zone.name}
                    </Typography>
                    {zone.description && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 1.5,
                          color: '#5a6c7d',
                          lineHeight: 1.4,
                          fontSize: '0.85rem'
                        }}
                      >
                        {zone.description}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Zone Details */}
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e9ecef',
                    textAlign: 'center'
                  }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="800" 
                      sx={{ 
                        color: getSafetyZoneColor(zone.zone_type),
                        fontSize: '1.2rem',
                        mb: 0.5
                      }}
                    >
                      {Math.round(radius)}m
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#6c757d'
                      }}
                    >
                      Safety Radius
                    </Typography>
                  </Box>
                </Box>
              </Popup>
            </Circle>
          );
        })}

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
              <Box sx={{ 
                minWidth: 280, 
                p: 2,
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
              }}>
                {/* Professional Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  pb: 1,
                  borderBottom: '2px solid #e0e0e0'
                }}>
                  {getAlertIcon(alert.type)}
                  <Typography 
                    variant="h6" 
                    fontWeight="700" 
                    sx={{ 
                      ml: 1,
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: alert.status === 'active' ? '#d32f2f' : '#2e7d32'
                    }}
                  >
                    {alert.type} Alert
                  </Typography>
                </Box>
                
                {/* Status Chip */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={alert.status.toUpperCase()}
                    color={alert.status === 'active' ? 'error' : 'success'}
                    size="small"
                    sx={{ 
                      fontWeight: '700',
                      fontSize: '0.7rem',
                      height: 24
                    }}
                  />
                </Box>
                
                {/* Alert Description */}
                <Box sx={{ 
                  mb: 2,
                  p: 1.5,
                  bgcolor: alert.status === 'active' ? '#fff3e0' : '#f1f8e9',
                  borderRadius: 2,
                  border: `1px solid ${alert.status === 'active' ? '#ffcc02' : '#4caf50'}`
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#2c3e50',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      fontSize: '0.9rem'
                    }}
                  >
                    {alert.description}
                  </Typography>
                </Box>
                
                {/* Timestamp */}
                <Box sx={{ 
                  textAlign: 'center',
                  p: 1,
                  bgcolor: '#f8f9fa',
                  borderRadius: 1,
                  border: '1px solid #e9ecef'
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: '#6c757d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {(() => {
                      try {
                        const date = new Date(alert.created_at);
                        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
                      } catch (error) {
                        return 'Invalid Date';
                      }
                    })()}
                  </Typography>
                </Box>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default BeachMap; 