import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../../services/api';
import { SafetyZone } from '../../types';

interface NoSwimZoneManagementProps {
  centerId: string;
}

interface ZoneFormData {
  name: string;
  zone_type: 'no_swim' | 'caution' | 'safe';
  location: { lat: number; lng: number } | null;
  radius: number;
  description: string;
}

const NoSwimZoneManagement: React.FC<NoSwimZoneManagementProps> = ({ centerId }) => {
  const [zones, setZones] = useState<SafetyZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<SafetyZone | null>(null);
  const [formData, setFormData] = useState<ZoneFormData>({
    name: '',
    zone_type: 'no_swim',
    location: null,
    radius: 1000,
    description: ''
  });
  const [mapCenter] = useState<[number, number]>([36.4000, 10.6167]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadZones();
  }, [centerId]);

  const loadZones = async () => {
    try {
      setLoading(true);
      const zonesData = await apiService.getSafetyZonesByCenter(centerId);
      setZones(zonesData);
      setError(null);
    } catch (err) {
      setError('Failed to load safety zones');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (zone?: SafetyZone) => {
    if (zone) {
      setEditingZone(zone);
      const coordinates = zone.geometry.coordinates[0];
      const centerLat = coordinates.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coordinates.length;
      const centerLng = coordinates.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coordinates.length;
      
      setFormData({
        name: zone.name,
        zone_type: zone.zone_type,
        location: { lat: centerLat, lng: centerLng },
        radius: 1000,
        description: zone.description || ''
      });
      setSelectedLocation({ lat: centerLat, lng: centerLng });
    } else {
      setEditingZone(null);
      setFormData({
        name: '',
        zone_type: 'no_swim',
        location: null,
        radius: 1000,
        description: ''
      });
      setSelectedLocation(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingZone(null);
    setFormData({
      name: '',
      zone_type: 'no_swim',
      location: null,
      radius: 1000,
      description: ''
    });
    setSelectedLocation(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location) {
      setError('Please fill in all required fields and select a location on the map');
      return;
    }

    try {
      // Convert location and radius to GeoJSON geometry (circle)
      const createCircleGeometry = (center: { lat: number; lng: number }, radiusInMeters: number): GeoJSON.Polygon => {
        // Convert radius from meters to degrees (approximate)
        const latRad = center.lat * Math.PI / 180;
        const metersPerDegreeLat = 111320;
        const metersPerDegreeLng = 111320 * Math.cos(latRad);
        const radiusInDegreesLat = radiusInMeters / metersPerDegreeLat;
        const radiusInDegreesLng = radiusInMeters / metersPerDegreeLng;

        // Create a circle approximation using 32 points
        const points: [number, number][] = [];
        for (let i = 0; i < 32; i++) {
          const angle = (i * 2 * Math.PI) / 32;
          const lat = center.lat + radiusInDegreesLat * Math.cos(angle);
          const lng = center.lng + radiusInDegreesLng * Math.sin(angle);
          points.push([lng, lat]); // GeoJSON uses [lng, lat] order
        }
        // Close the polygon
        points.push(points[0]);

        return {
          type: 'Polygon' as const,
          coordinates: [points]
        };
      };

      const geometry = createCircleGeometry(formData.location, formData.radius);

      if (editingZone) {
        const updateData = {
          name: formData.name,
          zone_type: formData.zone_type,
          geometry: geometry,
          description: formData.description
        };
        await apiService.updateSafetyZone(editingZone.id, updateData);
      } else {
        const createData = {
          name: formData.name,
          zone_type: formData.zone_type,
          geometry: geometry,
          description: formData.description
        };
        await apiService.createSafetyZone(centerId, createData);
      }
      
      handleCloseDialog();
      loadZones();
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.details?.overlappingZones) {
        const overlappingZones = err.response.data.details.overlappingZones;
        const zoneNames = overlappingZones.map((zone: any) => `${zone.name} (${zone.zone_type})`).join(', ');
        setError(`Safety zone overlaps with existing zones: ${zoneNames}. Please adjust the location or radius to avoid overlap.`);
      } else {
        setError(err.response?.data?.error || 'Failed to save safety zone');
      }
    }
  };

  const handleDelete = async (zoneId: string) => {
    if (!window.confirm('Are you sure you want to delete this safety zone?')) {
      return;
    }

    try {
      await apiService.deleteSafetyZone(zoneId);
      loadZones();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete safety zone');
    }
  };

  const getZoneTypeColor = (type: string) => {
    switch (type) {
      case 'no_swim': return 'error';
      case 'caution': return 'warning';
      case 'safe': return 'success';
      default: return 'default';
    }
  };

  const getZoneTypeIcon = (type: string) => {
    switch (type) {
      case 'no_swim': return <CancelIcon />;
      case 'caution': return <WarningIcon />;
      case 'safe': return <CheckCircleIcon />;
      default: return <CancelIcon />;
    }
  };

  const getZoneTypeLabel = (type: string) => {
    switch (type) {
      case 'no_swim': return 'No Swim Zone';
      case 'caution': return 'Caution Zone';
      case 'safe': return 'Safe Zone';
      default: return type;
    }
  };

  // Helper function to calculate radius from polygon geometry
  const calculateRadiusFromGeometry = (geometry: GeoJSON.Polygon) => {
    const coordinates = geometry.coordinates[0];
    const centerLat = coordinates.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coordinates.length;
    const centerLng = coordinates.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coordinates.length;
    
    // Calculate radius by finding the maximum distance from center to any point in the polygon
    let maxDistance = 0;
    coordinates.forEach((coord: number[]) => {
      const distance = Math.sqrt(
        Math.pow(coord[0] - centerLng, 2) + Math.pow(coord[1] - centerLat, 2)
      );
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    });
    
    // Convert from degrees to meters (approximate)
    const latRad = centerLat * Math.PI / 180;
    const metersPerDegreeLng = 111320 * Math.cos(latRad);
    const radiusInMeters = maxDistance * Math.max(111320, metersPerDegreeLng);
    
    return Math.round(radiusInMeters);
  };

  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
        setFormData(prev => ({ ...prev, location: { lat, lng } }));
      },
    });
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            No-Swim Zone Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage safety zones for your beach center
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ px: 3 }}
        >
          Create Zone
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Safety Zones ({zones.length})
          </Typography>
          
          {zones.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No safety zones created yet. Click "Create Zone" to add your first zone.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Radius</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell>
                        <Typography fontWeight="medium">{zone.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getZoneTypeIcon(zone.zone_type)}
                          label={getZoneTypeLabel(zone.zone_type)}
                          color={getZoneTypeColor(zone.zone_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography>
                          {calculateRadiusFromGeometry(zone.geometry)}m
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {zone.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(zone.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(zone)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(zone.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingZone ? 'Edit Safety Zone' : 'Create New Safety Zone'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Zone Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Zone Type</InputLabel>
                <Select
                  value={formData.zone_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, zone_type: e.target.value as any }))}
                  label="Zone Type"
                >
                  <MenuItem value="no_swim">No Swim Zone</MenuItem>
                  <MenuItem value="caution">Caution Zone</MenuItem>
                  <MenuItem value="safe">Safe Zone</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Radius (meters)"
                type="number"
                value={formData.radius}
                onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 1, max: 100000 }}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Click on the map to select zone location
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Existing zones are shown with dashed borders. Overlapping zones will be prevented.
              </Typography>
              <Box sx={{ height: 400, border: '1px solid #ddd', borderRadius: 1 }}>
                <MapContainer
                  center={mapCenter}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapClickHandler />
                  
                  {selectedLocation && (
                    <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                  )}
                  
                  {selectedLocation && formData.radius > 0 && (
                    <Circle
                      center={[selectedLocation.lat, selectedLocation.lng]}
                      radius={formData.radius}
                      pathOptions={{
                        color: formData.zone_type === 'no_swim' ? '#f44336' : 
                               formData.zone_type === 'caution' ? '#ff9800' : '#4caf50',
                        fillColor: formData.zone_type === 'no_swim' ? '#f44336' : 
                                   formData.zone_type === 'caution' ? '#ff9800' : '#4caf50',
                        fillOpacity: 0.2,
                        weight: 2,
                      }}
                    />
                  )}

                  {/* Display existing zones for reference */}
                  {zones.map((zone) => {
                    const coordinates = zone.geometry.coordinates[0];
                    const centerLat = coordinates.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coordinates.length;
                    const centerLng = coordinates.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coordinates.length;
                    const radius = calculateRadiusFromGeometry(zone.geometry);
                    
                    return (
                      <Circle
                        key={zone.id}
                        center={[centerLat, centerLng]}
                        radius={radius}
                        pathOptions={{
                          color: zone.zone_type === 'no_swim' ? '#f44336' : 
                                 zone.zone_type === 'caution' ? '#ff9800' : '#4caf50',
                          fillColor: zone.zone_type === 'no_swim' ? '#f44336' : 
                                     zone.zone_type === 'caution' ? '#ff9800' : '#4caf50',
                          fillOpacity: 0.1,
                          weight: 1,
                          dashArray: '5,5'
                        }}
                      />
                    );
                  })}
                </MapContainer>
              </Box>
              
              {selectedLocation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.location}
          >
            {editingZone ? 'Update Zone' : 'Create Zone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NoSwimZoneManagement; 