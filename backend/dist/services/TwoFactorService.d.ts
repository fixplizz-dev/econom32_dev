export declare class TwoFactorService {
    private static readonly APP_NAME;
    private static readonly ISSUER;
    static generateSecret(userEmail: string): {
        secret: any;
        otpauthUrl: any;
    };
    static generateQRCode(otpauthUrl: string): Promise<string>;
    static verifyToken(secret: string, token: string, window?: number): boolean;
    static generateBackupCodes(count?: number): string[];
    static verifyBackupCode(backupCodes: string[], inputCode: string): boolean;
    static removeUsedBackupCode(backupCodes: string[], usedCode: string): string[];
    static generateSetupToken(): string;
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=TwoFactorService.d.ts.map