import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const bannerSchema = Joi.object({
  titleRu: Joi.string().min(1).max(200).required(),
  titleEn: Joi.string().min(1).max(200).optional(),
  descriptionRu: Joi.string().max(500).optional(),
  descriptionEn: Joi.string().max(500).optional(),
  image: Joi.string().uri().optional(),
  link: Joi.string().uri().optional(),
  position: Joi.number().integer().min(0).default(0),
  active: Joi.boolean().default(true),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

// Get active banners (public)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
    const banners = await prisma.banner.findMany({
      where: {
        active: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: {
        position: 'asc'
      }
    });

    res.json(banners);
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ error: 'Ошибка получения баннеров' });
  }
});

// Get all banners (admin)
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(banners);
  } catch (error) {
    console.error('Get admin banners error:', error);
    res.status(500).json({ error: 'Ошибка получения баннеров' });
  }
});

// Create banner (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = bannerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Validate date range
    if (value.startDate && value.endDate && value.startDate >= value.endDate) {
      return res.status(400).json({ error: 'Дата окончания должна быть позже даты начала' });
    }

    const banner = await prisma.banner.create({
      data: value
    });

    res.status(201).json(banner);
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ error: 'Ошибка создания баннера' });
  }
});

// Update banner (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = bannerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Validate date range
    if (value.startDate && value.endDate && value.startDate >= value.endDate) {
      return res.status(400).json({ error: 'Дата окончания должна быть позже даты начала' });
    }

    const banner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({ error: 'Баннер не найден' });
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: value
    });

    res.json(updatedBanner);
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Ошибка обновления баннера' });
  }
});

// Delete banner (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({ error: 'Баннер не найден' });
    }

    await prisma.banner.delete({
      where: { id }
    });

    res.json({ message: 'Баннер успешно удален' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'Ошибка удаления баннера' });
  }
});

module.exports = router;