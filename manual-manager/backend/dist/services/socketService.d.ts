import { Server, Socket } from 'socket.io';
export interface GenerationProgress {
    manualId: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    currentStep?: string;
    message?: string;
    error?: string;
}
export declare class SocketService {
    private io;
    private connectedClients;
    constructor(io: Server);
    handleConnection(socket: Socket): void;
    emitGenerationProgress(manualId: string, progress: GenerationProgress): void;
    emitGenerationComplete(manualId: string, result: any): void;
    emitGenerationError(manualId: string, error: string): void;
    emitUserNotification(userId: string, notification: any): void;
    broadcastSystemNotification(notification: any): void;
    getConnectedClientsCount(): number;
    getClientsInRoom(room: string): Promise<string[]>;
    emitManualListUpdate(userId?: string): void;
    emitManualUpdate(manualId: string, manual: any): void;
}
//# sourceMappingURL=socketService.d.ts.map