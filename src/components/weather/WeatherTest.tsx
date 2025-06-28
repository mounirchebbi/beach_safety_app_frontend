import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import WeatherWidget from './WeatherWidget';
import WeatherAlerts from './WeatherAlerts';

const WeatherTest: React.FC = () => {
  // Using Hammamet center ID for testing
  const testCenterId = 'efe6b507-ecd3-4eac-bd21-82cbe1125cc0';
  const testCenterName = 'Hammamet Beach Safety Center';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Weather Integration Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          This page tests the weather integration for {testCenterName}
        </Typography>
      </Alert>

      <Box sx={{ mb: 4 }}>
        <WeatherWidget centerId={testCenterId} centerName={testCenterName} />
      </Box>

      <Box>
        <WeatherAlerts centerId={testCenterId} centerName={testCenterName} />
      </Box>
    </Box>
  );
};

export default WeatherTest; 