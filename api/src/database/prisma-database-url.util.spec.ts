import {
  readPositiveInt,
  resolvePrismaDatabaseUrl,
  resolvePrismaIdleTtlMs,
} from './prisma-database-url.util';

describe('resolvePrismaDatabaseUrl', () => {
  const previousLimit = process.env.PRISMA_CONNECTION_LIMIT;
  const previousTimeout = process.env.PRISMA_POOL_TIMEOUT;
  const previousIdle = process.env.PRISMA_IDLE_TTL_MS;

  afterEach(() => {
    if (previousLimit === undefined) {
      delete process.env.PRISMA_CONNECTION_LIMIT;
    } else {
      process.env.PRISMA_CONNECTION_LIMIT = previousLimit;
    }
    if (previousTimeout === undefined) {
      delete process.env.PRISMA_POOL_TIMEOUT;
    } else {
      process.env.PRISMA_POOL_TIMEOUT = previousTimeout;
    }
    if (previousIdle === undefined) {
      delete process.env.PRISMA_IDLE_TTL_MS;
    } else {
      process.env.PRISMA_IDLE_TTL_MS = previousIdle;
    }
  });

  it('adds warm pool defaults when missing', () => {
    delete process.env.PRISMA_CONNECTION_LIMIT;
    delete process.env.PRISMA_POOL_TIMEOUT;

    const resolved = resolvePrismaDatabaseUrl('postgresql://user:pass@localhost:5432/saed');
    expect(resolved).toContain('connection_limit=10');
    expect(resolved).toContain('pool_timeout=60');
  });

  it('preserves explicit DATABASE_URL pool settings', () => {
    const resolved = resolvePrismaDatabaseUrl(
      'postgresql://user:pass@localhost:5432/saed?connection_limit=3&pool_timeout=20',
    );
    expect(resolved).toContain('connection_limit=3');
    expect(resolved).toContain('pool_timeout=20');
  });

  it('adds sslmode require for Supabase hosts', () => {
    const resolved = resolvePrismaDatabaseUrl(
      'postgresql://postgres:pass@db.example.supabase.co:5432/postgres',
    );
    expect(resolved).toContain('sslmode=require');
  });

  it('defaults idle TTL to 10 minutes', () => {
    delete process.env.PRISMA_IDLE_TTL_MS;
    expect(resolvePrismaIdleTtlMs()).toBe(10 * 60 * 1000);
  });

  it('reads positive integers with fallback', () => {
    expect(readPositiveInt(undefined, 7)).toBe(7);
    expect(readPositiveInt('0', 7)).toBe(7);
    expect(readPositiveInt('12', 7)).toBe(12);
  });
});
