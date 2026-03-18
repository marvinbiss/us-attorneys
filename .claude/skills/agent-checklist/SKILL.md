---
name: agent-checklist
description: Mandatory checklist that every background agent MUST complete before declaring its task done. Prevents the 40-P0 problem.
user_invocable: true
---

# Agent Self-Validation Checklist

**EVERY agent MUST run these checks on its own output before completing.**

## For new API routes created:
- [ ] Auth: POST/PUT/DELETE/PATCH handlers verify authentication
- [ ] Validation: All request params validated with Zod
- [ ] Response: Uses `{ success, data }` / `{ success, error }` format
- [ ] Rate limiting: Public endpoints have handler-level rate limit
- [ ] Error handling: try/catch with proper JSON error response
- [ ] RLS: Uses `createClient()` not `createAdminClient()` unless admin/cron
- [ ] Cache: GET responses have appropriate `Cache-Control` headers

## For new Supabase queries:
- [ ] Read the migration file for EACH table queried
- [ ] Verify EVERY column name in `.select()`, `.eq()`, `.in()`, `.order()`
- [ ] FK joins: verify the FK exists and the join syntax matches (`table!fk_column(cols)`)
- [ ] Supabase joins return ARRAYS not objects -- use `as unknown as Array<>` or `[0]`
- [ ] Handle `{ data: null, error }` case (null check before accessing data)

## For new components:
- [ ] Check no duplicate component with same purpose already exists
- [ ] framer-motion: uses `useReducedMotion()` when animations present
- [ ] Modals: have focus trap and restore focus on close
- [ ] Interactive elements: keyboard accessible (Enter/Space handlers)
- [ ] No `[...map]` or `[...set]` -- use `Array.from()`
- [ ] Large imports (recharts, leaflet): wrapped in `next/dynamic`

## For new migrations:
- [ ] Migration number is unique (no conflict with existing)
- [ ] Tables: use CREATE TABLE IF NOT EXISTS
- [ ] Columns: use ADD COLUMN IF NOT EXISTS
- [ ] FK targets exist in earlier migrations
- [ ] RLS policies reference correct column names

## Final check:
- [ ] `npx next build` passes with the new code
- [ ] No unused imports or variables
