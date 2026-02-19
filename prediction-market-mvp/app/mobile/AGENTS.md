# MOBILE KNOWLEDGE BASE

**Generated:** 2026-02-19 16:49 (Asia/Shanghai)
**Scope:** `app/mobile/` only

## OVERVIEW

Expo React Native app workspace; all runnable commands, runtime entry points, and product logic live here.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| App bootstrap | `index.ts`, `App.tsx` | Expo root registration + app shell |
| Global state/actions | `src/store/appStore.ts` | single Zustand store for tabs, markets, trades, settings |
| API calls + schema parse | `src/api/marketApi.ts` | `ky` client + `zod` runtime parsing + mock fallback |
| Domain types | `src/types.ts` | shared contracts for store/screens/utils |
| Persistence helpers | `src/utils/storage.ts` | AsyncStorage keys and parsing ownership |
| Market query pipeline | `src/utils/marketFilters.ts` | search/filter/sort pure functions |
| Activity/trade logic | `src/utils/activity.ts`, `src/utils/trade.ts` | merge/filter activity + trade input validation |
| Theme tokens/palette | `src/theme/tokens.ts`, `src/theme/useThemePalette.ts` | palette + spacing + typography access |
| Screen flows | `src/screens/*.tsx` | MARKETS / DETAIL / PORTFOLIO / ACTIVITY / SETTINGS |
| Reusable UI | `src/components/ui/` | primitives (Button, Card, Input, Skeleton, etc.) |

## COMMANDS

```bash
npm run start
npm run ios
npm run android
npm run web
npm run typecheck
npm test
npm test -- --runInBand src/utils/__tests__/trade.test.ts
```

## CONVENTIONS (LOCAL)

- Keep routing state-driven via `currentTab` + `selectedMarketId`; no React Navigation introduced in this MVP.
- Keep API schema checks in `src/api/`; screens should consume store/api outputs, not parse responses directly.
- Keep AsyncStorage reads/writes in `src/utils/storage.ts`; screens should not own storage keys.
- Keep visual tokens in `src/theme/tokens.ts`; avoid hard-coded palette values scattered in screens.
- Preserve utility-first test focus under `src/utils/__tests__/` unless Jest matcher is expanded.

## ANTI-PATTERNS

- Do not add heavy state libraries; extend Zustand store slices/actions instead.
- Do not bypass `zod` parse at API boundary or move parsing into UI components.
- Do not remove mock fallback behavior without replacing developer/offline resiliency path.
- Do not add tests outside `src/utils/__tests__/` without updating Jest `testMatch`.

## NOTES

- No local lint/build scripts are defined; quality gates here are `npm run typecheck` and `npm test`.
- `docs/0-to-1-development-guide.md` is implementation-context documentation for this workspace.
