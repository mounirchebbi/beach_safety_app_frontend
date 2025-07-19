import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import CenterInformationForm from './CenterInformationForm';

const CenterManagement: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Center Information
      </Typography>
      
      <Card>
        <CardContent>
          <CenterInformationForm />
        </CardContent>
      </Card>
    </Box>
  );
};

export default CenterManagement; 