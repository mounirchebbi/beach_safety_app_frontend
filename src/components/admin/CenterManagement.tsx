import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Tabs, 
  Tab
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import NoSwimZoneManagement from './NoSwimZoneManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`center-tabpanel-${index}`}
      aria-labelledby={`center-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CenterManagement: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
        Center Management
      </Typography>
      
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Center Information" />
              <Tab label="No-Swim Zones" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Center Information
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Update center information, operating hours, and contact details.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This section will contain forms for updating center details.
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <NoSwimZoneManagement centerId={getCenterId()} />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CenterManagement; 