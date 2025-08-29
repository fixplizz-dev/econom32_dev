import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const commentSchema = Joi.object({
  newsId: Joi.string().required(),
  authorName: Joi.string().min(1).max(100).required(),
  authorEmail: Joi.string().email().required(),
  content: Joi.string().min(1).max(2000).required(),
  parentId: Joi.string().optional()
});

// Get comments for news (public - only approved)
router.get('/news/:newsId', async (req, res) => {
  try {
    const { newsId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        newsId,
        status: 'APPROVED',
        parentId: null // Only top-level comments
      },
      include: {
        replies: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Ошибка получения комментариев' });
  }
});

// Create comment (public)
router.post('/', async (req, res) => {
  try {
    const { error, value } = commentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if news exists
    const news = await prisma.news.findUnique({
      where: { id: value.newsId }
    });

    if (!news || !news.published) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    // Check if parent comment exists (for replies)
    if (value.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: value.parentId }
      });

      if (!parentComment || parentComment.newsId !== value.newsId) {
        return res.status(400).json({ error: 'Родительский комментарий не найден' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        ...value,
        status: 'PENDING' // All comments require moderation
      }
    });

    res.status(201).json({
      message: 'Комментарий отправлен на модерацию',
      comment: {
        id: comment.id,
        status: comment.status
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Ошибка создания комментария' });
  }
});

// Get all comments for moderation (admin/moderator only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          news: {
            select: {
              id: true,
              titleRu: true
            }
          },
          parent: {
            select: {
              id: true,
              authorName: true,
              content: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get comments for moderation error:', error);
    res.status(500).json({ error: 'Ошибка получения комментариев' });
  }
});

// Moderate comment (admin/moderator only)
router.put('/:id/moderate', authMiddleware, async (req, res) => {
  try {
    if (!['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        status,
        moderatedBy: req.user.userId,
        moderatedAt: new Date()
      }
    });

    res.json(updatedComment);
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({ error: 'Ошибка модерации комментария' });
  }
});

// Delete comment (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Недостаточно прав для удаления' });
    }

    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }

    // Delete comment and all its replies
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { id },
          { parentId: id }
        ]
      }
    });

    res.json({ message: 'Комментарий успешно удален' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Ошибка удаления комментария' });
  }
});

module.exports = router;