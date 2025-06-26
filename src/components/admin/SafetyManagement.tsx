import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const SafetyManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Safety Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Safety Protocols
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage safety flags, zones, and emergency protocols.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SafetyManagement; 