"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const configSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    value: zod_1.z.any(),
    category: zod_1.z.string().optional(),
    isPublic: zod_1.z.boolean().optional()
});
router.get('/public', async (req, res) => {
    try {
        const configs = await database_1.prisma.configuration.findMany({
            where: { isPublic: true },
            select: {
                key: true,
                value: true,
                category: true
            }
        });
        return res.json(configs);
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter configurações públicas:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.get('/', async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const configs = await database_1.prisma.configuration.findMany({
            orderBy: { category: 'asc' }
        });
        return res.json(configs);
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter configurações:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const userRole = req.user.role;
        const config = await database_1.prisma.configuration.findUnique({
            where: { key }
        });
        if (!config) {
            return res.status(404).json({ error: 'Configuração não encontrada' });
        }
        if (!config.isPublic && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        return res.json(config);
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter configuração:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.put('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const userRole = req.user.role;
        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const data = configSchema.parse({ key, ...req.body });
        const config = await database_1.prisma.configuration.upsert({
            where: { key },
            update: {
                value: data.value,
                category: data.category || 'general',
                isPublic: data.isPublic || false
            },
            create: {
                key: data.key,
                value: data.value,
                category: data.category || 'general',
                isPublic: data.isPublic || false
            }
        });
        return res.json(config);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        logger_1.logger.error('Erro ao salvar configuração:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
router.delete('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const userRole = req.user.role;
        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const config = await database_1.prisma.configuration.findUnique({
            where: { key }
        });
        if (!config) {
            return res.status(404).json({ error: 'Configuração não encontrada' });
        }
        await database_1.prisma.configuration.delete({
            where: { key }
        });
        return res.json({ message: 'Configuração deletada com sucesso' });
    }
    catch (error) {
        logger_1.logger.error('Erro ao deletar configuração:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map