# UTILS KNOWLEDGE BASE

## OVERVIEW
`src/utils` contains pure, reusable helpers plus unit tests validating core business utilities.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Activity merge/dedup | `trade.ts`, `trade.test.ts` | Pending + indexed history consolidation |
| Wallet account/chain parsing | `wallet.ts`, `wallet.test.ts` | WalletConnect session parsing helpers |
| SIWE message composition | `siwe.ts`, `siwe.test.ts` | Deterministic auth message generation |
| Small async helper | `common.ts` | `wait(ms)` utility |

## CONVENTIONS
- Keep utilities side-effect free unless file purpose is explicitly async helper.
- Every non-trivial utility should have a corresponding `*.test.ts` file.
- Prefer deterministic inputs/outputs; avoid direct store/service imports in utils.

## ANTI-PATTERNS
- Do not place network, storage, or UI logic in utils.
- Do not add hidden date/time randomness without test control.
- Do not skip tests when touching merge/auth parsing logic.

## TEST COMMAND
```bash
npm run test
```

## SAFE EDIT ORDER
- Update utility implementation.
- Update or add matching `*.test.ts` coverage.
- Re-run tests before touching controller/service call sites.
