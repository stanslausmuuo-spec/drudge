#!/usr/bin/env bash
set -e

echo "=== Jarvis SRE Infrastructure Health Check ==="

SERVICES=(
  "Whisper ASR:http://localhost:9000"
  "Piper TTS:http://localhost:5000"
  "Next.js Frontend:http://localhost:3000"
)

FAILED=0

for svc in "${SERVICES[@]}"; do
  NAME="${svc%%:*}"
  URL="${svc#*:}"
  echo -n "Checking $NAME ($URL)... "
  if curl -sSf --max-time 5 "$URL" > /dev/null 2>&1; then
    echo "HEALTHY [OK]"
  else
    echo "UNHEALTHY [FAIL]"
    FAILED=$((FAILED + 1))
  fi
done

if [ $FAILED -gt 0 ]; then
  echo "=== Health Check Failed: $FAILED service(s) unhealthy ==="
  exit 1
else
  echo "=== All Services Healthy & Operational ==="
  exit 0
fi
