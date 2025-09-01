import { Page } from "playwright";
import { logger } from "../utils/logger";
import { retry } from "../utils/retry";

const log = logger.child({ module: "elementHeuristics" });

export interface ElementAction {
  selector: string;
  role?: string;
  text: string;
  type?: string;
  href?: string;
  danger: boolean;
}

export interface PageAnalysis {
  title: string;
  url: string;
  breadcrumb: string[];
  inputs: Array<{
    name: string;
    label?: string;
    type: string;
    required: boolean;
    validations: string[];
    hints: string[];
  }>;
  tables: Array<{
    name: string;
    columns: string[];
    actions: string[];
  }>;
  actions: string[];
}

export async function analyzeCurrentPage(page: Page, allowDanger = false): Promise<{ analysis: PageAnalysis; actions: ElementAction[] }> {
  return retry(async () => {
    log.info('Iniciando análise da página atual');
    
    const result = await page.evaluate((allowDangerParam) => {
      const visible = (el: Element): boolean => {
        if (!el) return false;
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               htmlEl.offsetWidth > 0 && 
               htmlEl.offsetHeight > 0;
      };
      
      const labelFor = (input: Element): string => {
        const id = input.getAttribute('id');
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return (label.textContent || "").trim();
        }
        const parentLabel = input.closest("label");
        if (parentLabel) return (parentLabel.textContent || "").trim();
        const aria = input.getAttribute("aria-label") || input.getAttribute("placeholder");
        return aria || "";
      };
      
      const dangerText = (t: string): boolean => {
        return /(excluir|deletar|remover|apagar|publicar|enviar definitivo|submit definitivo|delete|remove)/i.test(t);
      };
      
      const getValidations = (input: HTMLInputElement): string[] => {
        const validations: string[] = [];
        
        if (input.required) validations.push('required');
        if (input.minLength > 0) validations.push(`minLength:${input.minLength}`);
        if (input.maxLength > 0) validations.push(`maxLength:${input.maxLength}`);
        if (input.min) validations.push(`min:${input.min}`);
        if (input.max) validations.push(`max:${input.max}`);
        if (input.pattern) validations.push(`pattern:${input.pattern}`);
        
        return validations;
      };
      
      const getHints = (input: Element): string[] => {
        const hints: string[] = [];
        
        const placeholder = input.getAttribute('placeholder');
        if (placeholder) hints.push(placeholder);
        
        const title = input.getAttribute('title');
        if (title) hints.push(title);
        
        const ariaDescription = input.getAttribute('aria-describedby');
        if (ariaDescription) {
          const descEl = document.getElementById(ariaDescription);
          if (descEl) hints.push(descEl.textContent?.trim() || '');
        }
        
        // Look for help text near the input
        const parent = input.parentElement;
        if (parent) {
          const helpText = parent.querySelector('.help-text, .hint, .description, small');
          if (helpText) hints.push(helpText.textContent?.trim() || '');
        }
        
        return hints.filter(h => h.length > 0);
      };

      const actions: ElementAction[] = [];
      const inputs: any[] = [];
      const tables: any[] = [];
      const actionsSet = new Set<string>();

      // Extract page title and URL
      const title = document.title || '';
      const url = location.href;
      
      // Extract breadcrumb
      const breadcrumb: string[] = [];
      const breadcrumbSelectors = [
        '.breadcrumb a, .breadcrumb span',
        '[aria-label="breadcrumb"] a, [aria-label="breadcrumb"] span',
        '.breadcrumbs a, .breadcrumbs span',
        'nav[aria-label="breadcrumb"] a, nav[aria-label="breadcrumb"] span'
      ];
      
      for (const selector of breadcrumbSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && !breadcrumb.includes(text)) {
              breadcrumb.push(text);
            }
          });
          break;
        }
      }

      // Extract visible inputs
      document.querySelectorAll('input, textarea, select').forEach(el => {
        const input = el as HTMLInputElement;
        if (!visible(input)) return;
        
        const name = input.name || input.id || input.getAttribute('data-name') || '';
        const label = labelFor(input);
        const type = input.type || 'text';
        const required = input.required || input.getAttribute('aria-required') === 'true';
        const validations = getValidations(input);
        const hints = getHints(input);
        
        if (name || label) {
          inputs.push({ name, label, type, required, validations, hints });
        }
      });

      // Extract tables
      document.querySelectorAll('table').forEach(table => {
        if (!visible(table)) return;
        
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        const caption = table.querySelector('caption')?.textContent?.trim() || '';
        const name = caption || `Tabela ${tables.length + 1}`;
        
        // Extract table actions (buttons in table)
        const tableActions: string[] = [];
        table.querySelectorAll('button, a[href], [role="button"]').forEach(btn => {
          const text = btn.textContent?.trim() || btn.getAttribute('title') || btn.getAttribute('aria-label') || '';
          if (text && !tableActions.includes(text)) {
            tableActions.push(text);
          }
        });
        
        if (headers.length > 0) {
          tables.push({ name, columns: headers, actions: tableActions });
        }
      });

      // Extract clickable actions
      document.querySelectorAll('button, a[href], [role="button"], input[type="submit"], input[type="button"]').forEach(el => {
        if (!visible(el)) return;
        
        const element = el as HTMLElement;
        const text = element.textContent?.trim() || element.getAttribute('title') || element.getAttribute('aria-label') || '';
        const href = element.getAttribute('href') || undefined;
        const type = element.getAttribute('type') || undefined;
        const role = element.getAttribute('role') || undefined;
        
        if (text) {
          const isDanger = dangerText(text);
          if (isDanger && !allowDangerParam) return;
          
          const selector = element.id ? `#${element.id}` : 
                          element.className ? `.${element.className.split(' ')[0]}` :
                          element.tagName.toLowerCase();
          
          actions.push({
            selector,
            role,
            text,
            type,
            href,
            danger: isDanger
          });
          
          actionsSet.add(text);
        }
      });

      return {
        analysis: {
          title,
          url,
          breadcrumb: breadcrumb as string[],
          inputs: inputs as any[],
          tables: tables as any[],
          actions: Array.from(actionsSet) as string[]
        },
        actions: actions as ElementAction[]
      };
    }, allowDanger);

    log.info(`Análise concluída: ${result.analysis.inputs.length} inputs, ${result.analysis.tables.length} tabelas, ${result.actions.length} ações`);
    return result as { analysis: PageAnalysis; actions: ElementAction[] };
  }, 3, 1000);
}

export async function extractPagePurpose(page: Page): Promise<string> {
  return retry(async () => {
    const purpose = await page.evaluate(() => {
      const title = document.title || '';
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      return `Título: ${title}\nCabeçalho principal: ${h1}\nDescrição: ${description}`;
    });
    
    return purpose;
  }, 3, 1000);
}

export async function extractMainActions(page: Page): Promise<string[]> {
  return retry(async () => {
    const actions = await page.evaluate(() => {
      const actionElements = document.querySelectorAll('button, a[href], [role="button"], input[type="submit"], input[type="button"]');
      const actions: string[] = [];
      
      actionElements.forEach(el => {
        const text = el.textContent?.trim() || el.getAttribute('title') || el.getAttribute('aria-label') || '';
        if (text && !actions.includes(text)) {
          actions.push(text);
        }
      });
      
      return actions;
    });
    
    return actions;
  }, 3, 1000);
}