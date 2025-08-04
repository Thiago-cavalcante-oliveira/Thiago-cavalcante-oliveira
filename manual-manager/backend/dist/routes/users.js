"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(['USER', 'ADMIN']).optional()
});
router.get('/', (0, auth_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const users = await database_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.json(users);
    }
    catch (error) {
        logger_1.logger.error('Get users error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json(user);
    }
    catch (error) {
        logger_1.logger.error('Get user profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/profile', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const validatedData = updateUserSchema.parse(req.body);
        if (req.user?.role !== 'ADMIN') {
            delete validatedData.role;
        }
        const updatedUser = await database_1.prisma.user.update({
            where: { id: userId },
            data: validatedData,
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        logger_1.logger.info(`User profile updated: ${userId}`);
        return res.json(updatedUser);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.issues
            });
        }
        logger_1.logger.error('Update user profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', (0, auth_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateUserSchema.parse(req.body);
        const updatedUser = await database_1.prisma.user.update({
            where: { id },
            data: validatedData,
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        logger_1.logger.info(`User updated: ${id} by admin ${req.user?.id}`);
        return res.json(updatedUser);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.issues
            });
        }
        logger_1.logger.error('Update user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.id;
        if (id === adminId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await database_1.prisma.user.delete({
            where: { id }
        });
        logger_1.logger.info(`User deleted: ${id} by admin ${adminId}`);
        return res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Delete user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map