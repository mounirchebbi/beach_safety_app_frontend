import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Avatar,
  Divider,
  TablePagination,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Report as ReportIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  AccessTime as TimeIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { IncidentReport, IncidentReportFormData } from '../../types';

// Safe date formatting function
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'Invalid Date';
  }
};

const IncidentReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<'date' | 'severity'>('date');
  const [ignoreFalseAlerts, setIgnoreFalseAlerts] = useState(false);

  // Form state
  const [formData, setFormData] = useState<IncidentReportFormData>({
    alert_id: '',
    incident_type: '',
    description: '',
    action_taken: '',
    outcome: '',
    involved_persons: {}
  });

  // Incident types
  const incidentTypes = [
    'Medical Emergency',
    'Drowning Rescue',
    'First Aid',
    'Weather Emergency',
    'Lost Child',
    'Equipment Failure',
    'Beach Safety Violation',
    'Other'
  ];

  // Load reports
  const loadReports = async () => {
    try {
      setLoading(true);
      const result = await apiService.getMyIncidentReports(page + 1, rowsPerPage);
      setReports(result.data);
      setTotalCount(result.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load incident reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [page, rowsPerPage]);

  // Handle form input changes
  const handleFormChange = (field: keyof IncidentReportFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      alert_id: '',
      incident_type: '',
      description: '',
      action_taken: '',
      outcome: '',
      involved_persons: {}
    });
  };

  // Update report
  const handleUpdateSubmit = async () => {
    if (!selectedReport) return;

    try {
      setSubmitting(true);
      await apiService.updateIncidentReport(selectedReport.id, formData);
      setSuccess('Incident report updated successfully');
      setEditDialogOpen(false);
      setSelectedReport(null);
      resetForm();
      loadReports();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update incident report');
    } finally {
      setSubmitting(false);
    }
  };

  // View report
  const handleViewReport = (report: IncidentReport) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  // Edit report
  const handleEditReport = (report: IncidentReport) => {
    setSelectedReport(report);
    setFormData({
      alert_id: report.alert_id || '',
      incident_type: report.incident_type,
      description: report.description,
      action_taken: report.action_taken || '',
      outcome: report.outcome || '',
      involved_persons: report.involved_persons || {}
    });
    setEditDialogOpen(true);
  };

  // Get severity color
  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Filter and sort reports based on selected filter
  const getFilteredAndSortedReports = () => {
    let filteredReports = [...reports];

    // Filter out false alerts if toggle is enabled
    if (ignoreFalseAlerts) {
      filteredReports = filteredReports.filter(report => 
        report.incident_type !== 'False Alert'
      );
    }

    // Sort based on filter type
    switch (filterType) {
      case 'date':
        return filteredReports.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'severity':
        return filteredReports.sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const severityA = severityOrder[a.severity?.toLowerCase() as keyof typeof severityOrder] || 0;
          const severityB = severityOrder[b.severity?.toLowerCase() as keyof typeof severityOrder] || 0;
          if (severityA !== severityB) {
            return severityB - severityA;
          }
          // If same severity, sort by date (most recent first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      default:
        return filteredReports;
    }
  };

  // Get incident type icon
  const getIncidentTypeIcon = (type: string) => {
    if (type.includes('Medical') || type.includes('First Aid')) return <InfoIcon />;
    if (type.includes('Drowning') || type.includes('Rescue')) return <WarningIcon />;
    if (type.includes('Weather')) return <ErrorIcon />;
    return <ReportIcon />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Incident Reports
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="filter-type-label">Filter By</InputLabel>
            <Select
              labelId="filter-type-label"
              value={filterType}
              label="Filter By"
              onChange={(e) => setFilterType(e.target.value as 'date' | 'severity')}
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
          <FormControlLabel
            control={
              <Switch
                checked={ignoreFalseAlerts}
                onChange={(e) => setIgnoreFalseAlerts(e.target.checked)}
              />
            }
            label="Hide False Alerts"
          />
        </Box>
      </Box>

      {/* Reports Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : reports.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Incident Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Incident reports are created when resolving emergency alerts.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Alert Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredAndSortedReports().map((report) => (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getIncidentTypeIcon(report.incident_type)}
                            <Typography variant="body2">
                              {report.incident_type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {report.description.length > 100
                              ? `${report.description.substring(0, 100)}...`
                              : report.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {report.alert_type ? (
                            <Chip label={report.alert_type} size="small" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No Alert
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.severity ? (
                            <Chip
                              label={report.severity}
                              color={getSeverityColor(report.severity) as any}
                              size="small"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(report.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewReport(report)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Report">
                              <IconButton
                                size="small"
                                onClick={() => handleEditReport(report)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Incident Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedReport.incident_type}
                  </Typography>
                </Grid>
                
                {selectedReport.alert_type && (
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
                            <Chip label={selectedReport.alert_type} size="small" />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Severity
                            </Typography>
                            <Chip
                              label={selectedReport.severity || 'N/A'}
                              color={getSeverityColor(selectedReport.severity) as any}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Alert Description
                            </Typography>
                            <Typography variant="body1">
                              {selectedReport.alert_description || 'No description available'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedReport.description}
                  </Typography>
                </Grid>

                {selectedReport.action_taken && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Action Taken
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {selectedReport.action_taken}
                    </Typography>
                  </Grid>
                )}

                {selectedReport.outcome && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Outcome
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {selectedReport.outcome}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedReport.created_at)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedReport.updated_at)}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Incident Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Alert ID (Optional)"
                value={formData.alert_id}
                onChange={(e) => handleFormChange('alert_id', e.target.value)}
                fullWidth
                helperText="Link this report to a specific emergency alert"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Incident Type</InputLabel>
                <Select
                  value={formData.incident_type}
                  onChange={(e) => handleFormChange('incident_type', e.target.value)}
                  label="Incident Type"
                >
                  {incidentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                fullWidth
                multiline
                rows={4}
                required
                helperText="Provide a detailed description of the incident"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Action Taken"
                value={formData.action_taken}
                onChange={(e) => handleFormChange('action_taken', e.target.value)}
                fullWidth
                multiline
                rows={3}
                helperText="Describe the actions you took to address the incident"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Outcome"
                value={formData.outcome}
                onChange={(e) => handleFormChange('outcome', e.target.value)}
                fullWidth
                multiline
                rows={2}
                helperText="What was the final outcome of the incident?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            disabled={submitting || !formData.incident_type || !formData.description}
          >
            {submitting ? <CircularProgress size={20} /> : 'Update Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IncidentReports; 