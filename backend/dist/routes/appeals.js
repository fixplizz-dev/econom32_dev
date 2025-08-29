"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const appealSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(1).max(100).required(),
    lastName: joi_1.default.string().min(1).max(100).required(),
    email: joi_1.default.string().email().required(),
    phone: joi_1.default.string().pattern(/^[\+]?[0-9\s\-\(\)]+$/).optional(),
    subject: joi_1.default.string().min(1).max(500).required(),
    message: joi_1.default.string().min(1).max(5000).required(),
    attachments: joi_1.default.array().items(joi_1.default.string()).default([])
});
const responseSchema = joi_1.default.object({
    response: joi_1.default.string().min(1).max(5000).required(),
    status: joi_1.default.string().valid('IN_PROGRESS', 'ANSWERED', 'CLOSED').default('ANSWERED')
});
function generateTicketNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${year}${month}${day}-${random}`;
}
router.post('/', async (req, res) => {
    try {
        const { error, value } = appealSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        let ticketNumber;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            ticketNumber = generateTicketNumber();
            const existing = await prisma.appeal.findUnique({
                where: { ticketNumber }
            });
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }
        if (!isUnique) {
            return res.status(500).json({ error: 'Не удалось сгенерировать уникальный номер обращения' });
        }
        const appeal = await prisma.appeal.create({
            data: {
                ...value,
                ticketNumber: ticketNumber
            }
        });
        try {
            const { notificationService } = await Promise.resolve().then(() => __importStar(require('../services/NotificationService')));
            await notificationService.notifyNewAppeal(appeal.id, appeal.subject);
        }
        catch (error) {
            console.error('Error creating notification:', error);
        }
        res.status(201).json({
            ticketNumber: appeal.ticketNumber,
            message: 'Обращение успешно отправлено. Номер вашего обращения: ' + appeal.ticketNumber
        });
    }
    catch (error) {
        console.error('Submit appeal error:', error);
        res.status(500).json({ error: 'Ошибка отправки обращения' });
    }
});
router.get('/ticket/:ticketNumber', async (req, res) => {
    try {
        const { ticketNumber } = req.params;
        const appeal = await prisma.appeal.findUnique({
            where: { ticketNumber },
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                status: true,
                response: true,
                respondedAt: true,
                createdAt: true,
                responder: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!appeal) {
            return res.status(404).json({ error: 'Обращение не найдено' });
        }
        res.json(appeal);
    }
    catch (error) {
        console.error('Get appeal by ticket error:', error);
        res.status(500).json({ error: 'Ошибка получения обращения' });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const where = {};
        if (status && ['NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED'].includes(status)) {
            where.status = status;
        }
        const [appeals, total] = await Promise.all([
            prisma.appeal.findMany({
                where,
                include: {
                    responder: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.appeal.count({ where })
        ]);
        res.json({
            appeals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Get appeals error:', error);
        res.status(500).json({ error: 'Ошибка получения обращений' });
    }
});
router.put('/:id/respond', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = responseSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const appeal = await prisma.appeal.findUnique({
            where: { id }
        });
        if (!appeal) {
            return res.status(404).json({ error: 'Обращение не найдено' });
        }
        const updatedAppeal = await prisma.appeal.update({
            where: { id },
            data: {
                response: value.response,
                status: value.status,
                respondedAt: new Date(),
                respondedBy: req.user.userId
            },
            include: {
                responder: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.json(updatedAppeal);
    }
    catch (error) {
        console.error('Respond to appeal error:', error);
        res.status(500).json({ error: 'Ошибка ответа на обращение' });
    }
});
module.exports = router;
//# sourceMappingURL=appeals.js.map