function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Interactive or read-only star rating (1–5).
 */
export function renderStarRating({
  id = 'star-rating',
  value = 0,
  interactive = false,
  size = 'md',
  label = 'Calificación',
} = {}) {
  const sizeClass = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  const stars = [1, 2, 3, 4, 5]
    .map((score) => {
      const active = score <= Number(value);
      if (!interactive) {
        return `
          <span class="${sizeClass} inline-flex items-center justify-center ${
            active ? 'text-amber-300' : 'text-ink-600'
          }" aria-hidden="true">★</span>
        `;
      }
      return `
        <button
          type="button"
          data-star="${score}"
          data-star-group="${escapeHtml(id)}"
          class="${sizeClass} inline-flex items-center justify-center rounded-md transition duration-150 ${
            active ? 'text-amber-300 scale-105' : 'text-ink-600 hover:text-amber-200'
          }"
          aria-label="${score} estrella${score === 1 ? '' : 's'}"
        >★</button>
      `;
    })
    .join('');

  return `
    <div data-star-rating="${escapeHtml(id)}" class="space-y-2">
      ${label ? `<p class="text-xs font-medium uppercase tracking-wide text-ink-500">${escapeHtml(label)}</p>` : ''}
      <div class="flex items-center gap-1" role="${interactive ? 'radiogroup' : 'img'}" aria-label="${escapeHtml(label || 'Calificación')}">
        ${stars}
      </div>
      ${
        interactive
          ? `<input type="hidden" id="${escapeHtml(id)}" name="${escapeHtml(id)}" value="${escapeHtml(String(value || ''))}" />`
          : ''
      }
    </div>
  `;
}

export function bindStarRating(root, id, { onChange } = {}) {
  const host = root.querySelector(`[data-star-rating="${id}"]`);
  const input = root.querySelector(`#${CSS.escape(id)}`);
  if (!host || !input) return () => {};

  const paint = (score) => {
    input.value = String(score);
    host.querySelectorAll('[data-star]').forEach((button) => {
      const value = Number(button.getAttribute('data-star'));
      const active = value <= score;
      button.className = `${button.className.includes('h-8') ? 'h-8 w-8' : button.className.includes('h-4') ? 'h-4 w-4' : 'h-6 w-6'} inline-flex items-center justify-center rounded-md transition duration-150 ${
        active ? 'text-amber-300 scale-105' : 'text-ink-600 hover:text-amber-200'
      }`;
    });
    onChange?.(score);
  };

  const handlers = [];
  host.querySelectorAll('[data-star]').forEach((button) => {
    const handler = () => paint(Number(button.getAttribute('data-star')));
    button.addEventListener('click', handler);
    handlers.push([button, handler]);
  });

  return () => {
    handlers.forEach(([button, handler]) => button.removeEventListener('click', handler));
  };
}

export function renderAverageStars(average, total) {
  const value = average == null ? 0 : Number(average);
  return `
    <div class="flex flex-wrap items-center gap-3">
      ${renderStarRating({ value: Math.round(value), interactive: false, size: 'md', label: '' })}
      <div>
        <p class="text-2xl font-semibold text-white">${average == null ? '—' : value.toFixed(1)}</p>
        <p class="text-xs text-ink-500">${total ?? 0} valoración${Number(total) === 1 ? '' : 'es'}</p>
      </div>
    </div>
  `;
}
