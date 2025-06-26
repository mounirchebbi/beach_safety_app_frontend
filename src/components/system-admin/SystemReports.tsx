import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const SystemReports: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System Reports
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            System Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View system-wide reports, analytics, and performance metrics.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemReports; 