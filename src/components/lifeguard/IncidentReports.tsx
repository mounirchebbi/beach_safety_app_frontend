import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const IncidentReports: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Incident Reports
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Report Incidents
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage incident reports for safety documentation.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default IncidentReports; 