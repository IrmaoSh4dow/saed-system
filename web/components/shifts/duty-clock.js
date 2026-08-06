import { formatShiftDuration } from '../../services/shifts.service.js';

/**
 * Live local clock + elapsed duty timer.
 */
export function renderDutyClockPanel({
  isOnDuty = false,
  startedAt = null,
  localTimeId = 'duty-local-time',
  elapsedId = 'duty-elapsed-time',
} = {}) {
  return `
    <div class="grid gap-3 sm:grid-cols-2">
      <article class="summary-chip summary-chip-default">
        <p class="summary-chip-label">Hora local</p>
        <p id="${localTimeId}" class="summary-chip-value font-mono tracking-wider">--:--:--</p>
      </article>
      <article class="summary-chip ${isOnDuty ? 'summary-chip-brand' : 'summary-chip-default'}">
        <p class="summary-chip-label">${isOnDuty ? 'Tiempo en servicio' : 'Estado'}</p>
        <p id="${elapsedId}" class="summary-chip-value font-mono tracking-wider" data-started-at="${startedAt ?? ''}">
          ${isOnDuty ? '00:00:00' : 'Fuera de servicio'}
        </p>
      </article>
    </div>
  `;
}

export function bindDutyClocks(root, { localTimeId = 'duty-local-time', elapsedId = 'duty-elapsed-time' } = {}) {
  const localNode = root.querySelector(`#${localTimeId}`);
  const elapsedNode = root.querySelector(`#${elapsedId}`);

  const tick = () => {
    const now = new Date();
    if (localNode) {
      localNode.textContent = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }

    if (elapsedNode) {
      const startedAt = elapsedNode.getAttribute('data-started-at');
      if (startedAt) {
        const started = new Date(startedAt);
        const seconds = Math.max(0, Math.floor((now.getTime() - started.getTime()) / 1000));
        elapsedNode.textContent = formatShiftDuration(seconds);
      }
    }
  };

  tick();
  const timer = window.setInterval(tick, 1000);
  return () => window.clearInterval(timer);
}
