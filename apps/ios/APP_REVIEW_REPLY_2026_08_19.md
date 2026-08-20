# App Review 회신 초안 — Guideline 2.1 Information Needed (2026-08-19)

> Resolution Center 회신 + App Review Information > Notes 에 동일 내용 붙여넣기.
> [ ] 표시는 사장님이 채우는 칸. 새 빌드(1.0.0 (5))를 올린 뒤 회신하면 심사관이 새 빌드로 이어서 봅니다.

---

Hello App Review team,

Thank you for the review. We have uploaded a new build, **1.0.0 (5)**, that includes fixes found during our own device testing, and we are providing the requested information below.

**1. Screen recording (physical device)**
Attached: `[파일명]` (recorded on iPhone `[모델]`, iOS `[버전]`, one continuous unedited take). It starts from launching the app and shows: sign-in with an existing email account → the home dashboard and core features (home segments, reports, staff, my store, roadmap) → Profile → **account deletion** (계정 삭제 → confirm → returned to the sign-in screen) → **sign-up** with the same email → email confirmation → onboarding → dashboard. `[영상에 없는 항목은 지우세요]`
Permission prompts: the app requests only notification permission (optional reminders) — it had already been granted on the test device before recording, so iOS does not show the prompt again; the app uses no camera, location, contacts, microphone, or App Tracking Transparency (no such usage-description keys in Info.plist; photos are chosen through the system PhotosPicker, which needs no permission prompt). There are no in-app purchases/subscriptions and no user-generated public content.

**2. Devices / OS tested**
- iPhone `[모델, e.g. 16 Pro Max]` — iOS `[버전]` (physical device, TestFlight)
- iPhone 16 Pro / iPhone SE (3rd gen) simulators — iOS 18.x (Xcode)

**3. What the app does and for whom**
FOUND.ONE is a Korean-language planning and operations assistant for small-business founders (cafés, restaurants, retail, beauty, fitness, education, pet, lifestyle services, online sellers and early-stage startups) in South Korea. Founders answer a few questions (or describe their idea in free text) and the app builds a step-by-step launch roadmap — permits and registrations, budget allocation, timeline, funding programs, suppliers, marketing channels — and, after opening, a daily operations dashboard (sales/cost tracking, staff scheduling, tax calendar, marketing content tools). It solves the “where do I even start, and what am I missing?” problem for first-time owners; all guidance is informational, not legal/tax advice, and no financial transactions happen in the app.

**4. How to access the main features**
Demo account (already in App Review Information): `[lij020218@cau.ac.kr]` / password as entered in App Store Connect. The account is fully onboarded, so after sign-in you land on the home dashboard.
- Roadmap: bottom tab “로드맵” → tap any stage.
- AI roadmap generation: Profile → “진행 초기화” is NOT needed; instead sign up with a new email (any address; email confirmation link is sent) and choose “AI로 로드맵 만들기” on the onboarding screen — generation takes about 40–90 seconds.
- Dashboard / Reports / Finance / Tax: bottom tabs.
- Staff: “직원” tab → invite by 8-character code.
- Account deletion: Profile (사이드바 → 내 정보) → “계정 삭제” → confirm. It is also available during onboarding (account icon at the top-right of every onboarding screen → “계정 삭제”). Deletion is immediate and permanent (server-side: auth user, all data rows and uploaded files are removed; Sign in with Apple tokens are revoked). Statutory labor records (attendance/payroll), if any, are retained for 3 years in a separate archive as required by the Korean Labor Standards Act §42 — disclosed in our privacy policy.
- Account types: there is one sign-up path. An “employee” view appears only when an owner invites a user with an 8-character code (Staff tab → 직원 추가); the demo account above is an owner account. Staff demo account: `[있으면 이메일/비번, 없으면 "not needed for review — staff features require an owner invitation; the owner demo account can create an invite code at 직원 → +"]`
No sample files are required.

**5. External services used**
- Supabase (authentication — email/password and Sign in with Apple, database, file storage, realtime, push token storage)
- OpenAI API (AI text generation for roadmap, coaching and marketing copy; requests go through our own server at foundone.dev — no keys in the app)
- Apple Push Notification service (optional reminders)
- Korean public open-data APIs via our server (National Tax Service business status check, K-Startup program listings, Fair Trade Commission franchise disclosure data)
- Vercel (hosting for our API)
No payment processors or ad/analytics SDKs are integrated in the iOS app.

**6. Regional differences**
The app is designed for the South Korean market (Korean language, Korean regulations and programs). It functions identically in all regions; there is no region-based feature gating.

**7. Regulated industry / third-party material**
Not applicable. The app does not provide regulated financial, medical or legal services and contains no licensed third-party media. Public government open data is used under the Korean open-data license (공공누리).

Thank you,
`[이름]` — FOUND.ONE
