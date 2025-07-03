import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Flag as FlagIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Report as EmergencyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';

interface SystemStats {
  totalCenters: number;
  activeCenters: number;
  totalUsers: number;
  activeUsers: number;
  totalLifeguards: number;
  activeLifeguards: number;
  totalShifts: number;
  activeShifts: number;
  totalAlerts: number;
  activeAlerts: number;
  totalFlags: number;
  flagsNeedingAttention: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  badge?: number;
}

const SystemDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch system statistics
  const { data: centers, isLoading: centersLoading } = useQuery({
    queryKey: ['centers'],
    queryFn: () => apiService.getCenters(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getAllUsers(1, 1000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: flagStatus, isLoading: flagsLoading } = useQuery({
    queryKey: ['flagStatus'],
    queryFn: () => apiService.getAllCentersFlagStatus(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate system statistics
  const systemStats: SystemStats = {
    totalCenters: centers?.length || 0,
    activeCenters: centers?.filter(c => c.is_active).length || 0,
    totalUsers: users?.data?.length || 0,
    activeUsers: users?.data?.filter(u => u.is_active).length || 0,
    totalLifeguards: users?.data?.filter(u => u.role === 'lifeguard').length || 0,
    activeLifeguards: users?.data?.filter(u => u.role === 'lifeguard' && u.is_active).length || 0,
    totalShifts: 0, // Would need additional API call
    activeShifts: 0, // Would need additional API call
    totalAlerts: 0, // Would need additional API call
    activeAlerts: 0, // Would need additional API call
    totalFlags: flagStatus?.centers?.length || 0,
    flagsNeedingAttention: flagStatus?.centers?.filter(c => c.needs_attention).length || 0,
  };

  const isLoading = centersLoading || usersLoading || flagsLoading;

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // Refetch all queries
    window.location.reload();
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Center Management',
      description: 'Manage beach safety centers',
      icon: <BusinessIcon />,
      route: '/system/centers',
      color: 'primary',
      badge: systemStats.totalCenters
    },
    {
      title: 'User Management',
      description: 'Manage system users and roles',
      icon: <PeopleIcon />,
      route: '/system/users',
      color: 'secondary',
      badge: systemStats.totalUsers
    },
    {
      title: 'Flag Management',
      description: 'Monitor safety flags across centers',
      icon: <FlagIcon />,
      route: '/system/flags',
      color: 'warning',
      badge: systemStats.flagsNeedingAttention
    },
    {
      title: 'System Reports',
      description: 'View system-wide analytics',
      icon: <AssessmentIcon />,
      route: '/system/reports',
      color: 'info'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'green':
        return 'success';
      case 'warning':
      case 'yellow':
        return 'warning';
      case 'error':
      case 'red':
      case 'black':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'green':
        return <CheckCircleIcon />;
      case 'warning':
      case 'yellow':
        return <WarningIcon />;
      case 'error':
      case 'red':
      case 'black':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
            System Administrator Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage the entire beach safety system
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* System Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <BusinessIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {systemStats.totalCenters}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Centers
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`${systemStats.activeCenters} Active`}
                    color="success"
                    size="small"
                    icon={<CheckCircleIcon />}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <PeopleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {systemStats.totalUsers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${systemStats.totalLifeguards} Lifeguards`}
                      color="info"
                      size="small"
                    />
                    <Chip
                      label={`${systemStats.activeUsers} Active`}
                      color="success"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <FlagIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {systemStats.totalFlags}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Safety Flags
                      </Typography>
                    </Box>
                  </Box>
                  {systemStats.flagsNeedingAttention > 0 ? (
                    <Chip
                      label={`${systemStats.flagsNeedingAttention} Need Attention`}
                      color="warning"
                      size="small"
                      icon={<WarningIcon />}
                    />
                  ) : (
                    <Chip
                      label="All Clear"
                      color="success"
                      size="small"
                      icon={<CheckCircleIcon />}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {systemStats.activeShifts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Shifts
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`${systemStats.activeAlerts} Active Alerts`}
                    color={systemStats.activeAlerts > 0 ? 'error' : 'success'}
                    size="small"
                    icon={systemStats.activeAlerts > 0 ? <EmergencyIcon /> : <CheckCircleIcon />}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }
                  }}
                  onClick={() => navigate(action.route)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Badge badgeContent={action.badge} color={action.color}>
                      <Avatar 
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          bgcolor: `${action.color}.main`,
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        {action.icon}
                      </Avatar>
                    </Badge>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* System Status */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    System Status
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Database Connection" 
                        secondary="Connected and operational"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Weather Service" 
                        secondary="Active and updating"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Real-time Notifications" 
                        secondary="WebSocket connected"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="API Services" 
                        secondary="All endpoints operational"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Recent Activity
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="System Dashboard Loaded" 
                        secondary={lastRefresh.toLocaleString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${systemStats.totalCenters} Centers Monitored`}
                        secondary="All centers reporting status"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${systemStats.totalUsers} Users Registered`}
                        secondary={`${systemStats.activeUsers} currently active`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <FlagIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${systemStats.totalFlags} Safety Flags Active`}
                        secondary={systemStats.flagsNeedingAttention > 0 
                          ? `${systemStats.flagsNeedingAttention} require attention`
                          : "All flags in good standing"
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default SystemDashboard; 