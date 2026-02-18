#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-prediction_local_dev_change_me}"
export PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
export CREATOR_ADDRESS="${CREATOR_ADDRESS:-0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266}"
export ORACLE_ADDRESS="${ORACLE_ADDRESS:-0x70997970c51812dc3a010c7d01b50e0d17dc79c8}"

export PORT="${PORT:-3001}"
export RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
export CHAIN_ID="${CHAIN_ID:-31337}"
export FACTORY_ADDRESS="${FACTORY_ADDRESS:-0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512}"
export CREATOR_PRIVATE_KEY="${CREATOR_PRIVATE_KEY:-$PRIVATE_KEY}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/prediction}"
export INDEXER_CONFIRMATIONS="${INDEXER_CONFIRMATIONS:-0}"
export INDEXER_POLL_INTERVAL_MS="${INDEXER_POLL_INTERVAL_MS:-3000}"
export INDEXER_BLOCK_RANGE="${INDEXER_BLOCK_RANGE:-200}"
export INDEXER_START_BLOCK="${INDEXER_START_BLOCK:--1}"
export SIWE_URI="${SIWE_URI:-http://127.0.0.1:3001}"
export SIWE_DOMAIN="${SIWE_DOMAIN:-}"
export SIWE_SESSION_TTL_SECONDS="${SIWE_SESSION_TTL_SECONDS:-3600}"
export SIWE_ISSUED_AT_WINDOW_SECONDS="${SIWE_ISSUED_AT_WINDOW_SECONDS:-300}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:8081,http://127.0.0.1:8081}"
export ADMIN_ADDRESSES="${ADMIN_ADDRESSES:-$CREATOR_ADDRESS}"

echo "[dev-start] bootstrap infra + contracts + prisma"
"$ROOT_DIR/scripts/dev-up.sh"

echo "[dev-start] backend env"
echo "  PORT=$PORT"
echo "  FACTORY_ADDRESS=$FACTORY_ADDRESS"
echo "  ADMIN_ADDRESSES=$ADMIN_ADDRESSES"
echo "  INDEXER_BLOCK_RANGE=$INDEXER_BLOCK_RANGE"

echo "[dev-start] starting backend..."
npm --prefix "$ROOT_DIR/backend" run start:dev
