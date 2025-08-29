import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { ImageOptimizationService } from '../services/ImageOptimizationService';
import { BackupService } from '../services/BackupService';
import { AntivirusService } from '../services/AntivirusService';

const router = express.Router();
const prisma = new PrismaClient();
const antivirusService = AntivirusService.getInstance();

// Initialize backup service
const backupService = new BackupService({
  backupDir: path.join(process.cwd(), 'backups'),
  retentionDays: 30,
  compressionEnabled: true,
  includeDatabase: false // Would need pg_dump setup for full DB backup
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload single file (public for appeals, admin for other uses)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не предоставлен' });
    }

    // Save file info to database initially as unscanned
    const file = await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        bucket: 'local-uploads',
        scanned: false,
        safe: false
      }
    });

    // Start antivirus scan in background
    setImmediate(async () => {
      try {
        console.log(`Starting antivirus scan for file: ${file.filename}`);
        const scanResult = await antivirusService.scanFile(req.file!.path);
        
        if (scanResult.infected) {
          console.log(`Virus detected in file ${file.filename}: ${scanResult.virus}`);
          
          // Quarantine or delete the infected file
          await antivirusService.deleteInfectedFile(req.file!.path);
          
          // Update database
          await prisma.file.update({
            where: { id: file.id },
            data: {
              scanned: true,
              safe: false,
              scanResult: `INFECTED: ${scanResult.virus}`
            }
          });
        } else if (scanResult.safe) {
          console.log(`File ${file.filename} is clean`);
          
          // Optimize image if it's an image file and safe
          let optimizedVersions = null;
          if (ImageOptimizationService.isOptimizableImage(req.file!.mimetype)) {
            try {
              const optimizedDir = path.join(path.dirname(req.file!.path), 'optimized');
              optimizedVersions = await ImageOptimizationService.optimizeImage(req.file!.path, optimizedDir);
              console.log(`Image optimized: ${file.filename}`);
            } catch (error) {
              console.error('Image optimization failed:', error);
            }
          }
          
          // Update database
          await prisma.file.update({
            where: { id: file.id },
            data: {
              scanned: true,
              safe: true,
              scanResult: 'CLEAN'
            }
          });
        } else {
          console.log(`Scan failed for file ${file.filename}: ${scanResult.error}`);
          
          // If scan failed, treat as unsafe
          await prisma.file.update({
            where: { id: file.id },
            data: {
              scanned: true,
              safe: false,
              scanResult: `SCAN_FAILED: ${scanResult.error}`
            }
          });
        }
      } catch (error) {
        console.error('Background antivirus scan error:', error);
        
        // Update database with error
        await prisma.file.update({
          where: { id: file.id },
          data: {
            scanned: true,
            safe: false,
            scanResult: `ERROR: ${error}`
          }
        });
      }
    });

    return res.status(201).json({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      size: file.size,
      url: `/api/files/${file.id}`,
      message: 'Файл загружен и отправлен на проверку'
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// Upload multiple files
router.post('/upload-multiple', authMiddleware, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не предоставлены' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const dbFile = await prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          bucket: 'local-uploads'
        }
      });

      uploadedFiles.push({
        id: dbFile.id,
        filename: dbFile.filename,
        originalName: dbFile.originalName,
        size: dbFile.size,
        url: `/api/files/${dbFile.id}`
      });
    }

    return res.status(201).json({ files: uploadedFiles });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    return res.status(500).json({ error: 'Ошибка загрузки файлов' });
  }
});

// Get file by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'Файл не найден на диске' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);

    // Stream file
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get file error:', error);
    return res.status(500).json({ error: 'Ошибка получения файла' });
  }
});

// Get file info
router.get('/:id/info', async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        scanned: true,
        safe: true,
        createdAt: true
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    return res.json(file);
  } catch (error) {
    console.error('Get file info error:', error);
    return res.status(500).json({ error: 'Ошибка получения информации о файле' });
  }
});

// Get optimized image versions
router.get('/:id/webp', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    
    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const optimizedDir = path.join(path.dirname(file.path), 'optimized');
    const webpPath = path.join(optimizedDir, `${path.parse(file.filename).name}.webp`);
    
    if (!fs.existsSync(webpPath)) {
      return res.status(404).json({ error: 'WebP версия не найдена' });
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    const fileStream = fs.createReadStream(webpPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get WebP error:', error);
    return res.status(500).json({ error: 'Ошибка получения WebP файла' });
  }
});

router.get('/:id/avif', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    
    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const optimizedDir = path.join(path.dirname(file.path), 'optimized');
    const avifPath = path.join(optimizedDir, `${path.parse(file.filename).name}.avif`);
    
    if (!fs.existsSync(avifPath)) {
      return res.status(404).json({ error: 'AVIF версия не найдена' });
    }

    res.setHeader('Content-Type', 'image/avif');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    const fileStream = fs.createReadStream(avifPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get AVIF error:', error);
    return res.status(500).json({ error: 'Ошибка получения AVIF файла' });
  }
});

router.get('/:id/thumbnail', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    
    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const optimizedDir = path.join(path.dirname(file.path), 'optimized');
    const thumbnailPath = path.join(optimizedDir, `${path.parse(file.filename).name}_thumb.webp`);
    
    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({ error: 'Миниатюра не найдена' });
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    const fileStream = fs.createReadStream(thumbnailPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get thumbnail error:', error);
    return res.status(500).json({ error: 'Ошибка получения миниатюры' });
  }
});

// Backup management routes (admin only)
router.post('/backup', authMiddleware, async (req, res) => {
  try {
    console.log('Starting file backup...');
    const result = await backupService.createBackup();
    
    if (result.success) {
      return res.json({
        message: 'Резервная копия создана успешно',
        backup: {
          path: result.backupPath,
          filesCount: result.filesCount,
          totalSize: result.totalSize,
          duration: result.duration
        }
      });
    } else {
      return res.status(500).json({
        error: 'Ошибка создания резервной копии',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Backup creation error:', error);
    return res.status(500).json({ error: 'Ошибка создания резервной копии' });
  }
});

router.get('/backups', authMiddleware, async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    const stats = await backupService.getBackupStats();
    
    return res.json({
      backups,
      stats
    });
  } catch (error) {
    console.error('List backups error:', error);
    return res.status(500).json({ error: 'Ошибка получения списка резервных копий' });
  }
});

router.post('/restore/:backupName', authMiddleware, async (req, res) => {
  try {
    const { backupName } = req.params;
    const backupPath = path.join(process.cwd(), 'backups', backupName);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Резервная копия не найдена' });
    }

    const result = await backupService.restoreBackup(backupPath);
    
    if (result.success) {
      return res.json({
        message: 'Восстановление завершено успешно',
        restoredFiles: result.restoredFiles
      });
    } else {
      return res.status(500).json({
        error: 'Ошибка восстановления',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Restore error:', error);
    return res.status(500).json({ error: 'Ошибка восстановления резервной копии' });
  }
});

// Image optimization routes (admin only)
router.post('/:id/optimize', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    
    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    if (!ImageOptimizationService.isOptimizableImage(file.mimeType)) {
      return res.status(400).json({ error: 'Файл не является изображением для оптимизации' });
    }

    const optimizedDir = path.join(path.dirname(file.path), 'optimized');
    const result = await ImageOptimizationService.optimizeImage(file.path, optimizedDir);
    
    return res.json({
      message: 'Изображение оптимизировано успешно',
      optimized: {
        webp: result.webp ? `/api/files/${id}/webp` : null,
        avif: result.avif ? `/api/files/${id}/avif` : null,
        thumbnail: result.thumbnail ? `/api/files/${id}/thumbnail` : null,
        metadata: result.metadata
      }
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    return res.status(500).json({ error: 'Ошибка оптимизации изображения' });
  }
});

router.get('/:id/image-info', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    
    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    if (!ImageOptimizationService.isOptimizableImage(file.mimeType)) {
      return res.status(400).json({ error: 'Файл не является изображением' });
    }

    const imageInfo = await ImageOptimizationService.getImageInfo(file.path);
    
    return res.json({
      file: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType
      },
      imageInfo
    });
  } catch (error) {
    console.error('Get image info error:', error);
    return res.status(500).json({ error: 'Ошибка получения информации об изображении' });
  }
});

// Get antivirus status (admin only)
router.get('/antivirus/status', authMiddleware, async (req, res) => {
  try {
    const status = await antivirusService.getStatus();
    return res.json(status);
  } catch (error) {
    console.error('Get antivirus status error:', error);
    return res.status(500).json({ error: 'Ошибка получения статуса антивируса' });
  }
});

// Update antivirus database (admin only)
router.post('/antivirus/update', authMiddleware, async (req, res) => {
  try {
    const success = await antivirusService.updateDatabase();
    if (success) {
      return res.json({ message: 'База данных антивируса обновлена успешно' });
    } else {
      return res.status(500).json({ error: 'Ошибка обновления базы данных антивируса' });
    }
  } catch (error) {
    console.error('Update antivirus database error:', error);
    return res.status(500).json({ error: 'Ошибка обновления базы данных антивируса' });
  }
});

// Delete file (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    // Delete optimized versions if they exist
    if (ImageOptimizationService.isOptimizableImage(file.mimeType)) {
      try {
        await ImageOptimizationService.cleanupOptimizedVersions(file.path);
      } catch (error) {
        console.warn('Failed to cleanup optimized versions:', error);
      }
    }

    // Delete original file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await prisma.file.delete({
      where: { id }
    });

    return res.json({ message: 'Файл успешно удален' });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({ error: 'Ошибка удаления файла' });
  }
});

module.exports = router;