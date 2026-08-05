#!/usr/bin/env sh
# Railway pre-deploy: schema first; seed is idempotent and must not block release if it fails.
set -u

echo "[pre-deploy] node=$(node -v) pwd=$(pwd)"
echo "[pre-deploy] PORT=${PORT:-unset}"

echo "[pre-deploy] prisma migrate deploy..."
npx prisma migrate deploy

echo "[pre-deploy] prisma db seed..."
if npx prisma db seed; then
  echo "[pre-deploy] seed completed"
else
  echo "[pre-deploy] WARNING: seed failed (exit $?). Schema is ready; app will still start."
fi

echo "[pre-deploy] done"
exit 0
