const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');

/**
 * Dump a Prisma/PostgreSQL database and restore it into Supabase.
 *
 * Usage (PowerShell):
 *   $env:TARGET_DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
 *   node scripts/migrate-to-supabase.js all
 *
 * Modes: dump | restore | verify | all
 *
 * Never commit TARGET_DATABASE_URL or dump files.
 */

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function summarizeUrl(url) {
  const parsed = new URL(url.replace(/^postgresql:/i, 'http:'));
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
    user: decodeURIComponent(parsed.username),
  };
}

/** pg_dump/psql reject Prisma-only query params like schema=. */
function toLibpqUrl(url, { requireSsl = false } = {}) {
  const parsed = new URL(url.replace(/^postgresql:/i, 'http:'));
  const drop = new Set([
    'schema',
    'connection_limit',
    'pool_timeout',
    'pgbouncer',
    'connect_timeout',
    'socket_timeout',
  ]);
  for (const key of [...parsed.searchParams.keys()]) {
    if (drop.has(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }
  if (requireSsl && !parsed.searchParams.has('sslmode')) {
    parsed.searchParams.set('sslmode', 'require');
  }
  const auth = `${encodeURIComponent(decodeURIComponent(parsed.username))}:${encodeURIComponent(decodeURIComponent(parsed.password))}`;
  const query = parsed.searchParams.toString();
  return `postgresql://${auth}@${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}${query ? `?${query}` : ''}`;
}

function resolvePgBin(name) {
  const fromEnv = process.env[`PG_${name.toUpperCase()}_PATH`];
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const which = spawnSync(os.platform() === 'win32' ? 'where' : 'which', [name], {
    encoding: 'utf8',
  });
  const candidate = (which.stdout || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  if (candidate && fs.existsSync(candidate)) {
    return candidate;
  }

  if (os.platform() === 'win32') {
    const winPath = `C:\\Program Files\\PostgreSQL\\18\\bin\\${name}.exe`;
    if (fs.existsSync(winPath)) {
      return winPath;
    }
  }

  throw new Error(`Could not find ${name}. Install PostgreSQL client tools or set PG_${name.toUpperCase()}_PATH.`);
}

function runUri(bin, args, label) {
  console.log(`\n>> ${label}`);
  const result = spawnSync(bin, args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 200,
  });
  if (result.stdout) process.stdout.write(result.stdout.slice(0, 8000));
  if (result.stderr) process.stderr.write(result.stderr.slice(0, 12000));
  if (result.status !== 0) {
    console.error(`${label} failed with code ${result.status}`);
    process.exit(result.status || 1);
  }
  return result;
}

const apiRoot = path.join(__dirname, '..');
const env = readEnvFile(path.join(apiRoot, '.env'));
if (!env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in api/.env (source database)');
  process.exit(1);
}

const sourceUrl = toLibpqUrl(env.DATABASE_URL);
const targetRaw = process.env.TARGET_DATABASE_URL;
if (!targetRaw) {
  console.error('Set TARGET_DATABASE_URL to the Supabase connection string');
  process.exit(1);
}
const targetUrl = toLibpqUrl(targetRaw, { requireSsl: true });

console.log('source', summarizeUrl(sourceUrl));
console.log('target', summarizeUrl(targetUrl));

const pgDump = resolvePgBin('pg_dump');
const pgRestore = resolvePgBin('pg_restore');
const psql = resolvePgBin('psql');
const dumpPath = path.join(apiRoot, 'tmp-supabase-migration.dump');
const mode = process.argv[2] || 'all';

if (mode === 'dump' || mode === 'all') {
  runUri(
    pgDump,
    [
      '--dbname',
      sourceUrl,
      '--format=custom',
      '--no-owner',
      '--no-acl',
      '--file',
      dumpPath,
    ],
    'pg_dump source',
  );
  const stats = fs.statSync(dumpPath);
  console.log(`dump size bytes=${stats.size}`);
}

if (mode === 'restore' || mode === 'all') {
  if (!fs.existsSync(dumpPath)) {
    console.error(`Missing dump file: ${dumpPath}. Run dump first.`);
    process.exit(1);
  }

  runUri(
    psql,
    [
      targetUrl,
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
    ],
    'ensure pgcrypto on target',
  );

  runUri(
    pgRestore,
    [
      '--dbname',
      targetUrl,
      '--no-owner',
      '--no-acl',
      '--clean',
      '--if-exists',
      dumpPath,
    ],
    'pg_restore into Supabase',
  );
}

if (mode === 'verify' || mode === 'all') {
  runUri(
    psql,
    [
      targetUrl,
      '-c',
      `SELECT 'Account' AS t, COUNT(*)::text AS c FROM "Account"
       UNION ALL SELECT 'Character', COUNT(*)::text FROM "Character"
       UNION ALL SELECT 'StaffProfile', COUNT(*)::text FROM "StaffProfile"
       UNION ALL SELECT 'Report', COUNT(*)::text FROM "Report"
       UNION ALL SELECT 'NewsArticle', COUNT(*)::text FROM "NewsArticle";`,
    ],
    'verify target counts',
  );
}

console.log('\nDone.');
