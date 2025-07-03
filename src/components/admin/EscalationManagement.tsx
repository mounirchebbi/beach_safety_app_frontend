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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Report as ReportIcon,
  ThumbUp as AcknowledgeIcon,
  Done as ResolveIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { EmergencyEscalation } from '../../types';

// Safe date formatting function
const formatDate = (dateString: string | null | undefined, formatString: string = 'MMM dd, yyyy HH:mm'): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

const EscalationManagement: React.FC = () => {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<EmergencyEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<EmergencyEscalation | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  });

  // Load escalations
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getCenterEscalations(page + 1, rowsPerPage, filters);
      setEscalations(result.data);
      setTotalCount(result.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load escalations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, rowsPerPage, filters]);

  // Acknowledge escalation
  const handleAcknowledge = async (id: string) => {
    try {
      await apiService.acknowledgeEscalation(id);
      setSuccess('Escalation acknowledged successfully');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to acknowledge escalation');
    }
  };

  // Resolve escalation
  const handleResolve = async (id: string) => {
    try {
      await apiService.resolveEscalation(id);
      setSuccess('Escalation resolved successfully');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resolve escalation');
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
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="responding">Responding</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
                No emergency escalations found for your center.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Lifeguard</TableCell>
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {escalation.first_name?.[0] || 'L'}
                            </Avatar>
                            <Typography variant="body2">
                              {escalation.first_name} {escalation.last_name}
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
                            {formatDate(escalation.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewEscalation(escalation)}
                            >
                              <ViewIcon />
                            </IconButton>
                            {escalation.status === 'pending' && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleAcknowledge(escalation.id)}
                              >
                                <AcknowledgeIcon />
                              </IconButton>
                            )}
                            {(escalation.status === 'acknowledged' || escalation.status === 'responding') && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleResolve(escalation.id)}
                              >
                                <ResolveIcon />
                              </IconButton>
                            )}
                          </Box>
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

                {/* Lifeguard Info */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Requested By
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {selectedEscalation.first_name?.[0] || 'L'}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {selectedEscalation.first_name} {selectedEscalation.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedEscalation.lifeguard_email}
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

                {/* Timestamps */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedEscalation.created_at)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedEscalation.updated_at)}
                  </Typography>
                </Grid>

                {/* Acknowledged At */}
                {selectedEscalation.acknowledged_at && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Acknowledged
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedEscalation.acknowledged_at)}
                    </Typography>
                  </Grid>
                )}

                {/* Resolved At */}
                {selectedEscalation.resolved_at && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Resolved
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedEscalation.resolved_at)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedEscalation?.status === 'pending' && (
            <Button
              onClick={() => {
                handleAcknowledge(selectedEscalation.id);
                setViewDialogOpen(false);
              }}
              variant="contained"
              color="primary"
              startIcon={<AcknowledgeIcon />}
            >
              Acknowledge
            </Button>
          )}
          {(selectedEscalation?.status === 'acknowledged' || selectedEscalation?.status === 'responding') && (
            <Button
              onClick={() => {
                handleResolve(selectedEscalation.id);
                setViewDialogOpen(false);
              }}
              variant="contained"
              color="success"
              startIcon={<ResolveIcon />}
            >
              Resolve
            </Button>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EscalationManagement; 