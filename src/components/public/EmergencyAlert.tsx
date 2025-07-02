import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Warning as EmergencyIcon,
  LocationOn as LocationIcon,
  MyLocation as GpsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { Center } from '../../types';

interface EmergencyAlertData {
  location: { lat: number; lng: number } | null;
  description: string;
  alert_type: 'sos' | 'medical' | 'drowning' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  center_id?: string;
}

const EmergencyAlert: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [alertSent, setAlertSent] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState<EmergencyAlertData>({
    location: null,
    description: 'SOS',
    alert_type: 'sos',
    severity: 'critical'
  });

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const centersData = await apiService.getPublicCenters();
      setCenters(centersData);
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          location: { lat: latitude, lng: longitude }
        }));
        setLocating(false);
        
        // Auto-select nearest center
        selectNearestCenter(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setLocationError(errorMessage);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const selectNearestCenter = (lat: number, lng: number) => {
    if (centers.length === 0) return;

    // Simple distance calculation (in production, use proper geospatial queries)
    let nearestCenter = centers[0];
    let minDistance = Infinity;

    centers.forEach(center => {
      const distance = Math.sqrt(
        Math.pow(center.location.coordinates[1] - lat, 2) +
        Math.pow(center.location.coordinates[0] - lng, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestCenter = center;
      }
    });

    setSelectedCenter(nearestCenter.id);
  };

  const handleSubmit = async () => {
    if (!formData.location) {
      setSnackbarMessage('Please get your location first');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!formData.description.trim()) {
      setSnackbarMessage('Please provide a description of the emergency');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);

    try {
      const alertData = {
        location: formData.location,
        description: formData.description,
        alert_type: formData.alert_type,
        severity: formData.severity,
        center_id: selectedCenter || undefined // Let backend find nearest if not specified
      };

      await apiService.createSOSAlert(alertData);
      
      setAlertSent(true);
      setSnackbarMessage('Emergency alert sent successfully! Help is on the way.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error sending emergency alert:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to send emergency alert');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setAlertSent(false);
    setFormData({
      location: null,
      description: 'SOS',
      alert_type: 'sos',
      severity: 'critical'
    });
    setSelectedCenter('');
    setLocationError(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      {/* Emergency Alert Button */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Tooltip title="Send Emergency Alert">
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<EmergencyIcon />}
            onClick={() => setOpen(true)}
            sx={{
              borderRadius: '50px',
              px: 3,
              py: 1.5,
              boxShadow: 3,
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 6
              }
            }}
          >
            EMERGENCY
          </Button>
        </Tooltip>
      </Box>

      {/* Emergency Alert Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '2px solid #f44336'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f44336', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <EmergencyIcon />
          Emergency Alert
          <IconButton
            onClick={handleClose}
            sx={{ color: 'white', ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {alertSent ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Emergency Alert Sent!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Help is on the way. Please stay calm and follow any instructions from emergency responders.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Location Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Your Location
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={locating ? <CircularProgress size={20} /> : <GpsIcon />}
                    onClick={getCurrentLocation}
                    disabled={locating}
                  >
                    {locating ? 'Getting Location...' : 'Get My Location'}
                  </Button>
                  
                  {formData.location && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`${formData.location.lat.toFixed(6)}, ${formData.location.lng.toFixed(6)}`}
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>

                {locationError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {locationError}
                  </Alert>
                )}
              </Grid>

              {/* Center Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Beach Center (Optional)</InputLabel>
                  <Select
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    label="Select Beach Center (Optional)"
                  >
                    <MenuItem value="">
                      <em>Auto-select nearest center</em>
                    </MenuItem>
                    {centers.map((center) => (
                      <MenuItem key={center.id} value={center.id}>
                        {center.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  If not selected, the nearest center will be automatically chosen
                </Typography>
              </Grid>

              {/* Alert Type */}
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Emergency Type</InputLabel>
                  <Select
                    value={formData.alert_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, alert_type: e.target.value as any }))}
                    label="Emergency Type"
                  >
                    <MenuItem value="sos">SOS - General Emergency</MenuItem>
                    <MenuItem value="medical">Medical Emergency</MenuItem>
                    <MenuItem value="drowning">Drowning</MenuItem>
                    <MenuItem value="weather">Weather Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Severity */}
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                    label="Severity"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Emergency Description"
                  placeholder="Please describe the emergency situation in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </Grid>

              {/* Warning */}
              <Grid item xs={12}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="body2">
                    <strong>Important:</strong> Only use this for genuine emergencies. 
                    False alarms can delay response to real emergencies.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        {!alertSent && (
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleClose} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="error"
              disabled={loading || !formData.location}
              startIcon={loading ? <CircularProgress size={20} /> : <EmergencyIcon />}
            >
              {loading ? 'Sending Alert...' : 'Send Emergency Alert'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EmergencyAlert; 