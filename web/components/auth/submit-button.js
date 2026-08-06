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
      class="btn-primary auth-submit w-full"
      data-label="${label}"
      data-loading-label="${loadingLabel}"
    >
      <span data-button-content class="inline-flex items-center justify-center gap-2">
        <span data-button-label>${label}</span>
        <span data-button-arrow class="auth-submit-arrow" aria-hidden="true">
          ${icon('arrowRight', 'h-4 w-4')}
        </span>
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
  button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  button.classList.toggle('is-loading', isLoading);

  if (!content) {
    return;
  }

  content.innerHTML = isLoading
    ? `${icon('spinner', 'h-4 w-4 spin')}<span>${loadingLabel}</span>`
    : `<span data-button-label>${label}</span><span data-button-arrow class="auth-submit-arrow" aria-hidden="true">${icon('arrowRight', 'h-4 w-4')}</span>`;
}
