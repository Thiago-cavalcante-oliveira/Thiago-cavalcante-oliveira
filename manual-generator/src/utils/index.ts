import fs from 'fs';
import path from 'path';

export class FileUtils {
  static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static writeFile(filePath: string, content: string): void {
    const directory = path.dirname(filePath);
    this.ensureDirectoryExists(directory);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}

export class UrlUtils {
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateMinIOEndpoint(endPoint: string, port: number, useSSL: boolean): boolean {
    if (!endPoint || endPoint.trim() === '') {
      return false;
    }

    const protocol = useSSL ? 'https' : 'http';
    const testUrl = `${protocol}://${endPoint}:${port}`;
    
    return this.isValidUrl(testUrl);
  }

  static sanitizeForFilename(url: string): string {
    return url
      .replace(/https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
  }
}

export class TimeUtils {
  static getCurrentTimestamp(): string {
    return new Date().toLocaleString('pt-BR');
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class LogUtils {
  static logStep(step: string, message: string): void {
    console.log(`${step} ${message}`);
  }

  static logSuccess(message: string): void {
    console.log(`✅ ${message}`);
  }

  static logError(message: string, error?: any): void {
    console.error(`❌ ${message}`, error ? `: ${error.message || error}` : '');
  }

  static logWarning(message: string): void {
    console.log(`⚠️ ${message}`);
  }

  static logInfo(message: string): void {
    console.log(`📋 ${message}`);
  }
}
