/**
 * franchise-regional.ts — 브랜드 시도별 분포 조회 (공정위 신형 가족 단일 SSOT)
 *
 * 데이터: franchise-regional.json (연 1회 배치 — scripts/build-franchise-regional.mts)
 *  목록(15125467) + 지역별(15125490) 한 가족 → 내부 정합 보장 (전국수 = 시도합).
 *
 * ⚠️ 혼동 금지 원칙 (사장님 결정 2026-08-03): 여기의 전국수·시도수는 정보공개서 기준이라
 *  구형 15110241 기반 수치(franchise-brands.json officialStats.storeCount)와 다를 수 있다.
 *  **같은 화면에 두 계보의 절대값을 병기하지 말 것.** 표기 시 기준년도 라벨 필수.
 *  서버 전용 — shared index export 금지.
 */
import { extractSido } from "@foundone/shared";
import raw from "./franchise-regional.json";

type RegionalFile = {
  _yr: string;
  brands: Record<string, { mnno: string; total: number; areas: Record<string, number>; acntgYr?: string }>;
};

const data = raw as unknown as RegionalFile;

export const FRANCHISE_REGIONAL_YR: string = data._yr;

export type BrandRegional = {
  /** 지역 텍스트에서 갈라낸 시도명 (공정위 areaNm 축약형: "대전"·"서울"…) */
  sidoName: string;
  /** 가맹+직영 합계 (allFrcsDmsCnt) — 상권 내 "매장 수" 로서 정직한 값 */
  sidoCount: number;
  nationalTotal: number;
  /** 브랜드별 회계연도 (acntgYr) — jngBizCrtraYr(등록기준)가 아니라 이것이 실제 데이터 연도 */
  yr: string;
};

/**
 * 브랜드의 해당 시도 분포. 시도를 못 갈라내면 null (전국수만 단독 표기 금지 —
 * 상권 맥락에서 전국수는 지역수와 함께여야 의미가 있다).
 */
export function findBrandRegional(brandId: string, regionText: string): BrandRegional | null {
  const b = data.brands[brandId];
  if (!b || b.total <= 0) return null;
  const sido = extractSido(regionText);
  if (!sido) return null;
  const yr = b.acntgYr && b.acntgYr !== "mixed" ? b.acntgYr : null;
  if (!yr) return null;                // 연도 불명·혼재 = 라벨 못 다는 수치 → 표시 포기 (위조 금지)
  return {
    sidoName: sido,
    sidoCount: b.areas[sido] ?? 0,     // 그 시도에 0개 = 실측 0 (진입 여지 신호) — null 아님
    nationalTotal: b.total,
    yr,
  };
}

/** 사람 문장 — 기준·가족 단일성 라벨 동봉 */
export function formatBrandRegionalLine(brandNameKo: string, r: BrandRegional): string {
  return `${brandNameKo} ${r.sidoName} ${r.sidoCount.toLocaleString()}개 · 전국 ${r.nationalTotal.toLocaleString()}개 (가맹+직영) — 공정위 정보공개서 ${r.yr}년 기준`;
}
