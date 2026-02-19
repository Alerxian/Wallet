# Prediction Market Mobile MVP

Expo + TypeScript mobile baseline for a prediction market app.

## Commands

- `yarn start`
- `yarn ios`
- `yarn android`
- `yarn typecheck`
- `yarn test`

## Scope in current phase

- Tabs: Markets / Portfolio / Activity / Settings
- Market list search + filter + sort
- Watchlist and recent market persistence (AsyncStorage)
- Market detail trade panel with quick amounts and pre-submit checks
- Activity merged view and status/action filters
- Portfolio summary cards

## Assumptions

- If backend API is unavailable, app falls back to local mock markets.
- Expected network for trade submission checks is `31337`.
- Trade lifecycle is locally simulated for MVP validation.
