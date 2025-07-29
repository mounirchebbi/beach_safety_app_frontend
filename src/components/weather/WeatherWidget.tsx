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
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching weather data for center:', centerId);
      
      // Fetch current weather
      const current = await apiService.getCurrentWeatherForCenter(centerId);
      console.log('Current weather data:', current);
      console.log('Weather data details:', {
        temperature: current.temperature,
        wind_speed: current.wind_speed,
        wave_height: current.wave_height,
        visibility: current.visibility,
        precipitation: current.precipitation
      });
      setCurrentWeather(current);
      
      // Fetch forecast
      const forecastData = await apiService.getWeatherForecast(centerId);
      console.log('Forecast data:', forecastData);
      console.log('Forecast data length:', forecastData.length);
      setForecast(forecastData);
      
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error fetching weather data:', err);
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
    if (precipitation && precipitation > 10) {
      return <Opacity sx={{ fontSize: 40, color: '#2196f3' }} />; // Blue for heavy rain
    }
    if (precipitation && precipitation > 5) {
      return <Opacity sx={{ fontSize: 40, color: '#64b5f6' }} />; // Light blue for moderate rain
    }
    if (precipitation && precipitation > 0) {
      return <Opacity sx={{ fontSize: 40, color: '#90caf9' }} />; // Very light blue for light rain
    }
    if (temperature && temperature > 30) {
      return <WbSunny sx={{ fontSize: 40, color: '#ff9800' }} />; // Orange for hot weather
    }
    if (temperature && temperature > 20) {
      return <WbSunny sx={{ fontSize: 40, color: '#ffc107' }} />; // Yellow for warm weather
    }
    if (temperature && temperature > 10) {
      return <Cloud sx={{ fontSize: 40, color: '#90a4ae' }} />; // Grey for mild weather
    }
    if (temperature && temperature > 0) {
      return <Cloud sx={{ fontSize: 40, color: '#b0bec5' }} />; // Light grey for cool weather
    }
    return <Cloud sx={{ fontSize: 40, color: '#cfd8dc' }} />; // Very light grey for cold weather
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
    
    // Debug logging to see actual values
    console.log('Safety level calculation:', {
      temperature,
      wind_speed,
      wave_height,
      visibility,
      visibilityInMeters: visibility ? visibility * 1000 : null
    });
    
    // Convert visibility from km to meters for comparison
    const visibilityInMeters = visibility ? visibility * 1000 : null;
    
    // More realistic thresholds for beach safety
    if (wave_height && wave_height > 4) {
      console.log('High Risk: Wave height > 4m:', wave_height);
      return { level: 'High Risk', color: 'error' as const };
    }
    if (wind_speed && wind_speed > 30) {
      console.log('High Risk: Wind speed > 30 km/h:', wind_speed);
      return { level: 'High Risk', color: 'error' as const };
    }
    if (visibilityInMeters && visibilityInMeters < 500) {
      console.log('High Risk: Visibility < 500m:', visibilityInMeters);
      return { level: 'High Risk', color: 'error' as const };
    }
    if (wave_height && wave_height > 2.5) {
      console.log('Moderate Risk: Wave height > 2.5m:', wave_height);
      return { level: 'Moderate Risk', color: 'warning' as const };
    }
    if (wind_speed && wind_speed > 20) {
      console.log('Moderate Risk: Wind speed > 20 km/h:', wind_speed);
      return { level: 'Moderate Risk', color: 'warning' as const };
    }
    if (visibilityInMeters && visibilityInMeters < 2000) {
      console.log('Moderate Risk: Visibility < 2000m:', visibilityInMeters);
      return { level: 'Moderate Risk', color: 'warning' as const };
    }
    
    console.log('Safe conditions');
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
    <Box sx={{ color: 'inherit' }}>
      {/* Header with Refresh Control */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Weather Conditions
          </Typography>
          {lastUpdate && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        <Tooltip title="Refresh weather data">
          <IconButton 
            size="small" 
            onClick={fetchWeatherData}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Current Weather - Compact Display */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Temperature and Condition */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            p: 2,
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              {getWeatherIcon(currentWeather.temperature, currentWeather.precipitation)}
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {currentWeather.temperature ? `${Math.round(currentWeather.temperature)}°C` : 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                {getWeatherCondition(
                  currentWeather.temperature,
                  currentWeather.precipitation,
                  currentWeather.wind_speed
                )}
              </Typography>
              <Chip
                label={safetyLevel.level}
                color={safetyLevel.color}
                icon={safetyLevel.color === 'error' ? <Warning /> : <Info />}
                size="small"
                sx={{ 
                  bgcolor: safetyLevel.color === 'error' ? '#d32f2f' : 
                          safetyLevel.color === 'warning' ? '#ed6c02' : '#2e7d32',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Current Weather Details - Compact Grid */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ 
                textAlign: 'center',
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.2)',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Air sx={{ fontSize: 20, color: 'white', mb: 0.5 }} />
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>
                  Wind
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {currentWeather.wind_speed ? `${currentWeather.wind_speed} km/h` : 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                  {getWindDirection(currentWeather.wind_direction)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ 
                textAlign: 'center',
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.2)',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Opacity sx={{ fontSize: 20, color: 'white', mb: 0.5 }} />
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>
                  Rain
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {currentWeather.precipitation ? `${currentWeather.precipitation} mm` : '0 mm'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ 
                textAlign: 'center',
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.2)',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Box sx={{ fontSize: 20, color: 'white', mb: 0.5 }}></Box>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>
                  Waves
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {currentWeather.wave_height ? `${currentWeather.wave_height} m` : 'N/A'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ 
                textAlign: 'center',
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.2)',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Visibility sx={{ fontSize: 20, color: 'white', mb: 0.5 }} />
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>
                  Visibility
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {currentWeather.visibility ? `${currentWeather.visibility} m` : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Weather Forecast - Always Visible */}
      <Box sx={{ 
        p: 2,
        bgcolor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Weather Forecast
        </Typography>
        {forecast.length > 0 ? (
          <Grid container spacing={1}>
            {forecast.slice(0, 5).map((forecastItem, index) => (
              <Grid item xs={12} sm={6} md={2.4} key={index}>
                <Box sx={{ 
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'center'
                }}>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                    {new Date(forecastItem.recorded_at).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                    {getWeatherIcon(forecastItem.temperature, forecastItem.precipitation)}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {forecastItem.temperature ? `${Math.round(forecastItem.temperature)}°` : 'N/A'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', fontSize: '0.65rem' }}>
                    {forecastItem.wind_speed ? `${forecastItem.wind_speed} km/h` : 'N/A'} • {forecastItem.wave_height ? `${forecastItem.wave_height}m` : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.8, textAlign: 'center' }}>
            No forecast data available
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default WeatherWidget; 