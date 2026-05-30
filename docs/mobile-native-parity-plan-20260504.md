# Mobile Native Parity Plan

Date: 2026-05-04

## Product Goal

The React Native app must reach feature parity with the web app while using native mobile UX patterns. The visual system stays aligned with the web: midnight blue, Apple-style glass surfaces, aurora background, thin borders, soft shadows, restrained motion, and the same surface icon language.

## Design Direction

- Primary color: midnight blue family (`#1d3557`, `#1d2b7a`, `#0d0d4d`, `#191970`).
- Background: warm paper base `#f7f6f3` with subtle aurora layers.
- Surfaces: translucent white cards, 20-34px radius, 1px low-contrast borders, soft iOS-style shadows.
- Buttons: primary actions use the web gradient direction and pressed scale.
- Navigation: frosted bottom tab bar, matching web surface icons, one-hand reachable actions.
- Motion: fade/slide screen entry, staggered cards, spring-like sheets, progress/metric animations, reduced-motion escape hatch.

## Feature Parity Matrix

| Web area | Mobile target | Status |
| --- | --- | --- |
| Auth | Native auth route | Existing, needs visual parity |
| Welcome onboarding | Native full-screen flow | Partial |
| Manual roadmap onboarding | Current stage flow | Partial |
| AI roadmap wizard | Native intake, result review, apply | Missing parity |
| Existing business onboarding | Native setup flow | Partial |
| Home | Roadmap summary or operational dashboard | Partial |
| Current stage | All stage actions and guide panels | Partial |
| Roadmap | Full roadmap, stage drill-in | Partial |
| Guides | Knowledge list, detail, QA | Partial |
| Profile | Account, language, integrations, reset, store info | Partial |
| My Store / Analytics | Store profile, financial snapshot, operations dashboard | Partial |
| Cashflow / P&L | Hero, survival, forecast, costs, reports | Partial |
| Products / inventory / staff | Native CRUD and summaries | Partial |
| Marketing | Channels, first-customer actions, AI drafts | Partial |
| Franchise | Brand search, detail, comparison, supply info | Partial |
| Integrations | Toss, TossPlace, PortOne, CODEF, CSV, custom | Partial |
| AI partner/actions | Floating partner and action dispatch | Missing parity |
| Exports/reports | Native report triggers and saved artifacts | Missing parity |

## Implementation Phases

1. Design foundation: tokens, aurora background, surface icons, glass cards, gradient buttons, tab bar.
2. Shell parity: pre-launch vs operational navigation, global floating AI entry, consistent screen transitions.
3. Core roadmap parity: Home, Current Stage, Roadmap, Guides, Profile.
4. Onboarding parity: AI roadmap wizard and existing business onboarding.
5. Operations parity: sales, products, inventory, staff, fixed costs, cashflow, P&L, reports.
6. Growth parity: Marketing, Franchise, AI guide QA, contract analysis, health diagnosis.
7. Integration parity: payment/data connections, CSV, webhooks, export flows, notifications.

## Verification

- `pnpm --filter @foundone/mobile typecheck`
- Expo export/build
- iPhone SE, modern iPhone, 360px Android, tablet checks
- 44px minimum touch targets
- Korean and English text wrapping
- Web/mobile feature parity checklist for every surface
