/**
 * Caps Prisma's PostgreSQL connection pool for small Railway instances.
 * Existing query params are preserved; values already set in DATABASE_URL win.
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

  const connectionLimit = options?.connectionLimit ?? readPositiveInt(process.env.PRISMA_CONNECTION_LIMIT, 5);
  const poolTimeout = options?.poolTimeout ?? readPositiveInt(process.env.PRISMA_POOL_TIMEOUT, 10);

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

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}
