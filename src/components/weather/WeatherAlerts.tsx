import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Warning,
  Info,
  Error,
  Refresh,
  NotificationsActive,
  Visibility
} from '@mui/icons-material';
import { WeatherData } from '../../types';
import apiService from '../../services/api';

interface WeatherAlertsProps {
  centerId: string;
  centerName: string;
}

interface WeatherAlert {
  id: string;
  type: 'warning' | 'alert' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  issuedAt: string;
  expiresAt?: string;
  weatherConditions: Partial<WeatherData>;
}

const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ centerId, centerName }) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch current weather to check for alerts
      const currentWeather = await apiService.getCurrentWeatherForCenter(centerId);
      
      // Generate alerts based on weather conditions
      const generatedAlerts: WeatherAlert[] = [];
      
      if (currentWeather.wave_height && currentWeather.wave_height > 3) {
        generatedAlerts.push({
          id: 'wave-warning',
          type: 'warning',
          severity: 'high',
          title: 'High Wave Warning',
          description: `Dangerous wave conditions detected. Wave height: ${currentWeather.wave_height}m`,
          issuedAt: new Date().toISOString(),
          weatherConditions: { wave_height: currentWeather.wave_height }
        });
      }
      
      if (currentWeather.wind_speed && currentWeather.wind_speed > 25) {
        generatedAlerts.push({
          id: 'wind-warning',
          type: 'warning',
          severity: 'high',
          title: 'High Wind Warning',
          description: `Strong winds detected. Wind speed: ${currentWeather.wind_speed} km/h`,
          issuedAt: new Date().toISOString(),
          weatherConditions: { wind_speed: currentWeather.wind_speed }
        });
      }
      
      if (currentWeather.visibility && currentWeather.visibility < 1000) {
        generatedAlerts.push({
          id: 'visibility-warning',
          type: 'warning',
          severity: 'critical',
          title: 'Low Visibility Warning',
          description: `Poor visibility conditions. Visibility: ${currentWeather.visibility}m`,
          issuedAt: new Date().toISOString(),
          weatherConditions: { visibility: currentWeather.visibility }
        });
      }
      
      if (currentWeather.precipitation && currentWeather.precipitation > 10) {
        generatedAlerts.push({
          id: 'rain-warning',
          type: 'alert',
          severity: 'medium',
          title: 'Heavy Rain Alert',
          description: `Heavy rainfall detected. Precipitation: ${currentWeather.precipitation}mm`,
          issuedAt: new Date().toISOString(),
          weatherConditions: { precipitation: currentWeather.precipitation }
        });
      }
      
      if (currentWeather.temperature && currentWeather.temperature > 35) {
        generatedAlerts.push({
          id: 'heat-warning',
          type: 'alert',
          severity: 'medium',
          title: 'Heat Warning',
          description: `High temperature detected. Temperature: ${currentWeather.temperature}°C`,
          issuedAt: new Date().toISOString(),
          weatherConditions: { temperature: currentWeather.temperature }
        });
      }
      
      // Add general weather info if no alerts
      if (generatedAlerts.length === 0) {
        generatedAlerts.push({
          id: 'weather-info',
          type: 'info',
          severity: 'low',
          title: 'Weather Conditions Normal',
          description: 'Current weather conditions are within safe parameters for beach activities.',
          issuedAt: new Date().toISOString(),
          weatherConditions: currentWeather
        });
      }
      
      setAlerts(generatedAlerts);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch weather alerts');
    } finally {
      setLoading(false);
    }
  }, [centerId]);

  useEffect(() => {
    fetchWeatherAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchWeatherAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchWeatherAlerts]);

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <Error color="error" />;
    if (severity === 'high') return <Warning color="warning" />;
    if (severity === 'medium') return <NotificationsActive color="info" />;
    return <Info color="success" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <Typography variant="body2">{error}</Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Weather Alerts - {centerName}
          </Typography>
          <Tooltip title="Refresh alerts">
            <IconButton size="small" onClick={fetchWeatherAlerts}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {alerts.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body2">No weather alerts at this time</Typography>
          </Alert>
        ) : (
          <List>
            {alerts.map((alert) => (
              <ListItem key={alert.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  {getAlertIcon(alert.type, alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" component="span">
                        {alert.title}
                      </Typography>
                      <Chip
                        label={alert.severity.toUpperCase()}
                        color={getSeverityColor(alert.severity) as any}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {alert.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Issued: {new Date(alert.issuedAt).toLocaleString()}
                      </Typography>
                      {alert.expiresAt && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Expires: {new Date(alert.expiresAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Alerts are automatically generated based on current weather conditions and updated every 5 minutes.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts; 