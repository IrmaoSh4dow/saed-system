import { renderPrimaryDepartmentBadge } from './officer-departments-section.js';

/**
 * Fixed-size primary department identity badge.
 * Never shows alternate departments.
 * @param {{ name?: string | null, imageUrl?: string | null, role?: string | null, className?: string }} options
 */
export function renderStaffDepartmentPanel({ name, imageUrl, role, className = '' } = {}) {
  return renderPrimaryDepartmentBadge({ name, imageUrl, role, className });
}
