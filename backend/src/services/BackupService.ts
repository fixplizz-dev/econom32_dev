import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import { PrismaClient } from '@prisma/client';

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

export class BackupService {
  private prisma: PrismaClient;
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.prisma = new PrismaClient();
    this.config = config;
    
    // Ensure backup directory exists
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }
  }

  /**
   * Create a full backup of files and database
   */
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(this.config.backupDir, backupName);

    try {
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      let filesCount = 0;
      let totalSize = 0;

      // Backup files from database records
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

      // Create files backup directory
      const filesBackupDir = path.join(backupPath, 'files');
      fs.mkdirSync(filesBackupDir, { recursive: true });

      // Copy each file
      for (const file of files) {
        try {
          if (fs.existsSync(file.path)) {
            const backupFilePath = path.join(filesBackupDir, file.filename);
            
            if (this.config.compressionEnabled) {
              // Compress file during backup
              await this.compressFile(file.path, `${backupFilePath}.gz`);
            } else {
              // Simple copy
              await this.copyFile(file.path, backupFilePath);
            }
            
            filesCount++;
            totalSize += file.size;
          } else {
            console.warn(`File not found during backup: ${file.path}`);
          }
        } catch (error) {
          console.error(`Failed to backup file ${file.filename}:`, error);
        }
      }

      // Create file manifest
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

      fs.writeFileSync(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Backup database schema and data if enabled
      if (this.config.includeDatabase) {
        await this.backupDatabase(backupPath);
      }

      // Create backup info file
      const backupInfo = {
        timestamp: new Date().toISOString(),
        filesCount,
        totalSize,
        duration: Date.now() - startTime,
        compressed: this.config.compressionEnabled,
        includeDatabase: this.config.includeDatabase
      };

      fs.writeFileSync(
        path.join(backupPath, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
      );

      // Cleanup old backups
      await this.cleanupOldBackups();

      // Create success notification
      try {
        const { notificationService } = await import('./NotificationService');
        await notificationService.notifyBackupStatus(true, `Резервная копия успешно создана. Файлов: ${filesCount}, размер: ${(totalSize / 1024 / 1024).toFixed(2)} МБ`);
      } catch (error) {
        console.error('Error creating backup notification:', error);
      }

      return {
        success: true,
        backupPath,
        filesCount,
        totalSize,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error('Backup failed:', error);
      
      // Create failure notification
      try {
        const { notificationService } = await import('./NotificationService');
        await notificationService.notifyBackupStatus(false, `Ошибка создания резервной копии: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      } catch (notificationError) {
        console.error('Error creating backup failure notification:', notificationError);
      }
      
      // Cleanup failed backup directory
      try {
        if (fs.existsSync(backupPath)) {
          fs.rmSync(backupPath, { recursive: true, force: true });
        }
      } catch (cleanupError) {
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

  /**
   * Restore files from backup
   */
  async restoreBackup(backupPath: string): Promise<{
    success: boolean;
    restoredFiles: number;
    error?: string;
  }> {
    try {
      const manifestPath = path.join(backupPath, 'manifest.json');
      
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Backup manifest not found');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const filesBackupDir = path.join(backupPath, 'files');
      
      let restoredFiles = 0;

      for (const fileInfo of manifest.files) {
        try {
          const backupFilePath = this.config.compressionEnabled 
            ? path.join(filesBackupDir, `${fileInfo.filename}.gz`)
            : path.join(filesBackupDir, fileInfo.filename);

          if (!fs.existsSync(backupFilePath)) {
            console.warn(`Backup file not found: ${backupFilePath}`);
            continue;
          }

          // Determine restore path
          const restorePath = path.join(process.cwd(), 'uploads', fileInfo.filename);
          const restoreDir = path.dirname(restorePath);

          // Ensure restore directory exists
          if (!fs.existsSync(restoreDir)) {
            fs.mkdirSync(restoreDir, { recursive: true });
          }

          // Restore file
          if (this.config.compressionEnabled) {
            await this.decompressFile(backupFilePath, restorePath);
          } else {
            await this.copyFile(backupFilePath, restorePath);
          }

          // Update database record if needed
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
        } catch (error) {
          console.error(`Failed to restore file ${fileInfo.filename}:`, error);
        }
      }

      return {
        success: true,
        restoredFiles
      };

    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        restoredFiles: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{
    name: string;
    path: string;
    timestamp: string;
    filesCount: number;
    totalSize: number;
    duration: number;
  }>> {
    try {
      const backups = [];
      const entries = fs.readdirSync(this.config.backupDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('backup-')) {
          const backupPath = path.join(this.config.backupDir, entry.name);
          const infoPath = path.join(backupPath, 'backup-info.json');

          if (fs.existsSync(infoPath)) {
            try {
              const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
              backups.push({
                name: entry.name,
                path: backupPath,
                timestamp: info.timestamp,
                filesCount: info.filesCount,
                totalSize: info.totalSize,
                duration: info.duration
              });
            } catch (error) {
              console.warn(`Failed to read backup info for ${entry.name}:`, error);
            }
          }
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const backup of backups) {
        const backupDate = new Date(backup.timestamp);
        
        if (backupDate < cutoffDate) {
          try {
            fs.rmSync(backup.path, { recursive: true, force: true });
            console.log(`Deleted old backup: ${backup.name}`);
          } catch (error) {
            console.error(`Failed to delete old backup ${backup.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Copy file from source to destination
   */
  private async copyFile(src: string, dest: string): Promise<void> {
    await pipeline(
      createReadStream(src),
      createWriteStream(dest)
    );
  }

  /**
   * Compress file using gzip
   */
  private async compressFile(src: string, dest: string): Promise<void> {
    await pipeline(
      createReadStream(src),
      createGzip(),
      createWriteStream(dest)
    );
  }

  /**
   * Decompress gzipped file
   */
  private async decompressFile(src: string, dest: string): Promise<void> {
    const { createGunzip } = await import('zlib');
    await pipeline(
      createReadStream(src),
      createGunzip(),
      createWriteStream(dest)
    );
  }

  /**
   * Backup database (placeholder - would need specific implementation based on DB)
   */
  private async backupDatabase(backupPath: string): Promise<void> {
    // This would typically use pg_dump for PostgreSQL
    // For now, we'll create a simple schema export
    try {
      const databaseInfo = {
        timestamp: new Date().toISOString(),
        note: 'Database backup would require pg_dump or similar tool',
        schema: 'See prisma/schema.prisma for current schema'
      };

      fs.writeFileSync(
        path.join(backupPath, 'database-info.json'),
        JSON.stringify(databaseInfo, null, 2)
      );
    } catch (error) {
      console.error('Database backup failed:', error);
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: string;
    newestBackup?: string;
  }> {
    try {
      const backups = await this.listBackups();
      
      let totalSize = 0;
      for (const backup of backups) {
        try {
          const stats = fs.statSync(backup.path);
          totalSize += this.getDirectorySize(backup.path);
        } catch (error) {
          console.warn(`Failed to get size for backup ${backup.name}:`, error);
        }
      }

      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : undefined,
        newestBackup: backups.length > 0 ? backups[0].timestamp : undefined
      };
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Get directory size recursively
   */
  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          totalSize += this.getDirectorySize(fullPath);
        } else {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Failed to calculate directory size for ${dirPath}:`, error);
    }
    
    return totalSize;
  }
}