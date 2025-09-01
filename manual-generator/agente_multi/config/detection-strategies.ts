/**
 * Configurações para estratégias avançadas de detecção de elementos
 */

export interface DetectionConfig {
  // Timeouts para diferentes operações
  timeouts: {
    networkIdle: number;
    dynamicLoad: number;
    elementWait: number;
    hoverWait: number;
    interactionWait: number;
    domObservation: number;
  };
  
  // Limites para otimização
  limits: {
    maxElementsToTest: number;
    maxIframesToProcess: number;
    maxHoverTargets: number;
    maxRetryAttempts: number;
  };
  
  // Seletores específicos por tipo de sistema
  selectors: {
    common: string[];
    administrative: string[];
    educational: string[];
    ecommerce: string[];
    custom: string[];
  };
  
  // Estratégias habilitadas
  enabledStrategies: {
    dynamicLoad: boolean;
    iframeDetection: boolean;
    hoverReveal: boolean;
    aiAnalysis: boolean;
    domObservation: boolean;
    fallbackDetection: boolean;
  };
  
  // Configurações de interação
  interaction: {
    strategies: string[];
    forceClick: boolean;
    scrollIntoView: boolean;
    useJavaScriptClick: boolean;
  };
}

export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  timeouts: {
    networkIdle: 10000,
    dynamicLoad: 3000,
    elementWait: 2000,
    hoverWait: 1000,
    interactionWait: 2000,
    domObservation: 5000
  },
  
  limits: {
    maxElementsToTest: 15,
    maxIframesToProcess: 5,
    maxHoverTargets: 10,
    maxRetryAttempts: 3
  },
  
  selectors: {
    common: [
      'button', 'a[href]', 'input[type="button"]', 'input[type="submit"]',
      '[onclick]', '[role="button"]', '.btn', '.button', '[data-action]',
      '.menu', '.navbar', '.sidebar', '.nav', '.navigation',
      '.dropdown', '.modal', '.popup', '.overlay'
    ],
    
    administrative: [
      '.menu-item', '.nav-link', '.sidebar-link', '.tab', '.tab-link',
      '.card', '.panel', '.widget', '.tile', '.dashboard-item',
      '[data-toggle]', '[data-target]', '[data-bs-toggle]', '[data-bs-target]',
      '[aria-expanded]', '[aria-haspopup]', '[tabindex]'
    ],
    
    educational: [
      '.report-link', '.analysis-button', '.export-button',
      '.filter-option', '.search-button', '.view-details',
      '.student-data', '.grade-input', '.assessment-link',
      '.curriculum-item', '.lesson-plan', '.evaluation-form'
    ],
    
    ecommerce: [
      '.add-to-cart', '.buy-now', '.product-link', '.category-link',
      '.filter-option', '.sort-option', '.pagination-link',
      '.checkout-button', '.payment-method', '.shipping-option'
    ],
    
    custom: [
      // Seletores específicos do sistema sendo testado
      '.saeb-menu', '.inep-link', '.resultado-link',
      '.relatorio-button', '.dados-escola', '.indicador-link'
    ]
  },
  
  enabledStrategies: {
    dynamicLoad: true,
    iframeDetection: true,
    hoverReveal: true,
    aiAnalysis: true,
    domObservation: true,
    fallbackDetection: true
  },
  
  interaction: {
    strategies: [
      'standard-click',
      'force-click',
      'scroll-and-click',
      'hover-and-click',
      'javascript-click'
    ],
    forceClick: true,
    scrollIntoView: true,
    useJavaScriptClick: true
  }
};

/**
 * Configurações específicas para diferentes tipos de sistemas
 */
export const SYSTEM_SPECIFIC_CONFIGS: Record<string, Partial<DetectionConfig>> = {
  'saeb-system': {
    selectors: {
      custom: [
        '.menu-saeb', '.relatorio-saeb', '.dados-escola',
        '.resultado-prova', '.indicador-qualidade',
        '.filtro-ano', '.filtro-rede', '.exportar-dados'
      ]
    },
    timeouts: {
      networkIdle: 15000, // Sistemas governamentais podem ser mais lentos
      dynamicLoad: 5000
    }
  } as Partial<DetectionConfig>,
  
  'administrative-system': {
    limits: {
      maxElementsToTest: 20 // Sistemas administrativos têm mais elementos
    },
    enabledStrategies: {
      hoverReveal: true,
      domObservation: true
    }
  } as Partial<DetectionConfig>,
  
  'spa-system': {
    timeouts: {
      dynamicLoad: 5000,
      domObservation: 8000
    },
    enabledStrategies: {
      domObservation: true,
      aiAnalysis: true
    }
  } as Partial<DetectionConfig>
};

/**
 * Função para mesclar configurações
 */
export function mergeDetectionConfig(
  baseConfig: DetectionConfig,
  overrides: Partial<DetectionConfig>
): DetectionConfig {
  return {
    ...baseConfig,
    ...overrides,
    timeouts: { ...baseConfig.timeouts, ...overrides.timeouts },
    limits: { ...baseConfig.limits, ...overrides.limits },
    selectors: {
      ...baseConfig.selectors,
      ...overrides.selectors,
      custom: [
        ...baseConfig.selectors.custom,
        ...(overrides.selectors?.custom || [])
      ]
    },
    enabledStrategies: {
      ...baseConfig.enabledStrategies,
      ...overrides.enabledStrategies
    },
    interaction: {
      ...baseConfig.interaction,
      ...overrides.interaction
    }
  };
}

/**
 * Obter configuração para um tipo específico de sistema
 */
export function getSystemConfig(systemType: string): DetectionConfig {
  const systemConfig = SYSTEM_SPECIFIC_CONFIGS[systemType];
  if (systemConfig) {
    return mergeDetectionConfig(DEFAULT_DETECTION_CONFIG, systemConfig);
  }
  return DEFAULT_DETECTION_CONFIG;
}