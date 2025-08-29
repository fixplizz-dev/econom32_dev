import { BackupService } from './BackupService';
import path from 'path';

export class ScheduledBackupService {
  private backupService: BackupService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.backupService = new BackupService({
      backupDir: path.join(process.cwd(), 'backups'),
      retentionDays: 30,
      compressionEnabled: true,
      includeDatabase: false
    });
  }

  /**
   * Start scheduled backups
   * @param intervalHours - How often to run backups (in hours)
   */
  start(intervalHours: number = 24): void {
    if (this.isRunning) {
      console.log('Scheduled backup service is already running');
      return;
    }

    console.log(`Starting scheduled backup service (every ${intervalHours} hours)`);
    
    // Run initial backup
    this.runBackup();
    
    // Schedule recurring backups
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.runBackup();
    }, intervalMs);
    
    this.isRunning = true;
  }

  /**
   * Stop scheduled backups
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('Scheduled backup service stopped');
  }

  /**
   * Run a single backup
   */
  private async runBackup(): Promise<void> {
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
      } else {
        console.error('Scheduled backup failed:', result.error);
      }
    } catch (error) {
      console.error('Scheduled backup error:', error);
    }
  }

  /**
   * Get backup service status
   */
  getStatus(): {
    isRunning: boolean;
    nextBackup?: Date;
  } {
    return {
      isRunning: this.isRunning,
      nextBackup: this.intervalId ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined
    };
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const scheduledBackupService = new ScheduledBackupService();