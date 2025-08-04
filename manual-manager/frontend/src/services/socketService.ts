import { io, Socket } from 'socket.io-client';
import {
  SocketEvents,
  GenerationProgressData,
  GenerationCompletedData,
  GenerationErrorData,
  NotificationData,
} from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const token = localStorage.getItem('token');
    
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Generation events
  onGenerationProgress(callback: (data: GenerationProgressData) => void): void {
    this.socket?.on('generation:progress', callback);
  }

  onGenerationCompleted(callback: (data: GenerationCompletedData) => void): void {
    this.socket?.on('generation:completed', callback);
  }

  onGenerationError(callback: (data: GenerationErrorData) => void): void {
    this.socket?.on('generation:error', callback);
  }

  offGenerationProgress(callback?: (data: GenerationProgressData) => void): void {
    this.socket?.off('generation:progress', callback);
  }

  offGenerationCompleted(callback?: (data: GenerationCompletedData) => void): void {
    this.socket?.off('generation:completed', callback);
  }

  offGenerationError(callback?: (data: GenerationErrorData) => void): void {
    this.socket?.off('generation:error', callback);
  }

  // Manual events
  onManualUpdated(callback: (manual: any) => void): void {
    this.socket?.on('manual:updated', callback);
  }

  onManualDeleted(callback: (data: { id: string }) => void): void {
    this.socket?.on('manual:deleted', callback);
  }

  offManualUpdated(callback?: (manual: any) => void): void {
    this.socket?.off('manual:updated', callback);
  }

  offManualDeleted(callback?: (data: { id: string }) => void): void {
    this.socket?.off('manual:deleted', callback);
  }

  // Notification events
  onNotification(callback: (data: NotificationData) => void): void {
    this.socket?.on('notification', callback);
  }

  offNotification(callback?: (data: NotificationData) => void): void {
    this.socket?.off('notification', callback);
  }

  // User events
  onUserConnected(callback: (data: { userId: string; timestamp: Date }) => void): void {
    this.socket?.on('user:connected', callback);
  }

  onUserDisconnected(callback: (data: { userId: string; timestamp: Date }) => void): void {
    this.socket?.on('user:disconnected', callback);
  }

  offUserConnected(callback?: (data: { userId: string; timestamp: Date }) => void): void {
    this.socket?.off('user:connected', callback);
  }

  offUserDisconnected(callback?: (data: { userId: string; timestamp: Date }) => void): void {
    this.socket?.off('user:disconnected', callback);
  }

  // Room management
  joinRoom(room: string): void {
    this.socket?.emit('join:room', room);
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave:room', room);
  }

  // Manual-specific rooms
  joinManualRoom(manualId: string): void {
    this.joinRoom(`manual:${manualId}`);
  }

  leaveManualRoom(manualId: string): void {
    this.leaveRoom(`manual:${manualId}`);
  }

  // Generation-specific rooms
  joinGenerationRoom(generationId: string): void {
    this.joinRoom(`generation:${generationId}`);
  }

  leaveGenerationRoom(generationId: string): void {
    this.leaveRoom(`generation:${generationId}`);
  }

  // Send custom events
  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  // Listen to custom events
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  // Remove custom event listeners
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  // Get connection status
  getConnectionStatus(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
    socketId?: string;
  } {
    return {
      connected: this.socket?.connected || false,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
    };
  }

  // Update auth token
  updateAuthToken(token: string): void {
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.connected) {
        this.socket.disconnect();
        this.connect();
      }
    }
  }

  // Clear auth token
  clearAuthToken(): void {
    if (this.socket) {
      this.socket.auth = {};
      if (this.socket.connected) {
        this.socket.disconnect();
      }
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
export { SocketService };