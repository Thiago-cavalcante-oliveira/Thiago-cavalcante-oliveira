import { Server, Socket } from 'socket.io';

export interface GenerationProgress {
  manualId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  message?: string;
  error?: string;
}

export class SocketService {
  private io: Server;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  handleConnection(socket: Socket): void {
    console.log(`Client connected: ${socket.id}`);
    this.connectedClients.set(socket.id, socket);

    // Join user to their personal room for notifications
    socket.on('join-user-room', (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join manual generation room
    socket.on('join-manual-room', (manualId: string) => {
      socket.join(`manual-${manualId}`);
      console.log(`Client joined manual room: ${manualId}`);
    });

    // Leave manual generation room
    socket.on('leave-manual-room', (manualId: string) => {
      socket.leave(`manual-${manualId}`);
      console.log(`Client left manual room: ${manualId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      this.connectedClients.delete(socket.id);
    });

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  }

  // Emit generation progress to specific manual room
  emitGenerationProgress(manualId: string, progress: GenerationProgress): void {
    this.io.to(`manual-${manualId}`).emit('generation-progress', progress);
    console.log(`Emitted progress for manual ${manualId}:`, progress);
  }

  // Emit generation completion
  emitGenerationComplete(manualId: string, result: any): void {
    this.io.to(`manual-${manualId}`).emit('generation-complete', {
      manualId,
      result,
      timestamp: Date.now()
    });
    console.log(`Emitted completion for manual ${manualId}`);
  }

  // Emit generation error
  emitGenerationError(manualId: string, error: string): void {
    this.io.to(`manual-${manualId}`).emit('generation-error', {
      manualId,
      error,
      timestamp: Date.now()
    });
    console.log(`Emitted error for manual ${manualId}:`, error);
  }

  // Emit notification to specific user
  emitUserNotification(userId: string, notification: any): void {
    this.io.to(`user-${userId}`).emit('notification', {
      ...notification,
      timestamp: Date.now()
    });
    console.log(`Emitted notification to user ${userId}:`, notification);
  }

  // Broadcast system notification to all connected clients
  broadcastSystemNotification(notification: any): void {
    this.io.emit('system-notification', {
      ...notification,
      timestamp: Date.now()
    });
    console.log('Broadcasted system notification:', notification);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get clients in specific room
  getClientsInRoom(room: string): Promise<string[]> {
    return new Promise((resolve) => {
      this.io.in(room).allSockets().then((sockets) => {
        resolve(Array.from(sockets));
      });
    });
  }

  // Emit manual list update
  emitManualListUpdate(userId?: string): void {
    const event = 'manual-list-updated';
    const data = { timestamp: Date.now() };
    
    if (userId) {
      this.io.to(`user-${userId}`).emit(event, data);
    } else {
      this.io.emit(event, data);
    }
  }

  // Emit manual update
  emitManualUpdate(manualId: string, manual: any): void {
    this.io.to(`manual-${manualId}`).emit('manual-updated', {
      manualId,
      manual,
      timestamp: Date.now()
    });
    
    // Also emit to general manual list
    this.emitManualListUpdate();
  }
}