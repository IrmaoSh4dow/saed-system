/**
 * Compact metric strip for module headers.
 * @param {{ label: string, value: string|number, tone?: 'default'|'brand'|'warning'|'danger' }[]} items
 */
export function renderSummaryStrip(items = []) {
  if (!items.length) return '';
  return `
    <section class="summary-strip">
      ${items
        .map((item) => {
          const tone = ['brand', 'warning', 'danger'].includes(item.tone)
            ? item.tone
            : 'default';
          return `
            <article class="summary-chip summary-chip-${tone}">
              <p class="summary-chip-label">${item.label}</p>
              <p class="summary-chip-value">${item.value}</p>
            </article>
          `;
        })
        .join('')}
    </section>
  `;
}
