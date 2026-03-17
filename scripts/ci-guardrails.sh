#!/usr/bin/env bash
# CI Guardrails — catches common code quality issues before they reach production.
# Usage: bash scripts/ci-guardrails.sh

set -euo pipefail

ERRORS=0
WARNINGS=0

echo "=== CI Guardrails ==="
echo ""

# 1. Check for console.log in production code (should use logger)
echo "--- Check: console.log in production code (use logger instead) ---"
CONSOLE_HITS=$(grep -rn 'console\.log' src/app/ src/lib/ src/components/ \
  --include='*.ts' --include='*.tsx' \
  --exclude='*.test.*' --exclude='*.spec.*' \
  2>/dev/null || true)

if [ -n "$CONSOLE_HITS" ]; then
  COUNT=$(echo "$CONSOLE_HITS" | wc -l)
  echo "FAIL: Found $COUNT console.log statements in production code."
  echo "      Use logger.info/warn/error from @/lib/logger instead."
  echo "$CONSOLE_HITS" | head -10
  if [ "$COUNT" -gt 10 ]; then
    echo "      ... and $(( COUNT - 10 )) more"
  fi
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: No console.log in production code."
fi
echo ""

# 2. Check for select('*') in Supabase queries
echo "--- Check: select('*') in Supabase queries ---"
SELECT_STAR_HITS=$(grep -rn "\.select(['\"]\\*['\"])" src/ \
  --include='*.ts' --include='*.tsx' \
  --exclude='*.test.*' --exclude='*.spec.*' \
  2>/dev/null || true)

if [ -n "$SELECT_STAR_HITS" ]; then
  COUNT=$(echo "$SELECT_STAR_HITS" | wc -l)
  echo "FAIL: Found $COUNT select('*') calls. Always specify columns explicitly."
  echo "$SELECT_STAR_HITS" | head -10
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: No select('*') found."
fi
echo ""

# 3. Check for hardcoded localhost URLs
echo "--- Check: Hardcoded localhost URLs ---"
LOCALHOST_HITS=$(grep -rn 'http://localhost' src/ \
  --include='*.ts' --include='*.tsx' \
  --exclude='*.test.*' --exclude='*.spec.*' \
  --exclude='setup.ts' \
  2>/dev/null || true)

if [ -n "$LOCALHOST_HITS" ]; then
  COUNT=$(echo "$LOCALHOST_HITS" | wc -l)
  echo "FAIL: Found $COUNT hardcoded localhost URLs."
  echo "      Use NEXT_PUBLIC_SITE_URL or environment variables instead."
  echo "$LOCALHOST_HITS" | head -10
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: No hardcoded localhost URLs."
fi
echo ""

# 4. Check TODO/FIXME/HACK count
echo "--- Check: TODO/FIXME/HACK comment count ---"
TODO_COUNT=$(grep -rn 'TODO\|FIXME\|HACK' src/ \
  --include='*.ts' --include='*.tsx' \
  2>/dev/null | wc -l || echo "0")

if [ "$TODO_COUNT" -gt 50 ]; then
  echo "WARN: Found $TODO_COUNT TODO/FIXME/HACK comments (threshold: 50)."
  echo "      Consider cleaning up technical debt."
  WARNINGS=$((WARNINGS + 1))
else
  echo "PASS: $TODO_COUNT TODO/FIXME/HACK comments (under threshold of 50)."
fi
echo ""

# Summary
echo "=== Summary ==="
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "Guardrails FAILED with $ERRORS error(s). Fix the issues above."
  exit 1
fi

echo ""
echo "Guardrails PASSED."
exit 0
