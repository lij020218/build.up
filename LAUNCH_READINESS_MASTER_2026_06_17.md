# 🚀 출시 준비 전수 점검 — 마스터 플랜 (다음 세션 = 이 문서대로 바로 실행)

> 작성: 2026-06-17. **출시 임박.** 다음 세션은 인사말·재탐색 없이 **§0 게이트부터 즉시 실행**.
> 절대 원칙(매 작업 적용): 웹·iOS 동시(SSOT) · 가짜숫자 0(계산불가=—/예시/추정) · Apple 미니멀 · **신호등 컬러 금지**(양호/주의=네이비 농담, 위험만 벽돌 #b64c4c) · 무료 채널 우선 · **인벤토리 먼저(중복 신설 금지 — 대부분 이미 부분 존재, "심화"가 정답)**.
> git: `origin/main` = `feat/backend-audit-and-sync-2026-06-07` = `3ee3306` (이번 세션 9커밋 반영 완료, FF 동기). 새 작업은 브랜치 후.

> **🟢 다음 세션 실행 순서 (사장님 확정): ① §A 벤치마크 기능 생성 → ② §0~7 최종 점검.** §0 게이트는 양쪽 모두의 선행.

---

## A. 🎯 벤치마크 기능 (다음 세션 **1순위 — 먼저**, §0 게이트 통과 후 바로)

**왜**: VC 심사 급소(*"데이터 독점성·네트워크 효과를 어떻게?"* — 윤덕주 멘토)에 정면으로 답하는 moat 빌딩. 두 외부 전략분석도 같은 결론(수익·리텐션·차별화·독점성)에 수렴 → 진단 확정.

**핵심 구분 (절대 혼동 금지)**:
- **(A) 업종 평균 (큐레이트)** — 데이터 **이미 있음**(검증값), 지금 텍스트로 노출 가능·정직. **단 moat 아님**(공개 연구데이터).
- **(B) 코호트 실측 (유저 데이터 집계)** — **이게 VC가 말한 진짜 moat**. 인프라 0 + 스케일 필요 + **위조 절대 금지**(데이터 없이 "상위 30%" 쓰면 가짜숫자 위반·VC 간파).
- **설계 원칙**: 지금 (A)를 *"업종 평균"*으로 정직 라벨해 넣고, 스케일 오면 **같은 UI 문구의 데이터 소스만 (A)→(B)로 교체**. UI 불변, 출처만 moat로 업그레이드.

**구현 (사장님 지목 그대로 — 별도 카드 신설 ❌, 기존 비교가능 surface에 텍스트 ✅, 카드 막추가 금지 규율 준수)**:
1. **SSOT 한 함수** `benchmarkText(categoryId, metric, myValue, language)` → `packages/shared/src/finance/` 신규. 기존 레지스트리 재사용: `cluster-budget-benchmarks.ts`·`knowledge/franchise-benchmarks.ts`·`finance/startup-metrics.ts`·`IndustryThresholds`·`FinancialBenchmarkRegistry`. 반환 `{ label, comparison, status: "good"|"watch"|"risk", source: "industry" }`. **벤치마크 없는 category+metric은 null 반환 → 미표시(가짜 0).**
2. **iOS 미러**: `apps/ios/Sources/FoundOneCore/BenchmarkTextRegistry.swift` (codegen 또는 핸드미러, 웹 SSOT와 1:1).
3. **노출 위치 (전부 같은 SSOT 끌어씀)**:
   - **손익/원가율 카드** ⭐ 가장 날카로움(VC 예시 그 자리) — 웹 `dashboard/sections/Tier3Operations.tsx` + iOS `DailyHub/PLHeroCard.swift`. 현재 grade(색)만 → **텍스트 비교 추가**("외식 평균 원가율 35–45% · 사장님 34% — 양호").
   - **매출 카드** — 객단가/일매출 업종 평균 대비 한 줄.
   - **일일 보고서** — 웹 `api/ai/insights/industry-daily/route.ts` + iOS `Today/TodayView.swift`: 어제 지표 옆 "업종 평균 대비 +/−".
   - **AI 경영 코칭** — 코칭 프롬프트 context에 업종 평균 주입 → "원가율이 평균보다 높아요" 류 언급.
4. **규율**: 웹·iOS 동시 SSOT · 신호등 0(good=네이비 농담, risk만 벽돌 #b64c4c) · 라벨 정직("업종 평균", (B) 사칭 금지) · 회귀 테스트(`benchmark-text.test.ts`).
5. **인벤토리 먼저**: PLHeroCard는 이미 IndustryThresholds로 grading 중 → **신설 아닌 심화**(같은 데이터를 텍스트로). 노출 전 grep으로 중복 확인.

**(B) 코호트 moat 로드맵 (이번 세션 아님, 메모만)**: 유저 매출/비용 익명 집계 view(`v_cohort_benchmarks` by category×매출단계) + 최소 N(예: 카테고리당 30사장님↑)일 때만 노출. 스케일 도달 시 `benchmarkText`의 source를 "industry"→"cohort"로.

---

## 0. 방법론 (이게 "대략적"과 "제대로"를 가른다 — 반드시 준수)

1. **계약 기반**: 직감 아닌 명시 체크리스트(C1~C9, INSPECTION_LEDGER 상단)로 점검.
2. **인벤토리 먼저**: 신설 전 `grep`으로 기존 커버리지 확인 → 있으면 심화, 없으면만 신설. (이번 세션 정부지원 타이밍은 이미 완전 구현돼 있었음 — 중복 회피)
3. **적대적 자기검증**: 발견마다 "의도된 설계? 가드가 처리? 다른 경로 커버?" 반증 시도 → 못 하면 확정. (거짓양성 다수 걸러짐)
4. **런타임 증명**: 계산/sync 건은 빌드만 말고 테스트/렌더로. iOS=`SIMCTL_CHILD_BU_DEMO_SCENARIO=healthy/critical BU_DEMO_ALLOW=1 BU_DEMO_TAB=roadmap BU_DEMO_STAGE=<stage> xcrun simctl launch <UDID> com.foundone.mobile` + `simctl io screenshot`. 웹=preview + `__fo_preview` 우회(검증 후 git 복원). 한계: **진짜 네트워크 왕복(웹↔iOS Supabase)·결제·이메일은 인증 세션 필요 → 사장님이 테스트 계정/로그인 줘야 가능.**
5. **수정 후 검증 + 잠금**: 회귀 테스트(vitest/XCTest). 예: `employer-insurance-rate.test.ts`.
6. **게이트 통과 후 커밋**: 논리 단위 커밋, 브랜치, 푸시는 사장님 요청 시만.

## §0 — 베이스라인 게이트 (전부 green 확인 후 시작, ~5분)
```bash
cd "/Users/lij020218/New project"
(cd packages/shared && npx tsc --noEmit)                                  # 0
(cd apps/web && npx tsc --noEmit && npx next build)                        # 0 + Compiled
npx vitest run                                                            # 265/265 (직전)
(cd apps/ios && xcodebuild build -project FoundOne.xcodeproj -scheme FoundOneFeatures -destination 'generic/platform=iOS Simulator')  # SUCCEEDED
(cd apps/ios && xcodebuild build -project FoundOne.xcodeproj -scheme FoundOne -destination 'generic/platform=iOS Simulator')          # SUCCEEDED
```

---

## 1. 🔴 출시 차단 (Critical Path — 이거 안 되면 출시 불가). 우선 처리.

| # | 항목 | 누가 | 상태 | 비고 |
|---|------|------|------|------|
| B1 | **사업자정보 푸터** (전상법) — 상호·대표자·사업자등록번호·통신판매업 신고번호·주소·연락처 | 코드(나) + 신고(사장님) | ❌ 미비 | 통신판매업 신고 선행 후 푸터 컴포넌트 신설(웹 전역 + /legal). Phase 7 확정 |
| B2 | **이메일 인증 메일 실제 발송** | 사장님(콘솔) | ⬜ | Supabase: Confirm email ON + **커스텀 SMTP(Resend)** 등록 (`RESEND_SUPABASE_SMTP.md`). 미설정 시 가입 메일 안 감 → **실가입 1건 테스트 필수** |
| B3 | **Vercel 환경변수** 등록 | 사장님 | ⬜ | `UPSTASH_*`·`CRON_SECRET`·`SUPABASE_SERVICE_ROLE_KEY`·`TAVILY`·`PORTONE_KEK_BASE64`·`KAKAO`·`NEXT_PUBLIC_*` (LAUNCH_CHECKLIST §3). 미등록 시 rate-limit 우회·cron 401 |
| B4 | **마이그레이션 prod 적용** 확인 | 사장님(DB) | ⬜ | 특히 보안 `20260610_000005` + 상권 `20260613_*`. 코드론 검증 불가 |
| B5 | **iOS DEVELOPMENT_TEAM** | 사장님 | ⬜ | `.env.local`에 `APPLE_TEAM_ID` → `generate-xcconfig.sh` or Xcode Team 선택. 없으면 아카이브 불가 |
| B6 | **App Store 제출물** | 사장님(ASC) | ⬜ | App Privacy 라벨·연령등급(AI 챗봇 고지)·6.9형 스크린샷·TestFlight. (아이콘 1024 알파제거 ✅ 완료, PrivacyInfo.xcprivacy ✅, 1.0.0 ✅) |

## 2. 🟡 로그인 (auth) — 출시 전 라이브 점검
- **이메일**: 로직 ✅ 구현(signUp+callback+resend). 게이트 = B2(SMTP) + Supabase Redirect URLs에 prod 도메인 등록. → **실가입→인증메일→로그인 왕복 1회 테스트**.
- **카카오**: 웹 코드 ✅ 준비 완료(공식 로고·무이메일 안전성, commit `7f6236c`). 게이트 = Kakao Developers 앱(Redirect URI `https://gwnwgzeweofsxxftwjcl.supabase.co/auth/v1/callback`·Client Secret·동의항목) + Supabase Kakao provider 활성화 + Vercel `NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=true`. iOS 카카오는 **스텁(미구현)** — v1은 애플+이메일로.
- **애플(iOS)**: 구현됨. ASC Sign in with Apple capability 확인.
- 점검: 비번 재설정 딥링크(`foundone://auth/reset`), 로그아웃 시 로컬 wipe, 세션 만료 처리.

## 3. 💳 결제 (payment)
- **현황**: 9월 전 **유료 전환 없음** → 페이월/유료게이팅 미생성 원칙(`billing-gate` fail-closed, `/pricing`·`/billing` 닫히면 redirect+null). **출시 v1은 결제 없음.**
- **점검**: ① 페이월이 실수로 열려있지 않은지(`NEXT_PUBLIC` 게이트 OFF 확인) ② PortOne 웹훅 fail-closed(HMAC/replay)·`PORTONE_KEK` 불변 — 코드 ✅(Phase 6). ③ 결제 연동 카드(프로필)는 "연결"만, 실과금 X. → **실결제 테스트는 9월 유료화 시점에.**

## 4. ⚖️ 법률·사업자정보
- ✅ 개인정보처리방침(`/legal/privacy`)·이용약관(`/legal/terms`) 본문(이영준·lki720412@gmail.com).
- ❌ **B1 사업자정보 푸터**(전상법) — 최우선.
- 점검: 약관에 사업자정보·환불/청약철회(결제 생기면)·분쟁해결 표기, 만 14세 미만 가입 처리, AI 생성물 책임 고지.

## 5. 🎨 디자인 최종 패스
- **신호등 컬러 0** 재확인(이번 세션 다수 제거). 잔여 **시스템 블루 #007aff**(profile·marketing — 의도적 "중립 포커스"라 디자이너 결정 대기) → **사장님 결정 필요: 미드나잇 통일 vs 보조 액센트 유지.**
- 라벤더-미스트+미드나잇 일관성, Apple 미니멀, 다크모드 없음(라이트 전용 확정).
- 웹·iOS 패리티: INSPECTION_LEDGER 14 surface 전부 ✅. **잔여 S1/S2(MyStore iOS 스키마 Phase-B — 카테고리당 1→2~12섹션 포팅) = 가장 큰 패리티 갭.**

## 6. 🧮 코드·데이터 정합성 (이번 세션 정밀점검 완료 — 회귀만)
- 14 surface 계약점검 완료(INSPECTION_LEDGER). 발견·수정: P0 매출입력 no-op✅·P1 보험요율/프라임코스트✅·iOS write-gap R1/R2✅.
- **잔여 백로그(비차단)**: RP2(reports 일일factor 26 vs 30 정본결정) · 시스템 C5 블루 스윕 · dead code(onboarding IndustrySelectionView 등) · ReportsCalculator prime XCTest(날짜의존) · D2 인건비 회귀테스트.
- **미증명**: 네트워크 왕복(B2/테스트계정 필요).

## 7. ☁️ 배포·인프라 (사람 = LAUNCH_CHECKLIST.md 정본)
- cron 6개(vercel.json) + `CRON_SECRET` fail-closed ✅. Supabase Realtime 토글(5테이블)·Storage 버킷 private·Kakao 콘솔 도메인·DNS/SSL.

---

## 기존 문서 맵 (중복 금지 — 먼저 읽고 재확인만)
| 문서 | 내용 |
|---|---|
| **이 문서** | 출시 점검 마스터 진입점 |
| `PRELAUNCH_FULL_INSPECTION_2026_06_15.md` | Phase 0~9 게이트·보안·법무·앱스토어 (대부분 ✅, 발견 이슈 로그) |
| `INSPECTION_LEDGER_2026_06_16.md` | 앱 전체 14 surface 계약(C1~C9) 정밀점검 원장 + 백로그 + 방법론 |
| `CODE_INSPECTION_4SURFACES_2026_06_16.md` | 4대 화면 1차 점검 |
| `LAUNCH_AUDIT_2026_06_10.md` | 보안 P0×7 (전부 closed 재확인됨) |
| `LAUNCH_CHECKLIST.md` | 사람이 할 ops·환경변수·마이그레이션 정본 |
| `RESEND_SUPABASE_SMTP.md` | B2 SMTP 설정 단계 |

## 다음 세션 시작 멘트(권장)
"LAUNCH_READINESS_MASTER §0 게이트 실행 → **§A 벤치마크 기능부터** (SSOT `benchmarkText` → 손익카드 웹·iOS → 매출·일일보고서·코칭). 벤치마크 끝나면 §1 출시차단(코드 B1 사업자푸터) + §2~7 최종 점검." — 확인 질문 없이 바로 진행, 순서 = 벤치마크 → 점검.

## 사장님(운영자)이 직접 해야 할 것 — 체크리스트
- [ ] 통신판매업 신고 → 신고번호 확보 (B1 푸터에 필요)
- [ ] Supabase: Confirm email ON + Resend SMTP + Redirect URLs(prod·localhost) (B2)
- [ ] Kakao Developers 앱 + Supabase Kakao provider + `NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=true` (§2)
- [ ] Vercel 환경변수 전체 (B3)
- [ ] DB 마이그레이션 적용 확인 (B4)
- [ ] APPLE_TEAM_ID → xcconfig (B5)
- [ ] ASC: App Privacy·연령등급·스크린샷·TestFlight (B6)
- [ ] 디자인 결정: 시스템 블루 #007aff → 미드나잇 통일 여부 (§5)
