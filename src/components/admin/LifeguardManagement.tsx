import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const LifeguardManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Lifeguard Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Manage Lifeguards
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage lifeguard staff, certifications, and assignments.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LifeguardManagement; 