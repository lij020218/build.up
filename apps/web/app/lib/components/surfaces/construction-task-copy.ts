import type { Language } from "@foundone/shared";

type LocalizedCopy = {
  ko: string;
  en: string;
};

export const CONSTRUCTION_TASK_IDS = [
  "interior-concept-selected",
  "contractor-selected",
  "design-approved",
  "construction-complete",
  "fire-health-parallel",
] as const;

export type ConstructionTaskId = (typeof CONSTRUCTION_TASK_IDS)[number];

export type StrictConstructionCopyInput = {
  stageCode: string;
  startupType?: string;
  selectedFranchiseBrandId?: string | null;
  franchiseFlexibility?: string;
};

const STRICT_FRANCHISE_TASK_TITLES = {
  "interior-concept-selected": {
    ko: "본사 표준 BI 컨셉 확인 (위 카드에서 본사 방향 선택)",
    en: "Confirm HQ standard BI concept (pick closest direction above)",
  },
  "contractor-selected": {
    ko: "본사 가맹 담당자에게 시공 일정·비용 분담 협의 완료",
    en: "Confirm timing and cost-sharing with HQ franchise manager",
  },
  "design-approved": {
    ko: "본사 표준 도면·자재·집기 패키지 승인 (점주 변경 불가)",
    en: "Approve HQ standard drawings, materials, and equipment package (no owner edits)",
  },
  "construction-complete": {
    ko: "본사 지정 시공업체 시공 완료 + 본사 감리·BI 검수 통과",
    en: "HQ-mandated contractor finishes + HQ inspection / BI audit passes",
  },
  "fire-health-parallel": {
    ko: "보건증은 공사 중 발급 + 다중이용업(100㎡↑)이면 소방 '안전시설 설치신고'는 착공 전·완비증명(소방필증)은 완공검사 후 (본사 매뉴얼 확인)",
    en: "Health cert during construction + if a multi-use business (100㎡+), file the fire installation report before construction; the completion certificate issues after final inspection (check HQ manual)",
  },
} satisfies Record<ConstructionTaskId, LocalizedCopy>;

const STRICT_FRANCHISE_TASK_HINTS = {
  "interior-concept-selected": {
    ko: "본사 표준 BI 컨셉이 정해져 있어 자유 선택은 불가하지만, 위 컨셉 카드에서 본사 가이드와 가까운 방향을 골라두면 협의·점주 의견 정리에 도움 돼요.",
    en: "The HQ BI concept is fixed, but pick the closest direction in the cards above to align discussions with HQ.",
  },
  "contractor-selected": {
    ko: "외부 업체 견적·시공이 불가능합니다. 본사 가맹 담당자가 표준 시공 일정과 비용 분담(본사 부담 vs 점주 부담)을 안내해 줍니다.",
    en: "External contractors not allowed. The HQ franchise manager defines timing and cost-sharing.",
  },
  "design-approved": {
    ko: "본사가 도면·자재·집기를 일괄 공급하므로 점주 임의 변경은 계약 위반 사유가 될 수 있어요. 본사 패키지 명세서를 받아 보관하세요.",
    en: "HQ supplies all drawings/materials/equipment in a fixed package — owner edits may breach the franchise contract.",
  },
  "construction-complete": {
    ko: "본사 감리(현장 점검)와 BI 검수가 끝나야 오픈 승인을 받을 수 있어요. 시공 후 사진·체크리스트를 본사에 제출하세요.",
    en: "HQ inspection and BI audit must pass before opening — submit post-construction photos & checklist to HQ.",
  },
  "fire-health-parallel": {
    ko: "본사가 소방·위생 매뉴얼을 제공하지만, 신청자(영업자)는 점주 본인입니다. 보건증은 인테리어와 무관하므로 미리 받아 두세요.",
    en: "HQ provides the fire/health manual, but the applicant is the owner. Get the health card early — it's independent of construction.",
  },
} satisfies Record<ConstructionTaskId, LocalizedCopy>;

const FLEXIBLE_CONSTRUCTION_TASK_HINTS = {
  "interior-concept-selected": {
    ko: "위 컨셉 카드에서 하나를 클릭하면 자동으로 체크돼요. 업체 미팅에서 기준점이 됩니다.",
    en: "Click one of the concept cards above — it auto-checks and becomes the reference for contractor meetings.",
  },
  "contractor-selected": {
    ko: "위 자재 목록과 선택한 컨셉을 업체에 전달하면 더 정확한 견적을 받을 수 있어요.",
    en: "Share the material list and chosen concept above for more accurate quotes.",
  },
  "design-approved": {
    ko: "도면에 전기·배관·조명 위치가 반영됐는지 확인하세요. 시공 시작 후 변경은 추가 비용이 발생합니다.",
    en: "Verify electrical, plumbing, and lighting positions are in the drawings before work starts.",
  },
  "construction-complete": {
    ko: "현장 점검 시 자재 사양·마감 품질·누수·전기 작동 여부를 항목별로 체크하세요.",
    en: "During walkthrough, check material specs, finish quality, leaks, and electrical operation.",
  },
} satisfies Partial<Record<ConstructionTaskId, LocalizedCopy>>;

function localize(copy: LocalizedCopy | undefined, language: Language) {
  return copy ? copy[language] : null;
}

function isConstructionTaskId(taskId: string): taskId is ConstructionTaskId {
  return CONSTRUCTION_TASK_IDS.includes(taskId as ConstructionTaskId);
}

export function shouldUseStrictFranchiseConstructionCopy({
  stageCode,
  startupType,
  selectedFranchiseBrandId,
  franchiseFlexibility,
}: StrictConstructionCopyInput) {
  return (
    stageCode === "construction_setup" &&
    startupType === "franchise" &&
    !!selectedFranchiseBrandId &&
    franchiseFlexibility === "strict"
  );
}

export function getConstructionTaskTitleOverride(
  taskId: string,
  language: Language,
  isStrictFranchise: boolean,
) {
  if (!isConstructionTaskId(taskId)) {
    return null;
  }

  return isStrictFranchise
    ? localize(STRICT_FRANCHISE_TASK_TITLES[taskId], language)
    : null;
}

export function getConstructionTaskHint(
  taskId: string,
  language: Language,
  isStrictFranchise: boolean,
) {
  if (!isConstructionTaskId(taskId)) {
    return null;
  }

  const hints: Partial<Record<ConstructionTaskId, LocalizedCopy>> = isStrictFranchise
    ? STRICT_FRANCHISE_TASK_HINTS
    : FLEXIBLE_CONSTRUCTION_TASK_HINTS;

  return localize(hints[taskId], language);
}
