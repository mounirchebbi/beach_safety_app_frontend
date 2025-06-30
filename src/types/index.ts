// User Types
export interface User {
  id: string;
  email: string;
  role: 'system_admin' | 'center_admin' | 'lifeguard';
  first_name: string;
  last_name: string;
  phone?: string;
  center_id?: string;
  created_at: string;
  is_active: boolean;
  lifeguard_info?: LifeguardInfo;
  center_info?: CenterInfo;
}

export interface LifeguardInfo {
  id: string;
  certification_level?: string;
  certification_expiry?: string;
  emergency_contact?: any;
  center_id: string;
  center_name: string;
  location: GeoJSON.Point;
}

export interface CenterInfo {
  id: string;
  name: string;
  location: GeoJSON.Point;
}

// Center Types
export interface Center {
  id: string;
  name: string;
  description?: string;
  location: GeoJSON.Point;
  address?: string;
  phone?: string;
  email?: string;
  operating_hours?: OperatingHours;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface OperatingHours {
  [key: string]: {
    open: string;
    close: string;
  };
}

// Lifeguard Types
export interface Lifeguard {
  id: string;
  user_id: string;
  center_id: string;
  certification_level?: string;
  certification_expiry?: string;
  emergency_contact?: any;
  created_at: string;
  updated_at: string;
  user: User;
}

// Shift Types
export interface Shift {
  id: string;
  lifeguard_id: string;
  center_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  check_in_time?: string;
  check_in_location?: GeoJSON.Point;
  check_out_time?: string;
  created_at: string;
  updated_at: string;
  center_name?: string;
  lifeguard: {
    id: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

// Weather Types
export interface WeatherData {
  id: string;
  center_id: string;
  temperature?: number;
  feels_like?: number;
  humidity?: number;
  pressure?: number;
  wind_speed?: number;
  wind_direction?: number;
  precipitation?: number;
  wave_height?: number;
  current_speed?: number;
  visibility?: number;
  weather_condition?: string;
  sunrise?: string;
  sunset?: string;
  recorded_at: string;
  created_at: string;
}

// Safety Types
export interface SafetyZone {
  id: string;
  center_id: string;
  name: string;
  zone_type: 'no_swim' | 'caution' | 'safe';
  geometry: GeoJSON.Polygon;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SafetyFlag {
  id: string;
  center_id: string;
  flag_status: 'green' | 'yellow' | 'red' | 'black';
  reason?: string;
  set_by: string | { first_name: string; last_name: string; email: string };
  set_at: string;
  expires_at?: string;
  created_at: string;
}

// Emergency Types
export interface EmergencyAlert {
  id: string;
  center_id: string;
  alert_type: 'sos' | 'medical' | 'drowning' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: GeoJSON.Point;
  description?: string;
  reported_by?: string;
  status: 'active' | 'responding' | 'resolved' | 'closed';
  assigned_lifeguard_id?: string;
  created_at: string;
  resolved_at?: string;
  updated_at: string;
}

// Incident Report Types
export interface IncidentReport {
  id: string;
  alert_id?: string;
  lifeguard_id: string;
  incident_type: string;
  description: string;
  action_taken?: string;
  outcome?: string;
  involved_persons?: any;
  created_at: string;
  updated_at: string;
  // Joined data from emergency_alerts
  alert_type?: string;
  severity?: string;
  alert_status?: string;
  alert_location?: any;
  alert_description?: string;
  // Joined data from users
  first_name?: string;
  last_name?: string;
  lifeguard_email?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'system_admin' | 'center_admin' | 'lifeguard';
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Map Types
export interface MapLocation {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Socket.io Event Types
export interface SocketEvents {
  // Client to Server
  join_center: (centerId: string) => void;
  join_system: () => void;
  acknowledge_alert: (data: { alertId: string; lifeguardId: string }) => void;
  shift_checkin: (data: { shiftId: string; location: MapLocation }) => void;
  shift_checkout: (data: { shiftId: string }) => void;
  update_safety_flag: (data: { centerId: string; flagStatus: string; reason?: string; setBy: string }) => void;
  emergency_broadcast: (data: { centerId: string; message: string; severity: string; broadcastBy: string }) => void;

  // Server to Client
  weather_update: (data: WeatherData & { timestamp: string }) => void;
  emergency_alert: (data: EmergencyAlert & { timestamp: string }) => void;
  alert_acknowledged: (data: { alertId: string; lifeguardId: string; status: string; timestamp: string }) => void;
  alert_status_change: (data: { alertId: string; status: string; assignedLifeguardId?: string; timestamp: string }) => void;
  shift_checkin_update: (data: { shiftId: string; lifeguardId: string; checkInTime: string; location: MapLocation }) => void;
  shift_checkout_update: (data: { shiftId: string; lifeguardId: string; checkOutTime: string }) => void;
  safety_flag_updated: (data: { flagId: string; flagStatus: string; reason?: string; setBy: string; setAt: string; timestamp: string }) => void;
  emergency_broadcast_update: (data: { message: string; severity: string; broadcastBy: string; timestamp: string }) => void;
  system_notification: (data: any & { timestamp: string }) => void;
}

// Form Types
export interface ShiftFormData {
  lifeguard_id: string;
  center_id: string;
  start_time: string;
  end_time: string;
}

export interface WeeklyScheduleFormData {
  lifeguard_id: string;
  center_id: string;
  start_time: string; // Time only (HH:mm format)
  end_time: string; // Time only (HH:mm format)
  days_of_week: number[]; // Array of day numbers (0-6, where 0 is Sunday)
  start_date: string; // Start date for the weekly schedule
  weeks_count: number; // Number of weeks to create shifts for
}

export interface CenterFormData {
  name: string;
  description?: string;
  location: MapLocation;
  address?: string;
  phone?: string;
  email?: string;
  operating_hours?: OperatingHours;
}

export interface IncidentReportFormData {
  alert_id?: string;
  incident_type: string;
  description: string;
  action_taken?: string;
  outcome?: string;
  involved_persons?: any;
}

export interface LifeguardFormData {
  email: string;
  password?: string; // Optional for updates
  first_name: string;
  last_name: string;
  phone?: string;
  certification_level?: string;
  certification_expiry?: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  is_active?: boolean;
}

// UI State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MapState {
  center: MapLocation;
  zoom: number;
  selectedCenter?: Center;
  selectedAlert?: EmergencyAlert;
}

// Weather API Types
export interface WeatherForecast {
  date: string;
  temperature: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  wave_height: number;
  current_speed: number;
  visibility: number;
}

// Dashboard Types
export interface DashboardStats {
  totalCenters: number;
  activeLifeguards: number;
  activeShifts: number;
  activeAlerts: number;
  weatherWarnings: number;
}

export interface CenterStats {
  centerId: string;
  centerName: string;
  activeLifeguards: number;
  activeShifts: number;
  activeAlerts: number;
  currentFlag: SafetyFlag | null;
  lastWeatherUpdate: WeatherData | null;
} 