#!/usr/bin/env bash
set -e

echo "=== Jarvis Production Deployment ==="

# Check environment file
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    echo "Warning: .env.local not found. Copying .env.example to .env.local..."
    cp .env.example .env.local
  else
    echo "Error: .env.local or .env.example required."
    exit 1
  fi
fi

echo "Building and starting Docker Compose stack (Production mode)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

echo "=== Jarvis Stack Successfully Deployed ==="
echo "Access Next.js frontend at http://localhost:3000"
