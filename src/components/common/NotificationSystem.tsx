import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  People,
  AdminPanelSettings
} from '@mui/icons-material';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  type: 'new_escalation' | 'escalation_status_updated' | 'new_inter_center_support' | 'inter_center_support_status_updated' | 'emergency_alert' | 'alert_status_change';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  data?: any;
  timestamp: string;
  read: boolean;
}

const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [expanded, setExpanded] = useState(false);

  // WebSocket connection and real-time notifications
  useEffect(() => {
    if (!socket || !user) {
      console.log('NotificationSystem: WebSocket setup skipped - socket or user not available');
      return;
    }

    console.log('NotificationSystem: Setting up WebSocket connection for notifications');

    // Function to set up event listeners
    const setupEventListeners = () => {
      console.log('NotificationSystem: Setting up WebSocket event listeners');

      // Listen for new escalations
      const handleNewEscalation = (data: any) => {
        const notification: Notification = {
          id: `escalation_${data.id}_${Date.now()}`,
          type: 'new_escalation',
          title: 'New Emergency Escalation',
          message: `${data.escalation_type.replace('_', ' ')} escalation from ${data.lifeguardName}`,
          severity: getPrioritySeverity(data.priority),
          data,
          timestamp: data.timestamp,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setCurrentNotification(notification);
        setOpen(true);
      };

      // Listen for escalation status updates
      const handleEscalationStatusUpdate = (data: any) => {
        const notification: Notification = {
          id: `escalation_status_${data.escalationId}_${Date.now()}`,
          type: 'escalation_status_updated',
          title: 'Escalation Status Updated',
          message: `Escalation ${data.escalation_type.replace('_', ' ')} has been ${data.status}`,
          severity: getStatusSeverity(data.status),
          data,
          timestamp: data.timestamp,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setCurrentNotification(notification);
        setOpen(true);
      };

      // Listen for new inter-center support requests
      const handleNewInterCenterSupport = (data: any) => {
        const notification: Notification = {
          id: `support_${data.id}_${Date.now()}`,
          type: 'new_inter_center_support',
          title: 'New Inter-Center Support Request',
          message: `${data.request_type.replace('_', ' ')} request from ${data.requestingCenterName}`,
          severity: getPrioritySeverity(data.priority),
          data,
          timestamp: data.timestamp,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setCurrentNotification(notification);
        setOpen(true);
      };

      // Listen for inter-center support status updates
      const handleInterCenterSupportStatusUpdate = (data: any) => {
        const notification: Notification = {
          id: `support_status_${data.supportRequestId}_${Date.now()}`,
          type: 'inter_center_support_status_updated',
          title: 'Support Request Status Updated',
          message: `Support request ${data.requestType.replace('_', ' ')} has been ${data.status}`,
          severity: getStatusSeverity(data.status),
          data,
          timestamp: data.timestamp,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setCurrentNotification(notification);
        setOpen(true);
      };

      // Listen for emergency alerts (for center admins)
      const handleEmergencyAlert = (data: any) => {
        console.log('NotificationSystem: Emergency alert received:', data);
        const notification: Notification = {
          id: `emergency_${data.id}_${Date.now()}`,
          type: 'emergency_alert',
          title: 'New Emergency Alert',
          message: `${data.alert_type.toUpperCase()} alert - ${data.severity} severity`,
          severity: getSeveritySeverity(data.severity),
          data,
          timestamp: data.timestamp,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setCurrentNotification(notification);
        setOpen(true);
      };

      // Listen for alert status changes (for center admins)
      const handleAlertStatusChange = (data: any) => {
        console.log('NotificationSystem: Alert status change received:', data);
        const notification: Notification = {
          id: `alert_status_${data.alertId}_${Date.now()}`,
          type: 'alert_status_change',
          title: 'Alert Status Updated',
          message: `Emergency alert status changed to ${data.status}`,
          severity: getStatusSeverity(data.status),
          data,
          timestamp: data.timestamp,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setCurrentNotification(notification);
        setOpen(true);
      };

      // Listen for test emergency alerts (for debugging)
      const handleTestEmergencyAlert = (data: any) => {
        console.log('NotificationSystem: Test emergency alert received:', data);
        const notification: Notification = {
          id: `test_emergency_${data.id}_${Date.now()}`,
          type: 'emergency_alert',
          title: 'Test Emergency Alert',
          message: `TEST ${data.alert_type.toUpperCase()} alert - ${data.severity} severity`,
          severity: getSeveritySeverity(data.severity),
          data,
          timestamp: data.timestamp,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setCurrentNotification(notification);
        setOpen(true);
      };

      // Set up all event listeners
      socket.on('new_escalation', handleNewEscalation);
      socket.on('escalation_status_updated', handleEscalationStatusUpdate);
      socket.on('new_inter_center_support', handleNewInterCenterSupport);
      socket.on('inter_center_support_status_updated', handleInterCenterSupportStatusUpdate);
      socket.on('emergency_alert', handleEmergencyAlert);
      socket.on('alert_status_change', handleAlertStatusChange);
      socket.on('test_emergency_alert', handleTestEmergencyAlert);

      // Return cleanup function
      return () => {
        console.log('NotificationSystem: Cleaning up event listeners');
        socket.off('new_escalation', handleNewEscalation);
        socket.off('escalation_status_updated', handleEscalationStatusUpdate);
        socket.off('new_inter_center_support', handleNewInterCenterSupport);
        socket.off('inter_center_support_status_updated', handleInterCenterSupportStatusUpdate);
        socket.off('emergency_alert', handleEmergencyAlert);
        socket.off('alert_status_change', handleAlertStatusChange);
        socket.off('test_emergency_alert', handleTestEmergencyAlert);
      };
    };

    // Check socket connection status
    let cleanup: (() => void) | undefined;
    
    if (socket.connected) {
      console.log('NotificationSystem: Socket already connected, setting up listeners immediately');
      cleanup = setupEventListeners();
    } else {
      console.log('NotificationSystem: Socket not connected, waiting for connection...');
      socket.on('connect', () => {
        console.log('NotificationSystem: Socket connected after waiting, setting up listeners');
        cleanup = setupEventListeners();
      });
    }

    // Cleanup function
    return () => {
      console.log('NotificationSystem: Cleaning up WebSocket connection');
      if (cleanup) {
        cleanup();
      }
    };
  }, [socket, user]);

  const getPrioritySeverity = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'acknowledged': return 'info';
      case 'responding': return 'warning';
      case 'resolved': return 'success';
      case 'cancelled': return 'error';
      default: return 'info';
    }
  };

  const getSeveritySeverity = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getEscalationTypeIcon = (type: string) => {
    switch (type) {
      case 'backup_request': return <WarningIcon />;
      case 'medical_support': return <InfoIcon />;
      case 'equipment_request': return <InfoIcon />;
      case 'guidance_request': return <InfoIcon />;
      case 'evacuation_support': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const getEscalationTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSupportRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'personnel_support': return <People />;
      case 'equipment_support': return <InfoIcon />;
      case 'medical_support': return <InfoIcon />;
      case 'evacuation_support': return <ErrorIcon />;
      case 'coordination_support': return <AdminPanelSettings />;
      default: return <InfoIcon />;
    }
  };

  const getSupportRequestTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentNotification(null);
  };

  const handleNotificationClick = () => {
    setExpanded(!expanded);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user || user.role !== 'center_admin') {
    return null;
  }

  const renderNotificationDetails = (notification: Notification) => {
    if (notification.type === 'new_escalation' || notification.type === 'escalation_status_updated') {
      return (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" gutterBottom>
            <strong>Lifeguard:</strong> {notification.data.lifeguardName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Type:</strong> {getEscalationTypeLabel(notification.data.escalationType)}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Priority:</strong> 
            <Chip 
              label={notification.data.priority} 
              size="small" 
              color={getPrioritySeverity(notification.data.priority) as any}
              sx={{ ml: 1 }}
            />
          </Typography>
          {notification.data.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Description:</strong> {notification.data.description}
            </Typography>
          )}
          {notification.data.alertType && (
            <Typography variant="body2">
              <strong>Linked Alert:</strong> {notification.data.alertType} ({notification.data.alertSeverity})
            </Typography>
          )}
        </Box>
      );
    }

    if (notification.type === 'new_inter_center_support' || notification.type === 'inter_center_support_status_updated') {
      return (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" gutterBottom>
            <strong>Requesting Center:</strong> {notification.data.requestingCenterName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Requesting Admin:</strong> {notification.data.requestingAdminName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Type:</strong> {getSupportRequestTypeLabel(notification.data.requestType)}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Priority:</strong> 
            <Chip 
              label={notification.data.priority} 
              size="small" 
              color={getPrioritySeverity(notification.data.priority) as any}
              sx={{ ml: 1 }}
            />
          </Typography>
          {notification.data.title && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Title:</strong> {notification.data.title}
            </Typography>
          )}
          {notification.data.description && (
            <Typography variant="body2">
              <strong>Description:</strong> {notification.data.description}
            </Typography>
          )}
        </Box>
      );
    }

    if (notification.type === 'emergency_alert') {
      return (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" gutterBottom>
            <strong>Alert Type:</strong> {notification.data.alert_type.toUpperCase()}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Severity:</strong> {notification.data.severity}
          </Typography>
          {notification.data.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Description:</strong> {notification.data.description}
            </Typography>
          )}
        </Box>
      );
    }

    if (notification.type === 'alert_status_change') {
      return (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" gutterBottom>
            <strong>Alert Status:</strong> {notification.data.status}
          </Typography>
          {notification.data.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Description:</strong> {notification.data.description}
            </Typography>
          )}
        </Box>
      );
    }

    return null;
  };

  return (
    <>
      {/* Main notification snackbar */}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={handleClose}
          severity={currentNotification?.severity}
          sx={{ width: '100%', minWidth: 400 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={handleNotificationClick}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        >
          <AlertTitle>{currentNotification?.title}</AlertTitle>
          {currentNotification?.message}
          
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            {currentNotification && renderNotificationDetails(currentNotification)}
          </Collapse>
        </Alert>
      </Snackbar>

      {/* Notification history panel */}
      {notifications.length > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            top: 80,
            right: 20,
            width: 350,
            maxHeight: 500,
            overflow: 'auto',
            zIndex: 1000,
            p: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Typography>
            <IconButton size="small" onClick={() => setNotifications([])}>
              <CloseIcon />
            </IconButton>
          </Box>

          {notifications.map((notification) => (
            <Box
              key={notification.id}
              sx={{
                p: 1,
                mb: 1,
                border: 1,
                borderColor: notification.read ? 'divider' : 'primary.main',
                borderRadius: 1,
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                cursor: 'pointer'
              }}
              onClick={() => markAsRead(notification.id)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </>
  );
};

export default NotificationSystem; 