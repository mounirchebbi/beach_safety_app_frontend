import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const SystemCenterManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System Center Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Manage All Centers
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all beach safety centers across the system.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemCenterManagement; 