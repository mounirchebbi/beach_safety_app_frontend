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
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  CheckCircle as AcknowledgeIcon,
  Done as ResolveIcon,
  Cancel as DeclineIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { Center } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SupportRequest {
  id: string;
  request_type: string;
  priority: string;
  title: string;
  description: string;
  requested_resources?: any;
  status: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  declined_reason?: string;
  escalation_id?: string;
  requesting_center_name?: string;
  requesting_admin_first_name?: string;
  requesting_admin_last_name?: string;
  requesting_admin_email?: string;
  target_center_name?: string;
  acknowledged_by_first_name?: string;
  acknowledged_by_last_name?: string;
  escalation_type?: string;
  escalation_priority?: string;
}

const InterCenterSupport: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Socket connection for real-time updates
  const socket = useSocket();

  // Form state for creating support request
  const [formData, setFormData] = useState({
    target_center_id: '',
    escalation_id: '',
    request_type: '',
    priority: 'medium',
    title: '',
    description: '',
    requested_resources: {}
  });

  // Fetch available centers (excluding current user's center)
  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: async () => {
      const allCenters = await apiService.getPublicCenters();
      return allCenters.filter((center) => center.id !== user?.center_id);
    },
    enabled: !!user?.center_id
  });

  // Fetch escalations for linking
  const { data: escalations = [] } = useQuery({
    queryKey: ['escalations'],
    queryFn: async () => {
      // You may want to filter by center or user, adjust as needed
      const result = await apiService.getCenterEscalations();
      return result.data;
    }
  });

  // Fetch incoming support requests
  const { data: incomingRequests = [], isLoading: incomingLoading, error: incomingError } = useQuery({
    queryKey: ['inter-center-support', 'incoming'],
    queryFn: async () => {
      console.log('Fetching incoming support requests...');
      try {
        const result = await apiService.getIncomingSupportRequests();
        console.log('Incoming requests result:', result);
        return result.data;
      } catch (error) {
        console.error('Error fetching incoming requests:', error);
        throw error;
      }
    }
  });

  // Fetch outgoing support requests
  const { data: outgoingRequests = [], isLoading: outgoingLoading, error: outgoingError } = useQuery({
    queryKey: ['inter-center-support', 'outgoing'],
    queryFn: async () => {
      console.log('Fetching outgoing support requests...');
      try {
        const result = await apiService.getOutgoingSupportRequests();
        console.log('Outgoing requests result:', result);
        return result.data;
      } catch (error) {
        console.error('Error fetching outgoing requests:', error);
        throw error;
      }
    }
  });

  // Create support request mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiService.createInterCenterSupportRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inter-center-support'] });
      setOpenCreateDialog(false);
      setFormData({
        target_center_id: '',
        escalation_id: '',
        request_type: '',
        priority: 'medium',
        title: '',
        description: '',
        requested_resources: {}
      });
      setNotification({ type: 'success', message: 'Support request created successfully' });
    },
    onError: (error: any) => {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Failed to create support request' });
    }
  });

  // Acknowledge support request mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiService.acknowledgeSupportRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inter-center-support'] });
      setNotification({ type: 'success', message: 'Support request acknowledged' });
    },
    onError: (error: any) => {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Failed to acknowledge request' });
    }
  });

  // Resolve support request mutation
  const resolveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiService.resolveSupportRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inter-center-support'] });
      setNotification({ type: 'success', message: 'Support request resolved' });
    },
    onError: (error: any) => {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Failed to resolve request' });
    }
  });

  // Decline support request mutation
  const declineMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      return await apiService.declineSupportRequest(requestId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inter-center-support'] });
      setNotification({ type: 'success', message: 'Support request declined' });
    },
    onError: (error: any) => {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Failed to decline request' });
    }
  });

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewSupportRequest = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['inter-center-support', 'incoming'] });
      setNotification({ type: 'success', message: `New support request received: ${data.title}` });
    };

    const handleSupportStatusUpdate = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['inter-center-support'] });
      setNotification({ type: 'success', message: `Support request ${data.status}: ${data.title}` });
    };

    socket.on('new_inter_center_support', handleNewSupportRequest);
    socket.on('inter_center_support_status_updated', handleSupportStatusUpdate);

    return () => {
      socket.off('new_inter_center_support', handleNewSupportRequest);
      socket.off('inter_center_support_status_updated', handleSupportStatusUpdate);
    };
  }, [socket, queryClient]);

  const handleCreateRequest = () => {
    // Normalize escalation_id - convert empty string to null
    const normalizedFormData = {
      ...formData,
      escalation_id: formData.escalation_id && formData.escalation_id.trim() !== '' ? formData.escalation_id : null
    };
    createMutation.mutate(normalizedFormData);
  };

  const handleViewRequest = (request: SupportRequest) => {
    setSelectedRequest(request);
    setOpenViewDialog(true);
  };

  const handleAcknowledge = (requestId: string) => {
    acknowledgeMutation.mutate(requestId);
  };

  const handleResolve = (requestId: string) => {
    resolveMutation.mutate(requestId);
  };

  const handleDecline = (requestId: string) => {
    const reason = prompt('Please provide a reason for declining this request:');
    if (reason) {
      declineMutation.mutate({ requestId, reason });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'acknowledged': return 'info';
      case 'responding': return 'primary';
      case 'resolved': return 'success';
      case 'declined': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      personnel_support: 'Personnel Support',
      equipment_support: 'Equipment Support',
      medical_support: 'Medical Support',
      evacuation_support: 'Evacuation Support',
      coordination_support: 'Coordination Support'
    };
    return labels[type] || type;
  };

  const renderRequestCard = (request: SupportRequest, isIncoming: boolean = false) => (
    <Card key={request.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {request.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {isIncoming ? `From: ${request.requesting_center_name}` : `To: ${request.target_center_name}`}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip
              label={request.priority.toUpperCase()}
              color={getPriorityColor(request.priority) as any}
              size="small"
            />
            <Chip
              label={request.status.toUpperCase()}
              color={getStatusColor(request.status) as any}
              size="small"
            />
          </Box>
        </Box>

        <Typography variant="body2" gutterBottom>
          <strong>Type:</strong> {getRequestTypeLabel(request.request_type)}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {request.description.length > 100 
            ? `${request.description.substring(0, 100)}...` 
            : request.description
          }
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Created: {(() => {
              try {
                const date = new Date(request.created_at);
                return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
              } catch (error) {
                return 'Invalid Date';
              }
            })()}
          </Typography>
          
          <Box display="flex" gap={1}>
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => handleViewRequest(request)}>
                <ViewIcon />
              </IconButton>
            </Tooltip>
            
            {isIncoming && request.status === 'pending' && (
              <>
                <Tooltip title="Acknowledge">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleAcknowledge(request.id)}
                    disabled={acknowledgeMutation.isPending}
                  >
                    <AcknowledgeIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Resolve">
                  <IconButton 
                    size="small" 
                    color="success"
                    onClick={() => handleResolve(request.id)}
                    disabled={resolveMutation.isPending}
                  >
                    <ResolveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Decline">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDecline(request.id)}
                    disabled={declineMutation.isPending}
                  >
                    <DeclineIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inter-Center Support
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Request Support
        </Button>
      </Box>

      {notification && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 2 }}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={`Incoming Requests (${incomingRequests.length})`} />
            <Tab label={`Outgoing Requests (${outgoingRequests.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {incomingError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading incoming requests: {incomingError.message}
            </Alert>
          )}
          {incomingLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : incomingRequests.length === 0 ? (
            <Box textAlign="center" p={3}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No incoming support requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Debug: {incomingRequests.length} requests loaded
              </Typography>
            </Box>
          ) : (
            incomingRequests.map((request: SupportRequest) => renderRequestCard(request, true))
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {outgoingError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading outgoing requests: {outgoingError.message}
            </Alert>
          )}
          {outgoingLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : outgoingRequests.length === 0 ? (
            <Box textAlign="center" p={3}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No outgoing support requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Debug: {outgoingRequests.length} requests loaded
              </Typography>
            </Box>
          ) : (
            outgoingRequests.map((request: SupportRequest) => renderRequestCard(request, false))
          )}
        </TabPanel>
      </Card>

      {/* Create Support Request Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request Support from Another Center</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Center</InputLabel>
                <Select
                  value={formData.target_center_id}
                  onChange={(e) => setFormData({ ...formData, target_center_id: e.target.value })}
                  label="Target Center"
                >
                  {centers.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Request Type</InputLabel>
                <Select
                  value={formData.request_type}
                  onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                  label="Request Type"
                >
                  <MenuItem value="personnel_support">Personnel Support</MenuItem>
                  <MenuItem value="equipment_support">Equipment Support</MenuItem>
                  <MenuItem value="medical_support">Medical Support</MenuItem>
                  <MenuItem value="evacuation_support">Evacuation Support</MenuItem>
                  <MenuItem value="coordination_support">Coordination Support</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Link to Escalation (Optional)</InputLabel>
                <Select
                  value={formData.escalation_id}
                  onChange={(e) => setFormData({ ...formData, escalation_id: e.target.value })}
                  label="Link to Escalation (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {escalations.map((escalation: any) => (
                    <MenuItem key={escalation.id} value={escalation.id}>
                      {escalation.escalation_type} - {escalation.priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief title for the support request"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={4}
                placeholder="Detailed description of the support needed"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateRequest} 
            variant="contained"
            disabled={createMutation.isPending || !formData.target_center_id || !formData.request_type || !formData.title || !formData.description}
          >
            {createMutation.isPending ? <CircularProgress size={20} /> : 'Create Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Support Request Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Support Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRequest.title}
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={selectedRequest.priority.toUpperCase()}
                  color={getPriorityColor(selectedRequest.priority) as any}
                />
                <Chip
                  label={selectedRequest.status.toUpperCase()}
                  color={getStatusColor(selectedRequest.status) as any}
                />
                <Chip
                  label={getRequestTypeLabel(selectedRequest.request_type)}
                  variant="outlined"
                />
              </Box>

              <Typography variant="body1" paragraph>
                {selectedRequest.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Requesting Center
                  </Typography>
                  <Typography variant="body2">
                    {selectedRequest.requesting_center_name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Requesting Admin
                  </Typography>
                  <Typography variant="body2">
                    {selectedRequest.requesting_admin_first_name} {selectedRequest.requesting_admin_last_name}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Target Center
                  </Typography>
                  <Typography variant="body2">
                    {selectedRequest.target_center_name}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {(() => {
                      try {
                        const date = new Date(selectedRequest.created_at);
                        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
                      } catch (error) {
                        return 'Invalid Date';
                      }
                    })()}
                  </Typography>
                </Grid>

                {selectedRequest.acknowledged_at && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Acknowledged At
                    </Typography>
                    <Typography variant="body2">
                      {(() => {
                        try {
                          const date = new Date(selectedRequest.acknowledged_at);
                          return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
                        } catch (error) {
                          return 'Invalid Date';
                        }
                      })()}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.resolved_at && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Resolved At
                    </Typography>
                    <Typography variant="body2">
                      {(() => {
                        try {
                          const date = new Date(selectedRequest.resolved_at);
                          return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
                        } catch (error) {
                          return 'Invalid Date';
                        }
                      })()}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.declined_reason && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Decline Reason
                    </Typography>
                    <Typography variant="body2" color="error">
                      {selectedRequest.declined_reason}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.escalation_type && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Linked Escalation
                    </Typography>
                    <Typography variant="body2">
                      {selectedRequest.escalation_type} - {selectedRequest.escalation_priority}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterCenterSupport; 