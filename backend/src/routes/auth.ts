import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { TwoFactorService } from '../services/TwoFactorService';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  twoFactorToken: Joi.string().optional(),
  backupCode: Joi.string().optional()
});

const enable2FASchema = Joi.object({
  token: Joi.string().length(6).required()
});

const verify2FASchema = Joi.object({
  secret: Joi.string().required(),
  token: Joi.string().length(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'EDITOR', 'MODERATOR').default('EDITOR')
});

// Login endpoint with 2FA support
router.post('/login', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, twoFactorToken, backupCode } = value;

    // Find user with 2FA fields
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

    // Log login attempt
    const logLoginAttempt = async (success: boolean, reason?: string) => {
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

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logLoginAttempt(false, 'account_locked');
      return res.status(423).json({
        error: 'Аккаунт заблокирован из-за множественных неудачных попыток входа',
        lockedUntil: user.lockedUntil
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Increment failed attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newFailedAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 minutes
        }
      });

      await logLoginAttempt(false, 'wrong_password');
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      let is2FAValid = false;

      if (twoFactorToken && user.twoFactorSecret) {
        is2FAValid = TwoFactorService.verifyToken(user.twoFactorSecret, twoFactorToken);
      } else if (backupCode && user.backupCodes.length > 0) {
        is2FAValid = TwoFactorService.verifyBackupCode(user.backupCodes, backupCode);

        if (is2FAValid) {
          // Remove used backup code
          const updatedBackupCodes = TwoFactorService.removeUsedBackupCode(user.backupCodes, backupCode);
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

    // Reset failed attempts on successful login
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

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа в систему' });
  }
});

// Register endpoint (only for admins)
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, name, password, role } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
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
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка регистрации пользователя' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;

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
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Неверный токен' });
  }
});

// Setup 2FA - Generate QR code
router.post('/2fa/setup', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;

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

    // Generate secret and QR code
    const { secret, otpauthUrl } = TwoFactorService.generateSecret(user.email);
    const qrCode = await TwoFactorService.generateQRCode(otpauthUrl);

    res.json({
      secret,
      qrCode,
      manualEntryKey: secret
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Ошибка настройки 2FA' });
  }
});

// Enable 2FA
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

    const decoded = jwt.verify(authToken, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;

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

    // Verify token
    const isValidToken = TwoFactorService.verifyToken(secret, token);
    if (!isValidToken) {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    // Generate backup codes
    const backupCodes = TwoFactorService.generateBackupCodes();

    // Enable 2FA
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
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Ошибка включения 2FA' });
  }
});

// Disable 2FA
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

    const decoded = jwt.verify(authToken, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;

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

    // Verify token
    const isValidToken = TwoFactorService.verifyToken(user.twoFactorSecret, token);
    if (!isValidToken) {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: []
      }
    });

    res.json({ message: '2FA успешно отключена' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Ошибка отключения 2FA' });
  }
});

// Generate new backup codes
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

    const decoded = jwt.verify(authToken, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;

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

    // Verify token
    const isValidToken = TwoFactorService.verifyToken(user.twoFactorSecret, token);
    if (!isValidToken) {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    // Generate new backup codes
    const backupCodes = TwoFactorService.generateBackupCodes();

    await prisma.user.update({
      where: { id: user.id },
      data: { backupCodes }
    });

    res.json({
      message: 'Новые резервные коды созданы',
      backupCodes
    });
  } catch (error) {
    console.error('Backup codes generation error:', error);
    res.status(500).json({ error: 'Ошибка генерации резервных кодов' });
  }
});

module.exports = router;