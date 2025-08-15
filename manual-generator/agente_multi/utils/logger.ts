import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["password", "authorization", "cookies", "headers.authorization"]
});

export function child(bindings: Record<string, any>) {
  return logger.child(bindings);
}