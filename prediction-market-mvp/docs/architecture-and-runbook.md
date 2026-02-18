# Prediction Market MVP: Architecture and Runbook

## 1. Goals and boundaries

This MVP targets three deliverables in one repository:

1. On-chain binary prediction market contracts (`YES` / `NO`) on a local EVM chain.
2. NestJS backend that can:
   - create market on-chain via factory,
   - expose market/trade APIs,
   - verify SIWE signatures.
3. React Native client (last step) consuming backend APIs.

Scope intentionally excludes production-grade custody, full orderbook matching, and advanced oracle dispute arbitration.

## 2. Repository structure

```txt
prediction-market-mvp/
  contracts/              # Foundry contracts + tests + deploy scripts
  backend/                # NestJS API + chain integration + indexer
  mobile/                 # React Native (Expo) client
  docs/
    architecture-and-runbook.md
```

## 3. Technology choices and trade-offs

### 3.1 Contracts

- Stack: `Solidity 0.8.24 + Foundry + OpenZeppelin`
- Why Foundry:
  - Fast compile and test loops,
  - Native fuzz/invariant support,
  - Better fit for contract security iteration.
- Trade-off:
  - Less JS ecosystem convenience than Hardhat for some teams.

### 3.2 Backend

- Stack: `NestJS + ethers v6 + Prisma + PostgreSQL + class-validator`
- Why NestJS:
  - Clear module boundaries (auth, markets, trades, chain, indexer),
  - Good for incremental feature growth.
- Trade-off:
  - More boilerplate than minimalist frameworks.

### 3.3 Mobile

- Stack: `React Native (Expo) + TypeScript + WalletConnect v2 (SignClient)`
- Why Expo for MVP:
  - Fast iteration and simple local startup.
- Trade-off:
  - Some native wallet/deep-link customizations may later require prebuild/eject.

### 3.4 Data and indexing

- Primary truth: blockchain state.
- Query/read optimization: PostgreSQL indexer tables from events.
- Trade-off:
  - Requires keeping indexer cursor and reorg strategy.

## 4. On-chain architecture

### 4.1 Contracts

- `MockUSDC.sol`: local collateral token (6 decimals).
- `PredictionMarketFactory.sol`: creates market instances and stores `marketId -> marketAddress`.
- `PredictionMarket.sol`: holds pooled collateral, accepts buy orders, supports resolve/cancel/claim.

### 4.2 Core state machine

- `Open` -> users buy `YES` or `NO`.
- `Closed` -> trading ended.
- `Resolved` -> winning side can claim proportional payout.
- `Cancelled` -> all participants can refund stake.

### 4.3 Event surface (indexer source)

- Factory: `MarketCreated(marketId, market, closeTime)`.
- Market: `Traded(user, isYes, amount)`, `MarketResolved(outcome)`, `MarketClosed()`, `MarketCancelled()`, `Claimed(user, payout)`.

## 5. Backend architecture

### 5.1 Modules

- `auth`: SIWE nonce + signature verification.
- `chain`: RPC provider, factory interaction, chain config.
- `markets`: market APIs + on-chain creation path + Prisma persistence.
- `trades`: trade intent encoding (`buyYes` / `buyNo`) with on-chain validation.
- `indexer`: block polling, event parsing, Prisma writes.
- `prisma`: database client lifecycle and schema access.

### 5.2 Key business flows

#### Flow A: Create market

1. Client calls `POST /markets` with `question` and `closeTime`.
2. Backend signs transaction with configured creator key.
3. Backend calls factory `createMarket(closeTime)`.
4. Backend returns `marketId`, `marketAddress`, `txHash`.

#### Flow B: Create trade intent

1. Client calls `POST /trades/intent` with `marketId`, `walletAddress`, `side`, `amount`.
2. Backend validates market on-chain (`status == Open`, `now < closeTime`).
3. Backend returns encoded tx payload for wallet signing/broadcast.

#### Flow C: Event indexing

1. Indexer polls latest blocks with confirmation delay.
2. Parses factory and market events.
3. Upserts normalized rows to Postgres.
4. Stores cursor to continue from next block.

#### Flow D: Wallet transaction from mobile

1. Mobile connects wallet via WalletConnect session.
2. Mobile requests backend `POST /trades/intent`.
3. Mobile submits `eth_sendTransaction` with returned calldata.
4. Transaction hash is shown in app; indexer picks events asynchronously.

## 6. Key code map

- Contracts:
  - `contracts/contracts/PredictionMarket.sol`
  - `contracts/contracts/PredictionMarketFactory.sol`
  - `contracts/script/Deploy.s.sol`
  - `contracts/test/PredictionMarket.t.sol`
  - `contracts/test/invariant/PredictionMarket.invariant.t.sol`
- Backend:
  - `backend/src/chain/chain.service.ts`
  - `backend/src/markets/markets.service.ts`
  - `backend/src/trades/trades.service.ts`
  - `backend/src/indexer/indexer.service.ts`
  - `backend/src/prisma/prisma.service.ts`
- Mobile:
  - `mobile/App.tsx`

## 7. Environment variables

### 7.1 Contracts deploy

- `PRIVATE_KEY`: deployer private key.
- `CREATOR_ADDRESS`: creator role address.
- `ORACLE_ADDRESS`: oracle role address.
- `RPC_URL`: chain RPC URL.

### 7.2 Backend

- `PORT`: API port.
- `RPC_URL`: chain RPC URL.
- `FACTORY_ADDRESS`: deployed factory address.
- `CREATOR_PRIVATE_KEY`: creator signer private key for `POST /markets`.
- `CHAIN_ID`: chain id (default `31337`).
- `DATABASE_URL`: Postgres connection string for indexer.
- `INDEXER_CONFIRMATIONS`: blocks to wait before indexing.
- `INDEXER_POLL_INTERVAL_MS`: poll interval.
- `INDEXER_BLOCK_RANGE`: max block span per `eth_getLogs` call.
- `INDEXER_START_BLOCK`: optional initial cursor block (`-1` means start from latest safe block).
- `SIWE_DOMAIN`: optional domain override for SIWE message validation.
- `SIWE_URI`: expected SIWE `URI` claim.
- `SIWE_SESSION_TTL_SECONDS`: max server session ttl.
- `CORS_ORIGINS`: comma-separated allowed browser origins.
- `ADMIN_ADDRESSES`: comma-separated admin wallets allowed to create/bind markets.

## 8. Local startup guide (end-to-end)

### 8.1 Start local chain

```bash
anvil
```

### 8.0 One-command local bootstrap (recommended)

```bash
cd prediction-market-mvp
npm run dev:up
```

This command starts Docker Postgres, starts Anvil, deploys contracts, exports ABI, and runs Prisma push.

To bootstrap and immediately run backend in one command:

```bash
npm run dev:start
```

### 8.2 Deploy contracts

```bash
cd contracts
export PRIVATE_KEY=<anvil_deployer_private_key>
export CREATOR_ADDRESS=<anvil_account_address>
export ORACLE_ADDRESS=<anvil_account_address>
export RPC_URL=http://127.0.0.1:8545
npm run deploy:local
npm run export:abi
```

### 8.3 Start Postgres

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 8.4 Start backend

```bash
cd backend
export PORT=3001
export RPC_URL=http://127.0.0.1:8545
export FACTORY_ADDRESS=<factory_from_deploy_log>
export CREATOR_PRIVATE_KEY=<creator_private_key>
export ADMIN_ADDRESSES=<creator_wallet_address>
export CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/prediction
npm install
npm run prisma:generate
npm run prisma:push
npm run build
npm run start:dev
```

### 8.5 Start mobile app

```bash
cd mobile
npm install
npm run start
```

WalletConnect notes:

- Fill WalletConnect `project id` in app before connect.
- Local chain id is `31337`; wallet must support custom network for local tx send.

## 9. Deployment strategy (staging/prod)

1. Deploy contracts to target EVM network via Foundry script.
2. Verify bytecode and publish ABI artifacts.
3. Configure backend env (`RPC_URL`, `FACTORY_ADDRESS`, signer key in secret manager).
4. Run backend with managed Postgres.
5. Start indexer with confirmation delay (`>= 6` for testnet, higher in mainnet).
6. Point mobile env to backend base URL.

## 10. Known MVP limitations and next upgrades

- Reorg handling uses confirmation delay but no rollback reconciliation yet.
- No role management API for oracle/admin operations.
- WalletConnect requires valid project id and wallet support for local chain.
