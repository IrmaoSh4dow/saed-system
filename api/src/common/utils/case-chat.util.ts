import { ForbiddenException } from '@nestjs/common';

/**
 * Shared helper for citizen-facing case chats (appointments, complaints, admin requests).
 * When a case reaches a terminal status, history remains readable but new messages are blocked.
 */
export function assertCaseChatOpen(isOpen: boolean, entityLabel = 'caso'): void {
  if (!isOpen) {
    throw new ForbiddenException(
      `El chat de esta ${entityLabel} está cerrado porque el estado es final.`,
    );
  }
}
