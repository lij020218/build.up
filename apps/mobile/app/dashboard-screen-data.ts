/**
 * dashboard-screen-data.ts
 *
 * 2026-05-27 Phase 2 — 모바일 dashboard-screen.tsx 모듈화.
 *
 * 분리 목적:
 *   - dashboard-screen.tsx (5800+줄) 의 가독성·유지보수성 개선
 *   - 순수 데이터/타입 레이어를 별도로 보관 (closure 의존성 없음)
 *
 * 이 파일에 포함:
 *   1) Mobile 전용 타입 정의 (Mobile* prefix)
 *   2) 기본값 상수 (emptyMobileMonthlyCosts)
 *   3) UserStoreData → Mobile* 변환 함수 (toMobile* + isRecord)
 *   4) Phase 1 KNOWN_STORE_FIELDS 상수
 *
 * 의도적으로 분리되지 않은 것:
 *   - 마케팅 채널 상수 (대량 i18n 문자열 — 별도 파일로 분리 검토)
 *   - JSX 컴포넌트 (closure 의존성 다수)
 *   - 핸들러 함수 (state setter 의존성)
 */

import type { UserStoreData } from "@build-up/shared";

// ────────────────────────────────────────────────────────────────────────
// 1) Types
// ────────────────────────────────────────────────────────────────────────

export type MobileDailyEntry = {
  date: string;
  sales: number;
  customers: number;
};

export type MobileMonthlyCosts = UserStoreData["monthlyCosts"];

export type MobileProduct = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
};

export type MobileInventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
};

export type MobileEmployee = {
  id: string;
  name: string;
  hourlyWage: number;
  weeklyHours: number;
  isInsured: boolean;
};

// ─── 구독/회원권 관리 (웹 operations-store.ts 와 동일 필드) ──────────────────
export type MobileSubscriptionPlan = {
  id: string;
  name: string;
  price: number;                       // 월 가격 (원)
  billingCycle: "monthly" | "annual";
  isActive: boolean;
};

export type MobileSubscriber = {
  id: string;
  name: string;
  planId: string;
  status: "active" | "churned" | "trial";
  joinedAt: string;                    // ISO date (YYYY-MM-DD)
};

// ────────────────────────────────────────────────────────────────────────
// 2) Defaults
// ────────────────────────────────────────────────────────────────────────

export const emptyMobileMonthlyCosts: MobileMonthlyCosts = {
  ingredients: 0,
  labor: 0,
  rent: 0,
  utilities: 0,
  sga: 0,
  marketing: 0,
  other: 0,
  interest: 0,
};

// ────────────────────────────────────────────────────────────────────────
// 3) Converters (UserStoreData → Mobile*)
// ────────────────────────────────────────────────────────────────────────

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function toMobileDailyEntries(value: unknown[] | undefined): MobileDailyEntry[] {
  return (value ?? [])
    .filter(isRecord)
    .map((entry) => ({
      date: typeof entry.date === "string" ? entry.date : new Date().toISOString().slice(0, 10),
      sales: typeof entry.sales === "number" ? entry.sales : 0,
      customers: typeof entry.customers === "number" ? entry.customers : 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function toMobileProducts(value: unknown[] | undefined): MobileProduct[] {
  return (value ?? [])
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : `prod-${Date.now()}`,
      name: typeof item.name === "string" ? item.name : "",
      price: typeof item.price === "number" ? item.price : 0,
      cost: typeof item.cost === "number" ? item.cost : 0,
      stock: typeof item.stock === "number" ? item.stock : 0,
    }))
    .filter((item) => item.name);
}

export function toMobileInventoryItems(value: unknown[] | undefined): MobileInventoryItem[] {
  return (value ?? [])
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : `inv-${Date.now()}`,
      name: typeof item.name === "string" ? item.name : "",
      quantity: typeof item.quantity === "number" ? item.quantity : 0,
      unit: typeof item.unit === "string" ? item.unit : "개",
      minThreshold: typeof item.minThreshold === "number" ? item.minThreshold : 0,
    }))
    .filter((item) => item.name);
}

export function toMobileEmployees(value: unknown[] | undefined): MobileEmployee[] {
  return (value ?? [])
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : `emp-${Date.now()}`,
      name: typeof item.name === "string" ? item.name : "",
      hourlyWage: typeof item.hourlyWage === "number" ? item.hourlyWage : 0,
      weeklyHours: typeof item.weeklyHours === "number" ? item.weeklyHours : 0,
      isInsured: typeof item.isInsured === "boolean" ? item.isInsured : false,
    }))
    .filter((item) => item.name);
}

export function toMobileSubscriptionPlans(value: unknown[] | undefined): MobileSubscriptionPlan[] {
  return (value ?? [])
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : `plan-${Date.now()}`,
      name: typeof item.name === "string" ? item.name : "",
      price: typeof item.price === "number" ? item.price : 0,
      billingCycle: (item.billingCycle === "annual" ? "annual" : "monthly") as "monthly" | "annual",
      isActive: item.isActive !== false,
    }))
    .filter((item) => item.name);
}

export function toMobileSubscribers(value: unknown[] | undefined): MobileSubscriber[] {
  return (value ?? [])
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : `sub-${Date.now()}`,
      name: typeof item.name === "string" ? item.name : "",
      planId: typeof item.planId === "string" ? item.planId : "",
      status: (["active", "churned", "trial"] as const).includes(item.status as never)
        ? (item.status as MobileSubscriber["status"])
        : "active",
      joinedAt: typeof item.joinedAt === "string" ? item.joinedAt : "",
    }))
    .filter((item) => item.planId);
}

// ────────────────────────────────────────────────────────────────────────
// 4) Phase 1 SSOT — explicit state 로 관리되는 필드 화이트리스트
// ────────────────────────────────────────────────────────────────────────

/**
 * 2026-05-27 패리티 (Phase 1): UI 가 있어 explicit state 로 관리되는 UserStoreData 필드 목록.
 *   이 목록 외 필드는 extraStoreData 로 passthrough 동기화 → 다른 기기에서 입력한 데이터 보존.
 *   UI 추가 시 (Phase 3+) 이 목록에 추가하고 explicit state 사용.
 */
export const KNOWN_STORE_FIELDS = new Set<keyof UserStoreData>([
  "storeName",
  "businessLaunched",
  "businessLaunchedDate",
  "dailyEntries",
  "monthlyCosts",
  "products",
  "inventoryItems",
  "employees",
  "usesSubscriptions",
  "subscriptionPlans",
  "subscribers",
  "aiRoadmapResult",
]);
