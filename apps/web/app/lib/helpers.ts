import type { AiStructuredResponse, ContractAnalysisResult } from "@build-up/ai";
import {
  formatGuideSectionTitle,
  localizeStage,
  starterRoadmap,
  starterStageFlow,
  starterTaskMap,
  type GuideQaAnswer,
  type RecommendationItem,
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

export function parseManwonInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return undefined;
  }

  const amount = Number.parseInt(digits, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return amount * 10000;
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
        summary: "건물 용도와 영업 업종이 맞지 않으면 계약서에 서명한 뒤에도 구청 허가 단계에서 영업 자체가 막힐 수 있습니다.",
        why: ["건축물 용도(근린생활시설·판매시설 등)와 실제 영업 업종이 일치해야 합니다.", "위반건축물로 표기된 공간은 보증금 회수와 인허가 모두 리스크가 생깁니다."],
        checklist: [
          "건축물대장에서 건물 용도·용도지역 확인 (정부24 무료 열람)",
          "위반건축물 여부 확인 (건축물대장 상 노란색 표기)",
          "건축물대장 소유자 = 등기부등본 소유자 일치 여부",
          "내 업종의 영업신고·허가를 이 용도 건물에서 받을 수 있는지",
          "토지이음에서 용도지역·지구·구역 확인 (행위 제한 조항)"
        ],
        traps: [
          { label: "층별 용도 제한", desc: "같은 건물도 층마다 허용 용도가 다릅니다. 1층은 판매시설이어도 지하층은 창고·주차장만 허용되는 경우가 있습니다. 건축물대장에서 층별 용도를 반드시 확인하세요." },
          { label: "일반음식점 vs 휴게음식점 분류", desc: "커피숍이라도 주류를 팔면 일반음식점으로 신고해야 합니다. 분류에 따라 허가 조건과 면적 기준이 달라지므로 구청 위생과에 사전 문의하세요." },
          { label: "위반건축물 계약", desc: "위반건축물은 건물주가 이행강제금을 납부 중인 상태일 수 있습니다. 향후 철거 명령 시 세입자 보호가 약하고 원상복구 비용이 세입자에게 전가될 수 있습니다." }
        ],
        actions: [
          { label: "정부24에서 건축물대장 무료 열람", href: "https://www.gov.kr" },
          { label: "토지이음에서 용도지역·지구 확인", href: "https://www.eum.go.kr" },
          { label: "법원 인터넷 등기소에서 등기부등본 열람 (근저당·가압류 확인)", href: "https://www.iros.go.kr" },
          { label: "계약 전 관할 구청 건축과 또는 위생과에 업종 허가 가능 여부 직접 문의" }
        ],
        questions: [
          "건축물대장 상 이 공간의 용도가 정확히 무엇인가요?",
          "위반건축물로 표기된 부분이 있나요?",
          "이전 세입자가 같은 업종으로 영업신고를 받은 적 있나요?",
          "혹시 건물에 근저당이나 가압류가 설정되어 있나요?"
        ]
      },
      en: {
        title: "Check permitted use",
        summary: "A mismatch between the building's registered use and your business type can block your operating license even after you sign.",
        why: ["Your business category must match the building's registered use (neighborhood commercial, retail, etc.).", "Buildings flagged as illegal structures create risks for both your deposit recovery and licensing."],
        checklist: [
          "Verify building use category from the Building Register (gov.kr, free)",
          "Check for illegal structure flags (yellow markings on the register)",
          "Confirm the register owner matches the deed owner",
          "Confirm your specific business type can be licensed in this building use",
          "Check land use zone and restrictions on land.e-nara.go.kr"
        ],
        traps: [
          { label: "Floor-by-floor use restrictions", desc: "Different floors of the same building may have different permitted uses. Always check each floor on the Building Register." },
          { label: "Restaurant classification matters", desc: "A café serving alcohol needs a general restaurant license, not a snack bar license. Requirements differ significantly — ask the local health department." },
          { label: "Illegal structure risk", desc: "Illegal structures may face demolition orders. Tenants have limited protection and may bear restoration costs if forced out." }
        ],
        actions: [
          { label: "View Building Register free on gov.kr", href: "https://www.gov.kr" },
          { label: "Check land-use zone on eum.go.kr", href: "https://www.eum.go.kr" },
          { label: "Check deed (mortgages, injunctions) on iros.go.kr", href: "https://www.iros.go.kr" },
          { label: "Call or visit your local district office to confirm licensing eligibility before signing" }
        ],
        questions: [
          "What is the exact registered use category of this space?",
          "Are there any illegal structure flags on the building register?",
          "Did the previous tenant receive a business license for the same type?",
          "Are there any mortgages or injunctions registered on the property?"
        ]
      }
    },
    "facility-check": {
      ko: {
        title: "시설과 설비 확인",
        summary: "전기 용량 부족, 배기 덕트 미비, 숨겨진 노후 설비는 계약 후 수백만 원의 추가 공사 비용으로 돌아옵니다. 입주 전에 직접 확인하세요.",
        why: ["계약전력이 부족하면 한전에서 경고 후 누진 요금을 부과합니다.", "배기·급배수 공사는 건물주 동의 없이 진행하면 원상복구 대상이 됩니다."],
        checklist: [
          "계약전력(kW) 확인 및 내 업종 필요 전력 계산",
          "3상/단상 전력 여부 확인 (대형 냉장·주방 기기는 3상 필요)",
          "급배수 위치와 수압·용량 확인",
          "배기 덕트 위치 및 옥상 인출 가능 여부",
          "기존 냉난방 설비 용량과 연식 확인",
          "천장 높이 (후드·덕트 설치 가능한 최소 2.4m 이상 권장)"
        ],
        traps: [
          { label: "계약전력 초과 페널티", desc: "계약전력(kW) × 15시간 × 30일 = 월 허용 전력량입니다. 음식점·카페 기준 커피머신(4.5kW)+냉장고(0.3)+제빙기(0.4)+냉난방(2.5)+온수기(2.5) = 약 12kW 필요. 초과 시 1회 경고 후 3년 내 재초과 시 추가 요금 및 누진세가 부과됩니다." },
          { label: "배기 전용 설치 문제", desc: "급기(공기 공급) 없이 배기만 설치하면 실내 압력이 낮아져 출입문이 열기 힘들어지고 냄새 역류가 생깁니다. 급기·배기 균형을 설계 단계에서 확인하세요." },
          { label: "전 세입자 시설 무상 인수 함정", desc: "이전 설비를 무상 인수 조건으로 계약하면 고장 시 수리 책임이 불명확해집니다. 인수 항목을 목록으로 만들어 계약서 특약에 명시하세요." }
        ],
        actions: [
          { label: "한국전력 고객센터(123) 또는 마이한전 앱에서 계약전력 조회" },
          { label: "전기안전공사(1588-7794)에 전기 설비 현황 진단 요청" },
          { label: "배기 덕트 공사 가능 여부는 건물 관리사무소 또는 건물주에게 사전 서면 동의 요청" },
          { label: "설비 증설 계획이 있으면 공사 전 건물주 동의서 징구" }
        ],
        questions: [
          "이 공간의 계약전력이 몇 kW인가요? 3상/단상 전력인가요?",
          "배기 덕트를 옥상까지 인출할 수 있나요?",
          "기존 냉난방 설비는 연식이 어떻게 되나요? 수리 이력이 있나요?",
          "추가 전기 공사나 배기 공사 시 건물주 동의를 받을 수 있나요?",
          "기존 시설 중 인수 조건이 있는 항목이 있나요?"
        ]
      },
      en: {
        title: "Review facilities and utilities",
        summary: "Insufficient power, missing ventilation, or hidden aging equipment can add millions in construction costs after you sign. Verify in person before committing.",
        why: ["Exceeding your contracted power capacity triggers warnings and then penalty surcharges from KEPCO.", "Ventilation or plumbing work done without landlord consent becomes a full restoration liability."],
        checklist: [
          "Contracted power (kW) and calculation of your actual power needs",
          "Single-phase vs. three-phase power (commercial refrigeration typically needs three-phase)",
          "Water supply location, pressure, and flow capacity",
          "Ventilation duct position and whether rooftop exhaust is possible",
          "Existing HVAC unit capacity and age",
          "Ceiling height (minimum 2.4m recommended for hood and duct installation)"
        ],
        traps: [
          { label: "Contracted power overage penalty", desc: "Contracted kW × 15hr × 30 days = monthly allowed usage. A café needs roughly 12 kW minimum. Exceed the limit and KEPCO issues a warning; exceed again within 3 years and you get surcharges." },
          { label: "Exhaust-only ventilation problem", desc: "Installing exhaust without a fresh-air intake drops indoor pressure, making doors hard to open and causing odor backflow. Balance must be designed upfront." },
          { label: "Taking over previous tenant's fixtures", desc: "Inheriting equipment 'for free' makes repair responsibility ambiguous. List every inherited item in the lease special clauses." }
        ],
        actions: [
          { label: "Check contracted power via KEPCO app or call 123" },
          { label: "Request electrical safety inspection from Korea Electrical Safety Corporation (1588-7794)" },
          { label: "Get written landlord consent before any duct or electrical expansion work" },
          { label: "Document all inherited fixtures with a signed list attached to the contract" }
        ],
        questions: [
          "What is the contracted power in kW, and is it single-phase or three-phase?",
          "Can I run exhaust ductwork all the way to the rooftop?",
          "How old is the HVAC unit, and has it needed major repairs?",
          "Will you consent in writing to electrical or ventilation upgrades?",
          "Which fixtures am I inheriting, and on what terms?"
        ]
      }
    },
    "restriction-check": {
      ko: {
        title: "계약 제한 조항 확인",
        summary: "권리금, 업종 제한, 원상복구 범위, 임대료 인상 상한은 계약 후 되돌릴 수 없는 조항입니다. 서명 전에 반드시 특약으로 명시하세요.",
        why: ["상가임대차보호법상 계약갱신요구권은 만료 6~1개월 사이에만 요구할 수 있고, 이 기간을 놓치면 권리를 잃습니다.", "원상복구 범위가 '전부'로 적혀 있으면 인테리어 전체를 철거해야 할 수 있습니다."],
        checklist: [
          "임대차 기간 및 계약갱신요구권 적용 여부 확인 (최대 10년)",
          "임대료 인상 상한(5%) 조항 계약서 명시 여부",
          "환산보증금 확인 — 서울 10억원, 수도권 6억5천만원, 광역시 5억5천만원 이하 시 상가임대차보호법 전면 적용",
          "권리금 수수 조항 및 임대인 방해 금지 조항",
          "원상복구 범위 명시 (입주 전 사진·영상 기록 필수)",
          "임대인 동의 없는 전대·양도 금지 조항",
          "업종 변경 제한 조항 여부"
        ],
        traps: [
          { label: "계약갱신요구권 기간 놓침", desc: "계약 만료 6개월 전~1개월 전 사이에 서면으로 요구해야 합니다. 이 기간을 하루라도 놓치면 법적 보호를 받을 수 없습니다. 달력에 만료일 기준 -7개월, -6개월 알림을 설정하세요." },
          { label: "환산보증금 초과 시 보호 축소", desc: "환산보증금 = 보증금 + (월세 × 100). 이 금액이 지역 기준을 초과하면 임대료 인상 5% 제한이 적용되지 않을 수 있습니다. 보증금·월세 조합으로 사전 계산하세요." },
          { label: "권리금 보호 시기 놓침", desc: "권리금 보호는 임대차 종료 6개월 전부터 종료일까지만 적용됩니다. 임대인이 이 기간 외에 새 세입자와 직접 계약하면 법적 보호를 받기 어렵습니다." },
          { label: "원상복구 '전부' 조항", desc: "'퇴거 시 원상복구'만 적혀 있으면 임대인이 인테리어 전체 철거를 요구할 수 있습니다. 입주 시 상태를 사진·영상으로 기록하고, 특약에 '기존 설치물 제외' 항목을 명시하세요." }
        ],
        actions: [
          { label: "법원 인터넷 등기소에서 등기부등본 열람 (근저당·가압류·가등기 확인)", href: "https://www.iros.go.kr" },
          { label: "대법원 상가임대차 계산기로 환산보증금 계산", href: "https://www.courts.go.kr" },
          { label: "입주 당일 공간 전체를 영상 촬영해 클라우드에 저장 (날짜 메타데이터 필수)" },
          { label: "권리금 계약서는 별도로 작성하고 가급적 공증 진행" },
          { label: "계약서 특약 사항에 원상복구 제외 항목 목록 명시" }
        ],
        questions: [
          "계약갱신 시 임대료 인상 계획이 있나요? 상한선을 계약서에 명시할 수 있나요?",
          "권리금 수수에 동의하시나요? 향후 양수인 구하는 데 협조할 의향이 있나요?",
          "원상복구 범위를 구체적으로 합의해 특약에 명시할 수 있나요?",
          "업종 변경이나 전대 시 동의 절차가 어떻게 되나요?",
          "건물에 근저당이나 가압류가 설정되어 있나요?"
        ]
      },
      en: {
        title: "Review lease restriction clauses",
        summary: "Lease renewal rights, rent increase caps, restoration scope, and key money terms cannot be changed after signing. Get them in the special clauses now.",
        why: ["The right to request lease renewal must be exercised 6–1 months before expiry — miss the window and the right is gone.", "A blanket restoration clause can require you to remove your entire fit-out when you leave."],
        checklist: [
          "Lease term and applicability of renewal rights (up to 10 years under Korean law)",
          "Rent increase cap (5%) explicitly stated in the contract",
          "Converted deposit check — Seoul ≤ ₩1B, Metro ≤ ₩650M, City ≤ ₩550M for full Act protection",
          "Key money transfer terms and landlord non-interference clause",
          "Restoration scope explicitly listed (photograph the space before move-in)",
          "Sub-lease and assignment restrictions",
          "Business type change restrictions"
        ],
        traps: [
          { label: "Missing the renewal request window", desc: "You must submit a written renewal request between 6 and 1 month before expiry. Miss it by even one day and you lose legal protection. Set a calendar reminder at T-7 months and T-6 months." },
          { label: "Converted deposit exceeding the threshold", desc: "Converted deposit = security deposit + (monthly rent × 100). If it exceeds the regional cap, the 5% rent increase limit may not apply. Calculate this before agreeing on the rent structure." },
          { label: "Key money protection timing", desc: "Key money protection only covers the 6 months before lease end through the end date. A landlord who signs a new tenant outside this window is hard to challenge legally." },
          { label: "Blanket restoration clause", desc: "If the contract just says 'restore to original state,' the landlord can demand full fit-out removal. Record the move-in condition on video and list exclusions in the special clauses." }
        ],
        actions: [
          { label: "Check deed register for mortgages and injunctions on iros.go.kr", href: "https://www.iros.go.kr" },
          { label: "Calculate converted deposit using the Supreme Court commercial lease calculator", href: "https://www.courts.go.kr" },
          { label: "Film a walkthrough video of the entire space on move-in day and save to cloud with date metadata" },
          { label: "Draft a separate key money contract and consider notarization" },
          { label: "Add a restoration exclusion list to the special clauses section of the lease" }
        ],
        questions: [
          "Do you plan to raise the rent at renewal? Can we cap the increase in the contract?",
          "Do you consent to key money transfer, and will you cooperate in finding a buyer?",
          "Can we agree on a specific restoration scope and list it in the special clauses?",
          "What is the process for approving a business type change or sub-lease?",
          "Are there any mortgages or injunctions registered on this property?"
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
