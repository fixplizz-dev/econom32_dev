export declare class ScheduledBackupService {
    private backupService;
    private intervalId;
    private isRunning;
    constructor();
    start(intervalHours?: number): void;
    stop(): void;
    private runBackup;
    getStatus(): {
        isRunning: boolean;
        nextBackup?: Date;
    };
    private formatBytes;
}
export declare const scheduledBackupService: ScheduledBackupService;
//# sourceMappingURL=ScheduledBackupService.d.ts.map