/**
 * startup-budget-items.ts — 창업 예산 항목 SSOT (2026-08-07, 사장님 지시)
 *
 * ── 왜 만들었나 ──────────────────────────────────────────────
 * 예산 단계가 "총액 하나"만 받아서, 사장님이 항목을 빠뜨린 채(권리금·인허가·오픈 판촉 등)
 * 총액을 어림잡는 구조였다. 항목별로 나눠 입력하고 합계를 총 예산으로 계산한다.
 *
 * ── 항목 구성 근거 (2026-08-07 조사) ─────────────────────────
 * 오프라인: 업계 가이드들이 공통으로 드는 구성 = 보증금 / 권리금(시설·영업·바닥, 상가의
 *   65%+ 가 권리금 존재 — 한국부동산원 2021 서울 숙박·음식업 평균 약 5,335만원) /
 *   인테리어·간판(평당 견적 "기본 사항" 함정) / 집기·주방설비 / 초도물품 /
 *   인허가·행정·보험(위생교육·영업신고·면허세 등) / 오픈 판촉 / 운영예비(3~6개월 고정비).
 *   프랜차이즈는 가맹비·교육비가 추가된다.
 * 온라인: 스마트스토어 "0원 창업" 슬로건과 달리 실제로는 초도재고·사입 / 촬영·콘텐츠 /
 *   스토어 구축·상세페이지(수십만~100만원+) / 통신판매업 신고(면허세 18,000~45,000원) /
 *   초기 광고비가 든다.
 * 스타트업: 법인설립·행정 / 장비·SW·인프라 / 개발 외주·초기 인건비 / 초기 마케팅.
 *   (라운드 프리셋과 병행 — 항목 입력은 세부 조정용)
 *
 * ── 저장 규약 (웹·iOS 공유) ──────────────────────────────────
 * budget-setup 결정 inputs 에 **flat string 키**로 저장한다 (iOS StageDecision.inputs 가
 * [String:String] 이라 중첩 불가): `budgetItem.<key>` = 만원 단위 정수 문자열.
 * 합계는 기존 ① selectedBudget(=inputs.capital, 원 단위)으로 흘러가고,
 * ② 운영예비(initialOperatingCapital)는 기존 두 통 모델 그대로 별도다.
 * 월 마케팅 예산은 `monthlyMarketingBudget`(만원) — user_store_data.marketing_monthly_budget 로
 * 투영된다 (웹: marketing store → usePersistence / iOS: StageInputProjector).
 *
 * ⚠️ iOS BudgetSetupStageView 가 이 정의를 손미러 — 항목 추가·수정 시 양쪽 동시.
 *    가드: apps/web/__tests__/startup-budget-items.test.ts
 */

export type BudgetItemGroup = "offline" | "online" | "startup";

export type BudgetItemDef = {
  /** inputs 키 접미 — `budgetItem.<key>` 로 저장 */
  key: string;
  labelKo: string;
  /** 입력 힌트 — 무엇이 포함되는지 (빠뜨림 방지가 목적) */
  hintKo: string;
  /** 프랜차이즈 선택 시에만 표시 */
  franchiseOnly?: boolean;
  /** 없을 수 있는 항목 (권리금 등) — UI 에서 "없으면 0" 안내 */
  optionalKo?: string;
};

export const BUDGET_ITEM_INPUT_PREFIX = "budgetItem.";
export const MONTHLY_MARKETING_INPUT_KEY = "monthlyMarketingBudget";

const OFFLINE_ITEMS: BudgetItemDef[] = [
  { key: "deposit", labelKo: "보증금", hintKo: "상가 임대차 보증금" },
  { key: "premium", labelKo: "권리금", hintKo: "시설·영업·바닥 권리금 — 계약서에 명시하고 세금계산서를 받으세요", optionalKo: "없는 자리면 0" },
  { key: "franchiseFee", labelKo: "가맹비·교육비", hintKo: "가맹금·교육비·보증금 등 본사 납부액 (정보공개서 기준)", franchiseOnly: true },
  { key: "interior", labelKo: "인테리어·간판", hintKo: "철거·설비·간판 포함 — 평당 견적의 '별도 공사' 항목까지 확인" },
  { key: "equipment", labelKo: "집기·주방설비", hintKo: "주방기기·냉장·테이블·POS 등" },
  { key: "initialStock", labelKo: "초도물품", hintKo: "식자재·포장재·소모품 첫 사입" },
  { key: "permits", labelKo: "인허가·행정·보험", hintKo: "위생교육·영업신고·면허세·화재보험 등 잡비" },
  { key: "openMarketing", labelKo: "오픈 마케팅", hintKo: "오픈 이벤트·전단·플레이스 세팅 등 일회성 판촉" },
];

const ONLINE_ITEMS: BudgetItemDef[] = [
  { key: "initialStock", labelKo: "초도재고·사입", hintKo: "첫 재고 매입 (위탁·무재고면 0)", optionalKo: "무재고면 0" },
  { key: "content", labelKo: "촬영·콘텐츠", hintKo: "제품 촬영·모델·장비" },
  { key: "storefront", labelKo: "스토어 구축", hintKo: "스킨·상세페이지 디자인·로고" },
  { key: "permits", labelKo: "신고·행정", hintKo: "통신판매업 신고 면허세 등 잡비" },
  { key: "openMarketing", labelKo: "초기 광고", hintKo: "런칭 광고·체험단 등 일회성 집행" },
];

const STARTUP_ITEMS: BudgetItemDef[] = [
  { key: "incorporation", labelKo: "법인설립·행정", hintKo: "설립 등기·등록면허세·정관 등" },
  { key: "equipment", labelKo: "장비·SW·인프라", hintKo: "개발장비·서버·SaaS 초기 셋업" },
  { key: "development", labelKo: "개발·초기 인건비", hintKo: "외주 개발비 또는 런칭 전 인건비" },
  { key: "openMarketing", labelKo: "초기 마케팅", hintKo: "런칭 캠페인·랜딩·콘텐츠" },
];

const ITEMS_BY_GROUP: Record<BudgetItemGroup, BudgetItemDef[]> = {
  offline: OFFLINE_ITEMS,
  online: ONLINE_ITEMS,
  startup: STARTUP_ITEMS,
};

export function budgetItemGroupFor(industryCategoryId: string | null | undefined): BudgetItemGroup {
  if (industryCategoryId === "startup-tech") return "startup";
  if (industryCategoryId === "online-digital") return "online";
  return "offline";
}

/** 업종·창업형태에 맞는 항목 목록 (franchiseOnly 게이트 포함) */
export function budgetItemsFor(
  industryCategoryId: string | null | undefined,
  isFranchise: boolean,
): BudgetItemDef[] {
  const items = ITEMS_BY_GROUP[budgetItemGroupFor(industryCategoryId)];
  return isFranchise ? items : items.filter((i) => !i.franchiseOnly);
}

/** inputs(flat string) → 항목별 만원 값. 숫자 아닌 값·음수는 0. */
export function parseBudgetItems(
  inputs: Record<string, unknown> | null | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!inputs) return out;
  for (const [k, v] of Object.entries(inputs)) {
    if (!k.startsWith(BUDGET_ITEM_INPUT_PREFIX)) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) out[k.slice(BUDGET_ITEM_INPUT_PREFIX.length)] = Math.round(n);
  }
  return out;
}

/** 항목 합계(만원) → 원. 입력이 하나도 없으면 null (총액 직접입력 모드와 구분). */
export function sumBudgetItemsWon(itemsManwon: Record<string, number>): number | null {
  const values = Object.values(itemsManwon);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) * 10_000;
}
