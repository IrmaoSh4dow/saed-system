/**
 * Citizen-facing case chat helpers.
 * Terminal cases keep history visible but block new messages.
 */

export function isCaseChatClosed(entity) {
  if (!entity) {
    return false;
  }
  if (typeof entity.isChatClosed === 'boolean') {
    return entity.isChatClosed;
  }
  if (typeof entity.canSendMessages === 'boolean') {
    return !entity.canSendMessages;
  }
  return false;
}

export function canSendCaseChatMessage(entity) {
  if (!entity) {
    return false;
  }
  if (typeof entity.canSendMessages === 'boolean') {
    return entity.canSendMessages;
  }
  return !isCaseChatClosed(entity);
}

export function renderClosedChatNotice(message = 'Este chat está cerrado. Puedes consultar el historial, pero ya no se pueden enviar mensajes.') {
  return `
    <div class="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-300">
      ${escapeHtml(message)}
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
