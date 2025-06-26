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

// Sample data for demonstration
const sampleCenters = [
  {
    id: '1',
    name: 'South Beach Lifeguard Station',
    location: { lat: 25.7617, lng: -80.1918 },
    status: 'open' as const,
    lifeguards_on_duty: 4,
    weather_condition: 'Sunny',
    water_temperature: 26,
    air_temperature: 28,
    wind_speed: 15,
    visibility: 10,
  },
  {
    id: '2',
    name: 'North Beach Safety Center',
    location: { lat: 25.8517, lng: -80.1218 },
    status: 'warning' as const,
    lifeguards_on_duty: 2,
    weather_condition: 'Partly Cloudy',
    water_temperature: 25,
    air_temperature: 27,
    wind_speed: 20,
    visibility: 8,
  },
  {
    id: '3',
    name: 'Mid-Beach Patrol Station',
    location: { lat: 25.8017, lng: -80.1518 },
    status: 'open' as const,
    lifeguards_on_duty: 3,
    weather_condition: 'Clear',
    water_temperature: 27,
    air_temperature: 29,
    wind_speed: 12,
    visibility: 12,
  },
];

const sampleAlerts = [
  {
    id: '1',
    center_id: '1',
    type: 'sos' as const,
    location: { lat: 25.7617, lng: -80.1918 },
    description: 'Swimmer in distress reported',
    status: 'active' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    center_id: '2',
    type: 'weather' as const,
    location: { lat: 25.8517, lng: -80.1218 },
    description: 'Strong currents detected',
    status: 'active' as const,
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
];

const sampleSafetyZones = [
  {
    id: '1',
    center_id: '1',
    location: { lat: 25.7617, lng: -80.1918 },
    radius: 500,
    type: 'swimming' as const,
    description: 'Designated swimming area with lifeguard supervision',
  },
  {
    id: '2',
    center_id: '2',
    location: { lat: 25.8517, lng: -80.1218 },
    radius: 300,
    type: 'restricted' as const,
    description: 'Dangerous currents - swimming not recommended',
  },
  {
    id: '3',
    center_id: '3',
    location: { lat: 25.8017, lng: -80.1518 },
    radius: 400,
    type: 'surfing' as const,
    description: 'Surfing zone with moderate waves',
  },
];

const MapPage: React.FC = () => {
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [showSafetyZones, setShowSafetyZones] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mapView, setMapView] = useState<'satellite' | 'street' | 'hybrid'>('street');

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

  const handleCenterClick = (center: any) => {
    setSelectedCenter(center);
  };

  const handleAlertClick = (alert: any) => {
    setSelectedAlert(alert);
  };

  const handleCenterMap = () => {
    if (userLocation) {
      // This would typically update the map center
      console.log('Centering map on user location:', userLocation);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" fontWeight="bold">
              Beach Safety Map
            </Typography>
            <Chip 
              label="Live" 
              color="success" 
              size="small" 
              icon={<CheckCircle />}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Fullscreen">
              <IconButton>
                <Fullscreen />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
          {/* Map */}
          <Box sx={{ flex: '0 0 66.666%' }}>
            <Paper elevation={2} sx={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
              <BeachMap
                centers={showCenters ? sampleCenters : []}
                alerts={showAlerts ? sampleAlerts : []}
                safetyZones={showSafetyZones ? sampleSafetyZones : []}
                userLocation={userLocation || undefined}
                onCenterClick={handleCenterClick}
                onAlertClick={handleAlertClick}
                showUserLocation={showUserLocation}
                showSafetyZones={showSafetyZones}
                showAlerts={showAlerts}
                view={mapView}
              />
              <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <MapControls
                  showUserLocation={showUserLocation}
                  showSafetyZones={showSafetyZones}
                  showAlerts={showAlerts}
                  showCenters={showCenters}
                  mapView={mapView}
                  onToggleUserLocation={() => setShowUserLocation(!showUserLocation)}
                  onToggleSafetyZones={() => setShowSafetyZones(!showSafetyZones)}
                  onToggleAlerts={() => setShowAlerts(!showAlerts)}
                  onToggleCenters={() => setShowCenters(!showCenters)}
                  onCenterMap={handleCenterMap}
                  onViewChange={setMapView}
                />
              </Box>
            </Paper>
          </Box>

          {/* Sidebar */}
          <Box sx={{ flex: '0 0 33.333%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Status Summary */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Summary
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip 
                    label={`${sampleCenters.filter(c => c.status === 'open').length} Active`}
                    color={getStatusColor('open')}
                    size="small"
                  />
                  <Chip 
                    label={`${sampleAlerts.length} Alerts`}
                    color={getStatusColor('warning')}
                    size="small"
                  />
                  <Chip 
                    label={`${sampleCenters.reduce((sum, c) => sum + c.lifeguards_on_duty, 0)} Lifeguards`}
                    color={getStatusColor('maintenance')}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Layer Controls */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Map Layers
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showCenters}
                        onChange={(e) => setShowCenters(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Safety Centers"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showAlerts}
                        onChange={(e) => setShowAlerts(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Active Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showSafetyZones}
                        onChange={(e) => setShowSafetyZones(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Safety Zones"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card sx={{ flex: 1, overflow: 'hidden' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  Active Alerts
                </Typography>
                <List sx={{ flex: 1, overflow: 'auto' }}>
                  {sampleAlerts.map((alert, index) => (
                    <React.Fragment key={alert.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Warning color={getSeverityColor(alert.type) as any} />
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.description}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {alert.location.lat}, {alert.location.lng} • {formatTimeAgo(new Date(alert.created_at))}
                              </Typography>
                              <Chip 
                                label={alert.type.toUpperCase()}
                                color={getSeverityColor(alert.type) as any}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < sampleAlerts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Center Details Dialog */}
      <Dialog
        open={!!selectedCenter}
        onClose={() => setSelectedCenter(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {selectedCenter?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedCenter && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Chip
                icon={selectedCenter.status === 'open' ? <CheckCircle /> : <Warning />}
                label={selectedCenter.status.toUpperCase()}
                color={getStatusColor(selectedCenter.status)}
              />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Lifeguards on Duty:</strong> {selectedCenter.lifeguards_on_duty}
                </Typography>
                <Typography variant="body2">
                  <strong>Weather:</strong> {selectedCenter.weather_condition}
                </Typography>
                <Typography variant="body2">
                  <strong>Water Temperature:</strong> {selectedCenter.water_temperature}°C
                </Typography>
                <Typography variant="body2">
                  <strong>Air Temperature:</strong> {selectedCenter.air_temperature}°C
                </Typography>
                <Typography variant="body2">
                  <strong>Wind Speed:</strong> {selectedCenter.wind_speed} km/h
                </Typography>
                <Typography variant="body2">
                  <strong>Visibility:</strong> {selectedCenter.visibility} km
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCenter(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Details Dialog */}
      <Dialog
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {selectedAlert?.type.toUpperCase()} Alert
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Chip
                label={selectedAlert.status.toUpperCase()}
                color={selectedAlert.status === 'active' ? 'error' : 'success'}
              />
              
              <Typography variant="body1">
                {selectedAlert.description}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(selectedAlert.created_at).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAlert(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapPage; 