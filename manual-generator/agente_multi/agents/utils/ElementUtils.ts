// ============================================================================


/** Heurística para classificar o tipo de página. */
export type PageKind = 'list'|'form'|'details'|'wizard'|'dashboard'|'report'|'dialog'|'unknown';


export function classifyPage(root: Document = document): { kind: PageKind; hints: string[]; title: string } {
const hints: string[] = [];
const hasTable = !!root.querySelector('table, [role="table"], .ag-grid, .MuiDataGrid-root');
if (hasTable) hints.push('table');
const hasForm = !!root.querySelector('form, [role="form"], input, select, textarea');
if (hasForm) hints.push('form');
const hasWizard = !!root.querySelector('[role="tablist"], .steps, .wizard, [data-step]');
if (hasWizard) hints.push('wizard');
const hasDialog = !!root.querySelector('[role="dialog"], .modal, .ant-modal, .MuiDialog-root');
if (hasDialog) hints.push('dialog');
const hasCharts = !!root.querySelector('canvas, svg .chart, [class*="chart"]');
if (hasCharts) hints.push('chart');


const title = (root.querySelector('h1,h2')?.textContent || document.title || '').trim();


if (hasDialog) return { kind: 'dialog', hints, title };
if (hasForm && hasTable) return { kind: 'wizard', hints, title };
if (hasForm) return { kind: 'form', hints, title };
if (hasTable) return { kind: 'list', hints, title };
if (hasCharts) return { kind: 'dashboard', hints, title };
return { kind: 'unknown', hints, title };
}


/** Evita ações destrutivas durante o crawl. */
const DANGEROUS = /\b(excluir|delete|remover|desativar|inativar|cancelar|encerrar|finalizar|apagar|destroy|remove)\b/i;
export function isSafeAction(el: HTMLElement): boolean {
const txt = (el.innerText || el.getAttribute('aria-label') || '').toLowerCase();
if (DANGEROUS.test(txt)) return false;
const href = (el as HTMLAnchorElement).href || '';
if (/\/delete|\/remove|\/destroy|\/close/.test(href)) return false;
return true;
}