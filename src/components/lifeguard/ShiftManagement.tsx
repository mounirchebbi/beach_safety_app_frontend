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
  Tooltip
} from '@mui/material';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { Shift } from '../../types';

const ShiftManagement: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Shifts
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View your scheduled shifts, check in/out, and manage your availability.
      </Typography>
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
                  {shifts.map((shift) => (
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
                          <Tooltip title="Check In">
                            <span>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                disabled={!!checkingIn}
                                onClick={() => handleCheckIn(shift.id)}
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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