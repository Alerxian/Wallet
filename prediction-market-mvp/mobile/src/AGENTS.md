# SRC KNOWLEDGE BASE

## OVERVIEW
`src/` holds all runtime application code; module boundaries are already explicit by directory.

## STRUCTURE
```txt
src/
├── app/          # app shell
├── screens/      # tab-level UI
├── hooks/        # orchestration side effects
├── services/     # adapter boundary
├── api/          # transport + schemas
├── state/        # Zustand store
├── utils/        # pure helpers + tests
├── config/       # env constants
├── domain/       # shared model types
└── theme/        # design tokens
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add/adjust tab UI | `screens/*`, `app/MainApp.tsx` | Pass behavior in from controller; keep screens mostly presentational |
| Change side effects | `hooks/useAppController.ts` | Hydration, polling, auth, wallet lifecycle are centralized |
| Backend contract update | `api/schemas.ts`, `services/backend.ts` | Keep schema + adapter updated together |
| State field changes | `state/store.ts` + controller | Add shape in store, then wire writes in controller |
| Utility algorithm changes | `utils/*.ts` + `utils/*.test.ts` | Keep pure functions test-covered |

## CONVENTIONS
- Prefer domain boundaries already present; avoid cross-import sprawl between sibling modules.
- Keep `screens/*` dumb; push IO/stateful logic into controller/services.
- When adding API fields, update zod schema first, then consuming code.

## ANTI-PATTERNS
- Avoid placing new network requests directly in screen components.
- Avoid direct deep-link/wallet SDK calls outside `services/walletconnect.ts`.
- Avoid adding new global state without a real cross-screen consumer.

## LOCAL GUIDES
- `src/hooks/AGENTS.md`
- `src/screens/AGENTS.md`
- `src/services/AGENTS.md`
- `src/utils/AGENTS.md`
