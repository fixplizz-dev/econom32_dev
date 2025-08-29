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
export declare class ImageOptimizationService {
    private static readonly SUPPORTED_FORMATS;
    private static readonly THUMBNAIL_SIZE;
    private static readonly QUALITY;
    static isOptimizableImage(mimeType: string): boolean;
    static optimizeImage(inputPath: string, outputDir: string): Promise<OptimizedImage>;
    static resizeImage(inputPath: string, outputPath: string, width: number, height?: number, options?: {
        quality?: number;
        format?: 'webp' | 'avif' | 'jpeg' | 'png';
    }): Promise<void>;
    static getImageInfo(imagePath: string): Promise<{
        width: number;
        height: number;
        format: string;
        size: number;
        hasAlpha: boolean;
    }>;
    static cleanupOptimizedVersions(basePath: string): Promise<void>;
}
//# sourceMappingURL=ImageOptimizationService.d.ts.map