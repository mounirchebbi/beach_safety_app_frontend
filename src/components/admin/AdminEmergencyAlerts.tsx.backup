import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Stack,
  Divider,
  Avatar,
  Badge,
  LinearProgress,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Warning as EmergencyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as MedicalIcon,
  Security as SecurityIcon,
  BeachAccess as BeachIcon,
  Notifications as NotificationsIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { apiService } from '../../services/api';
import { EmergencyAlert, Lifeguard } from '../../types';

interface AlertStats {
  total: number;
  active: number;
  responding: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const AdminEmergencyAlerts: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [lifeguards, setLifeguards] = useState<Lifeguard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [socketConnected, setSocketConnected] = useState(false);
  const [showAlertNotification, setShowAlertNotification] = useState(false);
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    active: 0,
    responding: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  // WebSocket connection and real-time updates
  useEffect(() => {
    if (!socket || !user?.center_info?.id) return;

    console.log('Setting up WebSocket connection for center admin:', user.center_info.id);
    
    // Check socket connection status
    if (socket.connected) {
      console.log('Socket connected successfully');
      setSocketConnected(true);
    } else {
      console.log('Socket not connected, waiting for connection...');
      socket.on('connect', () => {
        console.log('Socket connected after waiting');
        setSocketConnected(true);
      });
    }

    // Add connection event listeners
    socket.on('connect', () => {
      console.log('Socket connected event fired');
      setSocketConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    // Listen for emergency alerts
    socket.on('emergency_alert', (data) => {
      console.log('New emergency alert received:', data);
      console.log('Current user center ID:', user?.center_info?.id);
      console.log('Alert center ID:', data.center_id);
      if (data.center_id === user?.center_info?.id) {
        console.log('Alert belongs to this center, refreshing data...');
        loadData(); // Refresh alerts
        setShowAlertNotification(true);
        // Auto-hide notification after 5 seconds
        setTimeout(() => setShowAlertNotification(false), 5000);
      } else {
        console.log('Alert does not belong to this center, ignoring...');
      }
    });

    // Listen for alert status changes
    socket.on('alert_status_change', (data) => {
      console.log('Alert status change received:', data);
      console.log('Refreshing data due to status change...');
      loadData(); // Refresh alerts
    });

    // Listen for alert acknowledgments
    socket.on('alert_acknowledged', (data) => {
      console.log('Alert acknowledged:', data);
      console.log('Refreshing data due to acknowledgment...');
      loadData(); // Refresh alerts
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection for center admin');
      socket.off('emergency_alert');
      socket.off('alert_status_change');
      socket.off('alert_acknowledged');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      setSocketConnected(false);
    };
  }, [socket, user?.center_info?.id]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Load alerts
      const alertsData = await apiService.getAlerts();
      const centerAlerts = alertsData.filter((alert: EmergencyAlert) => 
        alert.center_id === user?.center_info?.id
      );
      setAlerts(centerAlerts);

      // Load lifeguards for assignment
      const lifeguardsData = await apiService.getLifeguards();
      const centerLifeguards = lifeguardsData.filter((lg: any) => 
        lg.center_id === user?.center_info?.id && lg.user?.is_active
      );
      setLifeguards(centerLifeguards);

      // Calculate stats
      calculateStats(centerAlerts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (alertsData: EmergencyAlert[]) => {
    const stats: AlertStats = {
      total: alertsData.length,
      active: alertsData.filter(a => a.status === 'active').length,
      responding: alertsData.filter(a => a.status === 'responding').length,
      resolved: alertsData.filter(a => a.status === 'resolved' || a.status === 'closed').length,
      critical: alertsData.filter(a => a.severity === 'critical').length,
      high: alertsData.filter(a => a.severity === 'high').length,
      medium: alertsData.filter(a => a.severity === 'medium').length,
      low: alertsData.filter(a => a.severity === 'low').length
    };
    setStats(stats);
  };

  const handleStatusUpdate = async () => {
    if (!selectedAlert || !newStatus) return;

    try {
      await apiService.updateAlertStatus(selectedAlert.id, newStatus);
      await loadData(); // Refresh the data
      setStatusDialogOpen(false);
      setSelectedAlert(null);
      setNewStatus('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update alert status');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'responding': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'sos': return <EmergencyIcon />;
      case 'medical': return <MedicalIcon />;
      case 'drowning': return <WarningIcon />;
      case 'weather': return <InfoIcon />;
      default: return <EmergencyIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getFilteredAlerts = () => {
    return alerts.filter(alert => {
      const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
      const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
      const typeMatch = filterType === 'all' || alert.alert_type === filterType;
      return statusMatch && severityMatch && typeMatch;
    });
  };

  const getAssignedLifeguardName = (lifeguardId: string) => {
    const lifeguard = lifeguards.find(lg => lg.id === lifeguardId);
    return lifeguard ? `${lifeguard.user.first_name} ${lifeguard.user.last_name}` : 'Unassigned';
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading emergency alerts...
        </Typography>
      </Box>
    );
  }

  const filteredAlerts = getFilteredAlerts();

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <EmergencyIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Emergency Alerts Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Monitor and manage emergency situations at {user?.center_info?.name}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Connection Status Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: socketConnected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                animation: socketConnected ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }} />
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                {socketConnected ? 'Live' : 'Offline'}
              </Typography>
            </Box>
            <Tooltip title="Refresh Alerts">
              <IconButton 
                onClick={loadData}
                disabled={refreshing}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {refreshing && <LinearProgress sx={{ bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* New Alert Notification */}
      {showAlertNotification && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setShowAlertNotification(false)}>
              Dismiss
            </Button>
          }
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            New Emergency Alert Received!
          </Typography>
          <Typography variant="body2">
            A new emergency alert has been created. Check the alerts list below for details.
          </Typography>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'error.light',
                color: 'error.dark',
                mb: 2,
                mx: 'auto',
                width: 'fit-content'
              }}>
                <EmergencyIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.active}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Active Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'warning.light',
                color: 'warning.dark',
                mb: 2,
                mx: 'auto',
                width: 'fit-content'
              }}>
                <PeopleIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.responding}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Being Responded
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'success.light',
                color: 'success.dark',
                mb: 2,
                mx: 'auto',
                width: 'fit-content'
              }}>
                <CheckCircleIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.resolved}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'info.light',
                color: 'info.dark',
                mb: 2,
                mx: 'auto',
                width: 'fit-content'
              }}>
                <TrendingIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.total}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Total Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="responding">Responding</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  label="Severity"
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="sos">SOS</MenuItem>
                  <MenuItem value="medical">Medical</MenuItem>
                  <MenuItem value="drowning">Drowning</MenuItem>
                  <MenuItem value="weather">Weather</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <AlertsTable 
        alerts={filteredAlerts}
        lifeguards={lifeguards}
        onViewDetails={(alert) => {
          setSelectedAlert(alert);
          setDetailDialogOpen(true);
        }}
        onUpdateStatus={(alert) => {
          setSelectedAlert(alert);
          setStatusDialogOpen(true);
        }}
        getAssignedLifeguardName={getAssignedLifeguardName}
      />

      {/* Alert Details Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Alert Details
          <IconButton
            onClick={() => setDetailDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {getAlertTypeIcon(selectedAlert.alert_type)}
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {selectedAlert.alert_type}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Severity</Typography>
                    <Chip
                      label={selectedAlert.severity}
                      color={getSeverityColor(selectedAlert.severity) as any}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={selectedAlert.status}
                      color={getStatusColor(selectedAlert.status) as any}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Reported By</Typography>
                    <Typography variant="body1">
                      {selectedAlert.reported_by || 'Anonymous'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Details</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">
                      {selectedAlert.description || 'No description provided'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Created</Typography>
                    <Typography variant="body1">
                      {formatDate(selectedAlert.created_at)}
                    </Typography>
                  </Box>
                  {selectedAlert.assigned_lifeguard_id && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body1">
                        {getAssignedLifeguardName(selectedAlert.assigned_lifeguard_id)}
                      </Typography>
                    </Box>
                  )}
                  {selectedAlert.resolved_at && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Resolved</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedAlert.resolved_at)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
          {selectedAlert && selectedAlert.status === 'active' && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailDialogOpen(false);
                setStatusDialogOpen(true);
              }}
            >
              Update Status
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Alert Status
          <IconButton
            onClick={() => setStatusDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="New Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="responding">Responding</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Alerts Table Component
interface AlertsTableProps {
  alerts: EmergencyAlert[];
  lifeguards: Lifeguard[];
  onViewDetails: (alert: EmergencyAlert) => void;
  onUpdateStatus: (alert: EmergencyAlert) => void;
  getAssignedLifeguardName: (lifeguardId: string) => string;
}

const AlertsTable: React.FC<AlertsTableProps> = ({
  alerts,
  lifeguards,
  onViewDetails,
  onUpdateStatus,
  getAssignedLifeguardName
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'responding': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'sos': return <EmergencyIcon />;
      case 'medical': return <MedicalIcon />;
      case 'drowning': return <WarningIcon />;
      case 'weather': return <InfoIcon />;
      default: return <EmergencyIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Alerts Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No alerts match the current filters.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Assigned To</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id} sx={{ 
              bgcolor: alert.status === 'active' ? 'error.light' : 'inherit',
              '&:hover': { bgcolor: 'action.hover' }
            }}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getAlertTypeIcon(alert.alert_type)}
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {alert.alert_type}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={alert.severity}
                  color={getSeverityColor(alert.severity) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={alert.status}
                  color={getStatusColor(alert.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {alert.assigned_lifeguard_id 
                    ? getAssignedLifeguardName(alert.assigned_lifeguard_id)
                    : 'Unassigned'
                  }
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ maxWidth: 200 }}>
                  {alert.description || 'No description provided'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(alert.created_at)}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => onViewDetails(alert)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  {alert.status === 'active' && (
                    <Tooltip title="Update Status">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => onUpdateStatus(alert)}
                      >
                        <ScheduleIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AdminEmergencyAlerts; 