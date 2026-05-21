# Daily Build Report — 2026-05-18

## Summary
- TypeScript check: ✅ PASS
- Next.js build: ✅ PASS

## Details

### 1. TypeScript check
Command: `npx tsc --noEmit -p apps/web/tsconfig.json`
Result: ✅ PASS (exit code 0, no errors)

### 2. Next.js build
Command: `cd apps/web && npx next build`
Result: ✅ PASS (exit code 0)

- All routes compiled successfully
- Shared First Load JS: 216 kB
  - chunks/2cbe1647: 37.3 kB
  - chunks/4288b5fe: 54.4 kB
  - chunks/6997: 122 kB
  - other shared: 3.05 kB
- Static pages (○): /auth, /current, /franchise, /guides, /marketing, /profile, /reports, /roadmap
- Dynamic routes (ƒ): /guide/[guideId], /invite/[code], and all /api/* endpoints
