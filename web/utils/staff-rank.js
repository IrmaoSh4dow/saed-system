/**
 * Display labels for institutional ranks.
 * System administrator rank is presented as "Directiva".
 */
const RANK_DISPLAY_LABELS = {
  administrator: 'Directiva',
  Administrador: 'Directiva',
};

export function formatStaffRankLabel(rank) {
  if (!rank) {
    return '—';
  }

  if (typeof rank === 'string') {
    return RANK_DISPLAY_LABELS[rank] ?? rank;
  }

  const slug = rank.slug ?? '';
  const name = rank.name ?? '';
  if (slug === 'administrator' || name === 'Administrador') {
    return 'Directiva';
  }

  return RANK_DISPLAY_LABELS[name] || name || '—';
}
