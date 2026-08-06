export function renderPageHeader({
  eyebrow = '',
  title = '',
  description = '',
  actionsHtml = '',
} = {}) {
  return `
    <header class="page-header mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        ${eyebrow ? `<p class="page-eyebrow">${eyebrow}</p>` : ''}
        <h2 class="page-title">${title}</h2>
        ${description ? `<p class="page-description">${description}</p>` : ''}
      </div>
      ${actionsHtml ? `<div class="flex shrink-0 flex-wrap items-center gap-3">${actionsHtml}</div>` : ''}
    </header>
  `;
}
