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
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  BeachAccess as BeachIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Report as ReportIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CheckCircleIcon,
  LocalHospital as EmergencyIcon,
  Visibility as VisibilityIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WeatherWidget from '../weather/WeatherWidget';
import apiService from '../../services/api';
import socketService from '../../services/socket';

interface CurrentShift {
  id: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'upcoming' | 'completed';
  center_name: string;
}

interface DashboardStats {
  activeAlerts: number;
  todayShifts: number;
  completedShifts: number;
}

const LifeguardDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentShift, setCurrentShift] = useState<CurrentShift | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeAlerts: 0,
    todayShifts: 0,
    completedShifts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showAlertNotification, setShowAlertNotification] = useState(false);

  // WebSocket connection and event listeners
  useEffect(() => {
    if (user?.center_info?.id) {
      console.log('Setting up WebSocket connection for center:', user.center_info.id);
      
      try {
        const socket = socketService.connect();
        console.log('Socket service connected, socket object:', socket);
        
        // Join center room for real-time updates
        socketService.joinCenter(user.center_info.id);
        console.log('Joined center room:', user.center_info.id);
        
        // Listen for emergency alerts
        socketService.onEmergencyAlert((data) => {
          console.log('Emergency alert received:', data);
          updateActiveAlertsCount();
          setShowAlertNotification(true);
          // Auto-hide notification after 5 seconds
          setTimeout(() => setShowAlertNotification(false), 5000);
        });

        // Listen for alert status changes
        socketService.onAlertStatusChange((data) => {
          console.log('Alert status change received:', data);
          updateActiveAlertsCount();
        });

        // Listen for alert acknowledgments
        socketService.onAlertAcknowledged((data) => {
          console.log('Alert acknowledged:', data);
          updateActiveAlertsCount();
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
          console.log('Cleaning up WebSocket connection');
          socketService.offEmergencyAlert();
          socketService.offAlertStatusChange();
          socketService.offAlertAcknowledged();
          socketService.disconnect();
          setSocketConnected(false);
        };
      } catch (error) {
        console.error('Error setting up WebSocket connection:', error);
        setSocketConnected(false);
      }
    }
  }, [user?.center_info?.id]);

  // Update active alerts count
  const updateActiveAlertsCount = useCallback(async () => {
    if (user?.center_info?.id) {
      try {
        console.log('Updating active alerts count for center:', user.center_info.id);
        console.log('User center info:', user.center_info);
        
        const alertsData = await apiService.getAlerts();
        console.log('All alerts data received:', alertsData);
        console.log('Number of alerts received:', alertsData.length);
        
        // Log each alert to see the structure
        alertsData.forEach((alert: any, index: number) => {
          console.log(`Alert ${index}:`, {
            id: alert.id,
            center_id: alert.center_id,
            status: alert.status,
            alert_type: alert.alert_type,
            severity: alert.severity
          });
        });
        
        // The backend already filters alerts by center, so we don't need to filter again
        // Just count active alerts from the returned data
        const activeAlerts = alertsData.filter((alert: any) => alert.status === 'active').length;
        console.log('Active alerts count:', activeAlerts);
        
        setStats(prev => ({
          ...prev,
          activeAlerts
        }));
        console.log('Updated active alerts count:', activeAlerts);
      } catch (err) {
        console.error('Failed to update active alerts count:', err);
      }
    } else {
      console.log('No user center info available:', user);
    }
  }, [user?.center_info?.id]);

  // Periodic refresh as fallback (every 30 seconds)
  useEffect(() => {
    if (user?.center_info?.id) {
      const interval = setInterval(() => {
        console.log('Periodic refresh of alerts count');
        updateActiveAlertsCount();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [user?.center_info?.id, updateActiveAlertsCount]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Load current shift
      if (user?.lifeguard_info?.id) {
        try {
          const shiftData = await apiService.getCurrentShift(user.lifeguard_info.id);
          setCurrentShift(shiftData);
        } catch (err) {
          console.log('No current shift found');
        }
      }

      // Load dashboard stats
      if (user?.center_info?.id) {
        try {
          await updateActiveAlertsCount();
        } catch (err) {
          console.log('Could not load alerts');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'upcoming': return 'warning';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getShiftStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckIcon />;
      case 'upcoming': return <TimeIcon />;
      case 'completed': return <CheckCircleIcon />;
      default: return <TimeIcon />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Shift ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading your dashboard...
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
              <BeachIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Welcome back, {user?.first_name}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {user?.center_info?.name || 'Your Beach Safety Center'}
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
            <Button color="inherit" size="small" onClick={() => navigate('/lifeguard/alerts')}>
              View Alerts
            </Button>
          }
        >
          New emergency alert received! Please respond immediately.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Shift Status - Prominent Card */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: currentShift?.status === 'active' ? 'success.light' : 'grey.100',
                  color: currentShift?.status === 'active' ? 'success.dark' : 'text.secondary'
                }}>
                  <ScheduleIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Current Shift Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentShift ? 'You are currently on duty' : 'No active shift'}
                  </Typography>
                </Box>
              </Box>
              
              {currentShift ? (
                <Fade in={true} timeout={500}>
                  <Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <LocationIcon color="primary" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Location
                            </Typography>
                            <Typography variant="h6">
                              {currentShift.center_name}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <TimeIcon color="primary" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Shift Time
                            </Typography>
                            <Typography variant="h6">
                              {formatTime(currentShift.start_time)} - {formatTime(currentShift.end_time)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
                      <Chip
                        icon={getShiftStatusIcon(currentShift.status)}
                        label={currentShift.status.charAt(0).toUpperCase() + currentShift.status.slice(1)}
                        color={getShiftStatusColor(currentShift.status) as any}
                        size="medium"
                        sx={{ fontWeight: 600, fontSize: '1rem', py: 1 }}
                      />
                      {currentShift.status === 'active' && (
                        <Typography variant="body2" color="text.secondary">
                          {getTimeRemaining(currentShift.end_time)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Fade>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    bgcolor: 'grey.50', 
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    mb: 3
                  }}>
                    <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Active Shift
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      You're not currently scheduled for a shift
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<ScheduleIcon />}
                      onClick={() => navigate('/lifeguard/shifts')}
                    >
                      View My Shifts
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Alerts - Critical Information */}
        <Grid item xs={12} lg={4}>
          <Card elevation={2} sx={{ 
            height: '100%',
            background: stats.activeAlerts > 0 ? 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)' : 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
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
                
                <Stack spacing={1} sx={{ width: '100%' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<WarningIcon />}
                    onClick={() => navigate('/lifeguard/alerts')}
                    sx={{ 
                      bgcolor: 'white', 
                      color: stats.activeAlerts > 0 ? 'error.main' : 'success.main',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                    }}
                  >
                    {stats.activeAlerts > 0 ? 'Respond Now' : 'View Alerts'}
                  </Button>
                  
                                    <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={updateActiveAlertsCount}
                    disabled={refreshing}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.5)',
                      color: 'rgba(255,255,255,0.9)',
                      '&:hover': { 
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {refreshing ? 'Updating...' : 'Refresh'}
                  </Button>
                  

                  

                </Stack>
              </Box>
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
                    onClick={() => navigate('/lifeguard/alerts')}
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
                        Respond to emergencies
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ScheduleIcon />}
                    onClick={() => navigate('/lifeguard/shifts')}
                    sx={{ 
                      py: 3, 
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        My Shifts
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage your schedule
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ReportIcon />}
                    onClick={() => navigate('/lifeguard/reports')}
                    sx={{ 
                      py: 3, 
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Incident Reports
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Log incidents & reports
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<BeachIcon />}
                    onClick={() => navigate('/map')}
                    sx={{ 
                      py: 3, 
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Beach Map
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View safety zones & alerts
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
            <Card elevation={1}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'primary.light',
                    color: 'primary.dark'
                  }}>
                    <VisibilityIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Current Conditions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Real-time weather and marine conditions
                    </Typography>
                  </Box>
                </Box>
                <WeatherWidget 
                  centerId={user.center_info.id} 
                  centerName={user.center_info.name || 'Your Center'} 
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default LifeguardDashboard; 