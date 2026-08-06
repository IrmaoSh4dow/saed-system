import { formatDateTimeLabel } from '../../utils/date.js';
import { resolveUploadUrl } from '../../utils/media.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Renders a single chat bubble used across case messaging modules.
 */
export function renderChatMessageBubble(message, { activeCharacterId } = {}) {
  const authorId = message.author?.id ?? message.authorId ?? null;
  const mine = Boolean(activeCharacterId && authorId === activeCharacterId);
  const image = resolveUploadUrl(message.imageUrl);
  const authorName =
    message.author?.fullName ||
    [message.author?.firstName, message.author?.lastName].filter(Boolean).join(' ') ||
    '—';

  return `
    <article
      data-chat-message-id="${escapeHtml(message.id)}"
      class="flex ${mine ? 'justify-end' : 'justify-start'} transition duration-200"
    >

      <div class="max-w-[85%] rounded-2xl border px-3.5 py-2.5 ${
        mine
          ? 'border-brand-500/25 bg-brand-500/15'
          : 'border-white/8 bg-surface-950/70'
      }">
        <div class="flex items-center justify-between gap-3">
          <p class="text-[11px] font-medium ${mine ? 'text-brand-200' : 'text-ink-400'}">
            ${escapeHtml(authorName)}
            · ${escapeHtml(formatDateTimeLabel(message.createdAt))}
          </p>
          <span class="text-[10px] ${mine ? 'text-brand-300/80' : 'text-ink-500'}">
            ${mine ? 'Enviado' : 'Recibido'}
          </span>
        </div>
        ${
          message.body
            ? `<p class="mt-1 whitespace-pre-wrap text-sm text-ink-100">${escapeHtml(message.body)}</p>`
            : ''
        }
        ${
          image
            ? `<a href="${escapeHtml(image)}" target="_blank" rel="noopener noreferrer" class="mt-2 block overflow-hidden rounded-xl border border-white/10">
                <img src="${escapeHtml(image)}" alt="" class="max-h-56 w-full object-cover" />
              </a>`
            : ''
        }
      </div>
    </article>
  `;
}

/**
 * Append a message to a scrollable chat container without full re-render.
 * Returns true if the message was appended (or already present).
 */
export function appendChatMessage(container, message, options = {}) {
  if (!container || !message?.id) return false;

  if (container.querySelector(`[data-chat-message-id="${CSS.escape(String(message.id))}"]`)) {
    return true;
  }

  const empty = container.querySelector('[data-chat-empty]');
  empty?.remove();

  const nearBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight < 96;

  container.insertAdjacentHTML(
    'beforeend',
    renderChatMessageBubble(message, options),
  );

  if (nearBottom || options.forceScroll) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }

  return true;
}
