const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Monthly training calendar (Google Calendar–style navigation).
 * Returns HTML + a bind() helper for month navigation and day selection.
 */
export function renderTrainingCalendar({
  events = [],
  monthDate = new Date(),
  selectedDate = null,
  canManage = false,
} = {}) {
  const view = startOfMonth(monthDate);
  const selectedKey = selectedDate ? dateKey(selectedDate) : null;
  const eventsByDay = groupEventsByDay(events);
  const cells = buildMonthCells(view);

  const selectedEvents = selectedKey ? eventsByDay.get(selectedKey) ?? [] : [];

  const html = `
    <div class="space-y-5" data-academy-calendar>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-white">Calendario de entrenamientos</h3>
          <p class="mt-1 text-xs text-ink-500">${canManage ? 'Vista administrativa RTD' : 'Confirma tu asistencia desde el detalle del día'}</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary px-3 py-2" data-cal-prev aria-label="Mes anterior">‹</button>
          <p class="min-w-[10rem] text-center text-sm font-medium text-white" data-cal-label>
            ${MONTHS[view.getMonth()]} ${view.getFullYear()}
          </p>
          <button type="button" class="btn-secondary px-3 py-2" data-cal-next aria-label="Mes siguiente">›</button>
          <button type="button" class="btn-secondary px-3 py-2 text-xs" data-cal-today>Hoy</button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-ink-500">
        ${WEEKDAYS.map((day) => `<div class="py-2">${day}</div>`).join('')}
      </div>

      <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
        ${cells
          .map((cell) => {
            if (!cell) {
              return `<div class="min-h-[4.5rem] rounded-xl border border-transparent sm:min-h-[5.5rem]"></div>`;
            }
            const key = dateKey(cell);
            const dayEvents = eventsByDay.get(key) ?? [];
            const isSelected = selectedKey === key;
            const isToday = key === dateKey(new Date());
            const hasEvents = dayEvents.length > 0;

            return `
              <button
                type="button"
                data-cal-day="${key}"
                class="group flex min-h-[4.5rem] flex-col rounded-xl border px-1.5 py-1.5 text-left transition duration-200 sm:min-h-[5.5rem] sm:px-2 sm:py-2 ${
                  isSelected
                    ? 'border-brand-500/40 bg-brand-500/15'
                    : isToday
                      ? 'border-brand-500/25 bg-white/[0.04]'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }"
              >
                <span class="text-xs font-medium ${isToday || isSelected ? 'text-brand-200' : 'text-ink-300'}">${cell.getDate()}</span>
                ${
                  hasEvents
                    ? `
                  <span class="mt-auto flex flex-wrap gap-1 pt-1">
                    ${dayEvents
                      .slice(0, 3)
                      .map(
                        () =>
                          `<span class="h-1.5 w-1.5 rounded-full bg-brand-400"></span>`,
                      )
                      .join('')}
                    ${dayEvents.length > 3 ? `<span class="text-[10px] text-ink-500">+${dayEvents.length - 3}</span>` : ''}
                  </span>
                `
                    : ''
                }
              </button>
            `;
          })
          .join('')}
      </div>

      <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-4" data-cal-day-panel>
        ${
          selectedKey
            ? renderDayPanel(selectedEvents, selectedKey, canManage)
            : `<p class="text-sm text-ink-400">Selecciona un día para ver los entrenamientos.</p>`
        }
      </div>
    </div>
  `;

  return { html, viewMonth: view, selectedKey };
}

export function bindTrainingCalendar(root, { events, canManage, onMonthChange, onSelectDay, initialMonth, initialSelected }) {
  const mount = root.querySelector('[data-calendar-host]') ?? root.querySelector('[data-academy-calendar]')?.parentElement;
  if (!mount) {
    return () => {};
  }

  let month = startOfMonth(initialMonth ?? new Date());
  let selected = initialSelected ? dateKey(initialSelected) : null;
  let calendarNode = mount.querySelector('[data-academy-calendar]');

  const repaint = () => {
    const { html } = renderTrainingCalendar({
      events,
      monthDate: month,
      selectedDate: selected ? parseDateKey(selected) : null,
      canManage,
    });
    const temp = document.createElement('div');
    temp.innerHTML = html.trim();
    const next = temp.firstElementChild;
    if (!next) return;

    if (calendarNode?.parentElement) {
      calendarNode.replaceWith(next);
    } else {
      mount.innerHTML = '';
      mount.appendChild(next);
    }
    calendarNode = next;
    attach(calendarNode);
  };

  const attach = (node) => {
    if (!node) return;
    node.querySelector('[data-cal-prev]')?.addEventListener('click', () => {
      month = addMonths(month, -1);
      onMonthChange?.(month);
      repaint();
    });
    node.querySelector('[data-cal-next]')?.addEventListener('click', () => {
      month = addMonths(month, 1);
      onMonthChange?.(month);
      repaint();
    });
    node.querySelector('[data-cal-today]')?.addEventListener('click', () => {
      month = startOfMonth(new Date());
      selected = dateKey(new Date());
      onMonthChange?.(month);
      onSelectDay?.(selected);
      repaint();
    });
    node.querySelectorAll('[data-cal-day]').forEach((button) => {
      button.addEventListener('click', () => {
        selected = button.getAttribute('data-cal-day');
        onSelectDay?.(selected);
        repaint();
      });
    });
  };

  attach(calendarNode);
  return () => {};
}

function renderDayPanel(events, dayKey, canManage) {
  const label = formatDayLabel(parseDateKey(dayKey));
  if (!events.length) {
    return `
      <p class="text-sm font-medium text-white">${label}</p>
      <p class="mt-2 text-sm text-ink-400">Sin entrenamientos este día.</p>
    `;
  }

  return `
    <p class="text-sm font-medium text-white">${label}</p>
    <ul class="mt-3 space-y-2">
      ${events
        .map((item) => {
          const attendance = item.myAttendance;
          const attendanceLabel =
            attendance?.status === 'CONFIRMED'
              ? '✔ Asistencia confirmada'
              : attendance?.status === 'DECLINED'
                ? '✗ No asistirá'
                : '○ Pendiente de confirmar';

          return `
            <li>
              <a
                data-link
                href="/academy?trainingId=${item.id}"
                class="block rounded-xl border border-white/10 px-3 py-3 transition hover:bg-white/[0.04]"
              >
                <p class="text-sm font-medium text-white">● ${escapeHtml(item.title)}</p>
                <p class="mt-1 text-xs text-ink-400">${formatTime(item.startsAt)} · ${escapeHtml(item.location)}</p>
                ${
                  canManage
                    ? `<p class="mt-1 text-xs text-brand-300">Abrir / editar entrenamiento</p>`
                    : `<p class="mt-1 text-xs ${attendance?.status === 'CONFIRMED' ? 'text-emerald-300' : attendance?.status === 'DECLINED' ? 'text-rose-300' : 'text-amber-200'}">${attendanceLabel}</p>`
                }
              </a>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function groupEventsByDay(events) {
  const map = new Map();
  for (const item of events) {
    const key = dateKey(new Date(item.startsAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }
  return map;
}

function buildMonthCells(view) {
  const first = startOfMonth(view);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function startOfMonth(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(value, delta) {
  return new Date(value.getFullYear(), value.getMonth() + delta, 1);
}

export function dateKey(value) {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDayLabel(date) {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
