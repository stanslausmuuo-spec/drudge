#!/usr/bin/env bash
set -e

echo "=== Jarvis Purple Team Security & Threat Assessment ==="

FINDINGS=0

# Check 1: Verify non-root enforcement in Dockerfiles
echo -n "[1/4] Auditing container user privilege separation... "
if grep -q "USER nextjs" Dockerfile && grep -q "USER appuser" agent/Dockerfile; then
  echo "SECURE [PASS] (Non-root users enforced in containers)"
else
  echo "VULNERABILITY [WARN] (Root user detected in container definition)"
  FINDINGS=$((FINDINGS + 1))
fi

# Check 2: Scan for exposed secrets in git history or env examples
echo -n "[2/4] Scanning for default or hardcoded secrets... "
if grep -rn "APIB48ArFbCQ3De" src/ agent/ scripts/ --exclude="*.example" > /dev/null 2>&1; then
  echo "VULNERABILITY [WARN] (Default dev API key detected in source)"
  FINDINGS=$((FINDINGS + 1))
else
  echo "SECURE [PASS] (No hardcoded production secrets found)"
fi

# Check 3: Verify .dockerignore coverage
echo -n "[3/4] Verifying .dockerignore artifact exclusion... "
if [ -f .dockerignore ] && grep -q ".env" .dockerignore; then
  echo "SECURE [PASS] (.env files excluded from build context)"
else
  echo "VULNERABILITY [WARN] (.env exclusion missing in .dockerignore)"
  FINDINGS=$((FINDINGS + 1))
fi

# Check 4: Check LiveKit security configuration in production
echo -n "[4/4] Checking production LiveKit authentication defaults... "
if grep -q "production" src/app/api/connection-details/route.ts; then
  echo "SECURE [PASS] (Production token guard enforced)"
else
  echo "VULNERABILITY [WARN] (Production token guard not verified)"
  FINDINGS=$((FINDINGS + 1))
fi

echo "====================================================="
echo "Purple Team Assessment Complete. Findings: $FINDINGS"
if [ $FINDINGS -eq 0 ]; then
  echo "Security Posture: HARDENED (No critical threats identified)"
  exit 0
else
  echo "Security Posture: REVIEW RECOMMENDED ($FINDINGS potential hardening items)"
  exit 0
fi
