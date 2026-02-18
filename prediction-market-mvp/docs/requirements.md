# Prediction Market App Requirement Document

## 1) Project Goal

Build a complete mobile prediction market application (React Native) with on-chain market contracts and NestJS backend, including wallet login, market list/detail, and buy/sell trading flow.

## 2) Scope

- Mobile app (React Native + Expo)
- Smart contracts (Foundry + Solidity)
- Backend API (NestJS)
- Event indexing + persistence (Prisma + PostgreSQL)
- Local development infrastructure (Docker + Anvil)

## 3) Functional Requirements (Checklist)

### 3.1 Mobile App UX/UI

- [x] Cyan theme as the primary visual style
- [x] Production-style app shell (not single-screen demo)
- [x] Navbar with left logo and right login button
- [x] Home page with market list
- [x] Tap market item to open market detail page
- [x] Backend endpoint configuration in-app
- [x] WalletConnect project id input in-app

### 3.2 Wallet & Auth

- [x] Login via WalletConnect from app
- [x] Wallet connection state visible in UI
- [x] Guard trading actions when wallet is not connected
- [x] SIWE endpoints available in backend (`/auth/siwe/nonce`, `/auth/siwe/verify`)

### 3.3 Market Flow

- [x] Fetch market list from backend (`GET /markets`)
- [x] Fetch market detail (`GET /markets/:id`)
- [x] Detail includes market status and pool values (`yesPool`, `noPool`)
- [x] Create market from backend on local chain (`POST /markets`)

### 3.4 Trading Flow (Buy/Sell)

- [x] Buy flow implemented
- [x] Sell flow implemented
- [x] Side selection implemented (`YES` / `NO`)
- [x] Buy uses approval flow first (`POST /trades/approve-intent`)
- [x] Trade intent endpoint supports action + side (`POST /trades/intent`)
- [x] Backend validates open market and close time before issuing trade intent
- [x] Backend validates sufficient shares before sell intent

### 3.5 Smart Contracts

- [x] Binary prediction market contract (`YES` / `NO`)
- [x] Buy methods (`buyYes`, `buyNo`)
- [x] Sell methods (`sellYes`, `sellNo`)
- [x] Resolve/cancel/claim flow
- [x] Factory contract to create markets
- [x] Mock USDC collateral for local environment
- [x] Contract tests include buy/sell and invariant coverage

### 3.6 Backend Architecture

- [x] NestJS modular structure (`auth`, `chain`, `markets`, `trades`, `indexer`, `prisma`)
- [x] On-chain market creation from backend signer
- [x] Chain snapshot reads from contract (status, pools, user shares)
- [x] ABI integration from Foundry exports

### 3.7 Persistence & Indexing

- [x] PostgreSQL integration
- [x] Prisma schema and client integration
- [x] Indexer cursor persistence
- [x] Indexed tables for markets, trades, claims
- [x] Trade action persistence (`BUY` / `SELL`)
- [x] Indexer API endpoint (`GET /indexer/markets`)

### 3.8 Local DevOps

- [x] Docker Compose for PostgreSQL
- [x] Foundry local deployment flow on Anvil
- [x] One-command bootstrap script (`dev:up`)
- [x] One-command shutdown script (`dev:down`)

## 4) API Requirements (Implemented)

- [x] `GET /health`
- [x] `GET /chain/config`
- [x] `GET /markets`
- [x] `GET /markets/:id`
- [x] `POST /markets`
- [x] `POST /trades/approve-intent`
- [x] `POST /trades/intent`
- [x] `GET /indexer/markets`
- [x] `GET /auth/siwe/nonce`
- [x] `POST /auth/siwe/verify`

## 5) Non-Functional Requirements

- [x] TypeScript typecheck passes for mobile app
- [x] Backend build passes
- [x] Contract tests pass (unit + fuzz + invariant)
- [x] Mobile/backend/contract structure separated and maintainable

## 6) Current Status Summary

- [x] Core end-to-end MVP is complete for local-chain operation
- [x] App supports market list/detail and buy/sell interaction flow
- [x] Backend supports approval + intent generation and on-chain validations
- [x] Contracts and indexer support trading lifecycle with persistence

## 7) Future Enhancements (Not part of current completed checklist)

- [ ] Portfolio/positions page in mobile app
- [ ] Transaction lifecycle UI (`pending/confirmed/indexed`)
- [ ] Production oracle dispute pipeline
- [ ] Reorg rollback reconciliation beyond confirmation delay
- [ ] Mainnet/testnet deployment hardening and monitoring
