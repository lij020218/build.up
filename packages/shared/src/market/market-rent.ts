/**
 * market-rent.ts — 상권 임대료 조회 SSOT (한국부동산원 임대동향조사, 국가승인통계)
 *
 * 데이터: rone-market-rent.json (분기 배치 — scripts/import-rone-market-rent.mts 재실행으로 갱신)
 * 커버리지: 전국 ~372개 조사 상권. **조사 상권 밖 지역은 결과 없음** — 그게 정직한 동작이다.
 *   폴백으로 시도 평균을 지어내거나 "인근" 상권을 임의 확장하지 않는다 (가짜숫자 0 원칙).
 *
 * 정직성 라벨 (UI·프롬프트가 반드시 함께 표기할 것):
 *  - 임대료는 "이 상권의 시세 수준"(1층 기준 ㎡당 월세 환산 평균)이지 "내 점포 월세"가 아니다.
 *  - 보증금·권리금은 이 조사에 없다.
 *  - 기준 분기(quarterLabel)를 항상 병기한다.
 *
 * ⚠️ iOS 미러: 이 파일을 수정하면 iOS 코드젠(잔여 과제)도 함께. 웹 단독 배포 금지.
 */
import raw from "./rone-market-rent.json";

export type BuildingType = "small" | "medium" | "aggregate";

export type MarketRentDistrict = {
  fullName: string;                                        // "대전>둔산"
  sido: string;
  district: string;
  rentThousandWonPerM2: Partial<Record<BuildingType, number>>;
  vacancyPct: Partial<Record<BuildingType, number>>;
};

type RentFile = {
  _quarter: string;
  _quarterLabel: string;
  _source: string;
  districts: MarketRentDistrict[];
};

const data = raw as RentFile;

export const MARKET_RENT_QUARTER: string = data._quarter;           // "202602"
export const MARKET_RENT_QUARTER_LABEL: string = data._quarterLabel; // "2026년 2분기"
export const MARKET_RENT_SOURCE = "한국부동산원 상업용부동산 임대동향조사";

export const BUILDING_TYPE_LABEL: Record<BuildingType, string> = {
  small: "소규모 상가",     // 2층 이하·연면적 330㎡ 이하
  medium: "중대형 상가",    // 3층 이상 또는 연면적 330㎡ 초과
  aggregate: "집합 상가",   // 집합건축물 (구분소유 상가)
};

/** 시도 동의어 — 사용자가 "대전 둔산동"처럼 쓰는 축약형 대응 */
const SIDO_ALIASES: Record<string, string[]> = {
  서울: ["서울", "서울시", "서울특별시"],
  부산: ["부산", "부산시", "부산광역시"],
  대구: ["대구", "대구시", "대구광역시"],
  인천: ["인천", "인천시", "인천광역시"],
  광주: ["광주", "광주시", "광주광역시"],
  대전: ["대전", "대전시", "대전광역시"],
  울산: ["울산", "울산시", "울산광역시"],
  세종: ["세종", "세종시", "세종특별자치시"],
  경기: ["경기", "경기도"],
  강원: ["강원", "강원도", "강원특별자치도"],
  충북: ["충북", "충청북도"],
  충남: ["충남", "충청남도"],
  전북: ["전북", "전라북도", "전북특별자치도"],
  전남: ["전남", "전라남도"],
  경북: ["경북", "경상북도"],
  경남: ["경남", "경상남도"],
  제주: ["제주", "제주도", "제주특별자치도"],
};

function normalize(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

/** 질의 텍스트에서 시도 추출 ("대전 둔산동" → "대전"). 없으면 null */
export function extractSido(query: string): string | null {
  const q = normalize(query);
  for (const [canonical, aliases] of Object.entries(SIDO_ALIASES)) {
    if (aliases.some((a) => q.includes(normalize(a)))) return canonical;
  }
  return null;
}

export type MarketRentMatch = {
  entry: MarketRentDistrict;
  /** 상권명이 질의에 그대로 들어있으면 high ("둔산동" ⊃ "둔산"), 반대 포함이면 partial */
  confidence: "high" | "partial";
};

/**
 * 지역 텍스트로 조사 상권 검색.
 *  매칭 규칙 (과잉 매칭 = 남의 상권 시세를 내 후보지에 붙이는 위조 → 보수적으로):
 *   1) 질의에 시도가 있으면 그 시도 상권만 후보 (동명 상권 오매칭 차단)
 *   2) high: 질의가 상권명을 통째로 포함 ("대전 둔산동" ⊃ "둔산")
 *   3) partial: 상권명이 질의 토큰을 포함 (2글자+ 토큰만 — "동"·"시" 같은 조각 금지)
 *  결과 없음 = 조사 상권 밖. 호출측은 임대료 축을 표시하지 않는다.
 */
export function findMarketRentDistricts(query: string, limit = 3): MarketRentMatch[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const sido = extractSido(query);
  const pool = sido ? data.districts.filter((d) => d.sido === sido) : data.districts;

  const high: MarketRentMatch[] = [];
  const partial: MarketRentMatch[] = [];
  // 시도 토큰 제거한 나머지로 partial 판정 ("대전"이 상권명과 매칭되는 것 방지)
  const qBody = sido
    ? SIDO_ALIASES[sido]!.reduce((acc, a) => acc.replace(normalize(a), ""), q)
    : q;

  for (const d of pool) {
    const name = normalize(d.district);
    if (name.length >= 2 && q.includes(name)) {
      high.push({ entry: d, confidence: "high" });
    } else if (qBody.length >= 2 && name.includes(qBody)) {
      partial.push({ entry: d, confidence: "partial" });
    }
  }
  // 긴 상권명 우선 ("영등포신촌" vs "신촌" 동시 매칭 시 더 구체적인 쪽부터)
  high.sort((a, b) => b.entry.district.length - a.entry.district.length);
  return [...high, ...partial].slice(0, limit);
}

/** 대표 임대료 하나 고르기 — 소규모 우선(자영업 점포에 가장 근접), 없으면 중대형 → 집합 */
export function representativeRent(
  d: MarketRentDistrict,
): { bldg: BuildingType; thousandWonPerM2: number } | null {
  for (const bldg of ["small", "medium", "aggregate"] as const) {
    const v = d.rentThousandWonPerM2[bldg];
    if (typeof v === "number" && v > 0) return { bldg, thousandWonPerM2: v };
  }
  return null;
}

/**
 * 사람 문장 — 실측값 + 출처 + 기준시점 + 한계를 한 줄에.
 *  예: "둔산 상권 소규모 상가 ㎡당 월 1.9만원(평당 약 6.2만원) — 한국부동산원 2026년 2분기.
 *       1층 기준 시세 수준이며 보증금·권리금 미포함"
 */
export function formatRentLine(d: MarketRentDistrict): string | null {
  const rep = representativeRent(d);
  if (!rep) return null;
  const wonPerM2 = rep.thousandWonPerM2 * 1_000;
  const wonPerPyeong = wonPerM2 * 3.3058;
  const m2Man = (wonPerM2 / 10_000).toFixed(1);
  const pyeongMan = (wonPerPyeong / 10_000).toFixed(1);
  return (
    `${d.district} 상권 ${BUILDING_TYPE_LABEL[rep.bldg]} ㎡당 월 ${m2Man}만원(평당 약 ${pyeongMan}만원)` +
    ` — ${MARKET_RENT_SOURCE} ${MARKET_RENT_QUARTER_LABEL}. 1층 기준 시세 수준이며 보증금·권리금 미포함`
  );
}

/** 전체 상권 수 — 가드 테스트·화면 커버리지 안내용 */
export function marketRentDistrictCount(): number {
  return data.districts.length;
}
