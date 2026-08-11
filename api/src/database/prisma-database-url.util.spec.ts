import { resolvePrismaDatabaseUrl } from './prisma-database-url.util';

describe('resolvePrismaDatabaseUrl', () => {
  const previousLimit = process.env.PRISMA_CONNECTION_LIMIT;
  const previousTimeout = process.env.PRISMA_POOL_TIMEOUT;

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
  });

  it('adds default pool limits when missing', () => {
    delete process.env.PRISMA_CONNECTION_LIMIT;
    delete process.env.PRISMA_POOL_TIMEOUT;

    const resolved = resolvePrismaDatabaseUrl('postgresql://user:pass@localhost:5432/saed');
    expect(resolved).toContain('connection_limit=5');
    expect(resolved).toContain('pool_timeout=10');
  });

  it('preserves explicit DATABASE_URL pool settings', () => {
    const resolved = resolvePrismaDatabaseUrl(
      'postgresql://user:pass@localhost:5432/saed?connection_limit=3&pool_timeout=20',
    );
    expect(resolved).toContain('connection_limit=3');
    expect(resolved).toContain('pool_timeout=20');
  });
});
