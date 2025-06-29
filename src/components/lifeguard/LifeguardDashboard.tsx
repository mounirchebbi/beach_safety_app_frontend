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
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  BeachAccess as BeachIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WeatherWidget from '../weather/WeatherWidget';
import apiService from '../../services/api';

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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
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
          const alertsData = await apiService.getAlerts();
          const activeAlerts = alertsData.filter((alert: any) => 
            alert.status === 'active' && alert.center_id === user.center_info!.id
          ).length;
          
          setStats(prev => ({
            ...prev,
            activeAlerts
          }));
        } catch (err) {
          console.log('Could not load alerts');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
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

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BeachIcon color="primary" />
          Lifeguard Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back, {user?.first_name}! Monitor your shifts, respond to emergencies, and stay updated with current conditions.
      </Typography>

      <Grid container spacing={3}>
        {/* Current Shift Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="h6">
                  Current Shift
                </Typography>
              </Box>
              
              {currentShift ? (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Center:</strong> {currentShift.center_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Time:</strong> {formatTime(currentShift.start_time)} - {formatTime(currentShift.end_time)}
                  </Typography>
                  <Chip
                    label={currentShift.status}
                    color={getShiftStatusColor(currentShift.status) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No active shift at the moment
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => navigate('/lifeguard/shifts')}
                  >
                    View Shifts
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Alerts Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningIcon color="error" />
                <Typography variant="h6">
                  Emergency Alerts
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" color="error.main" gutterBottom>
                  {stats.activeAlerts}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Emergency Alerts
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<ReportIcon />}
                  onClick={() => navigate('/lifeguard/alerts')}
                  sx={{ mt: 1 }}
                >
                  View Alerts
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<WarningIcon />}
                    onClick={() => navigate('/lifeguard/alerts')}
                    sx={{ py: 2 }}
                  >
                    Emergency Alerts
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ScheduleIcon />}
                    onClick={() => navigate('/lifeguard/shifts')}
                    sx={{ py: 2 }}
                  >
                    My Shifts
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<NotificationsIcon />}
                    onClick={() => navigate('/lifeguard/reports')}
                    sx={{ py: 2 }}
                  >
                    Incident Reports
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<BeachIcon />}
                    onClick={() => navigate('/map')}
                    sx={{ py: 2 }}
                  >
                    Beach Map
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Weather Widget */}
        {user?.center_info?.id && (
          <Grid item xs={12}>
            <WeatherWidget 
              centerId={user.center_info.id} 
              centerName={user.center_info.name || 'Your Center'} 
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default LifeguardDashboard; 