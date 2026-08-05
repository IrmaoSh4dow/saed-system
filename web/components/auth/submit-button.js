import { icon } from '../landing/icons.js';

export function renderSubmitButton({
  id = 'auth-submit',
  label = 'Continuar',
  loadingLabel = 'Procesando...',
} = {}) {
  return `
    <button
      type="submit"
      id="${id}"
      class="btn-primary w-full"
      data-label="${label}"
      data-loading-label="${loadingLabel}"
    >
      <span data-button-content class="inline-flex items-center gap-2">
        ${label}
      </span>
    </button>
  `;
}

export function setButtonLoading(button, isLoading) {
  if (!button) {
    return;
  }

  const label = button.getAttribute('data-label') ?? 'Continuar';
  const loadingLabel = button.getAttribute('data-loading-label') ?? 'Procesando...';
  const content = button.querySelector('[data-button-content]');

  button.disabled = isLoading;

  if (!content) {
    return;
  }

  content.innerHTML = isLoading
    ? `${icon('spinner', 'h-4 w-4 spin')}<span>${loadingLabel}</span>`
    : label;
}
