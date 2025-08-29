"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageOptimizationService = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class ImageOptimizationService {
    static isOptimizableImage(mimeType) {
        const format = mimeType.split('/')[1]?.toLowerCase();
        return this.SUPPORTED_FORMATS.includes(format);
    }
    static async optimizeImage(inputPath, outputDir) {
        try {
            if (!fs_1.default.existsSync(outputDir)) {
                fs_1.default.mkdirSync(outputDir, { recursive: true });
            }
            const inputBuffer = fs_1.default.readFileSync(inputPath);
            const image = (0, sharp_1.default)(inputBuffer);
            const metadata = await image.metadata();
            if (!metadata.width || !metadata.height) {
                throw new Error('Unable to read image metadata');
            }
            const baseName = path_1.default.parse(inputPath).name;
            const result = {
                original: inputPath,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format || 'unknown',
                    size: inputBuffer.length
                }
            };
            try {
                const webpPath = path_1.default.join(outputDir, `${baseName}.webp`);
                await image
                    .clone()
                    .webp({ quality: this.QUALITY.webp, effort: 6 })
                    .toFile(webpPath);
                result.webp = webpPath;
            }
            catch (error) {
                console.warn('Failed to create WebP version:', error);
            }
            try {
                const avifPath = path_1.default.join(outputDir, `${baseName}.avif`);
                await image
                    .clone()
                    .avif({ quality: this.QUALITY.avif, effort: 9 })
                    .toFile(avifPath);
                result.avif = avifPath;
            }
            catch (error) {
                console.warn('Failed to create AVIF version:', error);
            }
            try {
                const thumbnailPath = path_1.default.join(outputDir, `${baseName}_thumb.webp`);
                await image
                    .clone()
                    .resize(this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                    .webp({ quality: this.QUALITY.webp })
                    .toFile(thumbnailPath);
                result.thumbnail = thumbnailPath;
            }
            catch (error) {
                console.warn('Failed to create thumbnail:', error);
            }
            return result;
        }
        catch (error) {
            console.error('Image optimization failed:', error);
            throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static async resizeImage(inputPath, outputPath, width, height, options = {}) {
        const { quality = 85, format = 'webp' } = options;
        const image = (0, sharp_1.default)(inputPath);
        let resized = image.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
        });
        switch (format) {
            case 'webp':
                resized = resized.webp({ quality });
                break;
            case 'avif':
                resized = resized.avif({ quality });
                break;
            case 'jpeg':
                resized = resized.jpeg({ quality });
                break;
            case 'png':
                resized = resized.png({ quality });
                break;
        }
        await resized.toFile(outputPath);
    }
    static async getImageInfo(imagePath) {
        const image = (0, sharp_1.default)(imagePath);
        const metadata = await image.metadata();
        const stats = fs_1.default.statSync(imagePath);
        return {
            width: metadata.width || 0,
            height: metadata.height || 0,
            format: metadata.format || 'unknown',
            size: stats.size,
            hasAlpha: metadata.hasAlpha || false
        };
    }
    static async cleanupOptimizedVersions(basePath) {
        const baseName = path_1.default.parse(basePath).name;
        const dir = path_1.default.dirname(basePath);
        const filesToClean = [
            path_1.default.join(dir, `${baseName}.webp`),
            path_1.default.join(dir, `${baseName}.avif`),
            path_1.default.join(dir, `${baseName}_thumb.webp`)
        ];
        for (const filePath of filesToClean) {
            try {
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            catch (error) {
                console.warn(`Failed to cleanup file ${filePath}:`, error);
            }
        }
    }
}
exports.ImageOptimizationService = ImageOptimizationService;
ImageOptimizationService.SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
ImageOptimizationService.THUMBNAIL_SIZE = 300;
ImageOptimizationService.QUALITY = {
    webp: 80,
    avif: 70,
    jpeg: 85
};
//# sourceMappingURL=ImageOptimizationService.js.map