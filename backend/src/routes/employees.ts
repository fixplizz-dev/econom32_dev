import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const employeeSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  middleName: Joi.string().max(100).optional(),
  positionRu: Joi.string().min(1).max(200).required(),
  positionEn: Joi.string().min(1).max(200).optional(),
  photo: Joi.string().uri().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]+$/).optional(),
  departmentId: Joi.string().required(),
  order: Joi.number().integer().min(0).default(0),
  active: Joi.boolean().default(true)
});

// Get all employees
router.get('/', async (req, res) => {
  try {
    const { departmentId, search, activity } = req.query;
    let where: any = { active: true };
    
    if (departmentId && typeof departmentId === 'string') {
      where.departmentId = departmentId;
    }

    // Add search functionality
    if (search && typeof search === 'string') {
      where = {
        ...where,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { middleName: { contains: search, mode: 'insensitive' } },
          { positionRu: { contains: search, mode: 'insensitive' } },
          { positionEn: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { department: { nameRu: { contains: search, mode: 'insensitive' } } }
        ]
      };
    }

    // Add activity filter
    if (activity && typeof activity === 'string') {
      where = {
        ...where,
        OR: [
          ...(where.OR || []),
          { positionRu: { contains: activity, mode: 'insensitive' } },
          { department: { nameRu: { contains: activity, mode: 'insensitive' } } }
        ]
      };
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            nameRu: true,
            nameEn: true
          }
        }
      },
      orderBy: [
        { department: { order: 'asc' } },
        { order: 'asc' }
      ]
    });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Ошибка получения сотрудников' });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            nameRu: true,
            nameEn: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Ошибка получения сотрудника' });
  }
});

// Create employee
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: value.departmentId }
    });

    if (!department) {
      return res.status(400).json({ error: 'Подразделение не найдено' });
    }

    const employee = await prisma.employee.create({
      data: value,
      include: {
        department: {
          select: {
            id: true,
            nameRu: true,
            nameEn: true
          }
        }
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Ошибка создания сотрудника' });
  }
});

module.exports = router;