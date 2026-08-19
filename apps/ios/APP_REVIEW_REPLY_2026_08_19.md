# App Review 회신 초안 — Guideline 2.1 Information Needed (2026-08-19)

> Resolution Center 회신 + App Review Information > Notes 에 동일 내용 붙여넣기.
> [ ] 표시는 사장님이 채우는 칸. 새 빌드(1.0.0 (5))를 올린 뒤 회신하면 심사관이 새 빌드로 이어서 봅니다.

---

Hello App Review team,

Thank you for the review. We have uploaded a new build, **1.0.0 (5)**, that includes fixes found during our own device testing, and we are providing the requested information below.

**1. Screen recording (physical device)**
Attached: `[ ]` (recorded on iPhone `[모델]`, iOS `[버전]`). The recording starts from launching the app and shows: sign-up with email confirmation → onboarding → home dashboard → notification permission prompt → AI roadmap generation → roadmap stage detail → My Store (photo library permission prompt when choosing a store photo) → Profile → sign out → sign in → account deletion (Profile > 계정 삭제 > confirm) returning to the sign-in screen.
The app has no in-app purchases or subscriptions, no user-generated public content, and no location/contacts/tracking prompts.

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
- Account deletion: Profile (사이드바 → 프로필) → “계정 삭제” → confirm. Deletion is immediate and permanent (server-side; auth user and all data rows removed).
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
