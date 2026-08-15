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
| `DATABASE_URL` | Sí | PostgreSQL. En producción usar **Supabase** (URI directa `:5432`) con `?sslmode=require`. |
| `PRISMA_CONNECTION_LIMIT` | No | Default `10`. Tamaño del pool cálido de Prisma. |
| `PRISMA_POOL_TIMEOUT` | No | Default `60` (segundos de espera por una conexión libre del pool). |
| `PRISMA_IDLE_TTL_MS` | No | Default `600000` (10 min). Cierra el pool si no hay tráfico de aplicación. |
| `JWT_SECRET` | Sí | ≥ 16 caracteres |
| `FRONTEND_URL` | Sí | Origen(es) del front, separados por coma |
| `API_PREFIX` | No | Default `api/v1` |
| `PORT` | Inyectada | No hardcodear puerto fijo |
| `NODE_ENV` | Recomendada | `production` |
| `PRUNE_OPERATIONAL_DATA` | No | Default `false`. Solo si es `true` borra informes, pacientes, citas, quejas, etc. (conserva catálogos y `@sh4dow`). |
| `DISCORD_SHIFTS_WEBHOOK_URL` | No | Webhook de turnos |
| `DISCORD_INCENTIVES_WEBHOOK_URL` | No | Webhook de incentivos |
| `DISCORD_NEWS_WEBHOOK_URL` | No | Webhook al publicar noticias |
| `DISCORD_APPLICATIONS_WEBHOOK_URL` | No | Webhook al abrir convocatorias (Academia / Traslado) |
| `DISCORD_ANNOUNCEMENTS_WEBHOOK_URL` | No | Fallback compartido para noticias/postulaciones |
| `PUBLIC_ASSET_BASE_URL` | No | Origen público HTTPS de la API (imágenes de embeds) |

### Discord webhooks (obligatorio configurar en el panel)

El archivo `api/.env` local **no se despliega** a Railway (está en `.gitignore`).

Si en logs aparece `News Discord webhook skipped: no webhook URL configured`, el servicio API de Railway no tiene las variables.

En el **servicio API** (no el frontend), pestaña **Variables**, añade al menos:

```text
DISCORD_NEWS_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_APPLICATIONS_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Puedes usar el mismo webhook en ambas, o solo:

```text
DISCORD_ANNOUNCEMENTS_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Para que Discord muestre la imagen de portada de noticias, también:

```text
PUBLIC_ASSET_BASE_URL=https://<tu-api>.up.railway.app
```

Luego **Redeploy** el servicio API. En el arranque deberías ver `Discord webhooks → news:on`.

### Supabase (PostgreSQL)

La API usa PostgreSQL gestionado en **Supabase**. En el servicio API de Railway, `DATABASE_URL` debe apuntar a la URI **directa** (puerto `5432`), no al pooler de transacciones si vas a ejecutar `prisma migrate deploy` en el start command.

Ejemplo (sin pegar la contraseña en el repo):

```text
DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require&schema=public
```

Notas:

- `sslmode=require` es obligatorio.
- Mantén `PRUNE_OPERATIONAL_DATA=false` (o sin definir) para no borrar datos operativos en cada deploy.
- Para migrar datos desde otra Postgres local/Railway: `api/scripts/migrate-to-supabase.js` (usa `TARGET_DATABASE_URL` en el entorno; nunca la subas a git).

### Qué conserva el seed / prune

**Se mantiene**

- Cuenta `@sh4dow` (personajes, staff, roles, ocupaciones, licencias/condecoraciones asignadas)
- Roles, permisos, rangos, departamentos
- Catálogo de licencias y condecoraciones
- Tratamientos, establishments, configuración de incentivos

**Se vacía solo si** `PRUNE_OPERATIONAL_DATA=true`

- Pacientes / EMR / facturas clínicas
- Informes médicos
- Citas, quejas, solicitudes administrativas
- Turnos, valoraciones, pagos de incentivos
- Academia operativa, noticias/galería CMS, convenios, auditoría, notificaciones, refresh tokens
- Cuentas distintas de `@sh4dow`

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
5. Front sin errores CORS; `FRONTEND_URL` con el dominio real

---

## Puertos

| Servicio | Target Port | Escucha |
|----------|-------------|---------|
| Frontend | `PORT` (Railway) | `process.env.PORT` |
| API | `PORT` (Railway) | `process.env.PORT` |

Cada servicio Railway tiene su propio `PORT`. El API **no** fuerza 8081.
