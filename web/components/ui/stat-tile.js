import { icon } from '../landing/icons.js';

export function renderStatTile({
  label = '',
  value = '—',
  hint = '',
  iconName = '',
  tone = 'default',
} = {}) {
  const toneClass =
    {
      default: 'stat-tile',
      brand: 'stat-tile stat-tile-brand',
      warning: 'stat-tile stat-tile-warning',
    }[tone] ?? 'stat-tile';

  return `
    <article class="${toneClass}">
      <div class="flex items-start justify-between gap-3">
        <p class="stat-tile-label">${label}</p>
        ${
          iconName
            ? `<span class="stat-tile-icon">${icon(iconName, 'h-4 w-4')}</span>`
            : ''
        }
      </div>
      <p class="stat-tile-value">${value}</p>
      ${hint ? `<p class="stat-tile-hint">${hint}</p>` : ''}
    </article>
  `;
}
