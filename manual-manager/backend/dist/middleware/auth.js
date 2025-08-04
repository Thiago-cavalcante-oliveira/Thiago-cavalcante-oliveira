"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Access denied. No token provided or invalid format.'
            });
            return;
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            logger_1.logger.error('JWT_SECRET not configured');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const session = await database_1.prisma.userSession.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        role: true,
                        isActive: true
                    }
                }
            }
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        if (!session.user.isActive) {
            res.status(401).json({ error: 'User account is deactivated' });
            return;
        }
        req.user = session.user;
        next();
    }
    catch (error) {
        logger_1.logger.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: roles,
                current: req.user.role
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            next();
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const session = await database_1.prisma.userSession.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        role: true,
                        isActive: true
                    }
                }
            }
        });
        if (session && session.isActive && session.expiresAt >= new Date() && session.user.isActive) {
            req.user = session.user;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map