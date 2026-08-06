import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import {
  bindAppModal,
  closeAppModal,
  openAppModal,
  renderAppModal,
  setAppModalContent,
} from '../../components/ui/modal.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../../services/departments.service.js';
import { can } from '../../services/auth-context.js';
import { getApiBaseUrl } from '../../utils/env.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function adminDepartmentsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const canCreate = can(PERMISSIONS.DEPARTMENTS_CREATE) || can(PERMISSIONS.DEPARTMENTS_MANAGE);
  const canUpdate = can(PERMISSIONS.DEPARTMENTS_UPDATE) || can(PERMISSIONS.DEPARTMENTS_MANAGE);
  const canDelete = can(PERMISSIONS.DEPARTMENTS_MANAGE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-departments-alert' })}
      ${
        canCreate
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Crear departamento</h3>
          <form id="create-department-form" class="mt-4 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="department-name">Nombre</label>
                <input id="department-name" class="form-input" required />
              </div>
              <div>
                <label class="form-label" for="department-image">Logo / imagen</label>
                <input id="department-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-input" />
                <p class="form-hint">JPG, PNG, WebP o GIF · máximo 8 MB</p>
              </div>
            </div>
            <div>
              <label class="form-label" for="department-description">Descripción</label>
              <textarea id="department-description" class="form-input min-h-[88px]"></textarea>
            </div>
            <button type="submit" class="btn-primary">Crear departamento</button>
          </form>
        </section>
      `
          : ''
      }
      <section class="grid gap-4 md:grid-cols-2" id="departments-grid"></section>
      ${renderAppModal({
        id: 'department-edit-modal',
        title: 'Editar departamento',
        size: 'md',
        bodyHtml: '<p class="text-sm text-ink-400">Cargando…</p>',
      })}
      ${renderAppModal({
        id: 'department-delete-modal',
        title: 'Eliminar departamento',
        size: 'md',
        bodyHtml: '<p class="text-sm text-ink-400">Cargando…</p>',
      })}
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Gestión de departamentos',
      currentPath: '/admin/departments',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Departamentos');
      const unbindEditModal = bindAppModal(root, { modalId: 'department-edit-modal' });
      const unbindDeleteModal = bindAppModal(root, { modalId: 'department-delete-modal' });
      let imageDataUrl = null;
      let departmentsCache = [];

      const load = async () => {
        try {
          const departments = await listDepartments('admin');
          departmentsCache = departments;
          const grid = root.querySelector('#departments-grid');
          grid.innerHTML = departments
            .map((department) => {
              const image = resolveUploadUrl(department.imageUrl);
              return `
                <article class="panel overflow-hidden">
                  <div class="h-28 w-full overflow-hidden bg-surface-950">
                    ${
                      image
                        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(department.name)}" class="h-full w-full object-contain p-4" />`
                        : `<div class="flex h-full items-center justify-center text-sm text-ink-500">Sin logo</div>`
                    }
                  </div>
                  <div class="p-5">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h3 class="font-semibold text-white">${escapeHtml(department.name)}</h3>
                        <p class="mt-1 text-xs text-ink-400">${escapeHtml(department.slug)}</p>
                      </div>
                      <span class="text-xs text-ink-400">${department._count?.staffProfiles ?? 0} personal · ${department._count?.supervisors ?? 0} encargados</span>
                    </div>
                    <p class="mt-3 text-sm text-ink-300">${escapeHtml(department.description ?? 'Sin descripción')}</p>
                    <p class="mt-2 text-xs ${department.isActive ? 'text-emerald-300' : 'text-amber-300'}">
                      ${department.isActive ? 'Activo' : 'Inactivo'}
                    </p>
                    <div class="mt-4 flex flex-wrap gap-3">
                      <a data-link href="/departments?id=${department.id}" class="text-xs font-medium text-brand-300 hover:text-brand-200">Ver ficha</a>
                      ${
                        canUpdate
                          ? `
                            <button type="button" class="text-xs font-medium text-brand-300 hover:text-brand-200" data-edit-department="${department.id}">
                              Editar
                            </button>
                            <label class="text-xs font-medium text-brand-300 cursor-pointer hover:text-brand-200">
                              Cambiar logo
                              <input type="file" accept="image/*" class="hidden" data-upload-department="${department.id}" />
                            </label>
                            <button type="button" class="text-xs font-medium text-brand-300 hover:text-brand-200" data-toggle-department="${department.id}" data-active="${department.isActive}">
                              ${department.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                          `
                          : ''
                      }
                      ${
                        canDelete
                          ? `
                            <button type="button" class="text-xs font-medium text-rose-300 hover:text-rose-200" data-delete-department="${department.id}">
                              Eliminar
                            </button>
                          `
                          : ''
                      }
                    </div>
                  </div>
                </article>
              `;
            })
            .join('');
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-departments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const openEditModal = (departmentId) => {
        const department = departmentsCache.find((item) => item.id === departmentId);
        if (!department) return;

        setAppModalContent(root, {
          modalId: 'department-edit-modal',
          title: `Editar · ${department.name}`,
          bodyHtml: `
            <form id="edit-department-form" class="space-y-4" data-department-id="${escapeHtml(department.id)}">
              <div>
                <label class="form-label" for="edit-department-name">Nombre</label>
                <input id="edit-department-name" name="name" class="form-input" required minlength="2" maxlength="80" value="${escapeHtml(department.name)}" />
              </div>
              <div>
                <label class="form-label" for="edit-department-description">Descripción</label>
                <textarea id="edit-department-description" name="description" class="form-input min-h-[110px]" maxlength="500">${escapeHtml(department.description ?? '')}</textarea>
              </div>
            </form>
          `,
          footerHtml: `
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="submit" form="edit-department-form" class="btn-primary">Guardar cambios</button>
          `,
        });
        openAppModal(root, 'department-edit-modal');
      };

      const openDeleteModal = (departmentId) => {
        const department = departmentsCache.find((item) => item.id === departmentId);
        if (!department) return;

        setAppModalContent(root, {
          modalId: 'department-delete-modal',
          title: 'Eliminar departamento',
          bodyHtml: `
            <p class="text-sm leading-relaxed text-ink-300">
              Vas a eliminar permanentemente
              <span class="font-semibold text-white">${escapeHtml(department.name)}</span>.
              Esta acción no se puede deshacer. Si tiene personal, informes o traslados vinculados, el sistema lo bloqueará.
            </p>
          `,
          footerHtml: `
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="button" class="btn-primary !bg-rose-600 hover:!bg-rose-500" data-confirm-delete-department="${escapeHtml(department.id)}">
              Eliminar definitivamente
            </button>
          `,
        });
        openAppModal(root, 'department-delete-modal');
      };

      root.querySelector('#department-image')?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        imageDataUrl = file ? await readFileAsDataUrl(file) : null;
      });

      const onCreate = async (event) => {
        event.preventDefault();
        try {
          await createDepartment({
            name: root.querySelector('#department-name').value.trim(),
            description: root.querySelector('#department-description').value.trim() || undefined,
            imageUrl: imageDataUrl || undefined,
          });
          event.target.reset();
          imageDataUrl = null;
          setAuthAlert(root, {
            id: 'admin-departments-alert',
            type: 'success',
            message: 'Departamento creado.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-departments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const onClick = async (event) => {
        const edit = event.target.closest('[data-edit-department]');
        if (edit && canUpdate) {
          openEditModal(edit.getAttribute('data-edit-department'));
          return;
        }

        const remove = event.target.closest('[data-delete-department]');
        if (remove && canDelete) {
          openDeleteModal(remove.getAttribute('data-delete-department'));
          return;
        }

        const confirmDelete = event.target.closest('[data-confirm-delete-department]');
        if (confirmDelete && canDelete) {
          try {
            await deleteDepartment(confirmDelete.getAttribute('data-confirm-delete-department'));
            closeAppModal(root, 'department-delete-modal');
            setAuthAlert(root, {
              id: 'admin-departments-alert',
              type: 'success',
              message: 'Departamento eliminado.',
            });
            await load();
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-departments-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
          return;
        }

        const toggle = event.target.closest('[data-toggle-department]');
        if (toggle && canUpdate) {
          try {
            await updateDepartment(toggle.getAttribute('data-toggle-department'), {
              isActive: toggle.getAttribute('data-active') !== 'true',
            });
            setAuthAlert(root, {
              id: 'admin-departments-alert',
              type: 'success',
              message: 'Estado del departamento actualizado.',
            });
            await load();
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-departments-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
        }
      };

      const onSubmit = async (event) => {
        const form = event.target.closest('#edit-department-form');
        if (!form || !canUpdate) return;
        event.preventDefault();

        try {
          await updateDepartment(form.getAttribute('data-department-id'), {
            name: form.name.value.trim(),
            description: form.description.value.trim(),
          });
          closeAppModal(root, 'department-edit-modal');
          setAuthAlert(root, {
            id: 'admin-departments-alert',
            type: 'success',
            message: 'Departamento actualizado.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-departments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const onChange = async (event) => {
        const input = event.target.closest('[data-upload-department]');
        if (!input || !canUpdate) return;
        const file = input.files?.[0];
        if (!file) return;
        try {
          const dataUrl = await readFileAsDataUrl(file);
          await updateDepartment(input.getAttribute('data-upload-department'), {
            imageUrl: dataUrl,
          });
          setAuthAlert(root, {
            id: 'admin-departments-alert',
            type: 'success',
            message: 'Logo actualizado.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-departments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      root.querySelector('#create-department-form')?.addEventListener('submit', onCreate);
      root.addEventListener('click', onClick);
      root.addEventListener('submit', onSubmit);
      root.addEventListener('change', onChange);
      void load();

      return () => {
        cleanup?.();
        unbindEditModal?.();
        unbindDeleteModal?.();
        root.querySelector('#create-department-form')?.removeEventListener('submit', onCreate);
        root.removeEventListener('click', onClick);
        root.removeEventListener('submit', onSubmit);
        root.removeEventListener('change', onChange);
      };
    },
  };
}

function resolveUploadUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) {
    return `${getApiBaseUrl().replace(/\/api\/v1\/?$/, '')}${url}`;
  }
  return url;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
