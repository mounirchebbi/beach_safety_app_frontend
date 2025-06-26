import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';
import apiService from '../services/api';
import socketService from '../services/socket';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
          
          // Connect to socket with user's role
          if (currentUser.role === 'system_admin') {
            socketService.connect(token);
            socketService.joinSystem();
          } else if (currentUser.lifeguard_info?.center_id) {
            socketService.connect(token);
            socketService.joinCenter(currentUser.lifeguard_info.center_id);
          } else if (currentUser.center_info?.id) {
            socketService.connect(token);
            socketService.joinCenter(currentUser.center_info.id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.login(credentials);
      setUser(response.user);
      
      // Connect to socket based on user role
      if (response.user.role === 'system_admin') {
        socketService.connect(response.token);
        socketService.joinSystem();
      } else if (response.user.lifeguard_info?.center_id) {
        socketService.connect(response.token);
        socketService.joinCenter(response.user.lifeguard_info.center_id);
      } else if (response.user.center_info?.id) {
        socketService.connect(response.token);
        socketService.joinCenter(response.user.center_info.id);
      }
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.register(userData);
      setUser(response.user);
      
      // Connect to socket based on user role
      if (response.user.role === 'system_admin') {
        socketService.connect(response.token);
        socketService.joinSystem();
      } else if (response.user.lifeguard_info?.center_id) {
        socketService.connect(response.token);
        socketService.joinCenter(response.user.lifeguard_info.center_id);
      } else if (response.user.center_info?.id) {
        socketService.connect(response.token);
        socketService.joinCenter(response.user.center_info.id);
      }
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      socketService.disconnect();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 