import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderPatientCard } from '../components/patients/patient-card.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listPatients, searchPatients } from '../services/patients.service.js';
import { can } from '../services/auth-context.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateShort } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { patientDetailPage } from './patient-detail.page.js';

export function patientsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.PATIENTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');
  if (detailId) {
    return patientDetailPage(detailId);
  }

  const canCreate = can(PERMISSIONS.PATIENTS_CREATE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'patients-alert' })}
      ${renderPageHeader({
        eyebrow: 'Dominio clínico',
        title: 'Pacientes',
        description:
          'Registro clínico hospitalario. Independiente de personajes y cuentas: solo información médica.',
        actionsHtml: canCreate
          ? `<a data-link href="/patients/new" class="btn-primary !py-2.5">Registrar paciente</a>`
          : '',
      })}

      <section class="panel p-4 md:p-5">
        <form id="patients-search-form" class="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div>
            <label class="form-label" for="patients-query">Buscar paciente</label>
            <input
              id="patients-query"
              class="form-input"
              placeholder="Nombre, apellidos, documento o teléfono..."
              autocomplete="off"
            />
          </div>
          <div class="flex items-end gap-2">
            <button type="submit" class="btn-secondary">Buscar</button>
            <button type="button" id="patients-search-clear" class="btn-secondary">Limpiar</button>
          </div>
        </form>
      </section>

      <div id="patients-summary">
        ${renderSummaryStrip([
          { label: 'Pacientes', value: '—' },
          { label: 'Activos', value: '—', tone: 'success' },
          { label: 'Inactivos', value: '—', tone: 'warning' },
          { label: 'Resultados', value: '—', tone: 'brand' },
        ])}
      </div>

      <section id="patients-feed" class="record-feed">
        <p class="text-sm text-ink-400">Cargando pacientes...</p>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Pacientes', currentPath: '/patients' }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Pacientes · SAED';
      let searchTimer = null;

      const renderList = (items) => {
        const list = Array.isArray(items) ? items : [];
        const active = list.filter((item) => item.status === 'ACTIVE').length;
        const inactive = list.filter((item) => item.status !== 'ACTIVE').length;

        const summary = root.querySelector('#patients-summary');
        if (summary) {
          summary.innerHTML = renderSummaryStrip([
            { label: 'En vista', value: String(list.length) },
            { label: 'Activos', value: String(active), tone: 'success' },
            { label: 'Otros estados', value: String(inactive), tone: 'warning' },
            { label: 'Coincidencias', value: String(list.length), tone: 'brand' },
          ]);
        }

        const feed = root.querySelector('#patients-feed');
        if (!feed) return;
        feed.innerHTML = list.length
          ? list
              .map((item) =>
                renderPatientCard(item, {
                  dateLabel: formatDateShort(item.createdAt) || '—',
                }),
              )
              .join('')
          : renderEmptyState({
              title: 'Sin pacientes',
              description: 'Registra el primer paciente clínico o ajusta la búsqueda.',
              iconName: 'heartPulse',
            });
      };

      const load = async (query = '') => {
        try {
          const items = query.trim()
            ? await searchPatients({ q: query.trim() })
            : await listPatients();
          renderList(items);
        } catch (error) {
          setAuthAlert(root, {
            id: 'patients-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      void load();

      root.querySelector('#patients-search-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        void load(root.querySelector('#patients-query')?.value ?? '');
      });

      root.querySelector('#patients-query')?.addEventListener('input', (event) => {
        clearTimeout(searchTimer);
        const value = event.target.value;
        searchTimer = setTimeout(() => void load(value), 280);
      });

      root.querySelector('#patients-search-clear')?.addEventListener('click', () => {
        const input = root.querySelector('#patients-query');
        if (input) input.value = '';
        void load();
      });

      return () => {
        clearTimeout(searchTimer);
        cleanup?.();
      };
    },
  };
}
