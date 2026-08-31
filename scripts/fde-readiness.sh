#!/usr/bin/env bash
set -e

echo "=== Jarvis FDE Customer Readiness & Environment Checker ==="

CHECKS_PASSED=0
CHECKS_TOTAL=5

# 1. Check Docker
echo -n "[1/5] Checking Docker daemon... "
if command -v docker &> /dev/null && docker info &> /dev/null; then
  echo "OK"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo "FAIL (Docker not running or not installed)"
fi

# 2. Check Docker Compose
echo -n "[2/5] Checking Docker Compose... "
if command -v docker compose &> /dev/null; then
  echo "OK"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo "FAIL (Docker Compose not found)"
fi

# 3. Check Node.js
echo -n "[3/5] Checking Node.js (v20+ recommended)... "
if command -v node &> /dev/null; then
  NODE_VER=$(node -v)
  echo "OK ($NODE_VER)"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo "FAIL (Node.js not found)"
fi

# 4. Check Python
echo -n "[4/5] Checking Python (3.11+ recommended)... "
if command -v python3 &> /dev/null; then
  PY_VER=$(python3 --version)
  echo "OK ($PY_VER)"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo "FAIL (Python 3 not found)"
fi

# 5. Check environment file
echo -n "[5/5] Checking environment configuration (.env.local)... "
if [ -f .env.local ]; then
  echo "OK"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
elif [ -f .env.example ]; then
  echo "WARNING (Copying .env.example to .env.local)..."
  cp .env.example .env.local
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo "FAIL (Missing .env.example)"
fi

echo "===================================================="
echo "FDE Readiness Score: $CHECKS_PASSED / $CHECKS_TOTAL checks passed."
if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
  echo "Customer environment is fully ready for Jarvis deployment!"
  exit 0
else
  echo "Please resolve failing checks before customer deployment."
  exit 1
fi
