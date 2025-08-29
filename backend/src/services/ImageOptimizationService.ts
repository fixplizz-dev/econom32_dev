import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface OptimizedImage {
  original: string;
  webp?: string;
  avif?: string;
  thumbnail?: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export class ImageOptimizationService {
  private static readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
  private static readonly THUMBNAIL_SIZE = 300;
  private static readonly QUALITY = {
    webp: 80,
    avif: 70,
    jpeg: 85
  };

  /**
   * Check if file is an image that can be optimized
   */
  static isOptimizableImage(mimeType: string): boolean {
    const format = mimeType.split('/')[1]?.toLowerCase();
    return this.SUPPORTED_FORMATS.includes(format);
  }

  /**
   * Optimize image by creating WebP, AVIF versions and thumbnail
   */
  static async optimizeImage(inputPath: string, outputDir: string): Promise<OptimizedImage> {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const inputBuffer = fs.readFileSync(inputPath);
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to read image metadata');
      }

      const baseName = path.parse(inputPath).name;
      const result: OptimizedImage = {
        original: inputPath,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format || 'unknown',
          size: inputBuffer.length
        }
      };

      // Create WebP version
      try {
        const webpPath = path.join(outputDir, `${baseName}.webp`);
        await image
          .clone()
          .webp({ quality: this.QUALITY.webp, effort: 6 })
          .toFile(webpPath);
        result.webp = webpPath;
      } catch (error) {
        console.warn('Failed to create WebP version:', error);
      }

      // Create AVIF version (more efficient but newer format)
      try {
        const avifPath = path.join(outputDir, `${baseName}.avif`);
        await image
          .clone()
          .avif({ quality: this.QUALITY.avif, effort: 9 })
          .toFile(avifPath);
        result.avif = avifPath;
      } catch (error) {
        console.warn('Failed to create AVIF version:', error);
      }

      // Create thumbnail
      try {
        const thumbnailPath = path.join(outputDir, `${baseName}_thumb.webp`);
        await image
          .clone()
          .resize(this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: this.QUALITY.webp })
          .toFile(thumbnailPath);
        result.thumbnail = thumbnailPath;
      } catch (error) {
        console.warn('Failed to create thumbnail:', error);
      }

      return result;
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resize image to specific dimensions
   */
  static async resizeImage(
    inputPath: string, 
    outputPath: string, 
    width: number, 
    height?: number,
    options: { quality?: number; format?: 'webp' | 'avif' | 'jpeg' | 'png' } = {}
  ): Promise<void> {
    const { quality = 85, format = 'webp' } = options;

    const image = sharp(inputPath);
    
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

  /**
   * Get optimized image info
   */
  static async getImageInfo(imagePath: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
  }> {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const stats = fs.statSync(imagePath);

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size,
      hasAlpha: metadata.hasAlpha || false
    };
  }

  /**
   * Clean up old optimized versions
   */
  static async cleanupOptimizedVersions(basePath: string): Promise<void> {
    const baseName = path.parse(basePath).name;
    const dir = path.dirname(basePath);

    const filesToClean = [
      path.join(dir, `${baseName}.webp`),
      path.join(dir, `${baseName}.avif`),
      path.join(dir, `${baseName}_thumb.webp`)
    ];

    for (const filePath of filesToClean) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`Failed to cleanup file ${filePath}:`, error);
      }
    }
  }
}