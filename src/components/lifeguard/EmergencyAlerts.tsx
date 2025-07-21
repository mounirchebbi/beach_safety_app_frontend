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
  Block as CloseActionIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { EmergencyAlert, EmergencyEscalation, EscalationFormData, IncidentReportFormData } from '../../types';
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
        urgency: 'Immediate Response Required'
      };
    case 'high':
      return {
        color: '#f57c00',
        bgColor: '#fff3e0',
        borderColor: '#ff9800',
        gradientColor: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
        icon: <EmergencyIcon />,
        label: 'HIGH',
        priority: 3,
        urgency: 'Urgent Response Required'
      };
    case 'medium':
      return {
        color: '#1976d2',
        bgColor: '#e3f2fd',
        borderColor: '#2196f3',
        gradientColor: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        icon: <WarningIcon />,
        label: 'MEDIUM',
        priority: 2,
        urgency: 'Moderate Response Required'
      };
    case 'low':
      return {
        color: '#388e3c',
        bgColor: '#e8f5e8',
        borderColor: '#4caf50',
        gradientColor: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
        icon: <InfoIcon />,
        label: 'LOW',
        priority: 1,
        urgency: 'Standard Response'
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
        urgency: 'Response Required'
      };
  }
};

// Enhanced status configuration
const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return {
        color: '#d32f2f',
        bgColor: '#ffebee',
        icon: <ActiveIcon />,
        label: 'ACTIVE',
        action: 'Respond Now'
      };
    case 'responding':
      return {
        color: '#f57c00',
        bgColor: '#fff3e0',
        icon: <SpeedIcon />,
        label: 'RESPONDING',
        action: 'Update Status'
      };
    case 'resolved':
      return {
        color: '#388e3c',
        bgColor: '#e8f5e8',
        icon: <ResolvedIcon />,
        label: 'RESOLVED',
        action: 'View Details'
      };
    case 'closed':
      return {
        color: '#757575',
        bgColor: '#f5f5f5',
        icon: <ClosedIcon />,
        label: 'CLOSED',
        action: 'View Details'
      };
    default:
      return {
        color: '#757575',
        bgColor: '#f5f5f5',
        icon: <InactiveIcon />,
        label: 'UNKNOWN',
        action: 'View Details'
      };
  }
};

// Maximum urgency configuration for ultimate visual impact
const getMaximumUrgencyLevel = (alert: EmergencyAlert) => {
  // Resolved or closed alerts should not have urgency indicators
  if (alert.status === 'resolved' || alert.status === 'closed') {
    return 'LOW_URGENCY';
  }

  const now = new Date();
  const alertTime = new Date(alert.created_at);
  const timeDiff = now.getTime() - alertTime.getTime();
  const minutesAgo = Math.floor(timeDiff / (1000 * 60));
  
  // Critical alerts within 1 minute are EXTREME_URGENCY
  if (alert.severity === 'critical' && minutesAgo <= 1) return 'EXTREME_URGENCY';
  // Critical alerts within 3 minutes are URGENT
  if (alert.severity === 'critical' && minutesAgo <= 3) return 'URGENT';
  // High severity alerts within 3 minutes are HIGH_URGENCY
  if (alert.severity === 'high' && minutesAgo <= 3) return 'HIGH_URGENCY';
  // Any alert within 5 minutes is MEDIUM_URGENCY
  if (minutesAgo <= 5) return 'MEDIUM_URGENCY';
  // Older alerts are LOW_URGENCY
  return 'LOW_URGENCY';
};

const getMaximumUrgencyAnimation = (urgencyLevel: string) => {
  switch (urgencyLevel) {
    case 'EXTREME_URGENCY':
      return {
        animation: 'extremeUrgencyPulse 0.5s infinite',
        '@keyframes extremeUrgencyPulse': {
          '0%': { 
            boxShadow: '0 0 0 0 #b71c1c',
            transform: 'scale(1)',
            borderColor: '#b71c1c'
          },
          '50%': { 
            boxShadow: '0 0 0 30px #b71c1c00',
            transform: 'scale(1.05)',
            borderColor: '#ff1744'
          },
          '100%': { 
            boxShadow: '0 0 0 0 #b71c1c00',
            transform: 'scale(1)',
            borderColor: '#b71c1c'
          }
        }
      };
    case 'URGENT':
      return {
        animation: 'urgentPulse 0.8s infinite',
        '@keyframes urgentPulse': {
          '0%': { 
            boxShadow: '0 0 0 0 #d32f2f',
            transform: 'scale(1)'
          },
          '70%': { 
            boxShadow: '0 0 0 25px #d32f2f00',
            transform: 'scale(1.03)'
          },
          '100%': { 
            boxShadow: '0 0 0 0 #d32f2f00',
            transform: 'scale(1)'
          }
        }
      };
    case 'HIGH_URGENCY':
      return {
        animation: 'highUrgencyPulse 1.2s infinite',
        '@keyframes highUrgencyPulse': {
          '0%': { 
            boxShadow: '0 0 0 0 #f57c00',
            transform: 'scale(1)'
          },
          '70%': { 
            boxShadow: '0 0 0 20px #f57c0000',
            transform: 'scale(1.02)'
          },
          '100%': { 
            boxShadow: '0 0 0 0 #f57c0000',
            transform: 'scale(1)'
          }
        }
      };
    case 'MEDIUM_URGENCY':
      return {
        animation: 'mediumUrgencyPulse 1.5s infinite',
        '@keyframes mediumUrgencyPulse': {
          '0%': { 
            boxShadow: '0 0 0 0 #1976d2',
            transform: 'scale(1)'
          },
          '70%': { 
            boxShadow: '0 0 0 15px #1976d200',
            transform: 'scale(1.01)'
          },
          '100%': { 
            boxShadow: '0 0 0 0 #1976d200',
            transform: 'scale(1)'
          }
        }
      };
    default:
      return {};
  }
};

const getMaximumUrgencyColor = (urgencyLevel: string) => {
  switch (urgencyLevel) {
    case 'EXTREME_URGENCY':
      return {
        borderColor: '#b71c1c',
        gradientColor: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
        shadowColor: '#b71c1c40',
        glowColor: '#ff1744'
      };
    case 'URGENT':
      return {
        borderColor: '#d32f2f',
        gradientColor: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
        shadowColor: '#d32f2f40',
        glowColor: '#ff6b35'
      };
    case 'HIGH_URGENCY':
      return {
        borderColor: '#f57c00',
        gradientColor: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
        shadowColor: '#f57c0040',
        glowColor: '#ffb74d'
      };
    case 'MEDIUM_URGENCY':
      return {
        borderColor: '#1976d2',
        gradientColor: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
        shadowColor: '#1976d240',
        glowColor: '#64b5f6'
      };
    default:
      return {
        borderColor: '#757575',
        gradientColor: 'linear-gradient(135deg, #757575 0%, #9e9e9e 100%)',
        shadowColor: '#75757540',
        glowColor: '#bdbdbd'
      };
  }
};

const getMaximumUrgencyIcon = (urgencyLevel: string) => {
  switch (urgencyLevel) {
    case 'EXTREME_URGENCY':
      return <FlashIcon sx={{ color: '#ffffff', fontSize: 20 }} />;
    case 'URGENT':
      return <CriticalIcon sx={{ color: '#ffffff', fontSize: 20 }} />;
    case 'HIGH_URGENCY':
      return <EmergencyIcon sx={{ color: '#ffffff', fontSize: 20 }} />;
    case 'MEDIUM_URGENCY':
      return <WarningIcon sx={{ color: '#ffffff', fontSize: 20 }} />;
    default:
      return <InfoIcon sx={{ color: '#ffffff', fontSize: 20 }} />;
  }
};

const EmergencyAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [escalationDialogOpen, setEscalationDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [escalationFormData, setEscalationFormData] = useState<EscalationFormData>({
    alert_id: '',
    escalation_type: 'backup_request',
    priority: 'medium',
    description: '',
    requested_resources: {}
  });
  const [refreshing, setRefreshing] = useState(false);
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<'date' | 'severity'>('date');
  const [incidentReportDialogOpen, setIncidentReportDialogOpen] = useState(false);
  const [incidentReportFormData, setIncidentReportFormData] = useState<IncidentReportFormData>({
    alert_id: '',
    incident_type: 'False Alert',
    description: 'False alert - no actual emergency occurred',
    action_taken: 'Alert was investigated and determined to be false',
    outcome: 'Alert resolved - no action required'
  });
  const [submittingIncidentReport, setSubmittingIncidentReport] = useState(false);

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

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Auto-refresh alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = socketService.connect();
    
    // Listen for new emergency alerts
    socketService.onEmergencyAlert((data) => {
      console.log('New emergency alert received:', data);
      // Fetch updated alerts
      fetchAlerts();
    });

    // Listen for alert status changes
    socketService.onAlertStatusChange((data) => {
      console.log('Alert status changed:', data);
      // Fetch updated alerts
      fetchAlerts();
    });

    // Cleanup socket listeners on unmount
    return () => {
      socketService.offEmergencyAlert();
      socketService.offAlertStatusChange();
    };
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedAlert || !newStatus) return;
    
    try {
      await apiService.updateAlertStatus(selectedAlert.id, newStatus);
      setStatusDialogOpen(false);
      setNewStatus('');
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAlertClick = (alert: EmergencyAlert) => {
    setSelectedAlert(alert);
    // Add a small delay to ensure the dialog container is ready for the map
    setTimeout(() => {
      setMapDialogOpen(true);
    }, 100);
  };

  const handleRespondNow = async (alert: EmergencyAlert) => {
    try {
      await apiService.updateAlertStatus(alert.id, 'responding');
      setMapDialogOpen(false);
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to respond to alert');
    }
  };

  const handleResolveAlert = async (alert: EmergencyAlert) => {
    // Pre-fill the incident report form with alert data and default "false alert" values
    setIncidentReportFormData({
      alert_id: alert.id,
      incident_type: 'False Alert',
      description: 'False alert - no actual emergency occurred',
      action_taken: 'Alert was investigated and determined to be false',
      outcome: 'Alert resolved - no action required'
    });
    setSelectedAlert(alert);
    setIncidentReportDialogOpen(true);
  };

  const handleCloseAlert = async (alert: EmergencyAlert) => {
    try {
      await apiService.updateAlertStatus(alert.id, 'closed');
      setMapDialogOpen(false);
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to close alert');
    }
  };

  // Handle incident report form changes
  const handleIncidentReportFormChange = (field: keyof IncidentReportFormData, value: any) => {
    setIncidentReportFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle incident report submission
  const handleIncidentReportSubmit = async () => {
    if (!selectedAlert) return;

    try {
      setSubmittingIncidentReport(true);
      
      // Create the incident report
      await apiService.createIncidentReport(incidentReportFormData);
      
      // Update the alert status to resolved
      await apiService.updateAlertStatus(selectedAlert.id, 'resolved');
      
      // Close dialogs and refresh
      setIncidentReportDialogOpen(false);
      setMapDialogOpen(false);
      setSelectedAlert(null);
      fetchAlerts();
      
      // Show success message
      // setSuccess('Alert resolved and incident report created successfully'); // This line was removed as per the edit hint
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create incident report and resolve alert');
    } finally {
      setSubmittingIncidentReport(false);
    }
  };

  const handleEscalate = (alert: EmergencyAlert) => {
    setEscalationFormData({
      alert_id: alert.id,
      escalation_type: 'backup_request',
      priority: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'medium',
      description: `Escalation for ${alert.alert_type} alert: ${alert.description || 'No description'}`,
      requested_resources: {}
    });
    setEscalationDialogOpen(true);
  };

  const handleCreateEscalation = async () => {
    try {
      await apiService.createEscalation(escalationFormData);
      setEscalationDialogOpen(false);
      setEscalationFormData({
        alert_id: '',
        escalation_type: 'backup_request',
        priority: 'medium',
        description: '',
        requested_resources: {}
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create escalation');
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sos': return <EmergencyIcon />;
      case 'medical': return <MedicalIcon />;
      case 'drowning': return <DrowningIcon />;
      case 'weather': return <WeatherIcon />;
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

  const formatTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const alertTime = new Date(dateString);
      
      if (isNaN(alertTime.getTime())) {
        return 'Invalid Date';
      }
      
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
                Emergency Alerts
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
                  : 'Real-time emergency response management'
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
                        {/* Active Alert Actions */}
                        {alert.status === 'active' && (
                          <>
                            <Tooltip title="Respond Now">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRespondNow(alert);
                                }}
                                sx={{
                                  color: '#4caf50',
                                  '&:hover': { bgcolor: '#4caf5020' }
                                }}
                              >
                                <RespondIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Escalate">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEscalate(alert);
                                }}
                                sx={{
                                  color: '#f57c00',
                                  '&:hover': { bgcolor: '#f57c0020' }
                                }}
                              >
                                <EscalateIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {/* Responding Alert Actions */}
                        {alert.status === 'responding' && (
                          <>
                            <Tooltip title="Resolve Alert">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolveAlert(alert);
                                }}
                                sx={{
                                  color: '#388e3c',
                                  '&:hover': { bgcolor: '#388e3c20' }
                                }}
                              >
                                <ResolveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Escalate">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEscalate(alert);
                                }}
                                sx={{
                                  color: '#f57c00',
                                  '&:hover': { bgcolor: '#f57c0020' }
                                }}
                              >
                                <EscalateIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {/* Resolved Alert Actions */}
                        {alert.status === 'resolved' && (
                          <Tooltip title="Close Alert">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseAlert(alert);
                              }}
                              sx={{
                                color: '#757575',
                                '&:hover': { bgcolor: '#75757520' }
                              }}
                            >
                              <CloseActionIcon />
                            </IconButton>
                          </Tooltip>
                        )}
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
                      {/* Respond Now - Only show for active alerts */}
                      {selectedAlert.status === 'active' && (
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<RespondIcon />}
                          onClick={() => handleRespondNow(selectedAlert)}
                          sx={{ 
                            bgcolor: '#4caf50',
                            '&:hover': { bgcolor: '#388e3c' },
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        >
                          Respond Now
                        </Button>
                      )}

                      {/* Resolve Alert - Show for responding alerts */}
                      {selectedAlert.status === 'responding' && (
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<ResolveIcon />}
                          onClick={() => handleResolveAlert(selectedAlert)}
                          sx={{ 
                            bgcolor: '#388e3c',
                            '&:hover': { bgcolor: '#2e7d32' },
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        >
                          Resolve Alert
                        </Button>
                      )}

                      {/* Close Alert - Show for resolved alerts */}
                      {selectedAlert.status === 'resolved' && (
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<CloseActionIcon />}
                          onClick={() => handleCloseAlert(selectedAlert)}
                          sx={{ 
                            bgcolor: '#757575',
                            '&:hover': { bgcolor: '#616161' },
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        >
                          Close Alert
                        </Button>
                      )}

                      {/* Escalate - Show for active and responding alerts */}
                      {(selectedAlert.status === 'active' || selectedAlert.status === 'responding') && (
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<EscalateIcon />}
                          onClick={() => {
                            setMapDialogOpen(false);
                            handleEscalate(selectedAlert);
                          }}
                          sx={{ 
                            bgcolor: '#f57c00',
                            '&:hover': { bgcolor: '#ef6c00' },
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        >
                          Escalate
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Map Container */}
              <Box sx={{ flex: 1, p: 2, pt: 0 }}>
                {selectedAlert.location?.coordinates ? (
                  <BeachMap
                    key={`alert-map-${selectedAlert.id}-${mapDialogOpen}`} // Force re-render when dialog opens
                    alerts={[{
                      id: selectedAlert.id,
                      center_id: selectedAlert.center_id,
                      type: selectedAlert.alert_type as any,
                      location: {
                        lat: selectedAlert.location.coordinates[1],
                        lng: selectedAlert.location.coordinates[0]
                      },
                      description: selectedAlert.description || '',
                      status: selectedAlert.status as any,
                      created_at: selectedAlert.created_at
                    }]}
                    center={[
                      selectedAlert.location.coordinates[1],
                      selectedAlert.location.coordinates[0]
                    ]}
                    zoom={16}
                    showAlerts={true}
                    showUserLocation={false}
                    showSafetyZones={false}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      bgcolor: 'grey.100',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      No location data available for this alert
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Escalation Dialog */}
      <Dialog open={escalationDialogOpen} onClose={() => setEscalationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: '#f57c00', 
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EscalateIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Emergency Escalation
            </Typography>
          </Box>
          <IconButton
            onClick={() => setEscalationDialogOpen(false)}
            sx={{ color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" gutterBottom>
            This will create an emergency escalation for the selected alert. 
            Additional resources and support will be notified.
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Escalation Type</InputLabel>
                  <Select
                    value={escalationFormData.escalation_type}
                    onChange={(e) => setEscalationFormData({
                      ...escalationFormData,
                      escalation_type: e.target.value as any
                    })}
                    label="Escalation Type"
                  >
                    <MenuItem value="backup_request">Backup Request</MenuItem>
                    <MenuItem value="medical_support">Medical Support</MenuItem>
                    <MenuItem value="equipment_request">Equipment Request</MenuItem>
                    <MenuItem value="guidance_request">Guidance Request</MenuItem>
                    <MenuItem value="evacuation_support">Evacuation Support</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    value={escalationFormData.priority}
                    onChange={(e) => setEscalationFormData({
                      ...escalationFormData,
                      priority: e.target.value as any
                    })}
                    label="Priority Level"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={escalationFormData.description}
                  onChange={(e) => setEscalationFormData({
                    ...escalationFormData,
                    description: e.target.value
                  })}
                  placeholder="Describe the reason for escalation and required resources..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setEscalationDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateEscalation}
            variant="contained"
            disabled={!escalationFormData.description}
            sx={{ 
              borderRadius: 2,
              bgcolor: '#f57c00',
              '&:hover': { bgcolor: '#ef6c00' }
            }}
          >
            Create Escalation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Incident Report Dialog */}
      <Dialog open={incidentReportDialogOpen} onClose={() => setIncidentReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: '#388e3c', 
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ResolveIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Incident Report for Alert
            </Typography>
          </Box>
          <IconButton
            onClick={() => setIncidentReportDialogOpen(false)}
            sx={{ color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" gutterBottom>
            This will create an incident report for the selected alert and mark it as resolved.
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Incident Type</InputLabel>
                  <Select
                    value={incidentReportFormData.incident_type}
                    onChange={(e) => handleIncidentReportFormChange('incident_type', e.target.value as any)}
                    label="Incident Type"
                  >
                    <MenuItem value="False Alert">False Alert</MenuItem>
                    <MenuItem value="Drowning Rescue">Drowning Rescue</MenuItem>
                    <MenuItem value="Medical Emergency">Medical Emergency</MenuItem>
                    <MenuItem value="Lost Child">Lost Child</MenuItem>
                    <MenuItem value="Equipment Failure">Equipment Failure</MenuItem>
                    <MenuItem value="Beach Safety Violation">Beach Safety Violation</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={incidentReportFormData.description}
                  onChange={(e) => handleIncidentReportFormChange('description', e.target.value)}
                  placeholder="Describe the incident and its outcome..."
                  InputProps={{
                    sx: {
                      '& .MuiInputBase-input': {
                        color: incidentReportFormData.description === 'False alert - no actual emergency occurred' ? 'grey.500' : 'inherit'
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Action Taken"
                  multiline
                  rows={4}
                  value={incidentReportFormData.action_taken}
                  onChange={(e) => handleIncidentReportFormChange('action_taken', e.target.value)}
                  placeholder="What actions were taken to address the incident?"
                  InputProps={{
                    sx: {
                      '& .MuiInputBase-input': {
                        color: incidentReportFormData.action_taken === 'Alert was investigated and determined to be false' ? 'grey.500' : 'inherit'
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Outcome</InputLabel>
                  <Select
                    value={incidentReportFormData.outcome}
                    onChange={(e) => handleIncidentReportFormChange('outcome', e.target.value as any)}
                    label="Outcome"
                    sx={{
                      '& .MuiSelect-select': {
                        color: incidentReportFormData.outcome === 'Alert resolved - no action required' ? 'grey.500' : 'inherit'
                      }
                    }}
                  >
                    <MenuItem value="Alert resolved - no action required">Alert resolved - no action required</MenuItem>
                    <MenuItem value="Action taken, incident still ongoing">Action taken, incident still ongoing</MenuItem>
                    <MenuItem value="Incident escalated">Incident escalated</MenuItem>
                    <MenuItem value="Incident resolved">Incident resolved</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setIncidentReportDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleIncidentReportSubmit}
            variant="contained"
            disabled={!incidentReportFormData.description || submittingIncidentReport}
            sx={{ 
              borderRadius: 2,
              bgcolor: '#388e3c',
              '&:hover': { bgcolor: '#2e7d32' }
            }}
          >
            {submittingIncidentReport ? 'Submitting...' : 'Submit Incident Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyAlerts; 