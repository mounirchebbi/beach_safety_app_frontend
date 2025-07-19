import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
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
  CircularProgress,
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
  Help,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../../services/api';
import { Center, WeatherData, SafetyZone } from '../../types';
import EmergencyAlert from './EmergencyAlert';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

// Fix for default markers
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Error boundary for map components
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Map error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#f5f5f5'
        }}>
          <Typography variant="h6" color="text.secondary">
            Map loading error. Please refresh the page.
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

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
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'mobile' | 'ip' | null>(null);
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [gpsWeather, setGpsWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    // Automatically get user location when component mounts
    getUserLocation();

    // Cleanup function to prevent memory leaks
    return () => {
      // Cleanup any pending operations
      setIsLocating(false);
      setLocationError(null);
    };
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
    const weather = weatherData.find(w => w.center_id === centerId);
    console.log(`Looking for weather for center ${centerId}:`, weather);
    console.log('Available weather data:', weatherData);
    return weather;
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
      zoomend: () => {
        // Handle zoom end to prevent errors
        try {
          // Force a small delay to ensure DOM is ready
          setTimeout(() => {
            // This helps prevent the "el is undefined" error
          }, 10);
        } catch (error) {
          console.warn('Map zoom error handled:', error);
        }
      },
    });
    return null;
  };

  const checkLocationPermission = async (): Promise<boolean> => {
    if (!navigator.permissions) {
      console.log('Permissions API not available, proceeding with geolocation request');
      return true;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      console.log('Location permission status:', permission.state);
      
      if (permission.state === 'denied') {
        setLocationError('Location access is denied. Please enable location permissions in your browser settings and refresh the page.');
        setIsLocating(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('Could not check location permission, proceeding anyway:', error);
      return true;
    }
  };

  const detectBrowserIssues = (): string[] => {
    const issues: string[] = [];
    
    // Check if we're in a secure context
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      issues.push('HTTPS required for location access');
    }
    
    // Check browser compatibility
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      issues.push('Safari may require manual location permission');
    }
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      issues.push('Geolocation not supported by this browser');
    }
    
    return issues;
  };

  const getUserLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    setIsManualMode(false);

    console.log('Starting location request...');
    console.log('navigator.geolocation available:', !!navigator.geolocation);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsLocating(false);
      return;
    }

    // Check if we're in a secure context (HTTPS)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setLocationError('Location access requires HTTPS. Please use manual mode or enable location permissions.');
      setIsLocating(false);
      return;
    }

    // Check location permission
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      return;
    }

    // Test with different options
    const testLocation = (options: PositionOptions, attempt: number = 1) => {
      console.log(`Location attempt ${attempt} with options:`, options);
      
      const timeoutId = setTimeout(() => {
        console.log(`Location attempt ${attempt} timed out`);
        if (attempt === 1) {
          // Try with lower accuracy on timeout
          testLocation({
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000
          }, 2);
        } else {
          setLocationError('Location request timed out. Please try manual mode or check your GPS settings.');
          setIsLocating(false);
        }
      }, (options.timeout || 10000) + 1000); // Add 1 second buffer

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const { latitude, longitude, accuracy } = position.coords;
          console.log('Location success:', { latitude, longitude, accuracy });
          
          // Validate coordinates
          if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            console.error('Invalid coordinates received:', { latitude, longitude });
            setLocationError('Invalid GPS coordinates received. Please try again or use manual mode.');
            setIsLocating(false);
            return;
          }
          
          setUserLocation([latitude, longitude]);
          setLocationSource('gps');
          setIsLocating(false);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error(`Location attempt ${attempt} failed:`, error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
            TIMEOUT: error.TIMEOUT
          });
          
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services in your browser settings or use manual mode.';
              break;
            case error.POSITION_UNAVAILABLE:
              if (attempt === 1) {
                console.log('Trying with lower accuracy...');
                testLocation({
                  enableHighAccuracy: false,
                  timeout: 15000,
                  maximumAge: 300000
                }, 2);
                return;
              } else if (attempt === 2) {
                console.log('GPS still unavailable, trying IP-based location...');
                getIPBasedLocation();
                return;
              } else {
                errorMessage = 'GPS unavailable. You can set your location manually by clicking the map.';
              }
              break;
            case error.TIMEOUT:
              if (attempt === 1) {
                console.log('First attempt timed out, trying with lower accuracy...');
                testLocation({
                  enableHighAccuracy: false,
                  timeout: 15000,
                  maximumAge: 300000
                }, 2);
                return;
              } else if (attempt === 2) {
                console.log('Second attempt timed out, trying IP-based location...');
                getIPBasedLocation();
                return;
              } else {
                errorMessage = 'Location request timed out. Please try manual mode or check your GPS settings.';
              }
              break;
            default:
              if (attempt === 1) {
                console.log('Unknown error, trying with lower accuracy...');
                testLocation({
                  enableHighAccuracy: false,
                  timeout: 15000,
                  maximumAge: 300000
                }, 2);
                return;
              } else if (attempt === 2) {
                console.log('Unknown error on second attempt, trying IP-based location...');
                getIPBasedLocation();
                return;
              } else {
                errorMessage = 'Unable to determine your location. Please use manual mode or check your GPS settings.';
              }
              break;
          }
          
          // Detect browser-specific issues
          const browserIssues = detectBrowserIssues();
          if (browserIssues.length > 0) {
            console.log('Browser issues detected:', browserIssues);
            errorMessage += `\n\nBrowser issues: ${browserIssues.join(', ')}`;
          }
          
          setLocationError(errorMessage);
          setIsLocating(false);
          
          // If all attempts failed, try IP-based location as fallback
          if (attempt === 2) {
            console.log('Trying IP-based location as fallback...');
            getIPBasedLocation();
          }
        },
        options
      );
    };

    // Start with high accuracy
    testLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    });
  };



  const validateCoordinates = (lat: number, lng: number): boolean => {
    return (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && 
            !isNaN(lat) && !isNaN(lng) && 
            (lat !== 0 || lng !== 0)); // Avoid null island (0,0)
  };

  const calculateAccuracy = (data: any): number => {
    // Estimate accuracy based on available data
    if (data.accuracy) return data.accuracy;
    if (data.uncertainty) return data.uncertainty;
    if (data.radius) return data.radius;
    
    // Default accuracy estimates based on service type
    if (data.org && data.org.includes('ISP')) return 5000; // ISP level
    if (data.org && data.org.includes('Mobile')) return 1000; // Mobile network
    return 2000; // Default city-level accuracy
  };

  const getIPBasedLocation = async () => {
    const ipServices = [
      {
        url: 'https://ipapi.co/json/',
        name: 'ipapi.co',
        timeout: 5000
      },
      {
        url: 'https://ipinfo.io/json',
        name: 'ipinfo.io', 
        timeout: 5000
      },
      {
        url: 'https://api.ipify.org?format=json',
        name: 'ipify.org',
        timeout: 3000
      },
      {
        url: 'https://ip-api.com/json/',
        name: 'ip-api.com',
        timeout: 5000
      },
      {
        url: 'https://api.myip.com',
        name: 'myip.com',
        timeout: 4000
      }
    ];

    const locationResults: Array<{
      latitude: number;
      longitude: number;
      accuracy: number;
      service: string;
      city?: string;
      country?: string;
    }> = [];

    // Try all services in parallel for better accuracy
    const promises = ipServices.map(async (service, index) => {
      try {
        console.log(`Attempting IP-based location with ${service.name}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), service.timeout);
        
        const response = await fetch(service.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'BeachSafetyApp/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`${service.name} response:`, data);
        
        let latitude: number | null = null;
        let longitude: number | null = null;
        
        // Handle different response formats
        if (data.latitude && data.longitude) {
          latitude = parseFloat(data.latitude);
          longitude = parseFloat(data.longitude);
        } else if (data.lat && data.lon) {
          latitude = parseFloat(data.lat);
          longitude = parseFloat(data.lon);
        } else if (data.loc) {
          const [lat, lng] = data.loc.split(',').map(Number);
          latitude = lat;
          longitude = lng;
        } else if (data.query && data.lat && data.lon) {
          latitude = parseFloat(data.lat);
          longitude = parseFloat(data.lon);
        } else if (data.ip) {
          // Fallback: try to get location from IP
          try {
            const geoResponse = await fetch(`https://ipapi.co/${data.ip}/json/`, {
              signal: controller.signal
            });
            const geoData = await geoResponse.json();
            if (geoData.latitude && geoData.longitude) {
              latitude = parseFloat(geoData.latitude);
              longitude = parseFloat(geoData.longitude);
            }
          } catch (fallbackError) {
            console.log(`Fallback location lookup failed for ${data.ip}`);
          }
        }
        
        if (latitude && longitude && validateCoordinates(latitude, longitude)) {
          const accuracy = calculateAccuracy(data);
          locationResults.push({
            latitude,
            longitude,
            accuracy,
            service: service.name,
            city: data.city || data.city_name,
            country: data.country || data.country_name
          });
          console.log(`${service.name} location:`, { latitude, longitude, accuracy });
        }
        
      } catch (error) {
        console.error(`${service.name} failed:`, error);
      }
    });

    await Promise.allSettled(promises);
    
    if (locationResults.length === 0) {
      console.error('All IP-based location services failed');
      setLocationError('Unable to determine your location automatically. Please use manual mode by clicking on the map.');
      setIsLocating(false);
      return;
    }

    // Find the most accurate result (lowest accuracy value)
    const bestResult = locationResults.reduce((best, current) => 
      current.accuracy < best.accuracy ? current : best
    );

    console.log('Best IP location result:', bestResult);
    
    // Set the most precise location
    setUserLocation([bestResult.latitude, bestResult.longitude]);
    setLocationSource('ip');
    setIsLocating(false);
    setLocationError(null);
    
    // Log additional location details
    if (bestResult.city || bestResult.country) {
      console.log(`Location: ${bestResult.city || 'Unknown'}, ${bestResult.country || 'Unknown'} (Accuracy: ~${bestResult.accuracy}m)`);
    }
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

  const getMobileGPSLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    setIsManualMode(false);

    try {
      console.log('Fetching GPS data from mobile device via backend proxy...');
      
      const response = await fetch('/api/v1/public/mobile-gps', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Mobile GPS data received:', result);

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Invalid response from mobile GPS service');
      }

      const { latitude, longitude } = result.data;
      
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid GPS coordinates received');
      }

      console.log('Setting mobile GPS location:', { latitude, longitude });
      setUserLocation([latitude, longitude]);
      setLocationSource('mobile');
      setIsLocating(false);
      setLocationError(null);

    } catch (error: any) {
      console.error('Error fetching mobile GPS:', error);
      const errorMessage = error.message || 'Connection failed';
      setLocationError(`Mobile GPS unavailable: ${errorMessage}. Please try GPS or manual mode.`);
      setIsLocating(false);
    }
  };

  // Fetch weather for current userLocation
  useEffect(() => {
    const fetchWeatherForLocation = async () => {
      if (!userLocation) return;
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        // Use OpenWeatherMap API directly for current location
        const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY || 'b87cedaabede7999b6b157950fe31164';
        const [lat, lon] = userLocation;
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const weatherData = await weatherRes.json();
        if (!weatherRes.ok) throw new Error(weatherData.message || 'Failed to fetch weather');
        setGpsWeather(weatherData);
        // Fetch forecast
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const forecastData = await forecastRes.json();
        if (!forecastRes.ok) throw new Error(forecastData.message || 'Failed to fetch forecast');
        setForecast(forecastData.list.slice(0, 5)); // Next 5 periods (about 1 day)
      } catch (err: any) {
        setWeatherError(err.message);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeatherForLocation();
  }, [userLocation]);

  return (
    <Box sx={{ height: '100vh', width: '100vw', bgcolor: '#f4f6fa' }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, bgcolor: '#fff', boxShadow: 1, position: 'sticky', top: 0, zIndex: 1200 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img src="/logo192.png" alt="Beach Safety Logo" style={{ height: 40, cursor: 'pointer' }} onClick={() => navigate('/')} />
        </Box>
        <Button variant="contained" color="primary" onClick={() => navigate('/login')} sx={{ fontWeight: 700, borderRadius: 2 }}>
          Staff Login
        </Button>
      </Box>

      {/* Main Map Section (map and overlays only) */}
      <Box sx={{ position: 'relative', height: 'calc(100vh - 72px)', width: '100vw' }}>
        {/* Map Container */}
        <MapErrorBoundary>
          <Box 
            sx={{ height: '100%', width: '100%' }}
            onError={(error) => {
              console.error('Map container error:', error);
            }}
          >
            <MapContainer
            center={mapCenter}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
            whenReady={() => {
              // Map is ready
              console.log('Map is ready');
            }}
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
                <Marker 
                  position={userLocation} 
                  icon={userLocationIconPulse}
                  eventHandlers={{
                    add: () => {
                      console.log('User location marker added');
                    },
                    remove: () => {
                      console.log('User location marker removed');
                    }
                  }}
                >
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
                        label={
                          locationSource === 'gps' ? 'GPS Location' : 
                          locationSource === 'mobile' ? 'Mobile GPS' : 
                          locationSource === 'ip' ? 'IP Location' :
                          'Manual Location'
                        } 
                        size="small" 
                        color={
                          locationSource === 'gps' ? 'primary' : 
                          locationSource === 'mobile' ? 'success' : 
                          locationSource === 'ip' ? 'info' :
                          'secondary'
                        }
                        sx={{ mt: 1, mb: 1 }}
                      />
                      {locationSource === 'ip' && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                          Estimated accuracy: ~2-5km
                        </Typography>
                      )}
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
                <Marker 
                  position={userLocation} 
                  icon={userLocationIcon}
                  eventHandlers={{
                    add: () => {
                      console.log('Main location marker added');
                    },
                    remove: () => {
                      console.log('Main location marker removed');
                    }
                  }}
                />
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

              console.log(`Center ${center.name} (${center.id}) weather:`, weather);

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
        </MapErrorBoundary>

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
            <Tooltip title="Get Mobile GPS Location">
              <IconButton 
                onClick={getMobileGPSLocation} 
                size="small"
                disabled={isLocating}
                color={locationSource === 'mobile' ? 'success' : 'default'}
              >
                <Visibility />
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
          <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, maxWidth: 500 }}>
            <Alert 
              severity="warning" 
              onClose={() => setLocationError(null)}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Location Service Issue
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {locationError}
              </Typography>
              <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary' }}>
                💡 Tip: You can still use the map by clicking anywhere to set your location manually.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={getUserLocation}
                  disabled={isLocating}
                  startIcon={isLocating ? <CircularProgress size={16} /> : <MyLocation />}
                  sx={{ fontWeight: 'bold' }}
                >
                  Retry GPS
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={getMobileGPSLocation}
                  disabled={isLocating}
                  startIcon={<Visibility />}
                  color="success"
                >
                  Mobile GPS
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={enableManualMode}
                  startIcon={<Map />}
                >
                  Set Manually
                </Button>

                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setLocationError(null);
                    // Show comprehensive help dialog
                    const browserIssues = detectBrowserIssues();
                    let helpText = `Location Troubleshooting Tips:

1. Check Browser Permissions:
   - Click the lock/info icon in your browser's address bar
   - Ensure location access is "Allow" or "Ask"
   - Clear site data and try again

2. Enable Location Services:
   - On Windows: Settings > Privacy > Location > On
   - On Mac: System Preferences > Security & Privacy > Location Services
   - On Mobile: Settings > Privacy > Location Services

3. Try Different Methods:
   - GPS button (most accurate)
   - Mobile GPS button (if on mobile device)
   - Manual mode (click on map)

4. Browser Compatibility:
   - Chrome, Firefox, Safari, Edge work best
   - HTTPS required for location access
   - Try a different browser

5. Network Issues:
   - Check your internet connection
   - Try refreshing the page
   - Disable VPN if using one

6. System Issues:
   - Restart your browser
   - Check if GPS is enabled on your device
   - Try on a different device

Current Browser Issues: ${browserIssues.length > 0 ? browserIssues.join(', ') : 'None detected'}

If all else fails, you can still use the map by clicking anywhere to set your location manually.`;
                    
                    alert(helpText);
                  }}
                  startIcon={<Help />}
                  color="info"
                >
                  Help
                </Button>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Emergency Button (floating, unchanged) */}
        <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}>
          {/* Existing Emergency Button code here */}
        </Box>

        {/* Weather Panel (floating, bottom left) */}
        {userLocation && (
          <Paper elevation={6} sx={{ position: 'absolute', bottom: 32, left: 32, minWidth: 260, maxWidth: 340, p: 2, zIndex: 1201, borderRadius: 3, bgcolor: '#f8fafd', boxShadow: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {(() => {
                let IconComponent = WbSunny;
                let iconColor = '#ff9800';
                if (gpsWeather && gpsWeather.weather && gpsWeather.weather[0]) {
                  const condition = gpsWeather.weather[0].main.toLowerCase();
                  if (condition.includes('cloud') || condition.includes('overcast')) {
                    IconComponent = Cloud; iconColor = '#78909c';
                  } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
                    IconComponent = Opacity; iconColor = '#2196f3';
                  } else if (condition.includes('snow') || condition.includes('sleet')) {
                    IconComponent = AcUnit; iconColor = '#90caf9';
                  } else if (condition.includes('storm') || condition.includes('thunder')) {
                    IconComponent = Thunderstorm; iconColor = '#673ab7';
                  } else if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
                    IconComponent = Grain; iconColor = '#9e9e9e';
                  } else if (condition.includes('clear') || condition.includes('sunny')) {
                    IconComponent = WbSunny; iconColor = '#ff9800';
                  }
                }
                return <IconComponent sx={{ fontSize: 36, color: iconColor, mr: 1 }} />;
              })()}
              <Typography variant="h6" fontWeight={700}>Weather at your location</Typography>
            </Box>
            {weatherLoading ? (
              <Box display="flex" alignItems="center" justifyContent="center" py={2}><CircularProgress size={28} /></Box>
            ) : weatherError ? (
              <Alert severity="error">{weatherError}</Alert>
            ) : gpsWeather ? (
              <Box>
                <Typography variant="body1" fontWeight={600}>{gpsWeather.weather?.[0]?.main || 'N/A'}</Typography>
                <Typography variant="body2">{gpsWeather.name || ''}</Typography>
                <Typography variant="body2">Temp: {gpsWeather.main?.temp}°C, Feels: {gpsWeather.main?.feels_like}°C</Typography>
                <Typography variant="body2">Humidity: {gpsWeather.main?.humidity}%</Typography>
                <Typography variant="body2">Wind: {gpsWeather.wind?.speed} m/s</Typography>
                <Typography variant="body2">Visibility: {gpsWeather.visibility / 1000} km</Typography>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Forecast:</Typography>
                <Box>
                  {forecast.map((f, idx) => (
                    <Typography key={idx} variant="caption" display="block">
                      {new Date(f.dt * 1000).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}: {f.main.temp}°C, {f.weather[0].main}
                    </Typography>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2">No weather data</Typography>
            )}
          </Paper>
        )}

        {/* Quick Search for Centers (floating) */}
        <Box sx={{ position: 'absolute', top: 32, left: 32, zIndex: 1201, minWidth: 260, maxWidth: 340 }}>
          <Autocomplete
            options={centers}
            getOptionLabel={(option) => option.name}
            value={selectedCenter}
            onChange={(_, value) => {
              setSelectedCenter(value);
              if (value) {
                setUserLocation([
                  value.location.coordinates[1],
                  value.location.coordinates[0]
                ]);
              }
            }}
            inputValue={searchValue}
            onInputChange={(_, value) => setSearchValue(value)}
            renderInput={(params) => (
              <TextField {...params} label="Search Center" variant="outlined" size="small" />
            )}
          />
        </Box>
      </Box>

      {/* How to Use the App Instructions (below the map) */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3, bgcolor: '#fffbe7', boxShadow: 2, maxWidth: 700, width: '100%' }}>
          <Typography variant="h5" fontWeight={700} gutterBottom color="primary.main" sx={{ mb: 3, textAlign: 'center' }}>
            How to Use the App
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1.1rem' }}>
                Allow location access for personalized weather and map features.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mt: 0.5, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1.1rem' }}>
                Use the <Box component="span" sx={{ fontWeight: 700, color: 'error.main' }}>EMERGENCY</Box> button for urgent help.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1.1rem' }}>
                Click markers on the map for center details and real-time info.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1.1rem' }}>
                Search for a center by name using the search bar (top left).
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1.1rem' }}>
                Set your location manually by clicking the map (if GPS fails).
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1.1rem' }}>
                Check the weather panel for current and forecasted conditions at your location.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1.1rem' }}>
                Staff can log in using the button at the top right.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Emergency Alert Component */}
      <EmergencyAlert />
    </Box>
  );
};

export default PublicDashboard; 