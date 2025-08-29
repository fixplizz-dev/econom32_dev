import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class TwoFactorService {
  private static readonly APP_NAME = 'Econom32 Admin';
  private static readonly ISSUER = 'econom32.ru';

  /**
   * Генерирует секрет для 2FA
   */
  static generateSecret(userEmail: string) {
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${userEmail})`,
      issuer: this.ISSUER,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Генерирует QR код для настройки 2FA
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error('Ошибка генерации QR кода');
    }
  }

  /**
   * Проверяет токен 2FA
   */
  static verifyToken(secret: string, token: string, window = 1): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window // Допускает токены в пределах ±30 секунд
    });
  }

  /**
   * Генерирует резервные коды
   */
  static generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Генерируем 8-значный код
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Проверяет резервный код
   */
  static verifyBackupCode(backupCodes: string[], inputCode: string): boolean {
    const normalizedInput = inputCode.toUpperCase().replace(/\s/g, '');
    return backupCodes.includes(normalizedInput);
  }

  /**
   * Удаляет использованный резервный код
   */
  static removeUsedBackupCode(backupCodes: string[], usedCode: string): string[] {
    const normalizedUsedCode = usedCode.toUpperCase().replace(/\s/g, '');
    return backupCodes.filter(code => code !== normalizedUsedCode);
  }

  /**
   * Генерирует временный токен для настройки 2FA
   */
  static generateSetupToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Проверяет силу пароля для 2FA
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

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