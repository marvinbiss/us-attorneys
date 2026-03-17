#!/usr/bin/env bash
# =============================================================================
# Pre-commit hook: scan staged files for leaked secrets
# Install: cp scripts/check-secrets.sh .git/hooks/pre-commit
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

FOUND=0

# Only scan staged files (skip deletions)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=d 2>/dev/null || true)

if [ -z "$STAGED_FILES" ]; then
  echo -e "${GREEN}No staged files to scan.${NC}"
  exit 0
fi

echo "Scanning staged files for secrets..."

# --------------------------------------------------------------------------
# 1. JWT tokens (eyJ prefix — base64-encoded JSON header)
# --------------------------------------------------------------------------
JWT_HITS=$(echo "$STAGED_FILES" | xargs grep -lnP 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+' 2>/dev/null || true)
if [ -n "$JWT_HITS" ]; then
  echo -e "${RED}BLOCKED: JWT token pattern (eyJ...) found in:${NC}"
  echo "$JWT_HITS"
  FOUND=1
fi

# --------------------------------------------------------------------------
# 2. Stripe keys (sk_live_, sk_test_, pk_live_, pk_test_)
#    Ignore .env.example which contains placeholder patterns like sk_test_...
# --------------------------------------------------------------------------
STRIPE_HITS=$(echo "$STAGED_FILES" | grep -v '\.env\.example$' | xargs grep -lnP '(sk_live_|sk_test_|pk_live_|pk_test_)[A-Za-z0-9]{10,}' 2>/dev/null || true)
if [ -n "$STRIPE_HITS" ]; then
  echo -e "${RED}BLOCKED: Stripe key found in:${NC}"
  echo "$STRIPE_HITS"
  FOUND=1
fi

# --------------------------------------------------------------------------
# 3. Supabase service role key pattern (eyJ... with service_role claim)
#    The anon key is public; service_role key is the dangerous one.
#    Service role keys are JWTs, so this overlaps with check 1 but is explicit.
# --------------------------------------------------------------------------
SUPA_HITS=$(echo "$STAGED_FILES" | xargs grep -lnP 'service_role.*eyJ|eyJ[A-Za-z0-9_-]{100,}' 2>/dev/null || true)
if [ -n "$SUPA_HITS" ]; then
  echo -e "${RED}BLOCKED: Possible Supabase service role key found in:${NC}"
  echo "$SUPA_HITS"
  FOUND=1
fi

# --------------------------------------------------------------------------
# 4. Generic long base64 strings (> 40 chars) that look like API keys
#    Only flag in .ts/.tsx/.js/.jsx files, skip test files and .env.example
#    Pattern: assignment to a variable with a long base64 string
# --------------------------------------------------------------------------
GENERIC_HITS=$(echo "$STAGED_FILES" \
  | grep -E '\.(ts|tsx|js|jsx)$' \
  | grep -v '\.test\.' \
  | grep -v '__tests__' \
  | grep -v '\.env' \
  | xargs grep -lnP "(?:key|token|secret|password|credential)\s*[:=]\s*['\"][A-Za-z0-9+/=_-]{40,}['\"]" 2>/dev/null || true)
if [ -n "$GENERIC_HITS" ]; then
  echo -e "${RED}BLOCKED: Possible hardcoded API key/secret (>40 char base64) found in:${NC}"
  echo "$GENERIC_HITS"
  FOUND=1
fi

# --------------------------------------------------------------------------
# 5. .env files should never be committed (belt-and-suspenders)
# --------------------------------------------------------------------------
ENV_HITS=$(echo "$STAGED_FILES" | grep -P '^\.env\.local$|^\.env\.production$|^\.env\.development$' || true)
if [ -n "$ENV_HITS" ]; then
  echo -e "${RED}BLOCKED: .env file staged for commit:${NC}"
  echo "$ENV_HITS"
  FOUND=1
fi

# --------------------------------------------------------------------------
# Result
# --------------------------------------------------------------------------
if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo -e "${RED}Secret scan FAILED. Remove secrets before committing.${NC}"
  echo "If this is a false positive, use: git commit --no-verify"
  exit 1
fi

echo -e "${GREEN}Secret scan passed — no secrets detected.${NC}"
exit 0
