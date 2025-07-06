import React, { useEffect, useState } from 'react';
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
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  IconButton,
  Avatar
} from '@mui/material';
import {
  ViewList as ListIcon,
  ViewWeek as WeekIcon,
  ViewModule as MonthIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format, parseISO, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isToday, eachWeekOfInterval, isWithinInterval, differenceInHours } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { Shift } from '../../types';

type ViewMode = 'list' | 'calendar';

const ShiftManagement: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getMyShifts();
      setShifts(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
    // eslint-disable-next-line
  }, []);

  // Check if a shift can be checked in
  const canCheckIn = (shift: Shift): { allowed: boolean; reason?: string } => {
    const now = new Date();
    const shiftStart = parseISO(shift.start_time);
    const shiftEnd = parseISO(shift.end_time);

    // Check if shift is scheduled
    if (shift.status !== 'scheduled') {
      return { allowed: false, reason: 'Shift is not in scheduled status' };
    }

    // Check if already checked in
    if (shift.check_in_time) {
      return { allowed: false, reason: 'Already checked in' };
    }

    // Check if shift is for today
    if (!isSameDay(shiftStart, now)) {
      const shiftDate = format(shiftStart, 'MMM dd, yyyy');
      return { allowed: false, reason: `Check-in only allowed for today's shifts (shift is on ${shiftDate})` };
    }

    // Check if shift has already ended
    if (isAfter(now, shiftEnd)) {
      return { allowed: false, reason: 'Shift has already ended' };
    }

    // Check if within 2 hours after start time
    const hoursSinceStart = differenceInHours(now, shiftStart);
    if (hoursSinceStart > 2) {
      const timeSinceStart = format(shiftStart, 'HH:mm');
      return { allowed: false, reason: `Check-in only allowed up to 2 hours after start time (${timeSinceStart})` };
    }

    // Check if shift hasn't started yet (allow early check-in up to 1 hour before)
    const hoursBeforeStart = differenceInHours(shiftStart, now);
    if (hoursBeforeStart > 1) {
      const timeUntilStart = format(shiftStart, 'HH:mm');
      return { allowed: false, reason: `Check-in allowed up to 1 hour before start time (${timeUntilStart})` };
    }

    return { allowed: true };
  };

  const handleCheckIn = async (shiftId: string) => {
    setCheckingIn(shiftId);
    try {
      // For demo, use a dummy location
      await apiService.checkInShift(shiftId, { lat: 36.8, lng: 10.2 });
      setSnackbar({ open: true, message: 'Checked in successfully!', severity: 'success' });
      loadShifts();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Check-in failed', severity: 'error' });
    } finally {
      setCheckingIn(null);
    }
  };

  const handleCheckOut = async (shiftId: string) => {
    setCheckingOut(shiftId);
    try {
      await apiService.checkOutShift(shiftId);
      setSnackbar({ open: true, message: 'Checked out successfully!', severity: 'success' });
      loadShifts();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Check-out failed', severity: 'error' });
    } finally {
      setCheckingOut(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <ScheduleIcon />;
      case 'active': return <PlayArrowIcon />;
      case 'completed': return <CheckCircleIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => {
      const shiftStart = parseISO(shift.start_time);
      const shiftEnd = parseISO(shift.end_time);
      
      // Check if the shift overlaps with the given date
      return (
        isSameDay(shiftStart, date) ||
        isSameDay(shiftEnd, date) ||
        (isBefore(shiftStart, date) && isAfter(shiftEnd, date))
      );
    });
  };

  const formatTime = (timeString: string) => {
    return format(parseISO(timeString), 'HH:mm');
  };

  const renderShiftCard = (shift: Shift) => {
    const checkInValidation = canCheckIn(shift);
    
    return (
      <Card
        key={shift.id}
        sx={{
          mb: 1,
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-1px)',
            transition: 'all 0.2s'
          },
          borderLeft: `4px solid ${
            shift.status === 'scheduled' ? '#1976d2' :
            shift.status === 'active' ? '#2e7d32' :
            shift.status === 'completed' ? '#0288d1' :
            '#d32f2f'
          }`
        }}
      >
        <CardContent sx={{ p: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
              {user?.first_name?.charAt(0) || 'L'}
            </Avatar>
            <Typography variant="caption" fontWeight="bold" noWrap>
              {user?.first_name} {user?.last_name}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="caption">
              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={getStatusIcon(shift.status)}
              label={shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
              color={getStatusColor(shift.status) as any}
              size="small"
              sx={{ fontSize: '0.6rem', height: 20 }}
            />
            
            {shift.status === 'scheduled' && !shift.check_in_time && (
              <Tooltip title={checkInValidation.reason || 'Check In'}>
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={!!checkingIn || !checkInValidation.allowed}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (checkInValidation.allowed) {
                        handleCheckIn(shift.id);
                      }
                    }}
                    sx={{ 
                      fontSize: '0.6rem', 
                      height: 20,
                      opacity: checkInValidation.allowed ? 1 : 0.6
                    }}
                  >
                    {checkingIn === shift.id ? <CircularProgress size={12} /> : 'Check In'}
                  </Button>
                </span>
              </Tooltip>
            )}
            
            {shift.status === 'active' && !shift.check_out_time && (
              <Button
                variant="contained"
                color="success"
                size="small"
                disabled={!!checkingOut}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckOut(shift.id);
                }}
                sx={{ fontSize: '0.6rem', height: 20 }}
              >
                {checkingOut === shift.id ? <CircularProgress size={12} /> : 'Check Out'}
              </Button>
            )}
          </Box>
          
          {shift.status === 'scheduled' && !checkInValidation.allowed && checkInValidation.reason && (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <WarningIcon fontSize="small" color="warning" />
              <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.5rem' }}>
                {checkInValidation.reason}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCalendarView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigateWeek('prev')}>
              <ChevronLeftIcon />
            </IconButton>
            
            <Typography variant="h6" fontWeight="bold">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </Typography>
            
            <IconButton onClick={() => navigateWeek('next')}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          
          <Button
            startIcon={<TodayIcon />}
            onClick={() => setCurrentDate(new Date())}
            size="small"
            variant="outlined"
          >
            Today
          </Button>
        </Box>

        <Paper elevation={1}>
          {/* Day Headers */}
          <Grid container>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <Grid item xs={12/7} key={day}>
                <Box
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    backgroundColor: 'grey.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {day}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Days */}
          <Grid container>
            {weekDays.map((date, index) => {
              const dayShifts = getShiftsForDate(date);
              const isCurrentDay = isToday(date);
              
              return (
                <Grid 
                  item 
                  xs={12/7} 
                  key={index}
                  sx={{
                    minHeight: 200,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: isCurrentDay ? 'primary.50' : 'white'
                  }}
                >
                  {/* Day Header */}
                  <Box
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      backgroundColor: isCurrentDay ? 'primary.main' : 'transparent',
                      color: isCurrentDay ? 'white' : 'text.primary',
                      borderRadius: 1,
                      fontWeight: isCurrentDay ? 'bold' : 'normal'
                    }}
                  >
                    <Typography variant="caption" display="block">
                      {format(date, 'EEE')}
                    </Typography>
                    <Typography variant="h6">
                      {format(date, 'd')}
                    </Typography>
                  </Box>
                  
                  {/* Shifts for the day */}
                  <Box sx={{ p: 1 }}>
                    {dayShifts.length > 0 ? (
                      dayShifts.map(renderShiftCard)
                    ) : (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        No shifts
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </Box>
    );
  };

  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Status</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Center</TableCell>
            <TableCell>Check-In</TableCell>
            <TableCell>Check-Out</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shifts.map((shift) => {
            const checkInValidation = canCheckIn(shift);
            
            return (
              <TableRow key={shift.id} hover>
                <TableCell>
                  <Chip label={shift.status.toUpperCase()} color={getStatusColor(shift.status) as any} size="small" />
                </TableCell>
                <TableCell>{format(parseISO(shift.start_time), 'MMM dd, yyyy HH:mm')}</TableCell>
                <TableCell>{format(parseISO(shift.end_time), 'MMM dd, yyyy HH:mm')}</TableCell>
                <TableCell>{shift.center_name || '-'}</TableCell>
                <TableCell>
                  {shift.check_in_time ? format(parseISO(shift.check_in_time), 'MMM dd, HH:mm') : <Typography color="text.secondary">-</Typography>}
                </TableCell>
                <TableCell>
                  {shift.check_out_time ? format(parseISO(shift.check_out_time), 'MMM dd, HH:mm') : <Typography color="text.secondary">-</Typography>}
                </TableCell>
                <TableCell align="center">
                  {shift.status === 'scheduled' && !shift.check_in_time && (
                    <Tooltip title={checkInValidation.reason || 'Check In'}>
                      <span>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          disabled={!!checkingIn || !checkInValidation.allowed}
                          onClick={() => {
                            if (checkInValidation.allowed) {
                              handleCheckIn(shift.id);
                            }
                          }}
                          sx={{ 
                            opacity: checkInValidation.allowed ? 1 : 0.6
                          }}
                        >
                          {checkingIn === shift.id ? <CircularProgress size={20} /> : 'Check In'}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                  {shift.status === 'active' && !shift.check_out_time && (
                    <Tooltip title="Check Out">
                      <span>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          disabled={!!checkingOut}
                          onClick={() => handleCheckOut(shift.id)}
                        >
                          {checkingOut === shift.id ? <CircularProgress size={20} /> : 'Check Out'}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Shifts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your scheduled shifts, check in/out, and manage your availability.
          </Typography>
        </Box>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="list" aria-label="list view">
            <ListIcon />
          </ToggleButton>
          <ToggleButton value="calendar" aria-label="calendar view">
            <WeekIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : shifts.length === 0 ? (
            <Alert severity="info">No shifts assigned yet.</Alert>
          ) : (
            <Box>
              {viewMode === 'list' && renderListView()}
              {viewMode === 'calendar' && renderCalendarView()}
            </Box>
          )}
        </CardContent>
      </Card>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShiftManagement; 