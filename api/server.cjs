'use strict';

/**
 * Railway / production entry.
 * Listens on process.env.PORT (default 8080) at 0.0.0.0, then runs migrations,
 * seed and Nest boot in that order.
 *
 * Migrations and seed run *after* listen on purpose: chaining them ahead of the
 * listener (start command with `&&`) means any migrate/seed failure leaves the
 * port closed, and Railway reports the deploy as "service unavailable" with no
 * usable diagnosis. Here every step is non-fatal and surfaced through /health.
 */

const http = require('node:http');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const DEFAULT_PORT = 8080;
const rawPort = process.env.PORT;
const port = Number.parseInt(rawPort ?? String(DEFAULT_PORT), 10);

console.log(
  JSON.stringify({
    msg: 'server_boot',
    PORT: rawPort ?? null,
    listenPort: Number.isFinite(port) ? port : null,
    cwd: process.cwd(),
    node: process.version,
    hasFrontendUrl: Boolean(process.env.FRONTEND_URL),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasDiscordNewsWebhook: Boolean(
      process.env.DISCORD_NEWS_WEBHOOK_URL || process.env.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL,
    ),
    hasDiscordApplicationsWebhook: Boolean(
      process.env.DISCORD_APPLICATIONS_WEBHOOK_URL ||
        process.env.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL,
    ),
    hasDiscordShiftsWebhook: Boolean(process.env.DISCORD_SHIFTS_WEBHOOK_URL),
    hasPublicAssetBaseUrl: Boolean(process.env.PUBLIC_ASSET_BASE_URL),
  }),
);

if (!Number.isFinite(port) || port <= 0) {
  console.error('[server] FATAL: invalid PORT');
  process.exit(1);
}

const state = {
  nestReady: false,
  bootError: null,
  nestHandler: null,
  migrations: 'pending',
  seed: 'pending',
};

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/health' || url.startsWith('/health?')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        status: resolveHealthStatus(),
        nestReady: state.nestReady,
        bootError: state.bootError,
        migrations: state.migrations,
        seed: state.seed,
        port,
        pid: process.pid,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  if (typeof state.nestHandler === 'function') {
    state.nestHandler(req, res);
    return;
  }

  res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(
    JSON.stringify({
      success: false,
      message: 'API process is up but Nest is still booting or failed. See /health.',
      bootError: state.bootError,
    }),
  );
});

server.listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({ msg: 'server_listening', host: '0.0.0.0', port }));
  void bootstrap();
});

server.on('error', (error) => {
  console.error(JSON.stringify({ msg: 'server_listen_error', error: String(error) }));
  process.exit(1);
});

/**
 * Always HTTP 200 so Railway can complete the deploy; the body carries the
 * real state so a failed migration is visible instead of killing the service.
 */
function resolveHealthStatus() {
  if (state.bootError || state.migrations === 'failed' || state.seed === 'failed') {
    return 'degraded';
  }

  return state.nestReady ? 'ok' : 'booting';
}

async function bootstrap() {
  state.migrations = await runStartupStep(
    'prisma-migrate',
    'SKIP_PRISMA_MIGRATE',
    'npx',
    ['prisma', 'migrate', 'deploy'],
  );

  state.seed = await runStartupStep('prisma-seed', 'SKIP_PRISMA_SEED', 'npm', [
    'run',
    'prisma:seed',
  ]);

  await loadNest();
}

function isStepSkipped(envKey) {
  const value = (process.env[envKey] || '').toLowerCase();
  return value === 'true' || value === '1';
}

/**
 * Runs a startup command without ever killing the process: the port is already
 * open and /health must stay reachable so Railway can complete the deploy.
 */
function runStartupStep(step, skipEnvKey, command, args) {
  if (isStepSkipped(skipEnvKey)) {
    console.log(JSON.stringify({ msg: 'startup_step_skipped', step, via: skipEnvKey }));
    return Promise.resolve('skipped');
  }

  console.log(JSON.stringify({ msg: 'startup_step_start', step }));

  return new Promise((resolve) => {
    // Use the .cmd shims on Windows instead of shell:true, which concatenates args.
    const binary = process.platform === 'win32' ? `${command}.cmd` : command;
    const child = spawn(binary, args, { stdio: 'inherit' });

    child.on('error', (error) => {
      console.error(JSON.stringify({ msg: 'startup_step_error', step, error: String(error) }));
      resolve('failed');
    });

    child.on('close', (code) => {
      console.log(JSON.stringify({ msg: 'startup_step_done', step, exitCode: code }));
      resolve(code === 0 ? 'ok' : 'failed');
    });
  });
}

async function loadNest() {
  try {
    console.log(JSON.stringify({ msg: 'nest_load_start' }));
    const nestBootPath = path.join(process.cwd(), 'dist', 'nest-boot.js');
    const mod = await import(pathToFileURL(nestBootPath).href);
    if (typeof mod.attachNestToServer !== 'function') {
      throw new Error('dist/nest-boot.js did not export attachNestToServer');
    }
    state.nestHandler = await mod.attachNestToServer(server);
    state.nestReady = true;
    console.log(JSON.stringify({ msg: 'nest_ready' }));
  } catch (error) {
    state.bootError = error instanceof Error ? error.stack || error.message : String(error);
    console.error(JSON.stringify({ msg: 'nest_load_failed', bootError: state.bootError }));
    console.error(error);
  }
}

process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({ msg: 'uncaughtException', error: error.stack || String(error) }));
});

process.on('unhandledRejection', (reason) => {
  console.error(
    JSON.stringify({
      msg: 'unhandledRejection',
      error: reason instanceof Error ? reason.stack || reason.message : String(reason),
    }),
  );
});
