import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const ShiftManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Shift Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Manage your shifts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your scheduled shifts, check in/out, and manage your availability.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ShiftManagement; 