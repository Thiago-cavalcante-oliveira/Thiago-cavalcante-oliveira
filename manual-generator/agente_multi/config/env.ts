import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
   HEADLESS: z.enum(['true','false']).default('true'),
   NAV_TIMEOUT_MS: z.coerce.number().default(30000),
   LOG_LEVEL: z.enum(['trace','debug','info','warn','error','fatal']).default('info'),
   GOOGLE_API_KEY: z.string().optional(),
   GEMINI_API_KEY_1: z.string().optional(),
   GEMINI_API_KEY_2: z.string().optional(),
   GEMINI_API_KEY_3: z.string().optional(),
   GEMINI_API_KEY_4: z.string().optional(),
   GROQ_API_KEY_1: z.string().optional(),
   GROQ_API_KEY_2: z.string().optional(),
   GROQ_API_KEY_3: z.string().optional(),
   SAEB_URL: z.string().url().optional(),
   SAEB_USERNAME: z.string().optional(),
   SAEB_PASSWORD: z.string().optional(),
 });

const envValidationResult = EnvSchema.safeParse(process.env);

if (!envValidationResult.success) {
  console.error('❌ Erro de validação nas variáveis de ambiente!', envValidationResult.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = envValidationResult.data;

