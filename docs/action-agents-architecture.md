# P1-B Action Agents — 아키텍처 설계 (구현 전)

**목적**: 4개 Agent를 전체 코드베이스에 자연스럽게 녹이는 구조 확정.
**핵심 원칙**: 기존 스토어/API/UI 패턴을 재사용. 중복 없이, 충돌 없이.

---

## 1. 전체 코드베이스 맥락 파악 결과

### 1-1. 기존 AI API 패턴
- 경로: `app/api/ai/<domain>/route.ts`
- 인증: `requireApiUser(request)` (Supabase 세션)
- Rate limit: `checkSimpleRateLimit` (서버 메모리 버킷, 5/min 기본)
- **현재 prompt caching 미사용** → Agent API에서 **최초 도입** 필요 (비용 절감)
- 일부는 `@build-up/ai` 패키지 경유 (dashboard/actions, interview)
- 단순한 건 직접 Anthropic SDK (marketing/trends)

### 1-2. 기존 스토어 간 데이터 흐름
| 스토어 | Agent가 읽을 데이터 | Agent가 쓸 데이터 |
|---|---|---|
| `profile-store` | industryCategoryId, storeName, businessLaunched, businessLaunchedDate | ─ |
| `finance-store` | **dailyEntries** (매출 트렌드 감지 핵심), monthlyCosts | ─ |
| `operations-store` | **inventory** (재고 감지 핵심), employees | inventory.lastOrderedAt |
| `marketing-store` | promoCodes, campaigns | **promoCodes 추가** (Coupon Agent 수락 시) |
| `cashflow-store` | projections (Cash-flow Tracker와 연동) | ─ |
| `roadmap-store` | currentStage, businessCtx | ─ |

**중요**: Agent는 **읽기 중심**이고 **쓰기는 최소화**. 수락 시에만 기존 스토어의 기존 액션 호출.

### 1-3. 기존 대시보드 카드 배치 질서
```
1. Store name + LIVE 뱃지
2. ⭐ CashflowHeroCard (최상단, 흑자부도)
3. 🤖 AgentProposalsSection (신규 — 여기)
4. MorningBriefing (AI 코칭)
5. 비용 미입력 안내
6. 생존 메트릭 + PLHero
7. SalesBreakdown + MonthlyProgress
8. (기존) CashFlowForecastCard
9. ForecastCard
10. FirstCustomersCard
11. WhatIfSimulator
12. 인기 상품
13. 경영 진단
14. Export
```

Agent 섹션은 **Cashflow Hero 바로 아래, MorningBriefing 바로 위**에 배치. 이유: 위기 해결(Cashflow) → 실행 제안(Agents) → 일일 코칭(Briefing) 순서.

### 1-4. 기존 디자인 언어
- `bento-card` 클래스, radius 24px, gradient 배경
- lucide-react 얇은 선 아이콘 (strokeWidth 1.6)
- ko/en 양어, tabular-nums 숫자
- 모달 시트 패턴 (CashflowSetupSheet 참조)

---

## 2. Action Agents 시스템 설계

### 2-1. 파일 구조

```
apps/web/app/lib/
├── stores/
│   └── agents-store.ts                          # 신규: 제안 상태 + 쿨다운
├── services/
│   ├── agent-triggers.ts                        # 신규: 순수 감지 함수
│   └── agent-content-templates.ts               # 신규: 로컬 메시지 템플릿
├── hooks/
│   └── useAgentOrchestration.ts                 # 신규: 트리거 체크 오케스트레이션
└── components/dashboard/
    ├── AgentProposalsSection.tsx                # 신규: 섹션 컨테이너
    ├── AgentProposalCard.tsx                    # 신규: 공통 쉘
    └── agents/                                   # 신규 디렉토리
        ├── CouponAgentBody.tsx
        ├── ReorderAgentBody.tsx
        ├── ContentAgentBody.tsx
        └── ReviewAgentBody.tsx

apps/web/app/api/ai/agents/                      # 신규
├── coupon-copy/route.ts                         # prompt caching 적용
└── content-draft/route.ts                       # prompt caching 적용

packages/ai/src/agents/                          # 신규 (선택)
├── coupon-copy.ts
└── content-draft.ts
```

### 2-2. Agent 유형별 설계

| Agent | 트리거 소스 | 로직 | AI 필요? | 수락 시 효과 |
|---|---|---|---|---|
| **Coupon** | finance.dailyEntries (매출 감소), operations.inventory (유통기한) | 주 매출 15%↓ or 유통기한 3일↓ | **Yes** (카피 생성) | `marketing-store.addPromoCode()` |
| **Reorder** | operations.inventory | `quantity ≤ minThreshold × 1.2` or 소진 임박 | No (로컬 템플릿) | `operations.updateInventory(lastOrderedAt)` + 카톡 딥링크 |
| **Content** | finance.dailyEntries (신기록), roadmap (오픈 N주년) | 일매출 신기록, 주말 30%↑ | **Yes** (포스트 초안) | 클립보드 복사 + 인스타 딥링크 |
| **Review** | finance.dailyEntries (카드 매출 24h↑) | 어제 거래 수 ≥ 3건 | No (로컬 템플릿) | 네이버 리뷰 링크 복사 + 카톡 |

**AI 호출 절감**: 4개 중 2개만 API. 비용 ½.

### 2-3. agents-store.ts 타입 스케치

```typescript
export type AgentKind = "coupon" | "reorder" | "content" | "review";

export type AgentProposalStatus = "pending" | "accepted" | "skipped" | "expired";

export type AgentProposal = {
  id: string;                        // `${kind}-${timestamp}-${random}`
  kind: AgentKind;
  createdAt: string;                  // ISO
  expiresAt: string;                  // ISO — 48h 후 expired
  status: AgentProposalStatus;
  acceptedAt?: string;
  skippedAt?: string;

  // 트리거 정보 (감지 시점 스냅샷)
  trigger: {
    type: string;                     // "sales-drop-15", "stock-low-eggs" 등
    reason: { ko: string; en: string };
    metric?: Record<string, number>;  // 감지 당시 수치
  };

  // 제안 내용 (AI 생성 or 템플릿)
  content: {
    // Coupon
    couponCode?: string;
    discountValue?: number;
    discountType?: "percent" | "amount";
    couponCopy?: { ko: string; en: string };
    // Reorder
    itemId?: string;
    itemName?: string;
    recommendedQty?: number;
    supplierMessage?: string;
    // Content
    postDraft?: { ko: string; en: string };
    hashtags?: string[];
    // Review
    reviewLink?: string;
    reviewMessage?: string;
  };

  // 예상 임팩트 (KPI 추적용)
  expectedImpact?: {
    metric: "sales" | "stock" | "awareness" | "reviews";
    estimatedValue?: number;
    unit: string;
  };
};

type AgentsState = {
  proposals: AgentProposal[];           // 모든 제안 이력 (30일 유지)
  enabledAgents: Record<AgentKind, boolean>;
  lastTriggerCheckAt: string | null;    // 마지막 감지 실행 시각
  acceptedCount: Record<AgentKind, number>; // KPI
  skippedCount: Record<AgentKind, number>;  // KPI
  // Phase 2 자동실행 (UI만, 지금은 항상 false)
  autoApproveEnabled: Record<AgentKind, boolean>;
  autoApproveLimits: Partial<Record<AgentKind, {
    maxPerDay?: number;
    maxPerMonth?: number;
    maxAmountPerAction?: number;
  }>>;
};
```

### 2-4. agent-triggers.ts 시그니처

```typescript
export type TriggerInput = {
  industryCategoryId: string;
  dailyEntries: DailyEntry[];
  inventory: InventoryItem[];
  existingProposals: AgentProposal[];   // 쿨다운 체크용
  now: Date;
};

export type TriggerCandidate = {
  kind: AgentKind;
  trigger: AgentProposal["trigger"];
  content: Partial<AgentProposal["content"]>;  // AI 호출 전 기본값
  expectedImpact?: AgentProposal["expectedImpact"];
  requiresAi: boolean;                          // true면 API 호출 필요
};

export function detectAllTriggers(input: TriggerInput): TriggerCandidate[];

// 개별 함수 (순수)
export function detectCouponOpportunity(input: TriggerInput): TriggerCandidate | null;
export function detectReorderUrgency(input: TriggerInput): TriggerCandidate | null;
export function detectContentOpportunity(input: TriggerInput): TriggerCandidate | null;
export function detectReviewOpportunity(input: TriggerInput): TriggerCandidate | null;
```

**쿨다운 규칙**:
- 같은 kind: 24h 내 기존 pending 있으면 스킵
- 스킵된 kind: 3일 쿨다운
- 수락된 kind: 7일 쿨다운

### 2-5. useAgentOrchestration hook

```typescript
export function useAgentOrchestration() {
  // 1. 스토어들에서 읽기
  const industryCategoryId = useProfileStore(s => s.selectedIndustryCategoryId);
  const dailyEntries = useFinanceStore(s => s.dailyEntries);
  const inventory = useOperationsStore(s => s.inventory);
  const { proposals, addProposal, ...rest } = useAgentsStore();

  // 2. 데이터 변경 시 트리거 재평가 (debounced)
  useEffect(() => {
    const candidates = detectAllTriggers({ dailyEntries, inventory, ... });
    candidates.forEach(c => {
      if (c.requiresAi) {
        // 백그라운드 AI 호출
        fetchAgentContent(c).then(enriched => addProposal(enriched));
      } else {
        addProposal({ ...c, content: fillLocalTemplate(c) });
      }
    });
  }, [dailyEntries.length, inventory.length, /*...*/]);

  // 3. 현재 pending 제안 반환 (최대 3)
  const active = proposals
    .filter(p => p.status === "pending" && new Date(p.expiresAt) > new Date())
    .slice(0, 3);

  return { active, acceptProposal, skipProposal };
}
```

### 2-6. API 엔드포인트 — prompt caching 첫 도입

```typescript
// app/api/ai/agents/coupon-copy/route.ts

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Free 3/day, Pro 10/day, Business 20/day — 지금은 10 통일
  const rateLimit = checkSimpleRateLimit({
    key: `agent-coupon:${auth.userId}`,
    limit: 10,
    windowMs: 86_400_000,  // 24h
  });
  if (!rateLimit.ok) return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });

  const body = await request.json();

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT_COUPON,
        cache_control: { type: "ephemeral" },   // ← prompt caching 90% 할인
      },
    ],
    messages: [{ role: "user", content: buildUserPrompt(body) }],
  });

  // JSON 파싱 → 반환
}
```

### 2-7. UI 계층

**AgentProposalsSection** (섹션 컨테이너)
- 제목: "오늘의 행동 제안" / "Today's Actions"
- 최대 3개 AgentProposalCard 렌더
- 4개 이상이면 "더 보기 (+N)" 접힘
- 모든 Agent 꺼짐 상태면 null 반환 (UI 숨김)
- 설정 톱니 아이콘 → 어떤 Agent 활성화 설정

**AgentProposalCard** (공통 쉘)
- 아이콘 + 트리거 이유 ("매출 18% 하락 감지")
- kind별 body 컴포넌트 슬롯
- 하단: [적용] 원버튼 + [스킵]
- loading 상태 (AI 호출 중)
- accepted 시 2분 undo 창

**4개 Body 컴포넌트**
- 각자 "적용 시 효과" 표시
- kind별 미리보기 UI (쿠폰 코드, 재고 수량, 포스트 텍스트, 리뷰 링크)

---

## 3. 기존 코드와 충돌 방지 체크리스트

| 기존 기능 | 충돌 가능성 | 처리 |
|---|---|---|
| `MorningBriefing` AI 코칭 | "오늘 할 일"에 Agent 제안도 나옴 → 중복 우려 | MorningBriefing은 "상황 분석", Agent는 "구체 실행". 역할 분리 |
| `FirstCustomersCard`의 쿠폰 탭 | Coupon Agent가 쿠폰 생성 → 동일 UI 공유 | Agent 수락 시 `marketing-store.addPromoCode()` 호출. FirstCustomersCard가 자동 반영 |
| `CashflowCrisisActions` "긴급 쿠폰" 버튼 | 기존 버튼은 스크롤만, Agent는 실제 생성 | 기존 버튼이 Agent 제안 생성 트리거도 유발하도록 추후 연결 가능 (지금은 그대로) |
| `InventoryOpsCard` 재고 부족 알림 | Reorder Agent와 중복? | InventoryOpsCard는 "현황 표시", Reorder Agent는 "행동 제안". 보완적 |
| `/api/ai/dashboard/actions` | 비슷한 기능 | dashboard/actions는 "일반 조언", Agent는 "실행 가능한 단일 행동". 역할 분리 |

---

## 4. 성공 지표 (업계 표준 + 자체 지표)

| 지표 | 계산 | 6개월 목표 | 비고 |
|---|---|---|---|
| **Agent Accept Rate** | accepted / (accepted + skipped) | **30%+** | AI 제안 수락률 업계 20-40% |
| **Agent Impact Score** | 수락 후 7일 내 지표 개선 (매출/재고) | 측정 중 | 자체 지표 |
| **Daily Trigger Coverage** | 1일당 평균 제안 수 (목표 2-3) | 2-3건 | 너무 많으면 피로, 너무 적으면 가치↓ |
| **AI API 비용/사용자/월** | tokens × pricing | **<1,000원** | Haiku + caching 기준 |

---

## 5. Phase 2 자동실행 준비 사항 (지금은 skeleton만)

```typescript
// 각 제안에 추가:
autoExecutableAt: string | null;   // 타이머가 0 되면 자동 실행
autoApprovalSettings: {
  enabled: boolean;
  remainingSecondsToAutoRun: number;  // 10초 카운트다운
  limits: { /* kind별 한도 */ };
};
```

Phase 1에서는 필드 정의만, 실제 자동실행은 비활성.
Phase 2 출시 시 토글만 켜면 작동.

---

## 6. 구현 순서 (2주)

### Week 3
- **Day 1**: `agents-store.ts` + 타입 정의
- **Day 2**: `agent-triggers.ts` 4개 감지 함수 (순수)
- **Day 3**: `agent-content-templates.ts` (Reorder/Review 로컬)
- **Day 4**: `/api/ai/agents/coupon-copy` + prompt caching
- **Day 5**: `/api/ai/agents/content-draft` + prompt caching
- **Day 6**: `useAgentOrchestration` hook
- **Day 7**: 타입체크 + 유닛 테스트 (트리거 함수)

### Week 4
- **Day 8**: `AgentProposalCard` 공통 쉘
- **Day 9**: 4개 Body 컴포넌트
- **Day 10**: `AgentProposalsSection` 컨테이너 + 설정 시트
- **Day 11**: OperationalDashboard 통합
- **Day 12**: ko/en 번역 + 디자인 폴리싱
- **Day 13**: 엣지 케이스 (데이터 부족, API 실패, 쿨다운)
- **Day 14**: 빌드 + dev 재시작 + memory 업데이트

---

## 7. 확정 사항 (구현 직전)

- ✅ **트리거 = 로컬 순수 함수** (API 안 씀)
- ✅ **AI = Coupon/Content 2개만** (Haiku + prompt caching)
- ✅ **쿨다운**: 같은 kind 24h 기본 / 스킵 3일 / 수락 7일
- ✅ **최대 3개 동시 노출** (나머지 접힘)
- ✅ **기존 스토어의 액션 재사용** (별도 쓰기 경로 만들지 않음)
- ✅ **Phase 2 hooks만 정의**, 실제 자동실행은 비활성
- ✅ **prompt caching 최초 도입** — 90% 비용 절감

준비 완료. 구현 착수.
