const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const target =
  process.env.TARGET_DATABASE_URL ||
  process.argv[2];

if (!target) {
  console.error('Provide TARGET_DATABASE_URL or pass the URL as argv[2]');
  process.exit(1);
}

function withPrismaParams(url) {
  const parsed = new URL(url.replace(/^postgresql:/i, 'http:'));
  if (!parsed.searchParams.has('sslmode')) {
    parsed.searchParams.set('sslmode', 'require');
  }
  if (!parsed.searchParams.has('schema')) {
    parsed.searchParams.set('schema', 'public');
  }
  const auth = `${encodeURIComponent(decodeURIComponent(parsed.username))}:${encodeURIComponent(decodeURIComponent(parsed.password))}`;
  const query = parsed.searchParams.toString();
  return `postgresql://${auth}@${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}?${query}`;
}

const nextUrl = withPrismaParams(target);
const text = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const line = `DATABASE_URL="${nextUrl}"`;
let updated;
if (/^DATABASE_URL=/m.test(text)) {
  updated = text.replace(/^DATABASE_URL=.*$/m, line);
} else {
  updated = `${text.trimEnd()}\n${line}\n`;
}
fs.writeFileSync(envPath, updated, 'utf8');
const host = new URL(nextUrl.replace(/^postgresql:/i, 'http:')).hostname;
const parsed = new URL(nextUrl.replace(/^postgresql:/i, 'http:'));
console.log(
  `Updated api/.env DATABASE_URL host=${host} sslmode=${parsed.searchParams.get('sslmode')} schema=${parsed.searchParams.get('schema')}`,
);
