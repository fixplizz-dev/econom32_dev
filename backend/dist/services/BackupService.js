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
exports.BackupService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fs_2 = require("fs");
const promises_1 = require("stream/promises");
const zlib_1 = require("zlib");
const client_1 = require("@prisma/client");
class BackupService {
    constructor(config) {
        this.prisma = new client_1.PrismaClient();
        this.config = config;
        if (!fs_1.default.existsSync(config.backupDir)) {
            fs_1.default.mkdirSync(config.backupDir, { recursive: true });
        }
    }
    async createBackup() {
        const startTime = Date.now();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${timestamp}`;
        const backupPath = path_1.default.join(this.config.backupDir, backupName);
        try {
            fs_1.default.mkdirSync(backupPath, { recursive: true });
            let filesCount = 0;
            let totalSize = 0;
            const files = await this.prisma.file.findMany({
                select: {
                    id: true,
                    filename: true,
                    originalName: true,
                    path: true,
                    size: true,
                    mimeType: true,
                    bucket: true,
                    createdAt: true
                }
            });
            const filesBackupDir = path_1.default.join(backupPath, 'files');
            fs_1.default.mkdirSync(filesBackupDir, { recursive: true });
            for (const file of files) {
                try {
                    if (fs_1.default.existsSync(file.path)) {
                        const backupFilePath = path_1.default.join(filesBackupDir, file.filename);
                        if (this.config.compressionEnabled) {
                            await this.compressFile(file.path, `${backupFilePath}.gz`);
                        }
                        else {
                            await this.copyFile(file.path, backupFilePath);
                        }
                        filesCount++;
                        totalSize += file.size;
                    }
                    else {
                        console.warn(`File not found during backup: ${file.path}`);
                    }
                }
                catch (error) {
                    console.error(`Failed to backup file ${file.filename}:`, error);
                }
            }
            const manifest = {
                timestamp: new Date().toISOString(),
                filesCount,
                totalSize,
                files: files.map(f => ({
                    id: f.id,
                    filename: f.filename,
                    originalName: f.originalName,
                    size: f.size,
                    mimeType: f.mimeType,
                    bucket: f.bucket,
                    createdAt: f.createdAt
                }))
            };
            fs_1.default.writeFileSync(path_1.default.join(backupPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
            if (this.config.includeDatabase) {
                await this.backupDatabase(backupPath);
            }
            const backupInfo = {
                timestamp: new Date().toISOString(),
                filesCount,
                totalSize,
                duration: Date.now() - startTime,
                compressed: this.config.compressionEnabled,
                includeDatabase: this.config.includeDatabase
            };
            fs_1.default.writeFileSync(path_1.default.join(backupPath, 'backup-info.json'), JSON.stringify(backupInfo, null, 2));
            await this.cleanupOldBackups();
            try {
                const { notificationService } = await Promise.resolve().then(() => __importStar(require('./NotificationService')));
                await notificationService.notifyBackupStatus(true, `Резервная копия успешно создана. Файлов: ${filesCount}, размер: ${(totalSize / 1024 / 1024).toFixed(2)} МБ`);
            }
            catch (error) {
                console.error('Error creating backup notification:', error);
            }
            return {
                success: true,
                backupPath,
                filesCount,
                totalSize,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            console.error('Backup failed:', error);
            try {
                const { notificationService } = await Promise.resolve().then(() => __importStar(require('./NotificationService')));
                await notificationService.notifyBackupStatus(false, `Ошибка создания резервной копии: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
            }
            catch (notificationError) {
                console.error('Error creating backup failure notification:', notificationError);
            }
            try {
                if (fs_1.default.existsSync(backupPath)) {
                    fs_1.default.rmSync(backupPath, { recursive: true, force: true });
                }
            }
            catch (cleanupError) {
                console.error('Failed to cleanup failed backup:', cleanupError);
            }
            return {
                success: false,
                filesCount: 0,
                totalSize: 0,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async restoreBackup(backupPath) {
        try {
            const manifestPath = path_1.default.join(backupPath, 'manifest.json');
            if (!fs_1.default.existsSync(manifestPath)) {
                throw new Error('Backup manifest not found');
            }
            const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            const filesBackupDir = path_1.default.join(backupPath, 'files');
            let restoredFiles = 0;
            for (const fileInfo of manifest.files) {
                try {
                    const backupFilePath = this.config.compressionEnabled
                        ? path_1.default.join(filesBackupDir, `${fileInfo.filename}.gz`)
                        : path_1.default.join(filesBackupDir, fileInfo.filename);
                    if (!fs_1.default.existsSync(backupFilePath)) {
                        console.warn(`Backup file not found: ${backupFilePath}`);
                        continue;
                    }
                    const restorePath = path_1.default.join(process.cwd(), 'uploads', fileInfo.filename);
                    const restoreDir = path_1.default.dirname(restorePath);
                    if (!fs_1.default.existsSync(restoreDir)) {
                        fs_1.default.mkdirSync(restoreDir, { recursive: true });
                    }
                    if (this.config.compressionEnabled) {
                        await this.decompressFile(backupFilePath, restorePath);
                    }
                    else {
                        await this.copyFile(backupFilePath, restorePath);
                    }
                    await this.prisma.file.upsert({
                        where: { id: fileInfo.id },
                        update: { path: restorePath },
                        create: {
                            id: fileInfo.id,
                            filename: fileInfo.filename,
                            originalName: fileInfo.originalName,
                            mimeType: fileInfo.mimeType,
                            size: fileInfo.size,
                            path: restorePath,
                            bucket: fileInfo.bucket
                        }
                    });
                    restoredFiles++;
                }
                catch (error) {
                    console.error(`Failed to restore file ${fileInfo.filename}:`, error);
                }
            }
            return {
                success: true,
                restoredFiles
            };
        }
        catch (error) {
            console.error('Restore failed:', error);
            return {
                success: false,
                restoredFiles: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async listBackups() {
        try {
            const backups = [];
            const entries = fs_1.default.readdirSync(this.config.backupDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name.startsWith('backup-')) {
                    const backupPath = path_1.default.join(this.config.backupDir, entry.name);
                    const infoPath = path_1.default.join(backupPath, 'backup-info.json');
                    if (fs_1.default.existsSync(infoPath)) {
                        try {
                            const info = JSON.parse(fs_1.default.readFileSync(infoPath, 'utf-8'));
                            backups.push({
                                name: entry.name,
                                path: backupPath,
                                timestamp: info.timestamp,
                                filesCount: info.filesCount,
                                totalSize: info.totalSize,
                                duration: info.duration
                            });
                        }
                        catch (error) {
                            console.warn(`Failed to read backup info for ${entry.name}:`, error);
                        }
                    }
                }
            }
            return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        catch (error) {
            console.error('Failed to list backups:', error);
            return [];
        }
    }
    async cleanupOldBackups() {
        try {
            const backups = await this.listBackups();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
            for (const backup of backups) {
                const backupDate = new Date(backup.timestamp);
                if (backupDate < cutoffDate) {
                    try {
                        fs_1.default.rmSync(backup.path, { recursive: true, force: true });
                        console.log(`Deleted old backup: ${backup.name}`);
                    }
                    catch (error) {
                        console.error(`Failed to delete old backup ${backup.name}:`, error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }
    async copyFile(src, dest) {
        await (0, promises_1.pipeline)((0, fs_2.createReadStream)(src), (0, fs_2.createWriteStream)(dest));
    }
    async compressFile(src, dest) {
        await (0, promises_1.pipeline)((0, fs_2.createReadStream)(src), (0, zlib_1.createGzip)(), (0, fs_2.createWriteStream)(dest));
    }
    async decompressFile(src, dest) {
        const { createGunzip } = await Promise.resolve().then(() => __importStar(require('zlib')));
        await (0, promises_1.pipeline)((0, fs_2.createReadStream)(src), createGunzip(), (0, fs_2.createWriteStream)(dest));
    }
    async backupDatabase(backupPath) {
        try {
            const databaseInfo = {
                timestamp: new Date().toISOString(),
                note: 'Database backup would require pg_dump or similar tool',
                schema: 'See prisma/schema.prisma for current schema'
            };
            fs_1.default.writeFileSync(path_1.default.join(backupPath, 'database-info.json'), JSON.stringify(databaseInfo, null, 2));
        }
        catch (error) {
            console.error('Database backup failed:', error);
        }
    }
    async getBackupStats() {
        try {
            const backups = await this.listBackups();
            let totalSize = 0;
            for (const backup of backups) {
                try {
                    const stats = fs_1.default.statSync(backup.path);
                    totalSize += this.getDirectorySize(backup.path);
                }
                catch (error) {
                    console.warn(`Failed to get size for backup ${backup.name}:`, error);
                }
            }
            return {
                totalBackups: backups.length,
                totalSize,
                oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : undefined,
                newestBackup: backups.length > 0 ? backups[0].timestamp : undefined
            };
        }
        catch (error) {
            console.error('Failed to get backup stats:', error);
            return {
                totalBackups: 0,
                totalSize: 0
            };
        }
    }
    getDirectorySize(dirPath) {
        let totalSize = 0;
        try {
            const entries = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    totalSize += this.getDirectorySize(fullPath);
                }
                else {
                    const stats = fs_1.default.statSync(fullPath);
                    totalSize += stats.size;
                }
            }
        }
        catch (error) {
            console.warn(`Failed to calculate directory size for ${dirPath}:`, error);
        }
        return totalSize;
    }
}
exports.BackupService = BackupService;
//# sourceMappingURL=BackupService.js.map