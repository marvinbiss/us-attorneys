# Database Backup Runbook — US Attorneys

## Overview

This runbook documents the backup and recovery strategy for the US Attorneys Supabase PostgreSQL database. The database currently holds ~360K attorney records, enrichment tables, and all platform data.

**Database**: Supabase (PostgreSQL 15)
**Plan**: Supabase Pro (daily automated backups, 7-day retention)
**RPO** (Recovery Point Objective): 24 hours (daily backup) / minutes (PITR if enabled)
**RTO** (Recovery Target): < 2 hours

---

## 1. Supabase Automated Backups (Pro Plan)

Supabase Pro includes **daily automated backups** with 7-day retention. These are managed by Supabase and require no manual intervention.

### What is backed up
- All tables (attorneys, specialties, locations_us, states, counties, etc.)
- All indexes, constraints, triggers, functions
- Row Level Security policies
- Storage bucket metadata (not file contents — those are on Supabase Storage separately)

### What is NOT backed up automatically
- Supabase Storage files (portfolio images, avatars) — use Supabase Storage replication or manual export
- Edge Functions (version-controlled in repo)
- Environment variables / secrets (stored in Vercel / .env.local)

### Viewing backups
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) > Project > Database > Backups
2. Verify the latest backup timestamp and status

---

## 2. Manual Backup with pg_dump

For ad-hoc backups before major migrations or data operations.

### Prerequisites
- `pg_dump` installed (PostgreSQL client tools)
- Database connection string (`SUPABASE_DB_URL` from Supabase Dashboard > Settings > Database)
- Network access to Supabase (not blocked by firewall)

### Full database dump

```bash
# Set connection string (from Supabase Dashboard > Settings > Database > Connection string > URI)
export SUPABASE_DB_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Full dump (custom format, compressed, includes schema + data)
pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --compress=9 \
  --verbose \
  --no-owner \
  --no-privileges \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Schema-only dump (for migration verification)

```bash
pg_dump "$SUPABASE_DB_URL" \
  --schema-only \
  --format=plain \
  --file="schema_$(date +%Y%m%d_%H%M%S).sql"
```

### Data-only dump (specific tables)

```bash
# Dump only attorney-related tables
pg_dump "$SUPABASE_DB_URL" \
  --data-only \
  --format=custom \
  --table=attorneys \
  --table=attorney_specialties \
  --table=attorney_education \
  --table=attorney_awards \
  --table=attorney_publications \
  --table=disciplinary_actions \
  --table=bar_admissions \
  --table=case_results \
  --file="attorneys_data_$(date +%Y%m%d_%H%M%S).dump"
```

### Backup file naming convention

```
backup_YYYYMMDD_HHMMSS.dump     — Full database
schema_YYYYMMDD_HHMMSS.sql      — Schema only
attorneys_data_YYYYMMDD.dump    — Attorney data only
pre_migration_NNN_YYYYMMDD.dump — Before migration NNN
```

### Backup storage
- Store backups in a secure location (encrypted S3 bucket, encrypted local drive)
- Retain at least 30 days of manual backups
- Keep pre-migration backups for at least 90 days

---

## 3. Point-in-Time Recovery (PITR)

PITR is available on Supabase Pro (must be enabled in project settings). It allows restoring to any point within the retention window.

### Enabling PITR
1. Supabase Dashboard > Project > Database > Backups > Enable PITR
2. Retention: 7 days (Pro) or 28 days (Enterprise)

### Performing PITR
1. Go to Supabase Dashboard > Database > Backups > Point in Time
2. Select the target timestamp (UTC)
3. Click "Start restore"
4. The restore creates a NEW project — it does not overwrite the existing one
5. After verification, update DNS / environment variables to point to the new project

### When to use PITR
- Accidental mass deletion or corruption
- Bad migration that cannot be rolled back
- Data integrity issue discovered hours after the incident

---

## 4. Verification Steps

Every backup must be verified. An unverified backup is not a backup.

### 4a. Restore to staging

```bash
# Create a staging database (use a separate Supabase project or local PostgreSQL)
export STAGING_DB_URL="postgresql://postgres:password@localhost:5432/us_attorneys_staging"

# Restore the backup
pg_restore \
  --dbname="$STAGING_DB_URL" \
  --verbose \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  backup_20260318_060000.dump
```

### 4b. Count checks

After restoring to staging, verify record counts match production:

```sql
-- Run on both production and staging, compare results
SELECT 'attorneys' AS tbl, COUNT(*) FROM attorneys
UNION ALL
SELECT 'attorney_specialties', COUNT(*) FROM attorney_specialties
UNION ALL
SELECT 'attorney_education', COUNT(*) FROM attorney_education
UNION ALL
SELECT 'attorney_awards', COUNT(*) FROM attorney_awards
UNION ALL
SELECT 'attorney_publications', COUNT(*) FROM attorney_publications
UNION ALL
SELECT 'disciplinary_actions', COUNT(*) FROM disciplinary_actions
UNION ALL
SELECT 'locations_us', COUNT(*) FROM locations_us
UNION ALL
SELECT 'states', COUNT(*) FROM states
UNION ALL
SELECT 'counties', COUNT(*) FROM counties
UNION ALL
SELECT 'bar_admissions', COUNT(*) FROM bar_admissions
UNION ALL
SELECT 'specialties', COUNT(*) FROM specialties
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;
```

### 4c. Integrity checks

```sql
-- Verify foreign key integrity (should return 0 rows)
SELECT a.id, a.name
FROM attorneys a
LEFT JOIN attorney_specialties ats ON a.id = ats.attorney_id
WHERE a.primary_specialty_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM specialties s WHERE s.id = a.primary_specialty_id);

-- Verify RLS policies exist on critical tables
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('attorneys', 'attorney_education', 'attorney_awards',
                     'disciplinary_actions', 'attorney_publications')
ORDER BY tablename;

-- Verify indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'attorney%'
ORDER BY tablename, indexname;
```

### 4d. Acceptance criteria for a valid backup
- [ ] All table counts within 1% of production (allow for ongoing writes)
- [ ] No foreign key violations on restored data
- [ ] RLS policies present on all critical tables
- [ ] All expected indexes exist
- [ ] Sample queries return expected results (e.g., attorney search by state)

---

## 5. Recommended Cron Schedule

### Automated (Supabase Pro — already active)
| Schedule | Type | Retention |
|----------|------|-----------|
| Daily at 03:00 UTC | Full backup | 7 days |
| Continuous (if PITR enabled) | WAL archiving | 7 days |

### Manual (operator-initiated)
| Trigger | Type | Retention |
|---------|------|-----------|
| Before any migration (429+) | Full pg_dump | 90 days |
| Before bulk data ingestion | Attorney data dump | 30 days |
| Weekly (Monday 06:00 UTC) | Full pg_dump to S3 | 30 days |
| Monthly (1st, 06:00 UTC) | Full pg_dump + schema dump | 1 year |

### Suggested crontab (on a CI runner or admin server)

```cron
# Weekly full backup (Monday 6 AM UTC)
0 6 * * 1 /opt/scripts/backup-us-attorneys.sh full >> /var/log/backup-us-attorneys.log 2>&1

# Monthly archival backup (1st of month, 6 AM UTC)
0 6 1 * * /opt/scripts/backup-us-attorneys.sh archive >> /var/log/backup-us-attorneys.log 2>&1
```

---

## 6. Emergency Restore Procedure

### Scenario: Production data corruption or loss

**Estimated time**: 30-120 minutes depending on database size and method.

#### Step 1: Assess the damage (5 min)
```bash
# Connect to production and check what's affected
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM attorneys;"
psql "$SUPABASE_DB_URL" -c "SELECT MAX(updated_at) FROM attorneys;"
```

#### Step 2: Stop writes immediately (2 min)
- Set Vercel environment `MAINTENANCE_MODE=true` and redeploy, OR
- Temporarily revoke RLS INSERT/UPDATE policies on affected tables

#### Step 3: Choose restore method

**Option A: Supabase Dashboard restore (simplest)**
1. Go to Supabase Dashboard > Database > Backups
2. Select the most recent clean backup
3. Click "Restore" (this overwrites the current database)
4. Wait for restore to complete (progress shown in dashboard)
5. Verify with count checks (Section 4b)

**Option B: PITR restore (most precise)**
1. Identify the exact timestamp before corruption
2. Supabase Dashboard > Database > Backups > Point in Time
3. Enter the target timestamp
4. Restore creates a new project — migrate traffic after verification

**Option C: pg_restore from manual backup (most control)**
```bash
# Restore from the latest manual backup
pg_restore \
  --dbname="$SUPABASE_DB_URL" \
  --verbose \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --single-transaction \
  backup_YYYYMMDD_HHMMSS.dump
```

#### Step 4: Verify restoration (10 min)
- Run count checks (Section 4b)
- Run integrity checks (Section 4c)
- Test critical API endpoints: `/api/health`, `/api/attorneys?limit=5`

#### Step 5: Resume operations (5 min)
- Remove maintenance mode (`MAINTENANCE_MODE=false`)
- Invalidate all caches: restart Vercel deployment
- Monitor logs for errors in the next 30 minutes

#### Step 6: Post-mortem
- Document what happened, when, and root cause
- Update this runbook if the procedure was insufficient
- Add preventive measures (e.g., pre-migration backup enforcement)

---

## 7. Contacts

| Role | Contact | When |
|------|---------|------|
| Database admin | (add contact) | Any backup/restore issue |
| Supabase support | support@supabase.com | Platform-level issues, PITR failures |
| Vercel support | (dashboard) | Deployment issues after restore |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-03-18 | Initial | Created runbook with backup, PITR, verification, and emergency procedures |
