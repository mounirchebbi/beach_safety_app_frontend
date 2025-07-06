import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Warning as EmergencyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Assignment as AssignIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { EmergencyAlert } from '../../types';
import BeachMap from '../map/BeachMap';

const EmergencyAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await apiService.getAlerts();
      setAlerts(alertsData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedAlert || !newStatus) return;

    try {
      await apiService.updateAlertStatus(selectedAlert.id, newStatus);
      await fetchAlerts(); // Refresh the list
      setStatusDialogOpen(false);
      setSelectedAlert(null);
      setNewStatus('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update alert status');
    }
  };

  const handleAlertClick = (alert: EmergencyAlert) => {
    setSelectedAlert(alert);
    setMapDialogOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'responding': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'sos': return <EmergencyIcon />;
      case 'medical': return <ErrorIcon />;
      case 'drowning': return <WarningIcon />;
      case 'weather': return <InfoIcon />;
      default: return <EmergencyIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmergencyIcon color="error" />
          Emergency Alerts
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAlerts}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {alerts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Active Alerts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All emergency alerts have been resolved.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {alerts.map((alert) => (
            <Grid item xs={12} md={6} lg={4} key={alert.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  },
                  border: alert.status === 'active' ? '2px solid' : '1px solid',
                  borderColor: alert.status === 'active' ? 'error.main' : 'divider'
                }}
                onClick={() => handleAlertClick(alert)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getAlertTypeIcon(alert.alert_type)}
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {alert.alert_type}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Chip
                        label={alert.severity}
                        color={getSeverityColor(alert.severity) as any}
                        size="small"
                      />
                      <Chip
                        label={alert.status}
                        color={getStatusColor(alert.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TimeIcon fontSize="small" />
                      {formatTimeAgo(alert.created_at)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      {alert.reported_by || 'Anonymous'}
                    </Typography>
                  </Box>

                  {alert.description && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {alert.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MapIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAlertClick(alert);
                      }}
                    >
                      View on Map
                    </Button>
                    {alert.status === 'active' && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<AssignIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(alert);
                          setNewStatus('responding');
                          setStatusDialogOpen(true);
                        }}
                      >
                        Respond
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Map Dialog */}
      <Dialog 
        open={mapDialogOpen} 
        onClose={() => setMapDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Alert Location
            </Typography>
            <IconButton onClick={() => setMapDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedAlert && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Alert Details Panel */}
              <Paper sx={{ p: 2, mb: 2, mx: 2, mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getAlertTypeIcon(selectedAlert.alert_type)}
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {selectedAlert.alert_type} Alert
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip
                        label={selectedAlert.severity}
                        color={getSeverityColor(selectedAlert.severity) as any}
                        size="small"
                      />
                      <Chip
                        label={selectedAlert.status}
                        color={getStatusColor(selectedAlert.status) as any}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <TimeIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Launched"
                          secondary={formatDate(selectedAlert.created_at)}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Reported By"
                          secondary={selectedAlert.reported_by || 'Anonymous'}
                        />
                      </ListItem>
                      {selectedAlert.description && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <DescriptionIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Description"
                            secondary={selectedAlert.description}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                </Grid>
              </Paper>

              {/* Map */}
              <Box sx={{ flex: 1, p: 2 }}>
                {selectedAlert.location?.coordinates ? (
                  <BeachMap
                    alerts={[{
                      id: selectedAlert.id,
                      center_id: selectedAlert.center_id,
                      type: selectedAlert.alert_type as any,
                      location: {
                        lat: selectedAlert.location.coordinates[1],
                        lng: selectedAlert.location.coordinates[0]
                      },
                      description: selectedAlert.description || '',
                      status: selectedAlert.status as any,
                      created_at: selectedAlert.created_at
                    }]}
                    center={[
                      selectedAlert.location.coordinates[1],
                      selectedAlert.location.coordinates[0]
                    ]}
                    zoom={16}
                    showAlerts={true}
                    showUserLocation={false}
                    showSafetyZones={false}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '300px',
                      bgcolor: 'grey.100',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No location data available for this alert
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Alert Status
          <IconButton
            onClick={() => setStatusDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Alert Details
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Type:</strong> {selectedAlert.alert_type}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Severity:</strong> {selectedAlert.severity}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Current Status:</strong> {selectedAlert.status}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Description:</strong> {selectedAlert.description || 'No description'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Reported:</strong> {formatDate(selectedAlert.created_at)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    label="New Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="responding">Responding</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyAlerts; 