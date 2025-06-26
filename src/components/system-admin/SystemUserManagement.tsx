import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const SystemUserManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System User Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Manage All Users
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all users across the system including lifeguards and administrators.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemUserManagement; 