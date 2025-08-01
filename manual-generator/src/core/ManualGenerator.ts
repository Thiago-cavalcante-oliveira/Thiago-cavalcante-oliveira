import { APP_CONFIG } from '../config/index.js';
import { GeminiService } from '../services/gemini.js';
import { AgentService, AgentInput } from '../services/AgentService.js';
import { PlaywrightService } from '../services/playwright.js';
import { FileUtils, UrlUtils, TimeUtils, LogUtils } from '../utils/index.js';
import type { ManualSection, InteractiveElement, AuthCredentials } from '../types/index.js';

export class ManualGenerator {
  private geminiService: GeminiService;
  private agentService: AgentService;
  private playwrightService: PlaywrightService;
  private sections: ManualSection[] = [];

  constructor() {
    this.geminiService = new GeminiService();
    this.agentService = new AgentService();
    this.playwrightService = new PlaywrightService();
    
    // Garantir que o diretório de saída existe
    FileUtils.ensureDirectoryExists(APP_CONFIG.OUTPUT_DIR);
  }

  async generateManual(url: string, credentials?: AuthCredentials): Promise<void> {
    LogUtils.logStep('🚀', `Iniciando geração de manual para: ${url}`);
    
    try {
      // Validar URL
      if (!UrlUtils.isValidUrl(url)) {
        throw new Error(`URL inválida: ${url}`);
      }

      // Inicializar serviços
      await this.playwrightService.initialize();

      // Se credenciais foram fornecidas, realizar login primeiro
      if (credentials && credentials.username && credentials.password) {
        LogUtils.logStep('🔐', 'Realizando login...');
        await this.performLogin(url, credentials);
      }

      // Processar página principal
      await this.processMainPage(url);

      // Processar funcionalidades interativas
      await this.processInteractiveFunctionalities(url);

      // Gerar arquivo markdown final
      await this.generateMarkdownFile(url);

      LogUtils.logSuccess('Manual gerado com sucesso!');
      LogUtils.logInfo(`Arquivo: ${APP_CONFIG.OUTPUT_DIR}/manual.md`);
      LogUtils.logInfo(`Total de páginas processadas: ${this.sections.length}`);
      LogUtils.logInfo(`Screenshots salvos em: ${APP_CONFIG.OUTPUT_DIR}`);

    } catch (error) {
      LogUtils.logError('Erro durante a geração do manual', error);
      throw error;
    } finally {
      await this.playwrightService.close();
    }
  }

  async generateUserFriendlyManual(url: string, credentials?: AuthCredentials): Promise<void> {
    LogUtils.logStep('🚀', `Iniciando geração de manual amigável para: ${url}`);
    
    try {
      // Validar URL
      if (!UrlUtils.isValidUrl(url)) {
        throw new Error(`URL inválida: ${url}`);
      }

      // Inicializar serviços
      await this.playwrightService.initialize();
      await this.agentService.initialize(); // Inicializar MinIO se configurado

      // Se credenciais foram fornecidas, realizar login primeiro
      if (credentials && credentials.username && credentials.password) {
        LogUtils.logStep('🔐', 'Realizando login...');
        await this.performLogin(url, credentials);
      }

      // Coletar dados para o agente
      const agentInput = await this.collectDataForAgent(url);
      
      // Gerar manual usando o AgentService
      LogUtils.logStep('🤖', 'Gerando manual otimizado para usuários...');
      const agentOutput = await this.agentService.generateUserFriendlyManual(agentInput);
      
      // Salvar manual gerado pelo agente
      await this.saveAgentGeneratedManual(agentOutput, url);
      
      LogUtils.logSuccess('✅ Manual amigável gerado com sucesso!');
      LogUtils.logInfo(`📋 Arquivo: ${APP_CONFIG.OUTPUT_DIR}/manual_usuario.md`);
      LogUtils.logInfo(`📋 Otimizado para usuários iniciantes`);
      
    } catch (error) {
      LogUtils.logError('Erro durante a geração do manual amigável', error);
      throw error;
    } finally {
      await this.playwrightService.close();
    }
  }

  private async processMainPage(url: string): Promise<void> {
    LogUtils.logStep('📸', 'Processando página principal...');

    // Navegar para a página
    await this.playwrightService.navigateToPage(url);

    // Fazer scroll e carregar conteúdo
    await this.playwrightService.scrollAndLoadContent();

    // Capturar screenshot principal
    const filename = await this.playwrightService.captureScreenshot('screenshot_1.png', APP_CONFIG.OUTPUT_DIR);

    // Detectar elementos interativos
    const interactiveElements = await this.playwrightService.detectInteractiveElements();
    LogUtils.logInfo(`Encontrados ${interactiveElements.length} elementos interativos`);

    // Obter conteúdo da página
    const content = await this.playwrightService.getPageContent();

    // Analisar com Gemini
    LogUtils.logStep('🧠', 'Analisando página principal...');
    const analysis = await this.geminiService.analyzeContent(
      content,
      'Página Principal',
      url,
      interactiveElements.map(el => el.text)
    );

    // Adicionar seção
    this.sections.push({
      title: `Página Principal: ${url}`,
      content: analysis,
      screenshot: filename,
      url: url
    });

    LogUtils.logSuccess('Página principal processada com sucesso');
  }

  private async processInteractiveFunctionalities(url: string): Promise<void> {
    LogUtils.logStep('🎯', 'Processando funcionalidades interativas...');

    // Obter elementos interativos novamente (página pode ter mudado)
    const interactiveElements = await this.playwrightService.detectInteractiveElements();
    let screenshotIndex = 2;
    const processedElements = new Set<string>(); // Para evitar processar o mesmo elemento várias vezes
    const contentHashes = new Map<string, string>(); // Para detectar mudanças de conteúdo
    let functionalLinksCount = 0;
    let nonFunctionalLinksCount = 0;
    const nonFunctionalElements: InteractiveElement[] = [];

    for (const element of interactiveElements) {
      LogUtils.logStep('🔍', `Processando elemento: ${element.text}`);

      // Verificar se já processamos este elemento específico
      const elementKey = `${element.text}_${element.type}_${element.selector}`;
      if (processedElements.has(elementKey)) {
        LogUtils.logWarning(`Elemento já processado, pulando: ${element.text}`);
        continue;
      }

      try {
        // Capturar hash do conteúdo antes da interação
        const beforeContent = await this.playwrightService.getPageContent();
        const beforeHash = this.generateContentHash(beforeContent);

        // Interagir com o elemento
        const interactionResult = await this.playwrightService.interactWithElement(
          element, 
          screenshotIndex, 
          APP_CONFIG.OUTPUT_DIR
        );

        if (interactionResult) {
          // Capturar hash do conteúdo após a interação
          const afterHash = this.generateContentHash(interactionResult.content);
          
          // Verificar se houve mudança significativa no conteúdo
          const hasContentChanged = beforeHash !== afterHash;
          const hasUrlChanged = interactionResult.url !== url;
          
          LogUtils.logInfo(`Mudança de URL: ${hasUrlChanged ? 'Sim' : 'Não'}`);
          LogUtils.logInfo(`Mudança de conteúdo: ${hasContentChanged ? 'Sim' : 'Não'}`);
          
          // Processar se houve mudança de URL OU mudança significativa de conteúdo
          if (hasUrlChanged || hasContentChanged) {
            // Verificar se já processamos este conteúdo específico
            const contentKey = hasUrlChanged ? interactionResult.url : `content_${afterHash}`;
            
            if (contentHashes.has(contentKey)) {
              LogUtils.logWarning(`Conteúdo similar já processado, pulando: ${element.text}`);
              continue;
            }
            
            contentHashes.set(contentKey, afterHash);
            processedElements.add(elementKey);
          
            // Analisar resultado da interação
            const analysisContent = interactionResult.modalContent || interactionResult.content;
            const sectionTitle = `Funcionalidade: ${element.text}`;

            LogUtils.logStep('🧠', `Analisando funcionalidade: ${element.text}`);
            const analysis = await this.geminiService.analyzeContent(
              analysisContent,
              sectionTitle,
              interactionResult.url,
              [],
              { 
                text: element.text, 
                type: element.type,
                url: interactionResult.url,
                sectionTitle: sectionTitle
              }
            );

            // Adicionar seção
            this.sections.push({
              title: sectionTitle,
              content: analysis,
              screenshot: interactionResult.filename,
              url: interactionResult.url
            });

            LogUtils.logSuccess(`Funcionalidade "${element.text}" processada com sucesso`);
            screenshotIndex++;
            functionalLinksCount++;
            
            // Aguardar um pouco entre interações para estabilidade
            await TimeUtils.delay(1500);
          } else {
            nonFunctionalLinksCount++;
            nonFunctionalElements.push(element);
            LogUtils.logWarning(`Nenhuma mudança detectada para: ${element.text}`);
          }
          
          // Voltar à página principal apenas se mudou de URL
          if (hasUrlChanged) {
            await this.playwrightService.returnToMainPage(url);
          }
        }

      } catch (error) {
        LogUtils.logError(`Erro ao processar elemento "${element.text}"`, error);
        nonFunctionalLinksCount++;
        nonFunctionalElements.push(element);
        // Continuar com o próximo elemento mesmo em caso de erro
        continue;
      }
    }

    // Se a maioria dos links não for funcional, documentar isso
    if (nonFunctionalLinksCount > 0 && functionalLinksCount === 0) {
      LogUtils.logWarning(`⚠️ Detectados ${nonFunctionalLinksCount} links não funcionais. Documentando limitações da aplicação.`);
      await this.documentNonFunctionalNavigation(nonFunctionalElements);
    } else if (nonFunctionalLinksCount > functionalLinksCount) {
      LogUtils.logWarning(`⚠️ Aplicação tem problemas de navegação: ${nonFunctionalLinksCount} links não funcionais vs ${functionalLinksCount} funcionais.`);
    }

    LogUtils.logSuccess('Funcionalidades interativas processadas');
  }

  private generateContentHash(content: string): string {
    // Gerar hash simples do conteúdo para detectar mudanças
    let hash = 0;
    const cleanContent = content.replace(/\s+/g, ' ').trim().substring(0, 5000); // Usar apenas primeiros 5000 chars
    for (let i = 0; i < cleanContent.length; i++) {
      const char = cleanContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private async generateMarkdownFile(url: string): Promise<void> {
    LogUtils.logStep('📝', 'Gerando arquivo markdown final...');

    const timestamp = TimeUtils.getCurrentTimestamp();
    const header = `# Manual de Usuário Gerado Automaticamente

**URL Base:** ${url}  
**Data de Geração:** ${timestamp}  
**Total de Páginas:** ${this.sections.length}

---
`;

    const sectionsMarkdown = this.sections.map(section => {
      return `## ${section.title}\n![Screenshot](./${section.screenshot})\n\n${section.content}`;
    }).join('\n\n---\n\n');

    const fullMarkdown = header + sectionsMarkdown;
    const manualPath = `${APP_CONFIG.OUTPUT_DIR}/manual.md`;
    
    FileUtils.writeFile(manualPath, fullMarkdown);
    LogUtils.logSuccess('Arquivo markdown gerado com sucesso');
  }

  private async performLogin(url: string, credentials: AuthCredentials): Promise<void> {
    try {
      // Navegar para a página inicial
      await this.playwrightService.navigateToPage(url);
      
      // Detectar formulário de login na página inicial
      let loginDetected = await this.playwrightService.detectLoginForm();
      
      if (loginDetected) {
        LogUtils.logInfo('Formulário de login detectado na página inicial');
        
        // Preencher credenciais
        await this.playwrightService.fillLoginForm(credentials.username!, credentials.password!);
        
        // Aguardar redirecionamento após login
        await this.playwrightService.waitForPageLoadPublic();
        
        LogUtils.logSuccess('Login realizado com sucesso');
      } else {
        LogUtils.logWarning('Formulário de login não encontrado na página inicial');
        
        // Tentar encontrar botão de login e clicar
        const loginButtonClicked = await this.playwrightService.tryClickLoginButton();
        
        if (loginButtonClicked) {
          LogUtils.logInfo('Botão de login clicado, verificando formulário...');
          
          // Aguardar carregamento da nova página
          await this.playwrightService.waitForPageLoadPublic();
          
          // Tentar detectar formulário novamente
          loginDetected = await this.playwrightService.detectLoginForm();
          
          if (loginDetected) {
            LogUtils.logInfo('Formulário de login detectado após interação');
            
            // Preencher credenciais
            await this.playwrightService.fillLoginForm(credentials.username!, credentials.password!);
            
            // Aguardar redirecionamento após login
            await this.playwrightService.waitForPageLoadPublic();
            
            LogUtils.logSuccess('Login realizado com sucesso');
          } else {
            LogUtils.logWarning('Formulário de login não encontrado mesmo após interação');
          }
        } else {
          LogUtils.logWarning('Botão de login não encontrado');
        }
      }
    } catch (error) {
      LogUtils.logError('Erro durante o processo de login', error);
      throw new Error(`Falha no login: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Método para obter estatísticas do manual gerado
  getStats(): { totalSections: number; totalScreenshots: number; timestamp: string } {
    return {
      totalSections: this.sections.length,
      totalScreenshots: this.sections.length, // Cada seção tem um screenshot
      timestamp: TimeUtils.getCurrentTimestamp()
    };
  }

  private async documentNonFunctionalNavigation(nonFunctionalElements: InteractiveElement[]): Promise<void> {
    LogUtils.logStep('📝', 'Documentando limitações de navegação...');
    
    const navigationDescription = nonFunctionalElements.map(el => 
      `- **${el.text}** (${el.type}): ${el.context || 'elemento de interface'}`
    ).join('\n');

    const limitationsContent = `
## ⚠️ Limitações Detectadas na Aplicação

Durante a análise automatizada, foram detectados **${nonFunctionalElements.length} elementos de navegação não funcionais**. 
Estes elementos estão visíveis na interface mas não produzem mudanças de conteúdo ou navegação quando clicados:

${navigationDescription}

### Possíveis Causas:
- Links sem funcionalidade implementada
- Aplicação Single Page Application (SPA) com problemas de roteamento
- Elementos meramente decorativos ou placeholders
- Problemas de JavaScript que impedem a navegação
- Elementos que requerem permissões especiais

### Recomendações:
1. Verificar se todos os links de navegação estão devidamente implementados
2. Revisar o sistema de roteamento da aplicação
3. Testar a navegação manualmente para confirmar o problema
4. Implementar funcionalidades em desenvolvimento para os elementos não funcionais

> **Nota**: Este manual foi gerado com base no conteúdo acessível da página principal. Para funcionalidades completas, recomenda-se corrigir os problemas de navegação detectados.
    `;

    // Adicionar seção de limitações
    this.sections.push({
      title: 'Limitações e Problemas Detectados',
      content: limitationsContent.trim(),
      screenshot: 'screenshot_1.png', // Usar screenshot da página principal
      url: 'Análise de limitações'
    });

    LogUtils.logSuccess('✅ Limitações documentadas no manual');
  }

  private async collectDataForAgent(url: string): Promise<AgentInput> {
    LogUtils.logStep('📊', 'Coletando dados para geração inteligente...');
    
    // Navegar para a página principal
    await this.playwrightService.navigateToPage(url);
    await this.playwrightService.scrollAndLoadContent();
    
    // Capturar screenshot principal
    const mainScreenshot = await this.playwrightService.captureScreenshot(
      'screenshot_main.png', 
      APP_CONFIG.OUTPUT_DIR
    );
    
    // Obter HTML da página
    const pageHtml = await this.playwrightService.getPageContent();
    
    // Detectar elementos interativos
    const interactiveElements = await this.playwrightService.detectInteractiveElements();
    
    // Coletar interações (limitado para performance)
    const domInteractions = [];
    let screenshotIndex = 2;
    
    for (const element of interactiveElements.slice(0, 8)) { // Limitar a 8 elementos
      try {
        LogUtils.logStep('🔄', `Testando interação: ${element.text}`);
        
        const interactionResult = await this.playwrightService.interactWithElement(
          element,
          screenshotIndex,
          APP_CONFIG.OUTPUT_DIR
        );
        
        if (interactionResult) {
          domInteractions.push({
            selector: element.selector,
            action: 'click',
            resultHtml: interactionResult.content.substring(0, 1000), // Limitar tamanho
            screenshot: interactionResult.filename,
            element: element,
            result: interactionResult
          });
          
          screenshotIndex++;
          
          // Retornar à página principal se necessário
          if (interactionResult.url !== url) {
            await this.playwrightService.returnToMainPage(url);
          }
          
          // Delay entre interações
          await TimeUtils.delay(1000);
        }
      } catch (error) {
        LogUtils.logWarning(`Erro ao testar ${element.text}: ${error}`);
        continue;
      }
    }
    
    return {
      url,
      pageHtml,
      mainScreenshot,
      domInteractions,
      breadcrumb: ['Página Principal']
    };
  }

  private async saveAgentGeneratedManual(agentOutput: any, url: string): Promise<void> {
    LogUtils.logStep('💾', 'Salvando manual otimizado...');
    
    const timestamp = TimeUtils.getCurrentTimestamp();
    const cleanUrl = url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    const header = `# Manual do Usuário - ${cleanUrl}

*Gerado automaticamente em ${timestamp}*
*Otimizado para usuários iniciantes*

---

`;

    const footer = `

---

## 📞 Precisa de Ajuda?

Se você encontrou alguma dificuldade ou tem dúvidas:

1. **Releia o passo-a-passo** - às vezes uma segunda leitura esclarece dúvidas
2. **Verifique os alertas importantes** (marcados com ⚠️)
3. **Procure ajuda técnica** se o problema persistir

## 🔄 Versão do Manual

- **Gerado em:** ${timestamp}
- **URL analisada:** ${url}
- **Audiência:** Usuários iniciantes
- **Tipo:** Manual interativo com capturas de tela

> Este manual foi gerado automaticamente com base na análise da interface. 
> Para funcionalidades mais avançadas, consulte a documentação técnica oficial.
`;

    const finalContent = header + agentOutput.markdownManual + footer;
    
    // Salvar arquivo
    const filePath = `${APP_CONFIG.OUTPUT_DIR}/manual_usuario.md`;
    await FileUtils.writeFile(filePath, finalContent);
    
    // Salvar metadados do agente
    const metadataPath = `${APP_CONFIG.OUTPUT_DIR}/manual_metadata.json`;
    await FileUtils.writeFile(
      metadataPath, 
      JSON.stringify(agentOutput.metadata, null, 2)
    );
    
    LogUtils.logSuccess('📄 Manual do usuário salvo com sucesso!');
  }
}
