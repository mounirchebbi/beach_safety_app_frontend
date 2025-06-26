import React, { useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Chip,
  Typography,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MyLocation,
  Layers,
  FilterList,
  Settings,
  BeachAccess,
  Warning,
  CheckCircle,
  LocationOn,
  Info,
} from '@mui/icons-material';

interface MapControlsProps {
  showUserLocation: boolean;
  showSafetyZones: boolean;
  showAlerts: boolean;
  showCenters: boolean;
  mapView: 'satellite' | 'street' | 'hybrid';
  onToggleUserLocation: () => void;
  onToggleSafetyZones: () => void;
  onToggleAlerts: () => void;
  onToggleCenters: () => void;
  onCenterMap: () => void;
  onViewChange: (view: 'satellite' | 'street' | 'hybrid') => void;
  alertCount?: number;
  centerCount?: number;
  safetyZoneCount?: number;
}

const MapControls: React.FC<MapControlsProps> = ({
  showUserLocation,
  showSafetyZones,
  showAlerts,
  showCenters,
  mapView,
  onToggleUserLocation,
  onToggleSafetyZones,
  onToggleAlerts,
  onToggleCenters,
  onCenterMap,
  onViewChange,
  alertCount = 0,
  centerCount = 0,
  safetyZoneCount = 0,
}) => {
  const [showLegend, setShowLegend] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
      <Paper elevation={3} sx={{ p: 1, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Center map button */}
          <Tooltip title="Center on my location">
            <IconButton
              onClick={onCenterMap}
              sx={{ bgcolor: 'background.paper' }}
              size="small"
            >
              <MyLocation />
            </IconButton>
          </Tooltip>

          {/* Toggle layers button */}
          <Tooltip title="Toggle layers">
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              sx={{ bgcolor: 'background.paper' }}
              size="small"
            >
              <Layers />
            </IconButton>
          </Tooltip>

          {/* Legend button */}
          <Tooltip title="Show legend">
            <IconButton
              onClick={() => setShowLegend(!showLegend)}
              sx={{ bgcolor: 'background.paper' }}
              size="small"
            >
              <Info />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Layer controls */}
        {showFilters && (
          <Paper elevation={2} sx={{ mt: 1, p: 2, minWidth: 200 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Map Layers
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showCenters}
                    onChange={onToggleCenters}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BeachAccess fontSize="small" color="primary" />
                    <Typography variant="body2">
                      Beach Centers ({centerCount})
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showSafetyZones}
                    onChange={onToggleSafetyZones}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle fontSize="small" color="success" />
                    <Typography variant="body2">
                      Safety Zones ({safetyZoneCount})
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showAlerts}
                    onChange={onToggleAlerts}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning fontSize="small" color="error" />
                    <Typography variant="body2">
                      Alerts ({alertCount})
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showUserLocation}
                    onChange={onToggleUserLocation}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="info" />
                    <Typography variant="body2">
                      My Location
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Paper>
        )}
      </Paper>

      {/* Legend Dialog */}
      <Dialog
        open={showLegend}
        onClose={() => setShowLegend(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Map Legend
          </Typography>
        </DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#4caf50',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Beach Centers"
                secondary="Lifeguard stations and safety centers"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#f44336',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Emergency Alerts"
                secondary="Active emergency situations and warnings"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#1976d2',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Your Location"
                secondary="Your current GPS position"
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Safety Zone Colors
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: '#4caf50',
                }}
              />
              <Typography variant="body2">Swimming Zone (Safe)</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: '#2196f3',
                }}
              />
              <Typography variant="body2">Surfing Zone</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: '#f44336',
                }}
              />
              <Typography variant="body2">Restricted Zone</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLegend(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapControls; 