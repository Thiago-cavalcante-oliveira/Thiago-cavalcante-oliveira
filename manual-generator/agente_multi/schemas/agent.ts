import { z } from "zod";

export const AgentConfigSchema = z.object({
  name: z.string(),
  capabilities: z.array(z.string()),
  maxRetries: z.number().min(0).default(3),
  timeout: z.number().min(1000).default(30000),
  priority: z.number().min(1).max(10).default(5)
});

export const TaskDataSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.string(), z.any()),
  priority: z.number().min(1).max(10).default(5),
  createdAt: z.string(),
  timeout: z.number().min(1000).optional()
});

export const TaskResultSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  executionTime: z.number().min(0),
  timestamp: z.string(),
  agentId: z.string()
});

export const LoginCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  loginUrl: z.string().url(),
  usernameSelector: z.string().default('#username'),
  passwordSelector: z.string().default('#password'),
  submitSelector: z.string().default('button[type="submit"]'),
  successIndicator: z.string().optional()
});

export const ScreenshotConfigSchema = z.object({
  fullPage: z.boolean().default(true),
  quality: z.number().min(0).max(100).default(80),
  format: z.enum(['png', 'jpeg']).default('png'),
  width: z.number().min(100).optional(),
  height: z.number().min(100).optional()
});

export const CrawlerConfigSchema = z.object({
  maxDepth: z.number().min(1).max(10).default(3),
  maxPages: z.number().min(1).max(1000).default(100),
  delay: z.number().min(0).default(1000),
  respectRobots: z.boolean().default(true),
  followRedirects: z.boolean().default(true),
  userAgent: z.string().optional()
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type TaskData = z.infer<typeof TaskDataSchema>;
export type TaskResult = z.infer<typeof TaskResultSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type ScreenshotConfig = z.infer<typeof ScreenshotConfigSchema>;
export type CrawlerConfig = z.infer<typeof CrawlerConfigSchema>;