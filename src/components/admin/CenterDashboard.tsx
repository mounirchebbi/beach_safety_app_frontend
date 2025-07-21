import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Alert,
  CircularProgress,
  Button,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Avatar,
  Badge,
  LinearProgress,
  Fade
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  BeachAccess as BeachIcon,
  Notifications as NotificationsIcon,
  Report as ReportIcon,
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingIcon,
  LocalHospital as EmergencyIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  WbSunny,
  Flag as FlagIcon,
  DoNotDisturb as DoNotDisturbIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WeatherWidget from '../weather/WeatherWidget';
import WeatherAlerts from '../weather/WeatherAlerts';
import { apiService } from '../../services/api';
import { socketService } from '../../services/socket';
import { Center, EmergencyAlert, SafetyFlag, WeatherData, SafetyZone } from '../../types';
import BeachMap from '../map/BeachMap';

interface CenterStats {
  activeLifeguards: number;
  activeShifts: number;
  activeAlerts: number;
  currentFlag: SafetyFlag | null;
  lastWeatherUpdate: WeatherData | null;
  totalLifeguards: number;
  totalShifts: number;
  centerName: string;
}

const CenterDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [center, setCenter] = useState<Center | null>(null);
  const [stats, setStats] = useState<CenterStats>({
    activeLifeguards: 0,
    activeShifts: 0,
    activeAlerts: 0,
    currentFlag: null,
    lastWeatherUpdate: null,
    totalLifeguards: 0,
    totalShifts: 0,
    centerName: ''
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [updatingStats, setUpdatingStats] = useState(false);
  const [showAlertNotification, setShowAlertNotification] = useState(false);
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);

  // Efficient function to update just the alerts count
  const updateAlertsCount = useCallback(async (centerId: string | undefined) => {
    if (!centerId) return;
    
    try {
      console.log('Updating alerts count for center:', centerId);
      setUpdatingStats(true);
      
      const alerts = await apiService.getAlerts();
      const centerAlerts = alerts.filter((alert: EmergencyAlert) => alert.center_id === centerId);
      const activeAlerts = centerAlerts.filter((alert: EmergencyAlert) => alert.status === 'active').length;
      
      console.log('New active alerts count:', activeAlerts);
      
      setStats(prev => ({
        ...prev,
        activeAlerts
      }));
    } catch (err) {
      console.error('Error updating alerts count:', err);
    } finally {
      setUpdatingStats(false);
    }
  }, []);

  // Efficient function to update just the lifeguard stats
  const updateLifeguardStats = useCallback(async (centerId: string | undefined) => {
    if (!centerId) return;
    
    try {
      console.log('Updating lifeguard stats for center:', centerId);
      setUpdatingStats(true);
      
      const lifeguards = await apiService.getLifeguards();
      const centerLifeguards = lifeguards.filter((lg: any) => lg.center_id === centerId);
      const activeLifeguards = centerLifeguards.filter((lg: any) => lg.user?.is_active).length;
      
      console.log('New active lifeguards count:', activeLifeguards);
      
      setStats(prev => ({
        ...prev,
        activeLifeguards,
        totalLifeguards: centerLifeguards.length
      }));
    } catch (err) {
      console.error('Error updating lifeguard stats:', err);
    } finally {
      setUpdatingStats(false);
    }
  }, []);

  // Efficient function to update just the shift stats
  const updateShiftStats = useCallback(async (centerId: string | undefined) => {
    if (!centerId) return;
    
    try {
      console.log('Updating shift stats for center:', centerId);
      setUpdatingStats(true);
      
      const shifts = await apiService.getShifts();
      const centerShifts = shifts.filter((shift: any) => shift.center_id === centerId);
      const activeShifts = centerShifts.filter((shift: any) => shift.status === 'active').length;
      
      console.log('New active shifts count:', activeShifts);
      
      setStats(prev => ({
        ...prev,
        activeShifts,
        totalShifts: centerShifts.length
      }));
    } catch (err) {
      console.error('Error updating shift stats:', err);
    } finally {
      setUpdatingStats(false);
    }
  }, []);

  // Efficient function to update just the weather stats
  const updateWeatherStats = useCallback(async (centerId: string | undefined) => {
    if (!centerId) return;
    
    try {
      console.log('Updating weather stats for center:', centerId);
      setUpdatingStats(true);
      
      const lastWeatherUpdate = await apiService.getCurrentWeatherForCenter(centerId);
      
      setStats(prev => ({
        ...prev,
        lastWeatherUpdate
      }));
    } catch (err) {
      console.error('Error updating weather stats:', err);
    } finally {
      setUpdatingStats(false);
    }
  }, []);

  // Efficient function to update just the safety flag stats
  const updateSafetyFlagStats = useCallback(async (centerId: string | undefined) => {
    if (!centerId) return;
    
    try {
      console.log('Updating safety flag stats for center:', centerId);
      setUpdatingStats(true);
      
      const flagHistory = await apiService.getSafetyFlagHistory(centerId, 1, 50);
      let currentFlag: SafetyFlag | null = null;
      
      if (flagHistory?.flags && flagHistory.flags.length > 0) {
        const now = new Date();
        const nonExpiredFlag = flagHistory.flags.find((flag: any) => {
          if (!flag.expires_at) return true;
          const expiryDate = new Date(flag.expires_at);
          return expiryDate > now;
        });
        
        if (nonExpiredFlag) {
          currentFlag = nonExpiredFlag;
        }
      }
      
      setStats(prev => ({
        ...prev,
        currentFlag
      }));
    } catch (err) {
      console.error('Error updating safety flag stats:', err);
    } finally {
      setUpdatingStats(false);
    }
  }, []);

  // WebSocket connection and real-time updates
  useEffect(() => {
    if (!user?.center_info?.id) {
      console.log('WebSocket setup skipped - user not available');
      return;
    }

    console.log('Setting up WebSocket connection for center dashboard:', user.center_info.id);
    
    try {
      const socket = socketService.connect();
      console.log('Socket service connected, socket object:', socket);
      
      // Join center room for real-time updates
      socketService.joinCenter(user.center_info.id);
      console.log('Joined center room:', user.center_info.id);
      
      // Listen for emergency alerts
      socketService.onEmergencyAlert((data) => {
        console.log('Emergency alert received:', data);
        updateAlertsCount(user?.center_info?.id);
        setShowAlertNotification(true);
        // Auto-hide notification after 5 seconds
        setTimeout(() => setShowAlertNotification(false), 5000);
      });

      // Listen for alert status changes
      socketService.onAlertStatusChange((data) => {
        console.log('Alert status change received:', data);
        updateAlertsCount(user?.center_info?.id);
      });

      // Listen for weather updates
      socketService.onWeatherUpdate((data) => {
        console.log('Weather update received:', data);
        if (data.center_id === user?.center_info?.id) {
          console.log('Weather update for this center, updating stats...');
          updateWeatherStats(user?.center_info?.id);
        }
      });

      // Listen for safety flag updates
      socketService.onSafetyFlagUpdated((data) => {
        console.log('Safety flag update received:', data);
        if (data.centerId === user?.center_info?.id) {
          console.log('Safety flag update for this center, updating stats...');
          updateSafetyFlagStats(user?.center_info?.id);
        }
      });

      // Listen for safety zone updates
      socketService.onSafetyZoneUpdated((data) => {
        console.log('Safety zone update received:', data);
        if (data.centerId === user?.center_info?.id) {
          console.log('Safety zone update for this center, updating zones...');
          // Assuming data.zones is an array of SafetyZone objects
          setSafetyZones(data.zones);
        }
      });

      // Listen for test emergency alerts (for debugging)
      socket.on('test_emergency_alert', (data) => {
        console.log('Test emergency alert received in dashboard:', data);
        if (data.center_id === user?.center_info?.id) {
          console.log('Test alert belongs to this center, updating alerts count...');
          updateAlertsCount(user?.center_info?.id);
        }
      });

      // Check socket connection status
      if (socket.connected) {
        console.log('Socket connected successfully');
        setSocketConnected(true);
      } else {
        console.log('Socket not connected, waiting for connection...');
        socket.on('connect', () => {
          console.log('Socket connected after waiting');
          setSocketConnected(true);
        });
      }

      // Add connection event listeners for debugging
      socket.on('connect', () => {
        console.log('Socket connected event fired');
        setSocketConnected(true);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setSocketConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setSocketConnected(false);
      });

      // Cleanup function
      return () => {
        console.log('Cleaning up WebSocket connection for center dashboard');
        socketService.offEmergencyAlert();
        socketService.offAlertStatusChange();
        socketService.offWeatherUpdate();
        socketService.offSafetyFlagUpdated();
        socketService.offSafetyZoneUpdated(); // Added offSafetyZoneUpdated
        socket.off('test_emergency_alert');
        socketService.disconnect();
        setSocketConnected(false);
      };
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      setSocketConnected(false);
    }
  }, [user?.center_info?.id]);

  // Periodic refresh as fallback (every 30 seconds)
  useEffect(() => {
    if (user?.center_info?.id) {
      const interval = setInterval(() => {
        console.log('Periodic refresh of alerts count');
        updateAlertsCount(user?.center_info?.id);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [user?.center_info?.id, updateAlertsCount]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      if (user?.center_info?.id) {
        // Load center data
        const centerData = await apiService.getCenterById(user.center_info.id);
        setCenter(centerData);

        // Load center statistics
        await loadCenterStats(user.center_info.id);
        // Load safety zones
        const zones = await apiService.getSafetyZonesByCenter(user.center_info.id);
        setSafetyZones(zones);
      } else {
        setError('No center information available');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch center data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCenterStats = async (centerId: string) => {
    try {
      // Load lifeguards
      const lifeguards = await apiService.getLifeguards();
      const centerLifeguards = lifeguards.filter((lg: any) => lg.center_id === centerId);
      const activeLifeguards = centerLifeguards.filter((lg: any) => lg.user?.is_active).length;

      // Load shifts
      const shifts = await apiService.getShifts();
      const centerShifts = shifts.filter((shift: any) => shift.center_id === centerId);
      const activeShifts = centerShifts.filter((shift: any) => shift.status === 'active').length;

      // Load alerts
      const alerts = await apiService.getAlerts();
      const centerAlerts = alerts.filter((alert: EmergencyAlert) => alert.center_id === centerId);
      const activeAlerts = centerAlerts.filter((alert: EmergencyAlert) => alert.status === 'active').length;

      // Load current safety flag - use most recent non-expired flag from history
      let currentFlag = null;
      try {
        const flagHistory = await apiService.getSafetyFlagHistory(centerId, 1, 50);
        if (flagHistory?.flags && flagHistory.flags.length > 0) {
          const now = new Date();
          const nonExpiredFlag = flagHistory.flags.find((flag: any) => {
            if (!flag.expires_at) return true;
            const expiryDate = new Date(flag.expires_at);
            return expiryDate > now;
          });
          
          if (nonExpiredFlag) {
            currentFlag = nonExpiredFlag;
          }
        }
      } catch (err) {
        console.log('No flag history available');
      }

      // Load current weather
      let lastWeatherUpdate = null;
      try {
        lastWeatherUpdate = await apiService.getCurrentWeatherForCenter(centerId);
      } catch (err) {
        console.log('No weather data available');
      }

      setStats({
        activeLifeguards,
        activeShifts,
        activeAlerts,
        currentFlag,
        lastWeatherUpdate,
        totalLifeguards: centerLifeguards.length,
        totalShifts: centerShifts.length,
        centerName: center?.name || user?.center_info?.name || 'Your Center'
      });
    } catch (err) {
      console.error('Error loading center stats:', err);
    }
  };

  const getFlagStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'error';
      case 'black': return 'default';
      default: return 'default';
    }
  };

  const getFlagStatusText = (status: string) => {
    switch (status) {
      case 'green': return 'Safe Conditions';
      case 'yellow': return 'Caution Required';
      case 'red': return 'Dangerous Conditions';
      case 'black': return 'Extreme Danger';
      default: return 'No Flag Set';
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading your center dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <BusinessIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Welcome back, {user?.first_name}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {stats.centerName} - Center Administration
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Connection Status Indicator */}
            <Tooltip title={socketConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: socketConnected ? '#4caf50' : '#f44336',
                    animation: socketConnected ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 }
                    }
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {socketConnected ? 'Live' : 'Offline'}
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip title="Refresh Dashboard">
              <IconButton 
                onClick={loadDashboardData}
                disabled={refreshing}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {/* Test button for debugging emergency alerts - HIDDEN */}
            {/* <Tooltip title="Test Emergency Alert Notification">
              <IconButton 
                onClick={() => {
                  console.log('Testing emergency alert notification...');
                  const socket = socketService.getSocket();
                  if (socket) {
                    socket.emit('test_emergency_alert', {
                      id: 'test-alert-' + Date.now(),
                      center_id: user?.center_info?.id,
                      alert_type: 'test',
                      severity: 'high',
                      timestamp: new Date().toISOString()
                    });
                  }
                }}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <EmergencyIcon />
              </IconButton>
            </Tooltip> */}
          </Box>
        </Box>
        
        {refreshing && <LinearProgress sx={{ bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {showAlertNotification && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setShowAlertNotification(false)}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/admin/alerts')}>
              View Alerts
            </Button>
          }
        >
          New emergency alert received! Please respond immediately.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Safety Flag - Prominent Card */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
            onClick={() => navigate('/admin/safety')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: stats.currentFlag ? `${getFlagStatusColor(stats.currentFlag.flag_status)}.light` : 'grey.100',
                  color: stats.currentFlag ? `${getFlagStatusColor(stats.currentFlag.flag_status)}.dark` : 'text.secondary'
                }}>
                  <FlagIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Safety Flag
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.currentFlag ? getFlagStatusText(stats.currentFlag.flag_status) : 'No Flag Set'}
                  </Typography>
                </Box>
              </Box>
              
              <Fade in={true} timeout={500}>
                <Box>
                  <Grid container spacing={2}>
                    {/* Left Half - Flag Status */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <TimeIcon color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Last Updated
                          </Typography>
                          <Typography variant="h6">
                            {stats.currentFlag ? new Date(stats.currentFlag.created_at).toLocaleTimeString() : 'Never'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Chip
                          icon={stats.currentFlag ? <CheckCircleIcon /> : <WarningIcon />}
                          label={stats.currentFlag ? getFlagStatusText(stats.currentFlag.flag_status) : 'No Flag Set'}
                          color={stats.currentFlag ? getFlagStatusColor(stats.currentFlag.flag_status) as any : 'default'}
                          size="medium"
                          sx={{ fontWeight: 600, fontSize: '1rem', py: 1 }}
                        />
                      </Box>
                      
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {stats.currentFlag?.flag_status === 'green' && 'Safe conditions - Normal swimming allowed'}
                          {stats.currentFlag?.flag_status === 'yellow' && 'Caution advised - Moderate hazards present'}
                          {stats.currentFlag?.flag_status === 'red' && 'Dangerous conditions - Swimming prohibited'}
                          {stats.currentFlag?.flag_status === 'black' && 'Beach closed - Extreme hazards present'}
                          {!stats.currentFlag && 'No safety flag currently set'}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Right Half - Weather Conditions */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                        Current Conditions
                      </Typography>
                      
                      {stats.lastWeatherUpdate ? (
                        <Box sx={{ space: 2 }}>
                          {/* Temperature */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <WbSunny sx={{ fontSize: 16, color: 'warning.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {stats.lastWeatherUpdate.temperature}°C
                            </Typography>
                            {stats.lastWeatherUpdate.feels_like && (
                              <Typography variant="caption" color="text.secondary">
                                (feels like {stats.lastWeatherUpdate.feels_like}°C)
                              </Typography>
                            )}
                          </Box>

                          {/* Wind */}
                          {stats.lastWeatherUpdate.wind_speed && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <Box sx={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                bgcolor: 'info.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
                                  W
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {stats.lastWeatherUpdate.wind_speed} km/h
                              </Typography>
                            </Box>
                          )}

                          {/* Wave Height */}
                          {stats.lastWeatherUpdate.wave_height && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <Box sx={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
                                  ~
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {stats.lastWeatherUpdate.wave_height}m waves
                              </Typography>
                            </Box>
                          )}

                          {/* Current Speed */}
                          {stats.lastWeatherUpdate.current_speed && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <Box sx={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                bgcolor: 'secondary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
                                  →
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {stats.lastWeatherUpdate.current_speed} km/h current
                              </Typography>
                            </Box>
                          )}

                          {/* Visibility */}
                          {stats.lastWeatherUpdate.visibility && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <Box sx={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                bgcolor: 'grey.500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
                                  👁
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {stats.lastWeatherUpdate.visibility}km visibility
                              </Typography>
                            </Box>
                          )}

                          {/* Weather Condition */}
                          {stats.lastWeatherUpdate.weather_condition && (
                            <Box sx={{ 
                              p: 1, 
                              bgcolor: 'grey.100', 
                              borderRadius: 1, 
                              mt: 1,
                              border: '1px solid',
                              borderColor: 'grey.300'
                            }}>
                              <Typography variant="caption" color="text.secondary">
                                {stats.lastWeatherUpdate.weather_condition}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50', 
                          borderRadius: 1,
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            No weather data available
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </Fade>
            </CardContent>
          </Card>
        </Grid>

        {/* Safety Zones - Prominent Card */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              position: 'relative',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
          >
            <CardContent sx={{ p: 3, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'info.light',
                  color: 'info.dark'
                }}>
                  <MapIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Safety Zones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No-Swim Zone Management
                  </Typography>
                </Box>
              </Box>
              
              <Fade in={true} timeout={500}>
                <Box>
                  <Grid container spacing={2}>
                    {/* Left Half - Zone Statistics (Clickable) */}
                    <Grid item xs={12} md={6}>
                      <Box 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.02)',
                            borderRadius: 1
                          }
                        }}
                        onClick={() => navigate('/admin/safety-zones')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <LocationIcon color="primary" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Active Zones
                            </Typography>
                            <Typography variant="h6">
                              {safetyZones.length} Active Zones
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Chip
                            icon={<CheckCircleIcon />}
                            label={safetyZones.length > 0 ? "Zones Active" : "No Zones"}
                            color={safetyZones.length > 0 ? "success" : "default"}
                            size="medium"
                            sx={{ fontWeight: 600, fontSize: '1rem', py: 1 }}
                          />
                        </Box>
                        
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {safetyZones.length > 0 
                              ? `Manage ${safetyZones.length} restricted swimming areas and safety zones along the beach`
                              : 'No safety zones configured. Click to create your first zone.'
                            }
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Right Half - Safety Zones Map (Non-clickable) */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                        Zone Map
                      </Typography>
                      
                      <Box 
                        sx={{ 
                          height: 200, 
                          width: '100%', 
                          borderRadius: 2, 
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'grey.300',
                          bgcolor: 'grey.50'
                        }}
                        onClick={(e) => {
                          // Prevent map interactions from triggering card click
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          // Prevent map interactions from triggering card click
                          e.stopPropagation();
                        }}
                        onTouchStart={(e) => {
                          // Prevent touch interactions from triggering card click
                          e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                          // Prevent pointer interactions from triggering card click
                          e.stopPropagation();
                        }}
                      >
                        {user?.center_info?.location ? (
                          <BeachMap
                            safetyZones={safetyZones}
                            center={[user.center_info.location.coordinates[1], user.center_info.location.coordinates[0]]}
                            zoom={14}
                            showSafetyZones={true}
                            showAlerts={false}
                            showUserLocation={false}
                            view="street"
                          />
                        ) : (
                          <Box sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            bgcolor: 'grey.100'
                          }}>
                            <Typography variant="body2" color="text.secondary">
                              Loading map...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      {safetyZones.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Zone Types:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {Array.from(new Set(safetyZones.map(zone => zone.zone_type))).map((type) => (
                              <Chip
                                key={type}
                                label={type.replace('_', ' ').toUpperCase()}
                                size="small"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 20,
                                  bgcolor: type === 'no_swim' ? 'error.light' : 
                                           type === 'caution' ? 'warning.light' : 'success.light',
                                  color: type === 'no_swim' ? 'error.dark' : 
                                         type === 'caution' ? 'warning.dark' : 'success.dark'
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </Fade>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Alerts - Critical Information */}
        <Grid item xs={12} lg={12}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              background: stats.activeAlerts > 0 ? 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)' : 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
            onClick={() => navigate('/admin/alerts')}
          >
            {/* Real-time indicator */}
            <Box sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: socketConnected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                animation: socketConnected ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }} />
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                {socketConnected ? 'Live' : 'Offline'}
              </Typography>
            </Box>

            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Badge badgeContent={stats.activeAlerts} color="error" max={99}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}>
                    <EmergencyIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Badge>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Emergency Alerts
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {stats.activeAlerts > 0 ? 'Active emergencies require attention' : 'All clear - no active emergencies'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
                  {stats.activeAlerts}
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                  {stats.activeAlerts === 1 ? 'Active Alert' : 'Active Alerts'}
                </Typography>
                
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {stats.activeAlerts > 0 
                      ? 'Click to view and manage active emergency alerts'
                      : 'Click to view emergency alerts history and management'
                    }
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={6}>
          <Card elevation={2} sx={{ 
            height: '100%',
            position: 'relative'
          }}>
            {/* Real-time update indicator */}
            {updatingStats && (
              <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }} />
            )}
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'primary.light',
                color: 'primary.dark',
                mb: 2,
                mx: 'auto',
                width: 'fit-content'
              }}>
                <PeopleIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.activeLifeguards}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Lifeguards
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {stats.totalLifeguards} total assigned
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/admin/lifeguards')}
                sx={{ mt: 1 }}
              >
                Manage Team
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Card elevation={2} sx={{ 
            height: '100%',
            position: 'relative'
          }}>
            {/* Real-time update indicator */}
            {updatingStats && (
              <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }} />
            )}
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'success.light',
                color: 'success.dark',
                mb: 2,
                mx: 'auto',
                width: 'fit-content'
              }}>
                <ScheduleIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.activeShifts}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Shifts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {stats.totalShifts} total scheduled
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/admin/shifts')}
                sx={{ mt: 1 }}
              >
                View Schedule
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions Grid */}
        <Grid item xs={12}>
          <Card elevation={1}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<WarningIcon />}
                    onClick={() => navigate('/admin/alerts')}
                    sx={{ 
                      py: 3, 
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Emergency Alerts
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage emergency responses
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/admin/lifeguards')}
                    sx={{ 
                      py: 3, 
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Team Management
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage lifeguard team
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ScheduleIcon />}
                    onClick={() => navigate('/admin/shifts')}
                    sx={{ 
                      py: 3, 
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Shift Scheduling
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage work schedules
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ReportIcon />}
                    onClick={() => navigate('/admin/reports')}
                    sx={{ 
                      py: 3, 
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Reports & Analytics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View incident reports
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Weather Widget - Enhanced */}
        {user?.center_info?.id && (
          <Grid item xs={12}>
            <Card elevation={1} sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Pattern */}
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                zIndex: 0
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                zIndex: 0
              }} />
              
              <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 3, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}>
                    <WbSunny sx={{ fontSize: 32, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Current Conditions
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Real-time weather and marine conditions for {stats.centerName}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  borderRadius: 3, 
                  p: 3,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <WeatherWidget 
                    centerId={user.center_info.id} 
                    centerName={stats.centerName} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CenterDashboard; 