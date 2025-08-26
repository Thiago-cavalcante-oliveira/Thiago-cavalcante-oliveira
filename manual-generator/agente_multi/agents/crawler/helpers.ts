import * as fs from 'fs/promises';

export async function logToFile(logDir: string, logFile: string, message: string, stage: string = 'crawler'): Promise<void> {
    try {
      await fs.mkdir(logDir, { recursive: true });
      const logMsg = `[${new Date().toISOString()}][${stage}] ${message}\n`;
      await fs.appendFile(logFile, logMsg, 'utf-8');
    } catch (error) {
      console.error(`Erro ao salvar log: ${error}`);
    }
  }

export async function retryWithFallback<T>(logDir: string, logFile: string, retryAttempts: number, retryDelay: number, operation: () => Promise<T>, operationName: string): Promise<T | null> {
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        await logToFile(logDir, logFile, `Tentativa ${attempt}/${retryAttempts} para ${operationName}`);
        const result = await operation();
        await logToFile(logDir, logFile, `${operationName} executado com sucesso na tentativa ${attempt}`);
        return result;
      } catch (error) {
        await logToFile(logDir, logFile, `Erro na tentativa ${attempt}/${retryAttempts} para ${operationName}: ${error}`, 'error');
        if (attempt < retryAttempts) {
          await logToFile(logDir, logFile, `Aguardando ${retryDelay}ms antes da próxima tentativa`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    await logToFile(logDir, logFile, `Todas as tentativas falharam para ${operationName}`, 'error');
    return null;
  }