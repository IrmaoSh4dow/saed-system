# Database dumps

## `saed-full-dump.sql`

Full PostgreSQL dump (schema + data) generated from the local development database for Railway import.

```bash
# Use the Railway Postgres *public* TCP URL (not the internal hostname)
psql "$DATABASE_URL" -f database/dumps/saed-full-dump.sql
```

The dump includes `--clean --if-exists` and will replace existing objects.

See [docs/RAILWAY.md](../docs/RAILWAY.md).
