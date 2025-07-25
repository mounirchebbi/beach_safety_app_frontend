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
  IncidentReportFormData,
  WeeklyScheduleFormData,
  EscalationFormData,
  EmergencyEscalation
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
          // Don't redirect for authentication endpoints
          const isAuthEndpoint = error.config?.url?.includes('/auth/');
          if (!isAuthEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
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

  async restoreCenter(id: string): Promise<void> {
    await this.api.post(`/api/v1/centers/${id}/restore`);
  }

  async hardDeleteCenter(id: string): Promise<void> {
    await this.api.delete(`/api/v1/centers/${id}/hard`);
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

  async getPublicLifeguardCounts(): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/api/v1/public/lifeguards/counts');
    return response.data.data ?? [];
  }

  async getPublicSafetyFlags(): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/api/v1/public/safety/flags');
    return response.data.data ?? [];
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

  async restoreLifeguard(id: string): Promise<void> {
    await this.api.post(`/api/v1/lifeguards/${id}/restore`);
  }

  async hardDeleteLifeguard(id: string): Promise<void> {
    await this.api.delete(`/api/v1/lifeguards/${id}/hard`);
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

  async createWeeklySchedule(weeklyData: WeeklyScheduleFormData): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/shifts/weekly', weeklyData);
    return response.data;
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

  async getMyShifts(): Promise<Shift[]> {
    const response: AxiosResponse<PaginatedResponse<Shift>> = await this.api.get('/api/v1/shifts/my-shifts');
    return response.data.data;
  }

  async getCurrentShift(lifeguardId: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/api/v1/shifts/current/${lifeguardId}`);
    return response.data.data;
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
    location: { lat: number; lng: number };
    description?: string;
    alert_type?: 'sos' | 'medical' | 'drowning' | 'weather';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    center_id?: string;
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

  async getEmergencyStats(centerId: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/api/v1/alerts/public/stats/${centerId}`);
    return response.data.data;
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

  // Safety Flags
  async getCurrentSafetyFlag(centerId: string): Promise<SafetyFlag> {
    const response: AxiosResponse<ApiResponse<SafetyFlag>> = await this.api.get(`/api/v1/safety/centers/${centerId}/current`);
    return response.data.data!;
  }

  async getSafetyFlagHistory(centerId: string, page: number = 1, limit: number = 10): Promise<{ flags: any[]; pagination: { currentPage: number; totalPages: number; totalCount: number; hasNext: boolean; hasPrev: boolean } }> {
    const response = await this.api.get(`/api/v1/safety/centers/${centerId}/history?page=${page}&limit=${limit}`);
    return response.data;
  }

  async setSafetyFlag(centerId: string, flagData: {
    flag_status: 'green' | 'yellow' | 'red' | 'black';
    reason?: string;
    expires_at?: Date;
  }): Promise<SafetyFlag> {
    // Convert Date to ISO string for API
    const apiData = {
      ...flagData,
      expires_at: flagData.expires_at ? flagData.expires_at.toISOString() : undefined
    };
    const response: AxiosResponse<ApiResponse<SafetyFlag>> = await this.api.post(`/api/v1/safety/centers/${centerId}/flags`, apiData);
    return response.data.data!;
  }

  async updateSafetyFlag(flagId: string, flagData: {
    flag_status: 'green' | 'yellow' | 'red' | 'black';
    reason?: string;
    expires_at?: Date;
  }): Promise<SafetyFlag> {
    // Convert Date to ISO string for API
    const apiData = {
      ...flagData,
      expires_at: flagData.expires_at ? flagData.expires_at.toISOString() : undefined
    };
    const response: AxiosResponse<ApiResponse<SafetyFlag>> = await this.api.put(`/api/v1/safety/flags/${flagId}`, apiData);
    return response.data.data!;
  }

  async deleteSafetyFlag(flagId: string): Promise<void> {
    await this.api.delete(`/api/v1/safety/flags/${flagId}`);
  }

  async getAllSafetyFlags(page: number = 1, limit: number = 20, center_id?: string, flag_status?: string): Promise<PaginatedResponse<SafetyFlag>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (center_id) params.append('center_id', center_id);
    if (flag_status) params.append('flag_status', flag_status);
    
    const response: AxiosResponse<PaginatedResponse<SafetyFlag>> = await this.api.get(`/api/v1/safety/flags?${params}`);
    return response.data;
  }

  // Automatic flag management methods
  async getFlagManagementMode(centerId: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/api/v1/safety/centers/${centerId}/mode`);
    return response.data.data;
  }

  async triggerAutomaticFlagUpdate(centerId: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/api/v1/safety/centers/${centerId}/auto-update`);
    return response.data;
  }

  async switchToManualMode(centerId: string, flagData: {
    flag_status: 'green' | 'yellow' | 'red' | 'black';
    reason?: string;
    expires_at?: Date;
  }): Promise<SafetyFlag> {
    // Convert Date to ISO string for API
    const apiData = {
      ...flagData,
      expires_at: flagData.expires_at ? flagData.expires_at.toISOString() : undefined
    };
    const response: AxiosResponse<ApiResponse<SafetyFlag>> = await this.api.post(`/api/v1/safety/centers/${centerId}/manual`, apiData);
    return response.data.data!;
  }

  // System-wide flag management (System Admin only)
  async getAllCentersFlagStatus(): Promise<{
    centers: any[];
    summary: {
      total_centers: number;
      automatic_flags: number;
      manual_flags: number;
      expired_flags: number;
      no_flags: number;
      needs_attention: number;
    };
  }> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/api/v1/safety/system/status');
    return response.data.data;
  }

  async checkAndUpdateExpiredFlags(): Promise<{
    updated: number;
    centers: any[];
  }> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/safety/system/check-expired');
    return response.data.data;
  }

  async initializeAllCenterFlags(): Promise<{
    initialized: number;
    centers: any[];
  }> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/safety/system/initialize-flags');
    return response.data.data;
  }

  async forceUpdateAllCenterFlags(): Promise<{
    updated: any[];
    failed: any[];
    summary: {
      total_centers: number;
      successful_updates: number;
      failed_updates: number;
    };
  }> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/safety/system/force-update-all');
    return response.data.data;
  }

  // Safety Zones
  async getSafetyZonesByCenter(centerId: string): Promise<SafetyZone[]> {
    const response: AxiosResponse<ApiResponse<SafetyZone[]>> = await this.api.get(`/api/v1/safety-zones/centers/${centerId}`);
    return response.data.data ?? [];
  }

  async getSafetyZoneById(zoneId: string): Promise<SafetyZone> {
    const response: AxiosResponse<ApiResponse<SafetyZone>> = await this.api.get(`/api/v1/safety-zones/${zoneId}`);
    return response.data.data!;
  }

  async createSafetyZone(centerId: string, zoneData: {
    name: string;
    zone_type: 'no_swim' | 'caution' | 'safe';
    geometry: GeoJSON.Polygon;
    description?: string;
  }): Promise<SafetyZone> {
    const response: AxiosResponse<ApiResponse<SafetyZone>> = await this.api.post(`/api/v1/safety-zones/centers/${centerId}`, zoneData);
    return response.data.data!;
  }

  async updateSafetyZone(zoneId: string, zoneData: {
    name?: string;
    zone_type?: 'no_swim' | 'caution' | 'safe';
    geometry?: GeoJSON.Polygon;
    description?: string;
  }): Promise<SafetyZone> {
    const response: AxiosResponse<ApiResponse<SafetyZone>> = await this.api.put(`/api/v1/safety-zones/${zoneId}`, zoneData);
    return response.data.data!;
  }

  async deleteSafetyZone(zoneId: string): Promise<void> {
    await this.api.delete(`/api/v1/safety-zones/${zoneId}`);
  }

  // Public safety zones
  async getPublicSafetyZones(): Promise<SafetyZone[]> {
    const response: AxiosResponse<ApiResponse<SafetyZone[]>> = await this.api.get('/api/v1/safety-zones/public');
    return response.data.data ?? [];
  }

  // Incident Reports
  async createIncidentReport(reportData: IncidentReportFormData): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/reports', reportData);
    return response.data;
  }

  async getIncidentReports(page: number = 1, limit: number = 10, filters?: any): Promise<{
    data: IncidentReport[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response: AxiosResponse<{
      success: boolean;
      data: IncidentReport[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = await this.api.get(`/api/v1/reports?${params}`);
    return response.data;
  }

  async getIncidentReportById(id: string): Promise<IncidentReport> {
    const response: AxiosResponse<ApiResponse<IncidentReport>> = await this.api.get(`/api/v1/reports/${id}`);
    return response.data.data!;
  }

  async updateIncidentReport(id: string, reportData: Partial<IncidentReportFormData>): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/api/v1/reports/${id}`, reportData);
    return response.data;
  }

  async getMyIncidentReports(page: number = 1, limit: number = 10): Promise<{
    data: IncidentReport[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response: AxiosResponse<{
      success: boolean;
      data: IncidentReport[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = await this.api.get(`/api/v1/reports/my-reports?${params}`);
    return response.data;
  }

  // Emergency Escalations
  async createEscalation(escalationData: EscalationFormData): Promise<EmergencyEscalation> {
    const response: AxiosResponse<ApiResponse<EmergencyEscalation>> = await this.api.post('/api/v1/escalations', escalationData);
    return response.data.data!;
  }

  async getCenterEscalations(page: number = 1, limit: number = 10, filters?: any): Promise<{
    data: EmergencyEscalation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response: AxiosResponse<{
      success: boolean;
      data: EmergencyEscalation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = await this.api.get(`/api/v1/escalations/center?${params}`);
    return response.data;
  }

  async getMyEscalations(page: number = 1, limit: number = 10): Promise<{
    data: EmergencyEscalation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response: AxiosResponse<{
      success: boolean;
      data: EmergencyEscalation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = await this.api.get(`/api/v1/escalations/my-escalations?${params}`);
    return response.data;
  }

  async getEscalationById(id: string): Promise<EmergencyEscalation> {
    const response: AxiosResponse<ApiResponse<EmergencyEscalation>> = await this.api.get(`/api/v1/escalations/${id}`);
    return response.data.data!;
  }

  async acknowledgeEscalation(id: string): Promise<EmergencyEscalation> {
    const response: AxiosResponse<ApiResponse<EmergencyEscalation>> = await this.api.put(`/api/v1/escalations/${id}/acknowledge`);
    return response.data.data!;
  }

  async resolveEscalation(id: string): Promise<EmergencyEscalation> {
    const response: AxiosResponse<ApiResponse<EmergencyEscalation>> = await this.api.put(`/api/v1/escalations/${id}/resolve`);
    return response.data.data!;
  }

  // Inter-Center Support
  async createInterCenterSupportRequest(requestData: {
    target_center_id: string;
    escalation_id?: string;
    request_type: 'personnel_support' | 'equipment_support' | 'medical_support' | 'evacuation_support' | 'coordination_support';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    requested_resources?: any;
  }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/inter-center-support', requestData);
    return response.data.data!;
  }

  async getIncomingSupportRequests(page: number = 1, limit: number = 10): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response: AxiosResponse<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = await this.api.get(`/api/v1/inter-center-support/incoming?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getOutgoingSupportRequests(page: number = 1, limit: number = 10): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response: AxiosResponse<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = await this.api.get(`/api/v1/inter-center-support/outgoing?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getSupportRequestById(id: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/api/v1/inter-center-support/${id}`);
    return response.data.data!;
  }

  async acknowledgeSupportRequest(id: string, acknowledgmentNote?: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/api/v1/inter-center-support/${id}/acknowledge`, {
      acknowledgment_note: acknowledgmentNote
    });
    return response.data.data!;
  }

  async resolveSupportRequest(id: string, resolutionNote?: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/api/v1/inter-center-support/${id}/resolve`, {
      resolution_note: resolutionNote
    });
    return response.data.data!;
  }

  async declineSupportRequest(id: string, declineReason: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/api/v1/inter-center-support/${id}/decline`, { decline_reason: declineReason });
    return response.data.data!;
  }

  // System Admin User Management
  async getAllUsers(page: number = 1, limit: number = 10, filters?: {
    role?: string;
    center_id?: string;
    search?: string;
  }): Promise<{
    data: any[];
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters?.role) params.append('role', filters.role);
    if (filters?.center_id) params.append('center_id', filters.center_id);
    if (filters?.search) params.append('search', filters.search);

    const response: AxiosResponse<{
      success: boolean;
      data: any[];
    }> = await this.api.get(`/api/v1/auth/users?${params}`);
    
    return response.data;
  }

  async getUserById(id: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/api/v1/auth/users/${id}`);
    return response.data.data!;
  }

  async createUser(userData: {
    email: string;
    password: string;
    role: 'system_admin' | 'center_admin' | 'lifeguard';
    first_name: string;
    last_name: string;
    phone?: string;
    center_id?: string;
  }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/api/v1/auth/users', userData);
    return response.data.data!;
  }

  async updateUser(id: string, userData: Partial<{
    email: string;
    role: 'system_admin' | 'center_admin' | 'lifeguard';
    first_name: string;
    last_name: string;
    phone: string;
    center_id: string;
    is_active: boolean;
  }>): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/api/v1/auth/users/${id}`, userData);
    return response.data.data!;
  }

  async deleteUser(id: string): Promise<void> {
    await this.api.delete(`/api/v1/auth/users/${id}`);
  }

  async restoreUser(id: string): Promise<void> {
    await this.api.post(`/api/v1/auth/users/${id}/restore`);
  }

  async hardDeleteUser(id: string): Promise<void> {
    await this.api.delete(`/api/v1/auth/users/${id}/hard`);
  }

  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    await this.api.post(`/api/v1/auth/users/${id}/reset-password`, { new_password: newPassword });
  }

  // Center location check-in settings
  async getCenterLocationCheckInSetting(centerId: string): Promise<{
    id: string;
    name: string;
    require_location_check_in: boolean;
  }> {
    const response: AxiosResponse<ApiResponse<{
      id: string;
      name: string;
      require_location_check_in: boolean;
    }>> = await this.api.get(`/api/v1/centers/${centerId}/location-check-in`);
    return response.data.data!;
  }

  async updateCenterLocationCheckInSetting(centerId: string, requireLocationCheckIn: boolean): Promise<{
    id: string;
    name: string;
    require_location_check_in: boolean;
  }> {
    const response: AxiosResponse<ApiResponse<{
      id: string;
      name: string;
      require_location_check_in: boolean;
    }>> = await this.api.put(`/api/v1/centers/${centerId}/location-check-in`, {
      require_location_check_in: requireLocationCheckIn
    });
    return response.data.data!;
  }

  // Safety Flag Management
  async getSafetyFlags(centerId: string) {
    const response = await this.api.get(`/api/v1/safety/centers/${centerId}/history`);
    return response.data;
  }

  async triggerAutoUpdate(centerId: string) {
    const response = await this.api.post(`/api/v1/safety/centers/${centerId}/auto-update`);
    return response.data;
  }

  async setCenterRateLimit(centerId: string, enabled: boolean): Promise<void> {
    await this.api.patch(`/api/v1/centers/${centerId}/rate-limit`, { enabled });
  }
}

export const apiService = new ApiService();
export default apiService; 