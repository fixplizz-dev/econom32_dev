import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const categorySchema = Joi.object({
  nameRu: Joi.string().min(1).max(200).required(),
  nameEn: Joi.string().min(1).max(200).optional(),
  slug: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  order: Joi.number().integer().min(0).default(0),
  active: Joi.boolean().default(true)
});

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const where = activeOnly ? { active: true } : {};

    const categories = await prisma.newsCategory.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { news: true }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

// Get category by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.newsCategory.findUnique({
      where: { id },
      include: {
        news: {
          where: { published: true },
          include: {
            author: {
              select: { id: true, name: true }
            },
            tags: true
          },
          orderBy: { publishedAt: 'desc' }
        },
        _count: {
          select: { news: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Ошибка получения категории' });
  }
});

// Create category (admin/editor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if slug already exists
    const existingCategory = await prisma.newsCategory.findUnique({
      where: { slug: value.slug }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Категория с таким slug уже существует' });
    }

    const category = await prisma.newsCategory.create({
      data: value
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
});

// Update category (admin/editor only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if category exists
    const existingCategory = await prisma.newsCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Check if slug already exists (excluding current category)
    if (value.slug !== existingCategory.slug) {
      const slugExists = await prisma.newsCategory.findUnique({
        where: { slug: value.slug }
      });

      if (slugExists) {
        return res.status(400).json({ error: 'Категория с таким slug уже существует' });
      }
    }

    const category = await prisma.newsCategory.update({
      where: { id },
      data: value
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Недостаточно прав для удаления' });
    }

    const category = await prisma.newsCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    await prisma.newsCategory.delete({
      where: { id }
    });

    res.json({ message: 'Категория успешно удалена' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

module.exports = router;