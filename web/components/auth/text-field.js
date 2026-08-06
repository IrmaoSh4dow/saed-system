export function renderTextField({
  id,
  name,
  label,
  type = 'text',
  placeholder = '',
  autocomplete = 'off',
  required = false,
  value = '',
  hint = '',
} = {}) {
  return `
    <div class="auth-field space-y-0">
      <label class="form-label" for="${id}">${label}</label>
      <input
        id="${id}"
        name="${name}"
        type="${type}"
        class="form-input auth-input"
        placeholder="${placeholder}"
        autocomplete="${autocomplete}"
        ${required ? 'required' : ''}
        value="${value}"
      />
      ${hint ? `<p class="form-hint">${hint}</p>` : ''}
      <p id="${id}-error" class="form-error hidden" role="alert"></p>
    </div>
  `;
}

export function setFieldError(root, fieldId, message = '') {
  const input = root.querySelector(`#${fieldId}`);
  const error = root.querySelector(`#${fieldId}-error`);

  if (!input || !error) {
    return;
  }

  if (message) {
    input.classList.add('form-input-error');
    input.setAttribute('aria-invalid', 'true');
    error.textContent = message;
    error.classList.remove('hidden');
    error.classList.add('is-visible');
    return;
  }

  input.classList.remove('form-input-error');
  input.removeAttribute('aria-invalid');
  error.textContent = '';
  error.classList.add('hidden');
  error.classList.remove('is-visible');
}
