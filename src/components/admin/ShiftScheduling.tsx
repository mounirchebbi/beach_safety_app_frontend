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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CalendarViewWeek as WeeklyIcon,
  ViewList as ViewListIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { ShiftFormData, WeeklyScheduleFormData } from '../../types';
import ShiftCalendar from './ShiftCalendar';

// Interface matching the actual API response structure
interface ShiftWithLifeguard {
  id: string;
  lifeguard_id: string;
  center_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  check_in_time?: string;
  check_in_location?: any;
  check_out_time?: string;
  created_at: string;
  updated_at: string;
  // Lifeguard fields (flat structure from API)
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  center_name: string;
}

const ShiftScheduling: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<ShiftWithLifeguard[]>([]);
  const [lifeguards, setLifeguards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Selected shift
  const [selectedShift, setSelectedShift] = useState<ShiftWithLifeguard | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ShiftFormData>({
    lifeguard_id: '',
    center_id: '',
    start_time: '',
    end_time: ''
  });
  
  // Weekly schedule form state
  const [weeklyFormData, setWeeklyFormData] = useState<WeeklyScheduleFormData>({
    lifeguard_id: '',
    center_id: '',
    start_time: '',
    end_time: '',
    days_of_week: [],
    start_date: '',
    weeks_count: 4
  });

  // Tab state for create dialog
  const [createTabValue, setCreateTabValue] = useState(0);

  // Day selection constants
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  // Load shifts and lifeguards
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [shiftsData, lifeguardsData] = await Promise.all([
        apiService.getShifts(),
        apiService.getLifeguards()
      ]);
      setShifts(shiftsData);
      setLifeguards(lifeguardsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle form input changes
  const handleFormChange = (field: keyof ShiftFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle weekly form input changes
  const handleWeeklyFormChange = (field: keyof WeeklyScheduleFormData, value: any) => {
    setWeeklyFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle day selection
  const handleDayToggle = (dayValue: number) => {
    setWeeklyFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(dayValue)
        ? prev.days_of_week.filter(day => day !== dayValue)
        : [...prev.days_of_week, dayValue].sort()
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      lifeguard_id: '',
      center_id: '',
      start_time: '',
      end_time: ''
    });
    setWeeklyFormData({
      lifeguard_id: '',
      center_id: '',
      start_time: '',
      end_time: '',
      days_of_week: [],
      start_date: '',
      weeks_count: 4
    });
    setCreateTabValue(0);
  };

  // Open create dialog
  const handleCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (shift: ShiftWithLifeguard) => {
    setSelectedShift(shift);
    setFormData({
      lifeguard_id: shift.lifeguard_id,
      center_id: shift.center_id,
      start_time: shift.start_time,
      end_time: shift.end_time
    });
    setEditDialogOpen(true);
  };

  // Open view dialog
  const handleView = (shift: ShiftWithLifeguard) => {
    setSelectedShift(shift);
    setViewDialogOpen(true);
  };

  // Open delete dialog
  const handleDelete = (shift: ShiftWithLifeguard) => {
    setSelectedShift(shift);
    setDeleteDialogOpen(true);
  };

  // Create shift
  const handleCreateSubmit = async () => {
    try {
      if (!formData.lifeguard_id || !formData.start_time || !formData.end_time) {
        setError('Lifeguard, start time, and end time are required');
        return;
      }

      // Validate that end time is after start time
      if (isBefore(parseISO(formData.end_time), parseISO(formData.start_time))) {
        setError('End time must be after start time');
        return;
      }

      await apiService.createShift(formData);
      setSuccess('Shift created successfully');
      setCreateDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create shift');
    }
  };

  // Create weekly schedule
  const handleWeeklySubmit = async () => {
    try {
      if (!weeklyFormData.lifeguard_id || !weeklyFormData.start_time || !weeklyFormData.end_time || !weeklyFormData.start_date) {
        setError('Lifeguard, start time, end time, and start date are required');
        return;
      }

      if (weeklyFormData.days_of_week.length === 0) {
        setError('Please select at least one day of the week');
        return;
      }

      // Validate that end time is after start time
      const startTime = new Date(`2000-01-01T${weeklyFormData.start_time}`);
      const endTime = new Date(`2000-01-01T${weeklyFormData.end_time}`);
      if (endTime <= startTime) {
        setError('End time must be after start time');
        return;
      }

      const result = await apiService.createWeeklySchedule(weeklyFormData);
      setSuccess(`Weekly schedule created successfully. ${result.data.total_created} shifts created, ${result.data.total_skipped} skipped due to conflicts.`);
      setCreateDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create weekly schedule');
    }
  };

  // Update shift
  const handleEditSubmit = async () => {
    try {
      if (!selectedShift) return;

      if (!formData.lifeguard_id || !formData.start_time || !formData.end_time) {
        setError('Lifeguard, start time, and end time are required');
        return;
      }

      // Validate that end time is after start time
      if (isBefore(parseISO(formData.end_time), parseISO(formData.start_time))) {
        setError('End time must be after start time');
        return;
      }

      await apiService.updateShift(selectedShift.id, formData);
      setSuccess('Shift updated successfully');
      setEditDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update shift');
    }
  };

  // Delete shift
  const handleDeleteSubmit = async () => {
    try {
      if (!selectedShift) return;

      await apiService.deleteShift(selectedShift.id);
      setSuccess('Shift deleted successfully');
      setDeleteDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete shift');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <ScheduleIcon />;
      case 'active': return <CheckCircleIcon />;
      case 'completed': return <CheckCircleIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <WarningIcon />;
    }
  };

  // Check if shift is overdue
  const isShiftOverdue = (endTime: string, status: string) => {
    return status === 'active' && isBefore(parseISO(endTime), new Date());
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Shift Scheduling
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                startIcon={<ViewListIcon />}
                onClick={() => setViewMode('list')}
                size="small"
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                startIcon={<CalendarMonthIcon />}
                onClick={() => setViewMode('calendar')}
                size="small"
              >
                Calendar View
              </Button>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ borderRadius: 2 }}
            >
              Schedule Shift
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {viewMode === 'list' ? (
          <Card>
            <CardContent>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lifeguard</TableCell>
                      <TableCell>Schedule</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Check-in/out</TableCell>
                      <TableCell>Center</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shifts
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((shift) => (
                      <TableRow key={shift.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {shift.first_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {shift.first_name} {shift.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {shift.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <TimeIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {format(parseISO(shift.start_time), 'MMM dd, yyyy HH:mm')} - {format(parseISO(shift.end_time), 'HH:mm')}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Duration: {Math.round((parseISO(shift.end_time).getTime() - parseISO(shift.start_time).getTime()) / (1000 * 60 * 60))}h
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(shift.status)}
                            label={shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                            color={getStatusColor(shift.status) as any}
                            size="small"
                            variant={isShiftOverdue(shift.end_time, shift.status) ? "outlined" : "filled"}
                          />
                          {isShiftOverdue(shift.end_time, shift.status) && (
                            <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                              Overdue
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box>
                            {shift.check_in_time && (
                              <Typography variant="body2" color="success.main">
                                ✓ In: {format(parseISO(shift.check_in_time), 'HH:mm')}
                              </Typography>
                            )}
                            {shift.check_out_time && (
                              <Typography variant="body2" color="info.main">
                                ✓ Out: {format(parseISO(shift.check_out_time), 'HH:mm')}
                              </Typography>
                            )}
                            {!shift.check_in_time && shift.status === 'scheduled' && (
                              <Typography variant="body2" color="text.secondary">
                                Not checked in
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {shift.center_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(shift)}
                                color="info"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(shift)}
                                color="primary"
                                disabled={shift.status === 'active' || shift.status === 'completed'}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(shift)}
                                color="error"
                                disabled={shift.status === 'active'}
                              >
                                <DeleteIcon />
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
                count={shifts.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </CardContent>
          </Card>
        ) : (
          <ShiftCalendar
            shifts={shifts}
            onShiftClick={handleView}
            onDateClick={(date) => {
              // Pre-fill the create form with the selected date
              const startTime = new Date(date);
              startTime.setHours(9, 0, 0, 0); // Default to 9 AM
              const endTime = new Date(date);
              endTime.setHours(17, 0, 0, 0); // Default to 5 PM
              
              setFormData(prev => ({
                ...prev,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
              }));
              setCreateDialogOpen(true);
            }}
          />
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Schedule New Shift</DialogTitle>
          <DialogContent>
            <Tabs value={createTabValue} onChange={(_, newValue) => setCreateTabValue(newValue)} sx={{ mb: 2 }}>
              <Tab label="Single Shift" icon={<ScheduleIcon />} />
              <Tab label="Weekly Schedule" icon={<WeeklyIcon />} />
            </Tabs>

            {createTabValue === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Lifeguard</InputLabel>
                    <Select
                      value={formData.lifeguard_id}
                      onChange={(e) => handleFormChange('lifeguard_id', e.target.value)}
                      label="Lifeguard"
                    >
                      {lifeguards.map((lifeguard) => (
                        <MenuItem key={lifeguard.id} value={lifeguard.id}>
                          {lifeguard.first_name} {lifeguard.last_name} - {lifeguard.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Start Time"
                    value={formData.start_time ? parseISO(formData.start_time) : null}
                    onChange={(date) => handleFormChange('start_time', date ? date.toISOString() : '')}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="End Time"
                    value={formData.end_time ? parseISO(formData.end_time) : null}
                    onChange={(date) => handleFormChange('end_time', date ? date.toISOString() : '')}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
              </Grid>
            )}

            {createTabValue === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Lifeguard</InputLabel>
                    <Select
                      value={weeklyFormData.lifeguard_id}
                      onChange={(e) => handleWeeklyFormChange('lifeguard_id', e.target.value)}
                      label="Lifeguard"
                    >
                      {lifeguards.map((lifeguard) => (
                        <MenuItem key={lifeguard.id} value={lifeguard.id}>
                          {lifeguard.first_name} {lifeguard.last_name} - {lifeguard.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Time"
                    type="time"
                    value={weeklyFormData.start_time}
                    onChange={(e) => handleWeeklyFormChange('start_time', e.target.value)}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Time"
                    type="time"
                    value={weeklyFormData.end_time}
                    onChange={(e) => handleWeeklyFormChange('end_time', e.target.value)}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={weeklyFormData.start_date}
                    onChange={(e) => handleWeeklyFormChange('start_date', e.target.value)}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Number of Weeks"
                    type="number"
                    value={weeklyFormData.weeks_count}
                    onChange={(e) => handleWeeklyFormChange('weeks_count', parseInt(e.target.value))}
                    fullWidth
                    required
                    inputProps={{ min: 1, max: 12 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Days of the Week
                  </Typography>
                  <FormGroup row>
                    {daysOfWeek.map((day) => (
                      <FormControlLabel
                        key={day.value}
                        control={
                          <Checkbox
                            checked={weeklyFormData.days_of_week.includes(day.value)}
                            onChange={() => handleDayToggle(day.value)}
                          />
                        }
                        label={day.label}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={createTabValue === 0 ? handleCreateSubmit : handleWeeklySubmit} 
              variant="contained"
            >
              {createTabValue === 0 ? 'Schedule Shift' : 'Create Weekly Schedule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Lifeguard</InputLabel>
                  <Select
                    value={formData.lifeguard_id}
                    onChange={(e) => handleFormChange('lifeguard_id', e.target.value)}
                    label="Lifeguard"
                  >
                    {lifeguards.map((lifeguard) => (
                      <MenuItem key={lifeguard.id} value={lifeguard.id}>
                        {lifeguard.first_name} {lifeguard.last_name} - {lifeguard.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Time"
                  value={formData.start_time ? parseISO(formData.start_time) : null}
                  onChange={(date) => handleFormChange('start_time', date ? date.toISOString() : '')}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="End Time"
                  value={formData.end_time ? parseISO(formData.end_time) : null}
                  onChange={(date) => handleFormChange('end_time', date ? date.toISOString() : '')}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained">
              Update Shift
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Shift Details</DialogTitle>
          <DialogContent>
            {selectedShift && (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    {selectedShift.first_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedShift.first_name} {selectedShift.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedShift.email}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Schedule</Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Start:</strong> {format(parseISO(selectedShift.start_time), 'PPP p')}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>End:</strong> {format(parseISO(selectedShift.end_time), 'PPP p')}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Duration:</strong> {Math.round((parseISO(selectedShift.end_time).getTime() - parseISO(selectedShift.start_time).getTime()) / (1000 * 60 * 60))} hours
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip
                      icon={getStatusIcon(selectedShift.status)}
                      label={selectedShift.status.charAt(0).toUpperCase() + selectedShift.status.slice(1)}
                      color={getStatusColor(selectedShift.status) as any}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>

                  {(selectedShift.check_in_time || selectedShift.check_out_time) && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Check-in/out Times</Typography>
                      {selectedShift.check_in_time && (
                        <Typography variant="body2" mb={1}>
                          <strong>Check-in:</strong> {format(parseISO(selectedShift.check_in_time), 'PPP p')}
                        </Typography>
                      )}
                      {selectedShift.check_out_time && (
                        <Typography variant="body2" mb={1}>
                          <strong>Check-out:</strong> {format(parseISO(selectedShift.check_out_time), 'PPP p')}
                        </Typography>
                      )}
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Center</Typography>
                    <Typography variant="body2">
                      {selectedShift.center_name}
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Shift</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the shift for{' '}
              <strong>
                {selectedShift?.first_name} {selectedShift?.last_name}
              </strong>
              ? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteSubmit} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!error || !!success}
          autoHideDuration={6000}
          onClose={() => {
            setError(null);
            setSuccess(null);
          }}
        >
          <Alert
            onClose={() => {
              setError(null);
              setSuccess(null);
            }}
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ShiftScheduling; 