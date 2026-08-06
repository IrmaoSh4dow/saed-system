/**
 * Filter toolbar shell for dashboard modules.
 * @param {{ bodyHtml: string, className?: string }} options
 */
export function renderFilterShell({ bodyHtml = '', className = '' } = {}) {
  return `
    <section class="filter-shell ${className}">
      ${bodyHtml}
    </section>
  `;
}
