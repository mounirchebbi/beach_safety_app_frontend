import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const CenterDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Center Dashboard
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Welcome to your center dashboard!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your center operations, lifeguards, and safety protocols.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CenterDashboard; 