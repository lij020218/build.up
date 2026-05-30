# Found.One Architecture Notes

## Current Direction

- Monorepo with web, mobile, and shared packages
- Shared package owns workflow, stage, and freshness models
- Web and mobile keep platform-specific UI while following the same product rules

## Freshness Principle

- User-facing knowledge should carry source and freshness metadata
- Official and recently reviewed information should be preferred
- Stale or blocked data should not silently appear in critical flows

## Knowledge Layer

- `knowledge_items` stores reusable public knowledge records such as permit guides, loan summaries, and market recommendation inputs
- `knowledge_item_sources` stores the official or supporting source rows behind each knowledge item
- `knowledge_refresh_reviews` stores review history so freshness changes are auditable over time
- `market_location_signals` stores region-level market signals used for scoring rent, competition, demand, access, and category fit independently from editorial recommendation cards
- Product UI should read `freshness_status`, `last_checked_at`, `next_review_at`, and linked sources before surfacing critical recommendations
- Future crawlers, API sync jobs, and human review tools should write into this layer rather than embedding freshness only in client-side starter data
- Current seeded domains:
  - `market-recommendation`
  - `permit-guide`
  - `tax-guide`
  - `loan-guide`
  - region-level rows in `market_location_signals`
