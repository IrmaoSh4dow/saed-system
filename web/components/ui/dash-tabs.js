/**
 * Segmented navigation for dashboard modules.
 * @param {{ id: string, href: string, label: string, active?: boolean }[]} tabs
 */
export function renderDashTabs(tabs = []) {
  if (!tabs.length) return '';
  return `
    <nav class="flex flex-wrap gap-2" aria-label="Secciones">
      ${tabs
        .map(
          (tab) => `
            <a
              data-link
              href="${tab.href}"
              class="dash-tab ${tab.active ? 'is-active' : ''}"
              ${tab.active ? 'aria-current="page"' : ''}
            >${tab.label}</a>
          `,
        )
        .join('')}
    </nav>
  `;
}
