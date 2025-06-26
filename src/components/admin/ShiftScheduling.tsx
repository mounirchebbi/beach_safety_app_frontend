import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const ShiftScheduling: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Shift Scheduling
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Schedule Shifts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage lifeguard shift schedules and assignments.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ShiftScheduling; 