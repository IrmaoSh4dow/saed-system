import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { can } from '../../services/auth-context.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  getAccount,
  listAccounts,
  resetAccountPassword,
} from '../../services/accounts.service.js';
import { formatDateShort } from '../../utils/date.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

const ACCOUNT_STATUS_LABELS = {
  ACTIVE: 'Activa',
  DISABLED: 'Deshabilitada',
  BANNED: 'Bloqueada',
};

const CHARACTER_STATUS_LABELS = {
  CIVIL: 'Civil',
  CADET: 'Interno',
  INTERN: 'Interno',
  OFFICER: 'Personal médico',
  MEDICAL_STAFF: 'Personal médico',
  SUSPENDED: 'Suspendido',
  RETIRED: 'Retirado',
};

export function adminAccountsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.ACCOUNTS_MANAGE)) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');
  if (detailId) {
    return adminAccountDetailPage(detailId);
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-accounts-alert' })}
      <section class="panel p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 class="text-sm font-semibold text-white">Cuentas del sistema</h3>
            <p class="mt-1 text-xs text-ink-400">Acceso exclusivo de Administrator.</p>
          </div>
          <div class="flex w-full max-w-md gap-2">
            <input id="accounts-search" class="form-input" placeholder="Buscar usuario, email o nombre..." />
            <button type="button" id="accounts-search-btn" class="btn-secondary shrink-0">Buscar</button>
          </div>
        </div>
        <div id="accounts-table" class="mt-5 overflow-x-auto">
          <p class="text-sm text-ink-400">Cargando cuentas...</p>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Cuentas',
      currentPath: '/admin/accounts',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Cuentas');
      let query = '';

      const load = async () => {
        const host = root.querySelector('#accounts-table');
        try {
          const result = await listAccounts({ q: query, page: 1, pageSize: 50 });
          const items = result.items ?? result ?? [];
          host.innerHTML = items.length
            ? `
              <table class="w-full min-w-[640px] text-left text-sm">
                <thead class="border-b border-white/10 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th class="px-3 py-3 font-medium">Usuario</th>
                    <th class="px-3 py-3 font-medium">Email</th>
                    <th class="px-3 py-3 font-medium">Estado</th>
                    <th class="px-3 py-3 font-medium">Personajes</th>
                    <th class="px-3 py-3 font-medium">Creada</th>
                    <th class="px-3 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  ${items
                    .map(
                      (account) => `
                    <tr class="text-ink-200">
                      <td class="px-3 py-3 font-medium text-white">${escapeHtml(account.username)}</td>
                      <td class="px-3 py-3">${escapeHtml(account.email ?? '—')}</td>
                      <td class="px-3 py-3">${escapeHtml(ACCOUNT_STATUS_LABELS[account.status] ?? account.status)}</td>
                      <td class="px-3 py-3">${account.characterCount ?? 0}</td>
                      <td class="px-3 py-3">${formatDateShort(account.createdAt)}</td>
                      <td class="px-3 py-3 text-right">
                        <a data-link href="/admin/accounts?id=${account.id}" class="text-xs font-medium text-brand-300 hover:text-brand-200">Ver</a>
                      </td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
            `
            : `<p class="text-sm text-ink-400">No se encontraron cuentas.</p>`;
        } catch (error) {
          host.innerHTML = '';
          setAuthAlert(root, {
            id: 'admin-accounts-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudieron cargar las cuentas.'),
          });
        }
      };

      const runSearch = () => {
        query = root.querySelector('#accounts-search')?.value.trim() ?? '';
        void load();
      };

      root.querySelector('#accounts-search-btn')?.addEventListener('click', runSearch);
      root.querySelector('#accounts-search')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          runSearch();
        }
      });

      void load();
      return cleanup;
    },
  };
}

function adminAccountDetailPage(accountId) {
  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-account-detail-alert' })}
      <a data-link href="/admin/accounts" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver a cuentas</a>
      <div id="admin-account-root">
        <p class="text-sm text-ink-400">Cargando cuenta...</p>
      </div>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Detalle de cuenta',
      currentPath: '/admin/accounts',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Cuenta');

      const load = async () => {
        const host = root.querySelector('#admin-account-root');
        try {
          const account = await getAccount(accountId);
          document.title = `${account.username} · Cuentas · SAED`;
          host.innerHTML = renderAccountDetail(account);
          attachPasswordHandler(root, accountId, load);
        } catch (error) {
          host.innerHTML = '';
          setAuthAlert(root, {
            id: 'admin-account-detail-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo cargar la cuenta.'),
          });
        }
      };

      void load();
      return cleanup;
    },
  };
}

function renderAccountDetail(account) {
  const characters = account.characters ?? [];

  return `
    <section class="panel p-6 md:p-8">
      <p class="landing-eyebrow">Cuenta</p>
      <h3 class="mt-1 text-2xl font-semibold text-white">${escapeHtml(account.username)}</h3>
      <p class="mt-2 text-sm text-ink-300">${escapeHtml(account.displayName ?? 'Sin nombre visible')}</p>
      <dl class="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
        ${detailRow('Usuario', account.username)}
        ${detailRow('Email', account.email ?? '—')}
        ${detailRow('Estado', ACCOUNT_STATUS_LABELS[account.status] ?? account.status)}
        ${detailRow('Creada', formatDateShort(account.createdAt))}
      </dl>
    </section>

    <section class="panel p-6">
      <h3 class="text-sm font-semibold text-white">Personajes asociados</h3>
      <div class="mt-4 overflow-x-auto">
        ${
          characters.length
            ? `
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="border-b border-white/10 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-3 py-3 font-medium">Personaje</th>
                <th class="px-3 py-3 font-medium">Estado</th>
                <th class="px-3 py-3 font-medium">Rango</th>
                <th class="px-3 py-3 font-medium">Departamento</th>
                <th class="px-3 py-3 font-medium">Negocio / establecimiento</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${characters
                .map((character) => {
                  const workplace = character.workplace
                    ? `${character.workplace.organization}${
                        character.workplace.position
                          ? ` · ${character.workplace.position}`
                          : ''
                      }`
                    : '—';
                  return `
                    <tr class="text-ink-200">
                      <td class="px-3 py-3 font-medium text-white">${escapeHtml(character.firstName)} ${escapeHtml(character.lastName)}</td>
                      <td class="px-3 py-3">${escapeHtml(CHARACTER_STATUS_LABELS[character.status] ?? character.status)}</td>
                      <td class="px-3 py-3">${escapeHtml(character.rankLabel ?? '—')}</td>
                      <td class="px-3 py-3">${escapeHtml(character.departmentName ?? '—')}</td>
                      <td class="px-3 py-3">${escapeHtml(workplace)}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        `
            : `<p class="text-sm text-ink-400">Esta cuenta no tiene personajes.</p>`
        }
      </div>
    </section>

    <section class="panel p-6">
      <h3 class="text-sm font-semibold text-white">Restablecer contraseña</h3>
      <p class="mt-1 text-xs text-ink-400">La nueva contraseña se almacena con Argon2. Se invalidarán las sesiones activas.</p>
      <form id="reset-password-form" class="mt-5 grid gap-4 sm:grid-cols-2" novalidate>
        <div>
          <label class="form-label" for="reset-password">Nueva contraseña</label>
          <input id="reset-password" type="password" class="form-input" required minlength="8" autocomplete="new-password" />
        </div>
        <div>
          <label class="form-label" for="reset-password-confirm">Confirmar contraseña</label>
          <input id="reset-password-confirm" type="password" class="form-input" required minlength="8" autocomplete="new-password" />
        </div>
        <div class="sm:col-span-2">
          <button type="submit" class="btn-primary">Restablecer contraseña</button>
        </div>
      </form>
    </section>
  `;
}

function attachPasswordHandler(root, accountId, onReload) {
  root.querySelector('#reset-password-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = root.querySelector('#reset-password')?.value ?? '';
    const confirm = root.querySelector('#reset-password-confirm')?.value ?? '';

    if (password.length < 8) {
      setAuthAlert(root, {
        id: 'admin-account-detail-alert',
        type: 'error',
        message: 'La contraseña debe tener al menos 8 caracteres.',
      });
      return;
    }

    if (password !== confirm) {
      setAuthAlert(root, {
        id: 'admin-account-detail-alert',
        type: 'error',
        message: 'Las contraseñas no coinciden.',
      });
      return;
    }

    try {
      await resetAccountPassword(accountId, password);
      event.target.reset();
      setAuthAlert(root, {
        id: 'admin-account-detail-alert',
        type: 'success',
        message: 'Contraseña restablecida. Las sesiones activas fueron cerradas.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'admin-account-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error, 'No se pudo restablecer la contraseña.'),
      });
    }
  });
}

function detailRow(label, value) {
  return `
    <div class="flex justify-between gap-4 border-b border-white/5 pb-3">
      <dt class="text-ink-400">${escapeHtml(label)}</dt>
      <dd class="font-medium text-white">${escapeHtml(value)}</dd>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
