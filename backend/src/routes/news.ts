import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const newsSchema = Joi.object({
  titleRu: Joi.string().min(1).max(500).required(),
  titleEn: Joi.string().min(1).max(500).optional(),
  contentRu: Joi.string().min(1).required(),
  contentEn: Joi.string().min(1).optional(),
  excerptRu: Joi.string().max(1000).optional(),
  excerptEn: Joi.string().max(1000).optional(),
  featuredImage: Joi.string().uri().optional(),
  published: Joi.boolean().default(false),
  publishedAt: Joi.date().optional(),
  tagIds: Joi.array().items(Joi.string()).optional(),
  categoryIds: Joi.array().items(Joi.string()).optional()
});

// Get all news (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const published = req.query.published !== 'false';

    const where = published ? { published: true } : {};

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          tags: true,
          categories: true,
          _count: {
            select: {
              comments: {
                where: { status: 'APPROVED' }
              }
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.news.count({ where })
    ]);

    res.json({
      news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Ошибка получения новостей' });
  }
});

// Get single news by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        tags: true,
        categories: true,
        comments: {
          where: { status: 'APPROVED', parentId: null },
          include: {
            replies: {
              where: { status: 'APPROVED' },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            comments: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    });

    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    // Increment views for published news
    if (news.published) {
      await prisma.news.update({
        where: { id },
        data: { views: { increment: 1 } }
      });
    }

    res.json(news);
  } catch (error) {
    console.error('Get news by ID error:', error);
    res.status(500).json({ error: 'Ошибка получения новости' });
  }
});

// Create news (admin/editor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = newsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { tagIds, categoryIds, ...newsData } = value;

    const news = await prisma.news.create({
      data: {
        ...newsData,
        authorId: req.user.userId,
        publishedAt: value.published ? new Date() : null,
        tags: tagIds ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined,
        categories: categoryIds ? {
          connect: categoryIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        tags: true,
        categories: true
      }
    });

    res.status(201).json(news);
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ error: 'Ошибка создания новости' });
  }
});

// Update news (admin/editor only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = newsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { id }
    });

    if (!existingNews) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    // Check permissions (only author or admin can edit)
    if (existingNews.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования' });
    }

    const { tagIds, categoryIds, ...newsData } = value;

    const news = await prisma.news.update({
      where: { id },
      data: {
        ...newsData,
        publishedAt: value.published && !existingNews.published ? new Date() : existingNews.publishedAt,
        tags: tagIds ? {
          set: tagIds.map((id: string) => ({ id }))
        } : undefined,
        categories: categoryIds ? {
          set: categoryIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        tags: true,
        categories: true
      }
    });

    res.json(news);
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ error: 'Ошибка обновления новости' });
  }
});

// Delete news (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Недостаточно прав для удаления' });
    }

    const news = await prisma.news.findUnique({
      where: { id }
    });

    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    await prisma.news.delete({
      where: { id }
    });

    res.json({ message: 'Новость успешно удалена' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ error: 'Ошибка удаления новости' });
  }
});

module.exports = router;