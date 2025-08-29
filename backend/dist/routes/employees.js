"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const joi_1 = __importDefault(require("joi"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const employeeSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(1).max(100).required(),
    lastName: joi_1.default.string().min(1).max(100).required(),
    middleName: joi_1.default.string().max(100).optional(),
    positionRu: joi_1.default.string().min(1).max(200).required(),
    positionEn: joi_1.default.string().min(1).max(200).optional(),
    photo: joi_1.default.string().uri().optional(),
    email: joi_1.default.string().email().optional(),
    phone: joi_1.default.string().pattern(/^[\+]?[0-9\s\-\(\)]+$/).optional(),
    departmentId: joi_1.default.string().required(),
    order: joi_1.default.number().integer().min(0).default(0),
    active: joi_1.default.boolean().default(true)
});
router.get('/', async (req, res) => {
    try {
        const { departmentId, search, activity } = req.query;
        let where = { active: true };
        if (departmentId && typeof departmentId === 'string') {
            where.departmentId = departmentId;
        }
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
    }
    catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ error: 'Ошибка получения сотрудников' });
    }
});
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
    }
    catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ error: 'Ошибка получения сотрудника' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { error, value } = employeeSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
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
    }
    catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ error: 'Ошибка создания сотрудника' });
    }
});
module.exports = router;
//# sourceMappingURL=employees.js.map