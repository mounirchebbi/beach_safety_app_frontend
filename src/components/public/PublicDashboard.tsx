import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
} from '@mui/material';
import {
  BeachAccess,
  LocationOn,
  Warning,
  WbSunny,
  People,
  Security,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const PublicDashboard: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Hero Section */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <BeachAccess sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Beach Safety Management System
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
          Real-time monitoring and emergency response for beach safety
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            Sign In
          </Button>
          <Button
            component={RouterLink}
            to="/register"
            variant="outlined"
            size="large"
            sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'grey.300' } }}
          >
            Register
          </Button>
        </Box>
      </Paper>

      {/* Features Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <LocationOn sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Real-time Location Tracking
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor lifeguard positions and emergency locations in real-time with GPS tracking
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Warning sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Emergency Alert System
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Instant emergency notifications and rapid response coordination
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <WbSunny sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Weather Monitoring
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Real-time weather data and marine conditions for safety assessment
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Stats Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            System Overview
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 200px', minWidth: 0, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                12
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Centers
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 0, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                45
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Lifeguards
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 0, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Alerts
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 0, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                98%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Response Rate
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Role-based Access */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Access Levels
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Lifeguards
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage shifts, respond to emergencies, and report incidents
                </Typography>
                <Chip label="Shift Management" size="small" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Emergency Response" size="small" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Incident Reports" size="small" />
              </Box>
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ color: 'secondary.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Center Administrators
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage center operations, lifeguards, and safety protocols
                </Typography>
                <Chip label="Center Management" size="small" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Staff Scheduling" size="small" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Safety Protocols" size="small" />
              </Box>
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BeachAccess sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    System Administrators
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  System-wide management, user administration, and analytics
                </Typography>
                <Chip label="System Management" size="small" sx={{ mr: 1, mb: 1 }} />
                <Chip label="User Administration" size="small" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Analytics" size="small" />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PublicDashboard; 