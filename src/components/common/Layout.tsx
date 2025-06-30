import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Schedule,
  Warning,
  Report,
  Settings,
  AccountCircle,
  Logout,
  Notifications,
  BeachAccess,
  LocationOn,
  Security,
  AdminPanelSettings,
  SystemUpdate,
  Assessment,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationSystem from './NotificationSystem';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'lifeguard':
        return [
          { text: 'Dashboard', icon: <Dashboard />, path: '/lifeguard' },
          { text: 'My Shifts', icon: <Schedule />, path: '/lifeguard/shifts' },
          { text: 'Emergency Alerts', icon: <Warning />, path: '/lifeguard/alerts' },
          { text: 'Incident Reports', icon: <Report />, path: '/lifeguard/reports' },
          { text: 'Emergency Escalations', icon: <Warning />, path: '/lifeguard/escalations' },
        ];
      case 'center_admin':
        return [
          { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
          { text: 'Center Management', icon: <LocationOn />, path: '/admin/center' },
          { text: 'Lifeguard Management', icon: <People />, path: '/admin/lifeguards' },
          { text: 'Shift Scheduling', icon: <Schedule />, path: '/admin/shifts' },
          { text: 'Safety Management', icon: <Security />, path: '/admin/safety' },
          { text: 'Incident Reports', icon: <Report />, path: '/admin/reports' },
          { text: 'Emergency Escalations', icon: <Warning />, path: '/admin/escalations' },
          { text: 'Inter-Center Support', icon: <AdminPanelSettings />, path: '/admin/inter-center-support' },
        ];
      case 'system_admin':
        return [
          { text: 'System Dashboard', icon: <Dashboard />, path: '/system' },
          { text: 'Center Management', icon: <LocationOn />, path: '/system/centers' },
          { text: 'User Management', icon: <People />, path: '/system/users' },
          { text: 'System Reports', icon: <Assessment />, path: '/system/reports' },
        ];
      default:
        return [];
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'System Administrator';
      case 'center_admin':
        return 'Center Administrator';
      case 'lifeguard':
        return 'Lifeguard';
      default:
        return role;
    }
  };

  const navigationItems = getNavigationItems();

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BeachAccess sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Beach Safety
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      
      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getRoleDisplayName(user?.role || '')}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={getRoleDisplayName(user?.role || '')}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>
      
      <Divider />
      
      {/* Navigation */}
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.contrastText' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.text || 'Beach Safety App'}
          </Typography>
          
          {/* Notifications */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          {/* Profile Menu */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ ml: 1 }}
          >
            <AccountCircle />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
      
      {/* Notification System */}
      <NotificationSystem />
    </Box>
  );
};

export default Layout; 