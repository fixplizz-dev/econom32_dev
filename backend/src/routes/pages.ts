import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const pageSchema = Joi.object({
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).required(),
  titleRu: Joi.string().min(1).max(500).required(),
  titleEn: Joi.string().min(1).max(500).optional(),
  contentRu: Joi.string().min(1).required(),
  contentEn: Joi.string().min(1).optional(),
  metaTitleRu: Joi.string().max(60).optional(),
  metaTitleEn: Joi.string().max(60).optional(),
  metaDescriptionRu: Joi.string().max(160).optional(),
  metaDescriptionEn: Joi.string().max(160).optional(),
  published: Joi.boolean().default(false)
});

// Get all pages
router.get('/', async (req, res) => {
  try {
    const published = req.query.published !== 'false';
    const where = published ? { published: true } : {};

    const pages = await prisma.page.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(pages);
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ error: 'Ошибка получения страниц' });
  }
});

// Get page by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    });

    if (!page) {
      return res.status(404).json({ error: 'Страница не найдена' });
    }

    res.json(page);
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: 'Ошибка получения страницы' });
  }
});

// Create page
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = pageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const page = await prisma.page.create({
      data: {
        ...value,
        authorId: req.user.userId,
        publishedAt: value.published ? new Date() : null
      },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(page);
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ error: 'Ошибка создания страницы' });
  }
});

module.exports = router;