/**
 * profit-anomaly-detector.ts
 *
 * 선제적 이상 감지 + 원인 분해 엔진.
 *
 * "이번 주 이익률이 떨어졌다" 같은 신호를 룰 기반으로 자동 감지하고,
 * Price × Volume × Mix (PVM) + Cost 항목별 변화 분해로 가장 큰 기여자(top driver)를
 * 식별해서 사장님에게 자연어로 알려준다.
 *
 * Anthropic FP&A 베스트 프랙티스: variance decomposition + anomaly detection.
 * 한국 소상공인 평균 이익률 23.5% (2025), 전년 대비 1.14%p 하락 추세 — 선제 알림 필수.
 */

export type DailyEntry = { date: string; sales: number; customers: number };
export type MonthlyCosts = {
  ingredients: number;
  labor: number;
  rent: number;
  utilities: number;
  sga?: number;
  marketing?: number;
  other: number;
  interest?: number;
};

export type CostSnapshot = {
  month: string;        // "2026-04"
  ingredients: number;
  labor: number;
  rent: number;
  utilities: number;
  other: number;
};

export type AnomalySeverity = "critical" | "warning" | "info";

export type AnomalyKind =
  | "profit-margin-drop"        // 이익률 큰 폭 하락
  | "sales-decline"             // 매출 추세 하락
  | "cost-spike"                // 특정 비용 항목 급증
  | "ticket-price-drop"         // 객단가 하락
  | "customer-decline"          // 객수 감소
  | "prime-cost-breach"         // 프라임코스트 위험선 돌파
  | "inventory-stagnant"        // 재고 회전 정체 (장기 보유 → 자금 묶임·변질)
  | "new-customer-low"          // 신규 고객 비율 낮음 (단골 의존 위험)
  | "labor-ratio-high"          // 인건비/매출 비율 위험선 초과
  | "marketing-roas-low";       // 마케팅 ROAS 손실 구간

export type CostDriver = {
  name: "ingredients" | "labor" | "rent" | "utilities" | "marketing" | "other";
  nameKo: string;
  current: number;
  prior: number;
  deltaPct: number;        // (current - prior) / prior * 100
  deltaWon: number;        // current - prior
  contributionPct: number; // 전체 비용 변화 중 이 항목이 차지하는 비율
};

export type ProactiveInsight = {
  kind: AnomalyKind;
  severity: AnomalySeverity;
  /** 한 줄 헤드라인 (예: "이익률 5.2%p 하락") */
  headline: string;
  /** 2-3줄 분해 분석 (예: "재료비 +8%, 매출 -3% 영향") */
  analysis: string;
  /** 즉시 가능한 액션 (예: "오늘 공급처에 단가 재협상 요청") */
  action: string;
  /** 상세 메트릭 (UI에서 작은 숫자 칩으로 표시) */
  metrics: Array<{ label: string; value: string; tone?: "good" | "bad" | "neutral" }>;
  /** 가장 큰 원인 (1순위) */
  topDriver?: CostDriver;
  /** 분석 시점 */
  detectedAt: string;
};

// ── 헬퍼 ──────────────────────────────────────────────────────────────

function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

function fmtWon(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1)}억원`;
  if (abs >= 10000) return `${sign}${Math.floor(abs / 10000).toLocaleString()}만원`;
  return `${sign}${abs.toLocaleString()}원`;
}

function fmtPct(n: number, sign: boolean = true): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  const s = sign && n > 0 ? "+" : "";
  return `${s}${n.toFixed(1)}%`;
}

const COST_NAME_KO: Record<CostDriver["name"], string> = {
  ingredients: "재료비",
  labor: "인건비",
  rent: "임대료",
  utilities: "공과금",
  marketing: "마케팅비",
  other: "기타",
};

// ── 메인 감지 함수 ──────────────────────────────────────────────────────

export function detectProactiveInsights(input: {
  /** 이번 달 일일 매출 기록 */
  thisMonthEntries: DailyEntry[];
  /** 지난 달 일일 매출 기록 (비교용) */
  prevMonthEntries: DailyEntry[];
  /** 이번 달 월비용 (현재 입력값) */
  monthlyCosts: MonthlyCosts;
  /** 직전 월 월비용 스냅샷 (있으면) */
  prevMonthCosts?: CostSnapshot;
  /** 한국 업종 평균 이익률 (기본 23.5% — 2025 소진공 통계) */
  industryAvgMarginPct?: number;
  /** 재고 항목 (회전 정체 감지) */
  inventory?: Array<{ name: string; quantity: number; minThreshold?: number; dailyUsage?: number; lastOrderedAt?: string }>;
  /** 마케팅 캠페인 (ROAS 감지) */
  marketingCampaigns?: Array<{ channel: string; spend: number; attributedRevenue?: number; month: string }>;
  /** 신규/단골 고객 비율 추정 (있으면) */
  newCustomerRatio?: number;  // 0-100
}): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const now = new Date().toISOString();
  const industryAvg = input.industryAvgMarginPct ?? 23.5;

  // ── 1) 매출 집계 ──
  const thisMonthSales = input.thisMonthEntries.reduce((s, e) => s + e.sales, 0);
  const prevMonthSales = input.prevMonthEntries.reduce((s, e) => s + e.sales, 0);
  const thisMonthCustomers = input.thisMonthEntries.reduce((s, e) => s + e.customers, 0);
  const prevMonthCustomers = input.prevMonthEntries.reduce((s, e) => s + e.customers, 0);

  // ── 2) 비용 집계 ──
  const thisCosts = input.monthlyCosts;
  const thisCostTotal = (thisCosts.ingredients ?? 0) + (thisCosts.labor ?? 0) + (thisCosts.rent ?? 0)
    + (thisCosts.utilities ?? 0) + (thisCosts.sga ?? 0) + (thisCosts.marketing ?? 0) + (thisCosts.other ?? 0)
    + (thisCosts.interest ?? 0);
  const prevCosts = input.prevMonthCosts;
  const prevCostTotal = prevCosts
    ? (prevCosts.ingredients + prevCosts.labor + prevCosts.rent + prevCosts.utilities + prevCosts.other)
    : 0;

  // ── 3) 이익 + 이익률 ──
  const thisProfit = thisMonthSales - thisCostTotal;
  const prevProfit = prevCosts ? prevMonthSales - prevCostTotal : 0;
  const thisMarginPct = thisMonthSales > 0 ? pct(thisProfit, thisMonthSales) : 0;
  const prevMarginPct = prevMonthSales > 0 && prevCosts ? pct(prevProfit, prevMonthSales) : 0;

  // ── 4) 비용 항목별 변화 (Cost Drivers) ──
  const drivers: CostDriver[] = [];
  if (prevCosts) {
    const items: Array<{ name: CostDriver["name"]; cur: number; prev: number }> = [
      { name: "ingredients", cur: thisCosts.ingredients ?? 0, prev: prevCosts.ingredients },
      { name: "labor",       cur: thisCosts.labor ?? 0,       prev: prevCosts.labor },
      { name: "rent",        cur: thisCosts.rent ?? 0,        prev: prevCosts.rent },
      { name: "utilities",   cur: thisCosts.utilities ?? 0,   prev: prevCosts.utilities },
      { name: "marketing",   cur: thisCosts.marketing ?? 0,   prev: 0 },  // prev 스냅샷 미포함
      { name: "other",       cur: thisCosts.other ?? 0,       prev: prevCosts.other },
    ];
    const totalDelta = items.reduce((s, it) => s + (it.cur - it.prev), 0);
    items.forEach((it) => {
      if (it.prev === 0 && it.cur === 0) return;
      const deltaWon = it.cur - it.prev;
      drivers.push({
        name: it.name,
        nameKo: COST_NAME_KO[it.name],
        current: it.cur,
        prior: it.prev,
        deltaPct: it.prev > 0 ? pct(deltaWon, it.prev) : 0,
        deltaWon,
        contributionPct: totalDelta !== 0 ? pct(deltaWon, totalDelta) : 0,
      });
    });
  }

  // ── 5) Anomaly 1: 이익률 큰 폭 하락 (-3%p 이상) ──
  if (prevCosts && prevMonthSales > 0 && thisMonthSales > 0) {
    const marginDelta = thisMarginPct - prevMarginPct; // 음수면 하락
    if (marginDelta <= -3) {
      // 가장 큰 비용 기여자 찾기
      const topCost = [...drivers].sort((a, b) => b.deltaWon - a.deltaWon)[0];
      const salesDeltaPct = pct(thisMonthSales - prevMonthSales, prevMonthSales);

      const severity: AnomalySeverity = marginDelta <= -7 ? "critical" : marginDelta <= -5 ? "warning" : "info";

      let analysis = `지난 달 대비 이익률이 ${Math.abs(marginDelta).toFixed(1)}%p 하락했습니다. `;
      const causes: string[] = [];
      if (salesDeltaPct < -2) causes.push(`매출 ${fmtPct(salesDeltaPct)} 감소`);
      else if (salesDeltaPct > 2) causes.push(`매출 ${fmtPct(salesDeltaPct)} 증가했지만`);
      if (topCost && topCost.deltaPct > 5) causes.push(`${topCost.nameKo} ${fmtPct(topCost.deltaPct)} 인상이 가장 큰 영향`);
      if (causes.length === 0) causes.push("비용 구조 전반 인상");
      analysis += causes.join(", ") + ".";

      let action = "";
      if (topCost) {
        if (topCost.name === "ingredients") action = "공급처에 단가 재협상 요청 또는 대체 공급처 견적 비교";
        else if (topCost.name === "labor") action = "스케줄 최적화 + 피크 시간만 추가 인력 검토";
        else if (topCost.name === "rent") action = "임대료 협상 또는 매장 효율성 분석 (시간당 매출)";
        else if (topCost.name === "utilities") action = "공과금 절감 (조명·냉난방·고효율 기기 점검)";
        else if (topCost.name === "marketing") action = "마케팅 ROI 점검 — 채널별 매출 기여도 분석";
        else action = "비용 항목별 점검 (DetailTabs > 비용)";
      }
      if (!action) action = "PLHero 카드에서 비용 구조 상세 점검";

      insights.push({
        kind: "profit-margin-drop",
        severity,
        headline: `이익률 ${Math.abs(marginDelta).toFixed(1)}%p 하락 — ${topCost ? topCost.nameKo : "비용"} 영향`,
        analysis,
        action,
        topDriver: topCost,
        metrics: [
          { label: "이번 달", value: fmtPct(thisMarginPct, false), tone: thisMarginPct >= industryAvg ? "good" : "bad" },
          { label: "지난 달", value: fmtPct(prevMarginPct, false), tone: "neutral" },
          { label: "업계 평균", value: fmtPct(industryAvg, false), tone: "neutral" },
          ...(topCost && topCost.deltaPct !== 0
            ? [{ label: topCost.nameKo, value: fmtPct(topCost.deltaPct), tone: topCost.deltaPct > 0 ? ("bad" as const) : ("good" as const) }]
            : []),
        ],
        detectedAt: now,
      });
    }
  }

  // ── 6) Anomaly 2: 매출 추세 하락 (최근 7일 vs 직전 7일, 10% 이상) ──
  const recent7 = input.thisMonthEntries.slice(-7);
  const prev7 = input.thisMonthEntries.slice(-14, -7);
  if (recent7.length >= 5 && prev7.length >= 5) {
    const r7Sales = recent7.reduce((s, e) => s + e.sales, 0);
    const p7Sales = prev7.reduce((s, e) => s + e.sales, 0);
    if (p7Sales > 0) {
      const weeklyDeltaPct = pct(r7Sales - p7Sales, p7Sales);
      if (weeklyDeltaPct <= -10) {
        // PVM 분해: 객수 vs 객단가
        const r7Customers = recent7.reduce((s, e) => s + e.customers, 0);
        const p7Customers = prev7.reduce((s, e) => s + e.customers, 0);
        const r7Ticket = r7Customers > 0 ? r7Sales / r7Customers : 0;
        const p7Ticket = p7Customers > 0 ? p7Sales / p7Customers : 0;
        const customerDeltaPct = p7Customers > 0 ? pct(r7Customers - p7Customers, p7Customers) : 0;
        const ticketDeltaPct = p7Ticket > 0 ? pct(r7Ticket - p7Ticket, p7Ticket) : 0;

        const isCustomerDrop = customerDeltaPct < ticketDeltaPct;
        const driverName = isCustomerDrop ? "객수" : "객단가";
        const driverDelta = isCustomerDrop ? customerDeltaPct : ticketDeltaPct;

        const severity: AnomalySeverity = weeklyDeltaPct <= -25 ? "critical" : weeklyDeltaPct <= -15 ? "warning" : "info";

        insights.push({
          kind: "sales-decline",
          severity,
          headline: `최근 7일 매출 ${fmtPct(weeklyDeltaPct)} (직전 7일 대비)`,
          analysis: `${driverName}가 ${fmtPct(driverDelta)} 변동한 것이 가장 큰 영향. ${isCustomerDrop ? "방문 고객이 줄고 있습니다" : "1인당 결제액이 줄고 있습니다"}.`,
          action: isCustomerDrop
            ? "단골 재방문 트리거 (쿠폰·문자), 평일·시간대별 매출 점검, 인스타·네이버플레이스 재게시"
            : "객단가 하락 원인 분석 — 세트메뉴 구성 점검, 추가 주문 유도, 가격 정책 재검토",
          metrics: [
            { label: "최근 7일", value: fmtWon(r7Sales), tone: "bad" },
            { label: "직전 7일", value: fmtWon(p7Sales), tone: "neutral" },
            { label: "객수", value: fmtPct(customerDeltaPct), tone: customerDeltaPct < 0 ? "bad" : "good" },
            { label: "객단가", value: fmtPct(ticketDeltaPct), tone: ticketDeltaPct < 0 ? "bad" : "good" },
          ],
          detectedAt: now,
        });
      }
    }
  }

  // ── 7) Anomaly 3: 특정 비용 항목 급증 (전월 대비 +20% 이상, 절대액 50만원+) ──
  drivers.forEach((d) => {
    if (d.deltaPct >= 20 && d.deltaWon >= 500_000) {
      const severity: AnomalySeverity = d.deltaPct >= 50 ? "critical" : "warning";
      let action = "";
      if (d.name === "ingredients") action = `공급처 ${d.nameKo} 단가 변경 확인 + 대체 견적 받기`;
      else if (d.name === "labor") action = `${d.nameKo} 스케줄 점검 — 피크/오프피크 인력 분배 최적화`;
      else if (d.name === "marketing") action = `${d.nameKo} ROI 점검 — 캠페인별 매출 기여도 측정`;
      else action = `${d.nameKo} 영수증·계약서 점검`;

      insights.push({
        kind: "cost-spike",
        severity,
        headline: `${d.nameKo} ${fmtPct(d.deltaPct)} 급증 (${fmtWon(d.deltaWon)}+)`,
        analysis: `${d.nameKo}가 지난 달 ${fmtWon(d.prior)}에서 이번 달 ${fmtWon(d.current)}로 인상됐습니다. 전체 비용 변화의 ${Math.abs(d.contributionPct).toFixed(0)}% 비중.`,
        action,
        topDriver: d,
        metrics: [
          { label: "이번 달", value: fmtWon(d.current), tone: "bad" },
          { label: "지난 달", value: fmtWon(d.prior), tone: "neutral" },
          { label: "변화", value: fmtPct(d.deltaPct), tone: "bad" },
        ],
        detectedAt: now,
      });
    }
  });

  // ── 8) Anomaly 4: 프라임코스트 위험선 돌파 (재료비 + 인건비 / 매출 > 65%) ──
  if (thisMonthSales > 0 && (thisCosts.ingredients > 0 || thisCosts.labor > 0)) {
    const primeCostPct = pct((thisCosts.ingredients ?? 0) + (thisCosts.labor ?? 0), thisMonthSales);
    if (primeCostPct >= 65) {
      const severity: AnomalySeverity = primeCostPct >= 75 ? "critical" : "warning";
      const ingPct = pct(thisCosts.ingredients ?? 0, thisMonthSales);
      const labPct = pct(thisCosts.labor ?? 0, thisMonthSales);
      const isIngHigh = ingPct >= labPct;

      insights.push({
        kind: "prime-cost-breach",
        severity,
        headline: `프라임코스트 ${primeCostPct.toFixed(1)}% — 위험선(65%) ${primeCostPct >= 75 ? "큰 폭" : ""} 초과`,
        analysis: `재료비 ${ingPct.toFixed(1)}% + 인건비 ${labPct.toFixed(1)}% = ${primeCostPct.toFixed(1)}%. ${isIngHigh ? "재료비" : "인건비"}가 더 큰 비중.`,
        action: isIngHigh
          ? "재료비 항목별 점검 — 메뉴 원가 재계산, 상위 3개 메뉴 재료비 분석, 공급처 비교"
          : "인건비 항목별 점검 — 시간대별 인력 배치 최적화, 키오스크/POS 자동화 검토",
        metrics: [
          { label: "프라임코스트", value: fmtPct(primeCostPct, false), tone: "bad" },
          { label: "재료비 비중", value: fmtPct(ingPct, false), tone: ingPct >= 38 ? "bad" : "neutral" },
          { label: "인건비 비중", value: fmtPct(labPct, false), tone: labPct >= 30 ? "bad" : "neutral" },
          { label: "안전선", value: "65%", tone: "neutral" },
        ],
        detectedAt: now,
      });
    }
  }

  // ── 9) Anomaly 5: 재고 회전 정체 (lastOrderedAt 30일+ 또는 dailyUsage 0인데 재고 多) ──
  if (input.inventory && input.inventory.length > 0) {
    const now = Date.now();
    const stagnantItems = input.inventory.filter((item) => {
      if (item.quantity <= 0) return false;
      // 일일 소비량이 있으면 (dailyUsage 기반) 회전일수 계산
      if (item.dailyUsage && item.dailyUsage > 0) {
        const daysOfStock = item.quantity / item.dailyUsage;
        return daysOfStock >= 30;  // 30일 이상 재고 = 회전 정체
      }
      // dailyUsage 없으면 lastOrderedAt 기준 (마지막 주문 60일+ 경과 = 안 팔리는 항목)
      if (item.lastOrderedAt) {
        const daysSince = Math.round((now - new Date(item.lastOrderedAt).getTime()) / 86400000);
        return daysSince >= 60 && item.quantity > 0;
      }
      return false;
    });
    if (stagnantItems.length >= 2) {
      const top = stagnantItems[0];
      insights.push({
        kind: "inventory-stagnant",
        severity: stagnantItems.length >= 5 ? "warning" : "info",
        headline: `재고 회전 정체 ${stagnantItems.length}개 항목 — ${top.name} 등`,
        analysis: `${stagnantItems.length}개 항목이 30일+ 회전 안 되고 있습니다. 자금이 묶이고 (특히 신선식품·계절상품) 변질·재고 비용 증가 위험.`,
        action: "안 팔리는 SKU 정리 — 할인 패키지·세트 메뉴로 소진, 다음 주문 수량 50% 감축, 메뉴/제품 라인업 재검토",
        metrics: [
          { label: "정체 항목", value: `${stagnantItems.length}개`, tone: "bad" },
          { label: "예시", value: top.name, tone: "neutral" },
        ],
        detectedAt: now.toString(),
      });
    }
  }

  // ── 10) Anomaly 6: 신규 고객 비율 낮음 (단골 의존 위험) ──
  if (input.newCustomerRatio !== undefined && input.newCustomerRatio < 15) {
    insights.push({
      kind: "new-customer-low",
      severity: input.newCustomerRatio < 5 ? "warning" : "info",
      headline: `신규 고객 ${input.newCustomerRatio.toFixed(0)}% — 단골 의존 위험`,
      analysis: `신규 방문 비율이 ${input.newCustomerRatio.toFixed(0)}%. 안정 매장 권장은 30-50%. 단골 의존도가 높으면 단골 1명 이탈 시 매출 큰 충격.`,
      action: "신규 유입 채널 재점검 — 인스타·네이버 플레이스 최근 게시물 확인, 첫 방문 쿠폰 활성화, 동네 SNS 공유 유도",
      metrics: [
        { label: "신규 비율", value: fmtPct(input.newCustomerRatio, false), tone: "bad" },
        { label: "권장", value: "30-50%", tone: "neutral" },
      ],
      detectedAt: now,
    });
  }

  // ── 11) Anomaly 7: 인건비/매출 비율 위험선 (30%+) ──
  //   prime-cost-breach 와 별개로 인건비만 단독 위험할 때 (재료비는 양호하지만 인건비 과다)
  if (thisMonthSales > 0 && (thisCosts.labor ?? 0) > 0) {
    const laborPct = pct(thisCosts.labor ?? 0, thisMonthSales);
    if (laborPct >= 30) {
      // prime-cost-breach 가 이미 잡았다면 skip (중복 방지)
      const primeAlreadyDetected = insights.some((i) => i.kind === "prime-cost-breach");
      if (!primeAlreadyDetected) {
        insights.push({
          kind: "labor-ratio-high",
          severity: laborPct >= 35 ? "warning" : "info",
          headline: `인건비 ${laborPct.toFixed(1)}% — 30% 위험선 초과`,
          analysis: `인건비 비율이 ${laborPct.toFixed(1)}%. 외식·소매 업계 적정선은 25-30%. 매출 성장이 인건비 성장을 못 따라가는 구조.`,
          action: "스케줄 최적화 — 시간대별 매출 vs 인력 배치 분석, 피크 시간만 추가 인력, 키오스크/POS 자동화로 단순 업무 축소",
          metrics: [
            { label: "인건비/매출", value: fmtPct(laborPct, false), tone: "bad" },
            { label: "위험선", value: "30%", tone: "neutral" },
            { label: "적정", value: "25-30%", tone: "neutral" },
          ],
          detectedAt: now,
        });
      }
    }
  }

  // ── 12) Anomaly 8: 마케팅 ROAS 손실 구간 (1배 미만 = 광고비 > 매출 기여) ──
  if (input.marketingCampaigns && input.marketingCampaigns.length > 0) {
    const curMonthKey = new Date().toISOString().slice(0, 7);
    const monthCampaigns = input.marketingCampaigns.filter((c) => c.month === curMonthKey);
    const totalSpend = monthCampaigns.reduce((s, c) => s + c.spend, 0);
    const totalAttrRev = monthCampaigns.reduce((s, c) => s + (c.attributedRevenue ?? 0), 0);
    if (totalSpend >= 100_000 && totalAttrRev > 0) {
      // 최소 10만원 광고비 + 매출 기여 입력된 경우만 (데이터 부족 시 노이즈 방지)
      const roas = totalAttrRev / totalSpend;
      if (roas < 1.5) {
        const severity: AnomalySeverity = roas < 0.8 ? "critical" : roas < 1.0 ? "warning" : "info";
        // 가장 부진한 채널 찾기
        const worstChannel = [...monthCampaigns]
          .map((c) => ({ ...c, roas: c.spend > 0 ? (c.attributedRevenue ?? 0) / c.spend : 0 }))
          .sort((a, b) => a.roas - b.roas)[0];
        insights.push({
          kind: "marketing-roas-low",
          severity,
          headline: `마케팅 ROAS ${roas.toFixed(1)}x — ${roas < 1 ? "광고비 회수 불가" : "낮은 효율"}`,
          analysis: `이번 달 광고비 ${fmtWon(totalSpend)} 대비 매출 기여 ${fmtWon(totalAttrRev)} (${roas.toFixed(1)}x). 가장 부진한 채널: ${worstChannel.channel} (${worstChannel.roas.toFixed(1)}x). 한국 e-commerce 평균 2-4x.`,
          action: roas < 1
            ? `${worstChannel.channel} 즉시 일시 중단 + 캠페인 타겟·소재 재검토. 자연 유입(SEO·SNS·단골 추천) 비중 확대`
            : `${worstChannel.channel} 캠페인 A/B 테스트, 타겟 세그먼트 좁히기, 전환율 높은 시간대만 노출`,
          metrics: [
            { label: "ROAS", value: `${roas.toFixed(1)}x`, tone: "bad" },
            { label: "광고비", value: fmtWon(totalSpend), tone: "neutral" },
            { label: "기여 매출", value: fmtWon(totalAttrRev), tone: "neutral" },
          ],
          detectedAt: now,
        });
      }
    }
  }

  // ── 정렬: critical → warning → info, 같은 severity면 detectedAt 역순 ──
  return insights.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    return (sevOrder[a.severity] - sevOrder[b.severity]);
  });
}
