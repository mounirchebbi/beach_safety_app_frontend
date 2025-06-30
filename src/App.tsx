import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Layout from './components/common/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Public Pages
import PublicDashboard from './components/public/PublicDashboard';
import MapPage from './components/map/MapPage';

// Lifeguard Pages
import LifeguardDashboard from './components/lifeguard/LifeguardDashboard';
import ShiftManagement from './components/lifeguard/ShiftManagement';
import EmergencyAlerts from './components/lifeguard/EmergencyAlerts';
import IncidentReports from './components/lifeguard/IncidentReports';
import EmergencyEscalations from './components/lifeguard/EmergencyEscalations';

// Center Admin Pages
import CenterDashboard from './components/admin/CenterDashboard';
import CenterManagement from './components/admin/CenterManagement';
import LifeguardManagement from './components/admin/LifeguardManagement';
import ShiftScheduling from './components/admin/ShiftScheduling';
import SafetyManagement from './components/admin/SafetyManagement';
import AdminIncidentReports from './components/admin/IncidentReports';
import EscalationManagement from './components/admin/EscalationManagement';
import InterCenterSupport from './components/admin/InterCenterSupport';

// System Admin Pages
import SystemDashboard from './components/system-admin/SystemDashboard';
import SystemCenterManagement from './components/system-admin/SystemCenterManagement';
import SystemUserManagement from './components/system-admin/SystemUserManagement';
import SystemReports from './components/system-admin/SystemReports';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Main App Component
const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/dashboard" element={<PublicDashboard />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/dashboard" element={<PublicDashboard />} />
        <Route path="/map" element={<MapPage />} />

        {/* Lifeguard Routes */}
        <Route
          path="/lifeguard/*"
          element={
            <ProtectedRoute allowedRoles={['lifeguard']}>
              <Routes>
                <Route path="/" element={<LifeguardDashboard />} />
                <Route path="/shifts" element={<ShiftManagement />} />
                <Route path="/alerts" element={<EmergencyAlerts />} />
                <Route path="/reports" element={<IncidentReports />} />
                <Route path="/escalations" element={<EmergencyEscalations />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Center Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['center_admin']}>
              <Routes>
                <Route path="/" element={<CenterDashboard />} />
                <Route path="/center" element={<CenterManagement />} />
                <Route path="/lifeguards" element={<LifeguardManagement />} />
                <Route path="/shifts" element={<ShiftScheduling />} />
                <Route path="/safety" element={<SafetyManagement />} />
                <Route path="/reports" element={<AdminIncidentReports />} />
                <Route path="/escalations" element={<EscalationManagement />} />
                <Route path="/inter-center-support" element={<InterCenterSupport />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* System Admin Routes */}
        <Route
          path="/system/*"
          element={
            <ProtectedRoute allowedRoles={['system_admin']}>
              <Routes>
                <Route path="/" element={<SystemDashboard />} />
                <Route path="/centers" element={<SystemCenterManagement />} />
                <Route path="/users" element={<SystemUserManagement />} />
                <Route path="/reports" element={<SystemReports />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Default redirect based on user role */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                user?.role === 'lifeguard'
                  ? '/lifeguard'
                  : user?.role === 'center_admin'
                  ? '/admin'
                  : user?.role === 'system_admin'
                  ? '/system'
                  : '/dashboard' // Default to dashboard for public users
              }
              replace
            />
          }
        />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Router>
            <AuthProvider>
              <Box sx={{ minHeight: '100vh' }}>
                <AppContent />
              </Box>
            </AuthProvider>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
