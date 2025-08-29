"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.user?.userId,
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });
        res.json({ notifications });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Ошибка при получении уведомлений' });
    }
});
router.patch('/:id/read', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: {
                id,
                userId: req.user?.userId,
            },
            data: {
                read: true,
                readAt: new Date()
            }
        });
        res.json({ notification });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
    }
});
router.patch('/mark-all-read', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user?.userId,
                read: false
            },
            data: {
                read: true,
                readAt: new Date()
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Ошибка при обновлении уведомлений' });
    }
});
router.get('/unread-count', auth_1.authMiddleware, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: {
                userId: req.user?.userId,
                read: false
            }
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Ошибка при получении количества непрочитанных уведомлений' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.delete({
            where: {
                id,
                userId: req.user?.userId,
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Ошибка при удалении уведомления' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map