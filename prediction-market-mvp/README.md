# Prediction Market MVP

This repository contains a minimal MVP for a prediction market with:

- Solidity contracts (Foundry)
- NestJS backend API
- React Native mobile app (Expo)

## Structure

- `contracts/`: EVM contracts, tests, deployment scripts
- `backend/`: NestJS API for SIWE auth, market metadata, and trade intents
- `mobile/`: React Native app for market list/create/trade intent preview
- `docs/`: architecture and operations documentation

## Quick start

Fast bootstrap (recommended):

```bash
npm run dev:up
```

One-command bootstrap + backend start:

```bash
npm run dev:start
```

This starts Postgres (Docker), starts Anvil, deploys contracts, exports ABI, and runs Prisma setup.

Install Foundry first (once):

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 1) Contracts

```bash
cd contracts
npm run build
npm test

# start local chain
anvil

# in another terminal deploy contracts
export PRIVATE_KEY=<deployer_private_key>
export CREATOR_ADDRESS=<creator_address>
export ORACLE_ADDRESS=<oracle_address>
npm run deploy:local
```

### 2) Backend

```bash
cd backend
npm install
export RPC_URL=http://127.0.0.1:8545
export FACTORY_ADDRESS=<deployed_factory_address>
export CREATOR_PRIVATE_KEY=<creator_private_key>
export ADMIN_ADDRESSES=<comma_separated_admin_wallets>
export CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
export DATABASE_URL=postgresql://postgres:prediction_local_dev_change_me@127.0.0.1:5432/prediction
export SIWE_URI=http://127.0.0.1:3001
npm run prisma:generate
npm run prisma:push
npm run start:dev
```

### 3) Mobile

```bash
cd mobile
npm install
export EXPO_PUBLIC_API_BASE=http://127.0.0.1:3001
export EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=<walletconnect_project_id>
npm run start
```

## E2E regression check

After backend is running (and `ADMIN_ADDRESSES` includes `QA_ADMIN_PRIVATE_KEY` wallet), run:

```bash
npm --prefix backend run qa:auth-markets-trades-indexer:e2e
```

## MVP notes

- Contracts implement a simple binary market (`YES` / `NO`) and USDC-like collateral.
- Backend can create markets on-chain, and includes a PostgreSQL event indexer.
- Backend persistence uses Prisma + PostgreSQL.
- SIWE is implemented with nonce generation and signature verification.

## Full architecture guide

See `docs/architecture-and-runbook.md`.
