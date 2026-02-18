# Mobile Architecture + UI Refactor Design (Expo RN)

## Scope

- Target app: `mobile`
- Keep existing feature behavior unchanged:
  - market list
  - market detail
  - buy/sell flow
  - WalletConnect login + SIWE auth
- Refactor architecture for maintainability and scalability
- Redesign UI/UX with a bold visual style and bottom-tab experience

## 1) Current-State Diagnosis

- `App.tsx` is a monolith (~1700 lines) coupling view, state, API, wallet, SIWE, polling, persistence, and styling.
- Side effects are tightly coupled with multiple `useEffect` branches and implicit dependencies.
- API calls are in-component and not normalized; error handling, timeout, and unauthorized behavior are duplicated.
- WalletConnect and SIWE flow are embedded in UI rendering logic, reducing reusability and testability.
- Styling is local-only and lacks a reusable design system/token layer.
- Current docs are partly outdated relative to env-driven WalletConnect configuration.

## 2) Refactor Options

### Option A: Layered Modular Architecture (Recommended)

- Keep Expo/RN stack
- Introduce clear layers: `screens/components/hooks/services/api/state/utils`
- Use:
  - `zustand` for lightweight global state slices
  - `ky` for HTTP client normalization
  - `zod` for runtime response validation
- Pros: low migration risk, incremental rollout, easy rollback, fast delivery
- Cons: still a modular monolith, not full domain-sliced architecture

### Option B: Full Feature-Sliced Design (FSD)

- Organize by entities/features/widgets/pages/shared from day one
- Pros: strongest long-term boundaries and growth model
- Cons: higher migration complexity and learning overhead for MVP stage

### Option C: Query-Driven Architecture

- Use dedicated query/cache layer as the core model
- Pros: robust cache/invalidation patterns
- Cons: larger paradigm shift and added complexity for current scope

### Recommendation

- Adopt **Option A** now.
- Reserve future migration path toward FSD once product scope stabilizes.

## 3) Target Directory Structure

```txt
mobile/
  App.tsx
  index.js
  src/
    app/
      RootApp.tsx
    config/
      env.ts
    api/
      client.ts
      schemas.ts
    state/
      auth.store.ts
      market.store.ts
      trade.store.ts
      ui.store.ts
    services/
      auth.service.ts
      market.service.ts
      trade.service.ts
      walletconnect.service.ts
    hooks/
      usePredictionApp.ts
    screens/
      MarketsScreen.tsx
      PortfolioScreen.tsx
      ActivityScreen.tsx
      SettingsScreen.tsx
    components/
      AppHeader.tsx
      BottomTabBar.tsx
      cards/MarketCard.tsx
      cards/ActivityCard.tsx
      cards/PositionCard.tsx
      trade/TradePanel.tsx
    theme/
      tokens.ts
    utils/
      error.ts
      chain.ts
      siwe.ts
      validation.ts
      activity.ts
    types/
      domain.ts
```

## 4) UI/UX Redesign Plan

- Direction: **Bold Visual** (high contrast, strong cards, expressive status colors)
- Navigation: bottom tabs (`Markets`, `Portfolio`, `Activity`, `Settings`)
- Markets:
  - hero summary panel
  - market cards with status chip, close time, and CTA
  - detail/trade mode retained in markets flow (function unchanged)
- Trade panel:
  - explicit YES/NO side toggle
  - amount input
  - buy/sell dual CTA with clear disabled/loading states
- Activity:
  - merged list of local pending tx and indexed history
  - state color coding for `PENDING/CONFIRMED/INDEXED/FAILED`
- Settings:
  - auth/session visibility
  - wallet transport status
  - recent runtime errors

## 5) Data Flow and State Management

- API Layer:
  - `ky` instance with normalized request/response
  - standardized error and unauthorized handling
- Validation Layer:
  - `zod` schemas parse backend responses at boundaries
- Services Layer:
  - markets, trades, auth, wallet connector flows
- State Layer (`zustand`):
  - `auth.store`: wallet/session/auth lifecycle
  - `market.store`: list/detail/loading
  - `trade.store`: trade form, pending txs, history, positions
  - `ui.store`: active tab + local UI prefs
- Screen Layer:
  - receives derived state + actions from hooks
  - avoids direct backend calls

## 6) Migration Plan (Phased)

### PR1 — Foundation

- Create new `src` structure
- Introduce design tokens and reusable components
- Move app shell to `RootApp` and split screens/components

### PR2 — API + Services

- Add `ky`, `zod`
- Implement API client and typed schemas
- Extract service modules for auth/markets/trades/wallet

### PR3 — State + Hooks

- Add `zustand` stores
- Create `usePredictionApp` orchestration hook
- Migrate side-effects from monolith to hook/services

### PR4 — Full UI/UX Redesign

- Apply bold visual style end-to-end
- Refine tab/screen interactions
- Improve empty/loading/error states

### PR5 — Tests + Docs + Cleanup

- Add mandatory unit tests for core pure logic
- Update `mobile/README.md`
- Remove obsolete logic and confirm behavior parity

### Risks and Rollback

- Risk: session/auth regression during SIWE migration
  - Mitigation: service boundary tests + staged integration
- Risk: polling duplicate refresh loops
  - Mitigation: single polling hook with explicit guard
- Rollback strategy:
  - keep old flow in git history per phase
  - isolate changes by modules so each phase can revert safely

## 7) Executable Task Checklist

- [ ] create architecture folders and baseline files
- [ ] install and wire `zustand`, `ky`, `zod`
- [ ] implement API client + schemas
- [ ] extract auth/market/trade/wallet services
- [ ] create global stores + hook orchestrator
- [ ] split screens/components from old `App.tsx`
- [ ] redesign styles into tokenized theme
- [ ] update README run/config notes
- [ ] add and pass mandatory tests

## 8) Required Tests (Must Pass)

- `npm run typecheck`
- Unit tests:
  - chain id parsing from WalletConnect session
  - SIWE message builder field correctness
  - trade amount validation
  - pending/history merge ordering and dedup behavior
- Service-level tests for pure adapters/helpers where applicable
- Manual smoke flow:
  - connect wallet -> SIWE authenticate
  - open market detail -> buy/sell -> pending appears
  - activity and portfolio refresh with indexed updates
  - logout/clear session and re-auth behavior

Completion criterion: stop only when all above tests/checks pass.
