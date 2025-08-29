"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntivirusService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class AntivirusService {
    constructor() {
        this.clamavAvailable = false;
        this.checkClamAVAvailability();
    }
    static getInstance() {
        if (!AntivirusService.instance) {
            AntivirusService.instance = new AntivirusService();
        }
        return AntivirusService.instance;
    }
    async checkClamAVAvailability() {
        try {
            await execAsync('clamdscan --version');
            this.clamavAvailable = true;
            console.log('ClamAV daemon is available');
        }
        catch (error) {
            try {
                await execAsync('clamscan --version');
                this.clamavAvailable = true;
                console.log('ClamAV scanner is available');
            }
            catch (error) {
                this.clamavAvailable = false;
                console.warn('ClamAV is not available. File scanning will be skipped.');
            }
        }
    }
    async isAvailable() {
        if (!this.clamavAvailable) {
            await this.checkClamAVAvailability();
        }
        return this.clamavAvailable;
    }
    async scanFile(filePath) {
        const startTime = Date.now();
        if (!fs_1.default.existsSync(filePath)) {
            return {
                safe: false,
                infected: false,
                error: 'File not found',
                scanTime: Date.now() - startTime
            };
        }
        if (!await this.isAvailable()) {
            console.warn(`Antivirus not available, skipping scan for: ${filePath}`);
            return {
                safe: true,
                infected: false,
                error: 'Antivirus not available',
                scanTime: Date.now() - startTime
            };
        }
        try {
            let command = `clamdscan --no-summary "${filePath}"`;
            try {
                const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
                return this.parseScanResult(stdout, stderr, startTime);
            }
            catch (error) {
                if (error.code === 2 || error.message.includes('daemon')) {
                    console.log('ClamAV daemon not running, using clamscan');
                    command = `clamscan --no-summary "${filePath}"`;
                    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
                    return this.parseScanResult(stdout, stderr, startTime);
                }
                throw error;
            }
        }
        catch (error) {
            console.error('Antivirus scan error:', error);
            if (error.code === 'TIMEOUT' || error.killed) {
                return {
                    safe: false,
                    infected: false,
                    error: 'Scan timeout',
                    scanTime: Date.now() - startTime
                };
            }
            return {
                safe: false,
                infected: false,
                error: error.message || 'Scan failed',
                scanTime: Date.now() - startTime
            };
        }
    }
    parseScanResult(stdout, stderr, startTime) {
        const scanTime = Date.now() - startTime;
        if (stdout.includes('FOUND') || stderr.includes('FOUND')) {
            const virusMatch = stdout.match(/:\s*(.+)\s+FOUND/) || stderr.match(/:\s*(.+)\s+FOUND/);
            const virusName = virusMatch ? virusMatch[1].trim() : 'Unknown virus';
            return {
                safe: false,
                infected: true,
                virus: virusName,
                scanTime
            };
        }
        if (stdout.includes('OK') || stdout.includes('Clean')) {
            return {
                safe: true,
                infected: false,
                scanTime
            };
        }
        if (stderr && stderr.trim()) {
            return {
                safe: false,
                infected: false,
                error: stderr.trim(),
                scanTime
            };
        }
        return {
            safe: true,
            infected: false,
            scanTime
        };
    }
    async scanBuffer(buffer, filename = 'buffer') {
        const tempDir = path_1.default.join(process.cwd(), 'temp');
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        const tempFile = path_1.default.join(tempDir, `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        try {
            fs_1.default.writeFileSync(tempFile, buffer);
            const result = await this.scanFile(tempFile);
            return result;
        }
        finally {
            if (fs_1.default.existsSync(tempFile)) {
                fs_1.default.unlinkSync(tempFile);
            }
        }
    }
    async updateDatabase() {
        if (!await this.isAvailable()) {
            console.warn('ClamAV not available, cannot update database');
            return false;
        }
        try {
            console.log('Updating ClamAV database...');
            await execAsync('freshclam', { timeout: 300000 });
            console.log('ClamAV database updated successfully');
            return true;
        }
        catch (error) {
            console.error('Failed to update ClamAV database:', error.message);
            return false;
        }
    }
    async getStatus() {
        const available = await this.isAvailable();
        if (!available) {
            return { available: false };
        }
        try {
            const { stdout: versionOutput } = await execAsync('clamscan --version');
            const version = versionOutput.trim();
            let databaseVersion;
            let lastUpdate;
            try {
                const { stdout: dbOutput } = await execAsync('sigtool --info /var/lib/clamav/main.cvd');
                const versionMatch = dbOutput.match(/Version:\s*(\d+)/);
                const dateMatch = dbOutput.match(/Build time:\s*(.+)/);
                if (versionMatch)
                    databaseVersion = versionMatch[1];
                if (dateMatch)
                    lastUpdate = dateMatch[1];
            }
            catch (error) {
            }
            return {
                available: true,
                version,
                databaseVersion,
                lastUpdate
            };
        }
        catch (error) {
            return { available: false };
        }
    }
    async quarantineFile(filePath) {
        try {
            const quarantineDir = path_1.default.join(process.cwd(), 'quarantine');
            if (!fs_1.default.existsSync(quarantineDir)) {
                fs_1.default.mkdirSync(quarantineDir, { recursive: true });
            }
            const filename = path_1.default.basename(filePath);
            const quarantinePath = path_1.default.join(quarantineDir, `${Date.now()}_${filename}`);
            fs_1.default.renameSync(filePath, quarantinePath);
            console.log(`File quarantined: ${filePath} -> ${quarantinePath}`);
            return true;
        }
        catch (error) {
            console.error('Failed to quarantine file:', error);
            return false;
        }
    }
    async deleteInfectedFile(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`Infected file deleted: ${filePath}`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Failed to delete infected file:', error);
            return false;
        }
    }
}
exports.AntivirusService = AntivirusService;
exports.default = AntivirusService;
//# sourceMappingURL=AntivirusService.js.map