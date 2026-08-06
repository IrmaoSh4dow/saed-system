# Despliegue Railway — SAED Management System

Monorepo con **dos servicios** independientes. Cada uno usa su propio `PORT` inyectado por Railway.

| Servicio | Root Directory | Builder | Start |
|----------|----------------|---------|-------|
| API | `api` | Nixpacks (`api/railway.toml`) | `node server.cjs` |
| Frontend | `web` | Nixpacks (`web/railway.toml`) | `npm run start:railway` |

El módulo **LSPD** del producto (interoperabilidad policial) es intencional; no es branding legado del sistema. El producto se llama **SAED**.

---

## API (`api/`)

### Build / start

- Build: `npm run build` (`prisma generate` + `nest build`)
- Start: `node server.cjs` (escucha `0.0.0.0:$PORT`, health en `/health`, luego carga Nest)
- Healthcheck: `GET /health` (respuesta 200 aunque Nest aún esté booting)

No se ejecutan migraciones ni seed al arrancar. Aplicarlas a propósito (ver más abajo).

### Variables (panel del servicio API)

| Variable | Obligatoria | Notas |
|----------|-------------|-------|
| `DATABASE_URL` | Sí | Plugin PostgreSQL de Railway |
| `JWT_SECRET` | Sí | ≥ 16 caracteres |
| `FRONTEND_URL` | Sí | Origen(es) del front, separados por coma. Ej. `https://web.up.railway.app` |
| `API_PREFIX` | No | Default `api/v1` |
| `PORT` | Inyectada | No hardcodear 8081 ni otro puerto fijo |
| `NODE_ENV` | Recomendada | `production` |
| `DISCORD_SHIFTS_WEBHOOK_URL` | No | Webhook de turnos |
| `PUBLIC_ASSET_BASE_URL` | No | Origen público para URLs absolutas de assets |

### Migraciones / seed

Tras el primer deploy o cuando haya migraciones nuevas:

```bash
# En el servicio API (Railway shell / one-off)
npx prisma migrate deploy

# Opcional: roles/permisos/rangos (cuidado en prod con datos existentes)
npm run prisma:seed

# Atajo local/ops
npm run prisma:release
```

Si solo cambian permisos RBAC sin migración:

```bash
node scripts/sync-high-command-modules-permissions.js
node scripts/sync-lspd-permissions.js
node scripts/sync-staff-ratings-permissions.js
```

---

## Frontend (`web/`)

### Build / start

- Build: `npm run build` (Vite)
- Start: `serve dist -s` en `0.0.0.0:$PORT`
- Healthcheck: `GET /`

### Variables (build-time)

Vite embebe estas variables en el build. Configúralas **antes** de construir y **redeploy** si cambian.

| Variable | Obligatoria | Ejemplo |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Sí | `https://<api>.up.railway.app/api/v1` |
| `VITE_SOCKET_URL` | Sí | `https://<api>.up.railway.app` |
| `VITE_USE_API_AUTH` | Sí | `true` |
| `PORT` | Inyectada | Usada por `serve` |

---

## Checklist post-deploy

1. API `/health` → `nestReady: true`
2. Front carga y llama a la API pública (sin CORS errors)
3. Login local + selección de personaje
4. Socket.IO (chat / notificaciones) sobre el mismo origen de la API
5. Migraciones aplicadas (`prisma migrate deploy`)
6. `FRONTEND_URL` apunta al dominio real del front (incluye custom domain si aplica)

---

## Puertos

| Servicio | Target Port | Escucha |
|----------|-------------|---------|
| Frontend | `PORT` (Railway) | `process.env.PORT` |
| API | `PORT` (Railway) | `process.env.PORT` (default local `8080` en `server.cjs` / `3000` en `.env.example`) |

Cada servicio Railway tiene su propio `PORT`. El API **no** fuerza 8081.

Opcional local: `API_PORT` solo para overrides Nest.
