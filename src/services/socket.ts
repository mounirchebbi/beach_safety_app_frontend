import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  connect(token?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.baseURL, {
      auth: {
        token: token || localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();

    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join center room
  joinCenter(centerId: string): void {
    if (this.socket) {
      this.socket.emit('join_center', centerId);
    }
  }

  // Join system admin room
  joinSystem(): void {
    if (this.socket) {
      this.socket.emit('join_system');
    }
  }

  // Acknowledge emergency alert
  acknowledgeAlert(alertId: string, lifeguardId: string): void {
    if (this.socket) {
      this.socket.emit('acknowledge_alert', { alertId, lifeguardId });
    }
  }

  // Shift check-in
  shiftCheckIn(shiftId: string, location: { lat: number; lng: number }): void {
    if (this.socket) {
      this.socket.emit('shift_checkin', { shiftId, location });
    }
  }

  // Shift check-out
  shiftCheckOut(shiftId: string): void {
    if (this.socket) {
      this.socket.emit('shift_checkout', { shiftId });
    }
  }

  // Update safety flag
  updateSafetyFlag(centerId: string, flagStatus: string, setBy: string, reason?: string): void {
    if (this.socket) {
      this.socket.emit('update_safety_flag', { centerId, flagStatus, reason, setBy });
    }
  }

  // Emergency broadcast
  emergencyBroadcast(centerId: string, message: string, severity: string, broadcastBy: string): void {
    if (this.socket) {
      this.socket.emit('emergency_broadcast', { centerId, message, severity, broadcastBy });
    }
  }

  // Listen for weather updates
  onWeatherUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('weather_update', callback);
    }
  }

  // Listen for emergency alerts
  onEmergencyAlert(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('emergency_alert', callback);
    }
  }

  // Listen for alert acknowledgments
  onAlertAcknowledged(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('alert_acknowledged', callback);
    }
  }

  // Listen for alert status changes
  onAlertStatusChange(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('alert_status_change', callback);
    }
  }

  // Listen for shift check-ins
  onShiftCheckIn(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('shift_checkin', callback);
    }
  }

  // Listen for shift check-outs
  onShiftCheckOut(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('shift_checkout', callback);
    }
  }

  // Listen for safety flag updates
  onSafetyFlagUpdated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('safety_flag_updated', callback);
    }
  }

  // Listen for emergency broadcasts
  onEmergencyBroadcast(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('emergency_broadcast', callback);
    }
  }

  // Listen for system notifications
  onSystemNotification(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('system_notification', callback);
    }
  }

  // Remove event listeners
  offWeatherUpdate(): void {
    if (this.socket) {
      this.socket.off('weather_update');
    }
  }

  offEmergencyAlert(): void {
    if (this.socket) {
      this.socket.off('emergency_alert');
    }
  }

  offAlertAcknowledged(): void {
    if (this.socket) {
      this.socket.off('alert_acknowledged');
    }
  }

  offAlertStatusChange(): void {
    if (this.socket) {
      this.socket.off('alert_status_change');
    }
  }

  offShiftCheckIn(): void {
    if (this.socket) {
      this.socket.off('shift_checkin');
    }
  }

  offShiftCheckOut(): void {
    if (this.socket) {
      this.socket.off('shift_checkout');
    }
  }

  offSafetyFlagUpdated(): void {
    if (this.socket) {
      this.socket.off('safety_flag_updated');
    }
  }

  offEmergencyBroadcast(): void {
    if (this.socket) {
      this.socket.off('emergency_broadcast');
    }
  }

  offSystemNotification(): void {
    if (this.socket) {
      this.socket.off('system_notification');
    }
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService; 