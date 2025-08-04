import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = Router();

// Schema de validação para configuração
const configSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  category: z.string().optional(),
  isPublic: z.boolean().optional()
});

// Obter todas as configurações públicas
router.get('/public', async (req, res) => {
  try {
    const configs = await prisma.configuration.findMany({
      where: { isPublic: true },
      select: {
        key: true,
        value: true,
        category: true
      }
    });

    return res.json(configs);
  } catch (error) {
    logger.error('Erro ao obter configurações públicas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter todas as configurações (apenas para admins)
router.get('/', async (req, res) => {
  try {
    const userRole = (req as any).user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const configs = await prisma.configuration.findMany({
      orderBy: { category: 'asc' }
    });

    return res.json(configs);
  } catch (error) {
    logger.error('Erro ao obter configurações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter configuração por chave
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const userRole = (req as any).user.role;

    const config = await prisma.configuration.findUnique({
      where: { key }
    });

    if (!config) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    // Verificar se o usuário pode acessar esta configuração
    if (!config.isPublic && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    return res.json(config);
  } catch (error) {
    logger.error('Erro ao obter configuração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar ou atualizar configuração (apenas para admins)
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const userRole = (req as any).user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const data = configSchema.parse({ key, ...req.body });

    const config = await prisma.configuration.upsert({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    }
    logger.error('Erro ao salvar configuração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar configuração (apenas para admins)
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const userRole = (req as any).user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const config = await prisma.configuration.findUnique({
      where: { key }
    });

    if (!config) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    await prisma.configuration.delete({
      where: { key }
    });

    return res.json({ message: 'Configuração deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar configuração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;