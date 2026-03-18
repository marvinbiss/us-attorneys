---
name: fix-build
description: Run build, auto-fix all TypeScript errors, and re-verify. One command to green build.
user_invocable: true
---

# Fix Build

Automatically fix all build errors in a single pass.

## Step 1: Run build
```bash
npx next build 2>&1 | tail -80
```

## Step 2: Parse errors
For each error, categorize:
- **Unused import**: Remove it
- **Unused variable**: Prefix with `_` or remove if dead code
- **Type error**: Fix with proper types (NEVER use `any`)
- **Missing module**: Check if file exists, fix import path
- **Spread on iterator**: Replace `[...x]` with `Array.from(x)`
- **Zod v4**: `.issues` not `.errors`

## Step 3: Apply fixes
Fix ALL errors. Do NOT change business logic.

## Step 4: Re-verify
```bash
npx next build 2>&1 | tail -30
```

Repeat Steps 2-4 until build passes (max 3 iterations).

## Step 5: Report
List: files changed, errors fixed, final status.
