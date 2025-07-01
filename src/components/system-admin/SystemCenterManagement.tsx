import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Pagination,
  Switch,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Center, User } from '../../types';

// Map components
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiNFNjE5M0YiLz4KPHBhdGggZD0iTTEyIDEzQzEzLjY1NiA5IDEzLjY1NiA5IDEyIDlDMTMuNjU2IDkgMTMuNjU2IDkgMTIgMTNaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map click handler component
interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationSelect, selectedLocation }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return selectedLocation ? (
    <Marker 
      position={[selectedLocation.lat, selectedLocation.lng]} 
      icon={customIcon}
    />
  ) : null;
};

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
      id={`center-management-tabpanel-${index}`}
      aria-labelledby={`center-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemCenterManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [centerDialogOpen, setCenterDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [centerPage, setCenterPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [userFilters, setUserFilters] = useState({
    role: '',
    center_id: '',
    search: ''
  });

  const queryClient = useQueryClient();

  // Center form state
  const [centerForm, setCenterForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    operating_hours: '',
    location: { lat: 0, lng: 0 }
  });

  // User form state
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'center_admin' as 'system_admin' | 'center_admin' | 'lifeguard',
    first_name: '',
    last_name: '',
    phone: '',
    center_id: '',
    is_active: true
  });

  // Queries
  const { data: centersData, isLoading: centersLoading, error: centersError } = useQuery({
    queryKey: ['centers'],
    queryFn: () => api.getCenters()
  });

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', userPage, userFilters],
    queryFn: () => api.getAllUsers(userPage, 30, userFilters)
  });

  // Mutations
  const createCenterMutation = useMutation({
    mutationFn: (data: any) => api.createCenter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] });
      setCenterDialogOpen(false);
      resetCenterForm();
    }
  });

  const updateCenterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCenter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] });
      setCenterDialogOpen(false);
      resetCenterForm();
    }
  });

  const deleteCenterMutation = useMutation({
    mutationFn: (id: string) => api.deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserDialogOpen(false);
      resetUserForm();
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserDialogOpen(false);
      resetUserForm();
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => api.resetUserPassword(id, password),
    onSuccess: () => {
      alert('Password reset successfully');
    }
  });

  const resetCenterForm = () => {
    setCenterForm({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      operating_hours: '',
      location: { lat: 0, lng: 0 }
    });
    setSelectedCenter(null);
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      password: '',
      role: 'center_admin',
      first_name: '',
      last_name: '',
      phone: '',
      center_id: '',
      is_active: true
    });
    setSelectedUser(null);
  };

  const handleCenterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCenter) {
      updateCenterMutation.mutate({ id: selectedCenter.id, data: centerForm });
    } else {
      createCenterMutation.mutate(centerForm);
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      const { password, ...updateData } = userForm;
      updateUserMutation.mutate({ id: selectedUser.id, data: updateData });
    } else {
      createUserMutation.mutate(userForm);
    }
  };

  const handleEditCenter = (center: Center) => {
    setSelectedCenter(center);
    const location = center.location.coordinates ? 
      { lng: center.location.coordinates[0], lat: center.location.coordinates[1] } : 
      { lat: 0, lng: 0 };
    
    setCenterForm({
      name: center.name,
      description: center.description || '',
      address: center.address || '',
      phone: center.phone || '',
      email: center.email || '',
      operating_hours: center.operating_hours ? JSON.stringify(center.operating_hours) : '',
      location
    });
    
    // Update map center to the center's location
    if (location.lat !== 0 && location.lng !== 0) {
      setMapCenter([location.lat, location.lng]);
    }
    
    setCenterDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      email: user.email,
      password: '',
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      center_id: user.center_id || '',
      is_active: user.is_active
    });
    setUserDialogOpen(true);
  };

  const handleResetPassword = (userId: string) => {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (newPassword && newPassword.length >= 6) {
      resetPasswordMutation.mutate({ id: userId, password: newPassword });
    } else if (newPassword) {
      alert('Password must be at least 6 characters long');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin': return 'error';
      case 'center_admin': return 'primary';
      case 'lifeguard': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const [deleteCenterId, setDeleteCenterId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([36.8065, 10.1815]); // Default to Tunisia

  const handleLocationSelect = (lat: number, lng: number) => {
    setCenterForm({
      ...centerForm,
      location: { lat, lng }
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenterForm({
            ...centerForm,
            location: { lat: latitude, lng: longitude }
          });
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System Center Management
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab 
                icon={<BusinessIcon />} 
                label="Centers" 
                iconPosition="start"
              />
              <Tab 
                icon={<PersonIcon />} 
                label="Users" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Centers Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Manage Centers</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetCenterForm();
                  setCenterDialogOpen(true);
                }}
              >
                Add Center
              </Button>
            </Box>

            {centersError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading centers: {centersError.message}
              </Alert>
            )}

            {centersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {centersData?.map((center) => (
                      <TableRow key={center.id}>
                        <TableCell>{center.name}</TableCell>
                        <TableCell>{center.address || 'N/A'}</TableCell>
                        <TableCell>{center.phone || 'N/A'}</TableCell>
                        <TableCell>{center.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={center.is_active ? 'Active' : 'Inactive'}
                            color={getStatusColor(center.is_active)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit Center">
                            <IconButton onClick={() => handleEditCenter(center)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Center">
                            <IconButton 
                              onClick={() => setDeleteCenterId(center.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {/* Center Delete Confirmation Dialog */}
            <Dialog open={!!deleteCenterId} onClose={() => setDeleteCenterId(null)}>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogContent>
                <Typography>Are you sure you want to delete this center?</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteCenterId(null)}>Cancel</Button>
                <Button 
                  onClick={() => {
                    if (deleteCenterId) deleteCenterMutation.mutate(deleteCenterId);
                    setDeleteCenterId(null);
                  }}
                  color="error"
                  variant="contained"
                >
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          </TabPanel>

          {/* Users Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Manage Users</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetUserForm();
                  setUserDialogOpen(true);
                }}
              >
                Add User
              </Button>
            </Box>

            {/* Filters */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Filters</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={userFilters.role}
                        onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                        label="Role"
                      >
                        <MenuItem value="">All Roles</MenuItem>
                        <MenuItem value="system_admin">System Admin</MenuItem>
                        <MenuItem value="center_admin">Center Admin</MenuItem>
                        <MenuItem value="lifeguard">Lifeguard</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Center</InputLabel>
                      <Select
                        value={userFilters.center_id}
                        onChange={(e) => setUserFilters({ ...userFilters, center_id: e.target.value })}
                        label="Center"
                      >
                        <MenuItem value="">All Centers</MenuItem>
                        {centersData?.map((center) => (
                          <MenuItem key={center.id} value={center.id}>
                            {center.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search"
                      value={userFilters.search}
                      onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                      placeholder="Search by name or email"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {usersError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading users: {usersError.message}
              </Alert>
            )}

            {usersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Center</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usersData?.data?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role.replace('_', ' ')}
                              color={getRoleColor(user.role)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{user.center_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.is_active ? 'Active' : 'Inactive'}
                              color={getStatusColor(user.is_active)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Edit User">
                              <IconButton onClick={() => handleEditUser(user)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reset Password">
                              <IconButton onClick={() => handleResetPassword(user.id)}>
                                <SecurityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton 
                                onClick={() => setDeleteUserId(user.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {usersData?.pagination && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={usersData.pagination.pages}
                      page={userPage}
                      onChange={(_, page) => setUserPage(page)}
                      color="primary"
                    />
                  </Box>
                )}
                {/* User Delete Confirmation Dialog */}
                <Dialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)}>
                  <DialogTitle>Confirm Delete</DialogTitle>
                  <DialogContent>
                    <Typography>Are you sure you want to delete this user?</Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setDeleteUserId(null)}>Cancel</Button>
                    <Button 
                      onClick={() => {
                        if (deleteUserId) deleteUserMutation.mutate(deleteUserId);
                        setDeleteUserId(null);
                      }}
                      color="error"
                      variant="contained"
                    >
                      Delete
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Center Dialog */}
      <Dialog open={centerDialogOpen} onClose={() => setCenterDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedCenter ? 'Edit Center' : 'Add New Center'}</DialogTitle>
        <form onSubmit={handleCenterSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Center Name"
                  value={centerForm.name}
                  onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={centerForm.phone}
                  onChange={(e) => setCenterForm({ ...centerForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={centerForm.description}
                  onChange={(e) => setCenterForm({ ...centerForm, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={centerForm.address}
                  onChange={(e) => setCenterForm({ ...centerForm, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={centerForm.email}
                  onChange={(e) => setCenterForm({ ...centerForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Operating Hours"
                  value={centerForm.operating_hours}
                  onChange={(e) => setCenterForm({ ...centerForm, operating_hours: e.target.value })}
                  placeholder="e.g., Mon-Fri: 8AM-6PM, Sat-Sun: 9AM-5PM"
                />
              </Grid>
              
              {/* Map Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Location
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<MyLocationIcon />}
                    onClick={handleUseCurrentLocation}
                    sx={{ mr: 2 }}
                  >
                    Use Current Location
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    Click on the map to set the center location, or use your current location
                  </Typography>
                </Box>
                
                <Box sx={{ height: 400, width: '100%', mb: 2 }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={centerForm.location.lat !== 0 ? centerForm.location : null}
                    />
                  </MapContainer>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={centerForm.location.lat}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value) || 0;
                    setCenterForm({ 
                      ...centerForm, 
                      location: { ...centerForm.location, lat }
                    });
                    if (lat !== 0) {
                      setMapCenter([lat, centerForm.location.lng]);
                    }
                  }}
                  required
                  inputProps={{ step: "any" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={centerForm.location.lng}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value) || 0;
                    setCenterForm({ 
                      ...centerForm, 
                      location: { ...centerForm.location, lng }
                    });
                    if (lng !== 0) {
                      setMapCenter([centerForm.location.lat, lng]);
                    }
                  }}
                  required
                  inputProps={{ step: "any" }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCenterDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createCenterMutation.isPending || updateCenterMutation.isPending}
            >
              {createCenterMutation.isPending || updateCenterMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                selectedCenter ? 'Update' : 'Create'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <form onSubmit={handleUserSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    label="Role"
                  >
                    <MenuItem value="system_admin">System Admin</MenuItem>
                    <MenuItem value="center_admin">Center Admin</MenuItem>
                    <MenuItem value="lifeguard">Lifeguard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Center</InputLabel>
                  <Select
                    value={userForm.center_id}
                    onChange={(e) => setUserForm({ ...userForm, center_id: e.target.value })}
                    label="Center"
                  >
                    <MenuItem value="">No Center</MenuItem>
                    {centersData?.map((center) => (
                      <MenuItem key={center.id} value={center.id}>
                        {center.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {!selectedUser && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userForm.is_active}
                      onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {createUserMutation.isPending || updateUserMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                selectedUser ? 'Update' : 'Create'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SystemCenterManagement; 