import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import { searchCharacters } from '../../services/characters.service.js';
import { getCharacterRoles, listRoles, setCharacterRoles } from '../../services/roles.service.js';
import { can } from '../../services/auth-context.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { navigate } from '../../utils/router.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

export function adminRolesPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.ROLES_ASSIGN) && !can(PERMISSIONS.ROLES_READ) && !can('*')) {
    void navigate('/admin', { replace: true });
    return { html: '', afterMount: () => {} };
  }

  const canAssign = can(PERMISSIONS.ROLES_ASSIGN) || can('*');

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-roles-alert' })}

      <section class="surface-card p-6">
        <h3 class="text-sm font-semibold text-white">Asignar roles (RBAC)</h3>
        <p class="mt-1 text-xs leading-relaxed text-ink-400">
          <span class="text-ink-200">Rank</span> = jerarquía (Medical Director).<br />
          <span class="text-ink-200">Role</span> = permisos del sistema (<code class="text-brand-300">chief</code>, <code class="text-brand-300">administrator</code>).<br />
          Sin Role administrativo, el menú Admin no aparece aunque el Rank sea Chief.
        </p>

        <div class="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input id="role-character-query" class="form-input" placeholder="Buscar personaje por nombre..." />
          <button type="button" id="role-character-search" class="btn-secondary">Buscar</button>
        </div>
        <div id="role-character-results" class="mt-4 space-y-2"></div>

        <form id="assign-roles-form" class="mt-6 hidden space-y-4 border-t border-white/10 pt-6">
          <input type="hidden" id="assign-character-id" />
          <p id="assign-character-label" class="text-sm text-ink-300"></p>
          <p id="assign-current-roles" class="text-xs text-ink-500"></p>
          <div id="roles-checkboxes" class="grid gap-2 sm:grid-cols-2"></div>
          ${
            canAssign
              ? `<button type="submit" class="btn-primary">Guardar roles</button>
                 <p class="text-xs text-ink-500">Después de guardar, vuelve a seleccionar el personaje para refrescar permisos del JWT.</p>`
              : `<p class="text-sm text-amber-300">Solo lectura: necesitas roles.assign</p>`
          }
        </form>
      </section>

      <section class="surface-card p-6">
        <h3 class="text-sm font-semibold text-white">Roles del sistema</h3>
        <div id="roles-catalog" class="mt-4 space-y-3"></div>
      </section>
    </div>
  `;

  return {
    html: renderAdminShell(content, { title: 'Roles y autorización', currentPath: '/admin/roles' }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Roles');
      let catalog = [];

      const loadCatalog = async () => {
        catalog = await listRoles();
        const host = root.querySelector('#roles-catalog');
        host.innerHTML = catalog
          .map((role) => {
            const keys = (role.permissions ?? [])
              .map((item) => item.permission?.key)
              .filter(Boolean)
              .slice(0, 8);
            return `
              <article class="rounded-xl border border-white/10 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-medium text-white">${role.name} <span class="text-xs text-ink-500">(${role.slug})</span></p>
                  <span class="text-xs text-ink-400">${role._count?.characters ?? 0} personajes</span>
                </div>
                <p class="mt-2 text-xs text-ink-400">${keys.join(', ') || 'Sin permisos listados'}${keys.length >= 8 ? '…' : ''}</p>
              </article>
            `;
          })
          .join('');

        const boxes = root.querySelector('#roles-checkboxes');
        boxes.innerHTML = catalog
          .map(
            (role) => `
              <label class="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-ink-200">
                <input type="checkbox" name="roleSlug" value="${role.slug}" class="rounded border-white/20 bg-surface-950 text-brand-500" ${canAssign ? '' : 'disabled'} />
                ${role.name}
              </label>
            `,
          )
          .join('');
      };

      const onSearch = async () => {
        const query = root.querySelector('#role-character-query')?.value?.trim() ?? '';
        const host = root.querySelector('#role-character-results');
        try {
          const results = await searchCharacters(query);
          host.innerHTML = results.length
            ? results
                .map(
                  (item) => `
                    <button type="button" class="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left hover:bg-white/[0.04]" data-pick-role-character="${item.id}" data-pick-name="${item.firstName} ${item.lastName}">
                      <span>
                        <span class="block text-sm text-white">${item.firstName} ${item.lastName}</span>
                        <span class="block text-[11px] text-ink-500">${(item.roles ?? []).join(', ') || 'sin roles'}</span>
                      </span>
                      <span class="text-xs text-ink-400">${item.status}</span>
                    </button>
                  `,
                )
                .join('')
            : `<p class="text-sm text-ink-400">Sin resultados</p>`;
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-roles-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const pickCharacter = async (characterId, name) => {
        root.querySelector('#assign-character-id').value = characterId;
        root.querySelector('#assign-character-label').textContent = `Personaje: ${name}`;
        root.querySelector('#assign-roles-form')?.classList.remove('hidden');

        try {
          const current = await getCharacterRoles(characterId);
          const slugs = new Set((current.roles ?? []).map((item) => item.slug));
          root.querySelector('#assign-current-roles').textContent =
            `Roles actuales: ${[...slugs].join(', ') || 'ninguno'}`;
          root.querySelectorAll('input[name="roleSlug"]').forEach((input) => {
            input.checked = slugs.has(input.value);
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-roles-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const onClick = (event) => {
        const pick = event.target.closest('[data-pick-role-character]');
        if (pick) {
          void pickCharacter(
            pick.getAttribute('data-pick-role-character'),
            pick.getAttribute('data-pick-name'),
          );
        }
      };

      const onSubmit = async (event) => {
        event.preventDefault();
        if (!canAssign) return;

        const characterId = root.querySelector('#assign-character-id').value;
        const roleSlugs = [...root.querySelectorAll('input[name="roleSlug"]:checked')].map(
          (input) => input.value,
        );

        try {
          await setCharacterRoles(characterId, roleSlugs);
          setAuthAlert(root, {
            id: 'admin-roles-alert',
            type: 'success',
            message:
              'Roles actualizados. Vuelve a seleccionar el personaje para refrescar permisos.',
          });
          await pickCharacter(
            characterId,
            root.querySelector('#assign-character-label').textContent.replace('Personaje: ', ''),
          );
          await loadCatalog();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-roles-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      root.querySelector('#role-character-search')?.addEventListener('click', onSearch);
      root.addEventListener('click', onClick);
      root.querySelector('#assign-roles-form')?.addEventListener('submit', onSubmit);
      void loadCatalog().catch((error) =>
        setAuthAlert(root, {
          id: 'admin-roles-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        }),
      );

      return () => {
        cleanup?.();
        root.querySelector('#role-character-search')?.removeEventListener('click', onSearch);
        root.removeEventListener('click', onClick);
        root.querySelector('#assign-roles-form')?.removeEventListener('submit', onSubmit);
      };
    },
  };
}
