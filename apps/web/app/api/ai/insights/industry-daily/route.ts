import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";
import {
  getIndustryBenchmark,
  formatKRW,
  detectBusinessSituation,
  matchCaseStudies,
  type BusinessSituation,
} from "@foundone/shared";
import {
  ANTI_HALLUCINATION_DIRECTIVE,
  formatInsightContext,
  retrieveInsightChunks,
} from "@foundone/ai";
import { supabase as supabaseAnon } from "../../../../../lib/supabase";

/**
 * Industry Daily Insight — 사장님 *고유 데이터* 기반 매일 1개 정밀 경영 인사이트.
 *
 *  ── 2026-05-07 강화 ─────────────────────────────────────────
 *  • "뻔한 일반론" 금지 — 사장님 고유 패턴/숫자 인용 강제
 *  • Primary action 1 + Secondary actions 2 (2026 AI UX 표준)
 *  • confidence 점수 + sourceLabel 노출 (Perplexity·Glean 패턴)
 *  • 풍부한 컨텍스트: 매출 추세·객단가·비용비율·요일패턴·재고·직원·런웨이 모두 prompt 주입
 *  ─────────────────────────────────────────────────────────
 *
 *  마케팅 트렌드(/api/ai/marketing/trends)와 차이:
 *  - 마케팅 트렌드 = SNS 콘텐츠·트렌드
 *  - Industry Insight = 경영·매출·비용·운영 인사이트
 */

const SYSTEM_PROMPT = `당신은 한국 자영업·창업 경영 컨설턴트입니다.
매일 사장님에게 **반드시 인사이트 3개** 를 다른 카테고리·다른 우선순위로 전달합니다.

⛔ **출력 인사이트 수: 정확히 3개** (1개·2개·4개 금지). 시스템이 검증해 거부합니다.

🔴 절대 금지 — 뻔한 일반론:
- "시그니처 메뉴 3-5개로 입소문" ❌ (모든 외식업에 적용 가능 = 무의미)
- "식재료 원가 33% 이하 관리" ❌ (벤치마크 그대로 인용 = 컨설턴트 가치 0)
- "고객을 분석하세요" ❌ (방향만 주고 행동 X)
- "리뷰 답변하세요" ❌ (구체 숫자 X)

🟢 좋은 발견의 조건:
1. 사장님 데이터의 *특정 수치 1-3개* 인용 (벤치마크가 아님)
2. 즉시 측정 가능한 액션 ("X% 회복하면 월 +Y만원" 같은 정량 효과)
3. 한국 SMB 맥락 (배달앱·임대료·4대보험·세무·정책자금)
4. **결정적 조언 모드** — 모호한 "분석하세요" 금지. 사장님이 *오늘 1가지 행동* 으로 옮길 수 있는 동사로 끝낼 것:
   - "메뉴 가격 7% 인상" / "하위 매출 메뉴 2개 폐기" / "정책자금 즉시 신청"
   - "롤업 (확장 보류, 안정화)" / "현금 위기 — 자금 조달 올인"
   - 초보 사장님은 *결정 못 하는* 게 가장 큰 적. 한 발자국 앞장서서 결정해 줄 것.

═══════════════════════════════════════════════════════════════
  📚 경영 이론 도구함 (Advisory Toolkit) — 상황별 *적절한 1개* 선택
═══════════════════════════════════════════════════════════════

**위기·생존 (런웨이 < 6개월 / 매출 -15%↓ / 비용 폭주)**
- **현금 우선 원칙** (Paul Graham "Default Alive"): 자금 조달 시도 + 비용 30% 즉시 삭감. 매출 늘리기 → 비용 줄이기 우선.
- **린 스타트업 Build-Measure-Learn** (Eric Ries): 가설 → 최소 실험 → 데이터 → 다음 행동. 실패하면 빠른 pivot.
- **테슬라·에어비앤비 위기 사례** (사례 블록에 있을 때): "당신만 어려운 게 아닙니다, 이렇게 돌파했습니다" 위로 + 행동.
- **재도전 특별자금 / 긴급경영안정자금** (한국 SMB 한정): 대출이 아니라 정책자금이 있다는 사실 자체가 사장님께 새로운 정보.

**비용 구조 위험 (프라임코스트 65%↑ / 임대료 18%↑)**
- **린 제조법 / TPS 7대 낭비 (Toyota Production System)**: 재고·이동·대기·과잉생산·불량·과정·운반. 음식점이면 "조리 동선" / "발주 과잉" / "폐기율" 검토.
- **5S** (정리·정돈·청소·청결·습관): 매장 효율 즉시 +10~15%.
- **JIT (Just-In-Time)**: 식재료 발주 1주일치 → 3일치로 줄여 폐기·자본 회전 동시 개선.
- **Theory of Constraints (제약 이론)**: 가장 *느린 단계* 1개를 풀면 전체 처리량 증가. 음식점이면 "주문 → 조리 → 서빙" 중 병목 발견.

**성장기 / 확장 결정 (런웨이 12개월+ / 매출 안정·증가)**
- **포터의 본원적 전략 (Porter's Generic Strategies)**: 비용 우위 vs 차별화 vs 집중. 한 가지만 선택 (어중간 = stuck in middle = 위험).
  - 외식: 차별화 (시그니처) vs 비용우위 (저가 회전) vs 집중 (특정 동네·고객층).
- **포터의 5 Forces**: 신규진입·대체재·공급자·구매자·경쟁사. 가장 강한 위협 1개에 자원 배분.
- **블루오션 전략 (Kim & Mauborgne)**: 경쟁이 없는 영역 발굴 — "올리지 줄이지 늘리지 새로 만들지" ERRC 프레임.
- **MOAT (Buffett)**: 브랜드·전환비용·네트워크·비용·규모 5가지 해자. 사장님 사업의 해자가 무엇인지 명시.
- **롤업 vs 확장**: 매출 안정 + 마진 12%↑ 이면 확장 검토. 마진 < 8% 이면 *롤업* (단일 매장 안정화 우선).

**고객·재방문 (단골 부족 / 입소문 부재)**
- **AARRR 해적 지표** (Dave McClure): Acquisition·Activation·Retention·Referral·Revenue. 어느 단계가 깨졌는지.
- **NPS / 재방문율**: 재방문 30%+ 가 안정선. 그 이하면 *Activation* 이 깨진 것.
- **고객 생애가치 (LTV)** vs **획득 비용 (CAC)**: LTV/CAC > 3 이 건강선. 1 미만이면 마케팅 폭주.
- **칙필레 사례** (사례 블록): 메뉴 단순화 + 서비스 집중 → 매장당 매출 KFC 의 4배.

**수익성 (마진 < 8%)**
- **Pareto 80/20**: 매출 상위 20% 메뉴가 80% 수익. 하위 80% 중 마진 음수 메뉴 *폐기*.
- **Contribution Margin**: 매출 - 변동비. 고정비 회수 후 흑자 전환점.
- **객단가 vs 회전율 트레이드오프**: 외식 = (객단가 × 회전율 × 좌석). 한 변수만 +10% 개선.

**창업 초기 (오픈 < 3개월 / 매출 입력 빈약)**
- **Customer Development** (Steve Blank): 매출보다 *사장님 가설 검증* 우선. 첫 단골 5명 인터뷰가 광고비 0원에 100만원 가치.
- **MVP 원칙**: 메뉴 풀 라인업 X — 시그니처 1-3개로 *입소문 검증* 후 확장.
- **YC "First 100" 원칙**: 첫 100명 단골이 향후 1,000명을 데려옴. 직접 응대 + 피드백 수집.

═══════════════════════════════════════════════════════════════
  ⚙️ 도구함 사용 규칙
═══════════════════════════════════════════════════════════════
- 인사이트 3개 중 **0~2개에만** 도구함의 프레임워크 인용 (모두 강제 X — 어떤 인사이트는 순수 데이터 기반이 더 좋음)
- 인용 시 **이론명 + 1줄 적용** 형태: "*포터의 5 Forces 관점에서 가장 큰 위협은 배달앱 수수료 (구매자 협상력) — 자체 채널 비중 30% 이상으로 키워야 함*"
- 사례·이론·데이터 분석 *섞어 사용*. 같은 인사이트 3개에 모두 사례만 X.
- 한국 사장님이 알아들을 수 있게 — 영어 용어는 한 번 풀어쓰기 ("AARRR (해적 지표)", "JIT (적기 발주)")

좋은 인사이트 예시 (다양성):
- 데이터형: "수요일 매출이 일평균의 64%. 이 날만 정상화하면 월 +130만원"
- 사례형: "에어비앤비도 2008년 위기에 시리얼 박스로 3만 달러 벌며 버텼습니다 — 창의적 현금 확보 시작."
- 이론형: "프라임코스트 68% — TPS 7대 낭비 중 *발주 과잉* 의심. 식재료 1주일치 → 3일치 줄이기."
- 결정형: "마진 7%, 매출 안정 — *롤업*. 2호점 보류, 단일 매장 마진 12%까지 끌어올리기."

📊 **데이터 빈약 시 (오픈 7일 미만 / 매출 입력 적을 때) 가이드**:
- high 인사이트는 사장님 *고유 데이터* 기반으로 (있는 정보 최대한 인용)
- medium / low 는 **현재 운영 단계 (오픈 N일차)** 에 적합한 한국 SMB *초기 운영 인사이트* OK
- 단, "초기 운영" 인사이트도 *사장님 단계 (예: 오픈 3일차)* 와 *업종* 에 맞게 구체화 필수
- 예: 오픈 3일차 외식 → "3일차엔 단골 한 명도 없습니다. 첫 단골 5명 만들기가 한 달 매출 좌우" (단계 특정)

원칙:
- 친근하되 전문적 (과한 격려 X, 직설)
- 각 인사이트는 2-3 문장 + 짧은 CTA (10자 내외)

🔢 **3개 우선순위 (반드시 각 1개씩)**:
- **high** = 즉시 행동 필요. 가장 명확한 신호 1개.
- **medium** = 이번 주 내 검토. 다른 카테고리.
- **low** = 시간 여유 있을 때. 또 다른 카테고리.

✋ 각 인사이트는 *서로 카테고리·신호가 달라야* — 같은 주제 3개 금지.

═══════════════════════════════════════════════════════════════
  🎯 CTA 도착 카드 (targetCard) — 사장님이 액션 버튼 누르면 가야 할 카드
═══════════════════════════════════════════════════════════════
각 인사이트마다 **targetCard 필드를 반드시 1개** 선택. 사장님이 그 카드에서 *실제로 액션을 수행* 가능한 곳으로 보내야 함.

Found.One 운영 대시보드의 실제 카드 카탈로그:

| targetCard      | 어떤 인사이트일 때 사용?                                                        | 카드 위치 (참고)                          |
|-----------------|--------------------------------------------------------------------------------|------------------------------------------|
| "sales"         | 매출 *기록·입력* 권유 (오늘 매출 5초 기록 등)                                  | 매출 입력 카드 (Tier1 상단)               |
| "users"         | 고객·단골·재방문·객단가·리텐션·온보딩 인사이트                                  | 고객 변화 카드 (Tier2)                    |
| "cashflow"      | 현금흐름·런웨이·잔고·수금·지급 — 흑자부도 위험                                  | 현금흐름 레이더 (Tier1 최상단)             |
| "costs"         | *일반 비용* — 임대료·공과금·판관비·이익률·마진 *구조 점검*                      | 비용 관리 카드 (내 가게 페이지)            |
| "inventory"     | **메뉴·레시피·재료·식자재·재고·재주문·발주·공급처·단가** 관련만 — 그 외 X       | 재고 관리 카드 (Tier1.5)                  |
| "team"          | 직원·노무·4대보험·퇴직금·시급·근로계약                                         | 팀/인력 관리 카드 (Tier1.5)               |
| "primeCost"     | 프라임코스트 (식자재+인건비 *합산* 점검)                                       | 프라임코스트 카드 (외식·카페 Tier1.5)     |
| "marketing"     | 광고·마케팅·캠페인·인스타·콘텐츠·리뷰·SNS                                       | 마케팅 surface (별도 페이지)               |
| "operations"    | **운영 속도·시간·병목·동선·조리 시간·서비스 응대·회전율·공정 측정·리추얼**       | 오늘의 운영 리추얼 카드 (Tier1.5)         |

⚠️ **자주 헷갈리는 케이스 — 반드시 지킬 것**:
- "주문→조리→서빙 병목 측정" → **operations** (재료가 아니라 *시간·공정* 인사이트)
- "재료 단가 협상" → **inventory** (식자재 매입 단가 관리)
- "재료비 비율 점검" → **primeCost** (식자재+인건비 합산) 또는 **costs**
- "단골 만들기" → **users** (고객 카드)
- "임대료 줄이기" → **costs** (비용 관리)
- "공정·동선·서비스 시간 측정" → **operations** (재고·메뉴 아님)

${ANTI_HALLUCINATION_DIRECTIVE}

응답 형식 (JSON만, insights 는 정확히 3개):
{
  "insights": [
    {
      "headline": "발견 한 줄 (15자 이내, 구체적)",
      "body": "발견 2-3문장. 사장님 고유 수치 또는 단계 특정 인사이트.",
      "action": "CTA 짧게 (10자 이내, 동사로 시작)",
      "category": "revenue" | "cost" | "marketing" | "operations" | "growth",
      "targetCard": "sales" | "users" | "cashflow" | "costs" | "inventory" | "team" | "primeCost" | "marketing" | "operations",
      "priority": "high",
      "sourceLabel": "근거 출처 한 줄"
    },
    { "priority": "medium", "category": <high 와 다른 카테고리>, "targetCard": <적합한 카드>, ... },
    { "priority": "low",    "category": <앞 둘과 다른 카테고리>, "targetCard": <적합한 카드>, ... }
  ],
  "confidence": 0.0~1.0 — 데이터 풍부도 + 발견 명확도 기반
}`;

const CATEGORY_LABELS: Record<string, string> = {
  food: "외식업 (음식점)",
  "cafe-dessert": "카페·디저트",
  retail: "소매업",
  beauty: "뷰티·미용실",
  pet: "반려동물",
  fitness: "피트니스·PT",
  education: "교육·학원",
  space: "공간임대",
  "online-digital": "온라인·쇼핑몰",
  "startup-tech": "테크 스타트업",
  "living-service": "생활서비스",
};

type RequestBody = {
  categoryId?: string;
  hasUserSales?: boolean;
  avgDailySales?: number;
  daysSinceLaunch?: number;
  weeklySalesChangePct?: number;
  avgTicketSize?: number;
  costRatios?: {
    ingredient?: number;
    labor?: number;
    rent?: number;
    prime?: number;
  };
  weakestDayPct?: number;
  lowStockCount?: number;
  employeesCount?: number;
  runwayMonths?: number;
};

export const runtime = "nodejs";
export const maxDuration = 90; // Vercel function timeout

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await checkSimpleRateLimit({
    key: `industry-insight:${auth.userId}`,
    limit: 10,
    windowMs: 86_400_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "insights-industry-daily",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured (OPENAI_API_KEY missing)" }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const categoryId = body.categoryId ?? "food";
  const label = CATEGORY_LABELS[categoryId] ?? categoryId;
  const benchmark = getIndustryBenchmark(categoryId);
  const avgMonthly = benchmark ? Math.round(benchmark.avgAnnualRevenue / 12) : null;
  const top10Monthly = benchmark ? Math.round(benchmark.top10PctRevenue / 12) : null;
  const bottom10Monthly = benchmark ? Math.round(benchmark.bottom10PctRevenue / 12) : null;

  // ─── 사장님 컨텍스트 — 가능한 모든 신호를 풍부하게 ───
  const ctxLines: string[] = [];
  if (body.daysSinceLaunch !== undefined && body.daysSinceLaunch >= 0) {
    ctxLines.push(`- 오픈 ${body.daysSinceLaunch}일차`);
  }
  if (body.hasUserSales && body.avgDailySales) {
    const userMonthly = Math.round(body.avgDailySales * 26);
    ctxLines.push(`- 일평균 매출(최근 7일): ${formatKRW(body.avgDailySales)}`);
    ctxLines.push(`- 월 환산: ${formatKRW(userMonthly)}`);
    if (avgMonthly && avgMonthly > 0) {
      const ratio = (userMonthly / (avgMonthly * 10000)) * 100;
      ctxLines.push(`- 업종 평균 대비: ${ratio.toFixed(0)}%`);
      // 분포 위치 추정
      const position =
        ratio >= 200 ? "상위 10%" :
        ratio >= 130 ? "상위 25%" :
        ratio >= 70 ? "중위 50%" :
        ratio >= 50 ? "하위 25%" :
        "하위 10%";
      ctxLines.push(`- 분포 위치: ${position}`);
    }
  }
  if (body.weeklySalesChangePct !== undefined && body.weeklySalesChangePct !== 0) {
    const trend = body.weeklySalesChangePct > 0 ? "상승" : "하락";
    ctxLines.push(`- 매출 추세 (주간): ${body.weeklySalesChangePct > 0 ? "+" : ""}${body.weeklySalesChangePct}% ${trend}`);
  }
  if (body.avgTicketSize && body.avgTicketSize > 0) {
    ctxLines.push(`- 객단가: ${formatKRW(body.avgTicketSize)}`);
  }
  if (body.costRatios) {
    const cr = body.costRatios;
    const parts: string[] = [];
    if (cr.ingredient !== undefined) parts.push(`식재료 ${cr.ingredient.toFixed(1)}%`);
    if (cr.labor !== undefined) parts.push(`인건비 ${cr.labor.toFixed(1)}%`);
    if (cr.rent !== undefined) parts.push(`임대료 ${cr.rent.toFixed(1)}%`);
    if (cr.prime !== undefined) parts.push(`프라임코스트 ${cr.prime.toFixed(1)}%`);
    if (parts.length > 0) ctxLines.push(`- 비용 비율 (월 환산 매출 기준): ${parts.join(" / ")}`);
  }
  if (body.weakestDayPct !== undefined && body.weakestDayPct < 80) {
    ctxLines.push(`- 가장 약한 요일 매출: 일평균의 ${body.weakestDayPct.toFixed(0)}% (저점 발견)`);
  }
  if (body.lowStockCount !== undefined && body.lowStockCount > 0) {
    ctxLines.push(`- 부족 재고 알림: ${body.lowStockCount}건`);
  }
  if (body.employeesCount !== undefined) {
    ctxLines.push(`- 직원: ${body.employeesCount}명`);
  }
  if (body.runwayMonths !== undefined && body.runwayMonths >= 0) {
    const flag = body.runwayMonths < 3 ? " ⚠️ 위기" : body.runwayMonths < 6 ? " ⚠️ 주의" : "";
    ctxLines.push(`- 현금 런웨이: ${body.runwayMonths}개월${flag}`);
  }

  // ⚠️ 2026-05-18: ctxLines 가 비어도 "매출 기록 시작 전" 단정 금지. 운영 중인데 오늘만 입력
  //   안 한 사장님이 모욕감 느낄 수 있음. 비단정 톤 ("최근 입력이 비어 있어요") 으로 교체.
  const userContext = ctxLines.length > 0
    ? `[사장님 현황 — 검증된 서버 데이터, 이 블록 수치만 인용 가능]\n${ctxLines.join("\n")}`
    : "[사장님 현황 — 최근 입력 데이터가 비어 있음. 일반 가이드 1줄 OK. 단정 어휘 (\"매출 없음\", \"기록 시작 전\") 금지.]";

  // ─── 사례 매칭 — 사장님 상황과 비슷하게 위기 돌파한 기업 ───
  // 근거: knowledge/success-case-studies.ts (테슬라·에어비앤비·성심당·백종원 등 77개)
  const matchedCases: { company: string; oneLiner: string; lesson: string; situation: BusinessSituation }[] = (() => {
    if (!body.hasUserSales || !body.avgDailySales) return [];
    const monthlyRev = body.avgDailySales * 26;
    const totalCost = ((body.costRatios?.ingredient ?? 0) + (body.costRatios?.labor ?? 0) +
                       (body.costRatios?.rent ?? 0)) / 100 * monthlyRev;
    const runway = body.runwayMonths ?? -1;
    const primeRate = body.costRatios?.prime ?? 0;
    const rentRatio = body.costRatios?.rent ?? 0;
    const weeklyChange = body.weeklySalesChangePct ?? 0;
    const situation = detectBusinessSituation({
      runway,
      monthlySales: monthlyRev,
      daysSinceLaunch: body.daysSinceLaunch ?? 0,
      categoryId,
      primeRate,
      weeklyChange,
      rentRatio: rentRatio || undefined,
      employeeCount: body.employeesCount,
    });
    if (!situation) return [];
    const cases = matchCaseStudies(situation, categoryId);
    return cases.slice(0, 3).map((c) => ({
      company: c.company,
      oneLiner: c.oneLiner,
      lesson: c.lesson,
      situation: c.situation,
    }));
    // 비고: totalCost 가 직접 사용되진 않지만 향후 확장 위해 계산 유지
    void totalCost;
  })();

  const caseStudyBlock = matchedCases.length > 0
    ? `\n\n[사장님과 비슷한 상황을 돌파한 기업 사례 — 인용 시 회사명·상황 그대로]\n` +
      matchedCases.map((c, i) =>
        `${i + 1}. **${c.company}** [상황: ${c.situation}] — ${c.oneLiner}\n   교훈: ${c.lesson}`,
      ).join("\n")
    : "";

  // ─── RAG: 사장님 상황 임베딩 → 의미적으로 유사한 케이스 자동 발견 ───
  //   deterministic matchCaseStudies 가 놓치는 cross-situation 사례를 보강.
  //   예: "프라임코스트 65%" → cost-crisis 매칭 외에도 "마진 압박" 키워드로
  //       유사한 small-biz-turnaround 사례까지 발견.
  let ragBlock = "";
  if (apiKey && ctxLines.length > 0) {
    try {
      const queryParts = [
        `업종: ${label}`,
        ...ctxLines.map((l) => l.replace(/^- /, "")),
      ];
      const chunks = await retrieveInsightChunks(
        queryParts.join(" / "),
        {
          supabase: supabaseAnon as unknown as Parameters<typeof retrieveInsightChunks>[1]["supabase"],
          embed: { apiKey },
        },
        { matchCount: 3, minSimilarity: 0.35 },
      );
      // matchedCases 와 중복되는 회사는 제거 (deterministic 우선)
      const matchedCompanies = new Set(matchedCases.map((c) => c.company));
      const filtered = chunks.filter((c) => {
        const companyMatch = c.doc.title.split("—")[0]?.trim();
        return !companyMatch || !matchedCompanies.has(companyMatch);
      });
      ragBlock = formatInsightContext(filtered, {
        heading: "유사 상황 케이스 (의미 검색)",
        maxChunks: 3,
        maxChars: 1500,
      });
      if (ragBlock) ragBlock = `\n\n${ragBlock}`;
    } catch (err) {
      console.warn("[industry-daily] RAG retrieval skipped:", err instanceof Error ? err.message : err);
    }
  }

  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  const benchmarkLines: string[] = [];
  if (avgMonthly) benchmarkLines.push(`- 월 평균 매출: ${(avgMonthly / 10000).toFixed(0)}만원`);
  if (top10Monthly) benchmarkLines.push(`- 상위 10% 월 매출: ${(top10Monthly / 10000).toFixed(0)}만원+`);
  if (bottom10Monthly) benchmarkLines.push(`- 하위 10% 월 매출: ${(bottom10Monthly / 10000).toFixed(0)}만원`);
  if (benchmark?.keyDifferentiators) {
    benchmarkLines.push(`- 상위 10% 차별화 (참고만 — 직접 인용 X, 사장님 고유 데이터에 우선): ${benchmark.keyDifferentiators.slice(0, 3).join(" / ")}`);
  }

  const userPrompt = `오늘 ${today}.
[업종] ${label}

[업종 벤치마크 — 소상공인실태조사 기준]
${benchmarkLines.join("\n")}

${userContext}${caseStudyBlock}${ragBlock}

🎯 위 데이터를 *전체* 검토 후 **사장님 고유 패턴에서만 발견 가능한 1가지** 를 찾아 JSON 으로 반환.

체크리스트 (인사이트 작성 전 자가 검증):
☐ headline 에 사장님 고유 수치 또는 패턴 들어갔는가?
☐ body 가 다른 외식점 사장님께도 그대로 통하는 일반론이 아닌가?
☐ secondaryActions 가 primary 와 *카테고리/방향* 이 다른가?
☐ confidence 가 데이터 빈약·발견 약함 반영했는가?
☐ sourceLabel 이 어떤 데이터를 봤는지 정직히 명시했는가?

다른 설명 없이 JSON 만.`;

  try {
    const client = new OpenAI({ apiKey, timeout: 30_000 });

    // 단일 호출 헬퍼 — 1차 + retry 시 동일 사용
    const callLLM = async (extraNudge: string = ""): Promise<string> => {
      const r = await client.chat.completions.create({
        // gpt-5.4-mini — 복합 인사이트 생성 영역, GPQA 88%, JSON mode + 한국어 nuance.
        // (nano 는 분류·라우팅용이라 우리 use case 비권장. 비교 결과 2026-05-08)
        model: "gpt-5.4-mini",
        // ⚠️ GPT-5.4 series 는 max_completion_tokens 사용 (max_tokens 미지원, 2026 API 변경)
        max_completion_tokens: 1500,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt + extraNudge },
        ],
      });
      return r.choices[0]?.message?.content ?? "{}";
    };

    let text = await callLLM();
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI response malformed" }, { status: 500 });
    }

    // 1차 응답 검증 — insights 가 3개 미만이면 retry 1회 (강한 강제 문구)
    let firstParse = (() => {
      try { return JSON.parse(jsonMatch[0]) as { insights?: unknown[] }; }
      catch { return { insights: [] }; }
    })();
    const firstCount = Array.isArray(firstParse.insights) ? firstParse.insights.length : 0;
    if (firstCount < 3) {
      console.warn(`[Industry insight] 1차 응답 ${firstCount}개 — retry 시도 (3개 강제)`);
      text = await callLLM(`\n\n⚠️ 위 1차 답변이 ${firstCount}개였는데, 시스템 요구는 정확히 3개. 데이터가 빈약하면 단계 특정 초기 운영 인사이트로 채워서라도 반드시 3개 (high/medium/low) 반환.`);
      const m2 = text.match(/\{[\s\S]*\}/);
      if (m2) jsonMatch = m2;
    }

    type RawInsight = {
      headline?: unknown;
      body?: unknown;
      action?: unknown;
      category?: unknown;
      /** AI 가 직접 지정한 도착 카드 (2026-05-11 추가 — 키워드 라우팅의 fragile 매칭 대체). */
      targetCard?: unknown;
      priority?: unknown;
      sourceLabel?: unknown;
    };
    const parsed = JSON.parse(jsonMatch[0]) as {
      insights?: unknown;
      confidence?: number;
    };

    // ─── confidence — UI 용 메타데이터로만 사용 (suppression X) ───
    //
    //  ⚠️ 이전엔 < 0.65 면 카드 자체 비표시했으나 *데이터 빈약* (오픈 N일차) 사용자가
    //     정확히 confidence 낮은 응답을 받게 되어 "AI 카드 안 보임" 사용자 보고 발생.
    //     → suppression 제거. 모든 인사이트 노출, confidence 는 UI 신호로만 활용 가능.
    const confidence = typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0.7;

    // ─── insights 정규화 — 정확히 3개 + 우선순위 정렬 ───
    const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const VALID_CATEGORIES = new Set(["revenue", "cost", "marketing", "operations", "growth"]);
    const VALID_PRIORITIES = new Set(["high", "medium", "low"]);
    // ⚠️ HeroCtaTarget 과 SSOT 일치 — MorningBriefing.tsx 의 HeroCtaTarget 타입과 동일.
    //   AI 가 잘못 입력하면 fallback 으로 category 기반 매핑.
    const VALID_TARGET_CARDS = new Set([
      "sales", "users", "cashflow", "costs", "inventory", "team", "primeCost", "marketing", "operations",
    ]);
    // category → targetCard 폴백 매핑 (AI 가 targetCard 누락 시)
    const CATEGORY_TO_CARD: Record<string, string> = {
      revenue: "sales",
      cost: "costs",
      marketing: "marketing",
      operations: "operations",
      growth: "users",
    };

    const rawArr = Array.isArray(parsed.insights) ? (parsed.insights as RawInsight[]) : [];
    const normalized = rawArr
      .filter((it) => typeof it?.headline === "string" && typeof it?.body === "string")
      .slice(0, 3)
      .map((it) => {
        const category = typeof it.category === "string" && VALID_CATEGORIES.has(it.category)
          ? it.category
          : "operations";
        // AI 가 targetCard 명시했으면 그대로 사용. 누락·잘못 입력이면 category 기반 폴백.
        const targetCard =
          typeof it.targetCard === "string" && VALID_TARGET_CARDS.has(it.targetCard)
            ? it.targetCard
            : CATEGORY_TO_CARD[category] ?? "operations";
        return {
          headline: String(it.headline).trim(),
          body: String(it.body).trim(),
          action: typeof it.action === "string" ? it.action.trim() : "",
          category,
          targetCard,
          priority: typeof it.priority === "string" && VALID_PRIORITIES.has(it.priority)
            ? it.priority
            : "medium",
          sourceLabel: typeof it.sourceLabel === "string"
            ? it.sourceLabel.trim()
            : "사장님 데이터 + 업종 벤치마크",
        };
      })
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

    // ⚠️ length === 0 도 곧장 return 하지 않고 *패딩* 으로 위임 (사용자 보고 2026-05-08).
    //    이전 버그: 0개 → 조기 return → 패딩 코드 도달 못해 클라 카드 0개 표시.

    // ─── 3개 미달 시 서버 패딩 — 단계·업종 기반 안전망 인사이트로 채움 ───
    //   사장님이 카드 0개 / 1개만 보는 상황 차단. 데이터 빈약 = LLM 보수적 응답일 때만 발동.
    if (normalized.length < 3) {
      console.warn(`[Industry insight] LLM ${normalized.length}개만 생성 — 단계 인사이트로 패딩`);
      const stageNum = body.daysSinceLaunch ?? 0;
      const stageLabel =
        stageNum < 7 ? "오픈 1주차"
        : stageNum < 30 ? `오픈 ${Math.floor(stageNum / 7) + 1}주차`
        : stageNum < 90 ? `오픈 ${Math.floor(stageNum / 30) + 1}개월차`
        : "성장 단계";
      const padCandidates: typeof normalized = [
        {
          headline: `${stageLabel}: 매출 일관성 점검`,
          body: `${stageLabel}에는 매출 절대값보다 *기록 일관성* 이 중요합니다. 매일 5초 입력만으로 패턴 분석이 시작되고, 1주일 안에 요일별 흐름·피크 시간대가 보입니다.`,
          action: "오늘 매출 5초 기록",
          category: "operations" as const,
          targetCard: "sales",
          priority: "medium" as const,
          sourceLabel: `${stageLabel} 운영 기본 + 사장님 단계`,
        },
        {
          headline: "첫 단골 5명이 1년 매출을 결정",
          body: "초기 사업의 가장 강력한 자산은 단골입니다. 첫 5명의 단골이 입소문·재방문·리뷰의 시드가 되며, 30일 안에 이 5명을 만들면 매출 성장 곡선이 가팔라집니다.",
          action: "단골 후보 5명 명단",
          category: "marketing" as const,
          targetCard: "users",
          priority: "low" as const,
          sourceLabel: "Y Combinator 'First 100 customers' + 한국 SMB 단골 데이터",
        },
        {
          headline: "고정비 정확히 알아야 BEP 보임",
          body: "임대료·인건비·기타 고정비를 한 번 정확히 입력하면, AI 가 손익분기 일매출을 자동 계산합니다. 지금은 단계 추정이라 ±15% 오차가 있을 수 있습니다.",
          action: "고정비 입력하기",
          category: "cost" as const,
          targetCard: "costs",
          priority: "low" as const,
          sourceLabel: "정확한 BEP 산출 = 고정비 입력 필요",
        },
      ];
      // 이미 LLM 이 반환한 카테고리 / priority 는 중복 회피
      const usedCats = new Set(normalized.map((n) => n.category));
      const usedPris = new Set(normalized.map((n) => n.priority));
      for (const cand of padCandidates) {
        if (normalized.length >= 3) break;
        if (usedCats.has(cand.category) || usedPris.has(cand.priority)) continue;
        normalized.push(cand);
        usedCats.add(cand.category);
        usedPris.add(cand.priority);
      }
      // 그래도 < 3 이면 priority 만 빈 슬롯에 강제 채움 (드물지만 안전망)
      const allPris: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
      for (const cand of padCandidates) {
        if (normalized.length >= 3) break;
        const freePri = allPris.find((p) => !usedPris.has(p));
        if (!freePri) break;
        normalized.push({ ...cand, priority: freePri });
        usedPris.add(freePri);
      }
      // 최종 우선순위 정렬
      normalized.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
    }

    return NextResponse.json({
      insights: normalized,
      confidence,
      generatedAt: new Date().toISOString(),
      benchmark: benchmark
        ? {
            avgMonthly,
            top10Monthly,
            bottom10Monthly,
          }
        : null,
    });
  } catch (err) {
    console.error("[Industry insight]", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    // OpenAI 크레딧 부족 / 결제 문제 — 명확한 메시지
    if (errMsg.includes("insufficient_quota") || errMsg.includes("billing") || errMsg.includes("rate_limit")) {
      return NextResponse.json(
        { error: "OpenAI API 크레딧이 부족하거나 한도 초과. Console 에서 확인해주세요.", code: "credits_low" },
        { status: 402 },
      );
    }
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 });
  }
}
