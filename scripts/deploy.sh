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

echo "Waiting for Ollama service to be ready..."
until docker exec jarvis-ollama ollama list > /dev/null 2>&1; do
  sleep 2
  echo -n "."
done
echo ""
echo "Ollama is online."

echo "Ensuring default model (llama3.1) is available..."
if ! docker exec jarvis-ollama ollama list | grep -q "llama3.1"; then
  echo "Pulling llama3.1 model (this may take a few minutes depending on network speed)..."
  docker exec -it jarvis-ollama ollama pull llama3.1
else
  echo "llama3.1 model already present."
fi

echo "=== Jarvis Stack Successfully Deployed ==="
echo "Access Next.js frontend at http://localhost:3000"
