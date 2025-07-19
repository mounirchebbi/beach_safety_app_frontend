import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { Center, CenterFormData, OperatingHours } from '../../types';

interface CenterInformationFormProps {
  onSuccess?: (center: Center) => void;
  onCancel?: () => void;
}

const CenterInformationForm: React.FC<CenterInformationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CenterFormData>>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    location: { lat: 0, lng: 0 }
  });

  const loadCenterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.center_info?.id) {
        const centerData = await apiService.getCenterById(user.center_info.id);
        setCenter(centerData);

        // Set form data
        const location = centerData.location.coordinates ? 
          { lng: centerData.location.coordinates[0], lat: centerData.location.coordinates[1] } : 
          { lat: 0, lng: 0 };

        setFormData({
          name: centerData.name,
          description: centerData.description || '',
          address: centerData.address || '',
          phone: centerData.phone || '',
          email: centerData.email || '',
          location
        });
      } else {
        setError('No center information available');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch center data');
    } finally {
      setLoading(false);
    }
  }, [user?.center_info?.id]);

  useEffect(() => {
    loadCenterData();
  }, [loadCenterData]);

  const handleInputChange = (field: keyof CenterFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!user?.center_info?.id) {
        throw new Error('No center ID available');
      }

      // Prepare the data for update
      const updateData: Partial<CenterFormData> = {
        ...formData
      };

      const updatedCenter = await apiService.updateCenter(user.center_info.id, updateData);
      setCenter(updatedCenter);
      setSuccess('Center information updated successfully');
      setIsEditing(false);

      if (onSuccess) {
        onSuccess(updatedCenter);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update center information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    
    // Reset form data to original values
    if (center) {
      const location = center.location.coordinates ? 
        { lng: center.location.coordinates[0], lat: center.location.coordinates[1] } : 
        { lat: 0, lng: 0 };

      setFormData({
        name: center.name,
        description: center.description || '',
        address: center.address || '',
        phone: center.phone || '',
        email: center.email || '',
        location
      });
    }

    if (onCancel) {
      onCancel();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !center) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'primary.dark'
            }}>
              <BusinessIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Center Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEditing ? 'Edit center details' : 'View and manage center information'}
              </Typography>
            </Box>
          </Box>
          
          {!isEditing && (
            <Tooltip title="Edit Center Information">
              <IconButton 
                onClick={handleEdit}
                color="primary"
                sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              Basic Information
            </Typography>
            
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Center Name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                required
              />
              
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!isEditing}
                multiline
                rows={3}
                helperText="Brief description of the center"
              />
            </Stack>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              Contact Information
            </Typography>
            
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
                }}
              />
              
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />
                }}
              />
              
              <TextField
                fullWidth
                label="Email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                type="email"
                InputProps={{
                  startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Stack>
          </Grid>


        </Grid>

        {/* Action Buttons */}
        {isEditing && (
          <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CenterInformationForm; 