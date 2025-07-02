import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Map,
  Security,
  Visibility,
  Fullscreen,
  Refresh,
  MyLocation,
  WbSunny,
  Air,
  Waves,
  Speed,
  Cloud,
  Opacity,
  AcUnit,
  Thunderstorm,
  Grain,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../../services/api';
import { Center, WeatherData, SafetyZone } from '../../types';
import EmergencyAlert from './EmergencyAlert';

// Fix for default markers
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Classic red marker icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Pulsing background effect for user location
const userLocationIconPulse = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNGRjAwMDAiIGZpbGwtb3BhY2l0eT0iMC4zIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEyIiBmaWxsPSIjRkYwMDAwIiBmaWxsLW9wYWNpdHk9IjAuNSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI2IiBmaWxsPSIjRkYwMDAwIi8+Cjwvc3ZnPgo=',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const PublicDashboard: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);
  const [lifeguardCounts, setLifeguardCounts] = useState<any[]>([]);
  const [safetyFlags, setSafetyFlags] = useState<any[]>([]);
  const [mapCenter] = useState<[number, number]>([36.4000, 10.6167]); // Tunisia center
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | null>(null);

  useEffect(() => {
    fetchData();
    // Automatically get user location when component mounts
    getUserLocation();
  }, []);

  const fetchData = async () => {
    try {
      const [centersData, weatherData, zonesData, lifeguardData, flagsData] = await Promise.all([
        apiService.getPublicCenters(),
        apiService.getCurrentWeather(),
        apiService.getPublicSafetyZones(),
        apiService.getPublicLifeguardCounts(),
        apiService.getPublicSafetyFlags(),
      ]);

      setCenters(centersData);
      setWeatherData(weatherData);
      setSafetyZones(zonesData);
      setLifeguardCounts(lifeguardData);
      setSafetyFlags(flagsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getWeatherForCenter = (centerId: string) => {
    return weatherData.find(w => w.center_id === centerId);
  };

  const getLifeguardCountForCenter = (centerId: string) => {
    const count = lifeguardCounts.find(l => l.center_id === centerId);
    return count ? count.active_lifeguards : 0;
  };

  const getSafetyFlagForCenter = (centerId: string) => {
    return safetyFlags.find(f => f.center_id === centerId);
  };

  const getFlagColor = (flagStatus: string) => {
    switch (flagStatus) {
      case 'green': return '#4caf50';
      case 'yellow': return '#ff9800';
      case 'red': return '#f44336';
      case 'black': return '#000000';
      default: return '#757575';
    }
  };

  const getFlagMessage = (flagStatus: string) => {
    switch (flagStatus) {
      case 'green': return 'Safe to swim';
      case 'yellow': return 'Caution advised';
      case 'red': return 'Dangerous conditions';
      case 'black': return 'Beach closed';
      default: return 'Status unknown';
    }
  };

  const getWeatherIcon = (weatherCondition: string) => {
    const condition = weatherCondition.toLowerCase();
    
    if (condition.includes('cloud') || condition.includes('overcast')) {
      return { icon: Cloud, color: '#78909c' };
    }
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
      return { icon: Opacity, color: '#2196f3' };
    }
    if (condition.includes('snow') || condition.includes('sleet')) {
      return { icon: AcUnit, color: '#90caf9' };
    }
    if (condition.includes('storm') || condition.includes('thunder')) {
      return { icon: Thunderstorm, color: '#673ab7' };
    }
    if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
      return { icon: Grain, color: '#9e9e9e' };
    }
    if (condition.includes('clear') || condition.includes('sunny')) {
      return { icon: WbSunny, color: '#ff9800' };
    }
    // Default to sun for unknown conditions
    return { icon: WbSunny, color: '#ff9800' };
  };

  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click: (e) => {
        if (isManualMode) {
          const { lat, lng } = e.latlng;
          setManualLocation(lat, lng);
        }
      },
    });
    return null;
  };

  const getUserLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    setIsManualMode(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocationSource('gps');
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services or use manual mode.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const enableManualMode = () => {
    setIsManualMode(true);
    setLocationError(null);
    setIsLocating(false);
  };

  const setManualLocation = (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    setLocationSource('manual');
    setIsManualMode(false);
  };

  const clearUserLocation = () => {
    setUserLocation(null);
    setLocationError(null);
    setIsManualMode(false);
    setLocationSource(null);
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Hero Section with Map */}
      <Box sx={{ position: 'relative', height: '70vh', minHeight: '500px' }}>
        {/* Map Container */}
        <Box sx={{ height: '100%', width: '100%' }}>
          <MapContainer
            center={mapCenter}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler />

            {/* User Location Marker */}
            {userLocation && (
              <>
                {/* Pulsing background effect */}
                <Marker position={userLocation} icon={userLocationIconPulse}>
                  <Popup>
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Your Location
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lat: {userLocation[0].toFixed(6)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lng: {userLocation[1].toFixed(6)}
                      </Typography>
                      <Chip 
                        label={locationSource === 'gps' ? 'GPS Location' : 'Manual Location'} 
                        size="small" 
                        color={locationSource === 'gps' ? 'primary' : 'secondary'}
                        sx={{ mt: 1, mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <Button
                          onClick={() => setManualLocation(userLocation[0], userLocation[1])}
                          variant="outlined"
                          size="small"
                          fullWidth
                        >
                          Adjust Location
                        </Button>
                        <Button
                          onClick={clearUserLocation}
                          variant="outlined"
                          size="small"
                          color="error"
                          fullWidth
                        >
                          Clear Location
                        </Button>
                      </Box>
                    </Box>
                  </Popup>
                </Marker>
                {/* Main location marker */}
                <Marker position={userLocation} icon={userLocationIcon} />
              </>
            )}

            {/* Center Markers */}
            {centers.map((center) => {
              const weather = getWeatherForCenter(center.id);
              const lifeguardCount = getLifeguardCountForCenter(center.id);
              const safetyFlag = getSafetyFlagForCenter(center.id);
              const centerCoords: [number, number] = [
                center.location.coordinates[1],
                center.location.coordinates[0]
              ];

              return (
                <Marker key={center.id} position={centerCoords}>
                  <Popup>
                    <Box sx={{ 
                      minWidth: 280, 
                      p: 0,
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                    }}>
                      {/* Header Section */}
                      <Box sx={{ 
                        p: 2, 
                        pb: 1.5,
                        borderBottom: '1px solid #e8eaed',
                        backgroundColor: '#fafbfc'
                      }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: '#1a1a1a',
                            mb: 0.5
                          }}
                        >
                          {center.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#5f6368',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          Beach Safety Center
                        </Typography>
                      </Box>

                      {/* Content Section */}
                      <Box sx={{ p: 2, pt: 1.5 }}>
                        {/* Safety Status - Emphasized */}
                        {safetyFlag && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 1,
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: getFlagColor(safetyFlag.flag_status) + '20',
                              border: `2px solid ${getFlagColor(safetyFlag.flag_status)}`,
                              boxShadow: `0 2px 8px ${getFlagColor(safetyFlag.flag_status)}30`
                            }}>
                              <Box sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: getFlagColor(safetyFlag.flag_status),
                                mr: 2,
                                boxShadow: `0 0 8px ${getFlagColor(safetyFlag.flag_status)}`
                              }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 700,
                                    color: getFlagColor(safetyFlag.flag_status),
                                    fontSize: '1rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}
                                >
                                  {getFlagMessage(safetyFlag.flag_status)}
                                </Typography>
                                {safetyFlag.reason && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: '#5f6368',
                                      fontSize: '0.75rem',
                                      lineHeight: 1.4,
                                      display: 'block',
                                      mt: 0.5
                                    }}
                                  >
                                    {safetyFlag.reason}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        )}

                        {/* Weather Information with Icons */}
                        {weather && (
                          <Box sx={{ mb: 2 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#5f6368',
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 600,
                                display: 'block',
                                mb: 0.5
                              }}
                            >
                              Current Conditions
                            </Typography>
                            <Box sx={{ 
                              p: 1.5,
                              backgroundColor: '#f8f9fa',
                              borderRadius: 1,
                              border: '1px solid #e8eaed'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mb: 1,
                                p: 0.5,
                                backgroundColor: '#ffffff',
                                borderRadius: 1
                              }}>
                                {(() => {
                                  const weatherIcon = getWeatherIcon(weather.weather_condition || 'clear');
                                  const IconComponent = weatherIcon.icon;
                                  return (
                                    <IconComponent sx={{ 
                                      fontSize: '1.2rem', 
                                      color: weatherIcon.color, 
                                      mr: 1 
                                    }} />
                                  );
                                })()}
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: '#1a1a1a'
                                  }}
                                >
                                  {weather.weather_condition || 'Clear'}
                                </Typography>
                              </Box>
                              <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'auto 1fr', 
                                gap: 1,
                                fontSize: '0.8rem',
                                alignItems: 'center'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <WbSunny sx={{ fontSize: '0.9rem', color: '#ff9800', mr: 0.5 }} />
                                  <Typography variant="caption" sx={{ color: '#5f6368' }}>
                                    Temp
                                  </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                  {weather.temperature}°C
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Air sx={{ fontSize: '0.9rem', color: '#2196f3', mr: 0.5 }} />
                                  <Typography variant="caption" sx={{ color: '#5f6368' }}>
                                    Wind
                                  </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                  {weather.wind_speed} m/s
                                </Typography>
                                
                                {weather.wave_height && (
                                  <>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Waves sx={{ fontSize: '0.9rem', color: '#00bcd4', mr: 0.5 }} />
                                      <Typography variant="caption" sx={{ color: '#5f6368' }}>
                                        Waves
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                      {weather.wave_height}m
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Speed sx={{ fontSize: '0.9rem', color: '#9c27b0', mr: 0.5 }} />
                                      <Typography variant="caption" sx={{ color: '#5f6368' }}>
                                        Current
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                      {weather.current_speed} m/s
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Popup>
                </Marker>
              );
            })}

            {/* Safety Zones */}
            {safetyZones.map((zone) => {
              const coordinates = zone.geometry.coordinates[0];
              const centerLat = coordinates.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coordinates.length;
              const centerLng = coordinates.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coordinates.length;
              
              // Calculate radius from geometry
              let maxDistance = 0;
              coordinates.forEach((coord: number[]) => {
                const distance = Math.sqrt(
                  Math.pow(coord[0] - centerLng, 2) + Math.pow(coord[1] - centerLat, 2)
                );
                if (distance > maxDistance) {
                  maxDistance = distance;
                }
              });

              const getZoneColor = (zoneType: string) => {
                switch (zoneType) {
                  case 'no_swim': return '#f44336';
                  case 'caution': return '#ff9800';
                  case 'safe': return '#4caf50';
                  default: return '#757575';
                }
              };

              return (
                <Circle
                  key={zone.id}
                  center={[centerLat, centerLng]}
                  radius={maxDistance * 111320} // Convert to meters
                  pathOptions={{
                    color: getZoneColor(zone.zone_type),
                    fillColor: getZoneColor(zone.zone_type),
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                >
                  <Popup>
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {zone.name}
                      </Typography>
                      <Chip
                        label={zone.zone_type.replace('_', ' ').toUpperCase()}
                        color={zone.zone_type === 'no_swim' ? 'error' : zone.zone_type === 'caution' ? 'warning' : 'success'}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      {zone.description && (
                        <Typography variant="body2" color="text.secondary">
                          {zone.description}
                        </Typography>
                      )}
                    </Box>
                  </Popup>
                </Circle>
              );
            })}
          </MapContainer>
        </Box>

        {/* Overlay Controls */}
        <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
          <Paper sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Tooltip title="Get My GPS Location">
              <IconButton 
                onClick={getUserLocation} 
                size="small"
                disabled={isLocating}
                color={locationSource === 'gps' ? 'primary' : 'default'}
              >
                <MyLocation />
              </IconButton>
            </Tooltip>
            <Tooltip title="Set Location Manually">
              <IconButton 
                onClick={enableManualMode} 
                size="small"
                disabled={isManualMode}
                color={locationSource === 'manual' ? 'secondary' : isManualMode ? 'primary' : 'default'}
                sx={{
                  ...(isManualMode && {
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                      '100%': { transform: 'scale(1)' }
                    }
                  })
                }}
              >
                <Map />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchData} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Full Screen Map">
              <IconButton component={RouterLink} to="/map" size="small">
                <Fullscreen />
              </IconButton>
            </Tooltip>
          </Paper>
        </Box>

        {/* Manual Mode Alert */}
        {isManualMode && (
          <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, maxWidth: 400 }}>
            <Alert 
              severity="info" 
              onClose={() => setIsManualMode(false)}
              sx={{ mb: 1 }}
            >
              Click anywhere on the map to set your location manually
            </Alert>
          </Box>
        )}

        {/* Location Error Alert */}
        {locationError && (
          <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, maxWidth: 400 }}>
            <Alert 
              severity="error" 
              onClose={() => setLocationError(null)}
              sx={{ mb: 1 }}
            >
              {locationError}
            </Alert>
          </Box>
        )}

        {/* Map Info Overlay */}
        <Box sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000 }}>
          <Paper sx={{ p: 2, maxWidth: 300 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Interactive Safety Map
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              View real-time beach conditions, safety zones, and lifeguard locations. Click on markers for detailed information.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Safety Flags" size="small" color="primary" />
              <Chip label="Weather Data" size="small" color="info" />
              <Chip label="Safety Zones" size="small" color="success" />
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ p: 3, bgcolor: 'background.default' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {centers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Beach Centers
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Security sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {safetyZones.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Safety Zones Monitored
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {safetyFlags.filter(f => f.flag_status === 'red' || f.flag_status === 'black').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Warnings
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Visibility sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {lifeguardCounts.reduce((sum, l) => sum + l.active_lifeguards, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Lifeguards
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Stay Safe at the Beach
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
          Use our interactive map to check current conditions, view safety zones, and stay informed about real-time alerts and weather conditions.
        </Typography>
        <Button
          component={RouterLink}
          to="/map"
          variant="contained"
          size="large"
          startIcon={<Map />}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            },
          }}
        >
          Explore Full Interactive Map
        </Button>
      </Box>

      {/* Emergency Alert Component */}
      <EmergencyAlert />
    </Box>
  );
};

export default PublicDashboard; 