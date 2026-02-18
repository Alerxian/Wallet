# Mobile (React Native / Expo)

This is the fully rewritten mobile client for the prediction market MVP.

## What this app does

- markets tab with market list and detail trading ticket
- portfolio tab with wallet positions
- activity tab with merged pending/indexed trades
- settings tab for wallet/session status and diagnostics
- WalletConnect v2 login and SIWE session verification
- buy flow: `POST /trades/approve-intent` then `POST /trades/intent`
- sell flow: `POST /trades/intent`

## New architecture

- `src/app` app shell and tab orchestration
- `src/screens` feature screens by tab
- `src/components/shell` reusable shell components
- `src/hooks/useAppController.ts` runtime orchestration
- `src/services` backend + wallet + storage adapters
- `src/api` `ky` transport + `zod` response guards
- `src/state/store.ts` lightweight global state with `zustand`
- `src/utils` pure utilities and tests
- `src/theme` design tokens

## Environment

Copy `.env.example` to `.env`:

```bash
EXPO_PUBLIC_API_BASE=http://127.0.0.1:3001
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

Notes:

- Android emulator typically uses `http://10.0.2.2:3001`
- Local trade testing needs wallet support for chain `31337`

## Run

```bash
npm install
npm run start
```

## Quality gates

```bash
npm run typecheck
npm run test
```
