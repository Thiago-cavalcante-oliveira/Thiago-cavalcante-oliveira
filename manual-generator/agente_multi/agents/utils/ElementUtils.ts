export function generateSelector(element: Element): string {
  if (element.id) return `#${element.id}`;
  
  const tagName = element.tagName.toLowerCase();
  const parent = element.parentElement;
  
  if (parent) {
    const siblings = Array.from(parent.children).filter(child => 
      child.tagName === element.tagName
    );
    
    if (siblings.length === 1) {
      return tagName;
    }
    
    const siblingIndex = siblings.indexOf(element) + 1;
    return `${tagName}:nth-of-type(${siblingIndex})`;
  }
  
  return tagName;
}

export function getWorkflowContext(element: Element): string | undefined {
  const form = element.closest('form');
  if (form) {
    const formId = form.id || 'form';
    const formAction = form.getAttribute('action') || 'submit';
    return `${formId}-${formAction}`;
  }
  
  const modal = element.closest('[role="dialog"], .modal, .popup');
  if (modal) {
    return `modal-${modal.id || 'interaction'}`;
  }
  
  return undefined;
}

export function isPartOfGroup(element: Element, groupSelector: string): boolean {
  const group = element.closest(groupSelector);
  return !!group;
}

export function determineLocation(element: Element): string {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  if (rect.top < viewportHeight / 3) return 'header';
  if (rect.top > viewportHeight * 2/3) return 'footer';
  if (rect.left < viewportWidth / 4) return 'left-sidebar';
  if (rect.left > viewportWidth * 3/4) return 'right-sidebar';
  return 'main-content';
}

export function findRelatedElements(element: Element, type: string): Array<{
  type: string;
  relationship: string;
  dependent: boolean;
  selector: string;
}> {
  const related = [];

  if (type === 'input') {
    const inputId = element.getAttribute('id');
    if (inputId) {
      const label = document.querySelector(`label[for="${inputId}"]`);
      if (label) {
        related.push({
          type: 'label',
          relationship: 'describes',
          dependent: true,
          selector: `label[for="${inputId}"]`
        });
      }
    }
    
    const validationMessage = element.getAttribute('aria-errormessage');
    if (validationMessage) {
      const messageElement = document.getElementById(validationMessage);
      if (messageElement) {
        related.push({
          type: 'validation',
          relationship: 'validates',
          dependent: true,
          selector: `#${validationMessage}`
        });
      }
    }
  }

  if (type === 'submit') {
    const form = element.closest('form');
    if (form) {
      const inputs = Array.from(form.querySelectorAll('input:not([type="submit"]), select, textarea'));
      inputs.forEach(input => {
        related.push({
          type: input.tagName.toLowerCase(),
          relationship: 'submits',
          dependent: false,
          selector: generateSelector(input)
        });
      });
    }
  }

  return related;
}
