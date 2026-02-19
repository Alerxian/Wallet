# HOOKS KNOWLEDGE BASE

## OVERVIEW
`useAppController` is the runtime orchestrator for auth lifecycle, data loading, pending polling, and tab-level actions.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Session hydration/recovery | `useAppController.ts` init effects | Reads persisted tab/wallet/token then restores session |
| Wallet connect/auth | `connectWallet`, `authenticate`, `recoverWallet` | WalletConnect + SIWE sequencing |
| Trade submit flow | `executeTrade`, `sendTx` | Approve-intent then trade-intent; pending tx insert |
| Polling and refresh | `refreshPending` + interval effect | Re-sync data when tx reaches indexed state |

## CONVENTIONS
- Keep new side effects inside well-named local functions, then call from focused effects/actions.
- Use `useStore.setState` updates that preserve unrelated fields.
- Guard network actions with wallet/auth preconditions before calling adapters.
- Keep effect dependency exceptions explicit and minimal (current file has targeted exhaustive-deps suppressions).

## ANTI-PATTERNS
- Do not add uncontrolled intervals/timeouts without cleanup.
- Do not write auth/session persistence logic into screens or utils.
- Do not emit raw backend errors to UI without `errorMessage` normalization.

## HIGH-RISK EDGES
- Wallet relay fallback and approval timeout path.
- SIWE signature method fallback (`personal_sign` param ordering).
- Session expiry timer and app foreground recovery interaction.

## SAFE EDIT ORDER
- Update pure helper logic first (`utils/*`) when possible.
- Update service adapters second (`services/*`) when API/wallet behavior changes.
- Touch controller orchestration last and keep effects narrowly scoped.
