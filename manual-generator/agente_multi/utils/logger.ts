import pino from "pino";
import { safeValidateEnvironment } from '../config/environment.js';

// Validar variáveis de ambiente usando Zod
const envValidation = safeValidateEnvironment();
const logLevel = envValidation.success ? envValidation.data.LOG_LEVEL : 'info';

export const logger = pino({
  level: logLevel,
  redact: ["password", "authorization", "cookies", "headers.authorization"]
});

if (!envValidation.success) {
  logger.warn({ error: envValidation.error }, '⚠️ [Logger] Erro na validação de ambiente, usando LOG_LEVEL padrão (info)');
}

export function child(bindings: Record<string, any>) {
  return logger.child(bindings);
}