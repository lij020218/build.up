// ─── Pre-launch checklist ID 매핑 ───────────────────────────────────────────
//
// PreLaunchStage 의 IIFE 안에 있는 데이터 (id + label + detail) 와 1:1 매칭되는
// ID 만 추출한 lookup. CurrentStageView 가 task 완료 판정 시 100% 룰 적용에 사용.
//
// ⚠️ PreLaunchStage 의 데이터를 변경할 때 이 파일도 같이 업데이트할 것.
//    (drift 방지 — id 가 없으면 사용자가 체크해도 카운트 안 됨)

/** 모든 업종 공통 일일 체크 (universalDayChecks) — 10개 */
export const PRE_LAUNCH_UNIVERSAL_DAY_IDS: string[] = [
  "day-cleanliness", "day-staff-briefing", "day-pos", "day-ambiance", "day-observation",
  "day-payment", "day-feedback-card", "day-debrief", "day-settlement", "day-sns",
];

/** 프랜차이즈 추가 일일 체크 — 4개 */
export const PRE_LAUNCH_FRANCHISE_EXTRA_IDS: string[] = [
  "day-hq-erp-sync", "day-hq-order", "day-hq-brand-std", "day-hq-recipe",
];

/** 개인 운영 추가 일일 체크 — 4개 */
export const PRE_LAUNCH_INDEPENDENT_EXTRA_IDS: string[] = [
  "day-self-log", "day-regular-crm", "day-competitor", "day-owner-rest",
];

/** 카테고리 단위 일일 체크 (sub-industry 데이터 없을 때 폴백) */
export const PRE_LAUNCH_INDUSTRY_DAY_IDS: Record<string, string[]> = {
  food: ["day-inventory", "day-order-timing", "day-delivery"],
  "cafe-dessert": ["day-inventory", "day-order-timing", "day-display"],
  beauty: ["day-booking-system", "day-no-show", "day-service-time"],
  retail: ["day-display", "day-inventory", "day-checkout-test"],
  fitness: ["day-equipment", "day-crm", "day-class"],
  "online-digital": ["day-checkout-online", "day-cs", "day-fulfillment"],
};

/** sub-industry 단위 일일 체크 — 52개 sub-industry */
export const PRE_LAUNCH_SUB_INDUSTRY_DAY_IDS: Record<string, string[]> = {
  "icecream-bingsu": ["day-freezer-temp", "day-icemachine", "day-toppings", "day-roomtemp", "day-display"],
  "takeout-coffee": ["day-machine-water", "day-cup-stock", "day-syrup", "day-pos-speed", "day-queue"],
  "specialty-coffee": ["day-grinder-cal", "day-bean-fresh", "day-extraction", "day-machine-clean", "day-cup-warm"],
  "dessert-cafe": ["day-showcase-temp", "day-dessert-life", "day-display", "day-allergen", "day-seasonal-push"],
  "bakery-studio": ["day-fermenter", "day-dough-time", "day-bread-discard", "day-cross-contam", "day-allergen"],
  "self-serve-cafe": ["day-kiosk-remote", "day-cctv-record", "day-auto-machine", "day-cleanliness", "day-security"],
  "ramen-noodle": ["day-broth-fresh", "day-rice-warm", "day-kimchi-temp", "day-bowl-clean", "day-seasoning"],
  "korean-casual": ["day-banchan-fresh", "day-kimchi-stock", "day-fresh-meat", "day-dishwasher", "day-selfbar"],
  "chicken-burger": ["day-fryoil-acid", "day-fryoil-change", "day-chicken-temp", "day-tools-sterilize", "day-delivery-sla"],
  "delivery-meals": ["day-package-stock", "day-app-receive", "day-rider-station", "day-temp-keep"],
  "salad-healthy": ["day-veg-fresh", "day-prep-cold", "day-dressing", "day-discard", "day-package-eco"],
  "western-pasta-brunch": ["day-pasta-stock", "day-cheese-temp", "day-brunch-prep", "day-plating", "day-table-setting"],
  "hair-salon": ["day-tool-uv", "day-hand-hygiene", "day-towel-fresh", "day-shampoo-clean", "day-booking"],
  "nail-studio": ["day-autoclave", "day-disposable", "day-alcohol-stock", "day-polish-expiry", "day-booking"],
  "skin-care-room": ["day-bed-sterile", "day-product-expiry", "day-machine-test", "day-hand-hygiene", "day-booking"],
  "waxing-studio": ["day-wax-temp", "day-spatula", "day-bed-cover", "day-skin-prep", "day-booking"],
  "eyelash-brow": ["day-glue-fresh", "day-tweezer", "day-patch-test", "day-bed-cover", "day-fan-vent"],
  "makeup-bridal": ["day-brush-clean", "day-product-test", "day-event-schedule", "day-skin-test", "day-emergency-kit"],
  "yoga-studio": ["day-mat-clean", "day-equipment-safe", "day-temp-humid", "day-class-roster", "day-aed"],
  "pilates-studio": ["day-reformer-spring", "day-mat-clean", "day-class-balance", "day-temp-humid", "day-aed"],
  "pt-gym": ["day-equipment-safe", "day-pt-schedule", "day-locker", "day-aed", "day-air-vent"],
  "crossfit-box": ["day-bar-collar", "day-flooring", "day-coach-prep", "day-noise", "day-aed"],
  "golf-studio": ["day-screen-cal", "day-mat-tee", "day-club-rental", "day-projector", "day-booking"],
  "unmanned-fitness": ["day-cctv-record", "day-access-control", "day-equipment-remote", "day-aed", "day-cleanliness"],
  "pet-supplies": ["day-animal-health", "day-cage-clean", "day-food-expiry", "day-vent-deodor", "day-grooming-tool"],
  "pet-cafe": ["day-animal-health", "day-vent-deodor", "day-floor-clean", "day-water-bowl", "day-customer-rules"],
  "kids-academy": ["day-fire-equip", "day-instructor", "day-student-list", "day-clean-toys", "day-emergency"],
  "adult-class": ["day-tools-prep", "day-instructor", "day-booking", "day-photo-spot", "day-allergen"],
  "language-academy": ["day-instructor", "day-equipment", "day-textbook", "day-fire-equip", "day-attendance"],
  "coding-class": ["day-pc-test", "day-software", "day-curriculum", "day-monitor", "day-emergency"],
  "small-study-room": ["day-prep-mat", "day-clean-desk", "day-noise", "day-attendance", "day-fire-equip"],
  "study-room": ["day-cleanliness", "day-equipment", "day-booking", "day-fire-equip"],
  "study-cafe-space": ["day-kiosk-remote", "day-cctv-record", "day-cleanliness", "day-beverage-stock", "day-fire-equip"],
  "pet-grooming": ["day-blade-clean", "day-bath-temp", "day-dryer", "day-pet-info", "day-stylist"],
  "pet-hotel": ["day-animal-checkin", "day-room-clean", "day-feeding", "day-walk-schedule", "day-emergency-vet"],
  "pet-training-school": ["day-trainer", "day-equipment", "day-floor-safe", "day-class-roster", "day-emergency-vet"],
  "pet-walking-visit": ["day-route", "day-key-access", "day-pet-info", "day-photo-report", "day-emergency"],
  "convenience-small": ["day-stock-replenish", "day-expiry", "day-cigarette", "day-cctv-record", "day-pos-speed"],
  "lifestyle-goods": ["day-display-curate", "day-photo-spot", "day-stock-rotation", "day-package", "day-music-light"],
  "beauty-supplies": ["day-tester", "day-product-expiry", "day-staff-knowledge", "day-stock-bestseller", "day-display"],
  "fashion-accessories": ["day-display-rotate", "day-stock-trend", "day-tag-price", "day-mirror", "day-ig-content"],
  "health-food-store": ["day-product-expiry", "day-temp-storage", "day-staff-knowledge", "day-allergen", "day-cert-display"],
  "unmanned-retail": ["day-cctv-record", "day-stock-restock", "day-payment-kiosk", "day-cleanliness", "day-anti-theft"],
  "rental-studio": ["day-prev-clean", "day-equipment", "day-booking", "day-noise", "day-fire-equip"],
  "party-room": ["day-prev-clean", "day-equipment", "day-noise", "day-amenity", "day-fire-equip"],
  "shared-office": ["day-internet", "day-meeting-room", "day-cleanliness", "day-coffee-snack", "day-access-control"],
  "practice-room": ["day-equipment", "day-soundproof", "day-cleanliness", "day-booking", "day-fire-equip"],
  "self-laundry": ["day-machine-test", "day-detergent", "day-cctv-record", "day-cleanliness", "day-payment"],
  "laundry-service": ["day-receive-list", "day-tag-system", "day-stain-record", "day-equipment", "day-pickup-route"],
  "cleaning-service": ["day-staff-schedule", "day-supply-stock", "day-customer-info", "day-photo-report", "day-emergency"],
  "repair-service": ["day-parts-stock", "day-tool-check", "day-quote-record", "day-warranty", "day-safety"],
  "print-copy": ["day-toner", "day-machine-test", "day-file-format", "day-package-stock", "day-payment"],
  "device-repair": ["day-parts-stock", "day-tool-precision", "day-data-backup", "day-warranty", "day-cctv"],
};

/** 카테고리별 피드백 항목 — 2개씩 */
export const PRE_LAUNCH_INDUSTRY_FEEDBACK_IDS: Record<string, string[]> = {
  food: ["feedback-taste", "feedback-menu"],
  "cafe-dessert": ["feedback-taste", "feedback-menu"],
  beauty: ["feedback-quality", "feedback-booking"],
  retail: ["feedback-product", "feedback-display"],
  fitness: ["feedback-facility", "feedback-instructor"],
  "online-digital": ["feedback-ux", "feedback-product"],
};

/** 모든 업종 공통 피드백 항목 — 3개 */
export const PRE_LAUNCH_UNIVERSAL_FEEDBACK_IDS: string[] = [
  "feedback-service", "feedback-price", "feedback-ambiance",
];

/** 그랜드 오픈 최종 체크리스트 — 4개 */
export const PRE_LAUNCH_FINAL_IDS: string[] = [
  "final-naver", "final-instagram", "final-kakao", "final-event",
];

/** 본오픈 준비 개선 항목 — 3개 */
export const PRE_LAUNCH_IMPROVEMENT_IDS: string[] = [
  "improve-core", "improve-service", "improve-staff",
];

// ─── 도우미 ─────────────────────────────────────────────────────────────────

export function getVisibleDayIds(
  industryCategoryId: string,
  selectedIndustryId?: string | null,
  startupType?: "franchise" | "independent" | "undecided" | null,
): string[] {
  const subIds = selectedIndustryId ? PRE_LAUNCH_SUB_INDUSTRY_DAY_IDS[selectedIndustryId] : undefined;
  const extraDay = subIds ?? PRE_LAUNCH_INDUSTRY_DAY_IDS[industryCategoryId] ?? [];
  const ownership =
    startupType === "franchise" ? PRE_LAUNCH_FRANCHISE_EXTRA_IDS
    : startupType === "independent" ? PRE_LAUNCH_INDEPENDENT_EXTRA_IDS
    : [];
  return [...extraDay, ...PRE_LAUNCH_UNIVERSAL_DAY_IDS, ...ownership];
}

export function getVisibleFeedbackIds(industryCategoryId: string): string[] {
  return [
    ...(PRE_LAUNCH_INDUSTRY_FEEDBACK_IDS[industryCategoryId] ?? []),
    ...PRE_LAUNCH_UNIVERSAL_FEEDBACK_IDS,
  ];
}

export function getVisibleFinalIds(): string[] {
  return [...PRE_LAUNCH_FINAL_IDS];
}

export function getVisibleImprovementIds(): string[] {
  return [...PRE_LAUNCH_IMPROVEMENT_IDS];
}
