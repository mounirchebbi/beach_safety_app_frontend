import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const SystemDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System Dashboard
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Welcome to the system dashboard!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor system-wide operations, manage centers, and view analytics.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemDashboard; 