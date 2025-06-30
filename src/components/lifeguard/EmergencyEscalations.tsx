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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  TablePagination,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { EmergencyEscalation, EscalationFormData, EmergencyAlert } from '../../types';

const EmergencyEscalations: React.FC = () => {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<EmergencyEscalation[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<EmergencyEscalation | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState<EscalationFormData>({
    alert_id: '',
    escalation_type: 'backup_request',
    priority: 'medium',
    description: '',
    requested_resources: {}
  });

  // Load escalations and alerts
  const loadData = async () => {
    try {
      setLoading(true);
      const [escalationsResult, alertsResult] = await Promise.all([
        apiService.getMyEscalations(page + 1, rowsPerPage),
        apiService.getAlerts()
      ]);
      
      setEscalations(escalationsResult.data);
      setTotalCount(escalationsResult.pagination.total);
      setAlerts(alertsResult);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, rowsPerPage]);

  // Create escalation
  const handleCreateEscalation = async () => {
    try {
      await apiService.createEscalation(formData);
      setCreateDialogOpen(false);
      setFormData({
        alert_id: '',
        escalation_type: 'backup_request',
        priority: 'medium',
        description: '',
        requested_resources: {}
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create escalation');
    }
  };

  // View escalation
  const handleViewEscalation = (escalation: EmergencyEscalation) => {
    setSelectedEscalation(escalation);
    setViewDialogOpen(true);
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'acknowledged': return 'info';
      case 'responding': return 'primary';
      case 'resolved': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get escalation type icon
  const getEscalationTypeIcon = (type: string) => {
    switch (type) {
      case 'backup_request': return <WarningIcon />;
      case 'medical_support': return <InfoIcon />;
      case 'equipment_request': return <ReportIcon />;
      case 'guidance_request': return <InfoIcon />;
      case 'evacuation_support': return <ErrorIcon />;
      default: return <ReportIcon />;
    }
  };

  // Get escalation type label
  const getEscalationTypeLabel = (type: string) => {
    switch (type) {
      case 'backup_request': return 'Backup Request';
      case 'medical_support': return 'Medical Support';
      case 'equipment_request': return 'Equipment Request';
      case 'guidance_request': return 'Guidance Request';
      case 'evacuation_support': return 'Evacuation Support';
      default: return type;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Emergency Escalations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Escalation
        </Button>
      </Box>

      {/* Escalations Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : escalations.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Escalations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You haven't created any emergency escalations yet.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {escalations.map((escalation) => (
                      <TableRow key={escalation.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getEscalationTypeIcon(escalation.escalation_type)}
                            <Typography variant="body2">
                              {getEscalationTypeLabel(escalation.escalation_type)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={escalation.priority}
                            color={getPriorityColor(escalation.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {escalation.description.length > 100
                              ? `${escalation.description.substring(0, 100)}...`
                              : escalation.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={escalation.status}
                            color={getStatusColor(escalation.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(escalation.created_at), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewEscalation(escalation)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Escalation Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Emergency Escalation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Alert</InputLabel>
                <Select
                  value={formData.alert_id}
                  onChange={(e) => setFormData({ ...formData, alert_id: e.target.value })}
                  label="Alert"
                >
                  {alerts.filter(alert => alert.status === 'active' || alert.status === 'responding').map((alert) => (
                    <MenuItem key={alert.id} value={alert.id}>
                      {alert.alert_type} - {alert.description?.substring(0, 50)}...
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Escalation Type</InputLabel>
                <Select
                  value={formData.escalation_type}
                  onChange={(e) => setFormData({ ...formData, escalation_type: e.target.value as any })}
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

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  label="Priority"
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
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={4}
                placeholder="Describe the situation and what support you need..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateEscalation} 
            variant="contained"
            disabled={!formData.alert_id || !formData.description}
          >
            Create Escalation
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Escalation Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Escalation Details</DialogTitle>
        <DialogContent>
          {selectedEscalation && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                {/* Escalation Info */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getEscalationTypeIcon(selectedEscalation.escalation_type)}
                    <Box>
                      <Typography variant="h6">
                        {getEscalationTypeLabel(selectedEscalation.escalation_type)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Priority: {selectedEscalation.priority}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Status */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedEscalation.status}
                    color={getStatusColor(selectedEscalation.status) as any}
                    sx={{ mt: 1 }}
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedEscalation.description}
                  </Typography>
                </Grid>

                {/* Linked Alert */}
                {selectedEscalation.alert_type && (
                  <Grid item xs={12}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">Linked Emergency Alert</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Alert Type
                            </Typography>
                            <Chip label={selectedEscalation.alert_type} size="small" />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Severity
                            </Typography>
                            <Chip
                              label={selectedEscalation.severity || 'N/A'}
                              color={getPriorityColor(selectedEscalation.severity || 'medium') as any}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Alert Description
                            </Typography>
                            <Typography variant="body1">
                              {selectedEscalation.alert_description || 'No description available'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                )}

                {/* Acknowledged By */}
                {selectedEscalation.acknowledged_by_first_name && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Acknowledged By
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {selectedEscalation.acknowledged_by_first_name[0]}
                      </Avatar>
                      <Typography variant="body1">
                        {selectedEscalation.acknowledged_by_first_name} {selectedEscalation.acknowledged_by_last_name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {selectedEscalation.acknowledged_at && format(new Date(selectedEscalation.acknowledged_at), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Grid>
                )}

                {/* Timestamps */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedEscalation.created_at), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedEscalation.updated_at), 'MMM dd, yyyy HH:mm')}
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

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmergencyEscalations; 