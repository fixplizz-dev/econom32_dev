import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface ScanResult {
  safe: boolean;
  infected: boolean;
  virus?: string;
  error?: string;
  scanTime: number;
}

export class AntivirusService {
  private static instance: AntivirusService;
  private clamavAvailable: boolean = false;

  private constructor() {
    this.checkClamAVAvailability();
  }

  public static getInstance(): AntivirusService {
    if (!AntivirusService.instance) {
      AntivirusService.instance = new AntivirusService();
    }
    return AntivirusService.instance;
  }

  private async checkClamAVAvailability(): Promise<void> {
    try {
      await execAsync('clamdscan --version');
      this.clamavAvailable = true;
      console.log('ClamAV daemon is available');
    } catch (error) {
      try {
        await execAsync('clamscan --version');
        this.clamavAvailable = true;
        console.log('ClamAV scanner is available');
      } catch (error) {
        this.clamavAvailable = false;
        console.warn('ClamAV is not available. File scanning will be skipped.');
      }
    }
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.clamavAvailable) {
      await this.checkClamAVAvailability();
    }
    return this.clamavAvailable;
  }

  public async scanFile(filePath: string): Promise<ScanResult> {
    const startTime = Date.now();

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        safe: false,
        infected: false,
        error: 'File not found',
        scanTime: Date.now() - startTime
      };
    }

    // If ClamAV is not available, return as safe (with warning)
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
      // Try clamdscan first (daemon), fallback to clamscan
      let command = `clamdscan --no-summary "${filePath}"`;
      
      try {
        const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
        return this.parseScanResult(stdout, stderr, startTime);
      } catch (error: any) {
        // If daemon is not running, try regular clamscan
        if (error.code === 2 || error.message.includes('daemon')) {
          console.log('ClamAV daemon not running, using clamscan');
          command = `clamscan --no-summary "${filePath}"`;
          const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
          return this.parseScanResult(stdout, stderr, startTime);
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Antivirus scan error:', error);
      
      // If it's a timeout or process error, treat as suspicious
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

  private parseScanResult(stdout: string, stderr: string, startTime: number): ScanResult {
    const scanTime = Date.now() - startTime;

    // Check for infection patterns
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

    // Check for clean result
    if (stdout.includes('OK') || stdout.includes('Clean')) {
      return {
        safe: true,
        infected: false,
        scanTime
      };
    }

    // Check for errors
    if (stderr && stderr.trim()) {
      return {
        safe: false,
        infected: false,
        error: stderr.trim(),
        scanTime
      };
    }

    // Default to safe if no clear indication
    return {
      safe: true,
      infected: false,
      scanTime
    };
  }

  public async scanBuffer(buffer: Buffer, filename: string = 'buffer'): Promise<ScanResult> {
    // Create temporary file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    try {
      // Write buffer to temp file
      fs.writeFileSync(tempFile, buffer);
      
      // Scan the temp file
      const result = await this.scanFile(tempFile);
      
      return result;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  public async updateDatabase(): Promise<boolean> {
    if (!await this.isAvailable()) {
      console.warn('ClamAV not available, cannot update database');
      return false;
    }

    try {
      console.log('Updating ClamAV database...');
      await execAsync('freshclam', { timeout: 300000 }); // 5 minutes timeout
      console.log('ClamAV database updated successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to update ClamAV database:', error.message);
      return false;
    }
  }

  public async getStatus(): Promise<{
    available: boolean;
    version?: string;
    databaseVersion?: string;
    lastUpdate?: string;
  }> {
    const available = await this.isAvailable();
    
    if (!available) {
      return { available: false };
    }

    try {
      const { stdout: versionOutput } = await execAsync('clamscan --version');
      const version = versionOutput.trim();

      // Try to get database info
      let databaseVersion: string | undefined;
      let lastUpdate: string | undefined;

      try {
        const { stdout: dbOutput } = await execAsync('sigtool --info /var/lib/clamav/main.cvd');
        const versionMatch = dbOutput.match(/Version:\s*(\d+)/);
        const dateMatch = dbOutput.match(/Build time:\s*(.+)/);
        
        if (versionMatch) databaseVersion = versionMatch[1];
        if (dateMatch) lastUpdate = dateMatch[1];
      } catch (error) {
        // Database info not available, continue without it
      }

      return {
        available: true,
        version,
        databaseVersion,
        lastUpdate
      };
    } catch (error) {
      return { available: false };
    }
  }

  public async quarantineFile(filePath: string): Promise<boolean> {
    try {
      const quarantineDir = path.join(process.cwd(), 'quarantine');
      if (!fs.existsSync(quarantineDir)) {
        fs.mkdirSync(quarantineDir, { recursive: true });
      }

      const filename = path.basename(filePath);
      const quarantinePath = path.join(quarantineDir, `${Date.now()}_${filename}`);
      
      // Move file to quarantine
      fs.renameSync(filePath, quarantinePath);
      
      console.log(`File quarantined: ${filePath} -> ${quarantinePath}`);
      return true;
    } catch (error) {
      console.error('Failed to quarantine file:', error);
      return false;
    }
  }

  public async deleteInfectedFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Infected file deleted: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete infected file:', error);
      return false;
    }
  }
}

export default AntivirusService;