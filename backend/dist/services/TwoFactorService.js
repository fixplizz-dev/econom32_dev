"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
class TwoFactorService {
    static generateSecret(userEmail) {
        const secret = speakeasy_1.default.generateSecret({
            name: `${this.APP_NAME} (${userEmail})`,
            issuer: this.ISSUER,
            length: 32
        });
        return {
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url
        };
    }
    static async generateQRCode(otpauthUrl) {
        try {
            const qrCodeDataURL = await qrcode_1.default.toDataURL(otpauthUrl);
            return qrCodeDataURL;
        }
        catch (error) {
            throw new Error('Ошибка генерации QR кода');
        }
    }
    static verifyToken(secret, token, window = 1) {
        return speakeasy_1.default.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window
        });
    }
    static generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    static verifyBackupCode(backupCodes, inputCode) {
        const normalizedInput = inputCode.toUpperCase().replace(/\s/g, '');
        return backupCodes.includes(normalizedInput);
    }
    static removeUsedBackupCode(backupCodes, usedCode) {
        const normalizedUsedCode = usedCode.toUpperCase().replace(/\s/g, '');
        return backupCodes.filter(code => code !== normalizedUsedCode);
    }
    static generateSetupToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Пароль должен содержать минимум 8 символов');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Пароль должен содержать заглавные буквы');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Пароль должен содержать строчные буквы');
        }
        if (!/\d/.test(password)) {
            errors.push('Пароль должен содержать цифры');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Пароль должен содержать специальные символы');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.TwoFactorService = TwoFactorService;
TwoFactorService.APP_NAME = 'Econom32 Admin';
TwoFactorService.ISSUER = 'econom32.ru';
//# sourceMappingURL=TwoFactorService.js.map