import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  AuthResponse,
  Center,
  EmergencyAlert,
  IncidentReport,
  Lifeguard,
  LoginCredentials,
  PaginatedResponse,
  RegisterData,
  SafetyFlag,
  SafetyZone,
  Shift,
  User,
  WeatherData,
  CenterFormData,
  ShiftFormData,
  IncidentReportFormData
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/api/v1/auth/login', credentials);
    if (response.data.success && response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data!;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/api/v1/auth/register', userData);
    if (response.data.success && response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data!;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.get('/api/v1/auth/me');
    return response.data.data!.user;
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.put('/api/v1/auth/profile', profileData);
    return response.data.data!.user;
  }

  async logout(): Promise<void> {
    await this.api.post('/api/v1/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Centers
  async getCenters(): Promise<Center[]> {
    const response: AxiosResponse<PaginatedResponse<Center>> = await this.api.get('/api/v1/centers');
    return response.data.data;
  }

  async getCenterById(id: string): Promise<Center> {
    const response: AxiosResponse<ApiResponse<Center>> = await this.api.get(`/api/v1/centers/${id}`);
    return response.data.data!;
  }

  async createCenter(centerData: CenterFormData): Promise<Center> {
    const response: AxiosResponse<ApiResponse<Center>> = await this.api.post('/api/v1/centers', centerData);
    return response.data.data!;
  }

  async updateCenter(id: string, centerData: Partial<CenterFormData>): Promise<Center> {
    const response: AxiosResponse<ApiResponse<Center>> = await this.api.put(`/api/v1/centers/${id}`, centerData);
    return response.data.data!;
  }

  async deleteCenter(id: string): Promise<void> {
    await this.api.delete(`/api/v1/centers/${id}`);
  }

  async getCenterLifeguards(centerId: string): Promise<any[]> {
    const response: AxiosResponse<PaginatedResponse<any>> = await this.api.get(`/api/v1/centers/${centerId}/lifeguards`);
    return response.data.data;
  }

  async getCenterShifts(centerId: string, startDate?: string, endDate?: string): Promise<Shift[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response: AxiosResponse<PaginatedResponse<Shift>> = await this.api.get(`/api/v1/centers/${centerId}/shifts?${params}`);
    return response.data.data;
  }

  async getCenterWeather(centerId: string, limit?: number): Promise<WeatherData[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const response: AxiosResponse<PaginatedResponse<WeatherData>> = await this.api.get(`/api/v1/centers/${centerId}/weather?${params}`);
    return response.data.data;
  }

  // Public endpoints
  async getPublicCenters(): Promise<Center[]> {
    const response: AxiosResponse<PaginatedResponse<Center>> = await this.api.get('/api/v1/public/centers');
    return response.data.data;
  }

  async getCenterStatus(centerId: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/api/v1/public/centers/${centerId}/status`);
    return response.data.data;
  }

  async getCurrentWeather(): Promise<WeatherData[]> {
    const response: AxiosResponse<PaginatedResponse<WeatherData>> = await this.api.get('/api/v1/public/weather/current');
    return response.data.data;
  }

  // Lifeguards
  async getLifeguards(): Promise<any[]> {
    const response: AxiosResponse<PaginatedResponse<any>> = await this.api.get('/api/v1/lifeguards');
    return response.data.data;
  }

  async getLifeguardById(id: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/api/v1/lifeguards/${id}`);
    return response.data.data!;
  }

  async createLifeguard(lifeguardData: any): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/lifeguards', lifeguardData);
    return response.data.data!;
  }

  async updateLifeguard(id: string, lifeguardData: any): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/api/v1/lifeguards/${id}`, lifeguardData);
    return response.data.data!;
  }

  async deleteLifeguard(id: string): Promise<void> {
    await this.api.delete(`/api/v1/lifeguards/${id}`);
  }

  async getLifeguardShifts(lifeguardId: string): Promise<Shift[]> {
    const response: AxiosResponse<PaginatedResponse<Shift>> = await this.api.get(`/api/v1/lifeguards/${lifeguardId}/shifts`);
    return response.data.data;
  }

  // Shifts
  async getShifts(): Promise<any[]> {
    const response: AxiosResponse<PaginatedResponse<any>> = await this.api.get('/api/v1/shifts');
    return response.data.data;
  }

  async getShiftById(id: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/api/v1/shifts/${id}`);
    return response.data.data!;
  }

  async createShift(shiftData: ShiftFormData): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/shifts', shiftData);
    return response.data.data!;
  }

  async updateShift(id: string, shiftData: Partial<ShiftFormData>): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/api/v1/shifts/${id}`, shiftData);
    return response.data.data!;
  }

  async deleteShift(id: string): Promise<void> {
    await this.api.delete(`/api/v1/shifts/${id}`);
  }

  async checkInShift(id: string, location: { lat: number; lng: number }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/api/v1/shifts/${id}/check-in`, { location });
    return response.data.data!;
  }

  async checkOutShift(id: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/api/v1/shifts/${id}/check-out`);
    return response.data.data!;
  }

  // Weather
  async getCurrentWeatherForCenter(centerId: string): Promise<WeatherData> {
    const response: AxiosResponse<ApiResponse<WeatherData>> = await this.api.get(`/api/v1/weather/centers/${centerId}/current`);
    return response.data.data!;
  }

  async getWeatherForecast(centerId: string): Promise<WeatherData[]> {
    const response: AxiosResponse<PaginatedResponse<WeatherData>> = await this.api.get(`/api/v1/weather/centers/${centerId}/forecast`);
    return response.data.data;
  }

  async getWeatherHistory(centerId: string): Promise<WeatherData[]> {
    const response: AxiosResponse<PaginatedResponse<WeatherData>> = await this.api.get(`/api/v1/weather/centers/${centerId}/history`);
    return response.data.data;
  }

  // Emergency Alerts
  async createSOSAlert(alertData: {
    center_id: string;
    location: { lat: number; lng: number };
    description?: string;
  }): Promise<EmergencyAlert> {
    const response: AxiosResponse<ApiResponse<EmergencyAlert>> = await this.api.post('/api/v1/alerts/sos', alertData);
    return response.data.data!;
  }

  async getAlerts(): Promise<EmergencyAlert[]> {
    const response: AxiosResponse<PaginatedResponse<EmergencyAlert>> = await this.api.get('/api/v1/alerts');
    return response.data.data;
  }

  async getAlertById(id: string): Promise<EmergencyAlert> {
    const response: AxiosResponse<ApiResponse<EmergencyAlert>> = await this.api.get(`/api/v1/alerts/${id}`);
    return response.data.data!;
  }

  async updateAlertStatus(id: string, status: string): Promise<EmergencyAlert> {
    const response: AxiosResponse<ApiResponse<EmergencyAlert>> = await this.api.put(`/api/v1/alerts/${id}/status`, { status });
    return response.data.data!;
  }

  async assignAlert(id: string, lifeguardId: string): Promise<EmergencyAlert> {
    const response: AxiosResponse<ApiResponse<EmergencyAlert>> = await this.api.post(`/api/v1/alerts/${id}/assign`, { lifeguard_id: lifeguardId });
    return response.data.data!;
  }

  // Incident Reports
  async getReports(): Promise<IncidentReport[]> {
    const response: AxiosResponse<PaginatedResponse<IncidentReport>> = await this.api.get('/api/v1/reports');
    return response.data.data;
  }

  async getReportById(id: string): Promise<IncidentReport> {
    const response: AxiosResponse<ApiResponse<IncidentReport>> = await this.api.get(`/api/v1/reports/${id}`);
    return response.data.data!;
  }

  async createReport(reportData: IncidentReportFormData): Promise<IncidentReport> {
    const response: AxiosResponse<ApiResponse<IncidentReport>> = await this.api.post('/api/v1/reports', reportData);
    return response.data.data!;
  }

  async updateReport(id: string, reportData: Partial<IncidentReportFormData>): Promise<IncidentReport> {
    const response: AxiosResponse<ApiResponse<IncidentReport>> = await this.api.put(`/api/v1/reports/${id}`, reportData);
    return response.data.data!;
  }
}

export const apiService = new ApiService();
export default apiService; 