#!/usr/bin/env bash
set -e

echo "=== Jarvis DevSecOps Security Audit ==="

echo "[1/3] Auditing Frontend Dependencies (npm audit)..."
if [ -f package.json ]; then
  npm audit --audit-level=high || echo "Warning: High severity vulnerabilities found in npm dependencies."
else
  echo "package.json not found, skipping npm audit."
fi

echo "[2/3] Auditing Python Agent Dependencies..."
if [ -f agent/requirements.txt ]; then
  pip install --quiet pip-audit || true
  pip-audit -r agent/requirements.txt || echo "Warning: Vulnerabilities detected in Python requirements."
else
  echo "agent/requirements.txt not found, skipping python audit."
fi

echo "[3/3] Scanning for Hardcoded Secrets / Credentials..."
if command -v git &> /dev/null; then
  # Basic grep scan for potential api keys or secrets in code (excluding example files)
  git grep -iE "api_key\s*=\s*['\"'][a-zA-Z0-9_\-\]{10,}" -- ':!.env.example' ':!scripts/security-audit.sh' || echo "No obvious hardcoded API keys detected."
else
  echo "Git not available, skipping secret pattern scan."
fi

echo "=== Security Audit Complete ==="
