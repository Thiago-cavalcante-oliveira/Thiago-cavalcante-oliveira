import { z } from "zod";
import { PageSchema } from "./manual";

export const AnalysisInputSchema = z.object({
  baseUrl: z.string().url(),
  pages: z.array(PageSchema)
});

export const AnalysisOutputSchema = z.object({
  manual: z.object({
    version: z.literal("1.0"),
    system: z.object({
      baseUrl: z.string().url(),
      scannedAt: z.string()
    }),
    pages: z.array(PageSchema),
    recommendations: z.array(z.string()).default([])
  })
});

export const ContentInputSchema = z.object({
  manual: z.object({
    version: z.literal("1.0"),
    system: z.object({
      baseUrl: z.string().url(),
      scannedAt: z.string()
    }),
    pages: z.array(PageSchema),
    recommendations: z.array(z.string()).default([])
  })
});

export const ContentOutputSchema = z.object({
  markdown: z.string().min(1)
});

export const CrawlerResultSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  elements: z.array(z.object({
    type: z.string(),
    selector: z.string(),
    text: z.string().optional(),
    attributes: z.record(z.string(), z.string()).optional()
  })),
  screenshot: z.string().optional(),
  timestamp: z.string()
});

export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
export type ContentInput = z.infer<typeof ContentInputSchema>;
export type ContentOutput = z.infer<typeof ContentOutputSchema>;
export type CrawlerResult = z.infer<typeof CrawlerResultSchema>;