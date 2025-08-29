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
const pageSchema = joi_1.default.object({
    slug: joi_1.default.string().pattern(/^[a-z0-9-]+$/).required(),
    titleRu: joi_1.default.string().min(1).max(500).required(),
    titleEn: joi_1.default.string().min(1).max(500).optional(),
    contentRu: joi_1.default.string().min(1).required(),
    contentEn: joi_1.default.string().min(1).optional(),
    metaTitleRu: joi_1.default.string().max(60).optional(),
    metaTitleEn: joi_1.default.string().max(60).optional(),
    metaDescriptionRu: joi_1.default.string().max(160).optional(),
    metaDescriptionEn: joi_1.default.string().max(160).optional(),
    published: joi_1.default.boolean().default(false)
});
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
    }
    catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ error: 'Ошибка получения страниц' });
    }
});
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
    }
    catch (error) {
        console.error('Get page error:', error);
        res.status(500).json({ error: 'Ошибка получения страницы' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Create page error:', error);
        res.status(500).json({ error: 'Ошибка создания страницы' });
    }
});
module.exports = router;
//# sourceMappingURL=pages.js.map