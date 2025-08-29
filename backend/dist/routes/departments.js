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
const departmentSchema = joi_1.default.object({
    nameRu: joi_1.default.string().min(1).max(200).required(),
    nameEn: joi_1.default.string().min(1).max(200).optional(),
    descriptionRu: joi_1.default.string().optional(),
    descriptionEn: joi_1.default.string().optional(),
    parentId: joi_1.default.string().optional(),
    order: joi_1.default.number().integer().min(0).default(0),
    active: joi_1.default.boolean().default(true)
});
router.get('/', async (req, res) => {
    try {
        const { search, activity } = req.query;
        let whereClause = { active: true };
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
    }
    catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Ошибка получения структуры департамента' });
    }
});
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
    }
    catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({ error: 'Ошибка получения подразделения' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({ error: 'Ошибка создания подразделения' });
    }
});
module.exports = router;
//# sourceMappingURL=departments.js.map