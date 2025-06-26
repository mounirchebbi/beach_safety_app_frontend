import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const EmergencyAlerts: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Emergency Alerts
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Emergency Response
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and respond to emergency alerts in real-time.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmergencyAlerts; 