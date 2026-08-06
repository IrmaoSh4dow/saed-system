import {
  MEDICAL_LEAVE_STATUS_LABELS,
  PSYCHOTECHNICAL_RESULT_LABELS,
  PSYCHOTECHNICAL_VALIDITY_LABELS,
} from '../../services/occupational-health.service.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function psychotechnicalTone(result, validity) {
  if (!result || validity === 'NONE') {
    return 'neutral';
  }
  if (validity === 'EXPIRED') {
    return 'danger';
  }
  if (validity === 'EXPIRING_SOON') {
    return 'warn';
  }
  if (result === 'UNFIT') {
    return 'danger';
  }
  if (result === 'FIT_WITH_OBSERVATIONS') {
    return 'warn';
  }
  return 'success';
}

export function renderTonePill(label, tone = 'neutral') {
  const classes = {
    success: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200',
    warn: 'border-amber-400/35 bg-amber-500/15 text-amber-100',
    danger: 'border-rose-400/40 bg-rose-500/15 text-rose-200',
    neutral: 'border-white/15 bg-white/[0.04] text-ink-300',
  };
  return `<span class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${classes[tone] ?? classes.neutral}">${escapeHtml(label)}</span>`;
}

export function renderPsychotechnicalBadge(evaluation) {
  if (!evaluation) {
    return renderTonePill(PSYCHOTECHNICAL_VALIDITY_LABELS.NONE, 'neutral');
  }
  const tone = psychotechnicalTone(evaluation.result, evaluation.validity);
  const label =
    evaluation.validity === 'EXPIRED'
      ? `${PSYCHOTECHNICAL_RESULT_LABELS[evaluation.result] ?? evaluation.result} · Vencido`
      : evaluation.validity === 'EXPIRING_SOON'
        ? `${PSYCHOTECHNICAL_RESULT_LABELS[evaluation.result] ?? evaluation.result} · Por vencer`
        : PSYCHOTECHNICAL_RESULT_LABELS[evaluation.result] ?? evaluation.resultLabel ?? evaluation.result;
  return renderTonePill(label, tone);
}

export function renderMedicalLeaveBadge(leave) {
  if (!leave || !leave.isCurrentlyActive) {
    return renderTonePill('Sin baja médica', 'neutral');
  }
  return renderTonePill(
    MEDICAL_LEAVE_STATUS_LABELS[leave.status] ?? leave.statusLabel ?? 'Activa',
    'danger',
  );
}

export function renderInteropIndicators(item) {
  const psycho = item.psychotechnical ?? {};
  const leave = item.medicalLeave ?? {};
  const psychoTone = psychotechnicalTone(psycho.result, psycho.validity);
  const psychoLabel = !psycho.hasPsychotechnical
    ? 'Sin psicotécnico'
    : psycho.isExpired
      ? `${PSYCHOTECHNICAL_RESULT_LABELS[psycho.result] ?? psycho.result} · Vencido`
      : psycho.isExpiringSoon
        ? `${PSYCHOTECHNICAL_RESULT_LABELS[psycho.result] ?? psycho.result} · Por vencer`
        : PSYCHOTECHNICAL_RESULT_LABELS[psycho.result] ?? psycho.result;

  return `
    <div class="flex flex-wrap gap-2">
      ${renderTonePill(psychoLabel, psychoTone)}
      ${
        leave.hasActiveLeave
          ? renderTonePill('Baja médica activa', 'danger')
          : renderTonePill('Sin baja médica', 'success')
      }
    </div>
  `;
}
