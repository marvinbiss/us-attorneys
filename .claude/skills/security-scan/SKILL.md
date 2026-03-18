---
name: security-scan
description: Quick security scan — auth bypass, adminClient leaks, exposed secrets, missing rate limits.
user_invocable: true
---

# Security Scan

## 1. Auth on state-changing endpoints
Find all POST/PUT/DELETE/PATCH handlers and verify each checks authentication:
```bash
grep -rn "export async function POST\|export async function PUT\|export async function DELETE\|export async function PATCH" src/app/api/ --include="*.ts"
```
Each MUST have `getUser()`, `requireAuth`, or `requirePermission` before processing.

## 2. AdminClient in public routes
```bash
grep -rn "createAdminClient" src/app/api/ --include="*.ts" | grep -v "admin/" | grep -v "cron/"
```
Flag any non-admin, non-cron route using `createAdminClient()`.

## 3. Exposed secrets
```bash
grep -rn "SUPABASE_SERVICE_ROLE_KEY\|service_role\|STRIPE_SECRET_KEY\|RESEND_API_KEY" src/ --include="*.tsx" --include="*.ts" | grep -v ".env" | grep -v "lib/supabase/admin"
```
Flag any secret key referenced outside its designated module.

## 4. Missing rate limiting
Check all public GET/POST endpoints have rate limiting (either middleware or handler-level).

## 5. Report
```
🔴 P0: [description] — file:line
🟡 P1: [description] — file:line
✅ No issues in [category]
```
