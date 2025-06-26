import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import {
  BeachAccess,
  Warning,
  CheckCircle,
  LocationOn,
  Map,
  Security,
  Visibility,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const PublicDashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <BeachAccess sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Beach Safety Network
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Real-time beach safety monitoring and emergency response
        </Typography>
        
        {/* Interactive Map Button */}
        <Button
          component={RouterLink}
          to="/map"
          variant="contained"
          size="large"
          startIcon={<Map />}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            },
          }}
        >
          View Interactive Map
        </Button>
      </Box>

      {/* Status Overview */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="success.main">
              12
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Lifeguard Stations
            </Typography>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Security sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              8
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Safety Zones Monitored
            </Typography>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              2
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Alerts
            </Typography>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Visibility sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="info.main">
              10km
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Visibility
            </Typography>
          </Card>
        </Box>
      </Box>

      {/* Current Alerts */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Current Alerts
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert
              severity="error"
              icon={<Warning />}
              action={
                <Button
                  component={RouterLink}
                  to="/map"
                  color="inherit"
                  size="small"
                >
                  View on Map
                </Button>
              }
            >
              <Typography variant="body1" fontWeight="bold">
                SOS Alert - South Beach
              </Typography>
              <Typography variant="body2">
                Swimmer in distress reported. Lifeguards responding.
              </Typography>
            </Alert>
            
            <Alert
              severity="warning"
              icon={<Warning />}
              action={
                <Button
                  component={RouterLink}
                  to="/map"
                  color="inherit"
                  size="small"
                >
                  View on Map
                </Button>
              }
            >
              <Typography variant="body1" fontWeight="bold">
                Weather Warning - North Beach
              </Typography>
              <Typography variant="body2">
                Strong currents detected. Swimming not recommended.
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Map sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h6" fontWeight="bold">
                  Interactive Safety Map
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                View real-time beach conditions, lifeguard locations, safety zones, and active alerts on our interactive map.
              </Typography>
              <Button
                component={RouterLink}
                to="/map"
                variant="outlined"
                startIcon={<Map />}
              >
                Explore Map
              </Button>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                <Typography variant="h6" fontWeight="bold">
                  Safety Zones
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Designated swimming areas, surfing zones, and restricted areas are clearly marked for your safety.
              </Typography>
              <Chip
                icon={<CheckCircle />}
                label="8 Zones Active"
                color="success"
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                <Typography variant="h6" fontWeight="bold">
                  Real-time Monitoring
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Continuous monitoring of weather conditions, water quality, and emergency situations across all beach areas.
              </Typography>
              <Chip
                icon={<Visibility />}
                label="24/7 Active"
                color="info"
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BeachAccess sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                <Typography variant="h6" fontWeight="bold">
                  Emergency Response
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Rapid emergency response system with trained lifeguards and emergency services ready to respond.
              </Typography>
              <Chip
                icon={<Warning />}
                label="2 Active Alerts"
                color="warning"
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', mt: 4, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Stay Safe at the Beach
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Use our interactive map to check current conditions and stay informed about safety alerts.
        </Typography>
        <Button
          component={RouterLink}
          to="/map"
          variant="contained"
          size="large"
          startIcon={<Map />}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
          }}
        >
          View Interactive Map
        </Button>
      </Box>
    </Box>
  );
};

export default PublicDashboard; 