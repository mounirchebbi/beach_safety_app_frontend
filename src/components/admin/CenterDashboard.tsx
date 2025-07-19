import React, { useState, useEffect } from 'react';
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
  Avatar,
  Paper,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Fade
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingIcon,
  LocalHospital as EmergencyIcon,
  Report as ReportIcon,
  BeachAccess as BeachIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WeatherWidget from '../weather/WeatherWidget';
import WeatherAlerts from '../weather/WeatherAlerts';
import apiService from '../../services/api';
import { Center, EmergencyAlert, SafetyFlag, WeatherData } from '../../types';

interface CenterStats {
  activeLifeguards: number;
  activeShifts: number;
  activeAlerts: number;
  currentFlag: SafetyFlag | null;
  lastWeatherUpdate: WeatherData | null;
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
    lastWeatherUpdate: null
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const flagHistory = await apiService.getSafetyFlagHistory(centerId, 1, 50); // Get more flags to find non-expired one
        if (flagHistory?.flags && flagHistory.flags.length > 0) {
          const now = new Date();
          // Find the most recent non-expired flag
          const nonExpiredFlag = flagHistory.flags.find((flag: any) => {
            if (!flag.expires_at) return true; // No expiration date means it doesn't expire
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
        lastWeatherUpdate
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
      case 'green': return 'Safe';
      case 'yellow': return 'Caution';
      case 'red': return 'Danger';
      case 'black': return 'Closed';
      default: return 'Unknown';
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1">{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!center) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="body1">No center information available</Typography>
        </Alert>
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
                {center.name}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Center Administration Dashboard
              </Typography>
            </Box>
          </Box>
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
        
        {refreshing && <LinearProgress sx={{ bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />}
      </Paper>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Active Lifeguards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
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

        {/* Active Shifts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
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

        {/* Active Alerts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            height: '100%',
            background: stats.activeAlerts > 0 ? 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)' : 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.2)',
                mb: 2,
                mx: 'auto',
                width: 'fit-content'
              }}>
                <EmergencyIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.activeAlerts}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                {stats.activeAlerts === 1 ? 'Active Alert' : 'Active Alerts'}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/admin/alerts')}
                sx={{ 
                  bgcolor: 'white', 
                  color: stats.activeAlerts > 0 ? 'error.main' : 'success.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                {stats.activeAlerts > 0 ? 'Respond Now' : 'View Alerts'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Safety Flag */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: stats.currentFlag ? `${getFlagStatusColor(stats.currentFlag.flag_status)}.light` : 'grey.100',
                color: stats.currentFlag ? `${getFlagStatusColor(stats.currentFlag.flag_status)}.dark` : 'text.secondary',
                mb: 2,
                mx: 'auto',
                width: 'fit-content'
              }}>
                <FlagIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {stats.currentFlag ? getFlagStatusText(stats.currentFlag.flag_status) : 'No Flag Set'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Current Safety Status
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/admin/safety')}
                sx={{ mt: 1 }}
              >
                Manage Safety
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Weather Widget */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'info.light',
                  color: 'info.dark'
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
              <WeatherWidget centerId={center.id} centerName={center.name} />
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
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
                        Lifeguard Management
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage your team
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
                        Manage schedules
                      </Typography>
                    </Box>
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<FlagIcon />}
                    onClick={() => navigate('/admin/safety')}
                    sx={{ 
                      py: 3, 
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Safety Management
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Set safety flags & zones
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
                        Incident Reports
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View & manage reports
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Weather Alerts */}
        <Grid item xs={12}>
          <Card elevation={1}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'warning.light',
                  color: 'warning.dark'
                }}>
                  <WarningIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Weather Alerts & Forecasts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor weather conditions and alerts
                  </Typography>
                </Box>
              </Box>
              <WeatherAlerts centerId={center.id} centerName={center.name} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CenterDashboard; 