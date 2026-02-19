# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-19 16:40:58 CST  
**Commit:** 4507429  
**Branch:** main

## OVERVIEW
Mobile client for a prediction market MVP. Stack is Expo + React Native + TypeScript + Zustand + ky + zod + WalletConnect v2.

## STRUCTURE
```txt
mobile/
├── App.tsx                    # app bootstrap wrapper
├── index.js                   # Expo root registration + walletconnect compat
├── src/
│   ├── app/                   # Main shell and tab wiring
│   ├── screens/               # Markets / Portfolio / Activity / Settings
│   ├── hooks/                 # runtime orchestration and side effects
│   ├── services/              # backend + walletconnect + storage adapters
│   ├── api/                   # transport + response schemas
│   ├── state/                 # global Zustand store
│   ├── utils/                 # pure utilities + unit tests
│   ├── config/                # env constants
│   ├── domain/                # shared domain types
│   └── theme/                 # design tokens
├── README.md                  # architecture + run flow
└── 1.md                       # rewrite design + mandatory checks
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App boot issues | `index.js`, `App.tsx` | Keep `@walletconnect/react-native-compat` import first in entry path |
| Tab rendering / UI flow | `src/app/MainApp.tsx`, `src/screens/*` | Main shell delegates actions/data into each tab screen |
| Auth/session bugs | `src/hooks/useAppController.ts`, `src/services/walletconnect.ts` | SIWE + WalletConnect + session recovery lives here |
| API response failures | `src/api/client.ts`, `src/api/schemas.ts`, `src/services/backend.ts` | Every response should pass zod guards |
| State mutation behavior | `src/state/store.ts`, `src/hooks/useAppController.ts` | Store is simple; orchestration hook owns most side effects |
| Activity merge logic | `src/utils/trade.ts`, `src/utils/trade.test.ts` | Pending/indexed merge and ordering |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `useAppController` | function | `src/hooks/useAppController.ts` | high | Core runtime orchestration: auth, polling, hydration, trades |
| `MainApp` | component | `src/app/MainApp.tsx` | medium | App shell that maps controller state into screens |
| `useStore` | Zustand store | `src/state/store.ts` | high | Shared app state for tabs/auth/markets/positions/activity |
| `createBackend` | function | `src/services/backend.ts` | medium | Typed endpoint adapters wrapping `ApiClient` |
| `ApiClient` | class | `src/api/client.ts` | medium | HTTP transport with auth token and error handling |
| `unifyActivity` | function | `src/utils/trade.ts` | medium | Merge pending txs + backend history |

## CONVENTIONS
- `tsconfig.json` enforces `strict: true`; keep new code strict-safe.
- No repo-level lint script; existing code uses targeted `eslint-disable-next-line react-hooks/exhaustive-deps` in `useAppController`.
- Keep API I/O validated through zod schemas before touching store state.
- Wallet flow assumes WalletConnect + SIWE and local chain testing on `31337`.

## ANTI-PATTERNS (THIS PROJECT)
- Do not bypass schema validation for backend responses.
- Do not mutate wallet/session state outside store + controller flow.
- Do not split auth tokens into plain `AsyncStorage`; sensitive values use `SecureStore`.
- Do not introduce additional monolithic side-effect centers; extend domain modules first.

## UNIQUE STYLES
- Product tone is a trading desk UI: high-contrast cards, explicit action chips, runtime diagnostics in settings.
- Tabs are product domains, not generic route placeholders.

## COMMANDS
```bash
npm install
npm run start
npm run android
npm run ios
npm run web
npm run typecheck
npm run test
```

## NOTES
- LSP TypeScript server is not installed in this environment; codemap here is derived from source/AST scans.
- Empty directories currently exist at `src/components/cards` and `src/components/trade`; treat as reserved extension points.
- See child guides for local rules: `src/AGENTS.md`, `src/hooks/AGENTS.md`, `src/screens/AGENTS.md`, `src/services/AGENTS.md`, `src/utils/AGENTS.md`.
