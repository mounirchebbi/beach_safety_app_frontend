import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import NoSwimZoneManagement from './NoSwimZoneManagement';

const SafetyZonesManagement: React.FC = () => {
  const { user } = useAuth();

  // Get center ID from user's center assignment
  const getCenterId = () => {
    // For center admins, they should be assigned to a specific center
    // This would typically come from the user's profile or center assignment
    // For now, we'll use a placeholder - in a real app, this would be dynamic
    return user?.center_id || 'demo-center-id';
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Zones Management
      </Typography>
      
      <Card>
        <CardContent>
          <NoSwimZoneManagement centerId={getCenterId()} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default SafetyZonesManagement; 