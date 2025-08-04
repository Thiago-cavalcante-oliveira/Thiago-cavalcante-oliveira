"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const createManualSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    url: zod_1.z.string().url(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    credentials: zod_1.z.object({
        username: zod_1.z.string().optional(),
        password: zod_1.z.string().optional(),
        apiKey: zod_1.z.string().optional()
    }).optional()
});
const updateManualSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    url: zod_1.z.string().url().optional(),
    status: zod_1.z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'ERROR', 'PUBLISHED', 'ARCHIVED']).optional()
});
const searchSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    status: zod_1.z.array(zod_1.z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'ERROR', 'PUBLISHED', 'ARCHIVED'])).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'title']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    page: zod_1.z.number().min(1).optional(),
    limit: zod_1.z.number().min(1).max(100).optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional()
});
router.get('/', async (req, res) => {
    try {
        const { query, status, sortBy = 'updatedAt', sortOrder = 'desc', page = 1, limit = 12, dateFrom, dateTo } = searchSchema.parse(req.query);
        const where = {
            createdBy: req.user.userId
        };
        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
            ];
        }
        if (status && status.length > 0) {
            where.status = { in: status };
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        const [manuals, total] = await Promise.all([
            database_1.prisma.manual.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    status: true,
                    tags: {
                        select: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    color: true
                                }
                            }
                        }
                    },
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            username: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }),
            database_1.prisma.manual.count({ where })
        ]);
        res.json({
            manuals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get manuals error:', error);
        res.status(400).json({ error: 'Invalid request parameters' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const manual = await database_1.prisma.manual.findFirst({
            where: { id, createdBy: userId },
            include: {
                user: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        if (!manual) {
            return res.status(404).json({ error: 'Manual not found' });
        }
        return res.json(manual);
    }
    catch (error) {
        logger_1.logger.error('Get manual error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', async (req, res) => {
    try {
        const data = createManualSchema.parse(req.body);
        const userId = req.user.userId;
        const manual = await database_1.prisma.manual.create({
            data: {
                title: data.title,
                description: data.description,
                url: data.url,
                createdBy: userId,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        res.status(201).json(manual);
        logger_1.logger.info(`Manual created: ${manual.id} by user ${userId}`);
    }
    catch (error) {
        logger_1.logger.error('Create manual error:', error);
        res.status(400).json({ error: 'Invalid request data' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateManualSchema.parse(req.body);
        const userId = req.user.userId;
        const existingManual = await database_1.prisma.manual.findFirst({
            where: { id, createdBy: userId }
        });
        if (!existingManual) {
            return res.status(404).json({ error: 'Manual not found' });
        }
        const manual = await database_1.prisma.manual.update({
            where: { id },
            data,
            include: {
                user: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        return res.json(manual);
    }
    catch (error) {
        logger_1.logger.error('Update manual error:', error);
        return res.status(400).json({ error: 'Invalid request data' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const existingManual = await database_1.prisma.manual.findFirst({
            where: { id, createdBy: userId }
        });
        if (!existingManual) {
            return res.status(404).json({ error: 'Manual not found' });
        }
        await database_1.prisma.manual.delete({
            where: { id }
        });
        return res.json({ message: 'Manual deleted successfully' });
        logger_1.logger.info(`Manual deleted: ${id} by user ${userId}`);
    }
    catch (error) {
        logger_1.logger.error('Update manual error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/meta/tags', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tags = await database_1.prisma.tag.findMany({
            where: {
                manuals: {
                    some: {
                        manual: {
                            createdBy: userId
                        }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                color: true
            }
        });
        const uniqueTags = tags.map(tag => tag.name).sort();
        res.json(uniqueTags);
    }
    catch (error) {
        logger_1.logger.error('Get tags error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=manuals.js.map