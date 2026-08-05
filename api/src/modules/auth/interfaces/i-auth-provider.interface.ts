import { AuthProvider } from '@prisma/client';

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');

export interface IAuthProviderRegisterInput {
  username: string;
  password: string;
  displayName?: string;
}

export interface IAuthProviderLoginInput {
  identifier: string;
  password: string;
}

export interface IExternalAuthProfile {
  providerAccountId: string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  rawProfile?: Record<string, unknown>;
}

export interface IAuthProvider {
  readonly provider: AuthProvider;
  register?(input: IAuthProviderRegisterInput): Promise<{ accountId: string }>;
  authenticate?(input: IAuthProviderLoginInput): Promise<{ accountId: string }>;
  upsertFromExternalProfile?(profile: IExternalAuthProfile): Promise<{ accountId: string }>;
}
