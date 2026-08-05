# SAED Management System

Plataforma web profesional para la gestión integral del **San Andreas Emergency Department (SAED)** en un servidor FiveM Roleplay.

El sistema centraliza autenticación (Discord OAuth2 y local), personajes, RBAC, personal médico, departamentos, informes médicos, denuncias ciudadanas, academia, noticias/CMS de landing y panel administrativo.

---

## Tecnologías

| Capa | Stack |
|------|--------|
| Backend | NestJS, Prisma, PostgreSQL, JWT, Passport (Discord OAuth2), Socket.IO, Multer |
| Frontend | HTML5, Tailwind CSS, Flowbite, JavaScript ES Modules, Vite, Axios, Socket.IO Client |
| Infra | Docker Compose (PostgreSQL 16) |

---

## Arquitectura

Frontend y backend son aplicaciones independientes. La comunicación es exclusivamente:

- **REST** — consultas y mutaciones
- **Socket.IO** — tiempo real (notificaciones, chat, cambio de personaje)

El frontend nunca accede a la base de datos. La autorización se valida siempre en el backend (RBAC por personaje → rol → permisos).

Documentación detallada:

- [PRD](docs/PRD.md)
- [Arquitectura](docs/ARQUITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Despliegue Railway](docs/RAILWAY.md)

---

## Estructura del monorepo

```
saed-system/
├── api/                 # Backend NestJS (REST + Socket.IO)
│   ├── prisma/          # Schema, migraciones y seed
│   ├── src/modules/     # Dominios (auth, characters, staff, departments, …)
│   └── uploads/         # Archivos subidos (no versionado)
├── web/                 # Frontend Vite (SPA-like)
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── layouts/
├── database/            # docker-compose.yml (PostgreSQL)
└── docs/                # PRD, arquitectura y roadmap
```

---

## Módulos principales

- **Personal médico** — fichas institucionales, rangos y asignación a departamentos
- **Departamentos** — unidades médicas / especialidades del SAED
- **Informes médicos** — registro y seguimiento de atención
- **Expedientes / casos** — historial clínico e institucional asociado al personaje
- **Academia** — formación y progresión del personal
- **Denuncias** — canal ciudadano (complaints) con seguimiento en tiempo real
- **Noticias / CMS** — contenidos públicos de la landing
- **Notificaciones, premios, auditoría y settings** — soporte institucional

---

## Requisitos

- **Node.js** 20+ (LTS; requerido por NestJS 11 / Nixpacks en Railway)
- **npm** 10+
- **PostgreSQL** 16 (local o Docker)
- **Docker Desktop** (opcional, para levantar Postgres)

---

## Instalación

```bash
git clone https://github.com/IrmaoSh4dow/saed-system.git
cd saed-system
```

### 1. Base de datos

```bash
cd database
docker compose up -d
```

Credenciales por defecto del Compose: usuario `saed`, contraseña `saed`, base `saed`, puerto `5432`.

### 2. Backend

```bash
cd api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Health: `http://localhost:3000/api/v1/health`
- Uploads estáticos: `http://localhost:3000/uploads/...`

### 3. Frontend

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

- App: `http://localhost:5173`

---

## Variables de entorno

Plantillas:

- Raíz: [`.env.example`](.env.example) (referencia)
- API: [`api/.env.example`](api/.env.example)
- Web: [`web/.env.example`](web/.env.example)

### API (`api/.env`)

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto HTTP (default `8080`) |
| `API_PREFIX` | Prefijo REST (default `api/v1`) |
| `FRONTEND_URL` | Origen CORS del frontend |
| `DATABASE_URL` | Cadena PostgreSQL para Prisma (ej. `postgresql://saed:saed@localhost:5432/saed?schema=public`) |
| `JWT_SECRET` | Secreto JWT (≥ 16 caracteres) |
| `JWT_ACCESS_EXPIRES_IN` | Expiración access token |
| `JWT_REFRESH_EXPIRES_IN` | Expiración refresh token |

### Web (`web/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL de la API |
| `VITE_SOCKET_URL` | Origen Socket.IO |
| `VITE_USE_API_AUTH` | `true` para identidad vía API |

**Nunca subas archivos `.env` reales al repositorio.**

En Railway el API **falla al arrancar** si faltan `FRONTEND_URL`, `DATABASE_URL` o `JWT_SECRET`. Configúralas en el panel del servicio (ver [docs/RAILWAY.md](docs/RAILWAY.md)).

Dump SQL completo (esquema + datos locales) para importar:

[`database/dumps/saed-full-dump.sql`](database/dumps/saed-full-dump.sql)

---

## Migraciones y seed

```bash
cd api
npx prisma migrate deploy    # aplica migraciones pendientes
npx prisma migrate dev       # desarrollo (crea migraciones)
npm run prisma:seed          # roles, permisos, rangos, departamentos
npx prisma studio            # UI opcional
```

---

## Scripts disponibles

### API (`api/`)

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Nest en modo watch |
| `npm run build` | Compilación producción |
| `npm run start:prod` | Ejecuta `dist/main` |
| `npm run start:railway` | `prisma migrate deploy` + producción |
| `npm run prisma:generate` | Genera Prisma Client |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:seed` | Semilla inicial |
| `npm run lint` | ESLint |

### Web (`web/`)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Build estático |
| `npm run preview` | Preview del build |
| `npm run lint` | ESLint |

---

## Capturas

> Sección reservada para capturas de la landing, dashboard y módulos principales.

<!--
docs/screenshots/
  landing.png
  dashboard.png
  academy.png
-->

---

## Licencia

Proyecto privado (`UNLICENSED`). Todos los derechos reservados salvo acuerdo distinto del autor.
