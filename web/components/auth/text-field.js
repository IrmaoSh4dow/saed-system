export function renderTextField({
  id,
  name,
  label,
  type = 'text',
  placeholder = '',
  autocomplete = 'off',
  required = false,
  value = '',
} = {}) {
  return `
    <div class="space-y-0">
      <label class="form-label" for="${id}">${label}</label>
      <input
        id="${id}"
        name="${name}"
        type="${type}"
        class="form-input"
        placeholder="${placeholder}"
        autocomplete="${autocomplete}"
        ${required ? 'required' : ''}
        value="${value}"
      />
      <p id="${id}-error" class="form-error hidden"></p>
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
    error.textContent = message;
    error.classList.remove('hidden');
    return;
  }

  input.classList.remove('form-input-error');
  error.textContent = '';
  error.classList.add('hidden');
}
