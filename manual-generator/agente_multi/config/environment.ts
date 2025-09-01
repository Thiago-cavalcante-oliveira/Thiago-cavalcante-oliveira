import { z } from 'zod';

/**
 * Schema de validação para variáveis de ambiente
 * Seguindo as regras do project_rules.md - seção 7: Gerenciamento de Configuração e Segredos
 */
export const EnvironmentSchema = z.object({
  // Configurações obrigatórias do Gemini AI
  GOOGLE_API_KEY: z.string().optional(),
  
  // Sistema de rotação de chaves Gemini (opcional)
  GEMINI_API_KEY_1: z.string().optional(),
  GEMINI_API_KEY_2: z.string().optional(),
  GEMINI_API_KEY_3: z.string().optional(),
  
  // Configurações do Gemini AI
  GEMINI_MAX_RETRIES: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(10)).default(5),
  GEMINI_BASE_WAIT_TIME: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(100)).default(1000),
  GEMINI_MAX_WAIT_TIME: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1000)).default(30000),
  
  // Configurações do MinIO (opcional)
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(65535)).optional(),
  MINIO_USE_SSL: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET_NAME: z.string().optional(),
  
  // Configurações do Groq (opcional)
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  
  // Configurações do Firecrawl (opcional)
  FIRECRAWL_API_KEY: z.string().optional(),
  
  // Configurações de sistema específico (SAEB)
  SAEB_URL: z.string().url().optional(),
  SAEB_USERNAME: z.string().optional(),
  SAEB_PASSWORD: z.string().optional(),
  
  // Configurações de logging e debug
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  DEBUG: z.string().regex(/^(true|false)$/).transform(val => val === 'true').default(false),
  
  // Configurações de performance
  MAX_FILE_SIZE: z.string().optional(),
  ENABLE_SANDBOX: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * Valida e retorna as variáveis de ambiente tipadas
 * @throws {Error} Se alguma variável obrigatória estiver ausente ou inválida
 */
export function validateEnvironment(): Environment {
  try {
    return EnvironmentSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue) => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      }).join('\n');
      
      throw new Error(`❌ Erro na validação das variáveis de ambiente:\n${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Valida as variáveis de ambiente de forma segura, retornando resultado com sucesso/erro
 */
export function safeValidateEnvironment(): { success: true; data: Environment } | { success: false; error: string } {
  try {
    const data = validateEnvironment();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido na validação'
    };
  }
}

/**
 * Configuração padrão para desenvolvimento
 */
export const DEFAULT_DEV_CONFIG: Partial<Environment> = {
  LOG_LEVEL: 'debug',
  DEBUG: true,
  NODE_ENV: 'development',
  GEMINI_MAX_RETRIES: 3,
  GEMINI_BASE_WAIT_TIME: 1000,
  GEMINI_MAX_WAIT_TIME: 30000
};

/**
 * Configuração padrão para produção
 */
export const DEFAULT_PROD_CONFIG: Partial<Environment> = {
  LOG_LEVEL: 'info',
  DEBUG: false,
  NODE_ENV: 'production',
  GEMINI_MAX_RETRIES: 5,
  GEMINI_BASE_WAIT_TIME: 2000,
  GEMINI_MAX_WAIT_TIME: 60000
};