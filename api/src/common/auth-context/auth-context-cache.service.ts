import { Injectable } from '@nestjs/common';
import type { IAuthRequestUser } from '../../modules/auth/interfaces/i-auth-request.interface';

const DEFAULT_TTL_MS = 45_000;
const MAX_ENTRIES = 500;

/**
 * Short-lived in-memory cache for JWT validation payloads.
 * Avoids reloading account + character + permissions on every HTTP request.
 * Any mutation that changes authorization must invalidate the affected entries.
 */
@Injectable()
export class AuthContextCacheService {
  private readonly entries = new Map<string, { expiresAt: number; value: IAuthRequestUser }>();

  private readonly ttlMs = readPositiveInt(process.env.AUTH_CONTEXT_CACHE_TTL_MS, DEFAULT_TTL_MS);

  get(accountId: string, characterId: string | null | undefined): IAuthRequestUser | null {
    const key = this.buildKey(accountId, characterId);
    const hit = this.entries.get(key);

    if (!hit) {
      return null;
    }

    if (Date.now() >= hit.expiresAt) {
      this.entries.delete(key);
      return null;
    }

    return hit.value;
  }

  set(accountId: string, characterId: string | null | undefined, value: IAuthRequestUser): void {
    this.entries.set(this.buildKey(accountId, characterId), {
      expiresAt: Date.now() + this.ttlMs,
      value,
    });
    this.pruneIfNeeded();
  }

  invalidateAccount(accountId: string): void {
    this.deleteWhere((key) => key.startsWith(`${accountId}:`));
  }

  invalidateCharacter(characterId: string): void {
    this.deleteWhere((key) => key.endsWith(`:${characterId}`));
  }

  clear(): void {
    this.entries.clear();
  }

  private deleteWhere(predicate: (key: string) => boolean): void {
    for (const key of [...this.entries.keys()]) {
      if (predicate(key)) {
        this.entries.delete(key);
      }
    }
  }

  private buildKey(accountId: string, characterId: string | null | undefined): string {
    return `${accountId}:${characterId ?? ''}`;
  }

  private pruneIfNeeded(): void {
    if (this.entries.size <= MAX_ENTRIES) {
      return;
    }

    // Map preserves insertion order, so the first key is the oldest entry.
    for (const key of this.entries.keys()) {
      this.entries.delete(key);
      break;
    }
  }
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}
