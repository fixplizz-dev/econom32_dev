export interface BackupConfig {
    backupDir: string;
    retentionDays: number;
    compressionEnabled: boolean;
    includeDatabase: boolean;
}
export interface BackupResult {
    success: boolean;
    backupPath?: string;
    filesCount: number;
    totalSize: number;
    duration: number;
    error?: string;
}
export declare class BackupService {
    private prisma;
    private config;
    constructor(config: BackupConfig);
    createBackup(): Promise<BackupResult>;
    restoreBackup(backupPath: string): Promise<{
        success: boolean;
        restoredFiles: number;
        error?: string;
    }>;
    listBackups(): Promise<Array<{
        name: string;
        path: string;
        timestamp: string;
        filesCount: number;
        totalSize: number;
        duration: number;
    }>>;
    private cleanupOldBackups;
    private copyFile;
    private compressFile;
    private decompressFile;
    private backupDatabase;
    getBackupStats(): Promise<{
        totalBackups: number;
        totalSize: number;
        oldestBackup?: string;
        newestBackup?: string;
    }>;
    private getDirectorySize;
}
//# sourceMappingURL=BackupService.d.ts.map