import { z } from "zod";

export const InputSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  type: z.enum(["text","number","date","email","select","checkbox","radio","file","password"]).default("text"),
  required: z.boolean().default(false),
  validations: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([])
});

export const TableSchema = z.object({
  name: z.string(),
  columns: z.array(z.string()),
  actions: z.array(z.string()).default([])
});

export const WorkflowSchema = z.object({
  name: z.string(),
  steps: z.array(z.string())
});

export const PageSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  route: z.string().optional(),
  breadcrumb: z.array(z.string()).default([]),
  purpose: z.string(),
  mainActions: z.array(z.string()),
  inputs: z.array(InputSchema),
  tables: z.array(TableSchema).default([]),
  workflows: z.array(WorkflowSchema).default([]),
  screenshots: z.array(z.string()).default([])
});

export const ManualSchema = z.object({
  version: z.literal("1.0"),
  system: z.object({ baseUrl: z.string(), scannedAt: z.string() }),
  pages: z.array(PageSchema),
  recommendations: z.array(z.string()).default([])
});

export type Manual = z.infer<typeof ManualSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Input = z.infer<typeof InputSchema>;
export type Table = z.infer<typeof TableSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;