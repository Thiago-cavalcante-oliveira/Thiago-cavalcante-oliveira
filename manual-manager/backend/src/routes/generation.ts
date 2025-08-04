import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = Router();

// Schema de validação para iniciar geração
const startGenerationSchema = z.object({
  manualId: z.string().uuid()
});

// Obter todas as gerações do usuário
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const where: any = {
      manual: {
        createdBy: userId
      }
    };

    if (status) {
      where.status = status;
    }

    const generations = await prisma.generation.findMany({
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

    const total = await prisma.generation.count({ where });

    res.json({
      generations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Erro ao obter gerações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter geração por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const generation = await prisma.generation.findFirst({
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
  } catch (error) {
    logger.error('Erro ao obter geração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar nova geração
router.post('/start', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const data = startGenerationSchema.parse(req.body);

    // Verificar se o manual existe e pertence ao usuário
    const manual = await prisma.manual.findFirst({
      where: {
        id: data.manualId,
        createdBy: userId
      }
    });

    if (!manual) {
      return res.status(404).json({ error: 'Manual não encontrado' });
    }

    // Verificar se já existe uma geração em andamento para este manual
    const existingGeneration = await prisma.generation.findFirst({
      where: {
        manualId: data.manualId,
        status: { in: ['PENDING', 'RUNNING'] }
      }
    });

    if (existingGeneration) {
      return res.status(400).json({ error: 'Já existe uma geração em andamento para este manual' });
    }

    // Criar nova geração
    const generation = await prisma.generation.create({
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

    // Atualizar status do manual
    await prisma.manual.update({
      where: { id: data.manualId },
      data: { status: 'GENERATING' }
    });

    // TODO: Aqui você pode adicionar a lógica para iniciar o processo de geração
    // Por exemplo, adicionar a um queue de processamento

    return res.status(201).json(generation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    }
    logger.error('Erro ao iniciar geração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar geração
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const generation = await prisma.generation.findFirst({
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

    // Atualizar status da geração
    const updatedGeneration = await prisma.generation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        endedAt: new Date()
      }
    });

    // Atualizar status do manual
    await prisma.manual.update({
      where: { id: generation.manualId },
      data: { status: 'PENDING' }
    });

    return res.json(updatedGeneration);
  } catch (error) {
    logger.error('Erro ao cancelar geração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter logs da geração
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const generation = await prisma.generation.findFirst({
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
  } catch (error) {
    logger.error('Erro ao obter logs da geração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;