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
  const monthEventCount = events.filter((item) => {
    const date = new Date(item.startsAt);
    return date.getMonth() === view.getMonth() && date.getFullYear() === view.getFullYear();
  }).length;

  const html = `
    <div class="cal-shell" data-academy-calendar>
      <div class="cal-toolbar">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">Agenda académica</p>
          <h3 class="mt-1 text-lg font-semibold text-white">Calendario de entrenamientos</h3>
          <p class="mt-1 text-xs text-ink-500">
            ${monthEventCount} evento${monthEventCount === 1 ? '' : 's'} este mes
            · ${canManage ? 'Vista administrativa' : 'Confirma asistencia desde el día'}
          </p>
        </div>
        <div class="cal-nav">
          <button type="button" class="cal-nav-btn" data-cal-prev aria-label="Mes anterior">‹</button>
          <p class="min-w-[10.5rem] text-center text-sm font-semibold text-white" data-cal-label>
            ${MONTHS[view.getMonth()]} ${view.getFullYear()}
          </p>
          <button type="button" class="cal-nav-btn" data-cal-next aria-label="Mes siguiente">›</button>
          <button type="button" class="cal-nav-btn" data-cal-today>Hoy</button>
        </div>
      </div>

      <div class="cal-grid-head">
        ${WEEKDAYS.map((day) => `<div class="cal-weekday">${day}</div>`).join('')}
      </div>

      <div class="cal-grid">
        ${cells
          .map((cell) => {
            if (!cell) {
              return `<div class="min-h-[4.75rem] rounded-2xl border border-transparent sm:min-h-[5.75rem]"></div>`;
            }
            const key = dateKey(cell);
            const dayEvents = eventsByDay.get(key) ?? [];
            const isSelected = selectedKey === key;
            const isToday = key === dateKey(new Date());
            const hasEvents = dayEvents.length > 0;
            const classes = [
              'cal-day',
              isToday ? 'is-today' : '',
              isSelected ? 'is-selected' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return `
              <button type="button" data-cal-day="${key}" class="${classes}">
                <span class="cal-day-number">${cell.getDate()}</span>
                ${
                  hasEvents
                    ? `
                  <span class="cal-day-dots">
                    ${dayEvents
                      .slice(0, 3)
                      .map(() => `<span class="cal-dot"></span>`)
                      .join('')}
                    ${
                      dayEvents.length > 3
                        ? `<span class="text-[10px] text-ink-500">+${dayEvents.length - 3}</span>`
                        : ''
                    }
                  </span>
                  <span class="mt-1 hidden truncate text-[10px] text-ink-400 sm:block">${escapeHtml(dayEvents[0].title)}</span>
                `
                    : ''
                }
              </button>
            `;
          })
          .join('')}
      </div>

      <div class="cal-day-panel" data-cal-day-panel>
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

export function bindTrainingCalendar(
  root,
  { events, canManage, onMonthChange, onSelectDay, initialMonth, initialSelected },
) {
  const mount =
    root.querySelector('[data-calendar-host]') ??
    root.querySelector('[data-academy-calendar]')?.parentElement;
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
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-white">${label}</p>
          <p class="mt-1 text-sm text-ink-400">Sin entrenamientos este día.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-white">${label}</p>
        <p class="mt-1 text-xs text-ink-500">${events.length} entrenamiento${events.length === 1 ? '' : 's'}</p>
      </div>
    </div>
    <ul class="mt-4 space-y-2">
      ${events
        .map((item) => {
          const attendance = item.myAttendance;
          const attendanceLabel =
            attendance?.status === 'CONFIRMED'
              ? 'Asistencia confirmada'
              : attendance?.status === 'DECLINED'
                ? 'No asistirá'
                : 'Pendiente de confirmar';
          const attendanceClass =
            attendance?.status === 'CONFIRMED'
              ? 'text-brand-300'
              : attendance?.status === 'DECLINED'
                ? 'text-rose-300'
                : 'text-amber-200';

          return `
            <li>
              <a data-link href="/academy?trainingId=${item.id}" class="cal-event">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <p class="text-sm font-medium text-white">${escapeHtml(item.title)}</p>
                  <span class="text-[11px] font-semibold uppercase tracking-wide text-brand-400">${formatTime(item.startsAt)}</span>
                </div>
                <p class="mt-1 text-xs text-ink-400">${escapeHtml(item.location)}</p>
                ${
                  canManage
                    ? `<p class="mt-2 text-xs text-brand-300">Abrir / editar entrenamiento</p>`
                    : `<p class="mt-2 text-xs ${attendanceClass}">${attendanceLabel}</p>`
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
