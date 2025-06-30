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
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  type: 'new_escalation' | 'escalation_status_updated';
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

  useEffect(() => {
    if (!socket || !user) return;

    // Join center room for center admins
    if (user.role === 'center_admin' && user.center_id) {
      socket.emit('join_center', user.center_id);
    }

    // Listen for new escalation notifications
    const handleNewEscalation = (data: any) => {
      const notification: Notification = {
        id: `escalation_${data.escalationId}_${Date.now()}`,
        type: 'new_escalation',
        title: 'New Emergency Escalation',
        message: `${data.lifeguardName} has requested ${data.escalationType.replace('_', ' ')} support`,
        severity: getPrioritySeverity(data.priority),
        data,
        timestamp: data.timestamp,
        read: false
      };

      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
      setCurrentNotification(notification);
      setOpen(true);
    };

    // Listen for escalation status updates
    const handleEscalationStatusUpdate = (data: any) => {
      const notification: Notification = {
        id: `status_${data.escalationId}_${Date.now()}`,
        type: 'escalation_status_updated',
        title: 'Escalation Status Updated',
        message: `Escalation ${data.escalationType.replace('_', ' ')} has been ${data.status}`,
        severity: getStatusSeverity(data.status),
        data,
        timestamp: data.timestamp,
        read: false
      };

      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
      setCurrentNotification(notification);
      setOpen(true);
    };

    socket.on('new_escalation', handleNewEscalation);
    socket.on('escalation_status_updated', handleEscalationStatusUpdate);

    return () => {
      socket.off('new_escalation', handleNewEscalation);
      socket.off('escalation_status_updated', handleEscalationStatusUpdate);
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
            {currentNotification?.data && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Lifeguard:</strong> {currentNotification.data.lifeguardName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Type:</strong> {getEscalationTypeLabel(currentNotification.data.escalationType)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Priority:</strong> 
                  <Chip 
                    label={currentNotification.data.priority} 
                    size="small" 
                    color={getPrioritySeverity(currentNotification.data.priority) as any}
                    sx={{ ml: 1 }}
                  />
                </Typography>
                {currentNotification.data.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Description:</strong> {currentNotification.data.description}
                  </Typography>
                )}
                {currentNotification.data.alertType && (
                  <Typography variant="body2">
                    <strong>Linked Alert:</strong> {currentNotification.data.alertType} ({currentNotification.data.alertSeverity})
                  </Typography>
                )}
              </Box>
            )}
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