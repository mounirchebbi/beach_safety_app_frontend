import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  AutoFixHigh as AutoFixHighIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface CenterFlagStatus {
  center_id: string;
  center_name: string;
  is_active: boolean;
  flag_status: string;
  reason: string | null;
  set_at: string | null;
  expires_at: string | null;
  set_by: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null;
  flag_mode: string;
  needs_attention: boolean;
}

interface FlagSummary {
  total_centers: number;
  automatic_flags: number;
  manual_flags: number;
  expired_flags: number;
  no_flags: number;
  needs_attention: number;
}

const SystemFlagManagement: React.FC = () => {
  const [flagStatus, setFlagStatus] = useState<CenterFlagStatus[]>([]);
  const [summary, setSummary] = useState<FlagSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ open: false, title: '', message: '', action: () => {} });

  useEffect(() => {
    loadFlagStatus();
  }, []);

  const loadFlagStatus = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllCentersFlagStatus();
      setFlagStatus(data.centers);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error loading flag status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load flag status',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckExpiredFlags = async () => {
    setConfirmDialog({
      open: true,
      title: 'Check Expired Flags',
      message: 'This will check for expired manual flags and update them to automatic mode. Continue?',
      action: async () => {
        try {
          setActionLoading(true);
          const result = await apiService.checkAndUpdateExpiredFlags();
          setSnackbar({
            open: true,
            message: `Expired flag check completed. ${result.updated} flags updated.`,
            severity: 'success'
          });
          await loadFlagStatus();
        } catch (error) {
          console.error('Error checking expired flags:', error);
          setSnackbar({
            open: true,
            message: 'Failed to check expired flags',
            severity: 'error'
          });
        } finally {
          setActionLoading(false);
          setConfirmDialog({ open: false, title: '', message: '', action: () => {} });
        }
      }
    });
  };

  const handleInitializeFlags = async () => {
    setConfirmDialog({
      open: true,
      title: 'Initialize All Flags',
      message: 'This will set automatic safety flags for all centers that don\'t have one. Continue?',
      action: async () => {
        try {
          setActionLoading(true);
          const result = await apiService.initializeAllCenterFlags();
          setSnackbar({
            open: true,
            message: `Flag initialization completed. ${result.initialized} centers initialized.`,
            severity: 'success'
          });
          await loadFlagStatus();
        } catch (error) {
          console.error('Error initializing flags:', error);
          setSnackbar({
            open: true,
            message: 'Failed to initialize flags',
            severity: 'error'
          });
        } finally {
          setActionLoading(false);
          setConfirmDialog({ open: false, title: '', message: '', action: () => {} });
        }
      }
    });
  };

  const handleForceUpdateAll = async () => {
    setConfirmDialog({
      open: true,
      title: 'Force Update All Flags',
      message: 'This will force an automatic update of all safety flags based on current weather conditions. Continue?',
      action: async () => {
        try {
          setActionLoading(true);
          const result = await apiService.forceUpdateAllCenterFlags();
          setSnackbar({
            open: true,
            message: `Force update completed. ${result.summary.successful_updates} flags updated.`,
            severity: 'success'
          });
          await loadFlagStatus();
        } catch (error) {
          console.error('Error forcing update:', error);
          setSnackbar({
            open: true,
            message: 'Failed to force update flags',
            severity: 'error'
          });
        } finally {
          setActionLoading(false);
          setConfirmDialog({ open: false, title: '', message: '', action: () => {} });
        }
      }
    });
  };

  const getFlagStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'error';
      case 'black': return 'default';
      default: return 'default';
    }
  };

  const getFlagModeIcon = (mode: string) => {
    switch (mode) {
      case 'automatic': return <AutoFixHighIcon />;
      case 'manual': return <InfoIcon />;
      case 'expired': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const getFlagModeColor = (mode: string) => {
    switch (mode) {
      case 'automatic': return 'success';
      case 'manual': return 'info';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Flag Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage safety flags across all beach centers. Monitor automatic and manual flag status.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Centers
              </Typography>
              <Typography variant="h4">
                {summary?.total_centers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Automatic Flags
              </Typography>
              <Typography variant="h4" color="success.main">
                {summary?.automatic_flags || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Manual Flags
              </Typography>
              <Typography variant="h4" color="info.main">
                {summary?.manual_flags || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Needs Attention
              </Typography>
              <Typography variant="h4" color="warning.main">
                {summary?.needs_attention || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadFlagStatus}
              disabled={loading}
            >
              Refresh Status
            </Button>
            <Button
              variant="contained"
              startIcon={<WarningIcon />}
              onClick={handleCheckExpiredFlags}
              disabled={actionLoading}
              color="warning"
            >
              Check Expired Flags
            </Button>
            <Button
              variant="contained"
              startIcon={<AutoFixHighIcon />}
              onClick={handleInitializeFlags}
              disabled={actionLoading}
              color="info"
            >
              Initialize All Flags
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleForceUpdateAll}
              disabled={actionLoading}
              color="primary"
            >
              Force Update All
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Centers Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Center Flag Status
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Center</TableCell>
                  <TableCell>Flag Status</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Set By</TableCell>
                  <TableCell>Set At</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flagStatus.map((center) => (
                  <TableRow 
                    key={center.center_id}
                    sx={{ 
                      backgroundColor: center.needs_attention ? 'warning.50' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {center.center_name}
                      </Typography>
                      {center.needs_attention && (
                        <Chip
                          label="Needs Attention"
                          size="small"
                          color="warning"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={center.flag_status.toUpperCase()}
                        color={getFlagStatusColor(center.flag_status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getFlagModeIcon(center.flag_mode)}
                        label={center.flag_mode}
                        color={getFlagModeColor(center.flag_mode) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {center.set_by ? (
                        <Typography variant="body2">
                          {center.set_by.first_name} {center.set_by.last_name}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {center.set_by.role}
                          </Typography>
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not set
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {center.set_at ? (
                        <Typography variant="body2">
                          {new Date(center.set_at).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {center.expires_at ? (
                        <Typography 
                          variant="body2"
                          color={new Date(center.expires_at) <= new Date() ? 'error.main' : 'text.primary'}
                        >
                          {new Date(center.expires_at).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {center.reason || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, title: '', message: '', action: () => {} })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, title: '', message: '', action: () => {} })}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDialog.action}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default SystemFlagManagement; 