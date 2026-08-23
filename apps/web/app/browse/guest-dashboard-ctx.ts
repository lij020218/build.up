"use client";

/**
 * 게스트(둘러보기) DashboardContext 값 — /browse 전용.
 *
 * iOS 심사 5.1.1(v) 게스트 모드의 웹 미러. 게스트가 렌더하는 surface
 * (FranchiseView·TaxSurface)는 아래 GuestCtxFields 만 읽는다는 계약이며,
 * 이 계약은 __tests__/guest-browse.test.tsx 가드 테스트가 실렌더로 검증한다.
 *
 * ⚠️ 캐스트 주의: DashboardContextValue 전체(useDashboard 반환 + 로컬 state)를
 *   게스트에서 만들 수 없어 부분 객체를 캐스트한다. 게스트 화면에 새 surface 를
 *   추가하면 그 surface 가 읽는 필드를 여기에 추가하고 가드 테스트에 렌더를 추가할 것.
 *   (읽기 전용 — setter·persistence·Supabase 는 게스트에 존재하지 않는다.)
 */

import type { Language } from "@foundone/shared";
import type { DashboardContextValue } from "../lib/contexts/DashboardContext";

/** 게스트 surface 들이 실제로 읽는 필드 — 타입은 본 컨텍스트와 동일하게 Pick 으로 강제. */
type GuestCtxFields = Pick<
  DashboardContextValue,
  "language" | "industryCategoryId" | "selectedIndustryId" | "dailyEntries" | "employees"
>;

export function makeGuestDashboardCtx(language: Language): DashboardContextValue {
  const guest: GuestCtxFields = {
    language,
    industryCategoryId: "", // 게스트 = 업종 미설정 (falsy → 개인화 없음)
    selectedIndustryId: undefined,
    dailyEntries: [], // 매출 기록 없음 — TaxSurface 는 가입 안내 행 표시(가짜 숫자 금지)
    employees: [],
  };
  // 게스트 화면은 위 필드만 접근한다(가드 테스트 검증) — 전체 값 캐스트.
  return guest as unknown as DashboardContextValue;
}
