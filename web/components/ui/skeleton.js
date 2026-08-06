export function renderSkeleton({ rows = 3, className = '' } = {}) {
  return `
    <div class="skeleton-stack ${className}" aria-hidden="true">
      ${Array.from({ length: rows }, () => `<div class="skeleton-line"></div>`).join('')}
    </div>
  `;
}

export function renderSkeletonCards({ count = 3 } = {}) {
  return `
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      ${Array.from({ length: count }, () => `<div class="skeleton-card"></div>`).join('')}
    </div>
  `;
}
