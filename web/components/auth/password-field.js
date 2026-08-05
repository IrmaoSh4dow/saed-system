import { icon } from '../landing/icons.js';

export function renderPasswordField({
  id = 'password',
  name = 'password',
  label = 'Contraseña',
  placeholder = '••••••••',
  autocomplete = 'current-password',
  required = true,
} = {}) {
  return `
    <div>
      <label class="form-label" for="${id}">${label}</label>
      <div class="relative">
        <input
          id="${id}"
          name="${name}"
          type="password"
          class="form-input pr-12"
          placeholder="${placeholder}"
          autocomplete="${autocomplete}"
          ${required ? 'required' : ''}
        />
        <button
          type="button"
          id="${id}-toggle"
          class="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 transition hover:text-white"
          aria-label="Mostrar contraseña"
          data-password-toggle="${id}"
        >
          ${icon('eye', 'h-4 w-4')}
        </button>
      </div>
      <p id="${id}-error" class="form-error hidden"></p>
    </div>
  `;
}

export function initPasswordToggles(root = document) {
  const buttons = [...root.querySelectorAll('[data-password-toggle]')];

  const handlers = buttons.map((button) => {
    const onClick = () => {
      const fieldId = button.getAttribute('data-password-toggle');
      const input = root.querySelector(`#${fieldId}`);
      if (!input) {
        return;
      }

      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      button.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
      button.innerHTML = icon(isHidden ? 'eyeOff' : 'eye', 'h-4 w-4');
    };

    button.addEventListener('click', onClick);
    return () => button.removeEventListener('click', onClick);
  });

  return () => handlers.forEach((cleanup) => cleanup());
}
