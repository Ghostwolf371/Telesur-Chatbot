#!/usr/bin/env bash
# Smoke-test script for Render / local deployment (no Docker required)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "[1/5] Run API + data-path smoke checks"
cd backend && python scripts/smoke_check.py && cd ..

echo "[2/5] Health-check endpoint"
curl -sf "$BACKEND_URL/api/health" | python -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d,indent=2)); sys.exit(0 if d['status']=='ok' else 1)"

echo "[3/5] Verify frontend /chat route"
curl -sf "$FRONTEND_URL/chat" | grep -q "TeleBot Support Assistant"
echo "[ok] frontend /chat"

echo "[4/5] Verify frontend /monitor route"
curl -sf "$FRONTEND_URL/monitor" | grep -q "TeleBot Monitoring Dashboard"
echo "[ok] frontend /monitor"

echo "[5/5] Show user-testing threshold status (non-blocking)"
cd backend && python scripts/check_validation_thresholds.py && cd ..

echo "==> All smoke tests passed!"

echo "All infrastructure smoke checks passed."
