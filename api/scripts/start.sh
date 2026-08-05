#!/usr/bin/env sh
# Railway start: Nest must be PID 1 via exec so the process stays alive.
set -u

echo "[start] node=$(node -v) pwd=$(pwd)"
echo "[start] process.env.PORT=${PORT:-unset}"

if [ ! -f dist/main.js ]; then
  echo "[start] FATAL: dist/main.js not found"
  ls -la dist || true
  exit 1
fi

echo "[start] exec node dist/main.js"
exec node dist/main.js
