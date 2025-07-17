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
  FormHelperText,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  Refresh as RefreshIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  WarningAmber as WarningAmberIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

interface SafetyFlag {
  id: string;
  flag_status: 'green' | 'yellow' | 'red' | 'black';
  reason: string;
  set_at: string;
  expires_at?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface SafetyFlagFormData {
  flag_status: 'green' | 'yellow' | 'red' | 'black';
  reason: string;
  expires_at?: Date;
}

const SafetyManagement: React.FC = () => {
  const { user } = useAuth();
  const centerId = user?.center_id;
  
  const [safetyFlags, setSafetyFlags] = useState<SafetyFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<SafetyFlag | null>(null);
  const [formData, setFormData] = useState<SafetyFlagFormData>({
    flag_status: 'green',
    reason: '',
    expires_at: undefined
  });

  useEffect(() => {
    if (centerId) {
      loadSafetyFlags();
    }
  }, [centerId, page]);

  const loadSafetyFlags = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSafetyFlags(centerId!);
      setSafetyFlags(response.flags || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading safety flags:', error);
      setError('Failed to load safety flags');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (flag: SafetyFlag) => {
    setEditingFlag(flag);
    setFormData({
      flag_status: flag.flag_status,
      reason: flag.reason,
      expires_at: flag.expires_at ? new Date(flag.expires_at) : undefined
    });
    setDialogOpen(true);
  };

  const handleDelete = async (flagId: string) => {
    if (window.confirm('Are you sure you want to delete this safety flag?')) {
      try {
        await apiService.deleteSafetyFlag(flagId);
        setSuccess('Safety flag deleted successfully');
        loadSafetyFlags();
      } catch (error) {
        console.error('Error deleting safety flag:', error);
        setError('Failed to delete safety flag');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editingFlag) {
        await apiService.updateSafetyFlag(editingFlag.id, formData);
        setSuccess('Safety flag updated successfully');
      } else {
        await apiService.setSafetyFlag(centerId!, formData);
        setSuccess('Safety flag created successfully');
      }
      setDialogOpen(false);
      loadSafetyFlags();
    } catch (error) {
      console.error('Error saving safety flag:', error);
      setError('Failed to save safety flag');
    }
  };

  const handleAutoUpdate = async () => {
    try {
      await apiService.triggerAutoUpdate(centerId!);
      setSuccess('Auto-update triggered successfully');
      loadSafetyFlags();
    } catch (error) {
      console.error('Error triggering auto-update:', error);
      setError('Failed to trigger auto-update');
    }
  };

  const getFlagColor = (status: string) => {
    switch (status) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'error';
      case 'black': return 'default';
      default: return 'default';
    }
  };

  const getFlagIcon = (status: string) => {
    switch (status) {
      case 'green': return <CheckCircleOutlineIcon />;
      case 'yellow': return <WarningAmberIcon />;
      case 'red': return <ErrorOutlineIcon />;
      case 'black': return <BlockIcon />;
      default: return <FlagIcon />;
    }
  };

  const isFlagExpired = (flag: SafetyFlag) => {
    if (!flag.expires_at) return false;
    return new Date(flag.expires_at) <= new Date();
  };

  const getFlagConditions = (status: string) => {
    switch (status) {
      case 'green':
        return 'Safe conditions - Normal swimming allowed';
      case 'yellow':
        return 'Caution advised - Moderate hazards present';
      case 'red':
        return 'Dangerous conditions - Swimming prohibited';
      case 'black':
        return 'Beach closed - Extreme hazards present';
      default:
        return 'Unknown conditions';
    }
  };

  const getExpirationStatus = (flag: SafetyFlag) => {
    if (!flag.expires_at) return { status: 'permanent', text: 'No expiration', color: 'success' };
    
    const now = new Date();
    const expiresAt = new Date(flag.expires_at);
    const timeDiff = expiresAt.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    
    if (timeDiff <= 0) {
      return { status: 'expired', text: 'Expired', color: 'error' };
    } else if (hoursLeft <= 1) {
      return { status: 'expiring-soon', text: `Expires in ${hoursLeft} hour(s)`, color: 'warning' };
    } else {
      return { status: 'active', text: `Expires in ${hoursLeft} hour(s)`, color: 'success' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Safety Flag Management
      </Typography>
      
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

      {/* Flag Conditions Guide */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Safety Flag Conditions Guide
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip icon={<CheckCircleOutlineIcon />} label="GREEN" color="success" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Safe conditions - Normal swimming allowed
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip icon={<WarningAmberIcon />} label="YELLOW" color="warning" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Caution advised - Moderate hazards present
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip icon={<ErrorOutlineIcon />} label="RED" color="error" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Dangerous conditions - Swimming prohibited
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip icon={<BlockIcon />} label="BLACK" color="default" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Beach closed - Extreme hazards present
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Current Safety Flags
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadSafetyFlags}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingFlag(null);
                  setFormData({ flag_status: 'green', reason: '', expires_at: undefined });
                  setDialogOpen(true);
                }}
              >
                Add Flag
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Reason & Conditions</TableCell>
                      <TableCell>Set By</TableCell>
                      <TableCell>Set At</TableCell>
                      <TableCell>Expiration Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {safetyFlags.map((flag) => {
                      const isExpired = isFlagExpired(flag);
                      const expirationStatus = getExpirationStatus(flag);
                      
                      return (
                        <TableRow 
                          key={flag.id}
                          sx={{
                            opacity: isExpired ? 0.6 : 1,
                            backgroundColor: isExpired ? 'action.hover' : 'inherit',
                            '&:hover': {
                              backgroundColor: isExpired ? 'action.hover' : 'action.hover'
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                icon={getFlagIcon(flag.flag_status)}
                                label={flag.flag_status.toUpperCase()}
                                color={getFlagColor(flag.flag_status)}
                                size="small"
                                variant={isExpired ? "outlined" : "filled"}
                              />
                              {isExpired && (
                                <Chip
                                  label="EXPIRED"
                                  color="error"
                                  size="small"
                                  variant="filled"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {flag.reason}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getFlagConditions(flag.flag_status)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {flag.first_name ? flag.first_name[0] : 'U'}
                              </Avatar>
                              <Typography variant="body2">
                                {flag.first_name && flag.last_name 
                                  ? `${flag.first_name} ${flag.last_name}`
                                  : flag.email || 'Unknown'
                                }
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(flag.set_at).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                icon={<AccessTimeIcon />}
                                label={expirationStatus.text}
                                color={expirationStatus.color as any}
                                size="small"
                                variant={isExpired ? "filled" : "outlined"}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Edit flag">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(flag)}
                                  color="primary"
                                  disabled={isExpired}
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
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(event, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFlag ? 'Edit Safety Flag' : 'Add Safety Flag'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Flag Status</InputLabel>
              <Select
                value={formData.flag_status}
                onChange={(e) => setFormData({ ...formData, flag_status: e.target.value as any })}
                label="Flag Status"
              >
                <MenuItem value="green">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon color="success" />
                    Green - Safe (Normal swimming allowed)
                  </Box>
                </MenuItem>
                <MenuItem value="yellow">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon color="warning" />
                    Yellow - Caution (Moderate hazards present)
                  </Box>
                </MenuItem>
                <MenuItem value="red">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorOutlineIcon color="error" />
                    Red - Dangerous (Swimming prohibited)
                  </Box>
                </MenuItem>
                <MenuItem value="black">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockIcon />
                    Black - Closed (Extreme hazards present)
                  </Box>
                </MenuItem>
              </Select>
              <FormHelperText>
                {getFlagConditions(formData.flag_status)}
              </FormHelperText>
            </FormControl>
            
            <TextField
              fullWidth
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              helperText="Provide a detailed reason for this safety flag"
            />
            
            <DateTimePicker
              label="Expiration Date & Time (Optional)"
              value={formData.expires_at}
              onChange={(newValue) => setFormData({ ...formData, expires_at: newValue || undefined })}
              minDateTime={new Date()}
              maxDateTime={new Date(Date.now() + 24* 60 *60*1000)} // 24 hours from now
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mb: 2 },
                  helperText: "Maximum duration is 24 hours. Leave empty for default 2-hour expiration."
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.reason.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SafetyManagement; 