#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANVIL_PID_FILE="/tmp/prediction-anvil.pid"

echo "Stopping local chain process started by dev-up..."
if [ -f "$ANVIL_PID_FILE" ]; then
  ANVIL_PID="$(cat "$ANVIL_PID_FILE")"
  if [ -n "$ANVIL_PID" ] && kill -0 "$ANVIL_PID" >/dev/null 2>&1; then
    kill "$ANVIL_PID" >/dev/null 2>&1 || true
  fi
  rm -f "$ANVIL_PID_FILE"
fi

echo "Stopping PostgreSQL Docker service..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yml" down

echo "Done."
