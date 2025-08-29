import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const tagSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().min(1).max(100).required(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
});

// Get all tags (public)
router.get('/', async (req, res) => {
  try {
    const tags = await prisma.newsTag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { news: true }
        }
      }
    });

    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Ошибка получения тегов' });
  }
});

// Get tag by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await prisma.newsTag.findUnique({
      where: { id },
      include: {
        news: {
          where: { published: true },
          include: {
            author: {
              select: { id: true, name: true }
            }
          },
          orderBy: { publishedAt: 'desc' }
        },
        _count: {
          select: { news: true }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Тег не найден' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({ error: 'Ошибка получения тега' });
  }
});

// Create tag (admin/editor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = tagSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if slug already exists
    const existingTag = await prisma.newsTag.findUnique({
      where: { slug: value.slug }
    });

    if (existingTag) {
      return res.status(400).json({ error: 'Тег с таким slug уже существует' });
    }

    const tag = await prisma.newsTag.create({
      data: value
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Ошибка создания тега' });
  }
});

// Update tag (admin/editor only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = tagSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if tag exists
    const existingTag = await prisma.newsTag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Тег не найден' });
    }

    // Check if slug already exists (excluding current tag)
    if (value.slug !== existingTag.slug) {
      const slugExists = await prisma.newsTag.findUnique({
        where: { slug: value.slug }
      });

      if (slugExists) {
        return res.status(400).json({ error: 'Тег с таким slug уже существует' });
      }
    }

    const tag = await prisma.newsTag.update({
      where: { id },
      data: value
    });

    res.json(tag);
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Ошибка обновления тега' });
  }
});

// Delete tag (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Недостаточно прав для удаления' });
    }

    const tag = await prisma.newsTag.findUnique({
      where: { id }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Тег не найден' });
    }

    await prisma.newsTag.delete({
      where: { id }
    });

    res.json({ message: 'Тег успешно удален' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Ошибка удаления тега' });
  }
});

module.exports = router;