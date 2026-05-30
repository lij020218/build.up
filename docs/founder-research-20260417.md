# 창업자가 진짜 필요로 하는 것 — 글로벌 리서치 기반 서비스 방향 보고서

**작성일**: 2026-04-17
**목적**: 벤 호로위츠·폴 그레이엄·마크 앤드리슨·CB Insights·YC·2026 SaaS 트렌드를 관통하는 "창업자의 진짜 필요"를 파악하고, Found.One이 제공해야 할 기능을 도출
**배경**: P0 4개(자본시뮬·첫100명·What-If·Export) 구현 직후 — 다음 6개월 로드맵 수립 필요

---

## I. 거장들의 공통 메시지 (영어권 원전 기반)

### 1. Ben Horowitz — "The Hard Thing About Hard Things"

**핵심 통찰**
- "The one skill that stands out: the ability to focus and make the best move when there are no good moves." — 좋은 선택지가 없을 때 최선의 한 수를 두는 능력.
- 창업은 "무엇을 할지"가 아니라 **"감정적으로 어떻게 버틸 것인가"** 의 문제.
- 외로움(loneliness)은 창업가의 가장 큰 적. "전 직원이 당신만 바라볼 때 자신의 심리를 관리하는 법."
- 충성스러운 친구를 해고해야 하는 순간, 매각 타이밍, 인력 감축 — 답이 없는 결정들.

**Found.One 시사점**: 현재 우리는 "정답이 있는 체크리스트"에 강하지만, **"답이 없을 때의 판단 지원"** 은 공백. 위기 시나리오 플레이북, 멘탈 체크인, 의사결정 코칭이 없음.

---

### 2. Paul Graham — "Startups in 13 Sentences" / YC

**핵심 통찰**
- **"Make something people want"** — YC의 단 하나 모토. 창업자의 전문성이 아니라 **사용자의 전문가**가 돼야 함.
- "Do things that don't scale" — 첫 100명은 수작업으로 하나씩 온보딩.
- **Determination > Intelligence**. 지능은 임계치만 넘으면 됨, 결정력이 성공의 첫 번째 변수.
- "Better to make a few people really happy than a lot of people semi-happy" — 소수의 열광이 다수의 관심보다 가치.
- 좋은 아이디어 3조건: ① 창업자 자신이 원하는 것 ② 스스로 만들 수 있는 것 ③ 다른 사람들은 가치를 모르는 것.

**Found.One 시사점**: 우리는 "업종 선택 → 로드맵"에 강하지만, **"사용자가 정말 원하는지 반복 검증"** 루프가 약함. 스타트업 경로엔 Customer Discovery가 있지만 오프라인/온라인 경로엔 없음.

---

### 3. Marc Andreessen — "The Only Thing That Matters" (PMF)

**핵심 통찰**
- **"Product/market fit means being in a good market with a product that can satisfy that market."**
- PMF 없으면: word-of-mouth 안 퍼짐, 성장 느림, 언론 반응 밋밋, 영업 사이클 질질 끌림.
- PMF 있으면: 만드는 속도보다 구매가 빠름, 현금이 쌓임, 영업/CS를 미친 듯이 채용.
- **"40% rule"**: 제품이 없어지면 매우 실망할 고객이 40% 이상이면 PMF 달성.
- **"Product-User Fit comes before Product-Market Fit"** (a16z 2019) — 먼저 한 명의 사용자가 열광해야 시장이 열림.

**Found.One 시사점**: PMF 측정 도구(40% 설문, NPS, 재방문율)가 없음. 창업자는 "이 사업이 진짜 되는 건가?" 에 대한 객관적 피드백 없이 감으로 판단 중.

---

### 4. CB Insights — Startup Failure Post-Mortems (150+ founders)

**Top 실패 원인 (중첩)**
| 순위 | 원인 | 비율 |
|---|---|---|
| 1 | No market need (수요 없는 제품) | **42%** |
| 2 | Ran out of cash | **29%** |
| 3 | Not the right team | **23%** |
| 4 | Got outcompeted | 19% |
| 5 | Pricing/cost issues | 18% |
| 6 | User-unfriendly product | 17% |
| 7 | **Burnout** | **8%** |
| 8 | Failed to pivot | 7% |

**핵심 패턴**: "작은 피할 수 있는 결정들이 쌓여서 실패" — ① 검증 없이 개발 ② 매출 없이 지출 ③ 명확성 없이 채용 ④ 계획 없이 펀딩 ⑤ 불확실성에 취약한 시스템.

**Found.One 시사점**: P0 구현으로 2·3번(Cash, Team)은 일부 대응. 하지만 **1번(No market need), 7번(Burnout), 8번(Failed to pivot)** 은 여전히 공백.

---

### 5. 2026 SaaS·AI 에이전트 트렌드

**핵심 변화**
- **"Copilot → Autopilot"**: 제안만 하는 AI에서 **실제로 작업을 실행하는 에이전트**로 이동.
- IDC: 2026년까지 엔터프라이즈 앱의 **80%에 AI copilot 내장**.
- Gartner: 2026년 말까지 **40%의 앱이 task-specific AI agents 탑재** — 제안만이 아닌 실행.
- 스몰비즈니스 핵심: "2명이 10명처럼 일하게 하는 도구".
- **Decision velocity** (의사결정 속도)가 경쟁 우위의 핵심.

**Found.One 시사점**: 우리 AI는 현재 **조언·생성** 수준(MorningBriefing, 마케팅 트렌드). **행동 실행**(자동 포스팅, 자동 재주문, 자동 쿠폰 발급)은 없음. 경쟁 제품들이 "실행하는 AI"로 가는 중.

---

### 6. 창업자 멘탈 헬스 — 2026 트렌드

**핵심 데이터**
- CB Insights: **8%의 스타트업은 번아웃으로 종료**.
- Econa (entrepreneur mental wellness global hub), Reboot.io, Coa, Quimby — 창업가 전용 멘탈 플랫폼 급성장.
- Quimby: 슬랙/캘린더 통합 **1분 체크인** → 리더에게 집계된 인사이트 제공.
- Coa: "Emotional fitness workshops" — 탄력성·자기인식·번아웃 관리 라이브 클래스.

**한국 특화 맥락**
- "Save struggling self-employed" (Korea Times, 2025) — 한국 자영업자 OECD 최악 수준.
- 임대료·인건비·디지털 경쟁이 매일 압박.
- 정부 지원은 자금 위주, **정신건강/커뮤니티 지원은 민간 공백**.

**Found.One 시사점**: 현재 우리 서비스엔 멘탈 케어 일절 없음. 한국 창업자에게 가장 큰 공백 중 하나.

---

### 7. 피어 커뮤니티·코칭 — 2026

**핵심 모델**
- **Founder Coach**: 월 재편성되는 4인 피어 그룹 — 심도·책임성 확보.
- **Vistage**: 25,000명 CEO 글로벌 — 월 1회 퍼실리테이터 미팅 + 1:1 코칭.
- **Founders Network**: 동종업계 Q&A, 맞춤 소개.
- **Reboot.io**: 내면 성장 + 비즈니스 실무 결합.
- 비용: **연 $5K~$60K+** (진입장벽 높음).

**Found.One 시사점**: 한국엔 이런 구조화된 피어 네트워크 거의 없음. **"한국판 Founders Network"** 포지셔닝 가능.

---

## II. 5개 결정적 공백 (현재 Found.One vs 글로벌 표준)

| # | 공백 영역 | 글로벌 거장 조언 | Found.One 현재 | 격차 |
|---|---|---|---|---|
| **1** | **PMF 측정** | Andreessen 40% rule, NPS>50 | 없음 | ⚠️⚠️⚠️ 심각 |
| **2** | **실행하는 AI** | Gartner 2026 AI agents | 조언만 생성 | ⚠️⚠️ 큼 |
| **3** | **위기·피벗 플레이북** | Horowitz "no good moves" | 없음 | ⚠️⚠️ 큼 |
| **4** | **멘탈/번아웃 케어** | Econa/Coa/Quimby | 없음 | ⚠️⚠️ 큼 |
| **5** | **피어 커뮤니티·코칭** | Founders Network/Vistage | 없음 | ⚠️⚠️ 큼 |
| 6 | 수요 검증 오프라인 확장 | PG "users expert" | 스타트업 전용 | ⚠️ 중 |
| 7 | 첫 100명 실행 자동화 | PG "things don't scale" | 체크리스트만 | ⚠️ 중 |
| 8 | 결정 기록·회고 | Horowitz journal | 없음 | ⚠️ 중 |

---

## III. 다음 로드맵 — 5개 P1 제안 (벤치마크 기반)

### 🟢 P1-A: PMF Pulse — "40% Rule" 자동 측정기
**근거**: Andreessen + Productboard NPS>50 기준
**기능**:
- 매월 자동 고객 설문 1문항 ("우리 제품이 없어지면 얼마나 실망하시겠어요?")
- 결과 대시보드: 40% 이하 = "아직 PMF 아님 — 피벗 고려"
- 업종별 벤치마크 (식당 재방문율, 쇼핑몰 재구매율, SaaS 리텐션)
- 측정 주체: 카카오 채널 / 네이버 예약 / 이메일 / QR
**영향**: 창업자가 "이 사업이 진짜 되는 건가?"에 객관적 답

### 🟢 P1-B: Action Agents — "조언"에서 "실행"으로
**근거**: Gartner 2026 AI agent 트렌드, Copilot→Autopilot
**기능**:
- **자동 쿠폰 발급**: 매출 급락 감지 → 당근/카카오 쿠폰 자동 생성
- **자동 재주문 알림**: 재고 임박 → 공급처 링크 + 수량 제안 + 카톡 발송
- **자동 인스타 포스팅 초안**: 일매출 신기록 시 축하 포스트 자동 작성 (검토 후 게시)
- **자동 리뷰 요청**: 결제 완료 고객에게 24시간 후 카톡 발송
**영향**: 2명이 10명처럼 일함. Found.One이 "디지털 동료"가 됨

### 🟡 P1-C: Crisis Playbook — "답 없을 때의 답"
**근거**: Horowitz "hard thing" + CB Insights 피벗 실패 7%
**기능**:
- **위기 유형 진단**: 매출 급락·핵심 직원 퇴사·자본 30% 소진·리뷰 폭격·공급처 이탈
- **각 위기별 플레이북**: 48시간 내 액션 + 7일 내 액션 + 30일 재건
- **피벗 의사결정 트리**: 업종 유지 vs 조정 vs 완전 전환 vs 폐업
- **실제 사례**: 같은 상황에서 살아남은 창업자 3명 인터뷰 영상 (확보 필요)
- **폐업 시 세무·부채 정리 절차**
**영향**: 창업자가 가장 외로울 때 옆에 서 있음

### 🟡 P1-D: Founder Care — 멘탈 & 루틴
**근거**: Econa + Quimby + Coa, 번아웃 8%
**기능**:
- **주간 1분 체크인** (Quimby 방식): "이번 주 에너지?" "수면?" "가족 시간?"
- **번아웃 조기 경고**: 3주 연속 에너지 저하 + 일 12시간 이상 → 강제 휴식 권장
- **결정 저널**: 매주 중요 결정 1개 기록 → 3개월 후 리뷰
- **성공 비교군 벤치마크**: "당신과 같은 단계 창업자의 70%가 이 시기에 이런 결정을 했습니다"
- **응급 상담 리소스**: 한국 멘탈케어 플랫폼 연계 (헬시어, 마인드카페)
**영향**: 번아웃으로 죽는 8%를 구함. 한국 창업자 최대 공백 메움

### 🟡 P1-E: Peer Circles — 한국판 Founders Network
**근거**: Vistage / Founders Network / Founder Coach
**기능**:
- **월 1회 4인 피어 그룹** (업종/단계/지역 매칭): 화상 1시간 + 공통 과제
- **비동기 Q&A 포럼**: 선배가 답변하면 포인트, 포인트로 다음 달 이용 가능
- **멘토 디렉토리**: 세무사·법무사·PB·선배창업자 — 시간당 상담 (15분 무료 샘플)
- **같은 상권 익명 벤치마크**: "이 지역 평균 월매출 4,500만원, 당신은 상위 40%"
- **결정 크라우드소싱**: "이 임대료 협상 어떻게 할까요?" — 48시간 내 3명 조언
**영향**: "Determination" (PG)을 유지시키는 유일한 외부 자산 = 같은 길 걷는 사람들

---

## IV. 우선순위 매트릭스

```
영향력
  ↑
큼 │  P1-B      P1-A
   │ Action    PMF
   │ Agents    Pulse
   │
   │  P1-D     P1-C      P1-E
   │ Founder  Crisis    Peer
   │  Care    Playbook  Circles
중 │
   │
   └───────────────────────→ 구현 난이도
        쉬움    중간     어려움
```

**8주 내 달성 가능한 구성**:
1. **P1-A (PMF Pulse)** — 4주 — 가장 큰 공백 메움, 구현 쉬움 (설문 + 집계)
2. **P1-D (Founder Care)** — 4주 — 체크인 UI + 저널 (외부 상담 연계는 링크만)
3. **P1-B (Action Agents)** — 6주 — 쿠폰/재주문/리뷰요청 3개부터 (포스팅은 나중)
4. **P1-C (Crisis Playbook)** — 3주 — 콘텐츠 중심, UI는 기존 로드맵 패턴 재활용
5. **P1-E (Peer Circles)** — 12주+ — 사용자 수 먼저 확보 후 (500명+ 필요)

---

## V. 서비스 정체성 진화

### 현재 (2026-04)
> "예비 창업자를 위한 로드맵 멘토링 OS"

### 목표 (2026-12)
> **"창업자가 외롭지 않게, 실패하지 않게, 실행하게 — 매일 의존하는 AI 동료·코치·커뮤니티"**

### 3대 축 (Horowitz + PG + Andreessen 통합)
1. **Andreessen 축 (PMF)** → 데이터로 "이 사업이 진짜 되는가" 답
2. **Horowitz 축 (Hard Decisions)** → 답 없을 때 옆에 서는 플레이북·멘탈 지원
3. **Graham 축 (Execution)** → "조언만 하지 말고 실행하는 AI" 에이전트

---

## VI. 수익 모델 힌트 (리서치 기반)

| 플랜 | 월 가격 (추정) | 핵심 차별화 | 근거 벤치마크 |
|---|---|---|---|
| Free | 0원 | 로드맵·기본 대시보드·1개 체크인 | 유입용 |
| **Pro** | **2.9만** | What-If·Export·AI 에이전트 3종·주간 체크인·PMF Pulse | Vistage 대체 (월 5만 이하) |
| **Business** | **9.9만** | 다점포·피어서클·멘토 매칭·위기 플레이북 전체 | Founder Coach ($1K/월) 대비 매력적 |
| **Enterprise** | 별도 | 지자체 창업지원센터·프랜차이즈 본사 — 가맹주 패키지 | B2B 안정 수익 |

---

## VII. 의회 심의 결과 (OpenAI + Gemini)

**2026-04-17 소집, 5개 안건 심의**

### Gemini 3.1 Pro의 반대 의견 (중요)
> **"PMF Pulse는 실리콘밸리 탁상공론."**
> 한국 자영업자에게 40% rule보다 무서운 건 **현금 경색**. 배민/쿠팡이츠/네이버페이 **다중 수수료 + 제각각 정산 주기** 때문에 **"흑자부도"** 발생.
> → **P1-A 대신 "Cash-flow Crunch Tracker"** (내일 가용 현금 실시간 예측) + **P1-C (Crisis Playbook)** 조합 추천.
>
> **가장 날카로운 지적**: "예쁜 대시보드를 보여주면 창업자가 분석할 것"은 엔지니어 오만.
> 하루 12시간 일하는 번아웃 점주는 P&L 해석 지적 여유 없음.
> **"원버튼 실행"(One-button Execution)** 까지 떠먹여줘야 작동.
> 예: "배민 광고비 5만원 줄이세요 [적용] 버튼".

### OpenAI o4-mini의 보완 의견
- P1-A + P1-B 대체로 찬성하되 **위기 대응 요소(Crisis Playbook) 필수 보완**.
- 누락 공백: **실제 POS·결제 시스템 실시간 연동** + **정부지원·대출 금융 토탈 솔루션**.
- 월 2.9만원은 매출 있는 업체엔 OK, **예비창업자/마진 5% 이하 점주엔 부담** → 무료/라이트 플랜 필수.
- 위험한 착각: "AI Agents 도입 = 자동 성장" — **현장 데이터 품질, 디지털 리터러시** 간과.

### 의회 합의 사항
1. **P1-B (Action Agents)는 만장일치 지지** — 단, "원버튼 실행"까지 떠먹이는 수준이어야.
2. **P1-A (PMF Pulse) 재검토 필요** — Gemini는 "한국 현실 부적합", OpenAI는 "유지하되 Free 플랜 포함".
3. **새로 부상한 1순위 공백**: **"흑자부도 방지 Cash-flow Tracker"** (Gemini 제안) — 리서치에서 내가 놓친 것.
4. **가격 전략**: 9.9만 원은 **"알바 0.5명 대체" 또는 "세무/마케팅 대행비 월 30만 원 절감"** 포지셔닝일 때만 작동.
5. **한국 올인에는 만장일치** — 공정위/국세청/카카오 연동이 이미 글로벌 SaaS가 침범 못할 해자.

---

## VII-B. 의회 반영 수정안 — 최종 P1 우선순위

### 🔴 P1-Zero (의회가 지적한 최우선 공백, 리서치에서 놓쳤음)
**Cash-flow Crunch Tracker — "흑자부도" 방지 레이더**
- **왜**: 배민 수수료 6.8% + 결제수수료 + 쿠팡이츠 9.8% + 정산 D+2~14일 제각각 → 장부 흑자여도 통장 바닥
- **기능**:
  - 각 채널별 수수료 자동 추출 (매출 vs 실입금 갭 가시화)
  - "오늘 통장 잔고 vs 내일 결제 필요 금액" 실시간 대시보드
  - 7일·14일 가용 현금 예측 (정산 일정 + 고정비 지출 캘린더)
  - 현금 위기 72시간 전 조기경고 + "광고비 즉시 5만원 감액 [적용]" 원버튼
- **영향**: 한국 자영업 최대 무음 살인자. 현 CashFlowForecastCard는 정산일 반영하지만 **원버튼 실행 없음**.

### 🟢 P1-A-Revised: 간소화된 PMF Pulse (Free 플랜에 포함)
- 월 1회 재방문율/재구매율/재방문 고객 만족도 자동 집계
- "40% rule" 대신 **업종별 한국 실측 벤치마크**: 식당 재방문율 25%+, 온라인몰 재구매 35%+
- 단순 대시보드 + "더 알아보기" 링크만

### 🟢 P1-B-Revised: Action Agents — 원버튼 실행만
Gemini 지적 반영 — 조언 + [적용하기] 버튼 반드시 함께
- **쿠폰 원버튼 발급** (카카오 채널 API)
- **재주문 원버튼 발송** (공급처 카톡 자동 메시지)
- **인스타 포스트 초안** (검토 → 게시 플로우)
- **리뷰 요청 자동 카톡** (결제 24시간 후)

### 🟡 P1-C: Crisis Playbook — 유지 (의회 합의)
- 매출 30% 급락, 직원 퇴사, 임대료 인상 통보 등 5개 시나리오
- 각 시나리오 원버튼 액션 (예: "즉시 배달앱 광고 50% 삭감 [적용]")

### 🟠 P1-D (Founder Care) / P1-E (Peer Circles) → **Q3 이후로 연기**
근거: 500+ 활성 사용자 확보 후 작동. 지금은 혼자서도 쓸 수 있는 기능이 먼저.

---

## VIII. 결론 — 다음 이정표

**지금까지 확보한 것**
- 로드맵(4.5/5), 대시보드 진단(4.1/5), P0 4개 완성 → **구조적 기초** 완료
- 한국 로컬화(공정위/국세청/카카오) → 진입장벽 구축

**다음 결정적 한 수 — 의회 심의 후 수정**
> 처음 나의 안: P1-A (PMF Pulse) + P1-B (Action Agents)
> **의회 수정안**: **P1-Zero (Cash-flow Crunch Tracker) + P1-B-Revised (원버튼 Action Agents)**
>
> 근거: Gemini의 결정적 지적 — 한국 자영업자의 최대 살인자는 **"흑자부도"**. 장부 흑자여도 정산 타이밍 불일치로 현금 고갈. 이것이 Andreessen PMF rule보다 우선.
> Action Agents도 **"조언 + [적용] 버튼"** 으로 재설계 (원버튼 실행 없으면 이탈).
> 이 두 개 완성 시 Found.One = **"한국 자영업자의 생명선"**.

**6개월 후 검증 지표** (우리의 PMF Pulse)
- 월 활성 사용자(MAU) 중 주 3회 이상 접속 비율 **40% 이상**
- 사용 중단 시 "매우 실망" 응답 **40% 이상** (Andreessen rule)
- 유료 전환율 **10% 이상**

---

## 참고 링크

- Horowitz, B. (2014). *The Hard Thing About Hard Things*. https://a16z.com/books/the-hard-thing-about-hard-things/
- Graham, P. "Startups in 13 Sentences". https://paulgraham.com/13sentences.html
- Andreessen, M. "The Only Thing That Matters". https://pmarchive.com/guide_to_startups_part4.html
- a16z "12 Things About PMF". https://a16z.com/12-things-about-product-market-fit/
- CB Insights "Why Startups Fail — Top 9 Reasons". https://www.cbinsights.com/research/report/startup-failure-reasons-top/
- Gartner via Negup "Copilots to Autopilots 2026". https://www.negup.com/blog/copilots-to-autopilots-ai-in-saas/
- Founder Coach Peer Groups. https://www.foundercoach.com/blog/best-ceo-peer-groups-in-2025
- Econa — entrepreneur mental wellness. https://www.consciousambition.com/tools4founders
- Korea Times "Save struggling self-employed" (2025). https://www.koreatimes.co.kr/opinion/20250604/save-struggling-self-employed
- Ministry of SMEs and Startups (KR). https://www.mss.go.kr/
