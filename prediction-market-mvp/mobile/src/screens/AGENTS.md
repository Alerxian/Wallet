# SCREENS KNOWLEDGE BASE

## OVERVIEW
Screens are tab UIs (`Markets`, `Portfolio`, `Activity`, `Settings`) receiving state/actions as props from `MainApp`.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Markets list/detail ticket | `MarketsTab.tsx` | Handles list mode vs detail mode rendering |
| Position rendering | `PortfolioTab.tsx` | Pure render from positions rows |
| Activity rendering | `ActivityTab.tsx` | Displays merged local+indexed activity stream |
| Runtime diagnostics | `SettingsTab.tsx` | Shows phase/auth/wallet/relay/errors |

## CONVENTIONS
- Treat screens as presentational components with callback props.
- Keep wallet/network business rules out of screen files.
- Use `DESIGN` tokens for color/spacing/typography; avoid ad-hoc style constants.
- Preserve current tab language: `MARKETS`, `PORTFOLIO`, `ACTIVITY`, `SETTINGS`.

## ANTI-PATTERNS
- Do not call API/service layers directly from screens.
- Do not duplicate state derivations already provided by controller.
- Do not add local screen state that mirrors global store fields.

## UI NOTES
- Visual style is "trading desk" not generic mobile cards.
- Activity and settings should remain explicit about runtime state (pending/indexed, phase text, errors).

## SAFE EDIT ORDER
- Add/adjust props in screen component first.
- Wire prop sources in `src/app/MainApp.tsx` second.
- Adjust controller return payload in `src/hooks/useAppController.ts` only when required.
