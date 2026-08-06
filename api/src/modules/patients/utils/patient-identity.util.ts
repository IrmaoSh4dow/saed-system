/**
 * Identity helpers for Patient search and duplicate detection.
 * Character (auth) and Patient (clinical) stay separate — these only normalize clinical fields.
 */

export function normalizePersonName(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePhone(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.replace(/\D+/g, '');
}

export function normalizeDocument(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

export function buildPatientSearchKey(input: {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone?: string | null;
  identityDocument?: string | null;
}): string {
  const names = [input.firstName, input.middleName, input.lastName]
    .map((part) => normalizePersonName(part))
    .filter(Boolean)
    .join(' ');
  const phone = normalizePhone(input.phone);
  const document = normalizeDocument(input.identityDocument);
  return [names, phone, document].filter(Boolean).join(' | ');
}

export function buildNormalizedFullName(input: {
  firstName: string;
  lastName: string;
  middleName?: string | null;
}): string {
  return [input.firstName, input.middleName, input.lastName]
    .map((part) => normalizePersonName(part))
    .filter(Boolean)
    .join(' ');
}

/** Dice coefficient on bigrams — good for short name fuzzy matching. */
export function nameSimilarity(a: string, b: string): number {
  const left = normalizePersonName(a);
  const right = normalizePersonName(b);
  if (!left || !right) {
    return 0;
  }
  if (left === right) {
    return 1;
  }

  const bigrams = (value: string) => {
    const pairs = new Map<string, number>();
    for (let index = 0; index < value.length - 1; index += 1) {
      const pair = value.slice(index, index + 2);
      pairs.set(pair, (pairs.get(pair) ?? 0) + 1);
    }
    return pairs;
  };

  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  let intersection = 0;
  for (const [pair, count] of leftPairs) {
    const other = rightPairs.get(pair);
    if (other) {
      intersection += Math.min(count, other);
    }
  }

  return (2 * intersection) / (left.length + right.length - 2 || 1);
}

export type DuplicateConfidence = 'exact' | 'likely' | 'possible';

export interface IDuplicateSignal {
  confidence: DuplicateConfidence;
  reason: string;
  score: number;
}
