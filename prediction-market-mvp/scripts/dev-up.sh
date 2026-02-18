#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANVIL_PID_FILE="/tmp/prediction-anvil.pid"

if ! command -v anvil >/dev/null 2>&1 || ! command -v forge >/dev/null 2>&1; then
  if [ -f "$HOME/.zshenv" ]; then
    # shellcheck disable=SC1090
    source "$HOME/.zshenv"
  fi
fi

echo "[1/6] Starting PostgreSQL via Docker..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yml" up -d

echo "[2/6] Starting Anvil (if not running)..."
if ! pgrep -f "anvil" >/dev/null 2>&1; then
  nohup anvil --host 0.0.0.0 --port 8545 >/tmp/prediction-anvil.log 2>&1 &
  echo $! >"$ANVIL_PID_FILE"
  sleep 2
fi

echo "[3/6] Deploying contracts to local chain..."
cd "$ROOT_DIR/contracts"
export RPC_URL="http://127.0.0.1:8545"
export PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
export CREATOR_ADDRESS="${CREATOR_ADDRESS:-0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266}"
export ORACLE_ADDRESS="${ORACLE_ADDRESS:-0x70997970c51812dc3a010c7d01b50e0d17dc79c8}"

npm run deploy:local
npm run export:abi

echo "[4/6] Preparing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install

echo "[5/6] Generating Prisma client and pushing schema..."
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-prediction_local_dev_change_me}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/prediction}"
npm run prisma:generate
npm run prisma:push

echo "[6/6] Done. Next run commands:"
echo "  Backend: cd $ROOT_DIR/backend && PORT=3001 RPC_URL=http://127.0.0.1:8545 FACTORY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 CREATOR_PRIVATE_KEY=$PRIVATE_KEY DATABASE_URL=$DATABASE_URL npm run start:dev"
echo "  Mobile : cd $ROOT_DIR/mobile && npm install && npm run start"
