SHELL := /usr/bin/env bash
.PHONY: help setup dev build start up down logs audit healthcheck evaluate analytics research readiness purple-team pentest clean

help:
	@echo "=== Jarvis Internal Developer Platform (IDP) ==="
	@echo "  make setup      - Initialize environment and install dependencies"
	@echo "  make dev        - Start Next.js frontend development server"
	@echo "  make up         - Start full infrastructure stack via Docker Compose"
	@echo "  make down       - Stop Docker Compose infrastructure stack"
	@echo "  make logs       - Tail container logs"
	@echo "  make build      - Build Next.js app and Docker containers"
	@echo "  make audit      - Run DevSecOps security audit"
	@echo "  make healthcheck- Run SRE infrastructure health checks"
	@echo "  make evaluate   - Run MLOps agent evaluation & regression tests"
	@echo "  make analytics  - Run telemetry and performance analytics"
	@echo "  make research   - Run AI research cognitive architecture tests"
	@echo "  make readiness  - Run FDE customer environment readiness check"
	@echo "  make purple-team- Run Purple Team threat & security assessment"
	@echo "  make pentest    - Run authorized penetration tests & fuzzing"
	@echo "  make clean      - Remove build artifacts and caches"

setup:
	@if [ ! -f .env.local ]; then cp .env.example .env.local; echo "Created .env.local from .env.example"; fi
	npm install
	@echo "Setup complete."

dev:
	npm run dev

up:
	docker compose up -d
	@echo "Docker infrastructure stack started."

down:
	docker compose down
	@echo "Docker infrastructure stack stopped."

logs:
	docker compose logs -f

build:
	npm run build
	docker compose build

audit:
	./scripts/security-audit.sh

healthcheck:
	./scripts/healthcheck.sh

evaluate:
	python3 mlops/agent_eval.py

analytics:
	python3 datascience/telemetry_analytics.py

research:
	python3 research/test_cognitive.py

readiness:
	./scripts/fde-readiness.sh

purple-team:
	./scripts/purple-team-audit.sh

pentest:
	python3 security/pentest_assessment.py

clean:
	rm -rf .next node_modules agent/__pycache__ agent/.pytest_cache
	@echo "Cleaned build artifacts."
