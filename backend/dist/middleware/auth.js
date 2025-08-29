"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorMiddleware = exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Токен авторизации не предоставлен' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                active: true
            }
        });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
        }
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Неверный токен авторизации' });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Требуются права администратора' });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
const editorMiddleware = (req, res, next) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user?.role || '')) {
        return res.status(403).json({ error: 'Требуются права редактора или администратора' });
    }
    next();
};
exports.editorMiddleware = editorMiddleware;
//# sourceMappingURL=auth.js.map