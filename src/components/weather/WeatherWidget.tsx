import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  WbSunny,
  Cloud,
  Opacity,
  Air,
  Visibility,
  ExpandMore,
  ExpandLess,
  Refresh,
  Warning,
  Info
} from '@mui/icons-material';
import { WeatherData, WeatherForecast } from '../../types';
import apiService from '../../services/api';
import socketService from '../../services/socket';

interface WeatherWidgetProps {
  centerId: string;
  centerName: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ centerId, centerName }) => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch current weather
      const current = await apiService.getCurrentWeatherForCenter(centerId);
      setCurrentWeather(current);
      
      // Fetch forecast
      const forecastData = await apiService.getWeatherForecast(centerId);
      setForecast(forecastData);
      
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, [centerId]);

  useEffect(() => {
    fetchWeatherData();
    
    // Set up real-time weather updates
    const handleWeatherUpdate = (data: WeatherData & { timestamp: string }) => {
      if (data.center_id === centerId) {
        setCurrentWeather(data);
        setLastUpdate(new Date(data.timestamp));
      }
    };

    socketService.onWeatherUpdate(handleWeatherUpdate);

    return () => {
      socketService.offWeatherUpdate();
    };
  }, [centerId, fetchWeatherData]);

  const getWeatherIcon = (temperature?: number, precipitation?: number) => {
    if (precipitation && precipitation > 0) {
      return <Opacity sx={{ fontSize: 40, color: 'primary.main' }} />;
    }
    if (temperature && temperature > 25) {
      return <WbSunny sx={{ fontSize: 40, color: 'orange' }} />;
    }
    return <Cloud sx={{ fontSize: 40, color: 'grey.500' }} />;
  };

  const getWindDirection = (degrees?: number) => {
    if (!degrees) return 'N/A';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getWeatherCondition = (temperature?: number, precipitation?: number, windSpeed?: number) => {
    if (precipitation && precipitation > 10) return 'Heavy Rain';
    if (precipitation && precipitation > 5) return 'Rain';
    if (precipitation && precipitation > 0) return 'Light Rain';
    if (temperature && temperature > 30) return 'Hot';
    if (temperature && temperature > 20) return 'Warm';
    if (temperature && temperature > 10) return 'Mild';
    if (temperature && temperature > 0) return 'Cool';
    return 'Cold';
  };

  const getSafetyLevel = (weather: WeatherData) => {
    const { temperature, wind_speed, wave_height, visibility } = weather;
    
    if (wave_height && wave_height > 3) return { level: 'High Risk', color: 'error' as const };
    if (wind_speed && wind_speed > 25) return { level: 'High Risk', color: 'error' as const };
    if (visibility && visibility < 1000) return { level: 'High Risk', color: 'error' as const };
    if (wave_height && wave_height > 2) return { level: 'Moderate Risk', color: 'warning' as const };
    if (wind_speed && wind_speed > 15) return { level: 'Moderate Risk', color: 'warning' as const };
    if (visibility && visibility < 5000) return { level: 'Moderate Risk', color: 'warning' as const };
    
    return { level: 'Safe', color: 'success' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
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

  if (!currentWeather) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            <Typography variant="body2">No weather data available for {centerName}</Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const safetyLevel = getSafetyLevel(currentWeather);

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Weather Conditions - {centerName}
          </Typography>
          <Box>
            <Tooltip title="Refresh weather data">
              <IconButton size="small" onClick={fetchWeatherData}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {lastUpdate && (
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}

        {/* Current Weather */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={2}>
              {getWeatherIcon(currentWeather.temperature, currentWeather.precipitation)}
              <Box>
                <Typography variant="h4" component="span">
                  {currentWeather.temperature ? `${Math.round(currentWeather.temperature)}°C` : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getWeatherCondition(
                    currentWeather.temperature,
                    currentWeather.precipitation,
                    currentWeather.wind_speed
                  )}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box textAlign="right">
              <Chip
                label={safetyLevel.level}
                color={safetyLevel.color}
                icon={safetyLevel.color === 'error' ? <Warning /> : <Info />}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Weather Details */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Air sx={{ fontSize: 24, color: 'grey.600', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                Wind
              </Typography>
              <Typography variant="body1">
                {currentWeather.wind_speed ? `${currentWeather.wind_speed} km/h` : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getWindDirection(currentWeather.wind_direction)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Opacity sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                Precipitation
              </Typography>
              <Typography variant="body1">
                {currentWeather.precipitation ? `${currentWeather.precipitation} mm` : '0 mm'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Wave Height
              </Typography>
              <Typography variant="body1">
                {currentWeather.wave_height ? `${currentWeather.wave_height} m` : 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Visibility sx={{ fontSize: 24, color: 'grey.600', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                Visibility
              </Typography>
              <Typography variant="body1">
                {currentWeather.visibility ? `${currentWeather.visibility} m` : 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Expanded Forecast */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" mb={2}>
            Weather Forecast
          </Typography>
          {forecast.length > 0 ? (
            <Grid container spacing={2}>
              {forecast.slice(0, 5).map((forecastItem, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(forecastItem.recorded_at).toLocaleDateString()}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {getWeatherIcon(forecastItem.temperature, forecastItem.precipitation)}
                        <Typography variant="h6">
                          {forecastItem.temperature ? `${Math.round(forecastItem.temperature)}°C` : 'N/A'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Wind: {forecastItem.wind_speed ? `${forecastItem.wind_speed} km/h` : 'N/A'}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Waves: {forecastItem.wave_height ? `${forecastItem.wave_height} m` : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No forecast data available
            </Typography>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget; 