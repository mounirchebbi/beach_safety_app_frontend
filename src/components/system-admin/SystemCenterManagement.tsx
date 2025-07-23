import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  Pagination,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
  DeleteForever as HardDeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { Center } from '../../types';

interface CenterManagementState {
  centers: Center[];
  loading: boolean;
  error: string | null;
  success: string | null;
  page: number;
  limit: number;
  total: number;
  filters: {
    search?: string;
    showInactive?: boolean;
  };
  selectedCenter: Center | null;
  dialogOpen: boolean;
  dialogType: 'view' | 'edit' | 'delete' | 'restore' | 'hardDelete' | null;
  editForm: Partial<Center>;
}

const SystemCenterManagement: React.FC = () => {
  const [state, setState] = useState<CenterManagementState>({
    centers: [],
    loading: false,
    error: null,
    success: null,
    page: 1,
    limit: 10,
    total: 0,
    filters: {
      showInactive: false
    },
    selectedCenter: null,
    dialogOpen: false,
    dialogType: null,
    editForm: {}
  });

  const loadCenters = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiService.getCenters();
      setState(prev => ({
        ...prev,
        centers: response,
        total: response.length,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to load centers',
        loading: false
      }));
    }
  };

  useEffect(() => {
    loadCenters();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  };

  const openDialog = (type: CenterManagementState['dialogType'], center?: Center) => {
    setState(prev => ({
      ...prev,
      dialogOpen: true,
      dialogType: type,
      selectedCenter: center || null,
      editForm: center ? { ...center } : {}
    }));
  };

  const closeDialog = () => {
    setState(prev => ({
      ...prev,
      dialogOpen: false,
      dialogType: null,
      selectedCenter: null,
      editForm: {}
    }));
  };

  const handleSoftDelete = async () => {
    if (!state.selectedCenter) return;
    
    try {
      await apiService.deleteCenter(state.selectedCenter.id);
      setState(prev => ({
        ...prev,
        success: 'Center deactivated successfully',
        dialogOpen: false,
        dialogType: null,
        selectedCenter: null
      }));
      loadCenters();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to deactivate center'
      }));
    }
  };

  const handleRestore = async () => {
    if (!state.selectedCenter) return;
    
    try {
      await apiService.restoreCenter(state.selectedCenter.id);
      setState(prev => ({
        ...prev,
        success: 'Center restored successfully',
        dialogOpen: false,
        dialogType: null,
        selectedCenter: null
      }));
      loadCenters();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to restore center'
      }));
    }
  };

  const handleHardDelete = async () => {
    if (!state.selectedCenter) return;
    
    try {
      await apiService.hardDeleteCenter(state.selectedCenter.id);
      setState(prev => ({
        ...prev,
        success: 'Center permanently deleted',
        dialogOpen: false,
        dialogType: null,
        selectedCenter: null
      }));
      loadCenters();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to delete center'
      }));
    }
  };

  const handleUpdateCenter = async () => {
    if (!state.selectedCenter) return;
    
    try {
      // Convert the editForm to match the expected CenterFormData type
      const updateData = {
        ...state.editForm,
        location: state.editForm.location ? {
          lat: state.editForm.location.coordinates?.[1] || 0,
          lng: state.editForm.location.coordinates?.[0] || 0
        } : undefined
      };
      
      await apiService.updateCenter(state.selectedCenter.id, updateData);
      setState(prev => ({
        ...prev,
        success: 'Center updated successfully',
        dialogOpen: false,
        dialogType: null,
        selectedCenter: null
      }));
      loadCenters();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to update center'
      }));
    }
  };

  const getStatusChip = (center: Center) => {
    if (!center.is_active) {
      return <Chip label="Inactive" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const renderDialog = () => {
    if (!state.selectedCenter) return null;

    switch (state.dialogType) {
      case 'view':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
            <DialogTitle>Center Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Name</Typography>
                  <Typography variant="body1">{state.selectedCenter.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  {getStatusChip(state.selectedCenter)}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Description</Typography>
                  <Typography variant="body1">{state.selectedCenter.description || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Address</Typography>
                  <Typography variant="body1">{state.selectedCenter.address || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography variant="body1">{state.selectedCenter.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body1">{state.selectedCenter.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Location</Typography>
                  <Typography variant="body1">
                    {state.selectedCenter.location?.coordinates?.[1]?.toFixed(6)}, {state.selectedCenter.location?.coordinates?.[0]?.toFixed(6)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Created</Typography>
                  <Typography variant="body1">{new Date(state.selectedCenter.created_at).toLocaleDateString()}</Typography>
                </Grid>
                {state.selectedCenter.updated_at && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Last Updated</Typography>
                    <Typography variant="body1">{new Date(state.selectedCenter.updated_at).toLocaleDateString()}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Close</Button>
            </DialogActions>
          </Dialog>
        );

      case 'edit':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
            <DialogTitle>Edit Center</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={state.editForm.name || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, name: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={state.editForm.description || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, description: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={state.editForm.address || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, address: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={state.editForm.phone || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, phone: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={state.editForm.email || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, email: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.editForm.is_active || false}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          editForm: { ...prev.editForm, is_active: e.target.checked }
                        }))}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleUpdateCenter} variant="contained">Update</Button>
            </DialogActions>
          </Dialog>
        );

      case 'delete':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog}>
            <DialogTitle>Deactivate Center</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to deactivate {state.selectedCenter.name}?
                This action can be undone by restoring the center.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSoftDelete} color="warning" variant="contained">
                Deactivate
              </Button>
            </DialogActions>
          </Dialog>
        );

      case 'restore':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog}>
            <DialogTitle>Restore Center</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to restore {state.selectedCenter.name}?
                This will reactivate the center.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleRestore} color="success" variant="contained">
                Restore
              </Button>
            </DialogActions>
          </Dialog>
        );

      case 'hardDelete':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog}>
            <DialogTitle>Permanently Delete Center</DialogTitle>
            <DialogContent>
              <Typography color="error">
                WARNING: This action cannot be undone. Are you sure you want to permanently delete {state.selectedCenter.name}?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleHardDelete} color="error" variant="contained">
                Permanently Delete
              </Button>
            </DialogActions>
          </Dialog>
        );

      default:
        return null;
    }
  };

  const filteredCenters = state.centers.filter(center => {
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      if (!center.name.toLowerCase().includes(searchTerm) && 
          !(center.description?.toLowerCase().includes(searchTerm)) &&
          !(center.address?.toLowerCase().includes(searchTerm))) {
        return false;
      }
    }
    if (!state.filters.showInactive && !center.is_active) {
      return false;
    }
    return true;
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System Center Management
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search centers..."
                value={state.filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.filters.showInactive || false}
                    onChange={(e) => handleFilterChange('showInactive', e.target.checked)}
                  />
                }
                label="Show Inactive Centers"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadCenters}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Centers Table */}
      <Card>
        <CardContent>
          {state.loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCenters.map((center) => (
                      <TableRow key={center.id}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {center.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {center.description || 'No description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {center.phone && (
                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2">{center.phone}</Typography>
                              </Box>
                            )}
                            {center.email && (
                              <Box display="flex" alignItems="center" gap={1}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2">{center.email}</Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(center)}
                        </TableCell>
                        <TableCell>
                          {new Date(center.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton onClick={() => openDialog('view', center)} size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Center">
                            <IconButton onClick={() => openDialog('edit', center)} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {center.is_active ? (
                            <Tooltip title="Deactivate Center">
                              <IconButton onClick={() => openDialog('delete', center)} size="small" color="warning">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip title="Restore Center">
                                <IconButton onClick={() => openDialog('restore', center)} size="small" color="success">
                                  <RestoreIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Permanently Delete">
                                <IconButton onClick={() => openDialog('hardDelete', center)} size="small" color="error">
                                  <HardDeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {renderDialog()}

      {/* Notifications */}
      <Snackbar
        open={!!state.error}
        autoHideDuration={6000}
        onClose={() => setState(prev => ({ ...prev, error: null }))}
      >
        <Alert severity="error" onClose={() => setState(prev => ({ ...prev, error: null }))}>
          {state.error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!state.success}
        autoHideDuration={6000}
        onClose={() => setState(prev => ({ ...prev, success: null }))}
      >
        <Alert severity="success" onClose={() => setState(prev => ({ ...prev, success: null }))}>
          {state.success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemCenterManagement; 