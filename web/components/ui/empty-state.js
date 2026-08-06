import { icon } from '../landing/icons.js';

export function renderEmptyState({
  title = 'Sin resultados',
  description = '',
  iconName = 'search',
  actionHtml = '',
} = {}) {
  return `
    <div class="empty-state">
      <span class="empty-state-icon">${icon(iconName, 'h-6 w-6')}</span>
      <h3 class="empty-state-title">${title}</h3>
      ${description ? `<p class="empty-state-description">${description}</p>` : ''}
      ${actionHtml ? `<div class="mt-5">${actionHtml}</div>` : ''}
    </div>
  `;
}
