"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const startGenerationSchema = zod_1.z.object({
    manualId: zod_1.z.string().uuid()
});
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status } = req.query;
        const where = {
            manual: {
                createdBy: userId
            }
        };
        if (status) {
            where.status = status;
        }
        const generations = await database_1.prisma.generation.findMany({
            where,
            include: {
                manual: {
                    select: {
                        id: true,
                        title: true,
                        url: true
                    }
                }
            },
            orderBy: { startedAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const total = await database_1.prisma.generation.count({ where });
        res.json({
            generations,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter gerações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const generation = await database_1.prisma.generation.findFirst({
            where: {
                id,
                manual: {
                    createdBy: userId
                }
            },
            include: {
                manual: {
                    select: {
                        id: true,
                        title: true,
                        url: true,
                        description: true
                    }
                }
            }
        });
        if (!generation) {
            return res.status(404).json({ error: 'Geração não encontrada' });
        }
        return res.json(generation);
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter geração:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.post('/start', async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = startGenerationSchema.parse(req.body);
        const manual = await database_1.prisma.manual.findFirst({
            where: {
                id: data.manualId,
                createdBy: userId
            }
        });
        if (!manual) {
            return res.status(404).json({ error: 'Manual não encontrado' });
        }
        const existingGeneration = await database_1.prisma.generation.findFirst({
            where: {
                manualId: data.manualId,
                status: { in: ['PENDING', 'RUNNING'] }
            }
        });
        if (existingGeneration) {
            return res.status(400).json({ error: 'Já existe uma geração em andamento para este manual' });
        }
        const generation = await database_1.prisma.generation.create({
            data: {
                manualId: data.manualId,
                status: 'PENDING',
                progress: 0
            },
            include: {
                manual: {
                    select: {
                        id: true,
                        title: true,
                        url: true
                    }
                }
            }
        });
        await database_1.prisma.manual.update({
            where: { id: data.manualId },
            data: { status: 'GENERATING' }
        });
        return res.status(201).json(generation);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        logger_1.logger.error('Erro ao iniciar geração:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.post('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const generation = await database_1.prisma.generation.findFirst({
            where: {
                id,
                manual: {
                    createdBy: userId
                }
            }
        });
        if (!generation) {
            return res.status(404).json({ error: 'Geração não encontrada' });
        }
        if (!['PENDING', 'RUNNING'].includes(generation.status)) {
            return res.status(400).json({ error: 'Geração não pode ser cancelada' });
        }
        const updatedGeneration = await database_1.prisma.generation.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                endedAt: new Date()
            }
        });
        await database_1.prisma.manual.update({
            where: { id: generation.manualId },
            data: { status: 'PENDING' }
        });
        return res.json(updatedGeneration);
    }
    catch (error) {
        logger_1.logger.error('Erro ao cancelar geração:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.get('/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const generation = await database_1.prisma.generation.findFirst({
            where: {
                id,
                manual: {
                    createdBy: userId
                }
            },
            select: {
                id: true,
                logs: true,
                status: true,
                progress: true,
                error: true
            }
        });
        if (!generation) {
            return res.status(404).json({ error: 'Geração não encontrada' });
        }
        return res.json({
            logs: generation.logs || [],
            status: generation.status,
            progress: generation.progress,
            error: generation.error
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter logs da geração:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
exports.default = router;
//# sourceMappingURL=generation.js.map