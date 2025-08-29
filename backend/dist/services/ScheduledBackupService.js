"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledBackupService = exports.ScheduledBackupService = void 0;
const BackupService_1 = require("./BackupService");
const path_1 = __importDefault(require("path"));
class ScheduledBackupService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        this.backupService = new BackupService_1.BackupService({
            backupDir: path_1.default.join(process.cwd(), 'backups'),
            retentionDays: 30,
            compressionEnabled: true,
            includeDatabase: false
        });
    }
    start(intervalHours = 24) {
        if (this.isRunning) {
            console.log('Scheduled backup service is already running');
            return;
        }
        console.log(`Starting scheduled backup service (every ${intervalHours} hours)`);
        this.runBackup();
        const intervalMs = intervalHours * 60 * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.runBackup();
        }, intervalMs);
        this.isRunning = true;
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Scheduled backup service stopped');
    }
    async runBackup() {
        try {
            console.log('Starting scheduled backup...');
            const result = await this.backupService.createBackup();
            if (result.success) {
                console.log(`Backup completed successfully:`, {
                    filesCount: result.filesCount,
                    totalSize: this.formatBytes(result.totalSize),
                    duration: `${result.duration}ms`,
                    path: result.backupPath
                });
            }
            else {
                console.error('Scheduled backup failed:', result.error);
            }
        }
        catch (error) {
            console.error('Scheduled backup error:', error);
        }
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextBackup: this.intervalId ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined
        };
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
exports.ScheduledBackupService = ScheduledBackupService;
exports.scheduledBackupService = new ScheduledBackupService();
//# sourceMappingURL=ScheduledBackupService.js.map