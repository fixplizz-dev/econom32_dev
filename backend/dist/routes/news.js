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
const newsSchema = joi_1.default.object({
    titleRu: joi_1.default.string().min(1).max(500).required(),
    titleEn: joi_1.default.string().min(1).max(500).optional(),
    contentRu: joi_1.default.string().min(1).required(),
    contentEn: joi_1.default.string().min(1).optional(),
    excerptRu: joi_1.default.string().max(1000).optional(),
    excerptEn: joi_1.default.string().max(1000).optional(),
    featuredImage: joi_1.default.string().uri().optional(),
    published: joi_1.default.boolean().default(false),
    publishedAt: joi_1.default.date().optional(),
    tagIds: joi_1.default.array().items(joi_1.default.string()).optional(),
    categoryIds: joi_1.default.array().items(joi_1.default.string()).optional()
});
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const published = req.query.published !== 'false';
        const where = published ? { published: true } : {};
        const [news, total] = await Promise.all([
            prisma.news.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    tags: true,
                    categories: true,
                    _count: {
                        select: {
                            comments: {
                                where: { status: 'APPROVED' }
                            }
                        }
                    }
                },
                orderBy: {
                    publishedAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.news.count({ where })
        ]);
        res.json({
            news,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Get news error:', error);
        res.status(500).json({ error: 'Ошибка получения новостей' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const news = await prisma.news.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tags: true,
                categories: true,
                comments: {
                    where: { status: 'APPROVED', parentId: null },
                    include: {
                        replies: {
                            where: { status: 'APPROVED' },
                            orderBy: { createdAt: 'asc' }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        comments: {
                            where: { status: 'APPROVED' }
                        }
                    }
                }
            }
        });
        if (!news) {
            return res.status(404).json({ error: 'Новость не найдена' });
        }
        if (news.published) {
            await prisma.news.update({
                where: { id },
                data: { views: { increment: 1 } }
            });
        }
        res.json(news);
    }
    catch (error) {
        console.error('Get news by ID error:', error);
        res.status(500).json({ error: 'Ошибка получения новости' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { error, value } = newsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { tagIds, categoryIds, ...newsData } = value;
        const news = await prisma.news.create({
            data: {
                ...newsData,
                authorId: req.user.userId,
                publishedAt: value.published ? new Date() : null,
                tags: tagIds ? {
                    connect: tagIds.map((id) => ({ id }))
                } : undefined,
                categories: categoryIds ? {
                    connect: categoryIds.map((id) => ({ id }))
                } : undefined
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tags: true,
                categories: true
            }
        });
        res.status(201).json(news);
    }
    catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({ error: 'Ошибка создания новости' });
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = newsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const existingNews = await prisma.news.findUnique({
            where: { id }
        });
        if (!existingNews) {
            return res.status(404).json({ error: 'Новость не найдена' });
        }
        if (existingNews.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Недостаточно прав для редактирования' });
        }
        const { tagIds, categoryIds, ...newsData } = value;
        const news = await prisma.news.update({
            where: { id },
            data: {
                ...newsData,
                publishedAt: value.published && !existingNews.published ? new Date() : existingNews.publishedAt,
                tags: tagIds ? {
                    set: tagIds.map((id) => ({ id }))
                } : undefined,
                categories: categoryIds ? {
                    set: categoryIds.map((id) => ({ id }))
                } : undefined
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tags: true,
                categories: true
            }
        });
        res.json(news);
    }
    catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({ error: 'Ошибка обновления новости' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Недостаточно прав для удаления' });
        }
        const news = await prisma.news.findUnique({
            where: { id }
        });
        if (!news) {
            return res.status(404).json({ error: 'Новость не найдена' });
        }
        await prisma.news.delete({
            where: { id }
        });
        res.json({ message: 'Новость успешно удалена' });
    }
    catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({ error: 'Ошибка удаления новости' });
    }
});
module.exports = router;
//# sourceMappingURL=news.js.map