import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameWeek,
  isToday,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  isWithinInterval,
  parseISO,
  isAfter,
  isBefore
} from 'date-fns';

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
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  center_name: string;
}

interface ShiftCalendarProps {
  shifts: ShiftWithLifeguard[];
  onShiftClick?: (shift: ShiftWithLifeguard) => void;
  onDateClick?: (date: Date) => void;
}

type ViewMode = 'week' | 'month';

const ShiftCalendar: React.FC<ShiftCalendarProps> = ({ 
  shifts, 
  onShiftClick, 
  onDateClick 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Navigation functions
  const goToPrevious = () => {
    setCurrentDate(prev => 
      viewMode === 'week' ? subWeeks(prev, 1) : subWeeks(prev, 4)
    );
  };

  const goToNext = () => {
    setCurrentDate(prev => 
      viewMode === 'week' ? addWeeks(prev, 1) : addWeeks(prev, 4)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }), // Monday start
        end: endOfWeek(currentDate, { weekStartsOn: 1 })
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      };
    }
  }, [currentDate, viewMode]);

  // Get days to display
  const days = useMemo(() => {
    if (viewMode === 'week') {
      return eachDayOfInterval(dateRange);
    } else {
      // For month view, get all weeks that contain the month
      const weeks = eachWeekOfInterval(dateRange, { weekStartsOn: 1 });
      return weeks.flatMap(week => 
        eachDayOfInterval({
          start: startOfWeek(week, { weekStartsOn: 1 }),
          end: endOfWeek(week, { weekStartsOn: 1 })
        })
      );
    }
  }, [dateRange, viewMode]);

  // Get shifts for a specific day
  const getShiftsForDay = (date: Date) => {
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
      case 'scheduled': return <ScheduleIcon fontSize="small" />;
      case 'active': return <CheckCircleIcon fontSize="small" />;
      case 'completed': return <CheckCircleIcon fontSize="small" />;
      case 'cancelled': return <CancelIcon fontSize="small" />;
      default: return <WarningIcon fontSize="small" />;
    }
  };

  // Check if shift is overdue
  const isShiftOverdue = (endTime: string, status: string) => {
    return status === 'active' && isBefore(parseISO(endTime), new Date());
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return format(parseISO(timeString), 'HH:mm');
  };

  // Get day header
  const getDayHeader = (date: Date) => {
    const isCurrentDay = isToday(date);
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    
    return (
      <Box
        sx={{
          p: 1,
          textAlign: 'center',
          backgroundColor: isCurrentDay ? 'primary.main' : 'transparent',
          color: isCurrentDay ? 'white' : isCurrentMonth ? 'text.primary' : 'text.secondary',
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
    );
  };

  // Render shift card
  const renderShiftCard = (shift: ShiftWithLifeguard) => (
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
      onClick={() => onShiftClick?.(shift)}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
            {shift.first_name.charAt(0)}
          </Avatar>
          <Typography variant="caption" fontWeight="bold" noWrap>
            {shift.first_name} {shift.last_name}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <TimeIcon fontSize="small" color="action" />
          <Typography variant="caption">
            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
          </Typography>
        </Box>
        
        <Chip
          icon={getStatusIcon(shift.status)}
          label={shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
          color={getStatusColor(shift.status) as any}
          size="small"
          variant={isShiftOverdue(shift.end_time, shift.status) ? "outlined" : "filled"}
          sx={{ fontSize: '0.6rem', height: 20 }}
        />
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Calendar Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={goToPrevious}>
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography variant="h6" fontWeight="bold">
            {viewMode === 'week' 
              ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </Typography>
          
          <IconButton onClick={goToNext}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newValue) => newValue && setViewMode(newValue)}
            size="small"
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            startIcon={<TodayIcon />}
            onClick={goToToday}
            size="small"
            variant="outlined"
          >
            Today
          </Button>
        </Box>
      </Box>

      {/* Calendar Grid */}
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
          {days.map((date, index) => {
            const dayShifts = getShiftsForDay(date);
            const isCurrentDay = isToday(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            
            return (
              <Grid 
                item 
                xs={12/7} 
                key={index}
                sx={{
                  minHeight: viewMode === 'week' ? 200 : 120,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: isCurrentDay ? 'primary.50' : 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => onDateClick?.(date)}
              >
                {getDayHeader(date)}
                
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

export default ShiftCalendar; 