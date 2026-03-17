#!/bin/bash
# ==========================================================================
# Apply Migration 403 + Run Statute of Limitations Ingestion
# ==========================================================================
#
# USAGE:
#   # Option 1: Set DB password inline
#   SUPABASE_DB_PASSWORD="your-password" bash scripts/apply-migration-and-ingest.sh
#
#   # Option 2: Set DATABASE_URL inline
#   DATABASE_URL="postgresql://postgres.zmggsqmibekiogpwhlpr:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres" bash scripts/apply-migration-and-ingest.sh
#
#   # Option 3: Use Supabase CLI with access token
#   SUPABASE_ACCESS_TOKEN="sbp_..." bash scripts/apply-migration-and-ingest.sh
#
# Get DB password from:
#   https://supabase.com/dashboard/project/zmggsqmibekiogpwhlpr/settings/database
# ==========================================================================

set -euo pipefail

echo "=== Step 1: Load env vars ==="
export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

echo ""
echo "=== Step 2: Apply Migration 403 ==="
npx tsx scripts/ingest/apply-migration-403.ts

echo ""
echo "=== Step 3: Run SOL Phase 1 (priority practice areas) ==="
npx tsx scripts/ingest/statute-of-limitations.ts --phase 1

echo ""
echo "=== Step 4: Run SOL Phase 2 (all practice areas) ==="
npx tsx scripts/ingest/statute-of-limitations.ts --phase 2

echo ""
echo "=== DONE ==="
