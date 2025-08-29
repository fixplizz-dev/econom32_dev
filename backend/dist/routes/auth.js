"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const joi_1 = __importDefault(require("joi"));
const TwoFactorService_1 = require("../services/TwoFactorService");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    twoFactorToken: joi_1.default.string().optional(),
    backupCode: joi_1.default.string().optional()
});
const enable2FASchema = joi_1.default.object({
    token: joi_1.default.string().length(6).required()
});
const verify2FASchema = joi_1.default.object({
    secret: joi_1.default.string().required(),
    token: joi_1.default.string().length(6).required()
});
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    name: joi_1.default.string().min(2).max(100).required(),
    password: joi_1.default.string().min(6).required(),
    role: joi_1.default.string().valid('ADMIN', 'EDITOR', 'MODERATOR').default('EDITOR')
});
router.post('/login', async (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, password, twoFactorToken, backupCode } = value;
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                role: true,
                active: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
                backupCodes: true,
                failedLoginAttempts: true,
                lockedUntil: true
            }
        });
        const logLoginAttempt = async (success, reason) => {
            await prisma.loginAttempt.create({
                data: {
                    userId: user?.id,
                    email,
                    ip: clientIp,
                    userAgent,
                    success,
                    reason
                }
            });
        };
        if (!user || !user.active) {
            await logLoginAttempt(false, 'user_not_found');
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            await logLoginAttempt(false, 'account_locked');
            return res.status(423).json({
                error: 'Аккаунт заблокирован из-за множественных неудачных попыток входа',
                lockedUntil: user.lockedUntil
            });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            const newFailedAttempts = user.failedLoginAttempts + 1;
            const shouldLock = newFailedAttempts >= 5;
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newFailedAttempts,
                    lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null
                }
            });
            await logLoginAttempt(false, 'wrong_password');
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }
        if (user.twoFactorEnabled) {
            let is2FAValid = false;
            if (twoFactorToken && user.twoFactorSecret) {
                is2FAValid = TwoFactorService_1.TwoFactorService.verifyToken(user.twoFactorSecret, twoFactorToken);
            }
            else if (backupCode && user.backupCodes.length > 0) {
                is2FAValid = TwoFactorService_1.TwoFactorService.verifyBackupCode(user.backupCodes, backupCode);
                if (is2FAValid) {
                    const updatedBackupCodes = TwoFactorService_1.TwoFactorService.removeUsedBackupCode(user.backupCodes, backupCode);
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { backupCodes: updatedBackupCodes }
                    });
                }
            }
            if (!is2FAValid) {
                await logLoginAttempt(false, '2fa_failed');
                return res.status(401).json({
                    error: 'Неверный код двухфакторной аутентификации',
                    requires2FA: true
                });
            }
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
                lastLoginIp: clientIp
            }
        });
        await logLoginAttempt(true);
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, process.env.NEXTAUTH_SECRET || 'fallback-secret', { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка входа в систему' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, name, password, role } = value;
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        res.status(201).json({ user });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Ошибка регистрации пользователя' });
    }
});
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                twoFactorEnabled: true
            }
        });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ error: 'Неверный токен' });
    }
});
router.post('/2fa/setup', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, twoFactorEnabled: true }
        });
        if (!user) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        if (user.twoFactorEnabled) {
            return res.status(400).json({ error: '2FA уже включена' });
        }
        const { secret, otpauthUrl } = TwoFactorService_1.TwoFactorService.generateSecret(user.email);
        const qrCode = await TwoFactorService_1.TwoFactorService.generateQRCode(otpauthUrl);
        res.json({
            secret,
            qrCode,
            manualEntryKey: secret
        });
    }
    catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ error: 'Ошибка настройки 2FA' });
    }
});
router.post('/2fa/enable', async (req, res) => {
    try {
        const { error, value } = verify2FASchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { secret, token } = value;
        const authToken = req.headers.authorization?.replace('Bearer ', '');
        if (!authToken) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }
        const decoded = jsonwebtoken_1.default.verify(authToken, process.env.NEXTAUTH_SECRET || 'fallback-secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, twoFactorEnabled: true }
        });
        if (!user) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        if (user.twoFactorEnabled) {
            return res.status(400).json({ error: '2FA уже включена' });
        }
        const isValidToken = TwoFactorService_1.TwoFactorService.verifyToken(secret, token);
        if (!isValidToken) {
            return res.status(400).json({ error: 'Неверный код подтверждения' });
        }
        const backupCodes = TwoFactorService_1.TwoFactorService.generateBackupCodes();
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
                backupCodes
            }
        });
        res.json({
            message: '2FA успешно включена',
            backupCodes
        });
    }
    catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({ error: 'Ошибка включения 2FA' });
    }
});
router.post('/2fa/disable', async (req, res) => {
    try {
        const { error, value } = enable2FASchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { token } = value;
        const authToken = req.headers.authorization?.replace('Bearer ', '');
        if (!authToken) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }
        const decoded = jsonwebtoken_1.default.verify(authToken, process.env.NEXTAUTH_SECRET || 'fallback-secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                twoFactorEnabled: true,
                twoFactorSecret: true
            }
        });
        if (!user) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA не включена' });
        }
        const isValidToken = TwoFactorService_1.TwoFactorService.verifyToken(user.twoFactorSecret, token);
        if (!isValidToken) {
            return res.status(400).json({ error: 'Неверный код подтверждения' });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: []
            }
        });
        res.json({ message: '2FA успешно отключена' });
    }
    catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ error: 'Ошибка отключения 2FA' });
    }
});
router.post('/2fa/backup-codes', async (req, res) => {
    try {
        const { error, value } = enable2FASchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { token } = value;
        const authToken = req.headers.authorization?.replace('Bearer ', '');
        if (!authToken) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }
        const decoded = jsonwebtoken_1.default.verify(authToken, process.env.NEXTAUTH_SECRET || 'fallback-secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                twoFactorEnabled: true,
                twoFactorSecret: true
            }
        });
        if (!user) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA не включена' });
        }
        const isValidToken = TwoFactorService_1.TwoFactorService.verifyToken(user.twoFactorSecret, token);
        if (!isValidToken) {
            return res.status(400).json({ error: 'Неверный код подтверждения' });
        }
        const backupCodes = TwoFactorService_1.TwoFactorService.generateBackupCodes();
        await prisma.user.update({
            where: { id: user.id },
            data: { backupCodes }
        });
        res.json({
            message: 'Новые резервные коды созданы',
            backupCodes
        });
    }
    catch (error) {
        console.error('Backup codes generation error:', error);
        res.status(500).json({ error: 'Ошибка генерации резервных кодов' });
    }
});
module.exports = router;
//# sourceMappingURL=auth.js.map