import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const departmentSchema = Joi.object({
  nameRu: Joi.string().min(1).max(200).required(),
  nameEn: Joi.string().min(1).max(200).optional(),
  descriptionRu: Joi.string().optional(),
  descriptionEn: Joi.string().optional(),
  parentId: Joi.string().optional(),
  order: Joi.number().integer().min(0).default(0),
  active: Joi.boolean().default(true)
});

// Get all departments with hierarchy
router.get('/', async (req, res) => {
  try {
    const { search, activity } = req.query;
    let whereClause: any = { active: true };

    // Add search functionality
    if (search && typeof search === 'string') {
      whereClause = {
        ...whereClause,
        OR: [
          { nameRu: { contains: search, mode: 'insensitive' } },
          { nameEn: { contains: search, mode: 'insensitive' } },
          { descriptionRu: { contains: search, mode: 'insensitive' } },
          { descriptionEn: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Add activity filter
    if (activity && typeof activity === 'string') {
      whereClause = {
        ...whereClause,
        OR: [
          ...(whereClause.OR || []),
          { nameRu: { contains: activity, mode: 'insensitive' } },
          { descriptionRu: { contains: activity, mode: 'insensitive' } }
        ]
      };
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        parent: {
          select: { id: true, nameRu: true, nameEn: true }
        },
        children: {
          where: { active: true },
          select: { id: true, nameRu: true, nameEn: true, order: true },
          orderBy: { order: 'asc' }
        },
        employees: {
          where: { active: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            positionRu: true,
            positionEn: true,
            photo: true,
            email: true,
            phone: true,
            order: true
          },
          orderBy: { order: 'asc' }
        },
        contacts: {
          where: { active: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Ошибка получения структуры департамента' });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, nameRu: true, nameEn: true }
        },
        children: {
          where: { active: true },
          include: {
            employees: {
              where: { active: true },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        employees: {
          where: { active: true },
          orderBy: { order: 'asc' }
        },
        contacts: {
          where: { active: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Подразделение не найдено' });
    }

    res.json(department);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Ошибка получения подразделения' });
  }
});

// Create department
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = departmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const department = await prisma.department.create({
      data: value,
      include: {
        parent: {
          select: { id: true, nameRu: true, nameEn: true }
        },
        children: true,
        employees: true,
        contacts: true
      }
    });

    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Ошибка создания подразделения' });
  }
});

module.exports = router;