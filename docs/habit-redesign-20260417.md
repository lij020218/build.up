# build.up 매일 쓰는 경영 비서 재설계 — 경영 대가 지혜 기반

**작성일**: 2026-04-17
**문제**: 현재 서비스는 "충분한 데이터가 있는 사용자에겐 좋지만, 매일 열 동기가 약함" (3/5점)
**목적**: 성공한 경영인들의 원칙을 녹여 **앱에 매일 오게 만드는** 개선안 도출
**제약**: 보고서 판매 X, Headless UX X, 로드맵 + AI 경영 비서 방향 유지

---

## Part 1. 현재 서비스 냉정한 재평가

### 1-1. 시나리오별 가치 평가

| 사용자 상태 | 30초 | 5분 | 30분 |
|---|---|---|---|
| **매출 0건 신규** | ⭐⭐☆☆☆ Cashflow 설정 요구 → 이탈 | ⭐⭐☆☆☆ 입력 깊이 숨김 | ⭐⭐☆☆☆ 데이터 없어 무의미 |
| **매출 1-3일** | ⭐⭐⭐☆☆ MorningBriefing만 작동 | ⭐⭐⭐☆☆ Agent 미발동 | ⭐⭐⭐☆☆ ForecastCard 3일 필요 |
| **매출 30일+** | ⭐⭐⭐⭐☆ 대부분 카드 의미 부여 | ⭐⭐⭐⭐☆ What-If, PLHero | ⭐⭐⭐⭐⭐ 깊이 있음 |

**결정적 문제**: **초기 7-14일의 "빈 화면 지옥"**
- 2일 필요한 SalesBreakdown, 3일 필요한 Forecast, 7일 연속 필요한 WeeklyReport
- 6일간 60%+ 카드가 공백 → 이 구간 이탈률 높음
- 사용자에게 **"기다려"** 만 반복 = 최악의 UX

### 1-2. 매일 열 동기 있는 기능 vs 없는 기능

| 매일 열 이유 있음 ✓ | 매일 열 이유 없음 ✗ |
|---|---|
| CashflowHero (위기 감지) | FirstCustomersCard (읽기용) |
| 매출 입력 (ActivitySnapshot) | ExportPanel (월 1회) |
| 주간 신호 (SurvivalBoard) | MilestoneToast (7/30/90일 가끔) |
| PL BEP 진행도 | WhatIfSimulator (가끔) |
| MorningBriefing | ForecastCard (주간) |

**결론**: 매일 열 이유 5개는 있는데 **"빈 상태"로 작동 안 하는 게 문제**.

### 1-3. 공허한 기능 (덩치는 큰데 가치 약함)
- **SubscriptionPlanManager** — 라인 300+ 차지, SaaS 사용자만 (전체 10% 이하)
- **InventoryOpsCard** — 온라인 D2C엔 무의미한데 분기 약함
- **DetailTabs** — 핵심 입력이 여기 숨겨져 있는 설계 오류
- **NotificationCenter** — 실제 알림이 발생 안 하는 걸로 의심됨

---

## Part 2. 성공한 경영 대가 4명의 핵심 원칙

### 2-1. **Jeff Bezos** — "Day 1" 철학 (Amazon 창업자)

> "Day 2 is stasis. Followed by irrelevance. Followed by excruciating, painful decline. Followed by death."

**4대 원칙 (Bezos 2016 주주서한)**:
1. **True customer obsession** — 고객이 "만족한다" 말해도 그건 착각. 항상 불만족이 있다
2. **Resist proxies** — 프로세스·보고서에 매몰되지 말 것. 실제 결과를 직접 봐라
3. **Embrace external trends** — 외부 트렌드를 적극 수용 (AI, 모바일 등)
4. **High-velocity decision making** — 빠르되 70% 정보면 결정하라

**build.up 적용**: 사용자(자영업자)에게도 **"Day 1 마인드"** 유지하게 해야. 매일 "오늘 첫날처럼 뭘 개선할까?" 자극이 필요.

### 2-2. **Charlie Munger** — 멘탈 모델 & 체크리스트 (Berkshire Hathaway 부회장)

> "80~90 key models을 마스터하면 의사결정이 월등히 개선된다."

**핵심 4가지 멘탈 모델**:
1. **Inversion (역발상)** — "성공하는 법" 대신 **"실패하는 법"** 을 먼저 생각하라 → 폐업 원인부터 막아라
2. **Circle of Competence** — 내가 진짜 이해하는 영역 안에서만 결정. 경계를 아는 게 중요
3. **Second-Order Thinking** — 1차 결과(인건비 절감)가 아니라 **2차·3차 결과**(품질 하락→고객이탈→매출감소)까지 생각
4. **Checklist Discipline** — 조종사처럼 중요 결정 전에 체크리스트 (감정 개입 방지)

**build.up 적용**: 이미 **흑자부도(Inversion)** 철학은 구현 완료. 하지만 **체크리스트 규율**과 **2차 결과 시뮬**은 부족.

### 2-3. **Peter Drucker** — 효과적 경영자의 5원칙 (현대 경영학의 아버지)

> "Effectiveness is a habit — 습관이다. 학습 가능한 복합 실천이다."

**5대 실천**:
1. **Know where your time goes** — 2주간 **Time log** 작성. 실제 시간을 추적하라
2. **Focus on outward contribution** — "내가 뭘 해야 하나?"가 아니라 "**나에게서 무슨 결과를 기대받는가?**"
3. **Build on strengths** — 내가 잘하는 것, 동료가 잘하는 것, 지금 상황이 허락하는 것에 집중
4. **Concentrate on the few major tasks** — **First things first**. 한 번에 하나만
5. **Make effective decisions** — 사실이 아니라 **견해**에서 출발. 반대 의견도 적극 찾아라

**build.up 적용**: 자영업자는 **"Time Log"** 를 안 함. 우리가 자동 생성하면 킬러 기능. 또 "한 번에 하나" 원칙 → **오늘 집중할 1가지** 선명하게.

### 2-4. **Nir Eyal** — Hook Model (습관 설계)

> "Products that hook users pass through 4 phases every time."

**Hook Loop 4단계**:
1. **Trigger** (외부 or 내부) — 알림·이메일 or 감정(불안·심심)
2. **Action** (보상 기대 행동) — 간단한 쉬운 행동
3. **Variable Reward** — 3종:
   - **Tribe**: 사회적 보상 (공감, 인정)
   - **Hunt**: 사냥 보상 (정보, 돈)
   - **Self**: 자기 보상 (마스터리, 달성감)
4. **Investment** — 사용자가 투자한 노력이 제품을 더 가치 있게 만든다 (데이터, 설정, 팔로우)

**build.up 적용**: 현재 Trigger→Action까지는 있는데 **Variable Reward**와 **Investment**가 약함. 매일 로그인할 때마다 **다른 인사이트**(Hunt), **진전 표시**(Self), **커뮤니티 비교**(Tribe)가 있어야 한다.

---

## Part 3. 원칙 → 제품 개선 (핵심 7가지)

### 🔴 개선 #1: "빈 화면 지옥" 제거 — Munger Inversion 적용

**문제**: 신규 사용자가 첫 7일간 이탈. 왜? "기다려" 만 반복.

**해결책: 업종별 "즉시 가치" 콘텐츠 제공 (매일 1건)**
- 데이터 유무 상관없이 매일 업종별 인사이트
- 예: 카페 주인에게 "오늘 서울 카페 평균 객단가 8,500원", "이번 주 뜨는 음료 트렌드"
- 이미 `packages/shared/franchise-data.ts` (176KB), SEMAS API 연결됨
- **신규 컴포넌트**: `<DailyIndustryInsight />` — 대시보드 상단 고정

**구현 난이도**: 중 (데이터는 있음, 큐레이션 로직 필요)
**영향**: 첫 7일 이탈률 -30% 예상

### 🔴 개선 #2: "오늘의 1가지" — Drucker "First Things First"

**문제**: 현재 Agent 제안 + MorningBriefing + Cashflow 위기 = 너무 많은 선택지

**해결책: "오늘 딱 1가지" 의도적 집중**
- 대시보드 최상단에 "Today's One Thing" 카드 고정
- 위기 감지 시: 위기 액션 1개만
- 위기 없을 때: Agent 제안 중 최우선 1개
- 아무것도 없을 때: 업종 인사이트 or Drucker식 "이번 주 time log 체크인"
- **다른 제안은 스크롤 아래로**

**구현 방법**: 기존 `AgentProposalsSection` + `CashflowHeroCard` + `MorningBriefing` 위에 **통합 우선순위 허브**
**영향**: 의사결정 피로 제거, 완료율 상승

### 🟡 개선 #3: Time Log — Drucker의 킬러 기능

**통찰**: 자영업자는 "내 시간이 어디 가는지" 모름. 이걸 추적하면 경영의 질이 상승.

**해결책: 자동 Time Log + 주간 성찰**
- 매일 저녁 6시 카톡 알림: "오늘 주요 시간 3가지는?" (3-tap 입력)
- 매주 일요일: "지난주 시간 사용 패턴" + 개선 제안
- **신규 스토어**: `time-log-store.ts`
- **신규 컴포넌트**: `<TimeLogQuickInput />` (30초 입력), `<WeeklyTimeReport />`

**왜 매일 옴**: **매일 저녁 3탭 입력이 매주 인사이트로 변환** (Hook의 Investment 요소)
**영향**: 사용자의 자아 성장 → 서비스 의존도 상승

### 🟡 개선 #4: 2차 결과 시뮬레이터 — Munger "Second-Order"

**통찰**: 현재 What-If는 1차 결과만 (인건비 -10% → 순익 +X). **2차·3차까지 보여줘야 진짜 판단**.

**해결책: "그 다음엔?" 시뮬레이션 체인**
- 인건비 -10% 선택 시:
  - **1차**: 월 순익 +30만원
  - **2차**: 서비스 속도 저하 가능성 (데이터: 유사 케이스) → 고객 불만 +15%
  - **3차**: 리뷰 평점 0.3↓ → 신규 방문 -10% → 매출 -8%
  - **순 영향**: 장기 +5만원 (위험 포함)
- What-If에 "2차 결과 자동 전개" 옵션 추가

**구현 방법**: `WhatIfSimulator.tsx` 확장. 업종별 "행동→결과" 연관 DB 구축 (`@build-up/shared` 확장)
**영향**: 대시보드의 **"판단 엔진"** 정체성 확립

### 🟡 개선 #5: 경영 리추얼 3종 — Drucker Habit + Hook Loop

**통찰**: 매일 / 매주 / 매월 **의도적 리추얼**이 습관의 뼈대.

**3종 리추얼 설계**:

**매일 5분 — "저녁 마감 체크인"** (영업 끝난 시간)
- 트리거: 저녁 10시 푸시/카톡 알림 (사용자 설정 가능)
- 액션: 오늘 매출 + 고객수 + Time Log 3-tap (30초)
- 보상: "오늘 어제보다 +X% 성장" or "이번 달 상위 Y%" 피드백 (Variable)
- 투자: 입력된 데이터가 다음날 브리핑 풍부화 (Investment)

**매주 15분 — "월요일 주간 계획"**
- 트리거: 월요일 오전 8시
- 액션: 지난주 리뷰 + 이번 주 1가지 목표
- 보상: AI 코칭 + 업종 벤치마크 비교
- 투자: 주간 목표 달성 시 마일스톤 배지

**매월 30분 — "월 1일 월간 리포트 검토"**
- 트리거: 매월 1일 (자동 생성된 P&L PDF + 다음 달 시뮬)
- 액션: 월간 리포트 검토 + 다음 달 예산 조정
- 보상: "이번 달 비서가 벌어다/아껴준 금액" 종합
- 투자: 월간 피드백 → 더 정확한 예측

**구현**: 기존 `MorningBriefing`을 세 개로 분화, 또는 스마트 라우팅

### 🟢 개선 #6: Variable Reward 3종 매일 적용 — Hook Model

**통찰**: 현재 MorningBriefing은 **Tribe/Hunt/Self 중 Hunt(정보)만 제공**. 나머지 2개는 공백.

**3종 추가**:

**Tribe (사회적 보상)**: "같은 업종 같은 지역 비교"
- "강남 카페 평균 매출 대비 상위 45%" (익명 벤치마크)
- "비슷한 매장의 72%가 이번 달 마케팅 비용 증가"
- 데이터 소스: Supabase 익명 집계 (RLS로 개별 데이터 보호)

**Self (자기 달성)**: "내 진전 시각화"
- BEP 도달까지 남은 거리 프로그레스 바
- 오픈 이후 총 매출 카운터 (누적 가치)
- "당신이 달성한 것": 첫 매출, 첫 100만원, 첫 흑자 등 배지

**Hunt (정보 보상)** (기존 강화):
- 매일 업종 인사이트
- 지원금/세무 기회 감지
- 경쟁사 가격 변동 감지 (공정위 정보공개서 API)

**구현**: 새 컴포넌트 `<SocialBenchmarkCard />`, `<ProgressMilestones />`

### 🟢 개선 #7: Bezos Day 1 — 매일 1개 개선 제안

**통찰**: Amazon의 "Day 2 = 정체 = 죽음" 공포를 제품화.

**해결책: "오늘의 Day 1 개선 1가지"**
- 매일 1개의 작은 개선 제안 (AI 동적 생성)
- 예시:
  - "이번 주말 한정 메뉴 도입으로 객단가 +8% 예상" (Content Agent 확장)
  - "계산대 앞 POP 추가 시 연관 판매 +15% 사례" 
  - "리뷰 1점대 관리 미답변 3건 → 오늘 답변 초안" 
- **Action Agent 시스템 재활용** — 5번째 agent kind "improvement"

**구현**: `agents-store.ts`에 `improvement` kind 추가. 트리거: 매일 1회 (로드맵이 끝난 사용자용)
**영향**: 로드맵 끝난 사용자의 **"다음에 뭐?"** 공백 해결

---

## Part 4. 우선순위 및 구현 로드맵

### Week 5 (가장 시급 — 초기 이탈률 감소)
| # | 기능 | 일정 | 파일 |
|---|---|---|---|
| 1 | "오늘의 1가지" 허브 카드 | 2일 | `components/dashboard/TodaysOneThingCard.tsx` (신규) |
| 2 | 업종별 일일 인사이트 | 3일 | `DailyIndustryInsight.tsx` + `services/industry-insight.ts` |
| 3 | 빈 상태 리팩토링 | 2일 | 각 카드의 empty state 통일 |

**왜 Week 5**: 초기 7일 이탈을 잡지 못하면 다른 개선도 의미 없음

### Week 6 (습관 형성)
| # | 기능 | 일정 | 파일 |
|---|---|---|---|
| 4 | Time Log (3탭 입력) | 4일 | `time-log-store.ts` + `TimeLogQuickInput.tsx` + `WeeklyTimeReport.tsx` |
| 5 | Social Benchmark (익명 비교) | 3일 | Supabase 익명 집계 View + `SocialBenchmarkCard.tsx` |

### Week 7 (정체성 강화)
| # | 기능 | 일정 | 파일 |
|---|---|---|---|
| 6 | 2차 결과 시뮬 | 5일 | `WhatIfSimulator.tsx` 확장 + `@build-up/shared` DB |
| 7 | Progress Milestones | 2일 | `ProgressMilestones.tsx` + `agents-store` 확장 |

### Week 8 (지속 가치)
| # | 기능 | 일정 | 파일 |
|---|---|---|---|
| 8 | Improvement Agent (5번째) | 4일 | `agent-triggers.ts`에 `improvement` kind |
| 9 | 리추얼 라우팅 (매일/매주/매월) | 3일 | MorningBriefing 분화 + 스케줄 로직 |

### 공허한 기능 정리 (병행)
- **SubscriptionPlanManager** → 조건부 로드 (SaaS 사용자만)
- **DetailTabs** → 매출 입력을 대시보드 상단으로 승격
- **NotificationCenter** → 실제 알림 연결 or 제거

---

## Part 5. 성공 지표 (업계 표준 + 우리 지표)

### 5-1. 북극성 지표 변경
**기존**: Weekly Active Operators (주 3회 접속)
**새로**: **Daily Engaged Operators (DEO)** — 일 1회 접속 + 의미있는 액션 1개

### 5-2. 경영 대가 철학 반영 KPI

| 원칙 | 측정 지표 | 목표 |
|---|---|---|
| **Bezos Day 1** | 일일 Improvement Agent 수락률 | 20%+ |
| **Munger Inversion** | Cashflow 위기 조기 감지 → 회피 사용자 비율 | 70%+ |
| **Drucker Time Log** | 주간 Time Log 작성 사용자 비율 | 35%+ |
| **Hook Loop 완성도** | Trigger(카톡 알림) → Action(입력) → Reward(인사이트) → Investment(누적) 전환율 | 60%+ |

### 5-3. 리추얼 참여율
- **매일 5분 저녁 체크인**: 40%+ (습관 형성 임계점)
- **매주 월요일 계획**: 25%+ (강한 사용자)
- **매월 1일 리뷰**: 15%+ (고급 사용자)

### 5-4. 제거해야 할 허영 지표
- ❌ "가입자 수" (무의미)
- ❌ "DAU만" (접속만 하고 나가는 것은 가치 없음)
- ✅ "DAU × 의미있는 액션 수"

---

## Part 6. 핵심 깨달음 — "매일 앱을 열게 하는 것은 기능이 아니라 '리추얼'"

> "Sharpening your focus and attention is about changing your relationship to your work, and the way you reward yourself for completing it." — Nir Eyal

### 6-1. 왜 지금까지 안 됐나
- 기존 사고: "좋은 기능을 만들면 쓸 것이다"
- 현실: **기능이 아무리 좋아도 매일 올 이유가 없으면 안 온다**
- 캐시노트는 매출 자동 수집으로 "안 열어도 데이터가 쌓이는" 구조 → 우리가 이길 수 없음
- **우리 해자**: 캐시노트가 못 주는 **"생각의 리추얼"**

### 6-2. 앞으로 나아갈 방향
build.up은 이제 **"매일 5분, 생각하는 경영자를 만드는 서비스"**가 되어야 한다.

세 가지 다짐:
1. **Day 1 마인드 주입**: 매일 작게라도 개선 1개
2. **Munger 규율**: 감정 아닌 체크리스트로 판단
3. **Drucker 자기성찰**: Time Log로 내 경영 거울 보기

이 조합은 한국 어떤 경쟁사도 만든 적 없다. 캐시노트는 장부, 우리는 **성장하는 경영자 본인**.

---

## Part 7. 다음 결정 — 어디부터 할까

3가지 옵션 (우선순위 의견 맞춰주세요):

### Option A: "빈 화면 지옥" 즉시 수습 (Week 5만)
- 개선 #1, #2, 빈 상태 리팩토링
- 1주 집중 → 초기 이탈률 시급 개선
- **권장 이유**: 효과 즉시, 지금 제일 아픈 문제

### Option B: 경영 리추얼 4주 전면 구축 (Week 5-8)
- 7가지 개선 모두
- 리팩토링은 병행
- **권장 이유**: 정체성 전환 (캐시노트 따라잡기 X, 완전히 다른 길)

### Option C: 하이브리드 (내 추천)
- Week 5 필수 (초기 이탈 차단)
- Week 6부터 사용자 데이터 관측하며 7개 기능 중 실제 반응 좋은 것부터
- **권장 이유**: 자원 투입 효율

저는 **Option C**를 강하게 추천합니다. Week 5에 "오늘의 1가지" + "업종 인사이트" + "빈 상태 정리"만 해도 체감 변화가 큽니다. 그 후 실제 사용자 반응으로 Week 6-8을 결정.

## 참고 링크

- [Bezos 2016 Shareholder Letter](https://www.aboutamazon.com/news/company-news/2016-letter-to-shareholders) — Day 1 철학
- [AWS Day 1 Culture Guide](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/)
- [Charlie Munger 100 Mental Models](https://thoughtbread.medium.com/charlie-mungers-100-mental-models-master-decision-making-psychology-math-investing-46e1fbc795e3)
- [Munger Mental Models & Moats — Mobius VP](https://mobiusvp.com/2025/07/30/mental-models-and-moats-how-charlie-mungers-critical-thinking-philosophy-can-future-proof-your-business/)
- [Peter Drucker Effective Executive Summary](https://www.shortform.com/blog/peter-druker-the-effective-executive/)
- [Nir Eyal Hooked Model](https://www.nirandfar.com/how-to-manufacture-desire/)
- [Amplitude Hook Model SaaS Retention](https://amplitude.com/blog/the-hook-model)
