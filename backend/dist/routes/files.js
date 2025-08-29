"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ImageOptimizationService_1 = require("../services/ImageOptimizationService");
const BackupService_1 = require("../services/BackupService");
const AntivirusService_1 = require("../services/AntivirusService");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const antivirusService = AntivirusService_1.AntivirusService.getInstance();
const backupService = new BackupService_1.BackupService({
    backupDir: path_1.default.join(process.cwd(), 'backups'),
    retentionDays: 30,
    compressionEnabled: true,
    includeDatabase: false
});
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error('Неподдерживаемый тип файла'), false);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не предоставлен' });
        }
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
        setImmediate(async () => {
            try {
                console.log(`Starting antivirus scan for file: ${file.filename}`);
                const scanResult = await antivirusService.scanFile(req.file.path);
                if (scanResult.infected) {
                    console.log(`Virus detected in file ${file.filename}: ${scanResult.virus}`);
                    await antivirusService.deleteInfectedFile(req.file.path);
                    await prisma.file.update({
                        where: { id: file.id },
                        data: {
                            scanned: true,
                            safe: false,
                            scanResult: `INFECTED: ${scanResult.virus}`
                        }
                    });
                }
                else if (scanResult.safe) {
                    console.log(`File ${file.filename} is clean`);
                    let optimizedVersions = null;
                    if (ImageOptimizationService_1.ImageOptimizationService.isOptimizableImage(req.file.mimetype)) {
                        try {
                            const optimizedDir = path_1.default.join(path_1.default.dirname(req.file.path), 'optimized');
                            optimizedVersions = await ImageOptimizationService_1.ImageOptimizationService.optimizeImage(req.file.path, optimizedDir);
                            console.log(`Image optimized: ${file.filename}`);
                        }
                        catch (error) {
                            console.error('Image optimization failed:', error);
                        }
                    }
                    await prisma.file.update({
                        where: { id: file.id },
                        data: {
                            scanned: true,
                            safe: true,
                            scanResult: 'CLEAN'
                        }
                    });
                }
                else {
                    console.log(`Scan failed for file ${file.filename}: ${scanResult.error}`);
                    await prisma.file.update({
                        where: { id: file.id },
                        data: {
                            scanned: true,
                            safe: false,
                            scanResult: `SCAN_FAILED: ${scanResult.error}`
                        }
                    });
                }
            }
            catch (error) {
                console.error('Background antivirus scan error:', error);
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
    }
    catch (error) {
        console.error('File upload error:', error);
        return res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});
router.post('/upload-multiple', auth_1.authMiddleware, upload.array('files', 5), async (req, res) => {
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
    }
    catch (error) {
        console.error('Multiple file upload error:', error);
        return res.status(500).json({ error: 'Ошибка загрузки файлов' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const file = await prisma.file.findUnique({
            where: { id }
        });
        if (!file) {
            return res.status(404).json({ error: 'Файл не найден' });
        }
        if (!fs_1.default.existsSync(file.path)) {
            return res.status(404).json({ error: 'Файл не найден на диске' });
        }
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
        const fileStream = fs_1.default.createReadStream(file.path);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error('Get file error:', error);
        return res.status(500).json({ error: 'Ошибка получения файла' });
    }
});
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
    }
    catch (error) {
        console.error('Get file info error:', error);
        return res.status(500).json({ error: 'Ошибка получения информации о файле' });
    }
});
router.get('/:id/webp', async (req, res) => {
    try {
        const { id } = req.params;
        const file = await prisma.file.findUnique({ where: { id } });
        if (!file) {
            return res.status(404).json({ error: 'Файл не найден' });
        }
        const optimizedDir = path_1.default.join(path_1.default.dirname(file.path), 'optimized');
        const webpPath = path_1.default.join(optimizedDir, `${path_1.default.parse(file.filename).name}.webp`);
        if (!fs_1.default.existsSync(webpPath)) {
            return res.status(404).json({ error: 'WebP версия не найдена' });
        }
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        const fileStream = fs_1.default.createReadStream(webpPath);
        fileStream.pipe(res);
    }
    catch (error) {
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
        const optimizedDir = path_1.default.join(path_1.default.dirname(file.path), 'optimized');
        const avifPath = path_1.default.join(optimizedDir, `${path_1.default.parse(file.filename).name}.avif`);
        if (!fs_1.default.existsSync(avifPath)) {
            return res.status(404).json({ error: 'AVIF версия не найдена' });
        }
        res.setHeader('Content-Type', 'image/avif');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        const fileStream = fs_1.default.createReadStream(avifPath);
        fileStream.pipe(res);
    }
    catch (error) {
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
        const optimizedDir = path_1.default.join(path_1.default.dirname(file.path), 'optimized');
        const thumbnailPath = path_1.default.join(optimizedDir, `${path_1.default.parse(file.filename).name}_thumb.webp`);
        if (!fs_1.default.existsSync(thumbnailPath)) {
            return res.status(404).json({ error: 'Миниатюра не найдена' });
        }
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        const fileStream = fs_1.default.createReadStream(thumbnailPath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error('Get thumbnail error:', error);
        return res.status(500).json({ error: 'Ошибка получения миниатюры' });
    }
});
router.post('/backup', auth_1.authMiddleware, async (req, res) => {
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
        }
        else {
            return res.status(500).json({
                error: 'Ошибка создания резервной копии',
                details: result.error
            });
        }
    }
    catch (error) {
        console.error('Backup creation error:', error);
        return res.status(500).json({ error: 'Ошибка создания резервной копии' });
    }
});
router.get('/backups', auth_1.authMiddleware, async (req, res) => {
    try {
        const backups = await backupService.listBackups();
        const stats = await backupService.getBackupStats();
        return res.json({
            backups,
            stats
        });
    }
    catch (error) {
        console.error('List backups error:', error);
        return res.status(500).json({ error: 'Ошибка получения списка резервных копий' });
    }
});
router.post('/restore/:backupName', auth_1.authMiddleware, async (req, res) => {
    try {
        const { backupName } = req.params;
        const backupPath = path_1.default.join(process.cwd(), 'backups', backupName);
        if (!fs_1.default.existsSync(backupPath)) {
            return res.status(404).json({ error: 'Резервная копия не найдена' });
        }
        const result = await backupService.restoreBackup(backupPath);
        if (result.success) {
            return res.json({
                message: 'Восстановление завершено успешно',
                restoredFiles: result.restoredFiles
            });
        }
        else {
            return res.status(500).json({
                error: 'Ошибка восстановления',
                details: result.error
            });
        }
    }
    catch (error) {
        console.error('Restore error:', error);
        return res.status(500).json({ error: 'Ошибка восстановления резервной копии' });
    }
});
router.post('/:id/optimize', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const file = await prisma.file.findUnique({ where: { id } });
        if (!file) {
            return res.status(404).json({ error: 'Файл не найден' });
        }
        if (!ImageOptimizationService_1.ImageOptimizationService.isOptimizableImage(file.mimeType)) {
            return res.status(400).json({ error: 'Файл не является изображением для оптимизации' });
        }
        const optimizedDir = path_1.default.join(path_1.default.dirname(file.path), 'optimized');
        const result = await ImageOptimizationService_1.ImageOptimizationService.optimizeImage(file.path, optimizedDir);
        return res.json({
            message: 'Изображение оптимизировано успешно',
            optimized: {
                webp: result.webp ? `/api/files/${id}/webp` : null,
                avif: result.avif ? `/api/files/${id}/avif` : null,
                thumbnail: result.thumbnail ? `/api/files/${id}/thumbnail` : null,
                metadata: result.metadata
            }
        });
    }
    catch (error) {
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
        if (!ImageOptimizationService_1.ImageOptimizationService.isOptimizableImage(file.mimeType)) {
            return res.status(400).json({ error: 'Файл не является изображением' });
        }
        const imageInfo = await ImageOptimizationService_1.ImageOptimizationService.getImageInfo(file.path);
        return res.json({
            file: {
                id: file.id,
                filename: file.filename,
                originalName: file.originalName,
                mimeType: file.mimeType
            },
            imageInfo
        });
    }
    catch (error) {
        console.error('Get image info error:', error);
        return res.status(500).json({ error: 'Ошибка получения информации об изображении' });
    }
});
router.get('/antivirus/status', auth_1.authMiddleware, async (req, res) => {
    try {
        const status = await antivirusService.getStatus();
        return res.json(status);
    }
    catch (error) {
        console.error('Get antivirus status error:', error);
        return res.status(500).json({ error: 'Ошибка получения статуса антивируса' });
    }
});
router.post('/antivirus/update', auth_1.authMiddleware, async (req, res) => {
    try {
        const success = await antivirusService.updateDatabase();
        if (success) {
            return res.json({ message: 'База данных антивируса обновлена успешно' });
        }
        else {
            return res.status(500).json({ error: 'Ошибка обновления базы данных антивируса' });
        }
    }
    catch (error) {
        console.error('Update antivirus database error:', error);
        return res.status(500).json({ error: 'Ошибка обновления базы данных антивируса' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const file = await prisma.file.findUnique({
            where: { id }
        });
        if (!file) {
            return res.status(404).json({ error: 'Файл не найден' });
        }
        if (ImageOptimizationService_1.ImageOptimizationService.isOptimizableImage(file.mimeType)) {
            try {
                await ImageOptimizationService_1.ImageOptimizationService.cleanupOptimizedVersions(file.path);
            }
            catch (error) {
                console.warn('Failed to cleanup optimized versions:', error);
            }
        }
        if (fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
        await prisma.file.delete({
            where: { id }
        });
        return res.json({ message: 'Файл успешно удален' });
    }
    catch (error) {
        console.error('Delete file error:', error);
        return res.status(500).json({ error: 'Ошибка удаления файла' });
    }
});
module.exports = router;
//# sourceMappingURL=files.js.map