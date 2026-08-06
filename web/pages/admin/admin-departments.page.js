import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import { createDepartment, listDepartments, updateDepartment } from '../../services/departments.service.js';
import { can } from '../../services/auth-context.js';
import { getApiBaseUrl } from '../../utils/env.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

export function adminDepartmentsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const canCreate = can(PERMISSIONS.DEPARTMENTS_CREATE);
  const canUpdate = can(PERMISSIONS.DEPARTMENTS_UPDATE);

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
              <input id="department-description" class="form-input" />
            </div>
            <button type="submit" class="btn-primary">Crear departamento</button>
          </form>
        </section>
      `
          : ''
      }
      <section class="grid gap-4 md:grid-cols-2" id="departments-grid"></section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Gestión de departmentes',
      currentPath: '/admin/departments',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Departamentos');
      let imageDataUrl = null;

      const load = async () => {
        try {
          const departments = await listDepartments('admin');
          const grid = root.querySelector('#departments-grid');
          grid.innerHTML = departments
            .map((department) => {
              const image = resolveUploadUrl(department.imageUrl);
              return `
                <article class="panel overflow-hidden">
                  <div class="h-28 w-full overflow-hidden bg-surface-950">
                    ${
                      image
                        ? `<img src="${image}" alt="${department.name}" class="h-full w-full object-contain p-4" />`
                        : `<div class="flex h-full items-center justify-center text-sm text-ink-500">Sin logo</div>`
                    }
                  </div>
                  <div class="p-5">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h3 class="font-semibold text-white">${department.name}</h3>
                        <p class="mt-1 text-xs text-ink-400">${department.slug}</p>
                      </div>
                      <span class="text-xs text-ink-400">${department._count?.officers ?? 0} personal · ${department._count?.supervisors ?? 0} encargados</span>
                    </div>
                    <p class="mt-3 text-sm text-ink-300">${department.description ?? 'Sin descripción'}</p>
                    <div class="mt-4 flex flex-wrap gap-3">
                      <a data-link href="/departments?id=${department.id}" class="text-xs font-medium text-brand-300 hover:text-brand-200">Ver ficha</a>
                      ${
                        canUpdate
                          ? `
                            <label class="text-xs font-medium text-brand-300 cursor-pointer">
                              Cambiar logo
                              <input type="file" accept="image/*" class="hidden" data-upload-department="${department.id}" />
                            </label>
                            <button type="button" class="text-xs font-medium text-brand-300" data-toggle-department="${department.id}" data-active="${department.isActive}">
                              ${department.isActive ? 'Desactivar' : 'Activar'}
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
        const toggle = event.target.closest('[data-toggle-department]');
        if (toggle && canUpdate) {
          try {
            await updateDepartment(toggle.getAttribute('data-toggle-department'), {
              isActive: toggle.getAttribute('data-active') !== 'true',
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
      root.addEventListener('change', onChange);
      void load();

      return () => {
        cleanup?.();
        root.querySelector('#create-department-form')?.removeEventListener('submit', onCreate);
        root.removeEventListener('click', onClick);
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
