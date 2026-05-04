import type { AiStructuredResponse, ContractAnalysisResult } from "@build-up/ai";
import {
  buildRoadmapState,
  formatGuideSectionTitle,
  localizeStage,
  starterRoadmap,
  starterStageFlow,
  starterTaskMap,
  upsertStageDecision,
  type GuideQaAnswer,
  type RecommendationItem,
  type RoadmapState,
  type WorkflowDecisionMap,
  type WorkflowTaskMap,
} from "@build-up/shared";
import type { GuideRecord, SavedFinanceSnapshot, SavedContractAnalysisSnapshot, SavedGuideQaSnapshot } from "./types";

export function getGuideSections(
  guide: GuideRecord | null,
  language: import("@build-up/shared").Language
) {
  if (!guide) {
    return [];
  }

  return Object.entries(guide.payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({
      key,
      title: formatGuideSectionTitle(key, language),
      items: (value as unknown[]).map((item) => String(item))
    }));
}

export function formatConfidenceBadge(
  confidence: GuideQaAnswer["confidence"],
  language: "ko" | "en"
) {
  if (language === "ko") {
    if (confidence === "high") return "신뢰 높음";
    if (confidence === "medium") return "신뢰 보통";
    return "추가 확인 필요";
  }

  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Check needed";
}

/**
 * 한국식 금액 표현을 원(won) 단위로 변환.
 * "1억", "5천만", "1억 5000만원", "3000" (만원 단위) 모두 지원.
 */
export function parseKoreanCurrency(value: string): number | undefined {
  const cleaned = value.replace(/\s/g, "").replace(/원$/, "");
  if (!cleaned) return undefined;

  let total = 0;

  const eokMatch = cleaned.match(/([\d.]+)\s*억/);
  if (eokMatch) {
    total += parseFloat(eokMatch[1]) * 100_000_000;
  }

  const cheonmanMatch = cleaned.match(/([\d.]+)\s*천만/);
  if (cheonmanMatch) {
    total += parseFloat(cheonmanMatch[1]) * 10_000_000;
  } else {
    const manMatch = cleaned.match(/([\d.]+)\s*만/);
    if (manMatch) {
      total += parseFloat(manMatch[1]) * 10_000;
    }
  }

  // 단위 없이 숫자만 있으면 만원 단위로 간주
  if (total === 0) {
    const digits = cleaned.replace(/[^\d]/g, "");
    if (!digits) return undefined;
    const amount = Number.parseInt(digits, 10);
    if (!Number.isFinite(amount) || amount <= 0) return undefined;
    return amount * 10_000;
  }

  return total > 0 ? total : undefined;
}

/** @deprecated parseKoreanCurrency를 사용하세요 */
export function parseManwonInput(value: string) {
  return parseKoreanCurrency(value);
}

export function inferFinanceDefaults(
  market: RecommendationItem | null,
  categoryId: string
) {
  const marketStyle = String(
    market?.meta?.marketStyle ??
      (categoryId === "online-digital"
        ? "balanced"
        : categoryId === "food"
          ? "office"
          : categoryId === "living-service" || categoryId === "education"
            ? "residential"
            : "balanced")
  );

  const rentBand = String(
    market?.meta?.rentBand ??
      (categoryId === "online-digital"
        ? "mid-low"
        : categoryId === "cafe-dessert"
          ? "high"
          : categoryId === "food"
            ? "mid-high"
            : "mid")
  );

  return { marketStyle, rentBand };
}

export function formatBreakEvenMonth(month: number | null, language: "ko" | "en") {
  if (month === null) {
    return language === "ko" ? "6개월 내 미도달" : "Not within 6 months";
  }

  return language === "ko" ? `${month}개월차` : `Month ${month}`;
}

export function hydrateSavedFinanceSnapshot(
  decision: WorkflowDecisionMap[string] | undefined
): SavedFinanceSnapshot | null {
  const inputs = decision?.inputs;

  if (!inputs || typeof inputs.capital !== "number" || typeof inputs.breakEvenRevenue !== "number") {
    return null;
  }

  const rationale = Array.isArray(inputs.aiRationale)
    ? inputs.aiRationale.filter((item): item is string => typeof item === "string")
    : [];
  const warnings = Array.isArray(inputs.aiWarnings)
    ? inputs.aiWarnings.filter((item): item is string => typeof item === "string")
    : [];
  const nextActions = Array.isArray(inputs.aiNextActions)
    ? inputs.aiNextActions.filter((item): item is string => typeof item === "string")
    : [];

  return {
    capital: inputs.capital,
    marketStyle: typeof inputs.marketStyle === "string" ? inputs.marketStyle : "balanced",
    rentBand: typeof inputs.rentBand === "string" ? inputs.rentBand : "mid",
    monthlyRent: typeof inputs.monthlyRent === "number" ? inputs.monthlyRent : undefined,
    monthlyLaborCost: typeof inputs.monthlyLaborCost === "number" ? inputs.monthlyLaborCost : undefined,
    expectedMonthlyRevenue:
      typeof inputs.expectedMonthlyRevenue === "number" ? inputs.expectedMonthlyRevenue : undefined,
    riskLevel:
      inputs.riskLevel === "low" ||
      inputs.riskLevel === "medium" ||
      inputs.riskLevel === "high" ||
      inputs.riskLevel === "critical"
        ? inputs.riskLevel
        : "medium",
    survivabilityMonths:
      typeof inputs.survivabilityMonths === "number" ? inputs.survivabilityMonths : 0,
    breakEvenMonth:
      typeof inputs.breakEvenMonth === "number" ? inputs.breakEvenMonth : null,
    breakEvenRevenue: inputs.breakEvenRevenue,
    capitalAfterSetupLow:
      typeof inputs.capitalAfterSetupLow === "number" ? inputs.capitalAfterSetupLow : 0,
    capitalAfterSetupHigh:
      typeof inputs.capitalAfterSetupHigh === "number" ? inputs.capitalAfterSetupHigh : 0,
    totalMonthlyFixed:
      typeof inputs.totalMonthlyFixed === "number" ? inputs.totalMonthlyFixed : 0,
    cogsRate: typeof inputs.cogsRate === "number" ? inputs.cogsRate : 0,
    interpretation:
      decision?.notes && (rationale.length > 0 || warnings.length > 0 || nextActions.length > 0)
        ? {
            summary: decision.notes,
            rationale,
            warnings,
            nextActions
          }
        : undefined,
    savedAt: decision?.completedAt
  };
}

export function hydrateSavedContractAnalysisSnapshot(
  decision: WorkflowDecisionMap[string] | undefined
): SavedContractAnalysisSnapshot | null {
  const inputs = decision?.inputs;

  if (!inputs || typeof inputs.riskLevel !== "string") {
    return null;
  }

  let flaggedClauses: ContractAnalysisResult["flaggedClauses"] = [];
  if (typeof inputs.flaggedClausesJson === "string") {
    try {
      const parsed = JSON.parse(inputs.flaggedClausesJson) as ContractAnalysisResult["flaggedClauses"];
      if (Array.isArray(parsed)) {
        flaggedClauses = parsed.filter(
          (item): item is ContractAnalysisResult["flaggedClauses"][number] =>
            Boolean(item) &&
            typeof item.excerpt === "string" &&
            typeof item.issue === "string" &&
            (item.severity === "warning" || item.severity === "danger")
        );
      }
    } catch {
      flaggedClauses = [];
    }
  }

  const missingItems = Array.isArray(inputs.missingItems)
    ? inputs.missingItems.filter((item): item is string => typeof item === "string")
    : [];
  const unusualTerms = Array.isArray(inputs.unusualTerms)
    ? inputs.unusualTerms.filter((item): item is string => typeof item === "string")
    : [];
  const nextActions = Array.isArray(inputs.nextActions)
    ? inputs.nextActions.filter((item): item is string => typeof item === "string")
    : [];

  return {
    contractText: typeof inputs.contractText === "string" ? inputs.contractText : undefined,
    analysis: {
      riskLevel:
        inputs.riskLevel === "low" ||
        inputs.riskLevel === "medium" ||
        inputs.riskLevel === "high" ||
        inputs.riskLevel === "critical"
          ? inputs.riskLevel
          : "medium",
      summary: decision?.notes ?? "",
      flaggedClauses,
      missingItems,
      unusualTerms,
      nextActions
    },
    savedAt: decision?.completedAt
  };
}

export function hydrateSavedGuideQaSnapshot(
  decision: WorkflowDecisionMap[string] | undefined
): SavedGuideQaSnapshot | null {
  const inputs = decision?.inputs;

  if (!inputs || typeof inputs.question !== "string" || !decision?.notes) {
    return null;
  }

  const cautions = Array.isArray(inputs.cautions)
    ? inputs.cautions.filter((item): item is string => typeof item === "string")
    : [];
  const reasons = Array.isArray(inputs.reasons)
    ? inputs.reasons.filter((item): item is string => typeof item === "string")
    : [];
  const nextActions = Array.isArray(inputs.nextActions)
    ? inputs.nextActions.filter((item): item is string => typeof item === "string")
    : [];

  const confidence =
    inputs.confidence === "high" || inputs.confidence === "medium" || inputs.confidence === "check_needed"
      ? inputs.confidence
      : "medium";

  return {
    question: inputs.question,
    answer: {
      shortAnswer: decision.notes,
      explanation: typeof inputs.explanation === "string" ? inputs.explanation : "",
      reasons,
      cautions,
      nextActions,
      confidence,
      citations: []
    },
    savedAt: decision.completedAt
  };
}

export function getContractAnalysisHints(
  analysis: ContractAnalysisResult | null,
  taskId: string,
  categoryId: string | undefined,
  language: "ko" | "en"
) {
  if (!analysis) {
    return [];
  }

  const corpus = [
    ...analysis.flaggedClauses.flatMap((item) => [item.excerpt, item.issue]),
    ...analysis.missingItems,
    ...analysis.unusualTerms
  ]
    .join(" ")
    .toLowerCase();

  const keywordMap =
    categoryId === "online-digital"
      ? {
          "use-check": ["작업", "공간", "보관", "창고", "스튜디오", "workspace", "storage"],
          "facility-check": ["포장", "택배", "반품", "물류", "pickup", "returns", "shipping"],
          "restriction-check": ["공급", "외주", "제한", "승인", "특약", "outsourcing", "approval", "restriction"]
        }
      : {
          "use-check": ["용도", "업종", "영업", "건축물", "zoning", "permitted use", "permit"],
          "facility-check": ["전기", "수도", "배기", "설비", "시설", "공사", "원상복구", "facility", "ventilation", "restoration"],
          "restriction-check": ["권리금", "승인", "제한", "특약", "해지", "갱신", "관리비", "보증금", "임대료", "key money", "renewal", "termination", "deposit", "restriction"]
        };

  const matchedKeywords = (keywordMap[taskId as keyof typeof keywordMap] ?? []).filter((keyword) =>
    corpus.includes(keyword.toLowerCase())
  );

  if (matchedKeywords.length === 0) {
    return [];
  }

  const hints = analysis.flaggedClauses
    .map((item) => item.issue)
    .concat(analysis.missingItems, analysis.unusualTerms)
    .filter((item) =>
      matchedKeywords.some((keyword) => item.toLowerCase().includes(keyword.toLowerCase()))
    );

  const uniqueHints = Array.from(new Set(hints)).slice(0, 3);

  if (uniqueHints.length > 0) {
    return uniqueHints;
  }

  return [
    language === "ko"
      ? "계약서 분석 결과상 이 항목을 우선 확인하는 것이 좋습니다."
      : "The contract analysis suggests reviewing this item carefully."
  ];
}

export const baseRoadmap = {
  roadmapId: starterRoadmap.roadmapId,
  templateId: starterRoadmap.templateId,
  stages: starterStageFlow
};

/**
 * 단계 완료 + chain backfill + roadmap 재빌드. (사용자 보고 2026-05-03 회귀 사고 후 도입)
 *
 *   완료시키려는 stage 의 completedAt 를 set 하면서, 그 앞의 모든 path stage 도 chain 으로 함께
 *   backfill (사용자가 거기까지 도달했다는 사실 자체가 진실). buildRoadmapState 를 직접 호출해서
 *   currentStageId 를 처음부터 재계산 → 룰 강화로 회귀된 stage 가 가운데 끼어 있어도 무시하고
 *   가장 앞 미완료 (= viewedStage 의 다음) 로 자연스럽게 advance.
 *
 *   기존 completeCurrentStage 는 `roadmap.currentStageId` 기준이라 회귀 시 거기에 갇혔음.
 *
 *   추가 patch (extraDecisionFields) 가 있으면 해당 stageId 결정에 함께 머지.
 */
export function advanceStageWithChainBackfill(
  stageId: string,
  decisions: WorkflowDecisionMap,
  roadmap: RoadmapState,
  taskMap: WorkflowTaskMap,
  extraDecisionFields?: Partial<{
    selectedPrimaryOptionId: string;
    selectedOptionIds: string[];
    inputs: Record<string, string | number | boolean | string[]>;
    notes: string;
  }>,
): { decisions: WorkflowDecisionMap; roadmap: RoadmapState; newlyUnlockedStageIds: string[] } {
  const now = new Date().toISOString();
  let nextDecisions = upsertStageDecision(decisions, stageId, {
    stageId,
    completedAt: now,
    ...(extraDecisionFields ?? {}),
  });

  const stageIdx = baseRoadmap.stages.findIndex((s) => s.stageId === stageId);
  if (stageIdx > 0) {
    for (let i = 0; i < stageIdx; i++) {
      const prevSid = baseRoadmap.stages[i].stageId;
      if (!nextDecisions[prevSid]?.completedAt) {
        const ts = new Date(Date.parse(now) - (stageIdx - i) * 1000).toISOString();
        nextDecisions = upsertStageDecision(nextDecisions, prevSid, {
          stageId: prevSid,
          completedAt: ts,
        });
      }
    }
  }

  const previousUnlocked = new Set(roadmap.unlockedStageIds);
  const nextRoadmap = buildRoadmapState(baseRoadmap, nextDecisions, taskMap);
  const newlyUnlockedStageIds = nextRoadmap.unlockedStageIds.filter(
    (id) => !previousUnlocked.has(id),
  );

  return { decisions: nextDecisions, roadmap: nextRoadmap, newlyUnlockedStageIds };
}

export type ContractTaskDetail = {
  title: string;
  summary: string;
  why: string[];
  checklist: string[];
  traps: Array<{ label: string; desc: string }>;
  actions: Array<{ label: string; href?: string }>;
  questions: string[];
};

export function getContractTaskDetail(taskId: string, language: "ko" | "en", categoryId?: string): ContractTaskDetail {
  if (categoryId === "online-digital") {
    const details: Record<string, { ko: ContractTaskDetail; en: ContractTaskDetail }> = {
      "use-check": {
        ko: {
          title: "작업 공간 적합성 확인",
          summary: "재고 보관, 포장 작업, 촬영 공간, 택배 픽업 접근성까지 실제 운영 흐름에 맞는 공간인지 먼저 확인하세요.",
          why: ["집에서 시작해도 재고와 포장 동선이 예상보다 빠르게 복잡해집니다.", "공간이 맞지 않으면 확장 전에 이미 운영 병목이 시작됩니다."],
          checklist: [
            "선반·팔레트를 놓을 수 있는 재고 적재 공간 확보 여부",
            "포장 작업 테이블을 펼칠 공간이 있는지",
            "제품 촬영용 배경·조명 설치 공간 확인",
            "택배사 기사 픽업 동선 (엘리베이터, 입구 단차 등)",
            "주거 공간에서 운영 시 사업자 등록증 주소 사용 가능 여부"
          ],
          traps: [
            { label: "재고 부피 과소 예측", desc: "초기에 재고가 적어 보여도 성수기나 대량 입고 시 공간이 순식간에 포화됩니다. 최대 재고 기준으로 공간을 검토하세요." },
            { label: "임대인 동의 없는 사업자 등록", desc: "주거용 임대차 계약에서 임대인이 사업 용도 사용을 금지한 경우, 사업자 등록 후 분쟁 또는 계약 해지 리스크가 생깁니다." }
          ],
          actions: [
            { label: "공유창고 서비스 비용 비교 (위킵, 세이브박스 등)" },
            { label: "택배 계약 전 픽업 가능 시간·횟수 CJ대한통운/한진에 사전 확인" },
            { label: "입주 전 임대인에게 사업 용도 사용 서면 동의 요청" }
          ],
          questions: [
            "사업 용도로 공간을 사용하는 것에 동의하시나요?",
            "택배 픽업·반품 물량이 늘어날 경우 제한이 있나요?",
            "향후 공간 확장 또는 이웃 호실 추가 임대가 가능한가요?"
          ]
        },
        en: {
          title: "Check workspace fit",
          summary: "Review whether the space works for storage, packing, content shoots, and courier pickup before signing.",
          why: ["Even home-based setups become cramped faster than expected.", "Space mismatch creates operational bottlenecks before you can scale."],
          checklist: [
            "Room for shelving or pallets to hold peak inventory",
            "Clear table space for packing work",
            "Space for product photography setup",
            "Courier pickup access (elevator, no-step entry)",
            "Landlord permission to register a business address here"
          ],
          traps: [
            { label: "Underestimating inventory volume", desc: "Stock always seems manageable at first. Plan for your peak inventory scenario, not average." },
            { label: "Business registration without landlord consent", desc: "Residential leases often prohibit commercial use. Register without consent and you risk lease termination." }
          ],
          actions: [
            { label: "Compare shared-warehouse pricing (local providers)" },
            { label: "Confirm pickup frequency with your courier before signing" },
            { label: "Get written landlord consent for business use" }
          ],
          questions: [
            "Do you consent to commercial use of this space?",
            "Are there limits on daily courier pickups or returns?",
            "Can I rent an adjacent unit if I need to expand?"
          ]
        }
      },
      "facility-check": {
        ko: {
          title: "보관·포장·택배 동선 확인",
          summary: "재고 보관, 포장 작업, 택배 출고와 반품 흐름이 막히지 않는지 실제 동선 기준으로 확인하세요.",
          why: ["온라인 판매는 매장 노출보다 fulfillment 흐름이 성패를 결정합니다.", "출고와 반품이 꼬이면 고객 불만과 운영 비용이 동시에 증가합니다."],
          checklist: [
            "냉장·냉동 보관이 필요한 경우 전력 용량(kW) 확인",
            "택배 박스·완충재 등 포장 자재 보관 공간",
            "반품 재고 별도 보관 공간 (출고 재고와 혼입 방지)",
            "폐박스 처리 공간 및 수거 주기 확인",
            "택배사 픽업 시간대가 운영 시간과 맞는지"
          ],
          traps: [
            { label: "반품 물량 과소 예측", desc: "패션·뷰티 카테고리는 반품률이 20~30%에 달하기도 합니다. 반품 재고를 출고 재고와 분리 보관할 공간이 없으면 혼입 사고가 납니다." },
            { label: "포장재 발주 주기 불균형", desc: "박스를 대량 발주해 원가를 낮추면 보관 공간이 먼저 막힙니다. 수납 가능 물량 기준으로 발주 주기를 설계하세요." }
          ],
          actions: [
            { label: "쿠팡 로켓배송/네이버 도착보장 입점 시 물류 기준 별도 확인" },
            { label: "CJ대한통운 계약 전 익일·당일 픽업 가능 여부 확인 (1588-1255)" },
            { label: "반품 처리 프로세스를 플랫폼별로 미리 작성해두기" }
          ],
          questions: [
            "대형 화물 픽업이나 반품 물량이 많을 때 입구 이용에 제한이 있나요?",
            "폐박스 등 폐기물 처리 비용이 관리비에 포함되나요?",
            "인근에 공유창고나 추가 보관 공간을 소개받을 수 있나요?"
          ]
        },
        en: {
          title: "Review storage and fulfillment flow",
          summary: "Walk the actual path from receiving inventory to shipping orders and handling returns before you sign.",
          why: ["Fulfillment flow matters more than foot traffic for online businesses.", "Tangled outbound and return processes drive up cost and customer complaints simultaneously."],
          checklist: [
            "Power capacity if refrigeration or freezer is needed",
            "Dedicated space for shipping materials (boxes, padding)",
            "Separate returns staging area away from outbound stock",
            "Waste cardboard disposal space and pickup schedule",
            "Courier pickup hours match your operating hours"
          ],
          traps: [
            { label: "Underestimating return volume", desc: "Fashion and beauty categories can see 20–30% return rates. Without a separate returns area, stock gets mixed and errors multiply." },
            { label: "Bulk packaging orders vs. storage space", desc: "Buying packaging in bulk saves money but can fill your workspace before inventory even arrives." }
          ],
          actions: [
            { label: "Check platform logistics requirements (Coupang Rocket, Naver guaranteed delivery)" },
            { label: "Confirm same-day or next-day pickup availability with your courier" },
            { label: "Map out your return processing steps per platform in advance" }
          ],
          questions: [
            "Are there restrictions on large-volume pickups or returns at this address?",
            "Is cardboard disposal included in building fees?",
            "Can you recommend nearby shared storage if I need to expand?"
          ]
        }
      },
      "restriction-check": {
        ko: {
          title: "공급·외주 제한 확인",
          summary: "공급업체 접근성, 외주 포장사 조건, 반품 처리 정책처럼 반복 운영에 직접 영향을 주는 제한을 미리 확인하세요.",
          why: ["단일 공급업체에 의존하면 품절·가격 인상 리스크를 통제할 수 없습니다.", "플랫폼별 반품 정책이 다르면 같은 상품도 운영 복잡도가 크게 올라갑니다."],
          checklist: [
            "주요 공급업체 2~3개 이상 확보 및 납기 보장 조건 확인",
            "외주 포장업체 단가·최소 수량·마감일 조건",
            "플랫폼별(네이버, 쿠팡, 11번가) 반품 정책 차이 파악",
            "통신판매업 신고 요건 확인 (공정거래위원회 표준 약관)",
            "해외 소싱 시 관세·통관 소요 기간 확인"
          ],
          traps: [
            { label: "단일 공급업체 의존", desc: "공급업체가 품절·폐업하거나 가격을 올리면 전체 매출이 멈춥니다. 동일 상품 카테고리에서 예비 공급처를 미리 파악해두세요." },
            { label: "플랫폼 간 반품 정책 차이 미인지", desc: "쿠팡은 고객 귀책도 무료 반품인 경우가 많습니다. 동일 상품을 여러 플랫폼에서 팔 때 정책을 통일하지 않으면 손실이 납니다." }
          ],
          actions: [
            { label: "공정거래위원회 전자상거래 표준 약관 확인", href: "https://www.ftc.go.kr" },
            { label: "네이버 스마트스토어 센터에서 반품·교환 정책 설정 가이드 확인" },
            { label: "관세청 수입신고 필요 여부 사전 확인 (간이통관 한도: 미화 150달러)" }
          ],
          questions: [
            "최소 발주 수량과 납기 보장 조건이 어떻게 되나요?",
            "품절 발생 시 대체 상품 또는 납기 연장 처리가 가능한가요?",
            "반품 재고는 재판매 가능한 상태로 돌아오나요, 폐기 처리인가요?"
          ]
        },
        en: {
          title: "Check sourcing and operational constraints",
          summary: "Review supplier reliability, outsourced packing terms, and return policies—these directly affect daily operations.",
          why: ["Relying on a single supplier means one stockout or price hike stops your business.", "Different return policies per platform create compounding complexity as you scale."],
          checklist: [
            "At least 2–3 backup suppliers identified for each key product",
            "Outsourced packing: unit price, minimum quantity, lead time",
            "Return policies per platform (Naver, Coupang, 11st) compared",
            "E-commerce business registration requirements confirmed",
            "Import duties and lead times confirmed if sourcing overseas"
          ],
          traps: [
            { label: "Single-supplier dependency", desc: "If your sole supplier goes out of stock or raises prices, your entire revenue stops. Pre-qualify backup sources now." },
            { label: "Platform return policy differences", desc: "Coupang often covers return shipping even for buyer fault. Mismatched policies across platforms lead to unplanned losses." }
          ],
          actions: [
            { label: "Check Korea FTC standard e-commerce terms" },
            { label: "Review return and exchange policy guide in Naver Smart Store center" },
            { label: "Confirm customs threshold for simplified clearance (USD 150 limit)" }
          ],
          questions: [
            "What is the minimum order quantity and guaranteed lead time?",
            "Can you handle stockout substitutions or extend lead time gracefully?",
            "Do returned items come back in resalable condition, or are they write-offs?"
          ]
        }
      }
    };

    return details[taskId]?.[language] ?? {
      title: taskId,
      summary: "",
      why: [],
      checklist: [],
      traps: [],
      actions: [],
      questions: []
    };
  }

  const details: Record<string, { ko: ContractTaskDetail; en: ContractTaskDetail }> = {
    "use-check": {
      ko: {
        title: "업종 가능 여부 확인",
        summary: "건물 용도와 영업 업종이 안 맞으면 계약 후에도 구청에서 영업이 막힙니다.",
        why: ["건축물 용도와 영업 업종이 일치해야 영업신고가 가능합니다.", "위반건축물은 보증금·인허가 모두 리스크."],
        checklist: [
          "건축물대장 용도·층별 용도 확인 (정부24 무료)",
          "위반건축물 여부 — 노란 표기",
          "건축물대장 소유자 = 등기부등본 소유자 일치",
          "내 업종 영업신고가 이 용도에서 가능한지 구청 사전 문의",
        ],
        traps: [
          { label: "층별 용도 제한", desc: "같은 건물도 1층은 판매시설, 지하는 창고만 허용되는 경우. 층별로 따로 확인." },
          { label: "위반건축물 함정", desc: "건물주 이행강제금 납부 중일 수 있고 철거 명령 시 세입자 보호 약함." },
        ],
        actions: [
          { label: "정부24 건축물대장 무료 열람", href: "https://www.gov.kr" },
          { label: "토지이음 용도지역 확인", href: "https://www.eum.go.kr" },
          { label: "관할 구청 건축과·위생과 전화로 업종 가능 여부 사전 확인" },
        ],
        questions: [
          "이 공간의 정확한 용도가 무엇인가요?",
          "위반건축물 표기가 있나요?",
          "이전 세입자가 같은 업종으로 영업신고를 받았나요?",
        ],
      },
      en: {
        title: "Check permitted use",
        summary: "A mismatch between registered use and your business type can block your license after signing.",
        why: ["Your business type must match the building's registered use.", "Illegal-structure flags risk both deposit and licensing."],
        checklist: [
          "Building Register use code + per-floor use (gov.kr)",
          "Illegal-structure flag (yellow marking)",
          "Register owner = deed owner",
          "Confirm your business type is licensable here (call district office)",
        ],
        traps: [
          { label: "Floor-by-floor restrictions", desc: "1F may be retail while basement is storage-only. Always check per floor." },
          { label: "Illegal structure", desc: "Owner may be paying enforcement fines; tenant protection is weak under demolition orders." },
        ],
        actions: [
          { label: "View Building Register on gov.kr", href: "https://www.gov.kr" },
          { label: "Check land-use zone on eum.go.kr", href: "https://www.eum.go.kr" },
          { label: "Call your district office to confirm licensability" },
        ],
        questions: [
          "What is the exact registered use of this space?",
          "Any illegal-structure flags?",
          "Did the previous tenant get a license for the same business type?",
        ],
      },
    },
    "facility-check": {
      ko: {
        title: "시설과 설비 확인",
        summary: "전기·배기·급배수 부족은 계약 후 수백만~수천만 원 추가 공사로 돌아옵니다. 입주 전 직접 점검.",
        why: ["계약전력 부족 → 한전 경고 + 누진세.", "배기·급배수 공사는 건물주 동의 없이 하면 원상복구 부담."],
        checklist: [
          "계약전력(kW) — 음식점/카페는 보통 12kW+ 필요",
          "3상/단상 — 대형 냉장·주방기기는 3상 필수",
          "배기 덕트 옥상 인출 가능 여부",
          "급배수 위치·수압",
        ],
        traps: [
          { label: "계약전력 초과", desc: "초과 시 한전 경고 → 3년 내 재초과 시 누진세. 음식점/카페는 12kW+ 가 안전." },
          { label: "급기 없는 배기", desc: "배기만 설치하면 실내 음압으로 문이 안 열리고 냄새 역류. 급기·배기 균형 설계 필수." },
        ],
        actions: [
          { label: "한국전력 123 / 마이한전 앱에서 계약전력 조회" },
          { label: "전기안전공사 1588-7794 진단 요청" },
          { label: "배기·전기 증설 시 건물주 서면 동의서 징구" },
        ],
        questions: [
          "이 공간 계약전력은 몇 kW, 3상인가요 단상인가요?",
          "배기 덕트를 옥상까지 인출 가능한가요?",
          "추가 전기·배기 공사 시 동의서 받을 수 있나요?",
        ],
      },
      en: {
        title: "Review facilities and utilities",
        summary: "Power, vent, water shortages turn into millions in post-signing construction. Verify in person.",
        why: ["Exceeding contracted power → KEPCO warning + surcharge.", "Vent/plumbing work without landlord consent becomes restoration liability."],
        checklist: [
          "Contracted power (kW) — café/restaurant typically needs 12kW+",
          "Single vs three-phase — heavy refrigeration needs three-phase",
          "Whether exhaust ducting can reach the rooftop",
          "Water supply location, pressure",
        ],
        traps: [
          { label: "Contracted power overage", desc: "Exceed → KEPCO warns, second exceedance within 3 years → surcharge. 12kW+ is safe baseline." },
          { label: "Exhaust without intake", desc: "Negative indoor pressure → doors hard to open + odor backflow. Design intake/exhaust balance upfront." },
        ],
        actions: [
          { label: "Check contracted power via KEPCO app / call 123" },
          { label: "Request electrical inspection: 1588-7794" },
          { label: "Get written landlord consent for any vent/electrical upgrade" },
        ],
        questions: [
          "What's the contracted power in kW, and is it single or three-phase?",
          "Can exhaust ductwork reach the rooftop?",
          "Will you consent in writing to vent/electrical upgrades?",
        ],
      },
    },
    "restriction-check": {
      ko: {
        title: "계약 제한 조항 확인",
        summary: "권리금·임대료 상한·원상복구·갱신요구권은 서명 후 못 바꿉니다. 특약으로 명시하세요.",
        why: ["계약갱신요구권은 만료 6~1개월 사이만 행사 가능 — 놓치면 권리 소멸.", "원상복구 '전부' 조항은 인테리어 철거 비용 전가."],
        checklist: [
          "임대료 인상 5% 상한 명시 + 갱신요구권 10년",
          "환산보증금 = 보증금 + (월세 × 100) — 서울 10억 / 수도권 6.5억 / 광역시 5.5억 이하면 보호 전면 적용",
          "원상복구 범위 — '입주 시 상태 영상 첨부' 특약",
          "권리금·전대·업종변경 조항",
        ],
        traps: [
          { label: "갱신요구권 시기 놓침", desc: "만료 6~1개월 전 서면 요구. 하루 늦어도 보호 소멸. 만료 -7·-6개월 알림 필수." },
          { label: "원상복구 '전부' 함정", desc: "'퇴거 시 원상복구' 만 있으면 인테리어 전체 철거 가능. 입주 영상 + '기존 설치물 제외' 특약." },
        ],
        actions: [
          { label: "인터넷등기소 등기부등본 열람 (근저당·가압류)", href: "https://www.iros.go.kr" },
          { label: "입주 당일 공간 전체 영상 촬영 → 날짜 메타데이터로 클라우드 저장" },
          { label: "권리금 계약서 별도 작성 + 공증" },
        ],
        questions: [
          "임대료 인상 상한선을 계약서에 명시할 수 있나요?",
          "원상복구 범위를 특약으로 합의 가능한가요?",
          "건물에 근저당·가압류가 있나요?",
        ],
      },
      en: {
        title: "Review lease restriction clauses",
        summary: "Renewal rights, rent caps, restoration scope, key money — unchangeable after signing. Lock into special clauses.",
        why: ["Renewal request window is 6–1 months before expiry — miss it and the right is gone.", "Blanket restoration clauses can force full fit-out removal."],
        checklist: [
          "Rent cap 5% + renewal right (up to 10y) explicit in contract",
          "Converted deposit = deposit + (monthly rent × 100). Seoul ≤ ₩1B / Metro ≤ ₩650M / City ≤ ₩550M for full protection",
          "Restoration scope — attach move-in condition video as exhibit",
          "Key money / sub-lease / business-type change clauses",
        ],
        traps: [
          { label: "Renewal window missed", desc: "Submit written request 6–1 months before expiry. Miss by a day → protection lost. Set T-7 + T-6 month alerts." },
          { label: "Blanket restoration", desc: "'Restore to original state' alone allows full fit-out removal. Film move-in condition + add 'existing fixtures excluded' clause." },
        ],
        actions: [
          { label: "Check deed register on iros.go.kr (mortgages, injunctions)", href: "https://www.iros.go.kr" },
          { label: "Film entire space on move-in day; save with date metadata" },
          { label: "Draft separate key-money contract + notarize" },
        ],
        questions: [
          "Can we cap the rent increase explicitly in the contract?",
          "Can restoration scope be agreed in writing?",
          "Any mortgages/injunctions on this property?",
        ],
      },
    },
    "septic-tank-checked": {
      ko: {
        title: "정화조 용량 확인 (음식·카페)",
        summary: "용량 부족 시 영업신고가 거부됩니다. 계약 전 건축물대장으로 반드시 확인.",
        why: ["음식점 영업신고는 정화조 용량이 좌석·면적 기준 충족 필수.", "사후 발견 시 정화조 증축 500~2,000만원 + 일정 지연."],
        checklist: [
          "건축물대장 정화조 용량(인용/L) 확인",
          "필요 용량 = 예상 좌석·면적 기준 (구청 위생과 문의)",
          "공공하수도 연결 여부 — 연결되면 정화조 제약 해소",
          "공유 정화조 → 다른 음식점 입점 현황 확인",
        ],
        traps: [
          { label: "대장 누락", desc: "오래된 건물은 용량 미기재. 청소업체 영수증 또는 위생과 실용량 확인 필수." },
          { label: "공유 정화조 과부하", desc: "다세대 음식점은 일찍 한도 도달. 구청에서 다른 영업신고 현황 사전 확인." },
        ],
        actions: [
          { label: "정부24 건축물대장 발급 → 정화조 항목", href: "https://www.gov.kr" },
          { label: "관할 구청 위생과 전화로 영업신고 가능 용량 확인" },
          { label: "공공하수도 연결 여부 임대인에게 확인" },
        ],
        questions: [
          "정화조 용량이 영업신고에 충분한가요?",
          "공공하수도 연결 상태는요?",
          "다른 음식점이 입점해 있다면 정화조 사용량은 얼마인가요?",
        ],
      },
      en: {
        title: "Check septic tank capacity (food/cafe)",
        summary: "Insufficient capacity → permit denied. Verify via building registry before signing.",
        why: ["Food permits require septic capacity matching seating/area.", "Post-signing fix costs ₩5–20M + schedule delay."],
        checklist: [
          "Septic capacity from building registry (liters or persons)",
          "Required capacity for planned seating/area (call district hygiene office)",
          "Public sewer connection — removes septic constraint",
          "Shared septic → check other food permits in the building",
        ],
        traps: [
          { label: "Capacity not in registry", desc: "Older buildings often omit it. Verify via cleaning receipts or hygiene office." },
          { label: "Shared septic overload", desc: "Multi-tenant food buildings hit limits early. Check existing permits at the district office." },
        ],
        actions: [
          { label: "Get building registry from gov.kr", href: "https://www.gov.kr" },
          { label: "Call district hygiene office to confirm permit-eligible capacity" },
          { label: "Confirm public sewer connection with landlord" },
        ],
        questions: [
          "Is septic capacity sufficient for a food permit?",
          "Is public sewer connected?",
          "If other food tenants exist, what's current septic load?",
        ],
      },
    },
    "certified-date-obtained": {
      ko: {
        title: "확정일자 받기 (보증금 보호)",
        summary: "임대인 파산·경매 시 보증금 우선 변제 받는 법적 장치. 계약 당일 신청 원칙.",
        why: ["확정일자 없으면 경매 시 후순위로 밀려 보증금 손실 위험.", "하루 늦으면 그 사이 설정된 근저당이 우선."],
        checklist: [
          "계약서 원본 + 신분증 지참",
          "관할 세무서 또는 정부24 신청 (사업자등록과 동시 처리 가능)",
          "수수료 600원",
          "건물 등기부등본 — 근저당 합계가 매매가의 70%↑면 위험",
        ],
        traps: [
          { label: "신청 지연", desc: "계약 당일 신청 원칙. 하루 늦으면 그 사이 근저당이 우선 — 보증금 회수 0% 케이스 발생." },
          { label: "근저당 무시", desc: "기존 근저당이 있으면 확정일자도 그 뒤. 등기부등본 근저당 합계 매매가 70% 초과면 위험." },
        ],
        actions: [
          { label: "정부24 온라인 확정일자 신청 (당일 처리)", href: "https://www.gov.kr" },
          { label: "인터넷등기소 등기부등본 열람", href: "https://www.iros.go.kr" },
          { label: "사업자등록 신청 시 확정일자도 동시 처리" },
        ],
        questions: [
          "기존 근저당 합계는 매매가의 몇 % 인가요?",
          "보증금 반환 일정은 어떻게 되나요?",
          "전세권 설정 등기가 가능한가요? (더 강력한 보호)",
        ],
      },
      en: {
        title: "Obtain certified date for deposit protection",
        summary: "Legal device for priority deposit recovery in foreclosure. Same-day filing is the rule.",
        why: ["Without it, you're a junior creditor in foreclosure.", "One day late → new mortgages take priority over you."],
        checklist: [
          "Bring original lease + ID",
          "File at district tax office or gov.kr (combine with business registration)",
          "Fee: ₩600",
          "Pre-check deed register — if mortgages > 70% of property value, high risk",
        ],
        traps: [
          { label: "Late filing", desc: "Same-day rule. One day late = new mortgages outrank you — 0% recovery cases exist." },
          { label: "Ignoring mortgages", desc: "Existing mortgages outrank certified date. If total > 70% of property value, walk away." },
        ],
        actions: [
          { label: "File online via gov.kr (same-day)", href: "https://www.gov.kr" },
          { label: "Check deed register on iros.go.kr", href: "https://www.iros.go.kr" },
          { label: "Combine with business registration at the tax office" },
        ],
        questions: [
          "What % of property value do existing mortgages total?",
          "What's the deposit refund timeline?",
          "Can a 전세권 (jeonse-right) registration be filed? (stronger protection)",
        ],
      },
    },
  };

  return details[taskId]?.[language] ?? {
    title: taskId,
    summary: "",
    why: [],
    checklist: [],
    traps: [],
    actions: [],
    questions: []
  };
}

export function buildTransitionNotice(nextRoadmap: typeof starterRoadmap, language: "ko" | "en") {
  const nextStage =
    nextRoadmap.stages.find((stage) => stage.stageId === nextRoadmap.currentStageId) ??
    nextRoadmap.stages[0];
  const nextTitle = localizeStage(nextStage, language).title;
  return language === "ko"
    ? { title: "완료됨", body: `${nextTitle} 단계로 이어집니다.` }
    : { title: "Saved", body: `Next up: ${nextTitle}.` };
}

export function cloneStarterTaskMap(): WorkflowTaskMap {
  return Object.fromEntries(
    Object.entries(starterTaskMap).map(([stageCode, tasks]) => [
      stageCode,
      tasks.map((task) => ({ ...task }))
    ])
  );
}
