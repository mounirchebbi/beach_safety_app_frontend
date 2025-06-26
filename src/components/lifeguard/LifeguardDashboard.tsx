import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const LifeguardDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Lifeguard Dashboard
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Welcome to your lifeguard dashboard!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is where you'll manage your shifts, respond to emergencies, and report incidents.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LifeguardDashboard; 