import { hash, verify } from '@node-rs/argon2';

/** Cost params aligned across auth provider and Prisma seed. Algorithm defaults to Argon2id. */
export const PASSWORD_HASH_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_HASH_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password);
}
