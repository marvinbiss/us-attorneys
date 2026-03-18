# Supabase Connection Pooling — Configuration Guide

## Why Connection Pooling Matters

Vercel serverless functions spin up new instances on each request. Without pooling, each instance opens a direct PostgreSQL connection. Under load, this exhausts the Postgres `max_connections` limit (default: ~60 on Supabase free tier, ~200 on Pro).

**Symptoms of exhaustion:**
- `FATAL: too many connections for role "postgres"`
- `remaining connection slots are reserved for non-replication superuser connections`
- Random 500 errors under traffic spikes

## Supabase Built-in PgBouncer

Supabase includes PgBouncer (connection pooler) on every project. It is already running — you just need to use the pooler URL instead of the direct connection URL.

### Step 1: Enable Connection Pooling (Dashboard)

1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **Connection Pooling** section
3. Verify it shows **Enabled** (it is by default on all projects)
4. Note the **Pooler URL** — it uses port `6543` instead of `5432`

The pooler URL looks like:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Step 2: Recommended Settings for Vercel Serverless

| Setting | Recommended Value | Reason |
|---------|-------------------|--------|
| **Pool Mode** | `transaction` | Each serverless function uses the connection only for the duration of its transaction, then returns it to the pool. This is the only mode compatible with Vercel's ephemeral functions. |
| **Pool Size** | `15-20` | Supabase Pro tier allows ~200 direct connections. With `transaction` mode, 15-20 pooled connections can serve hundreds of concurrent serverless functions. Free tier: use `10`. |
| **Default Pool Size** | Supabase sets this automatically based on your plan. You can override it via Dashboard → Settings → Database → Connection Pooling → Pool Size. |

**Do NOT use `session` mode** with Vercel serverless — it holds connections open for the lifetime of the function, which defeats the purpose of pooling.

### Step 3: Configure the Supabase Client to Use the Pooler

The Supabase JavaScript client (`@supabase/supabase-js`) connects via the **REST API** (PostgREST), not directly to PostgreSQL. The REST API already uses pooled connections server-side, so **no client-side change is needed for `@supabase/supabase-js`**.

However, if you use direct PostgreSQL connections (e.g., in ingestion scripts, migrations, or server-side code using `pg` or `postgres` packages), you **must** use the pooler URL:

```typescript
// In .env.local — for direct PG connections (scripts, migrations)
SUPABASE_POOLER_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

// In ingestion scripts or any code using pg/postgres directly:
import postgres from 'postgres'
const sql = postgres(process.env.SUPABASE_POOLER_URL!)
```

### Step 4: Environment Variables

Add to `.env.local`:

```bash
# Connection pooler URL (PgBouncer, port 6543) — for direct PG connections
# Used by ingestion scripts and any code that connects directly to PostgreSQL.
# NOT needed for @supabase/supabase-js (REST API already pools server-side).
SUPABASE_POOLER_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Monitoring Connection Usage

### Via Supabase Dashboard
- **Dashboard** → **Database** → **Database Roles** → shows active connections per role
- **Dashboard** → **Reports** → **Database** → connection count over time

### Via SQL (run in SQL Editor)
```sql
-- Current active connections by application
SELECT application_name, state, count(*)
FROM pg_stat_activity
GROUP BY application_name, state
ORDER BY count DESC;

-- Total connections vs max
SELECT count(*) as current, setting as max
FROM pg_stat_activity, pg_settings
WHERE pg_settings.name = 'max_connections'
GROUP BY setting;
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `too many connections` | Switch to pooler URL, reduce pool size |
| `prepared statement does not exist` | You are in `transaction` mode — do NOT use prepared statements. Supabase JS client does not use them, but raw `pg` clients might. |
| Slow queries after enabling pooling | Normal — first query per transaction has ~1ms overhead for connection checkout. This is negligible compared to network latency. |
| Connection drops after 60s idle | Expected in `transaction` mode — connections are returned to pool after each transaction. Your client should handle reconnection (Supabase JS does this automatically). |
