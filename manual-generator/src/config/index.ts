import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RetryConfig } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
config();

// Validação das variáveis de ambiente obrigatórias
export function validateEnvironment(): void {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY não encontrada no arquivo .env');
    process.exit(1);
  }
}

// Configurações do sistema
export const APP_CONFIG = {
  // Diretórios
  OUTPUT_DIR: path.join(__dirname, '../../output'),
  SCRIPTS_DIR: path.join(__dirname, '../../scripts'),
  
  // API Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  
  // Configurações do Gemini
  GEMINI_MODEL: 'gemini-1.5-flash',
  GEMINI_CONFIG: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 2048,
  },
  
  // Modo de execução (debug ou produção)
  DEBUG_MODE: process.env.DEBUG_MODE === 'true' || process.argv.includes('--debug'),
  
  // Configurações do Playwright (adaptáveis ao modo)
  PLAYWRIGHT_CONFIG: {
    headless: process.env.DEBUG_MODE === 'true' || process.argv.includes('--debug') ? false : true,
    slowMo: process.env.DEBUG_MODE === 'true' || process.argv.includes('--debug') ? 1000 : 0,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      ...(process.env.DEBUG_MODE === 'true' || process.argv.includes('--debug') ? ['--start-maximized'] : [])
    ]
  },
  
  // Configurações de viewport
  VIEWPORT: {
    width: 1920,
    height: 1080
  },
  
  // User Agent
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Timeouts (em milissegundos) - Adaptáveis ao modo
  TIMEOUTS: {
    PAGE_LOAD: 45000,
    ELEMENT_WAIT: 5000,
    SCROLL_DELAY: 500,
    INTERACTION_DELAY: process.env.DEBUG_MODE === 'true' || process.argv.includes('--debug') ? 3000 : 1000,
    MODAL_WAIT: 5000,
    CONTENT_LOAD: 10000
  },
  
  // Limites - Removido limite de elementos interativos
  LIMITS: {
    MAX_INTERACTIVE_ELEMENTS: -1, // -1 = sem limite
    MAX_CONTENT_LENGTH: 8000,
    MAX_PREVIEW_LENGTH: 200
  }
};

// Configurações de retry para APIs externas
export const RETRY_CONFIG: RetryConfig = {
  maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '5'),
  baseWaitTime: parseInt(process.env.GEMINI_BASE_WAIT_TIME || '1000'),
  maxWaitTime: parseInt(process.env.GEMINI_MAX_WAIT_TIME || '30000'),
  rateLimitWaitTime: 2000
};

// Estratégias de navegação para diferentes tipos de página
export const NAVIGATION_STRATEGIES = [
  { waitUntil: 'networkidle' as const, timeout: 45000 },
  { waitUntil: 'domcontentloaded' as const, timeout: 30000 },
  { waitUntil: 'load' as const, timeout: 60000 },
  { timeout: 30000 } // Sem waitUntil como último recurso
];

// Seletores comuns para elementos interativos
export const SELECTORS = {
  // Botões básicos
  BUTTONS: 'button, input[type="button"], input[type="submit"], [role="button"]',
  
  // Links básicos
  LINKS: 'a[href]',
  
  // Elementos clicáveis gerais
  CLICKABLE: '[onclick], [data-toggle], [data-target], [data-modal]',
  
  // Navegação e menus
  NAVIGATION: `
    nav, [role="navigation"], .nav, .navbar, .navigation, .menu, .menu-container,
    .sidebar, .side-nav, .sidenav, .side-menu, .lateral-menu,
    .main-menu, .primary-nav, .header-nav, .top-nav,
    .breadcrumb, .breadcrumbs, .nav-tabs, .nav-pills,
    .accordion, .accordion-menu, .collapsible-menu,
    ul.menu, ul.nav, .menu-list, .nav-list,
    .dropdown, .dropdown-menu, .dropdown-content,
    [data-role="navigation"], [data-component="menu"]
  `,
  
  // Itens de menu específicos
  MENU_ITEMS: `
    nav a, nav button, nav li, nav [role="menuitem"],
    .nav a, .nav button, .nav li, .nav [role="menuitem"],
    .menu a, .menu button, .menu li, .menu [role="menuitem"],
    .sidebar a, .sidebar button, .sidebar li,
    .dropdown-item, .menu-item, .nav-item, .nav-link,
    [role="menuitem"], [role="tab"], [data-toggle="dropdown"],
    .accordion-header, .accordion-button, .collapsible-header,
    .tab, .tab-button, .tab-link, .tab-item
  `,
  
  // Elementos expansíveis
  EXPANDABLE: `
    [aria-expanded], [data-toggle="collapse"], [data-toggle="dropdown"],
    .dropdown-toggle, .accordion-toggle, .collapsible-toggle,
    .expandable, .toggle, .hamburger, .menu-toggle,
    details summary, .show-more, .expand-button
  `,
  
  // Cards e painéis interativos
  CARDS: `
    .card, .panel, .tile, .widget, .component,
    [data-card], [data-panel], [role="article"],
    .dashboard-item, .grid-item, .content-block
  `,
  
  // Modais e overlays
  MODALS: '[role="dialog"], .modal, .popup, .overlay, .lightbox',
  
  // Botões de fechar
  CLOSE_BUTTONS: '[aria-label="Close"], .close, .modal-close, [data-dismiss="modal"]',
  
  // Elementos com texto clicável
  TEXT_CLICKABLE: `
    span[onclick], div[onclick], p[onclick], 
    [data-action], [data-click], [data-handler],
    .clickable, .interactive, .selectable,
    .link-like, .pseudo-link, .action-text
  `
};

// Filtros para links relevantes
export const LINK_FILTERS = {
  MIN_TEXT_LENGTH: 2,
  MAX_TEXT_LENGTH: 50,
  EXCLUDED_PROTOCOLS: ['mailto:', 'tel:'],
  EXCLUDED_TEXTS: ['home', 'voltar'],
  INCLUDED_PATTERNS: ['#', 'modal', 'popup', 'ver', 'abrir']
};
