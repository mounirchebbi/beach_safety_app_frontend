import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
  Button
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Report as ReportIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { IncidentReport } from '../../types';

const IncidentReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    lifeguard_id: ''
  });

  // Load reports
  const loadReports = async () => {
    try {
      setLoading(true);
      const result = await apiService.getIncidentReports(page + 1, rowsPerPage, filters);
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
  }, [page, rowsPerPage, filters]);

  // View report
  const handleViewReport = (report: IncidentReport) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
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

  // Get incident type icon
  const getIncidentTypeIcon = (type: string) => {
    if (type.includes('Medical') || type.includes('First Aid')) return <InfoIcon />;
    if (type.includes('Drowning') || type.includes('Rescue')) return <WarningIcon />;
    if (type.includes('Weather')) return <ErrorIcon />;
    return <ReportIcon />;
  };

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filtering
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Incident Reports
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Alert Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Alert Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="responding">Responding</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Lifeguard ID"
                value={filters.lifeguard_id}
                onChange={(e) => handleFilterChange('lifeguard_id', e.target.value)}
                fullWidth
                placeholder="Filter by lifeguard ID"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
                No incident reports found for your center.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lifeguard</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Alert Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {report.first_name?.[0]}{report.last_name?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {report.first_name} {report.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.lifeguard_email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
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
                            {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewReport(report)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
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
                {/* Lifeguard Info */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 48, height: 48 }}>
                      {selectedReport.first_name?.[0]}{selectedReport.last_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedReport.first_name} {selectedReport.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedReport.lifeguard_email}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                {/* Incident Type */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedReport.incident_type}
                  </Typography>
                </Grid>
                
                {/* Linked Alert */}
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
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Alert Status
                            </Typography>
                            <Chip
                              label={selectedReport.alert_status || 'Unknown'}
                              color={selectedReport.alert_status === 'resolved' ? 'success' : 'warning'}
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                )}

                {/* Description */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedReport.description}
                  </Typography>
                </Grid>

                {/* Action Taken */}
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

                {/* Outcome */}
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

                {/* Timestamps */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedReport.created_at), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedReport.updated_at), 'MMM dd, yyyy HH:mm')}
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

export default IncidentReports; 