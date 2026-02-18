# Backend (NestJS)

This MVP backend provides:

- SIWE nonce and signature verification
- Market creation on local chain via factory contract
- Market metadata persistence via Prisma + PostgreSQL
- Trade intent generation (encodes contract call data)
- Chain config endpoint
- Event indexer to PostgreSQL (`indexed_markets`, `indexed_trades`, `indexed_claims`)

ABI source:

- `src/chain/abi/*.json` are exported from Foundry artifacts via `contracts/scripts/export-abi.mjs`

## Run

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run start:dev
```

For local chain mode, set these env vars before start:

```bash
RPC_URL=http://127.0.0.1:8545
FACTORY_ADDRESS=<deployed_factory_address>
CREATOR_PRIVATE_KEY=<anvil_or_local_creator_private_key>
DATABASE_URL=postgresql://postgres:prediction_local_dev_change_me@127.0.0.1:5432/prediction
INDEXER_CONFIRMATIONS=0
INDEXER_POLL_INTERVAL_MS=3000
INDEXER_BLOCK_RANGE=200
INDEXER_START_BLOCK=-1
SIWE_URI=http://127.0.0.1:3001
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
ADMIN_ADDRESSES=<comma_separated_admin_wallets>
```

## E2E regression

```bash
npm run qa:auth-markets-trades-indexer:e2e
```

Required env for this script:

- `QA_ADMIN_PRIVATE_KEY` (default: anvil account #0)
- `QA_USER_PRIVATE_KEY` (default: anvil account #1)
- backend must run with `ADMIN_ADDRESSES` containing admin wallet address

## Important endpoints

- `GET /health`
- `GET /auth/siwe/nonce?address=0x...`
- `POST /auth/siwe/verify`
- `GET /markets`
- `POST /markets`
- `POST /markets/:id/address`
- `POST /trades/intent`
- `POST /trades/approve-intent`
- `GET /chain/config`
- `GET /indexer/markets`
