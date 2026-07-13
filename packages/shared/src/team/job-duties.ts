/**
 * 직원 직무·고용형태 SSOT (2026-07-13)
 *
 *  사장이 직원에게 ① 고용형태(단기 알바/정직원/계약직) ② 업무 직무(홀서빙·경리·
 *  마케팅 등, 업종별)를 부여한다. 직무는 복수 선택. 저장 후 사장·직원 양쪽에 표시.
 *
 *  업종(categoryId)은 starter-data.OFFLINE_CATEGORY_IDS + online-digital/startup-tech.
 *  category-specific 직무 먼저, 그 뒤 공통 직무(경리·마케팅 등)를 key 중복 없이 병합.
 *
 *  이 파일이 SSOT — iOS 는 scripts/gen-job-duties-swift.mts 로 자동 생성(드리프트 0).
 */

export type JobDuty = { key: string; ko: string; en: string };
export type EmploymentType = { key: string; ko: string; en: string };

// 고용형태 — 사장 확정(2026-07-13: 단기알바/정직원/계약직 3종)
export const EMPLOYMENT_TYPES: EmploymentType[] = [
  { key: "part_time", ko: "단기 알바", en: "Part-time" },
  { key: "full_time", ko: "정직원", en: "Full-time" },
  { key: "contract", ko: "계약직", en: "Contract" },
];

// 어느 업종에나 존재하는 백오피스·공통 직무
export const COMMON_DUTIES: JobDuty[] = [
  { key: "manager", ko: "매니저/점장", en: "Manager" },
  { key: "accounting", ko: "경리/회계", en: "Accounting" },
  { key: "marketing", ko: "마케팅/홍보", en: "Marketing" },
  { key: "hr_admin", ko: "인사/총무", en: "HR / Admin" },
  { key: "cs", ko: "고객응대/CS", en: "Customer service" },
];

// 업종별 현장 직무 (category-specific)
export const DUTIES_BY_CATEGORY: Record<string, JobDuty[]> = {
  food: [
    { key: "hall", ko: "홀 서빙", en: "Hall service" },
    { key: "kitchen", ko: "주방/조리", en: "Kitchen" },
    { key: "prep_dish", ko: "설거지/주방보조", en: "Prep / dishwashing" },
    { key: "counter", ko: "카운터/포스", en: "Counter / POS" },
    { key: "delivery", ko: "배달", en: "Delivery" },
    { key: "cleaning", ko: "청소/마감", en: "Cleaning / closing" },
  ],
  "cafe-dessert": [
    { key: "barista", ko: "바리스타", en: "Barista" },
    { key: "baker", ko: "베이커/제과", en: "Baker" },
    { key: "hall", ko: "홀 서빙", en: "Hall service" },
    { key: "counter", ko: "카운터/포스", en: "Counter / POS" },
    { key: "cleaning", ko: "청소/마감", en: "Cleaning / closing" },
  ],
  retail: [
    { key: "sales", ko: "판매/응대", en: "Sales" },
    { key: "cashier", ko: "계산/포스", en: "Cashier / POS" },
    { key: "stock", ko: "재고관리", en: "Inventory" },
    { key: "display", ko: "진열/디스플레이", en: "Display / merchandising" },
    { key: "shipping", ko: "배송/택배", en: "Shipping" },
  ],
  beauty: [
    { key: "designer", ko: "디자이너/원장", en: "Designer" },
    { key: "assistant", ko: "스태프/인턴", en: "Assistant / intern" },
    { key: "reception", ko: "리셉션/예약", en: "Reception / booking" },
    { key: "nail_lash", ko: "네일/속눈썹", en: "Nail / lash" },
    { key: "cleaning", ko: "청소/소독", en: "Cleaning / sanitizing" },
  ],
  fitness: [
    { key: "trainer", ko: "트레이너/PT", en: "Trainer / PT" },
    { key: "front_desk", ko: "프론트/데스크", en: "Front desk" },
    { key: "group_class", ko: "그룹 수업", en: "Group class" },
    { key: "membership", ko: "회원 관리", en: "Membership" },
    { key: "maintenance", ko: "청소/시설관리", en: "Cleaning / facility" },
  ],
  education: [
    { key: "instructor", ko: "강사", en: "Instructor" },
    { key: "counsel_desk", ko: "상담/데스크", en: "Counsel / desk" },
    { key: "assistant", ko: "조교/보조", en: "Teaching assistant" },
    { key: "shuttle", ko: "차량 운행", en: "Shuttle driver" },
    { key: "material", ko: "교재/자료 관리", en: "Materials" },
  ],
  pet: [
    { key: "groomer", ko: "미용사/그루머", en: "Groomer" },
    { key: "vet_tech", ko: "수의 보조/테크", en: "Vet tech" },
    { key: "care_hotel", ko: "돌봄/호텔링", en: "Care / hotel" },
    { key: "reception", ko: "리셉션/예약", en: "Reception / booking" },
    { key: "sales", ko: "용품 판매", en: "Supplies sales" },
  ],
  "living-service": [
    { key: "worker", ko: "기사/작업자", en: "Technician / worker" },
    { key: "reception", ko: "접수/상담", en: "Reception / intake" },
    { key: "pickup", ko: "수거/배송", en: "Pickup / delivery" },
    { key: "maintenance", ko: "관리/청소", en: "Maintenance / cleaning" },
  ],
  space: [
    { key: "maintenance", ko: "관리/청소", en: "Maintenance / cleaning" },
    { key: "booking", ko: "예약/응대", en: "Booking / desk" },
    { key: "facility", ko: "시설 점검", en: "Facility check" },
  ],
  "online-digital": [
    { key: "cs", ko: "CS/문의 응대", en: "Customer service" },
    { key: "md", ko: "상품등록/MD", en: "Merchandising / MD" },
    { key: "fulfillment", ko: "포장/출고", en: "Packing / fulfillment" },
    { key: "content", ko: "콘텐츠/촬영", en: "Content / studio" },
    { key: "dev_ops", ko: "개발/운영", en: "Dev / ops" },
  ],
  "startup-tech": [
    { key: "dev", ko: "개발", en: "Engineering" },
    { key: "design", ko: "디자인", en: "Design" },
    { key: "pm", ko: "기획/PM", en: "Product / PM" },
    { key: "sales_bd", ko: "영업/BD", en: "Sales / BD" },
    { key: "growth", ko: "마케팅/그로스", en: "Growth" },
    { key: "ops", ko: "운영/CS", en: "Operations / CS" },
  ],
};

/** 업종에 맞는 직무 목록 — category-specific 먼저, 공통 직무를 key 중복 없이 뒤에 병합. */
export function getJobDuties(categoryId: string | null | undefined): JobDuty[] {
  const specific = (categoryId && DUTIES_BY_CATEGORY[categoryId]) || [];
  const seen = new Set(specific.map((d) => d.key));
  return [...specific, ...COMMON_DUTIES.filter((d) => !seen.has(d.key))];
}

// 저장된 key → 라벨 해석용 (전 업종 직무 flat map, 같은 key는 첫 정의 우선)
const ALL_DUTIES: Record<string, JobDuty> = (() => {
  const map: Record<string, JobDuty> = {};
  for (const d of [...COMMON_DUTIES, ...Object.values(DUTIES_BY_CATEGORY).flat()]) {
    if (!map[d.key]) map[d.key] = d;
  }
  return map;
})();

export function jobDutyLabel(key: string, ko: boolean): string {
  const d = ALL_DUTIES[key];
  return d ? (ko ? d.ko : d.en) : key;
}

export function employmentTypeLabel(key: string | null | undefined, ko: boolean): string | null {
  if (!key) return null;
  const t = EMPLOYMENT_TYPES.find((e) => e.key === key);
  return t ? (ko ? t.ko : t.en) : null;
}
