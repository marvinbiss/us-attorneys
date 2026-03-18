---
name: validate-db
description: Cross-reference all Supabase queries against migration files. Catches phantom columns before they crash at runtime.
user_invocable: true
---

# Validate DB Queries

Scan codebase for Supabase queries and verify every column/table against migrations.

## Step 1: Find all Supabase queries
Search for `.from(`, `.select(`, `.eq(`, `.order(`, `.in(` patterns in `src/` directory.

## Step 2: Build migration schema
Read all files in `supabase/migrations/` and extract:
- Table names (CREATE TABLE)
- Column names (column definitions + ALTER TABLE ADD COLUMN)
- Foreign keys (REFERENCES)

## Step 3: Cross-reference
For each query found in Step 1:
1. Verify the table exists in migrations
2. Verify each column in `.select()`, `.eq()`, `.order()` exists on that table
3. Verify FK joins reference real relationships

## Step 4: Report
```
✅ 142 queries validated — no issues
❌ 3 phantom columns found:
  - src/app/api/reviews/route.ts:45 — 'attorney_id' on 'reviews' → should be 'artisan_id'
  - ...
```
