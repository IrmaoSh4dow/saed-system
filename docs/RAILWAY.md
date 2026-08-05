# Despliegue Railway — API

## Puertos

| Servicio | Target Port | Escucha |
|----------|-------------|---------|
| Frontend | `PORT` (normalmente 8080) | `process.env.PORT` |
| API | `PORT` (normalmente 8080) | `process.env.PORT` (default 8080 en `server.cjs`) |

Cada servicio Railway tiene su propio `PORT`. El API **no** fuerza 8081: usa el puerto inyectado o 8080 por defecto.

Opcional: `API_PORT` solo para overrides locales / Nest config.
