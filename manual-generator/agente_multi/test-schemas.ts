import { 
  ManualSchema, 
  PageSchema, 
  InputSchema,
  AnalysisInputSchema,
  validateData,
  safeValidateData 
} from './schemas';
import { logger } from './utils/logger';

async function testSchemas() {
  logger.info('Iniciando testes dos schemas Zod');

  // Teste 1: Validação de Input
  const inputData = {
    name: 'username',
    label: 'Nome de usuário',
    type: 'text',
    required: true,
    validations: ['minLength:3'],
    hints: ['Digite seu nome de usuário']
  };

  try {
    const validInput = validateData(InputSchema, inputData);
    logger.info(`✅ Input validado com sucesso: ${JSON.stringify(validInput, null, 2)}`);
  } catch (error) {
    logger.error(`❌ Erro na validação do Input: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Teste 2: Validação de Page
  const pageData = {
    id: 'login-page',
    title: 'Página de Login',
    url: 'https://example.com/login',
    purpose: 'Autenticação de usuários',
    mainActions: ['login', 'forgot-password'],
    inputs: [inputData],
    breadcrumb: ['Home', 'Login']
  };

  const pageValidation = safeValidateData(PageSchema, pageData);
  if (pageValidation.success) {
    logger.info(`✅ Page validada com sucesso: ${JSON.stringify(pageValidation.data, null, 2)}`);
  } else {
    logger.error(`❌ Erro na validação da Page: ${pageValidation.error}`);
  }

  // Teste 3: Validação de Manual completo
  const manualData = {
    version: '1.0',
    system: {
      baseUrl: 'https://example.com',
      scannedAt: new Date().toISOString()
    },
    pages: [pageData],
    recommendations: ['Implementar 2FA', 'Melhorar UX do login']
  };

  try {
    const validManual = validateData(ManualSchema, manualData);
    logger.info('✅ Manual validado com sucesso');
    logger.info(`📊 Manual contém ${validManual.pages.length} páginas`);
  } catch (error) {
    logger.error(`❌ Erro na validação do Manual: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Teste 4: Validação com dados inválidos
  const invalidData = {
    name: '', // nome vazio - deve falhar
    type: 'invalid-type' // tipo inválido - deve falhar
  };

  const invalidValidation = safeValidateData(InputSchema, invalidData);
  if (!invalidValidation.success) {
    logger.info(`✅ Validação de dados inválidos funcionou corretamente: ${invalidValidation.error}`);
  } else {
    logger.error('❌ Validação deveria ter falhado para dados inválidos');
  }

  logger.info('🎯 Testes dos schemas concluídos');
}

// Executar testes
testSchemas().catch(error => {
  logger.error(`Erro durante os testes: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});