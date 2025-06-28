import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import WeatherWidget from '../weather/WeatherWidget';
import WeatherAlerts from '../weather/WeatherAlerts';
import apiService from '../../services/api';
import { Center } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CenterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchCenterData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (user?.center_info?.id) {
          const centerData = await apiService.getCenterById(user.center_info.id);
          setCenter(centerData);
        } else {
          setError('No center information available');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch center data');
      } finally {
        setLoading(false);
      }
    };

    fetchCenterData();
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1">{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!center) {
    return (
      <Box>
        <Alert severity="info">
          <Typography variant="body1">No center information available</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {center.name} - Center Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back! Monitor your center's operations, weather conditions, and safety protocols.
      </Typography>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Weather" />
          <Tab label="Alerts" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Center Information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Name:</strong> {center.name}
                </Typography>
                {center.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Description:</strong> {center.description}
                  </Typography>
                )}
                {center.address && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Address:</strong> {center.address}
                  </Typography>
                )}
                {center.phone && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Phone:</strong> {center.phone}
                  </Typography>
                )}
                {center.email && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Email:</strong> {center.email}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <WeatherWidget centerId={center.id} centerName={center.name} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <WeatherWidget centerId={center.id} centerName={center.name} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <WeatherAlerts centerId={center.id} centerName={center.name} />
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default CenterDashboard; 