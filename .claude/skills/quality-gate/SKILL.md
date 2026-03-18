---
name: quality-gate
description: Run full quality validation before commit/push. Checks build, DB columns, API consistency, security, and runtime safety.
user_invocable: true
---

# Quality Gate Checklist

Run these checks in order. Stop and fix any failures before proceeding.

## Step 1: TypeScript Build
```bash
npx next build 2>&1 | tail -30
```
If build fails, fix ALL errors before continuing.

## Step 2: Migration Number Conflicts
```bash
ls supabase/migrations/*.sql | sed 's/.*\///' | cut -d'_' -f1 | sort | uniq -d
```
If any duplicates found, renumber the newer file.

## Step 3: DB Column Validation (spot check)
For each NEW or MODIFIED API route that queries Supabase:
1. Identify the `.from('table')` calls
2. Read the corresponding migration file
3. Verify EVERY column in `.select()`, `.eq()`, `.order()` exists

## Step 4: Frontend-Backend Route Matching
```bash
# Find all fetch() calls to /api/ and check routes exist
grep -rn "fetch.*['\"]\/api\/" src/components/ src/app/ --include="*.tsx" --include="*.ts" | grep -oP "\/api\/[a-zA-Z0-9/_-]+" | sort -u
```
Cross-reference with actual route files in `src/app/api/`.

## Step 5: Auth on State-Changing Endpoints
```bash
# Find POST/PUT/DELETE handlers that might lack auth
grep -rn "export async function POST\|export async function PUT\|export async function DELETE\|export async function PATCH" src/app/api/ --include="*.ts"
```
Each one MUST verify authentication (check for `getUser()`, `requireAuth`, or `requirePermission`).

## Step 6: Security Quick Scan
```bash
# Check for createAdminClient in non-admin routes
grep -rn "createAdminClient" src/app/api/ --include="*.ts" | grep -v "admin/" | grep -v "cron/"
```
Flag any public endpoint using adminClient.

## Step 7: Commit
Only after steps 1-6 pass. Include what was validated in the commit message.
