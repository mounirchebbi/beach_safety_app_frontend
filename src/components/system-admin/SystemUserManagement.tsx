import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  Pagination,
  CircularProgress,
  Toolbar,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
  DeleteForever as HardDeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  LockReset as ResetPasswordIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { User } from '../../types';

interface UserManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
  success: string | null;
  total: number;
  filters: {
    role?: string;
    center_id?: string;
    search?: string;
    showInactive?: boolean;
  };
  selectedUser: User | null;
  dialogOpen: boolean;
  dialogType: 'view' | 'edit' | 'delete' | 'restore' | 'hardDelete' | 'resetPassword' | null;
  editForm: Partial<User>;
  passwordReset: {
    newPassword: string;
    confirmPassword: string;
  };
}

const SystemUserManagement: React.FC = () => {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: false,
    error: null,
    success: null,
    total: 0,
    filters: {
      showInactive: false
    },
    selectedUser: null,
    dialogOpen: false,
    dialogType: null,
    editForm: {},
    passwordReset: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const loadUsers = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiService.getAllUsers(
        1, // page not used by backend
        10, // limit not used by backend
        state.filters
      );
      setState(prev => ({
        ...prev,
        users: response.data || [],
        total: response.data?.length || 0,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to load users',
        loading: false
      }));
    }
  };

  useEffect(() => {
    loadUsers();
  }, [state.filters]);

  const handleFilterChange = (key: string, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  };

  // Pagination is not supported by the backend
  // const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
  //   setState(prev => ({ ...prev, page: value }));
  // };

  const openDialog = (type: UserManagementState['dialogType'], user?: User) => {
    setState(prev => ({
      ...prev,
      dialogOpen: true,
      dialogType: type,
      selectedUser: user || null,
      editForm: user ? { ...user } : {},
      passwordReset: { newPassword: '', confirmPassword: '' }
    }));
  };

  const closeDialog = () => {
    setState(prev => ({
      ...prev,
      dialogOpen: false,
      dialogType: null,
      selectedUser: null,
      editForm: {},
      passwordReset: { newPassword: '', confirmPassword: '' }
    }));
  };

  const handleSoftDelete = async () => {
    if (!state.selectedUser) return;
    
    try {
      await apiService.deleteUser(state.selectedUser.id);
      setState(prev => ({
        ...prev,
        success: 'User deactivated successfully',
        dialogOpen: false,
        dialogType: null,
        selectedUser: null
      }));
      loadUsers();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to deactivate user'
      }));
    }
  };

  const handleRestore = async () => {
    if (!state.selectedUser) return;
    
    try {
      await apiService.restoreUser(state.selectedUser.id);
      setState(prev => ({
        ...prev,
        success: 'User restored successfully',
        dialogOpen: false,
        dialogType: null,
        selectedUser: null
      }));
      loadUsers();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to restore user'
      }));
    }
  };

  const handleHardDelete = async () => {
    if (!state.selectedUser) return;
    
    try {
      await apiService.hardDeleteUser(state.selectedUser.id);
      setState(prev => ({
        ...prev,
        success: 'User permanently deleted',
        dialogOpen: false,
        dialogType: null,
        selectedUser: null
      }));
      loadUsers();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to delete user'
      }));
    }
  };

  const handleUpdateUser = async () => {
    if (!state.selectedUser) return;
    
    try {
      await apiService.updateUser(state.selectedUser.id, state.editForm);
      setState(prev => ({
        ...prev,
        success: 'User updated successfully',
        dialogOpen: false,
        dialogType: null,
        selectedUser: null
      }));
      loadUsers();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to update user'
      }));
    }
  };

  const handleResetPassword = async () => {
    if (!state.selectedUser || state.passwordReset.newPassword !== state.passwordReset.confirmPassword) {
      setState(prev => ({
        ...prev,
        error: 'Passwords do not match'
      }));
      return;
    }
    
    try {
      await apiService.resetUserPassword(state.selectedUser.id, state.passwordReset.newPassword);
      setState(prev => ({
        ...prev,
        success: 'Password reset successfully',
        dialogOpen: false,
        dialogType: null,
        selectedUser: null
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to reset password'
      }));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin': return 'error';
      case 'center_admin': return 'warning';
      case 'lifeguard': return 'info';
      default: return 'default';
    }
  };

  const getStatusChip = (user: User) => {
    if (!user.is_active) {
      return <Chip label="Inactive" color="error" size="small" />;
    }
    if (user.deleted_at) {
      return <Chip label="Deleted" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const renderDialog = () => {
    if (!state.selectedUser) return null;

    switch (state.dialogType) {
      case 'view':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
            <DialogTitle>User Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Name</Typography>
                  <Typography variant="body1">{state.selectedUser.first_name} {state.selectedUser.last_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body1">{state.selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Role</Typography>
                  <Chip label={state.selectedUser.role} color={getRoleColor(state.selectedUser.role)} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  {getStatusChip(state.selectedUser)}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography variant="body1">{state.selectedUser.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Center ID</Typography>
                  <Typography variant="body1">{state.selectedUser.center_id || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Created</Typography>
                  <Typography variant="body1">{new Date(state.selectedUser.created_at).toLocaleDateString()}</Typography>
                </Grid>
                {state.selectedUser.updated_at && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Last Updated</Typography>
                    <Typography variant="body1">{new Date(state.selectedUser.updated_at).toLocaleDateString()}</Typography>
                  </Grid>
                )}
                {state.selectedUser.deleted_at && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Deleted</Typography>
                    <Typography variant="body1">{new Date(state.selectedUser.deleted_at).toLocaleDateString()}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Close</Button>
            </DialogActions>
          </Dialog>
        );

      case 'edit':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
            <DialogTitle>Edit User</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={state.editForm.first_name || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, first_name: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={state.editForm.last_name || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, last_name: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={state.editForm.email || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, email: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={state.editForm.phone || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      editForm: { ...prev.editForm, phone: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={state.editForm.role || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        editForm: { ...prev.editForm, role: e.target.value as 'system_admin' | 'center_admin' | 'lifeguard' }
                      }))}
                    >
                      <MenuItem value="system_admin">System Admin</MenuItem>
                      <MenuItem value="center_admin">Center Admin</MenuItem>
                      <MenuItem value="lifeguard">Lifeguard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.editForm.is_active || false}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          editForm: { ...prev.editForm, is_active: e.target.checked }
                        }))}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleUpdateUser} variant="contained">Update</Button>
            </DialogActions>
          </Dialog>
        );

      case 'delete':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog}>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to deactivate {state.selectedUser.first_name} {state.selectedUser.last_name}?
                This action can be undone by restoring the user.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSoftDelete} color="warning" variant="contained">
                Deactivate
              </Button>
            </DialogActions>
          </Dialog>
        );

      case 'restore':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog}>
            <DialogTitle>Restore User</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to restore {state.selectedUser.first_name} {state.selectedUser.last_name}?
                This will reactivate their account.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleRestore} color="success" variant="contained">
                Restore
              </Button>
            </DialogActions>
          </Dialog>
        );

      case 'hardDelete':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog}>
            <DialogTitle>Permanently Delete User</DialogTitle>
            <DialogContent>
              <Typography color="error">
                WARNING: This action cannot be undone. Are you sure you want to permanently delete 
                {state.selectedUser.first_name} {state.selectedUser.last_name}?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleHardDelete} color="error" variant="contained">
                Permanently Delete
              </Button>
            </DialogActions>
          </Dialog>
        );

      case 'resetPassword':
        return (
          <Dialog open={state.dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Reset password for {state.selectedUser.first_name} {state.selectedUser.last_name}
              </Typography>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={state.passwordReset.newPassword}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  passwordReset: { ...prev.passwordReset, newPassword: e.target.value }
                }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                value={state.passwordReset.confirmPassword}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  passwordReset: { ...prev.passwordReset, confirmPassword: e.target.value }
                }))}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleResetPassword} variant="contained">
                Reset Password
              </Button>
            </DialogActions>
          </Dialog>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System User Management
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={state.filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={state.filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="system_admin">System Admin</MenuItem>
                  <MenuItem value="center_admin">Center Admin</MenuItem>
                  <MenuItem value="lifeguard">Lifeguard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.filters.showInactive || false}
                    onChange={(e) => handleFilterChange('showInactive', e.target.checked)}
                  />
                }
                label="Show Inactive Users"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadUsers}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          {state.loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Center</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {state.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role.replace('_', ' ')} 
                            color={getRoleColor(user.role)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          {getStatusChip(user)}
                        </TableCell>
                        <TableCell>{user.center_id || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton onClick={() => openDialog('view', user)} size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit User">
                            <IconButton onClick={() => openDialog('edit', user)} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton onClick={() => openDialog('resetPassword', user)} size="small">
                              <ResetPasswordIcon />
                            </IconButton>
                          </Tooltip>
                          {user.is_active ? (
                            <Tooltip title="Deactivate User">
                              <IconButton onClick={() => openDialog('delete', user)} size="small" color="warning">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip title="Restore User">
                                <IconButton onClick={() => openDialog('restore', user)} size="small" color="success">
                                  <RestoreIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Permanently Delete">
                                <IconButton onClick={() => openDialog('hardDelete', user)} size="small" color="error">
                                  <HardDeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination - Disabled since backend doesn't support pagination */}
              {state.total > 0 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Showing all {state.total} users
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {renderDialog()}

      {/* Notifications */}
      <Snackbar
        open={!!state.error}
        autoHideDuration={6000}
        onClose={() => setState(prev => ({ ...prev, error: null }))}
      >
        <Alert severity="error" onClose={() => setState(prev => ({ ...prev, error: null }))}>
          {state.error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!state.success}
        autoHideDuration={6000}
        onClose={() => setState(prev => ({ ...prev, success: null }))}
      >
        <Alert severity="success" onClose={() => setState(prev => ({ ...prev, success: null }))}>
          {state.success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemUserManagement; 