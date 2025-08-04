"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional()
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                username: true,
                password: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true
            }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await database_1.prisma.userSession.create({
            data: {
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        const { password: _, ...userWithoutPassword } = user;
        logger_1.logger.info(`User logged in: ${user.email}`);
        return res.json({
            user: userWithoutPassword,
            token
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        return res.status(400).json({ error: 'Invalid request data' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { email, username, password, firstName, lastName } = registerSchema.parse(req.body);
        const existingUser = await database_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
        const user = await database_1.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                firstName,
                lastName
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true
            }
        });
        logger_1.logger.info(`User registered: ${user.email}`);
        return res.status(201).json({ user });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        return res.status(400).json({ error: 'Invalid request data' });
    }
});
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            await database_1.prisma.userSession.updateMany({
                where: { token },
                data: { isActive: false }
            });
        }
        return res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true
            }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.json({ user });
    }
    catch (error) {
        logger_1.logger.error('Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map