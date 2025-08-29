export interface ScanResult {
    safe: boolean;
    infected: boolean;
    virus?: string;
    error?: string;
    scanTime: number;
}
export declare class AntivirusService {
    private static instance;
    private clamavAvailable;
    private constructor();
    static getInstance(): AntivirusService;
    private checkClamAVAvailability;
    isAvailable(): Promise<boolean>;
    scanFile(filePath: string): Promise<ScanResult>;
    private parseScanResult;
    scanBuffer(buffer: Buffer, filename?: string): Promise<ScanResult>;
    updateDatabase(): Promise<boolean>;
    getStatus(): Promise<{
        available: boolean;
        version?: string;
        databaseVersion?: string;
        lastUpdate?: string;
    }>;
    quarantineFile(filePath: string): Promise<boolean>;
    deleteInfectedFile(filePath: string): Promise<boolean>;
}
export default AntivirusService;
//# sourceMappingURL=AntivirusService.d.ts.map