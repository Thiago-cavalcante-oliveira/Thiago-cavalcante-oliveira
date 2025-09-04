// Ficheiro: config/env.ts

import 'dotenv/config';
import { z } from 'zod';

// Define o esquema de validação para as variáveis de ambiente
const EnvSchema = z.object({
   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
   HEADLESS: z.enum(['true','false']).default('false'),
   NAV_TIMEOUT_MS: z.coerce.number().default(30000),
   MAX_CONCURRENCY: z.coerce.number().int().positive().default(5),
   LOG_LEVEL: z.enum(['trace','debug','info','warn','error','fatal']).default('info'),
   GOOGLE_API_KEY: z.string().optional(),
   GROQ_API_KEY: z.string().optional(),
   SAEB_URL: z.string().optional(),
   SAEB_USERNAME: z.string().optional(),
   SAEB_PASSWORD: z.string().optional(),
   MAX_RETRIES: z.coerce.number().default(2)
 });

// Realiza a validação segura
export const envValidationResult = EnvSchema.safeParse(process.env);

if (!envValidationResult.success) {
  console.error('❌ Erro de validação nas variáveis de ambiente!', envValidationResult.error.flatten().fieldErrors);
}

// Exporta o objeto 'env' validado ou um objeto padrão em caso de falha
export const env = envValidationResult.success ? envValidationResult.data : EnvSchema.parse({});