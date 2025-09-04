import pino from "pino";
import { env } from '../config/env.js';

const LOG_LEVEL = env.LOG_LEVEL; // Usar o nível de log validado do ambiente

export const logger = pino({
  level: LOG_LEVEL,
  redact: ["password", "authorization", "cookies", "headers.authorization"]
});

export function child(bindings: Record<string, any>) {
  return logger.child(bindings);
}