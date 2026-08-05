import { icon } from '../landing/icons.js';

export function renderAuthAlert({ type = 'info', message = '', id = 'auth-alert' } = {}) {
  if (!message) {
    return `<div id="${id}" class="hidden" role="status" aria-live="polite"></div>`;
  }

  const styles = {
    error: 'auth-alert-error',
    success: 'auth-alert-success',
    info: 'auth-alert-info',
  };

  const icons = {
    error: 'alert',
    success: 'check',
    info: 'bolt',
  };

  return `
    <div id="${id}" class="auth-alert ${styles[type] ?? styles.info}" role="status" aria-live="polite">
      <span class="mt-0.5 shrink-0">${icon(icons[type] ?? 'bolt', 'h-4 w-4')}</span>
      <p>${message}</p>
    </div>
  `;
}

export function setAuthAlert(root, { type = 'info', message = '', id = 'auth-alert' } = {}) {
  const host = root.querySelector(`#${id}`);
  if (!host) {
    return;
  }

  if (!message) {
    host.className = 'hidden';
    host.innerHTML = '';
    return;
  }

  host.outerHTML = renderAuthAlert({ type, message, id });
}
