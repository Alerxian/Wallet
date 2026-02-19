# SERVICES KNOWLEDGE BASE

## OVERVIEW
Services form adapter boundaries: backend API methods, wallet transport, and persistence wrappers.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Backend endpoint mapping | `backend.ts` | `createBackend` wraps typed API calls |
| WalletConnect transport | `walletconnect.ts` | client init, connect/sign flow, timeout/fallback |
| Persistence policy | `storage.ts` | AsyncStorage + SecureStore access points |

## CONVENTIONS
- Keep SDK-specific calls encapsulated in service files.
- Return normalized values/errors up to controller; avoid UI coupling.
- Ensure any new backend method has matching schema in `src/api/schemas.ts`.
- Keep timeout behavior explicit for wallet operations.

## ANTI-PATTERNS
- Do not import React components/hooks into service modules.
- Do not bypass `ApiClient` and call `ky` directly from features.
- Do not persist auth tokens outside secure storage wrappers.

## CHANGE CHECKLIST
- Added endpoint? Update schema + backend adapter + controller call site.
- Added wallet method? Cover timeout and mobile deep-link return path.

## VALIDATION PATH
- Backend changes: run `npm run typecheck` and a wallet/auth happy path.
- Storage changes: verify token/session persistence after app restart.
- Wallet transport changes: verify connect, sign, and return-to-app behavior.
