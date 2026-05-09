/**
 * 객단가 업셀/크로스셀 제안 엔진 (룰 기반).
 *
 * 사용처: AvgTicketUpsellCard — 외식·카페·뷰티 사장님이 객단가 +10–15% 올리는
 *        구체적 액션 자동 추천. AI 호출 X (룰 기반, 즉시 응답, 비용 0).
 *
 * 원리:
 *   1. 메뉴 가격 분포 분석 → 가격대별 client (저가·중간·프리미엄)
 *   2. 매출 비중 vs 마진 비중 → 황금 메뉴 / 짐 메뉴 식별
 *   3. 업종별 검증된 업셀 패턴 매칭 → 구체 액션 + 예상 효과
 *
 * 출처:
 *   - "퍼포먼스 마케팅의 수학공식: 매출액 = 객단가 × 거래건수" (toss SEMO)
 *   - 외식 사장님 매출 2배 사례 (창톡)
 *   - Square POS upsell guide
 */

export type MenuItemInput = {
  id: string;
  name: string;
  price: number;          // 원
  cost?: number;          // 원가 (있으면)
  monthlySold?: number;   // 월 판매수량 (있으면)
  category?: string;
};

export type UpsellSuggestion = {
  id: string;
  /** 추천 카테고리 */
  type: "set-bundle" | "side-add" | "premium-tier" | "drink-pairing" | "size-up" | "loyalty" | "menu-rename";
  /** 헤드라인 — 한 줄 요약 */
  headlineKo: string;
  /** 구체적 실행 방법 */
  actionKo: string;
  /** 예상 효과 (객단가 % 또는 매출 %) */
  expectedImpactKo: string;
  /** 근거 메뉴 (있으면) */
  refMenuItemIds?: string[];
  /** 우선순위 점수 0-100 */
  score: number;
};

export type UpsellSuggestInput = {
  industryCategoryId?: string | null;
  /** 메뉴 목록 — products + unifiedProducts + serviceMenuItems 모두 normalize 후 */
  menuItems: MenuItemInput[];
  /** 현재 객단가 (원) — 기준점 */
  currentAvgTicket?: number | null;
  /** 업종 평균 객단가 — 비교용 (있으면) */
  benchmarkAvgTicket?: number | null;
};

// ─── 메뉴 분석 ─────────────────────────────────────────────────────

export type MenuAnalysis = {
  totalItems: number;
  /** 가격 분위 — Q1/median/Q3 */
  priceQuartiles: { q1: number; median: number; q3: number; min: number; max: number };
  /** 황금 메뉴: 매출 비중 상위 + 마진 양호 */
  starItems: MenuItemInput[];
  /** 짐 메뉴: 매출 비중 하위 + 마진 낮음 */
  draggers: MenuItemInput[];
  /** 가격 갭: 인접 가격대 사이 큰 점프 (= 업셀 기회) */
  priceGaps: Array<{ from: number; to: number; gapPct: number }>;
};

export function analyzeMenu(items: MenuItemInput[]): MenuAnalysis {
  if (items.length === 0) {
    return {
      totalItems: 0,
      priceQuartiles: { q1: 0, median: 0, q3: 0, min: 0, max: 0 },
      starItems: [],
      draggers: [],
      priceGaps: [],
    };
  }

  const sortedByPrice = [...items].sort((a, b) => a.price - b.price);
  const prices = sortedByPrice.map((i) => i.price);
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const median = prices[Math.floor(prices.length * 0.5)];
  const q3 = prices[Math.floor(prices.length * 0.75)];

  // 매출 = price × monthlySold (없으면 그냥 price 비례)
  const withRevenue = items.map((i) => ({
    item: i,
    revenue: i.price * (i.monthlySold ?? 1),
    margin: i.cost != null ? i.price - i.cost : i.price * 0.4,    // 가정 40%
  }));

  const totalRev = withRevenue.reduce((s, w) => s + w.revenue, 0);
  withRevenue.sort((a, b) => b.revenue - a.revenue);

  // 황금 메뉴: 매출 상위 30% + 마진 양호
  const starsCount = Math.max(1, Math.ceil(items.length * 0.3));
  const stars = withRevenue.slice(0, starsCount).filter((w) => w.margin > 0).map((w) => w.item);

  // 짐 메뉴: 매출 하위 30%
  const draggersList = withRevenue.slice(-Math.max(1, Math.ceil(items.length * 0.3))).map((w) => w.item);

  // 가격 갭: 인접 가격이 30%+ 점프
  const priceGaps: Array<{ from: number; to: number; gapPct: number }> = [];
  for (let i = 0; i < sortedByPrice.length - 1; i++) {
    const cur = sortedByPrice[i].price;
    const next = sortedByPrice[i + 1].price;
    if (cur > 0 && (next - cur) / cur >= 0.3) {
      priceGaps.push({ from: cur, to: next, gapPct: ((next - cur) / cur) * 100 });
    }
  }

  return {
    totalItems: items.length,
    priceQuartiles: { q1, median, q3, min: prices[0], max: prices[prices.length - 1] },
    starItems: stars,
    draggers: draggersList,
    priceGaps,
  };
}

// ─── 업종별 업셀 패턴 ─────────────────────────────────────────────

const PATTERNS_BY_INDUSTRY: Record<string, Array<Pick<UpsellSuggestion, "type" | "headlineKo" | "actionKo" | "expectedImpactKo">>> = {
  food: [
    {
      type: "set-bundle",
      headlineKo: "메인 + 사이드 + 음료 세트 구성",
      actionKo: "단품 가격 합의 90%로 묶음 가격 책정. 단품 주문 고객의 30%가 세트로 전환되면 객단가 +15–20%.",
      expectedImpactKo: "객단가 +15–20%",
    },
    {
      type: "side-add",
      headlineKo: "주문 시 사이드 1개 추천 (1,000–3,000원대)",
      actionKo: "키오스크/포스에 \"사이드 추가하시겠어요?\" 플로우. 한식·치킨은 김치·치즈볼·스프 추가 효과 큼.",
      expectedImpactKo: "객단가 +5–10%",
    },
    {
      type: "drink-pairing",
      headlineKo: "음료 페어링 (맥주·콜라·소주) 자연스럽게 권유",
      actionKo: "메인 메뉴 옆에 \"이 메뉴와 잘 어울리는 음료\" 작은 글씨 표시. 한식·중식 효과 큼.",
      expectedImpactKo: "객단가 +8–12%",
    },
    {
      type: "premium-tier",
      headlineKo: "프리미엄 메뉴 1개 신설 (현재 최고가 +30%)",
      actionKo: "현재 최고가 메뉴보다 30% 비싼 \"오늘의 추천\" 또는 \"프리미엄\" 옵션. 고객 10%가 선택.",
      expectedImpactKo: "객단가 +3–5% (소수 채택)",
    },
    {
      type: "size-up",
      headlineKo: "라지 사이즈 / 더블 옵션 가격 차이 작게",
      actionKo: "기본 대비 +20% 가격으로 +50% 양 제공. 가성비 인식 → 라지 선택률 50%+.",
      expectedImpactKo: "객단가 +10–15%",
    },
  ],
  "cafe-dessert": [
    {
      type: "size-up",
      headlineKo: "라지 사이즈 +500원으로 인식 변환",
      actionKo: "톨 → 그란데 가격 차이 500원 이내로. 그란데 선택률 60%+ (스타벅스 패턴).",
      expectedImpactKo: "객단가 +8–12%",
    },
    {
      type: "drink-pairing",
      headlineKo: "음료 + 디저트 세트 5–10% 할인",
      actionKo: "디저트 단품 주문률 낮음 → 음료에 +2,000–3,000원 추가만으로 디저트 매칭. 객단가 + 디저트 회전.",
      expectedImpactKo: "객단가 +12–18%",
    },
    {
      type: "side-add",
      headlineKo: "샷 추가·시럽·휘핑 옵션 노출",
      actionKo: "메뉴판에 \"샷 +500원, 헤이즐넛 시럽 +500원\" 명시. 자연스럽게 결제 +1,000–2,000원.",
      expectedImpactKo: "객단가 +5–8%",
    },
    {
      type: "loyalty",
      headlineKo: "10잔에 1잔 무료 스탬프 (단골 락인)",
      actionKo: "카카오톡 채널 + 디지털 스탬프. 재방문율 30%↑ + 객단가 추가 디저트 자연스럽게.",
      expectedImpactKo: "재방문 +30%, 매출 +15%",
    },
  ],
  beauty: [
    {
      type: "premium-tier",
      headlineKo: "프리미엄 케어 추가 (5–10만원대 옵션)",
      actionKo: "기본 시술에 두피·관리·홈케어 키트 5–10만원 추가. 객단가 큰 폭 상승 + 단골화.",
      expectedImpactKo: "객단가 +20–30%",
    },
    {
      type: "side-add",
      headlineKo: "시술 후 홈케어 제품 1개 추천",
      actionKo: "시술 직후 \"이 제품 1개월 사용\" 추천. 마진 60%+ 제품 선택. 매출 +1–3만원/고객.",
      expectedImpactKo: "객단가 +10–20%",
    },
    {
      type: "loyalty",
      headlineKo: "패키지 (5회·10회) 선결제 — 단골 락인",
      actionKo: "5회권 10% 할인. 사장님 캐시플로 + 고객 충성도 동시. 미용·피부관리 효과 큼.",
      expectedImpactKo: "고객 LTV +50%, 캐시플로 즉시",
    },
  ],
  retail: [
    {
      type: "side-add",
      headlineKo: "결제 직전 \"+1 추가\" 작은 가격 상품 노출",
      actionKo: "포스 옆에 1,000–3,000원대 작은 상품 (껌·사탕·소품). 30% 추가 결제율.",
      expectedImpactKo: "객단가 +5–8%",
    },
    {
      type: "set-bundle",
      headlineKo: "관련 상품 2–3개 묶음 가격 (5–10% 할인)",
      actionKo: "주력 상품 + 보완재 묶음. 단품 대비 5–10% 할인 = 단가 +30–50%.",
      expectedImpactKo: "객단가 +15–25%",
    },
  ],
  fitness: [
    {
      type: "loyalty",
      headlineKo: "PT 패키지 (10회·20회) — 1회 단가 절감",
      actionKo: "1회 5만원 → 10회 45만원 (10% 할인). 사장님 캐시플로 + 고객 락인.",
      expectedImpactKo: "고객 LTV +60%",
    },
    {
      type: "premium-tier",
      headlineKo: "프리미엄 GX·1:1 옵션 신설",
      actionKo: "기본 회원권 + 프리미엄 (8–12만원/월) 옵션. 회원 20%가 업그레이드.",
      expectedImpactKo: "객단가 +25%",
    },
  ],
  education: [
    {
      type: "set-bundle",
      headlineKo: "본 강의 + 보충 자료/교재 패키지",
      actionKo: "강의비 + 교재·디지털 자료 묶음. 별도 구매 부담 → 패키지로 자연스럽게.",
      expectedImpactKo: "객단가 +15–20%",
    },
    {
      type: "loyalty",
      headlineKo: "분기·연간 결제 할인 (5–10%)",
      actionKo: "월 결제 vs 분기·연간 옵션. 캐시플로 안정 + 학생 이탈 방지.",
      expectedImpactKo: "이탈률 −30%",
    },
  ],
};

// 일반 패턴 (모든 업종 공통)
const COMMON_PATTERNS: Array<Pick<UpsellSuggestion, "type" | "headlineKo" | "actionKo" | "expectedImpactKo">> = [
  {
    type: "menu-rename",
    headlineKo: "메뉴 이름에 가치 단어 추가 (수제·국산·시그니처)",
    actionKo: "메뉴 이름 앞에 \"수제\" \"국산\" \"시그니처\" 등 가치 단어. 가격 5–10% 인상 가능.",
    expectedImpactKo: "객단가 +5–10%",
  },
  {
    type: "loyalty",
    headlineKo: "단골 카드 (스탬프 10개에 1개 무료)",
    actionKo: "카카오톡 채널 디지털 스탬프. 재방문율 +20–30% (Bain — retention 5%↑ → 이익 25–95%↑).",
    expectedImpactKo: "재방문 +20–30%",
  },
];

// ─── 메인 함수 ──────────────────────────────────────────────────────

export function suggestUpsells(input: UpsellSuggestInput): UpsellSuggestion[] {
  const cat = input.industryCategoryId ?? "general";
  const patterns = PATTERNS_BY_INDUSTRY[cat] ?? [];
  const all = [...patterns, ...COMMON_PATTERNS];

  const analysis = analyzeMenu(input.menuItems);

  // 점수 부여
  const scored: UpsellSuggestion[] = all.map((p, idx) => {
    let score = 60 - idx * 3;     // 기본: 업종 매칭 우선
    let action = p.actionKo;
    const refMenuItemIds: string[] = [];

    // 짐 메뉴가 많으면 set-bundle / drink-pairing 우선
    if ((p.type === "set-bundle" || p.type === "drink-pairing") && analysis.draggers.length > 0) {
      score += 15;
      const dragger = analysis.draggers[0];
      action = `${action} 특히 매출 낮은 「${dragger.name}」 같은 메뉴를 묶어 활성화 가능.`;
      refMenuItemIds.push(dragger.id);
    }

    // 가격 갭이 있으면 premium-tier / size-up 우선
    if ((p.type === "premium-tier" || p.type === "size-up") && analysis.priceGaps.length > 0) {
      score += 10;
      const gap = analysis.priceGaps[0];
      action = `${action} 현재 ${formatWonShort(gap.from)} → ${formatWonShort(gap.to)} 사이 ${Math.round(gap.gapPct)}% 가격 갭이 있어, 중간 옵션 신설 권장.`;
    }

    // 메뉴가 너무 적으면 (1–3개) 프리미엄·세트 어려움
    if (analysis.totalItems < 3 && (p.type === "set-bundle" || p.type === "premium-tier")) {
      score -= 20;
    }

    // 객단가가 업종 벤치마크보다 낮으면 더 적극 추천
    if (input.currentAvgTicket && input.benchmarkAvgTicket && input.currentAvgTicket < input.benchmarkAvgTicket * 0.8) {
      score += 10;
    }

    return {
      id: `upsell-${cat}-${p.type}-${idx}`,
      type: p.type,
      headlineKo: p.headlineKo,
      actionKo: action,
      expectedImpactKo: p.expectedImpactKo,
      refMenuItemIds: refMenuItemIds.length > 0 ? refMenuItemIds : undefined,
      score: Math.max(0, Math.min(100, score)),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4);
}

function formatWonShort(won: number): string {
  if (won >= 10_000) return `${Math.round(won / 1_000) / 10}만원`;
  return `${won.toLocaleString()}원`;
}
