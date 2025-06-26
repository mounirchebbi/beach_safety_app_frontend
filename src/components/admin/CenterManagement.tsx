import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const CenterManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Center Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Manage Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Update center information, operating hours, and contact details.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CenterManagement; 