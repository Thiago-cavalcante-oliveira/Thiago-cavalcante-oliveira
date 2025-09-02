import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
   HEADLESS: z.enum(['true','false']).default('true'),
   NAV_TIMEOUT_MS: z.coerce.number().default(15000),
   STEP_TIMEOUT_MS: z.coerce.number().default(25000),
   MAX_CONCURRENCY: z.coerce.number().int().positive().default(5),
   ARTIFACT_DIR: z.string().default('artifacts'),
   LOG_LEVEL: z.enum(['trace','debug','info','warn','error','fatal']).default('info'),
   GOOGLE_API_KEY: z.string().optional(),
   GROQ_API_KEY: z.string().optional(),
   FIRECRAWL_API_KEY: z.string().optional(),
   SAEB_URL: z.string().optional(),
   SAEB_USERNAME: z.string().optional(),
   SAEB_PASSWORD: z.string().optional(),
   MAX_RETRIES: z.coerce.number().default(2)
 });

export const env = Env.parse(process.env);