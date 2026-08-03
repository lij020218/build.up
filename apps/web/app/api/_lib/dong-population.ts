/**
 * dong-population.ts — 배후 주거인구 조회 (행안부 주민등록, 전국 읍면동)
 *
 * 데이터: dong-population.json (월간 배치 — scripts/import-mois-dong-population.mts)
 *  ⚠️ 서버 전용. shared index 로 export 금지 (456KB — 클라이언트 번들 오염).
 *  iOS 는 market-recommend 응답 meta 로 값만 받는다.
 *
 * 정직성 라벨 (호출처가 반드시 함께 표기):
 *  · 주민등록 = **거주** 인구다. 유동인구가 아니다 — "배후 주거인구" 로만 부른다.
 *  · 행정동 합산 근사 (망원제1+2동 → 망원동). adminDongCount 로 합산 여부 노출.
 *  · 동명이인 동(전국 신정동 여럿)은 시도·시군구로 못 가르면 null — 남의 동네 인구 부착 금지.
 */
import { extractSido } from "@foundone/shared";
import raw from "./dong-population.json";

type DongRow = {
  sido: string; sigungu: string; dong: string; ym: string;
  total: number;
  bands: [number, number, number, number, number, number];   // 10대/20대/30대/40대/50대/60+
  adminDongCount: number;
};

const data = raw as unknown as { _ym: string; dongs: DongRow[] };   // bands 튜플은 JSON 추론상 number[] — 구조 검증은 임포터 sanity 가 담당

export const DONG_POP_YM: string = data._ym;   // "202606"
export const DONG_POP_YM_LABEL = `${data._ym.slice(0, 4)}.${data._ym.slice(4)}`;

/** 시도 정식명 prefix 매칭용 (extractSido 는 축약 canonical 반환: "대전"·"서울"…) */
function sidoMatches(rowSido: string, canonical: string): boolean {
  return rowSido.startsWith(canonical) || rowSido.includes(canonical);
}

function normalizeDongName(name: string): string {
  return name.replace(/제?\d+동$/, "동").replace(/\s+/g, "").trim();
}

export type DongPopulation = {
  sido: string; sigungu: string; dong: string;
  total: number;
  /** 20~30대 비중 % (반올림 정수) — 창업 타깃 판단의 핵심 축 */
  age2030Pct: number;
  age40PlusPct: number;
  adminDongCount: number;
};

/**
 * 지역 텍스트 + 동명 → 배후 주거인구. 애매하면 null (과잉 매칭 금지).
 */
export function findDongPopulation(regionText: string, districtName: string): DongPopulation | null {
  const dongKey = normalizeDongName(districtName);
  if (dongKey.length < 2) return null;

  let pool = data.dongs.filter((d) => d.dong === dongKey);
  if (pool.length === 0) return null;

  // ① 시도 게이트
  const sido = extractSido(regionText);
  if (sido) pool = pool.filter((d) => sidoMatches(d.sido, sido));
  // ② 시군구 게이트 — 지역 텍스트에 시군구명이 들어있으면 좁힌다 ("마포구 망원동")
  if (pool.length > 1) {
    const narrowed = pool.filter((d) => d.sigungu && regionText.replace(/\s+/g, "").includes(d.sigungu.replace(/\s+/g, "")));
    if (narrowed.length > 0) pool = narrowed;
  }
  if (pool.length !== 1) return null;   // 여전히 애매 = 단정하지 않는다

  const d = pool[0]!;
  if (d.total <= 0) return null;
  const a2030 = d.bands[1] + d.bands[2];
  const a40p = d.bands[3] + d.bands[4] + d.bands[5];
  return {
    sido: d.sido, sigungu: d.sigungu, dong: d.dong,
    total: d.total,
    age2030Pct: Math.round((a2030 / d.total) * 100),
    age40PlusPct: Math.round((a40p / d.total) * 100),
    adminDongCount: d.adminDongCount,
  };
}

/** 사람 문장 — 출처·기준월·거주 라벨 강제 동봉 */
export function formatDongPopulationLine(p: DongPopulation): string {
  const scope = p.adminDongCount > 1 ? ` (행정동 ${p.adminDongCount}개 합산)` : "";
  return `${p.dong} 배후 주거인구 ${p.total.toLocaleString()}명${scope} · 20~30대 ${p.age2030Pct}% — 주민등록 ${DONG_POP_YM_LABEL} 기준(거주 인구, 유동 아님)`;
}
