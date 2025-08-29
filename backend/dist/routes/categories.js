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
const categorySchema = joi_1.default.object({
    nameRu: joi_1.default.string().min(1).max(200).required(),
    nameEn: joi_1.default.string().min(1).max(200).optional(),
    slug: joi_1.default.string().min(1).max(200).required(),
    description: joi_1.default.string().max(1000).optional(),
    color: joi_1.default.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    order: joi_1.default.number().integer().min(0).default(0),
    active: joi_1.default.boolean().default(true)
});
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
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Ошибка получения категорий' });
    }
});
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
    }
    catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Ошибка получения категории' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { error, value } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
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
    }
    catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Ошибка создания категории' });
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const existingCategory = await prisma.newsCategory.findUnique({
            where: { id }
        });
        if (!existingCategory) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
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
    }
    catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Ошибка обновления категории' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Ошибка удаления категории' });
    }
});
module.exports = router;
//# sourceMappingURL=categories.js.map