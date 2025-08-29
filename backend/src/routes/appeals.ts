import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const appealSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]+$/).optional(),
  subject: Joi.string().min(1).max(500).required(),
  message: Joi.string().min(1).max(5000).required(),
  attachments: Joi.array().items(Joi.string()).default([])
});

const responseSchema = Joi.object({
  response: Joi.string().min(1).max(5000).required(),
  status: Joi.string().valid('IN_PROGRESS', 'ANSWERED', 'CLOSED').default('ANSWERED')
});

// Generate unique ticket number
function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${year}${month}${day}-${random}`;
}

// Submit appeal (public)
router.post('/', async (req, res) => {
  try {
    const { error, value } = appealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Generate unique ticket number
    let ticketNumber;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      ticketNumber = generateTicketNumber();
      const existing = await prisma.appeal.findUnique({
        where: { ticketNumber }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Не удалось сгенерировать уникальный номер обращения' });
    }

    const appeal = await prisma.appeal.create({
      data: {
        ...value,
        ticketNumber: ticketNumber!
      }
    });

    // Create notification for all admins
    try {
      const { notificationService } = await import('../services/NotificationService');
      await notificationService.notifyNewAppeal(appeal.id, appeal.subject);
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    res.status(201).json({
      ticketNumber: appeal.ticketNumber,
      message: 'Обращение успешно отправлено. Номер вашего обращения: ' + appeal.ticketNumber
    });
  } catch (error) {
    console.error('Submit appeal error:', error);
    res.status(500).json({ error: 'Ошибка отправки обращения' });
  }
});

// Get appeal by ticket number (public)
router.get('/ticket/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const appeal = await prisma.appeal.findUnique({
      where: { ticketNumber },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        response: true,
        respondedAt: true,
        createdAt: true,
        responder: {
          select: {
            name: true
          }
        }
      }
    });

    if (!appeal) {
      return res.status(404).json({ error: 'Обращение не найдено' });
    }

    res.json(appeal);
  } catch (error) {
    console.error('Get appeal by ticket error:', error);
    res.status(500).json({ error: 'Ошибка получения обращения' });
  }
});

// Get all appeals (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status && ['NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED'].includes(status)) {
      where.status = status;
    }

    const [appeals, total] = await Promise.all([
      prisma.appeal.findMany({
        where,
        include: {
          responder: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.appeal.count({ where })
    ]);

    res.json({
      appeals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get appeals error:', error);
    res.status(500).json({ error: 'Ошибка получения обращений' });
  }
});

// Respond to appeal (admin only)
router.put('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = responseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const appeal = await prisma.appeal.findUnique({
      where: { id }
    });

    if (!appeal) {
      return res.status(404).json({ error: 'Обращение не найдено' });
    }

    const updatedAppeal = await prisma.appeal.update({
      where: { id },
      data: {
        response: value.response,
        status: value.status,
        respondedAt: new Date(),
        respondedBy: req.user.userId
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // TODO: Send email notification to user

    res.json(updatedAppeal);
  } catch (error) {
    console.error('Respond to appeal error:', error);
    res.status(500).json({ error: 'Ошибка ответа на обращение' });
  }
});

module.exports = router;