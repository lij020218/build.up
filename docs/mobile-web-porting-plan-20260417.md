# Mobile Web Porting Plan

Date: 2026-04-17

## Current Web Product Map

The web app is not one flow. It is five connected product layers:

1. Entry and onboarding
   - Welcome onboarding
   - Start with manual roadmap
   - Generate an AI roadmap
   - Register an existing store
   - Role selection

2. Founder roadmap
   - Industry, startup type, business model, budget, market, contract
   - Offline, online, franchise, and tech-startup paths
   - Shared tail stages: tax, loan, business registration, pre-launch, first month

3. AI planning
   - Free-text idea intake
   - Budget, region, store name, team size
   - AI generated market analysis, budget allocation, risks, timeline, channels
   - Result applied into roadmap decisions

4. Existing-store operations
   - Existing business onboarding
   - Store setup, monthly costs, tax settings, channels
   - Operations dashboard, sales entry, products, inventory, employees, fixed costs

5. Growth and management surfaces
   - Analytics, cashflow, weekly report, P&L, product performance
   - Marketing playbooks and first-customer actions
   - Agent proposals, reports, exports, notification center

## Mobile State Before This Pass

Mobile already has:

- Main tabs: home, current, roadmap, guides, profile
- Added routes: analytics, franchise, marketing
- Shared roadmap stages rendered as generic task stages
- Contract, finance, guides, location, franchise, and marketing summary surfaces

Mobile missing or incomplete:

- AI roadmap wizard as an actual native flow
- Existing-store onboarding as an actual native flow
- Operations dashboard data entry surfaces
- Product, inventory, employee, fixed cost management
- Agent proposal actions
- Export/report selling flow

## Porting Order

### P0: Make Entry Choices Real

Ship first because the user must be able to start in the right mode.

- Manual roadmap: already works
- AI roadmap: native intake, API call, result review, apply to roadmap
- Existing store: native intake, mark roadmap complete, save profile state, open analytics

### P1: Existing Store Operations Core

This is the strongest retention loop for mobile.

- Daily sales entry
- Monthly cost setup
- Product/service menu input
- Inventory snapshot
- Staff/labor basics
- Fixed expense list

### P2: AI Roadmap Result Depth

After P0 creates the roadmap, make the generated plan feel valuable.

- AI result summary surface
- Budget allocation cards
- Risks and mitigations
- Timeline phases
- Recommended suppliers, permits, channels

### P3: Analytics and Cashflow

Port the cards that make users return weekly.

- Cashflow hero
- Survival board
- P&L summary
- Forecast
- Weekly report
- Cost structure

### P4: Marketing and Agents

Port after operations data exists, because agents need real signals.

- First-customer playbook
- Marketing checklist
- Coupon/content/review/reorder proposals
- Trend inputs and campaign drafts

### P5: Reports and Monetization

Port after analytics has enough data.

- PDF/Excel/CSV export
- Business plan report
- Loan/support program report
- Investor/franchise comparison report

## Implementation Principle

For mobile, do not port every web card literally. Port the job:

- If the web component is a large dashboard card, mobile gets one focused action and one summary.
- If the web component has many inputs, mobile gets a stepper.
- If the web component produces a report or analysis, mobile gets a short result screen and a saved artifact hook.
- If a feature requires heavy comparison tables, mobile gets ranked cards first and table/export later.

