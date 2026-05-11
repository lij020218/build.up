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
      type: "drink-pairing",
      headlineKo: "음료·주류 권유 — 객단가 업셀 핵심",
      actionKo: "음료 가격대: 콜라·사이다·제로 2,000–2,500원 (캔/페트), 생수 1,500원, 맥주 3,000–5,000원, 소주 4,000–5,000원. 음료 1잔 추가만으로 객단가 +2,000–2,500원. 한식·중식·분식·고기집은 주류 1병 추가 시 +50–100%. 홀: \"음료 추가하시겠어요?\" / \"술 한 잔 어떠세요?\" 표준 멘트. 배달: 결제 직전 음료·주류 옵션 노출 (주류는 배달앱 \"주류 판매업 신고\" 필요).",
      expectedImpactKo: "객단가 +10–30% (음료) / +50–100% (주류 포함)",
    },
    {
      type: "side-add",
      headlineKo: "유료 추가메뉴 명시 (반찬은 무료, 사이드는 별도)",
      actionKo: "한식: 공깃밥(1,000원)·계란찜(3,000원)·라면사리(2,000원)·만두(3–5,000원). 치킨: 치즈볼(3,500원)·콘샐러드(2,000원)·소떡소떡(3,000원)·치킨무 추가(1,000원). 분식: 라면사리·치즈·만두. 김치·단무지·기본 반찬은 무료 제공이 표준이라 유료 사이드 아님 (음료는 유료, 별도 카테고리). 메뉴판에 \"추가메뉴\" 섹션 분리 + 키오스크에서 메인 선택 직후 노출.",
      expectedImpactKo: "객단가 +5–10%",
    },
    {
      type: "set-bundle",
      headlineKo: "정식·세트 구성 (단품 합계의 85–90%)",
      actionKo: "단품 합계의 85–90%로 묶음 가격. 한식: \"정식\" (메인+밥+국+반찬), 분식: \"김밥+라면\" 세트, 치킨: \"치킨+사이드+음료\". 단품 고객 30%가 세트로 전환 시 객단가 +15–20%. 키오스크는 세트를 메뉴 상단에 배치.",
      expectedImpactKo: "객단가 +15–20%",
    },
    {
      type: "size-up",
      headlineKo: "곱빼기·왕·특 옵션 (가격 차이 작게)",
      actionKo: "기본 대비 +20–25% 가격으로 +40–50% 양. 한식: 곱빼기 +1,500–2,000원, 분식: 왕 +1,500원, 치킨: 점보·왕 +4–5,000원. 가성비 인식으로 선택률 30–50%.",
      expectedImpactKo: "객단가 +10–15%",
    },
    {
      type: "premium-tier",
      headlineKo: "특·시그니처 옵션 신설 (최고가 +20–30%)",
      actionKo: "한우·특·왕·시그니처 등 +20–30% 가격대 옵션. \"오늘은 좋은 거 먹자\" 심리로 고객 10–15%가 선택. 한국은 가격 저항 강해 +30% 이상 점프는 회피.",
      expectedImpactKo: "객단가 +3–5% (소수 채택)",
    },
  ],
  "cafe-dessert": [
    {
      type: "size-up",
      headlineKo: "레귤러→라지 +500원으로 (스타벅스 패턴)",
      actionKo: "스타벅스 톨→그란데 +600원, 메가커피 +500원이 시장 표준. 개인 카페도 +500원 이내면 라지 선택률 60%↑. 라지 컵 원가는 +50원 수준 → 마진 90%+.",
      expectedImpactKo: "객단가 +8–12%",
    },
    {
      type: "drink-pairing",
      headlineKo: "음료 + 디저트 세트 5–10% 할인",
      actionKo: "마카롱·휘낭시에·쿠키 단품(3,500–6,000원) 주문률 낮음. 음료와 묶어 5–10% 할인 시 디저트 회전 + 객단가. POS에 \"세트로 드릴까요?\" 한 마디 표준화.",
      expectedImpactKo: "객단가 +12–18%",
    },
    {
      type: "side-add",
      headlineKo: "샷 추가·시럽·휘핑 옵션 메뉴판 명시",
      actionKo: "\"샷 추가 +500원, 헤이즐넛·바닐라 시럽 +500원, 휘핑 +500원\" 메뉴판에 작은 글씨로 명시. 결제 1,000–2,000원 자연스럽게 증가. 라떼·아메리카노에 샷 추가율 20–30%.",
      expectedImpactKo: "객단가 +5–8%",
    },
    {
      type: "loyalty",
      headlineKo: "디지털 스탬프 10잔에 1잔 무료",
      actionKo: "카카오톡 채널·\"닷글마이샵\"·네이버 마이플레이스 스탬프 활용. 종이 쿠폰은 분실률 높음. 재방문 +20–30% + 신규 대비 마케팅비 1/5.",
      expectedImpactKo: "재방문 +20–30%, 매출 +10–15%",
    },
  ],
  beauty: [
    {
      type: "premium-tier",
      headlineKo: "프리미엄 케어 추가 옵션 신설",
      actionKo: "헤어샵 기본 시술 3–5만원 → 두피케어·매직·트리트먼트 +3–8만원 옵션. 객단가 6–8만원에서 12–15만원으로. 단골 위주 20–30% 채택. 평일 한가한 시간대 집중 권유.",
      expectedImpactKo: "객단가 +50–100%",
    },
    {
      type: "side-add",
      headlineKo: "시술 후 홈케어 제품 권유 (마진 60%+)",
      actionKo: "시술 직후 \"이거 1개월 쓰시면 효과 유지돼요\" 자연스럽게 권유. 헤어 제품 2–4만원, 두피·트리트먼트 키트 3–5만원. 도매가 30–40% 수준이라 마진 60%↑.",
      expectedImpactKo: "객단가 +1–3만원/고객",
    },
    {
      type: "loyalty",
      headlineKo: "회수권 (피부관리·네일은 5–10회, 헤어는 VIP 카드)",
      actionKo: "피부관리·네일·왁싱·속눈썹은 5–10회권 10% 할인 표준. 헤어샵은 시술 주기 길어 회수권 어려움 → \"단골 등록 -10%\" 또는 \"3회 시술 후 트리트먼트 무료\" 형태. 캐시플로 즉시 확보 + 이탈 방지.",
      expectedImpactKo: "고객 LTV +50%, 캐시플로 즉시",
    },
  ],
  retail: [
    {
      type: "side-add",
      headlineKo: "결제대 옆 충동구매 상품 (1–3,000원대)",
      actionKo: "편의점·슈퍼: 껌·사탕·초콜릿, 옷가게: 양말·헤어밴드·액세서리, 잡화: 키링·스티커. 포스 옆 30cm 이내 배치 시 30% 추가 결제율. \"이거 하나 어떠세요?\" 한 마디 표준화.",
      expectedImpactKo: "객단가 +5–8%",
    },
    {
      type: "set-bundle",
      headlineKo: "관련 상품 묶음 가격 (5–10% 할인)",
      actionKo: "주력 상품 + 보완재 묶음. 옷: 상의+하의, 화장품: 클렌저+토너+크림, 펫샵: 사료+간식+장난감. 단품 대비 5–10% 할인 표기로 묶음 객단가 +30–50%.",
      expectedImpactKo: "객단가 +15–25%",
    },
  ],
  fitness: [
    {
      type: "loyalty",
      headlineKo: "PT 패키지 (10회·20회) — 회당 단가 절감",
      actionKo: "PT 1회 7–10만원 표준. 10회권 60–80만원 (5–10% 할인), 20회권 120–150만원 (10–15% 할인). 카드 무이자 할부 권장 (사장님 캐시플로 즉시 + 고객 부담↓). 회수권 환불 규정은 \"방문판매법\" 준수 (남은 회차 환불 의무).",
      expectedImpactKo: "고객 LTV +60%, 캐시플로 즉시",
    },
    {
      type: "premium-tier",
      headlineKo: "회원권 등급제 (헬스 + 1:1 PT / 소그룹 GX)",
      actionKo: "기본 헬스 월 6–10만원 + 1:1 PT 월 30–50만원, 또는 소그룹 GX(5–8인) 월 +5–10만원. 1:1과 GX는 별개 카테고리 (1:1은 프리미엄, GX는 중간 가격대). 회원 10–20%가 PT·GX로 업그레이드.",
      expectedImpactKo: "객단가 +30–80%",
    },
  ],
  education: [
    {
      type: "set-bundle",
      headlineKo: "본 강의 + 교재·자료 패키지",
      actionKo: "강의비 + 교재·문제집·디지털 자료 묶음. 별도 구매 부담 → 패키지로 자연스럽게. 학원은 \"교재비 별도\" 대신 \"올인원 패키지\" 형태가 등록률↑.",
      expectedImpactKo: "객단가 +15–20%",
    },
    {
      type: "loyalty",
      headlineKo: "분기·연간 선결제 할인 (5–10%)",
      actionKo: "월 결제 vs 분기·연간 옵션. 학원 \"학원법\" 상 3개월 이상 선납 시 환불 보장 의무. 캐시플로 안정 + 학생 이탈 방지. 형제 할인·친구 추천 할인도 LTV↑.",
      expectedImpactKo: "이탈률 −30%, 캐시플로 즉시",
    },
  ],
};

// 일반 패턴 (모든 업종 공통)
const COMMON_PATTERNS: Array<Pick<UpsellSuggestion, "type" | "headlineKo" | "actionKo" | "expectedImpactKo">> = [
  {
    type: "menu-rename",
    headlineKo: "메뉴 네이밍에 가치 단어 (실제 사실인 경우만)",
    actionKo: "\"수제\"·\"국산\"·\"직접 담근\"·\"시그니처\"·\"숙성\" 등. ⚠️ 식품표시광고법상 허위 표기는 영업정지·과태료 1천만원 이하. 실제로 그렇지 않으면 절대 사용 금지 (특히 \"수제\"·\"국산\"은 단속 빈번). 사실에 기반한 네이밍 시 가격 5–10% 인상 수용도↑.",
    expectedImpactKo: "객단가 +5–10%",
  },
  {
    type: "loyalty",
    headlineKo: "디지털 스탬프 10회에 1회 무료",
    actionKo: "카카오톡 채널·네이버 마이플레이스·\"닷글마이샵\" 활용 (종이 쿠폰은 분실률 50%↑). 재방문 +20–30% (Bain — retention 5%↑ → 이익 25–95%↑). 신규 고객 획득비 대비 1/5 비용.",
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
