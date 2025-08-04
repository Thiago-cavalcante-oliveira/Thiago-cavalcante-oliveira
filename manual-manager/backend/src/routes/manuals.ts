import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = Router();

// Validation schemas
const createManualSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url(),
  tags: z.array(z.string()).optional(),
  credentials: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional()
  }).optional()
});

const updateManualSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  status: z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'ERROR', 'PUBLISHED', 'ARCHIVED']).optional()
});

const searchSchema = z.object({
  query: z.string().optional(),
  status: z.array(z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'ERROR', 'PUBLISHED', 'ARCHIVED'])).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

// Get all manuals
router.get('/', async (req, res) => {
  try {
    const {
      query,
      status,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
      dateFrom,
      dateTo
    } = searchSchema.parse(req.query);

    const where: any = {
      createdBy: (req as any).user.userId
    };

    // Add search filters
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    // Tags filtering will be handled through ManualTag relation if needed

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [manuals, total] = await Promise.all([
      prisma.manual.findMany({
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
      prisma.manual.count({ where })
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
  } catch (error) {
    logger.error('Get manuals error:', error);
    res.status(400).json({ error: 'Invalid request parameters' });
  }
});

// Get manual by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const manual = await prisma.manual.findFirst({
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
  } catch (error) {
    logger.error('Get manual error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create manual
router.post('/', async (req, res) => {
  try {
    const data = createManualSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const manual = await prisma.manual.create({
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
    logger.info(`Manual created: ${manual.id} by user ${userId}`);
  } catch (error) {
    logger.error('Create manual error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Update manual
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateManualSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const existingManual = await prisma.manual.findFirst({
      where: { id, createdBy: userId }
    });

    if (!existingManual) {
      return res.status(404).json({ error: 'Manual not found' });
    }

    const manual = await prisma.manual.update({
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
  } catch (error) {
    logger.error('Update manual error:', error);
    return res.status(400).json({ error: 'Invalid request data' });
  }
});

// Delete manual
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const existingManual = await prisma.manual.findFirst({
      where: { id, createdBy: userId }
    });

    if (!existingManual) {
      return res.status(404).json({ error: 'Manual not found' });
    }

    await prisma.manual.delete({
      where: { id }
    });

    return res.json({ message: 'Manual deleted successfully' });
    logger.info(`Manual deleted: ${id} by user ${userId}`);
  } catch (error) {
    logger.error('Update manual error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available tags
router.get('/meta/tags', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const tags = await prisma.tag.findMany({
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
  } catch (error) {
    logger.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;