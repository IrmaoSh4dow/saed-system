/**
 * Prisma PostgreSQL pool settings for long-lived app processes (Railway / Supabase).
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

  // Keep a warm pool for interactive traffic. Idle teardown is handled in PrismaService.
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

export function resolvePrismaIdleTtlMs(
  value: string | undefined = process.env.PRISMA_IDLE_TTL_MS,
): number {
  // Default: close the pool after 10 minutes without application traffic.
  return readPositiveInt(value, 10 * 60 * 1000);
}

export function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}
