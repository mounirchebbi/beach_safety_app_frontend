import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Badge,
  Fade,
  Slide,
  Stack,
  LinearProgress,
  Fab,
  Divider,
  CardActionArea,
  CardActions,
  CardMedia,
  ListItemButton,
  ListItemAvatar,
  Collapse,
  Zoom,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Warning as EmergencyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Assignment as AssignIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Map as MapIcon,
  PriorityHigh as PriorityIcon,
  Notifications as NotificationIcon,
  Warning as CriticalIcon,
  LocalHospital as MedicalIcon,
  Pool as DrowningIcon,
  WbSunny as WeatherIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as RespondIcon,
  TrendingUp as EscalateIcon,
  Fullscreen as FullscreenIcon,
  Speed as SpeedIcon,
  FlashOn as FlashIcon,
  RadioButtonChecked as ActiveIcon,
  RadioButtonUnchecked as InactiveIcon,
  CheckCircleOutline as ResolvedIcon,
  Cancel as ClosedIcon,
  Add as AddIcon,
  Report as ReportIcon,
  CheckCircle as ResolveIcon,
  Block as CloseActionIcon,
  CallMerge as EscalationIcon,
  Support as SupportIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { apiService } from '../../services/api';
import { EmergencyAlert, Lifeguard, EmergencyEscalation, Center } from '../../types';
import BeachMap from '../map/BeachMap';
import { socketService } from '../../services/socket';

// Enhanced severity colors with professional aesthetic
const getSeverityConfig = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return {
        color: '#d32f2f',
        bgColor: '#ffebee',
        borderColor: '#f44336',
        gradientColor: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
        icon: <CriticalIcon />,
        label: 'CRITICAL',
        priority: 4,
        animation: {
          animation: 'criticalPulse 2s infinite',
          '@keyframes criticalPulse': {
            '0%': { opacity: 1, transform: 'scale(1)' },
            '50%': { opacity: 0.7, transform: 'scale(1.05)' },
            '100%': { opacity: 1, transform: 'scale(1)' }
          }
        }
      };
    case 'high':
      return {
        color: '#f57c00',
        bgColor: '#fff3e0',
        borderColor: '#ff9800',
        gradientColor: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
        icon: <WarningIcon />,
        label: 'HIGH',
        priority: 3,
        animation: {}
      };
    case 'medium':
      return {
        color: '#1976d2',
        bgColor: '#e3f2fd',
        borderColor: '#2196f3',
        gradientColor: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        icon: <InfoIcon />,
        label: 'MEDIUM',
        priority: 2,
        animation: {}
      };
    case 'low':
      return {
        color: '#388e3c',
        bgColor: '#e8f5e8',
        borderColor: '#4caf50',
        gradientColor: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
        icon: <CheckCircleIcon />,
        label: 'LOW',
        priority: 1,
        animation: {}
      };
    default:
      return {
        color: '#757575',
        bgColor: '#f5f5f5',
        borderColor: '#9e9e9e',
        gradientColor: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
        icon: <InfoIcon />,
        label: 'UNKNOWN',
        priority: 0,
        animation: {}
      };
  }
};

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return {
        color: '#d32f2f',
        bgColor: '#ffebee',
        borderColor: '#f44336',
        gradientColor: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
        icon: <ActiveIcon />,
        label: 'ACTIVE',
        priority: 3
      };
    case 'responding':
      return {
        color: '#f57c00',
        bgColor: '#fff3e0',
        borderColor: '#ff9800',
        gradientColor: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
        icon: <RespondIcon />,
        label: 'RESPONDING',
        priority: 2
      };
    case 'resolved':
      return {
        color: '#388e3c',
        bgColor: '#e8f5e8',
        borderColor: '#4caf50',
        gradientColor: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
        icon: <ResolvedIcon />,
        label: 'RESOLVED',
        priority: 1
      };
    case 'closed':
      return {
        color: '#757575',
        bgColor: '#f5f5f5',
        borderColor: '#9e9e9e',
        gradientColor: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
        icon: <ClosedIcon />,
        label: 'CLOSED',
        priority: 0
      };
    default:
      return {
        color: '#757575',
        bgColor: '#f5f5f5',
        borderColor: '#9e9e9e',
        gradientColor: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
        icon: <InactiveIcon />,
        label: 'UNKNOWN',
        priority: 0
      };
  }
};

const getMaximumUrgencyLevel = (alert: EmergencyAlert) => {
  const severityPriority = getSeverityConfig(alert.severity).priority;
  const statusPriority = getStatusConfig(alert.status).priority;
  
  // Calculate urgency based on severity and status
  if (alert.severity === 'critical' && alert.status === 'active') return 'maximum';
  if (alert.severity === 'critical') return 'critical';
  if (alert.severity === 'high' && alert.status === 'active') return 'high';
  if (alert.severity === 'high') return 'medium';
  if (alert.status === 'active') return 'medium';
  return 'low';
};

const getMaximumUrgencyAnimation = (urgencyLevel: string) => {
  switch (urgencyLevel) {
    case 'maximum':
      return {
        animation: 'maximumUrgencyPulse 1s infinite',
        '@keyframes maximumUrgencyPulse': {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(1.2)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        }
      };
    case 'critical':
      return {
        animation: 'criticalUrgencyPulse 1.5s infinite',
        '@keyframes criticalUrgencyPulse': {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(1.1)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        }
      };
    case 'high':
      return {
        animation: 'highUrgencyPulse 2s infinite',
        '@keyframes highUrgencyPulse': {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        }
      };
    default:
      return {};
  }
};

const getMaximumUrgencyColor = (urgencyLevel: string) => {
  switch (urgencyLevel) {
    case 'maximum':
      return {
        color: '#d32f2f',
        bgColor: '#ffebee',
        borderColor: '#f44336',
        gradientColor: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
      };
    case 'critical':
      return {
        color: '#f57c00',
        bgColor: '#fff3e0',
        borderColor: '#ff9800',
        gradientColor: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)'
      };
    case 'high':
      return {
        color: '#1976d2',
        bgColor: '#e3f2fd',
        borderColor: '#2196f3',
        gradientColor: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
      };
    default:
      return {
        color: '#757575',
        bgColor: '#f5f5f5',
        borderColor: '#9e9e9e',
        gradientColor: 'linear-gradient(135deg, #757575 0%, #616161 100%)'
      };
  }
};

const getMaximumUrgencyIcon = (urgencyLevel: string) => {
  switch (urgencyLevel) {
    case 'maximum':
      return <FlashIcon sx={{ color: '#d32f2f' }} />;
    case 'critical':
      return <CriticalIcon sx={{ color: '#f57c00' }} />;
    case 'high':
      return <SpeedIcon sx={{ color: '#1976d2' }} />;
    default:
      return <InfoIcon sx={{ color: '#757575' }} />;
  }
};

const AdminEmergencyAlerts: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [lifeguards, setLifeguards] = useState<Lifeguard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'date' | 'severity'>('date');
  const [socketConnected, setSocketConnected] = useState(false);
  const [showAlertNotification, setShowAlertNotification] = useState(false);
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const [linkedEscalations, setLinkedEscalations] = useState<EmergencyEscalation[]>([]);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [escalationStatusDialogOpen, setEscalationStatusDialogOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<EmergencyEscalation | null>(null);
  const [newEscalationStatus, setNewEscalationStatus] = useState<string>('');
  const [centers, setCenters] = useState<Center[]>([]);
  const [supportFormData, setSupportFormData] = useState({
    target_center_id: '',
    escalation_id: '',
    request_type: 'personnel_support' as 'personnel_support' | 'equipment_support' | 'medical_support' | 'evacuation_support' | 'coordination_support',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    title: '',
    description: '',
    requested_resources: {}
  });

  const fetchAlerts = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setRefreshing(true);
      const alertsData = await apiService.getAlerts();
      
      // Check for new alerts
      if (lastAlertCount > 0 && alertsData.length > lastAlertCount) {
        const newCount = alertsData.length - lastAlertCount;
        setNewAlertsCount(newCount);
        // Clear the notification after 5 seconds
        setTimeout(() => setNewAlertsCount(0), 5000);
      }
      
      setAlerts(alertsData);
      setLastAlertCount(alertsData.length);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLifeguards = async () => {
    try {
      const lifeguardsData = await apiService.getLifeguards();
      setLifeguards(lifeguardsData);
    } catch (err: any) {
      console.error('Failed to load lifeguards:', err);
    }
  };

  const loadCenters = async () => {
    try {
      const centersData = await apiService.getOtherCenters();
      setCenters(centersData);
    } catch (err: any) {
      console.error('Failed to load centers:', err);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedAlert || !newStatus) return;
    
    try {
      await apiService.updateAlertStatus(selectedAlert.id, newStatus);
      setStatusDialogOpen(false);
      setNewStatus('');
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update alert status');
    }
  };

  const handleAlertClick = (alert: EmergencyAlert) => {
    setSelectedAlert(alert);
    setMapDialogOpen(true);
    loadLinkedEscalations(alert.id);
  };

  const loadLinkedEscalations = async (alertId: string) => {
    try {
      console.log('Loading linked escalations for alert:', alertId);
      const escalations = await apiService.getCenterEscalations(1, 100);
      console.log('All escalations received:', escalations);
      
      const linked = escalations.data.filter((escalation: EmergencyEscalation) => {
        console.log('Checking escalation:', escalation.id, 'alert_id:', escalation.alert_id, 'against:', alertId);
        return escalation.alert_id === alertId;
      });
      
      console.log('Linked escalations found:', linked);
      setLinkedEscalations(linked);
    } catch (err: any) {
      console.error('Failed to load linked escalations:', err);
    }
  };

  const handleRequestSupport = () => {
    // Initialize form with alert info
    setSupportFormData({
      target_center_id: '',
      escalation_id: linkedEscalations.length > 0 ? linkedEscalations[0].id : '',
      request_type: 'personnel_support',
      priority: 'medium',
      title: `Support for Alert ${selectedAlert?.id}`,
      description: '',
      requested_resources: {}
    });
    setSupportDialogOpen(true);
  };

  const handleSupportRequest = async () => {
    try {
      if (!supportFormData.target_center_id || !supportFormData.title || !supportFormData.description) {
        setError('Please fill in all required fields');
        return;
      }

      await apiService.createInterCenterSupportRequest({
        target_center_id: supportFormData.target_center_id,
        escalation_id: supportFormData.escalation_id || undefined,
        request_type: supportFormData.request_type,
        priority: supportFormData.priority,
        title: supportFormData.title,
        description: supportFormData.description,
        requested_resources: supportFormData.requested_resources
      });
      
      setSupportDialogOpen(false);
      setSupportFormData({
        target_center_id: '',
        escalation_id: '',
        request_type: 'personnel_support',
        priority: 'medium',
        title: '',
        description: '',
        requested_resources: {}
      });
      setError(null);
      // Show success notification
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request support');
    }
  };

  const handleSupportFormChange = (field: string, value: any) => {
    setSupportFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEscalationStatusUpdate = async () => {
    if (!selectedEscalation || !newEscalationStatus) return;
    
    try {
      if (newEscalationStatus === 'acknowledged') {
        await apiService.acknowledgeEscalation(selectedEscalation.id);
      } else if (newEscalationStatus === 'resolved') {
        await apiService.resolveEscalation(selectedEscalation.id);
      }
      
      setEscalationStatusDialogOpen(false);
      setNewEscalationStatus('');
      setSelectedEscalation(null);
      
      // Reload linked escalations to show updated status
      if (selectedAlert) {
        loadLinkedEscalations(selectedAlert.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update escalation status');
    }
  };

  const handleEscalationStatusClick = (escalation: EmergencyEscalation) => {
    setSelectedEscalation(escalation);
    setNewEscalationStatus('');
    setEscalationStatusDialogOpen(true);
  };

  // Load data on component mount
  useEffect(() => {
    fetchAlerts();
    loadLifeguards();
    loadCenters();
  }, []);

  // WebSocket connection and real-time updates
  useEffect(() => {
    if (!socket || !user?.center_info?.id) return;

    console.log('Setting up WebSocket connection for center admin alerts:', user.center_info.id);
    
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
      if (data.center_id === user?.center_info?.id) {
        console.log('Alert belongs to this center, refreshing data...');
        fetchAlerts();
        setShowAlertNotification(true);
        // Auto-hide notification after 5 seconds
        setTimeout(() => setShowAlertNotification(false), 5000);
      }
    });

    // Listen for alert status changes
    socket.on('alert_status_change', (data) => {
      console.log('Alert status change received:', data);
      fetchAlerts();
    });

    // Listen for alert acknowledgments
    socket.on('alert_acknowledged', (data) => {
      console.log('Alert acknowledged:', data);
      fetchAlerts();
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection for center admin alerts');
      socket.off('emergency_alert');
      socket.off('alert_status_change');
      socket.off('alert_acknowledged');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      setSocketConnected(false);
    };
  }, [socket, user?.center_info?.id]);

  const getAlertTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sos':
        return <EmergencyIcon />;
      case 'medical':
        return <MedicalIcon />;
      case 'drowning':
        return <DrowningIcon />;
      case 'weather':
        return <WeatherIcon />;
      default:
        return <EmergencyIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const alertTime = new Date(dateString);
      const timeDiff = now.getTime() - alertTime.getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      
      if (minutesAgo < 1) return 'Just now';
      if (minutesAgo < 60) return `${minutesAgo}m ago`;
      const hoursAgo = Math.floor(minutesAgo / 60);
      if (hoursAgo < 24) return `${hoursAgo}h ago`;
      const daysAgo = Math.floor(hoursAgo / 24);
      return `${daysAgo}d ago`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Sort alerts by selected order (date or severity)
  const sortedAndFilteredAlerts = alerts
    .sort((a, b) => {
      if (sortOrder === 'date') {
        // Sort by date (most recent first) then by severity
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        
        // Second priority: severity (critical first)
        const severityA = getSeverityConfig(a.severity).priority;
        const severityB = getSeverityConfig(b.severity).priority;
        if (severityA !== severityB) {
          return severityB - severityA;
        }
        
        // Third priority: status (active first)
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        
        return 0;
      } else {
        // Sort by severity (critical first) then by date
        const severityA = getSeverityConfig(a.severity).priority;
        const severityB = getSeverityConfig(b.severity).priority;
        if (severityA !== severityB) {
          return severityB - severityA;
        }
        
        // Second priority: status (active first)
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        
        // Third priority: time (most recent first)
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA;
      }
    });

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading Emergency Alerts...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Enhanced Header with Emergency Mode Indicators */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#fff', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: activeAlerts.length > 0 ? '#b71c1c' : '#757575',
              width: 64, 
              height: 64,
              border: activeAlerts.length > 0 ? '3px solid #ff1744' : 'none',
              ...(activeAlerts.length > 0 && {
                animation: 'maximumEmergencyPulse 1.5s infinite',
                '@keyframes maximumEmergencyPulse': {
                  '0%': { 
                    boxShadow: '0 0 0 0 #b71c1c',
                    transform: 'scale(1)',
                    borderColor: '#ff1744'
                  },
                  '50%': { 
                    boxShadow: '0 0 0 20px #b71c1c00',
                    transform: 'scale(1.1)',
                    borderColor: '#ff6b35'
                  },
                  '100%': { 
                    boxShadow: '0 0 0 0 #b71c1c00',
                    transform: 'scale(1)',
                    borderColor: '#ff1744'
                  }
                }
              })
            }}>
              <EmergencyIcon sx={{ 
                fontSize: 36,
                filter: activeAlerts.length > 0 ? 'drop-shadow(0 0 8px #ffffff)' : 'none'
              }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: activeAlerts.length > 0 ? '#d32f2f' : '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                Emergency Alerts Management
                {activeAlerts.length > 0 && (
                  <Chip
                    label={`${activeAlerts.length} ACTIVE`}
                    size="small"
                    sx={{
                      bgcolor: '#d32f2f',
                      color: '#ffffff',
                      fontWeight: 700,
                      animation: 'blink 1s infinite',
                      '@keyframes blink': {
                        '0%, 50%': { opacity: 1 },
                        '51%, 100%': { opacity: 0.5 }
                      }
                    }}
                  />
                )}
                {refreshing && (
                  <Chip
                    label="UPDATING"
                    size="small"
                    sx={{
                      bgcolor: '#1976d2',
                      color: '#ffffff',
                      fontWeight: 700,
                      animation: 'pulse 1s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.7 },
                        '100%': { opacity: 1 }
                      }
                    }}
                  />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeAlerts.length > 0 
                  ? `🚨 ${activeAlerts.length} active emergency${activeAlerts.length > 1 ? 's' : ''} requiring immediate attention`
                  : 'Real-time emergency response management for center administrators'
                }
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="sort-order-label">Sort By</InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                label="Sort By"
                onChange={(e) => setSortOrder(e.target.value as 'date' | 'severity')}
                sx={{ 
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: activeAlerts.length > 0 ? '#d32f2f' : '#1976d2'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: activeAlerts.length > 0 ? '#b71c1c' : '#1565c0'
                  }
                }}
              >
                <MenuItem value="date">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon sx={{ fontSize: 16 }} />
                    Date (Recent First)
                  </Box>
                </MenuItem>
                <MenuItem value="severity">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PriorityIcon sx={{ fontSize: 16 }} />
                    Severity (Critical First)
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={refreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              onClick={fetchAlerts}
              disabled={refreshing}
              sx={{ 
                borderRadius: 2, 
                bgcolor: activeAlerts.length > 0 ? '#d32f2f' : '#1976d2',
                '&:hover': { bgcolor: activeAlerts.length > 0 ? '#b71c1c' : '#1565c0' },
                '&:disabled': { bgcolor: '#ccc' }
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* New Alerts Notification */}
      {newAlertsCount > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            animation: 'slideIn 0.5s ease-out',
            '@keyframes slideIn': {
              '0%': { transform: 'translateY(-100%)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 }
            }
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setNewAlertsCount(0)}
            >
              Dismiss
            </Button>
          }
        >
          🚨 {newAlertsCount} new emergency alert{newAlertsCount > 1 ? 's' : ''} detected!
        </Alert>
      )}

      {/* Enhanced Alerts List View */}
      {sortedAndFilteredAlerts.length === 0 ? (
        <Paper elevation={0} sx={{ 
          textAlign: 'center', 
          py: 8, 
          bgcolor: '#fff',
          borderRadius: 3
        }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            No Active Alerts
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            All emergency alerts have been resolved. Great job!
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAlerts}
            sx={{ borderRadius: 2 }}
          >
            Refresh Alerts
          </Button>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ bgcolor: '#fff', borderRadius: 3, overflow: 'hidden' }}>
          <List sx={{ p: 0 }}>
            {sortedAndFilteredAlerts.map((alert, index) => {
              const severityConfig = getSeverityConfig(alert.severity);
              const statusConfig = getStatusConfig(alert.status);
              const urgencyLevel = getMaximumUrgencyLevel(alert);
              const urgencyConfig = getMaximumUrgencyColor(urgencyLevel);
              const urgencyAnimation = getMaximumUrgencyAnimation(urgencyLevel);
              const isActive = alert.status === 'active';
              const isRecent = new Date(alert.created_at).getTime() > Date.now() - 5 * 60 * 1000 && 
                              alert.status !== 'resolved' && alert.status !== 'closed'; // 5 minutes and not resolved/closed

              return (
                <Slide direction="up" in={true} timeout={300 + index * 100}>
                  <ListItem
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    sx={{
                      borderLeft: `6px solid ${severityConfig.color}`,
                      bgcolor: isActive ? `${severityConfig.bgColor}20` : 'transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isActive ? `${severityConfig.bgColor}40` : `${severityConfig.bgColor}10`,
                        transform: 'translateX(4px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      position: 'relative',
                      ...(isRecent && {
                        borderLeft: `6px solid ${urgencyConfig.borderColor}`,
                        bgcolor: `${urgencyConfig.borderColor}10`
                      })
                    }}
                  >
                    {/* Urgency Indicator */}
                    {isRecent && alert.status !== 'resolved' && alert.status !== 'closed' && (
                      <Box sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: urgencyConfig.gradientColor,
                        ...urgencyAnimation
                      }} />
                    )}

                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: severityConfig.color,
                        border: isActive ? `2px solid ${severityConfig.borderColor}` : 'none'
                      }}>
                        {getAlertTypeIcon(alert.alert_type)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {alert.alert_type.toUpperCase()} Alert
                          </Typography>
                          <Chip
                            label={severityConfig.label}
                            size="small"
                            sx={{
                              bgcolor: severityConfig.bgColor,
                              color: severityConfig.color,
                              fontWeight: 700,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            sx={{
                              bgcolor: statusConfig.bgColor,
                              color: statusConfig.color,
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Click to view details
                            </Typography>
                            <MapIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {alert.description || 'No description provided'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.75rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 14 }} />
                              {formatTimeAgo(alert.created_at)}
                            </Box>
                            {alert.location && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationIcon sx={{ fontSize: 14 }} />
                                Location Available
                              </Box>
                            )}
                          </Box>
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Status Update Action */}
                        <Tooltip title="Update Status">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                              setStatusDialogOpen(true);
                            }}
                            sx={{
                              color: '#1976d2',
                              '&:hover': { bgcolor: '#1976d220' }
                            }}
                          >
                            <AssignIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Slide>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Enhanced Map Dialog with Action Buttons */}
      <Dialog 
        open={mapDialogOpen} 
        onClose={() => setMapDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: selectedAlert ? getSeverityConfig(selectedAlert.severity).gradientColor : '#1a1a1a', 
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedAlert && getAlertTypeIcon(selectedAlert.alert_type)}
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {selectedAlert?.alert_type.toUpperCase()} Alert Details
            </Typography>
          </Box>
          <IconButton
            onClick={() => setMapDialogOpen(false)}
            sx={{ color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '70vh' }}>
          {selectedAlert && (
            <>
              {/* Alert Details Header */}
              <Paper sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 0 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {selectedAlert.alert_type.toUpperCase()} Alert
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {selectedAlert.description || 'No description provided'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Reported:</strong> {formatDate(selectedAlert.created_at)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={getSeverityConfig(selectedAlert.severity).label}
                          sx={{
                            bgcolor: getSeverityConfig(selectedAlert.severity).bgColor,
                            color: getSeverityConfig(selectedAlert.severity).color,
                            fontWeight: 700
                          }}
                          size="small"
                        />
                        <Chip
                          label={getStatusConfig(selectedAlert.status).label}
                          sx={{
                            bgcolor: getStatusConfig(selectedAlert.status).bgColor,
                            color: getStatusConfig(selectedAlert.status).color,
                            fontWeight: 600
                          }}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {/* Update Status Button */}
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<AssignIcon />}
                        onClick={() => setStatusDialogOpen(true)}
                        sx={{ 
                          bgcolor: '#1976d2',
                          '&:hover': { bgcolor: '#1565c0' },
                          borderRadius: 2,
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          fontSize: '1rem'
                        }}
                      >
                        Update Status
                      </Button>

                      {/* Request Support Button */}
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<SupportIcon />}
                        onClick={handleRequestSupport}
                        sx={{ 
                          bgcolor: '#f57c00',
                          '&:hover': { bgcolor: '#e65100' },
                          borderRadius: 2,
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          fontSize: '1rem'
                        }}
                      >
                        Request Support
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Map and Details Section */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Map Section */}
                <Box sx={{ flex: 1, minHeight: 400 }}>
                  {selectedAlert.location ? (
                    <BeachMap
                      alerts={[{
                        id: selectedAlert.id,
                        center_id: selectedAlert.center_id,
                        type: selectedAlert.alert_type as 'sos' | 'medical' | 'weather' | 'safety',
                        description: selectedAlert.description || 'No description provided',
                        status: selectedAlert.status === 'responding' ? 'active' : selectedAlert.status as 'active' | 'resolved',
                        location: {
                          lat: selectedAlert.location.coordinates[1],
                          lng: selectedAlert.location.coordinates[0]
                        },
                        created_at: selectedAlert.created_at
                      }]}
                      center={[selectedAlert.location.coordinates[1], selectedAlert.location.coordinates[0]]}
                      zoom={16}
                      showAlerts={true}
                      showUserLocation={false}
                      view="street"
                    />
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: '#f5f5f5'
                    }}>
                      <Typography variant="body1" color="text.secondary">
                        No location data available
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Details Section */}
                <Box sx={{ width: { xs: '100%', md: 300 }, p: 3, bgcolor: '#fff' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Alert Information
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Alert ID:</strong> {selectedAlert.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Status:</strong> {getStatusConfig(selectedAlert.status).label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Severity:</strong> {getSeverityConfig(selectedAlert.severity).label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Created:</strong> {formatDate(selectedAlert.created_at)}
                    </Typography>
                    {selectedAlert.resolved_at && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Resolved:</strong> {formatDate(selectedAlert.resolved_at)}
                      </Typography>
                    )}
                  </Box>

                  {/* Linked Escalations */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Linked Escalations ({linkedEscalations.length})
                    </Typography>
                    {linkedEscalations.length > 0 ? (
                      linkedEscalations.map((escalation) => (
                        <Paper key={escalation.id} sx={{ p: 2, mb: 1, bgcolor: '#f8fafc' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {escalation.escalation_type.replace('_', ' ').toUpperCase()}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleEscalationStatusClick(escalation)}
                              sx={{ ml: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {escalation.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                              label={escalation.status.toUpperCase()}
                              size="small"
                              color={
                                escalation.status === 'resolved' ? 'success' :
                                escalation.status === 'acknowledged' ? 'primary' :
                                escalation.status === 'responding' ? 'warning' :
                                'default'
                              }
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(escalation.created_at)}
                            </Typography>
                          </Box>
                        </Paper>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No linked escalations found for this alert.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Alert Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="responding">Responding</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Support Request Dialog */}
      <Dialog open={supportDialogOpen} onClose={() => setSupportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request Inter-Center Support</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Request support from other centers for this emergency alert.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Target Center Selection */}
            <FormControl fullWidth>
              <InputLabel>Target Center *</InputLabel>
              <Select
                value={supportFormData.target_center_id}
                label="Target Center *"
                onChange={(e) => handleSupportFormChange('target_center_id', e.target.value)}
              >
                {centers.map((center) => (
                  <MenuItem key={center.id} value={center.id}>
                    {center.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Escalation Linking */}
            {linkedEscalations.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Link to Escalation (Optional)</InputLabel>
                <Select
                  value={supportFormData.escalation_id}
                  label="Link to Escalation (Optional)"
                  onChange={(e) => handleSupportFormChange('escalation_id', e.target.value)}
                >
                  <MenuItem value="">
                    <em>No escalation linked</em>
                  </MenuItem>
                  {linkedEscalations.map((escalation) => (
                    <MenuItem key={escalation.id} value={escalation.id}>
                      {escalation.escalation_type.replace('_', ' ').toUpperCase()} - {escalation.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Request Type */}
            <FormControl fullWidth>
              <InputLabel>Request Type *</InputLabel>
              <Select
                value={supportFormData.request_type}
                label="Request Type *"
                onChange={(e) => handleSupportFormChange('request_type', e.target.value)}
              >
                <MenuItem value="personnel_support">Personnel Support</MenuItem>
                <MenuItem value="equipment_support">Equipment Support</MenuItem>
                <MenuItem value="medical_support">Medical Support</MenuItem>
                <MenuItem value="evacuation_support">Evacuation Support</MenuItem>
                <MenuItem value="coordination_support">Coordination Support</MenuItem>
              </Select>
            </FormControl>

            {/* Priority */}
            <FormControl fullWidth>
              <InputLabel>Priority *</InputLabel>
              <Select
                value={supportFormData.priority}
                label="Priority *"
                onChange={(e) => handleSupportFormChange('priority', e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            {/* Title */}
            <TextField
              fullWidth
              label="Title *"
              value={supportFormData.title}
              onChange={(e) => handleSupportFormChange('title', e.target.value)}
              variant="outlined"
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Description *"
              value={supportFormData.description}
              onChange={(e) => handleSupportFormChange('description', e.target.value)}
              variant="outlined"
              multiline
              rows={4}
              placeholder="Describe the support needed..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSupportDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSupportRequest} 
            variant="contained"
            disabled={!supportFormData.target_center_id || !supportFormData.title || !supportFormData.description}
          >
            Request Support
          </Button>
        </DialogActions>
      </Dialog>

      {/* Escalation Status Update Dialog */}
      <Dialog open={escalationStatusDialogOpen} onClose={() => setEscalationStatusDialogOpen(false)}>
        <DialogTitle>Update Escalation Status</DialogTitle>
        <DialogContent>
          {selectedEscalation && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Escalation Type:</strong> {selectedEscalation.escalation_type.replace('_', ' ').toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Current Status:</strong> {selectedEscalation.status.toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Description:</strong> {selectedEscalation.description}
              </Typography>
            </Box>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newEscalationStatus}
              label="New Status"
              onChange={(e) => setNewEscalationStatus(e.target.value)}
            >
              <MenuItem value="acknowledged">Acknowledged</MenuItem>
              <MenuItem value="responding">Responding</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEscalationStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleEscalationStatusUpdate} 
            variant="contained"
            disabled={!newEscalationStatus}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* WebSocket connection and real-time updates */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Tooltip title={socketConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}>
          <Avatar sx={{ 
            bgcolor: socketConnected ? '#4caf50' : '#f44336',
            width: 48,
            height: 48
          }}>
            {socketConnected ? <CheckCircleIcon /> : <ErrorIcon />}
          </Avatar>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default AdminEmergencyAlerts; 