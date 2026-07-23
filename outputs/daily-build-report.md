# Daily Build Report — 2026-07-23

## Summary
- TypeScript check: ✅ PASS
- Next.js build: ❌ **FAIL** — non-deterministic webpack server-chunk failure in the export/page-data phase (4 clean attempts, all failed). **Regression from yesterday's PASS.**

## Details

### 1. TypeScript check
Command: `npx tsc --noEmit -p apps/web/tsconfig.json`
Result: ✅ PASS (exit code 0, no errors). Not a type regression.

### 2. Next.js build
Command: `cd apps/web && npx next build` (Next.js 15.5.18)
Result: ❌ FAIL (exit code 1) on all 4 attempts, including 3 clean builds (`rm -rf .next`) and one with `NODE_OPTIONS=--max-old-space-size=8192`.

**Compilation itself always succeeds** (`✓ Compiled successfully` in 39–52s). The failure is consistently in the post-compile **export / "Collecting page data" / "Generating static pages"** phase, where the server webpack chunks under `.next/server/` are missing or unresolvable. The exact symptom differs every run — the hallmark of a non-deterministic build-worker/chunk-emission failure, not a single broken import:

| Attempt | Config | Failure symptom |
|---|---|---|
| 1 | with cache | `ENOENT` — `.next/server/pages-manifest.json` / `build-manifest.json` missing; prerender failed on `/404`, `/api/funding/live`, `/admin/applications`, … |
| 2 | clean | `PageNotFoundError: Cannot find module for page: /admin/feedback` and `/api/admin/revenue` (during *Collecting page data*) |
| 3 | clean | `TypeError: Cannot read properties of undefined (reading 'call')` at `.next/server/webpack-runtime.js` while prerendering `/` (reached 103/138 pages) |
| 4 | clean + 8 GB heap | `MODULE_NOT_FOUND: Cannot find module './569.js'` required by `.next/server/pages/_document.js` via `webpack-runtime.js` |

Every run ends with `⨯ Next.js build worker exited with code: 1`. No production bundle is produced.

## Diagnosis (evidence-based)
- **Not a type error** — `tsc` is green.
- **Not a lint error** — only pre-existing warnings (see below); build does not fail on them.
- **Not simple OOM** — raising the Node heap to 8 GB (attempt 4) did not help; it failed at a *different* point.
- **Not the modal/portal refactor (checked, ruled out)** — the most recent web commit `92e5c01d` introduced `createPortal` modal shells, a common prerender breaker, but `OverlayModal.tsx` is correctly SSR-guarded (`if (typeof document === "undefined") return null;` at line 45; all `document`/`window` writes are inside `useEffect`). Verified, not assumed.
- **Not a runtime circular dependency among the refactored foundational modules** — `product-unify.ts`, `recipe-cost.ts`, `constants.ts` import only *types* from `operations-store.ts` / `types.ts` (`import type`, erased at compile time). No runtime cycle there.
- **Signature = webpack server-chunk emission/resolution instability.** Compilation reports success, but chunks (`./569.js`, `pages-manifest.json`, `build-manifest.json`, the module behind `webpack-runtime require`) are missing/corrupt in `.next/server/`. The `_document.js → ./569.js` miss (attempt 4) is framework-level, which is why *any* page can be the one that trips it — hence the different failing page each run.
- **Correlated with a heavier build.** Compile time grew from **12.5s (2026-07-22)** to **~40–52s** today after a large batch of web commits landed since 2026-07-21 (dashboard restructure `e7294cf0`/`ed6914ed`, modal-shell refactor `92e5c01d`, product-model unification `product-unify.ts`/`operations-store.ts`, tax surface, new modals `MenuProfitabilityModal.tsx`/`RecipeEditorModal.tsx`). The `PackFileCacheStrategy` "Serializing big strings" warnings also appeared.

Note: prior reports (2026-07-21) already flagged an intermittent stale-cache prerender failure, so this build path has a recent history of flakiness — but today it is **reproducible across 4 clean attempts and blocks the build entirely**, which is a genuine hard failure, not a one-off flake.

## Recommended next steps (for a human/interactive session)
1. **Treat as release-blocking** — no deployable bundle is produced. Do not ship until green.
2. **Bisect today's web commits** (since `2026-07-21`), prime suspects in order: `92e5c01d` (modal shell), `e7294cf0`+`ed6914ed` (dashboard "재고 카드 → 메뉴·재료 관리" restructure + profitability modal), `product-unify`/`operations-store` refactor. `git stash`/checkout each and run `rm -rf .next && npx next build`.
3. **Isolate the flaky worker path**: try `experimental.webpackBuildWorker: false` in `next.config`, or a single-worker export, to see if the chunk race disappears — and/or trial the Turbopack build (`next build --turbopack`).
4. **Fully clear caches** (`rm -rf .next node_modules/.cache`) before bisecting to rule out webpack filesystem-cache corruption.
5. Check for known Next.js 15.5.x chunk-emission issues matching `"Cannot read properties of undefined (reading 'call')"` / missing server chunk.

## Build noise (pre-existing, non-fatal)
- `@sentry/nextjs` deprecation warnings ×2 (`disableLogger`; `sentry.client.config.ts` → `instrumentation-client.ts`)
- CSS optimization warning ×1 (`@import` Pretendard must precede other rules)
- Many `react-hooks/exhaustive-deps` warnings (useMemo/useEffect deps)
- `--localstorage-file was provided without a valid path` node warning (harness flag noise)

## Conclusion
❌ **Build fails.** `tsc` passes; `next build` cannot emit a production bundle due to a non-deterministic webpack server-chunk failure that appeared today after a large batch of web commits. Root cause not yet isolated to a single commit (requires a bisect); the modal/portal and circular-dependency hypotheses were checked and ruled out. Needs human attention before any deploy.

_Investigation performed by scheduled `daily-build-check`: 1 tsc run + 4 full `next build` attempts. No source changes were made — this is a diagnostic report only._
