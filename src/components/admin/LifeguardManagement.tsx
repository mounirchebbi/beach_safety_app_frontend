import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  Fab,
  CircularProgress,
  Avatar,
  Switch,
  FormControlLabel,
  Divider,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
  DeleteForever as HardDeleteIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Lifeguard, LifeguardFormData } from '../../types';

// Interface matching the actual API response structure
interface LifeguardWithUser {
  id: string;
  user_id: string;
  center_id: string;
  certification_level?: string;
  certification_expiry?: string;
  emergency_contact?: any;
  created_at: string;
  updated_at: string;
  // User fields (flat structure from API)
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  center_name: string;
}

const LifeguardManagement: React.FC = () => {
  const { user } = useAuth();
  const [lifeguards, setLifeguards] = useState<LifeguardWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Selected lifeguard
  const [selectedLifeguard, setSelectedLifeguard] = useState<LifeguardWithUser | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<LifeguardFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    certification_level: '',
    certification_expiry: '',
    emergency_contact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    is_active: true
  });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load lifeguards
  const loadLifeguards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getLifeguards();
      setLifeguards(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load lifeguards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLifeguards();
  }, []);

  // Handle form input changes
  const handleFormChange = (field: keyof LifeguardFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle emergency contact changes
  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contact: {
        ...prev.emergency_contact!,
        [field]: value
      }
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      certification_level: '',
      certification_expiry: '',
      emergency_contact: {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      },
      is_active: true
    });
  };

  // Open create dialog
  const handleCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (lifeguard: LifeguardWithUser) => {
    setSelectedLifeguard(lifeguard);
    setFormData({
      email: lifeguard.email,
      first_name: lifeguard.first_name,
      last_name: lifeguard.last_name,
      phone: lifeguard.phone || '',
      certification_level: lifeguard.certification_level || '',
      certification_expiry: lifeguard.certification_expiry || '',
      emergency_contact: lifeguard.emergency_contact || {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      },
      is_active: lifeguard.is_active
    });
    setEditDialogOpen(true);
  };

  // Open view dialog
  const handleView = (lifeguard: LifeguardWithUser) => {
    setSelectedLifeguard(lifeguard);
    setViewDialogOpen(true);
  };

  // Open delete dialog
  const handleDelete = (lifeguard: LifeguardWithUser) => {
    setSelectedLifeguard(lifeguard);
    setDeleteDialogOpen(true);
  };

  // Open restore dialog
  const handleRestore = (lifeguard: LifeguardWithUser) => {
    setSelectedLifeguard(lifeguard);
    setRestoreDialogOpen(true);
  };

  // Open hard delete dialog
  const handleHardDelete = (lifeguard: LifeguardWithUser) => {
    setSelectedLifeguard(lifeguard);
    setHardDeleteDialogOpen(true);
  };

  // Create lifeguard
  const handleCreateSubmit = async () => {
    try {
      if (!formData.password) {
        setError('Password is required for new lifeguards');
        return;
      }

      await apiService.createLifeguard(formData);
      setSuccess('Lifeguard created successfully');
      setCreateDialogOpen(false);
      loadLifeguards();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create lifeguard');
    }
  };

  // Update lifeguard
  const handleEditSubmit = async () => {
    try {
      if (!selectedLifeguard) return;

      const updateData = { ...formData };
      delete updateData.password; // Remove password from update if not provided

      await apiService.updateLifeguard(selectedLifeguard.id, updateData);
      setSuccess('Lifeguard updated successfully');
      setEditDialogOpen(false);
      loadLifeguards();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update lifeguard');
    }
  };

  // Delete lifeguard
  const handleDeleteSubmit = async () => {
    try {
      if (!selectedLifeguard) return;

      await apiService.deleteLifeguard(selectedLifeguard.id);
      setSuccess('Lifeguard deactivated successfully');
      setDeleteDialogOpen(false);
      loadLifeguards();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate lifeguard');
    }
  };

  // Restore lifeguard
  const handleRestoreSubmit = async () => {
    try {
      if (!selectedLifeguard) return;

      await apiService.restoreLifeguard(selectedLifeguard.id);
      setSuccess('Lifeguard restored successfully');
      setRestoreDialogOpen(false);
      loadLifeguards();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to restore lifeguard');
    }
  };

  // Hard delete lifeguard
  const handleHardDeleteSubmit = async () => {
    try {
      if (!selectedLifeguard) return;

      await apiService.hardDeleteLifeguard(selectedLifeguard.id);
      setSuccess('Lifeguard permanently deleted');
      setHardDeleteDialogOpen(false);
      loadLifeguards();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete lifeguard');
    }
  };

  // Check if certification is expired
  const isCertificationExpired = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    return isAfter(new Date(), parseISO(expiryDate));
  };

  // Get certification status color
  const getCertificationStatusColor = (expiryDate: string | undefined) => {
    if (!expiryDate) return 'default';
    if (isCertificationExpired(expiryDate)) return 'error';
    const daysUntilExpiry = Math.ceil((parseISO(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) return 'warning';
    return 'success';
  };

  // Get certification status text
  const getCertificationStatusText = (expiryDate: string | undefined) => {
    if (!expiryDate) return 'No Certification';
    if (isCertificationExpired(expiryDate)) return 'Expired';
    const daysUntilExpiry = Math.ceil((parseISO(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days`;
    return 'Valid';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Lifeguard Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ borderRadius: 2 }}
          >
            Add Lifeguard
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lifeguard</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Certification</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Center</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lifeguards
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((lifeguard) => (
                    <TableRow key={lifeguard.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {lifeguard.first_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {lifeguard.first_name} {lifeguard.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {lifeguard.id.slice(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {lifeguard.email}
                            </Typography>
                          </Box>
                          {lifeguard.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {lifeguard.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {lifeguard.certification_level || 'Not specified'}
                          </Typography>
                          {lifeguard.certification_expiry && (
                            <Chip
                              label={getCertificationStatusText(lifeguard.certification_expiry)}
                              color={getCertificationStatusColor(lifeguard.certification_expiry) as any}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lifeguard.is_active ? 'Active' : 'Inactive'}
                          color={lifeguard.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {lifeguard.center_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleView(lifeguard)}
                              color="info"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(lifeguard)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {lifeguard.is_active ? (
                            <Tooltip title="Deactivate">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(lifeguard)}
                                color="warning"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip title="Restore">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRestore(lifeguard)}
                                  color="success"
                                >
                                  <RestoreIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Permanently Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleHardDelete(lifeguard)}
                                  color="error"
                                >
                                  <HardDeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={lifeguards.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Lifeguard</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => handleFormChange('first_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => handleFormChange('last_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFormChange('password', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Certification Level"
                  value={formData.certification_level}
                  onChange={(e) => handleFormChange('certification_level', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Certification Expiry"
                  value={formData.certification_expiry ? parseISO(formData.certification_expiry) : null}
                  onChange={(date) => handleFormChange('certification_expiry', date ? format(date, 'yyyy-MM-dd') : '')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Emergency Contact
                  </Typography>
                </Divider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  value={formData.emergency_contact?.name || ''}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Relationship"
                  value={formData.emergency_contact?.relationship || ''}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  value={formData.emergency_contact?.phone || ''}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Email"
                  type="email"
                  value={formData.emergency_contact?.email || ''}
                  onChange={(e) => handleEmergencyContactChange('email', e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSubmit} variant="contained">
              Create Lifeguard
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Lifeguard</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => handleFormChange('first_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => handleFormChange('last_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Certification Level"
                  value={formData.certification_level}
                  onChange={(e) => handleFormChange('certification_level', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Certification Expiry"
                  value={formData.certification_expiry ? parseISO(formData.certification_expiry) : null}
                  onChange={(date) => handleFormChange('certification_expiry', date ? format(date, 'yyyy-MM-dd') : '')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => handleFormChange('is_active', e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Emergency Contact
                  </Typography>
                </Divider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  value={formData.emergency_contact?.name || ''}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Relationship"
                  value={formData.emergency_contact?.relationship || ''}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  value={formData.emergency_contact?.phone || ''}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Email"
                  type="email"
                  value={formData.emergency_contact?.email || ''}
                  onChange={(e) => handleEmergencyContactChange('email', e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained">
              Update Lifeguard
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Lifeguard Details</DialogTitle>
          <DialogContent>
            {selectedLifeguard && (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    {selectedLifeguard.first_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedLifeguard.first_name} {selectedLifeguard.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedLifeguard.email}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Contact Information</Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Email:</strong> {selectedLifeguard.email}
                    </Typography>
                    {selectedLifeguard.phone && (
                      <Typography variant="body2" mb={1}>
                        <strong>Phone:</strong> {selectedLifeguard.phone}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Certification</Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Level:</strong> {selectedLifeguard.certification_level || 'Not specified'}
                    </Typography>
                    {selectedLifeguard.certification_expiry && (
                      <Typography variant="body2" mb={1}>
                        <strong>Expiry:</strong> {format(parseISO(selectedLifeguard.certification_expiry), 'PPP')}
                      </Typography>
                    )}
                  </Grid>

                  {selectedLifeguard.emergency_contact && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Emergency Contact</Typography>
                      <Typography variant="body2" mb={1}>
                        <strong>Name:</strong> {selectedLifeguard.emergency_contact.name}
                      </Typography>
                      <Typography variant="body2" mb={1}>
                        <strong>Relationship:</strong> {selectedLifeguard.emergency_contact.relationship}
                      </Typography>
                      <Typography variant="body2" mb={1}>
                        <strong>Phone:</strong> {selectedLifeguard.emergency_contact.phone}
                      </Typography>
                      {selectedLifeguard.emergency_contact.email && (
                        <Typography variant="body2" mb={1}>
                          <strong>Email:</strong> {selectedLifeguard.emergency_contact.email}
                        </Typography>
                      )}
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip
                      label={selectedLifeguard.is_active ? 'Active' : 'Inactive'}
                      color={selectedLifeguard.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Center</Typography>
                    <Typography variant="body2">
                      {selectedLifeguard.center_name}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Deactivate Lifeguard</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to deactivate{' '}
              <strong>
                {selectedLifeguard?.first_name} {selectedLifeguard?.last_name}
              </strong>
              ? This action can be undone by restoring the lifeguard.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteSubmit} color="warning" variant="contained">
              Deactivate
            </Button>
          </DialogActions>
        </Dialog>

        {/* Restore Confirmation Dialog */}
        <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
          <DialogTitle>Restore Lifeguard</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to restore{' '}
              <strong>
                {selectedLifeguard?.first_name} {selectedLifeguard?.last_name}
              </strong>
              ? This will reactivate their account.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRestoreSubmit} color="success" variant="contained">
              Restore
            </Button>
          </DialogActions>
        </Dialog>

        {/* Hard Delete Confirmation Dialog */}
        <Dialog open={hardDeleteDialogOpen} onClose={() => setHardDeleteDialogOpen(false)}>
          <DialogTitle>Permanently Delete Lifeguard</DialogTitle>
          <DialogContent>
            <Typography color="error">
              WARNING: This action cannot be undone. Are you sure you want to permanently delete{' '}
              <strong>
                {selectedLifeguard?.first_name} {selectedLifeguard?.last_name}
              </strong>
              ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHardDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleHardDeleteSubmit} color="error" variant="contained">
              Permanently Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!error || !!success}
          autoHideDuration={6000}
          onClose={() => {
            setError(null);
            setSuccess(null);
          }}
        >
          <Alert
            onClose={() => {
              setError(null);
              setSuccess(null);
            }}
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default LifeguardManagement; 