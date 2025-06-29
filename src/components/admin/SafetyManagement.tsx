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
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  Grid,
  Divider,
  Tooltip,
  Fab,
  Pagination,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isAfter, addHours } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { SafetyFlag } from '../../types';

interface SafetyFlagFormData {
  flag_status: 'green' | 'yellow' | 'red' | 'black';
  reason: string;
  expires_at?: string;
}

interface FormErrors {
  flag_status?: string;
  reason?: string;
  expires_at?: string;
}

const SafetyManagement: React.FC = () => {
  const { user } = useAuth();
  const [currentFlag, setCurrentFlag] = useState<SafetyFlag | null>(null);
  const [flagHistory, setFlagHistory] = useState<SafetyFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFlag, setEditingFlag] = useState<SafetyFlag | null>(null);
  const [formData, setFormData] = useState<SafetyFlagFormData>({
    flag_status: 'green',
    reason: '',
    expires_at: undefined
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [managementMode, setManagementMode] = useState<'automatic' | 'manual' | null>(null);
  const [autoUpdateLoading, setAutoUpdateLoading] = useState(false);
  const [flagExpiration, setFlagExpiration] = useState<string | null>(null);
  const [flagSetBy, setFlagSetBy] = useState<string | null>(null);

  const centerId = user?.center_info?.id;

  useEffect(() => {
    if (centerId) {
      loadCurrentFlag();
      loadFlagHistory();
      loadManagementMode();
    }
  }, [centerId, currentPage]);

  const loadCurrentFlag = async () => {
    try {
      setLoading(true);
      const flag = await apiService.getCurrentSafetyFlag(centerId!);
      setCurrentFlag(flag);
    } catch (error) {
      console.error('Error loading current flag:', error);
      setCurrentFlag(null);
    } finally {
      setLoading(false);
    }
  };

  const loadFlagHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await apiService.getSafetyFlagHistory(centerId!, currentPage, 10);
      setFlagHistory(response.flags);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error('Error loading flag history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load flag history',
        severity: 'error'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadManagementMode = async () => {
    try {
      const mode = await apiService.getFlagManagementMode(centerId!);
      setManagementMode(mode.mode);
      
      // Set additional flag information
      if (mode.current_flag) {
        setFlagExpiration(mode.current_flag.expires_at);
        setFlagSetBy(mode.current_flag.set_by?.first_name + ' ' + mode.current_flag.set_by?.last_name || 'Unknown');
      } else {
        setFlagExpiration(null);
        setFlagSetBy(null);
      }
    } catch (error) {
      console.error('Error loading management mode:', error);
      setManagementMode(null);
      setFlagExpiration(null);
      setFlagSetBy(null);
    }
  };

  const handleAutoUpdate = async () => {
    try {
      setAutoUpdateLoading(true);
      const result = await apiService.triggerAutomaticFlagUpdate(centerId!);
      
      if (result.data.updated) {
        setSnackbar({
          open: true,
          message: `Flag updated automatically: ${result.data.old_flag} → ${result.data.new_flag}`,
          severity: 'success'
        });
        // Reload data
        await loadCurrentFlag();
        await loadFlagHistory();
        await loadManagementMode();
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'No update needed - current conditions are appropriate',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error triggering automatic update:', error);
      setSnackbar({
        open: true,
        message: 'Failed to trigger automatic update',
        severity: 'error'
      });
    } finally {
      setAutoUpdateLoading(false);
    }
  };

  const handleOpenDialog = (flag?: SafetyFlag) => {
    if (flag) {
      setEditingFlag(flag);
      setFormData({
        flag_status: flag.flag_status,
        reason: flag.reason || '',
        expires_at: flag.expires_at || undefined
      });
    } else {
      setEditingFlag(null);
      setFormData({
        flag_status: 'green',
        reason: '',
        expires_at: undefined
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFlag(null);
    setFormData({
      flag_status: 'green',
      reason: '',
      expires_at: undefined
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.flag_status) {
      newErrors.flag_status = 'Flag status is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (formData.expires_at && isAfter(parseISO(formData.expires_at), addHours(new Date(), 24))) {
      newErrors.expires_at = 'Expiry time cannot be more than 24 hours in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingFlag) {
        await apiService.updateSafetyFlag(editingFlag.id, formData);
        setSnackbar({
          open: true,
          message: 'Safety flag updated successfully',
          severity: 'success'
        });
      } else {
        await apiService.setSafetyFlag(centerId!, formData);
        setSnackbar({
          open: true,
          message: 'Safety flag set successfully',
          severity: 'success'
        });
      }

      handleCloseDialog();
      loadCurrentFlag();
      loadFlagHistory();
    } catch (error) {
      console.error('Error saving safety flag:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save safety flag',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (flagId: string) => {
    if (!window.confirm('Are you sure you want to delete this safety flag?')) return;

    try {
      await apiService.deleteSafetyFlag(flagId);
      setSnackbar({
        open: true,
        message: 'Safety flag deleted successfully',
        severity: 'success'
      });
      loadCurrentFlag();
      loadFlagHistory();
    } catch (error) {
      console.error('Error deleting safety flag:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete safety flag',
        severity: 'error'
      });
    }
  };

  const getFlagStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'error';
      case 'black': return 'default';
      default: return 'default';
    }
  };

  const getFlagStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return <CheckCircleIcon />;
      case 'yellow': return <WarningIcon />;
      case 'red': return <WarningIcon />;
      case 'black': return <CancelIcon />;
      default: return <FlagIcon />;
    }
  };

  const getFlagStatusDescription = (status: string) => {
    switch (status) {
      case 'green': return 'Swimming allowed - Low hazard';
      case 'yellow': return 'Medium risk - Caution advised';
      case 'red': return 'High risk - Swimming not recommended';
      case 'black': return 'Swimming prohibited - Dangerous conditions';
      default: return 'Unknown status';
    }
  };

  const isFlagExpired = (flag: SafetyFlag) => {
    if (!flag.expires_at) return false;
    return isAfter(new Date(), parseISO(flag.expires_at));
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
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Safety Flag Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage beach safety conditions and flag status for your center
            </Typography>
            {managementMode && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Management Mode:
                </Typography>
                <Chip
                  label={managementMode === 'automatic' ? 'Automatic' : 'Manual'}
                  color={managementMode === 'automatic' ? 'success' : 'warning'}
                  size="small"
                  variant="outlined"
                />
                {managementMode === 'automatic' && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    (Flags are set automatically based on weather conditions)
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleAutoUpdate}
              disabled={autoUpdateLoading}
              sx={{ px: 3 }}
            >
              {autoUpdateLoading ? 'Updating...' : 'Auto Update'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ px: 3 }}
            >
              Set New Flag
            </Button>
          </Box>
        </Box>

        {/* Current Flag Status */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Safety Flag Status
            </Typography>
            {loading ? (
              <CircularProgress size={20} />
            ) : currentFlag ? (
              <Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      mr: 2,
                      backgroundColor: getFlagStatusColor(currentFlag.flag_status)
                    }}
                  >
                    {currentFlag.flag_status.toUpperCase()}
                  </Box>
                  <Box>
                    <Typography variant="h6" color={getFlagStatusColor(currentFlag.flag_status)}>
                      {currentFlag.flag_status.toUpperCase()} FLAG
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Set on {new Date(currentFlag.set_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Flag Management Details */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Flag Management Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Management Mode:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {managementMode === 'automatic' ? '🔄 Automatic' : '👤 Manual'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Set By:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {flagSetBy || 'Unknown'}
                      </Typography>
                    </Grid>
                    {flagExpiration && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Expires:
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight="medium"
                          color={new Date(flagExpiration) <= new Date() ? 'error.main' : 'text.primary'}
                        >
                          {new Date(flagExpiration).toLocaleString()}
                          {new Date(flagExpiration) <= new Date() && ' (EXPIRED)'}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Reason:</strong> {currentFlag.reason}
                </Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">
                No safety flag currently set for this center.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Automatic Flag Management */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Automatic Flag Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The system automatically sets safety flags based on weather conditions. Manual flags override automatic ones until they expire.
            </Typography>
            
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                Current Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mode: <strong>{managementMode === 'automatic' ? 'Automatic' : 'Manual Override'}</strong>
              </Typography>
              {managementMode === 'manual' && flagExpiration && (
                <Typography variant="body2" color="text.secondary">
                  Manual override expires: <strong>{new Date(flagExpiration).toLocaleString()}</strong>
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleAutoUpdate}
              disabled={autoUpdateLoading}
              sx={{ mr: 2 }}
            >
              {autoUpdateLoading ? 'Updating...' : 'Trigger Auto Update'}
            </Button>
            
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              This will check current weather conditions and update the flag automatically if needed.
            </Typography>
          </CardContent>
        </Card>

        {/* Flag History */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Flag History
            </Typography>

            {historyLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Set By</TableCell>
                        <TableCell>Set At</TableCell>
                        <TableCell>Expires At</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {flagHistory.map((flag) => (
                        <TableRow key={flag.id} hover>
                          <TableCell>
                            <Chip
                              icon={getFlagStatusIcon(flag.flag_status)}
                              label={flag.flag_status.toUpperCase()}
                              color={getFlagStatusColor(flag.flag_status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {flag.reason || 'No reason provided'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {typeof flag.set_by === 'object' ? `${flag.set_by.first_name} ${flag.set_by.last_name}` : flag.set_by}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(flag.set_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            {flag.expires_at ? (
                              <Typography
                                variant="body2"
                                color={isFlagExpired(flag) ? 'error' : 'text.primary'}
                              >
                                {format(parseISO(flag.expires_at), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No expiry
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit flag">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(flag)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete flag">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(flag.id)}
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

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, page) => setCurrentPage(page)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Safety Flag Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingFlag ? 'Edit Safety Flag' : 'Set New Safety Flag'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Flag Status</InputLabel>
                <Select
                  value={formData.flag_status}
                  onChange={(e) => setFormData({ ...formData, flag_status: e.target.value as any })}
                  error={!!errors.flag_status}
                >
                  <MenuItem value="green">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" />
                      Green - Swimming Allowed
                    </Box>
                  </MenuItem>
                  <MenuItem value="yellow">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" />
                      Yellow - Medium Risk
                    </Box>
                  </MenuItem>
                  <MenuItem value="red">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="error" />
                      Red - High Risk
                    </Box>
                  </MenuItem>
                  <MenuItem value="black">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CancelIcon />
                      Black - Swimming Prohibited
                    </Box>
                  </MenuItem>
                </Select>
                {errors.flag_status && (
                  <FormHelperText error>{errors.flag_status}</FormHelperText>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                error={!!errors.reason}
                helperText={errors.reason || 'Explain why this flag status is being set'}
                sx={{ mb: 3 }}
              />

              <DateTimePicker
                label="Expires At (Optional)"
                value={formData.expires_at ? parseISO(formData.expires_at) : null}
                onChange={(date) => setFormData({ 
                  ...formData, 
                  expires_at: date ? date.toISOString() : undefined 
                })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.expires_at,
                    helperText: errors.expires_at || 'Leave empty for no expiry'
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingFlag ? 'Update Flag' : 'Set Flag'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default SafetyManagement; 