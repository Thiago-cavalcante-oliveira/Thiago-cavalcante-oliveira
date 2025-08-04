import { Server } from 'socket.io';
import { SocketService } from './services/socketService';
declare const app: import("express-serve-static-core").Express;
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
declare const socketService: SocketService;
export { app, io, socketService };
//# sourceMappingURL=index.d.ts.map