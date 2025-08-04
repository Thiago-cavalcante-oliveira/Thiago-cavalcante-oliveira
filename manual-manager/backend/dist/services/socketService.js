"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
class SocketService {
    constructor(io) {
        this.connectedClients = new Map();
        this.io = io;
    }
    handleConnection(socket) {
        console.log(`Client connected: ${socket.id}`);
        this.connectedClients.set(socket.id, socket);
        socket.on('join-user-room', (userId) => {
            socket.join(`user-${userId}`);
            console.log(`User ${userId} joined their room`);
        });
        socket.on('join-manual-room', (manualId) => {
            socket.join(`manual-${manualId}`);
            console.log(`Client joined manual room: ${manualId}`);
        });
        socket.on('leave-manual-room', (manualId) => {
            socket.leave(`manual-${manualId}`);
            console.log(`Client left manual room: ${manualId}`);
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            this.connectedClients.delete(socket.id);
        });
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });
    }
    emitGenerationProgress(manualId, progress) {
        this.io.to(`manual-${manualId}`).emit('generation-progress', progress);
        console.log(`Emitted progress for manual ${manualId}:`, progress);
    }
    emitGenerationComplete(manualId, result) {
        this.io.to(`manual-${manualId}`).emit('generation-complete', {
            manualId,
            result,
            timestamp: Date.now()
        });
        console.log(`Emitted completion for manual ${manualId}`);
    }
    emitGenerationError(manualId, error) {
        this.io.to(`manual-${manualId}`).emit('generation-error', {
            manualId,
            error,
            timestamp: Date.now()
        });
        console.log(`Emitted error for manual ${manualId}:`, error);
    }
    emitUserNotification(userId, notification) {
        this.io.to(`user-${userId}`).emit('notification', {
            ...notification,
            timestamp: Date.now()
        });
        console.log(`Emitted notification to user ${userId}:`, notification);
    }
    broadcastSystemNotification(notification) {
        this.io.emit('system-notification', {
            ...notification,
            timestamp: Date.now()
        });
        console.log('Broadcasted system notification:', notification);
    }
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    getClientsInRoom(room) {
        return new Promise((resolve) => {
            this.io.in(room).allSockets().then((sockets) => {
                resolve(Array.from(sockets));
            });
        });
    }
    emitManualListUpdate(userId) {
        const event = 'manual-list-updated';
        const data = { timestamp: Date.now() };
        if (userId) {
            this.io.to(`user-${userId}`).emit(event, data);
        }
        else {
            this.io.emit(event, data);
        }
    }
    emitManualUpdate(manualId, manual) {
        this.io.to(`manual-${manualId}`).emit('manual-updated', {
            manualId,
            manual,
            timestamp: Date.now()
        });
        this.emitManualListUpdate();
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=socketService.js.map