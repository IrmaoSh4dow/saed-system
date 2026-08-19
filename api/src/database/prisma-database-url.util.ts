/**
 * Prisma PostgreSQL pool settings for long-lived app processes (Railway).
 * Existing query params in DATABASE_URL always win.
 */
export function resolvePrismaDatabaseUrl(
  databaseUrl: string | undefined,
  options?: {
    connectionLimit?: number;
    poolTimeout?: number;
  },
): string | undefined {
  if (!databaseUrl) {
    return databaseUrl;
  }

  // Persistent warm pool — do not tear down between requests.
  const connectionLimit =
    options?.connectionLimit ?? readPositiveInt(process.env.PRISMA_CONNECTION_LIMIT, 10);
  const poolTimeout =
    options?.poolTimeout ?? readPositiveInt(process.env.PRISMA_POOL_TIMEOUT, 60);

  try {
    const parsed = new URL(databaseUrl);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', String(connectionLimit));
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', String(poolTimeout));
    }
    // Supabase (and most managed Postgres) require TLS.
    if (
      !parsed.searchParams.has('sslmode') &&
      /\.supabase\.co$/i.test(parsed.hostname)
    ) {
      parsed.searchParams.set('sslmode', 'require');
    }
    return parsed.toString();
  } catch {
    return databaseUrl;
  }
}

export function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}
