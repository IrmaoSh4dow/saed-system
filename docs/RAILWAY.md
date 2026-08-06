# Despliegue Railway — SAED Management System

Monorepo con **dos servicios** independientes. Cada uno usa su propio `PORT` inyectado por Railway.

| Servicio | Root Directory | Builder | Start |
|----------|----------------|---------|-------|
| API | `api` | Nixpacks (`api/railway.toml`) | `npx prisma migrate deploy && npm run prisma:seed && node server.cjs` |
| Frontend | `web` | Nixpacks (`web/railway.toml`) | `npm run start:railway` |

El módulo **LSPD** del producto (interoperabilidad policial) es intencional; no es branding legado del sistema. El producto se llama **SAED**.

---

## API (`api/`)

### Build / start

1. **Build:** `npm run build` (`prisma generate` + `nest build`)
2. **Start:**
   - `npx prisma migrate deploy` → aplica migraciones sobre `DATABASE_URL` (conserva datos)
   - `npm run prisma:seed` → catálogos + cuenta `@sh4dow` + prune operativo (ver abajo)
   - `node server.cjs` → escucha `0.0.0.0:$PORT`, health en `/health`
3. **Healthcheck:** `GET /health` (timeout 300s para dar margen a migrate/seed)

### Variables (panel del servicio API)

| Variable | Obligatoria | Notas |
|----------|-------------|-------|
| `DATABASE_URL` | Sí | Plugin PostgreSQL de Railway |
| `JWT_SECRET` | Sí | ≥ 16 caracteres |
| `FRONTEND_URL` | Sí | Origen(es) del front, separados por coma |
| `API_PREFIX` | No | Default `api/v1` |
| `PORT` | Inyectada | No hardcodear puerto fijo |
| `NODE_ENV` | Recomendada | `production` |
| `PRUNE_OPERATIONAL_DATA` | No | Default `true`. Borra informes, pacientes, citas, quejas, etc. Conserva catálogos y `@sh4dow`. **Pon `false` después del primer deploy limpio.** |
| `DISCORD_SHIFTS_WEBHOOK_URL` | No | Webhook de turnos |
| `PUBLIC_ASSET_BASE_URL` | No | Origen público para assets |

### Qué conserva el seed / prune

**Se mantiene**

- Cuenta `@sh4dow` (personajes, staff, roles, ocupaciones, licencias/condecoraciones asignadas)
- Roles, permisos, rangos, departamentos
- Catálogo de licencias y condecoraciones
- Tratamientos, establishments, configuración de incentivos

**Se vacía** (si `PRUNE_OPERATIONAL_DATA` ≠ `false`)

- Pacientes / EMR / facturas clínicas
- Informes médicos
- Citas, quejas, solicitudes administrativas
- Turnos, valoraciones, pagos de incentivos
- Academia operativa, noticias/galería CMS, convenios, auditoría, notificaciones, refresh tokens

Otras cuentas distintas de `@sh4dow` se eliminan en cada seed.

---

## Frontend (`web/`)

### Build / start

- Build: `npm run build` (Vite)
- Start: `serve dist -s` en `0.0.0.0:$PORT`
- Healthcheck: `GET /`

### Variables (build-time)

| Variable | Obligatoria | Ejemplo |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Sí | `https://<api>.up.railway.app/api/v1` |
| `VITE_SOCKET_URL` | Sí | `https://<api>.up.railway.app` |
| `VITE_USE_API_AUTH` | Sí | `true` |
| `PORT` | Inyectada | Usada por `serve` |

---

## Checklist post-deploy

1. Redeploy del servicio API (para ejecutar migrate + seed)
2. API `/health` → `nestReady: true`
3. Login `@sh4dow` + personajes intactos
4. Sin pacientes/informes residuales de otras cuentas
5. Cuando el entorno ya esté limpio: `PRUNE_OPERATIONAL_DATA=false` (si no, cada redeploy vacía de nuevo la operativa)
6. Front sin errores CORS; `FRONTEND_URL` con el dominio real

---

## Puertos

| Servicio | Target Port | Escucha |
|----------|-------------|---------|
| Frontend | `PORT` (Railway) | `process.env.PORT` |
| API | `PORT` (Railway) | `process.env.PORT` |

Cada servicio Railway tiene su propio `PORT`. El API **no** fuerza 8081.
