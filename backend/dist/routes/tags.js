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
const tagSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(100).required(),
    slug: joi_1.default.string().min(1).max(100).required(),
    color: joi_1.default.string().pattern(/^#[0-9A-F]{6}$/i).optional()
});
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
    }
    catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ error: 'Ошибка получения тегов' });
    }
});
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
    }
    catch (error) {
        console.error('Get tag error:', error);
        res.status(500).json({ error: 'Ошибка получения тега' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { error, value } = tagSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
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
    }
    catch (error) {
        console.error('Create tag error:', error);
        res.status(500).json({ error: 'Ошибка создания тега' });
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = tagSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const existingTag = await prisma.newsTag.findUnique({
            where: { id }
        });
        if (!existingTag) {
            return res.status(404).json({ error: 'Тег не найден' });
        }
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
    }
    catch (error) {
        console.error('Update tag error:', error);
        res.status(500).json({ error: 'Ошибка обновления тега' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Delete tag error:', error);
        res.status(500).json({ error: 'Ошибка удаления тега' });
    }
});
module.exports = router;
//# sourceMappingURL=tags.js.map