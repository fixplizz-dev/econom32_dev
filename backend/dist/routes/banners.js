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
const bannerSchema = joi_1.default.object({
    titleRu: joi_1.default.string().min(1).max(200).required(),
    titleEn: joi_1.default.string().min(1).max(200).optional(),
    descriptionRu: joi_1.default.string().max(500).optional(),
    descriptionEn: joi_1.default.string().max(500).optional(),
    image: joi_1.default.string().uri().optional(),
    link: joi_1.default.string().uri().optional(),
    position: joi_1.default.number().integer().min(0).default(0),
    active: joi_1.default.boolean().default(true),
    startDate: joi_1.default.date().optional(),
    endDate: joi_1.default.date().optional()
});
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
    }
    catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ error: 'Ошибка получения баннеров' });
    }
});
router.get('/admin', auth_1.authMiddleware, async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: [
                { position: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        res.json(banners);
    }
    catch (error) {
        console.error('Get admin banners error:', error);
        res.status(500).json({ error: 'Ошибка получения баннеров' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { error, value } = bannerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        if (value.startDate && value.endDate && value.startDate >= value.endDate) {
            return res.status(400).json({ error: 'Дата окончания должна быть позже даты начала' });
        }
        const banner = await prisma.banner.create({
            data: value
        });
        res.status(201).json(banner);
    }
    catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ error: 'Ошибка создания баннера' });
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = bannerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
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
    }
    catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({ error: 'Ошибка обновления баннера' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ error: 'Ошибка удаления баннера' });
    }
});
module.exports = router;
//# sourceMappingURL=banners.js.map