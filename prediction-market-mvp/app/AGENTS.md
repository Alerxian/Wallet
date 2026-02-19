# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-19 16:49 (Asia/Shanghai)
**Commit:** 4507429
**Branch:** main

## OVERVIEW

Repository root holds execution/planning docs; runnable app is `mobile/` (Expo + React Native + TypeScript).
Treat `run.md` and `requirements-detailed.md` as hard behavioral constraints for implementation flow.

## STRUCTURE

```text
app/
|-- run.md                    # execution state machine and output constraints
|-- requirements-detailed.md  # full product requirements + DoD
|-- 1.md 2.md 3.md            # planning / phase template / final acceptance
|-- AGENTS.md                 # root cross-cutting guidance (this file)
`-- mobile/                   # runnable Expo project
    |-- App.tsx               # app shell and state-driven routing
    |-- index.ts              # Expo registerRootComponent entry
    |-- package.json          # real scripts and Jest matcher scope
    `-- src/                  # domain code: store/api/screens/components/theme/utils
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Run app / tests / typecheck | `mobile/package.json` | no lint/build scripts defined |
| Execution constraints | `run.md` | priority: run.md > requirements > 1/2/3 |
| Product requirements / DoD | `requirements-detailed.md` | includes mandatory gates `typecheck` + `test` |
| Runtime entry / shell | `mobile/index.ts`, `mobile/App.tsx` | state-driven tab/detail routing |
| Global state | `mobile/src/store/appStore.ts` | Zustand is single global state hub |
| API contract usage | `mobile/src/api/marketApi.ts` | `ky` + `zod`, mock fallback |
| Persistence | `mobile/src/utils/storage.ts` | AsyncStorage key ownership lives here |
| Theme system | `mobile/src/theme/tokens.ts` | `sand`/`night` palettes and tokens |
| Utility tests | `mobile/src/utils/__tests__/` | Jest matcher currently targets this subtree |

## CODE MAP

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `App` | function component | `mobile/App.tsx` | high | app shell, route transitions, theme ripple |
| `useAppStore` | Zustand store | `mobile/src/store/appStore.ts` | high | global app state + actions |
| `fetchMarkets` | async function | `mobile/src/api/marketApi.ts` | medium | market list load with schema parse |
| `fetchMarketById` | async function | `mobile/src/api/marketApi.ts` | medium | detail lookup with fallback |
| `runMarketPipeline` | utility function | `mobile/src/utils/marketFilters.ts` | medium | search/filter/sort pipeline |
| `loadSettings` / `saveSettings` | utility functions | `mobile/src/utils/storage.ts` | medium | persisted settings IO boundary |
| `getThemePalette` | utility function | `mobile/src/theme/tokens.ts` | high | central palette lookup |

## CONVENTIONS (DEVIATIONS ONLY)

- App-level implementation is nested in `mobile/`; run commands there, not at repo root.
- Routing is state-driven in `App.tsx` (`currentTab` + `selectedMarketId`), not React Navigation.
- CI/build automation files are absent in repo snapshot; quality gates are local script-driven.
- Jest `testMatch` is intentionally narrow: `**/src/utils/__tests__/**/*.test.ts`.

## ANTI-PATTERNS (THIS PROJECT)

- Do not skip `run.md` state machine ordering when task requires execution flow compliance.
- Do not introduce heavyweight state libraries; keep global state in Zustand.
- Do not bypass runtime schema checks at API boundary (`zod` parse stays in API layer).
- Do not write AsyncStorage keys ad hoc from screens; use `src/utils/storage.ts` helpers.
- Do not silently change user-facing copy unless explicitly required by task scope.

## UNIQUE STYLES

- Theme switch uses ripple transition (`requestThemeTransition` -> `applyThemeMode`) rather than instant flip.
- API failure path returns local mock markets to preserve MVP runability in offline/backend-down scenarios.
- Utility-heavy test strategy: most current tests target pure logic in `src/utils` first.

## COMMANDS

```bash
cd /Users/cherry/Desktop/WorkPro/prediction-market-mvp/app/mobile
npm run start
npm run ios
npm run android
npm run web
npm run typecheck
npm test
npm test -- --runInBand src/utils/__tests__/trade.test.ts
npm test -- -t "rejects empty input"
```

## NOTES

- Subproject guidance: see `mobile/AGENTS.md` for implementation-level module map.
- If adding tests outside `src/utils/__tests__`, update Jest matcher in `mobile/package.json` accordingly.
- No `.cursor` / Copilot-specific instruction files currently present in repository.
