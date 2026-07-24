# Daily Build Report — 2026-07-24

**Monorepo:** build.up (`/Users/lij020218/New project`)
**Time:** 2026-07-24 20:48 KST
**Node:** v25.8.1 · **npm:** 11.11.0 · **Next.js:** 15.5.18

## Summary
- TypeScript check: ✅ **PASS**
- Next.js build: ✅ **PASS** (2/2 clean builds green) — **recovered from yesterday's release-blocking FAIL.**

## Results

| Step | Result | Details |
|------|--------|---------|
| 1. TypeScript check (`tsc --noEmit -p apps/web/tsconfig.json`) | ✅ **PASS** | Exit 0, 0 errors |
| 2. Web build (`next build`) | ✅ **PASS** | Compiled successfully, 138/138 static pages, production bundle emitted |

## Details

### 1. TypeScript check
`npx tsc --noEmit -p apps/web/tsconfig.json` → exit 0, no diagnostics. Clean.

### 2. Next.js build
| Attempt | Config | Result |
|---|---|---|
| 1 | with existing `.next` cache | ❌ exit 1 — `ENOENT` on `.next/server/app/_not-found/page.js.nft.json` during the final *"Collecting build traces"* step. Compilation, type validation, and all 138 static pages had already succeeded; only trace-collection failed against the stale cache. |
| 2 | `rm -rf .next` (clean) | ✅ exit 0 — compiled in 54s, 138/138 pages, full bundle |
| 3 | `rm -rf .next node_modules/.cache` (fully clean) | ✅ exit 0 — compiled in 33.4s, 138/138 pages |

**Conclusion:** the build is green. The single failure was a stale-`.next`-cache artifact isolated to trace collection (not compilation, not types, not any page), and it disappeared on a clean rebuild — confirmed reproducibly across two clean builds, including one with `node_modules/.cache` cleared.

### Comparison to 2026-07-23
Yesterday's report recorded a **hard, release-blocking build failure** — non-deterministic webpack server-chunk failures reproducible across 4 clean attempts (missing `pages-manifest.json`, `PageNotFoundError`, `Cannot read properties of undefined (reading 'call')`, `MODULE_NOT_FOUND: ./569.js`), with no bundle produced. **None of that reproduced today.** Two clean builds produced a valid production bundle. Whatever caused the 7/23 instability is no longer manifesting; today's only hiccup was cosmetic stale-cache trace noise.

## Build noise (pre-existing, non-fatal)
- `[resolveNextStageIds]` fallback logs for stages `biz-registration` / `budget-setup` (decisions-zombie / cross-cluster `nextStageConditions` → default fallback) — informational, emitted during static generation.
- `--localstorage-file was provided without a valid path` Node warning (harness flag noise).

## Overall: ✅ PASS
Both steps pass; a deployable production bundle is produced on a clean build. No source changes were made — diagnostic report only. Recommend a clean `.next` (or `rm -rf .next`) before local builds to avoid the stale-cache trace-collection ENOENT.
