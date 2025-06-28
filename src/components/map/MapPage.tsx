import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BeachAccess,
  Warning,
  CheckCircle,
  LocationOn,
  Refresh,
  Fullscreen,
  Settings
} from '@mui/icons-material';
import BeachMap from './BeachMap';
import MapControls from './MapControls';
import apiService from '../../services/api';
import { Center, EmergencyAlert } from '../../types';
import { useAuth } from '../../context/AuthContext';

// Transform center data to match BeachMap interface
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

// Transform alert data to match BeachMap interface
interface MapAlert {
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

const MapPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [showSafetyZones, setShowSafetyZones] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<BeachCenter | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapView, setMapView] = useState<'satellite' | 'street' | 'hybrid'>('street');
  
  // Real data from API
  const [centers, setCenters] = useState<BeachCenter[]>([]);
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [weatherData, setWeatherData] = useState<any>({});

  // Fetch centers and their data
  const fetchCentersData = async () => {
    try {
      setLoading(true);
      
      // Fetch all centers
      const centersData = await apiService.getPublicCenters();
      
      // Fetch current weather for all centers (public endpoint)
      let weatherData: any[] = [];
      try {
        weatherData = await apiService.getCurrentWeather();
      } catch (error) {
        console.log('Could not fetch weather data:', error);
      }

      // Fetch lifeguard counts for all centers (public endpoint)
      let lifeguardCounts: any[] = [];
      try {
        lifeguardCounts = await apiService.getPublicLifeguardCounts();
      } catch (error) {
        console.log('Could not fetch lifeguard counts:', error);
      }

      // Fetch safety flags for all centers (public endpoint)
      let safetyFlags: any[] = [];
      try {
        safetyFlags = await apiService.getPublicSafetyFlags();
      } catch (error) {
        console.log('Could not fetch safety flags:', error);
      }
      
      // Transform centers data and fetch additional info
      const transformedCenters = await Promise.all(
        centersData.map(async (center: Center) => {
          const location = {
            lat: center.location.coordinates[1],
            lng: center.location.coordinates[0]
          };

          // Find weather data for this center - get the most recent one
          const centerWeatherRecords = weatherData.filter(w => w.center_id === center.id);
          const centerWeather = centerWeatherRecords.length > 0 
            ? centerWeatherRecords.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]
            : null;
          
          let weatherInfo = {
            weather_condition: 'Unknown',
            water_temperature: 0,
            air_temperature: 0,
            wind_speed: 0,
            visibility: 0,
            wave_height: 0,
            current_speed: 0
          };

          if (centerWeather) {
            weatherInfo = {
              weather_condition: centerWeather.weather_condition || 'Unknown',
              water_temperature: parseFloat(centerWeather.temperature) || 0,
              air_temperature: parseFloat(centerWeather.temperature) || 0,
              wind_speed: parseFloat(centerWeather.wind_speed) || 0,
              visibility: parseFloat(centerWeather.visibility) || 0,
              wave_height: parseFloat(centerWeather.wave_height) || 0,
              current_speed: parseFloat(centerWeather.current_speed) || 0
            };
          }

          // Get lifeguard count for this center from public endpoint
          const centerLifeguardData = lifeguardCounts.find(l => l.center_id === center.id);
          const lifeguardCount = centerLifeguardData ? centerLifeguardData.lifeguard_count : 0;

          // Get safety flag for this center from public endpoint
          const centerFlagData = safetyFlags.find(f => f.center_id === center.id);
          const flagStatus = centerFlagData ? centerFlagData.flag_status : 'green';
          const flagReason = centerFlagData ? centerFlagData.reason : undefined;

          return {
            id: center.id,
            name: center.name,
            location,
            status: 'open' as const, // Default status, could be enhanced with real status
            lifeguards_on_duty: lifeguardCount,
            flag_status: flagStatus as 'green' | 'yellow' | 'red' | 'black',
            flag_reason: flagReason,
            ...weatherInfo
          };
        })
      );

      setCenters(transformedCenters);
      
      // Fetch alerts (only if authenticated)
      if (isAuthenticated) {
        try {
          const alertsData = await apiService.getAlerts();
          const transformedAlerts: MapAlert[] = alertsData.map((alert: EmergencyAlert) => ({
            id: alert.id,
            center_id: alert.center_id,
            type: alert.alert_type as 'sos' | 'medical' | 'weather' | 'safety',
            location: {
              lat: alert.location.coordinates[1],
              lng: alert.location.coordinates[0]
            },
            description: alert.description || 'No description available',
            status: alert.status as 'active' | 'resolved',
            created_at: alert.created_at
          }));
          setAlerts(transformedAlerts);
        } catch (error) {
          console.log('Could not fetch alerts:', error);
          setAlerts([]);
        }
      } else {
        setAlerts([]);
      }

    } catch (error) {
      console.error('Error fetching centers data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
  }, []);

  // Fetch centers data on component mount
  useEffect(() => {
    fetchCentersData();
  }, []);

  const handleCenterClick = (center: BeachCenter) => {
    setSelectedCenter(center);
  };

  const handleAlertClick = (alert: MapAlert) => {
    setSelectedAlert(alert);
  };

  const handleCenterMap = () => {
    if (userLocation) {
      // This would typically update the map center
      console.log('Centering map on user location:', userLocation);
    }
  };

  const handleRefresh = () => {
    fetchCentersData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'warning': return 'warning';
      case 'maintenance': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'sos': return 'error';
      case 'weather': return 'warning';
      case 'active': return 'error';
      case 'warning': return 'warning';
      case 'maintenance': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Beach Safety Map
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Monitor beach safety centers, lifeguard stations, and emergency alerts in real-time.
      </Typography>

      <Grid container spacing={3}>
        {/* Map Controls */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Map Controls
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showUserLocation}
                  onChange={(e) => setShowUserLocation(e.target.checked)}
                />
              }
              label="Show My Location"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={showCenters}
                  onChange={(e) => setShowCenters(e.target.checked)}
                />
              }
              label="Show Centers"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={showAlerts}
                  onChange={(e) => setShowAlerts(e.target.checked)}
                />
              }
              label="Show Alerts"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={showSafetyZones}
                  onChange={(e) => setShowSafetyZones(e.target.checked)}
                />
              }
              label="Show Safety Zones"
            />

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : 'Refresh Data'}
              </Button>
            </Box>
          </Paper>

          {/* Centers List */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Beach Centers ({centers.length})
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
              </Box>
            ) : centers.length > 0 ? (
              <List dense>
                {centers.map((center) => (
                  <ListItem
                    key={center.id}
                    button
                    onClick={() => handleCenterClick(center)}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon>
                      <LocationOn color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={center.name}
                      secondary={
                        <Box>
                          <Chip
                            label={center.status.toUpperCase()}
                            color={getStatusColor(center.status) as any}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" display="block">
                            Lifeguards: {center.lifeguards_on_duty} | Weather: {center.weather_condition}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No beach centers found
              </Alert>
            )}
          </Paper>

          {/* Alerts List */}
          {alerts.length > 0 && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Active Alerts ({alerts.filter(a => a.status === 'active').length})
              </Typography>
              
              <List dense>
                {alerts.filter(alert => alert.status === 'active').map((alert) => (
                  <ListItem
                    key={alert.id}
                    button
                    onClick={() => handleAlertClick(alert)}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon>
                      <Warning color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${alert.type.toUpperCase()} Alert`}
                      secondary={
                        <Box>
                          <Typography variant="body2" noWrap>
                            {alert.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(new Date(alert.created_at))}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Map */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Interactive Safety Map
              </Typography>
              
              <Box>
                <Tooltip title="Center on my location">
                  <IconButton onClick={handleCenterMap} disabled={!userLocation}>
                    <LocationOn />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Refresh data">
                  <IconButton onClick={handleRefresh} disabled={loading}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
              </Box>
            ) : (
              <BeachMap
                centers={showCenters ? centers : []}
                alerts={showAlerts ? alerts : []}
                safetyZones={[]} // Could be enhanced with real safety zones
                userLocation={userLocation || undefined}
                onCenterClick={handleCenterClick}
                onAlertClick={handleAlertClick}
                showUserLocation={showUserLocation}
                showSafetyZones={showSafetyZones}
                showAlerts={showAlerts}
                view={mapView}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Center Details Dialog */}
      <Dialog
        open={!!selectedCenter}
        onClose={() => setSelectedCenter(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedCenter && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <LocationOn color="primary" sx={{ mr: 1 }} />
                {selectedCenter.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Chip
                    label={selectedCenter.status.toUpperCase()}
                    color={getStatusColor(selectedCenter.status) as any}
                    icon={<CheckCircle />}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Lifeguards on Duty
                  </Typography>
                  <Typography variant="h6">
                    {selectedCenter.lifeguards_on_duty}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Weather Condition
                  </Typography>
                  <Typography variant="h6">
                    {selectedCenter.weather_condition}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Air Temperature
                  </Typography>
                  <Typography variant="h6">
                    {selectedCenter.air_temperature}°C
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Water Temperature
                  </Typography>
                  <Typography variant="h6">
                    {selectedCenter.water_temperature}°C
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Wind Speed
                  </Typography>
                  <Typography variant="h6">
                    {selectedCenter.wind_speed} km/h
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Visibility
                  </Typography>
                  <Typography variant="h6">
                    {selectedCenter.visibility} km
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedCenter(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Alert Details Dialog */}
      <Dialog
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <Warning color="error" sx={{ mr: 1 }} />
                {selectedAlert.type.toUpperCase()} Alert
              </Box>
            </DialogTitle>
            <DialogContent>
              <Chip
                label={selectedAlert.status.toUpperCase()}
                color={selectedAlert.status === 'active' ? 'error' : 'success'}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body1" paragraph>
                {selectedAlert.description}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                Reported: {new Date(selectedAlert.created_at).toLocaleString()}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAlert(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MapPage; 