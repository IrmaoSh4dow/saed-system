export function renderSelectField({
  id,
  name,
  label,
  options = [],
  required = false,
  placeholder = 'Seleccionar',
} = {}) {
  return `
    <div>
      <label class="form-label" for="${id}">${label}</label>
      <select id="${id}" name="${name}" class="form-input" ${required ? 'required' : ''}>
        <option value="">${placeholder}</option>
        ${options
          .map((option) => `<option value="${option.value}">${option.label}</option>`)
          .join('')}
      </select>
      <p id="${id}-error" class="form-error hidden"></p>
    </div>
  `;
}
