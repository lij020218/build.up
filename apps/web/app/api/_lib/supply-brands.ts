/**
 * 대표 공급 브랜드 SSOT (2026-08-04, 사장님 지시 — "치킨이면 하림, 돼지고기면 한돈").
 *
 *  B2B 에는 소비자 평점이 없다 — 대신 검증 가능한 신호(시장 점유율·인증제도·대표 브랜드
 *  지위)로 "시장 검증" 추천을 만든다. 원칙:
 *   · 실명·수치·출처 없으면 등재하지 않는다 (마케팅 콘텐츠 3원칙과 동일)
 *   · 근거(basis)와 출처(sourceUrl)를 항목마다 붙여 UI 가 그대로 보여준다
 *   · 근거가 약한 세부업종은 비운다 (억지 매칭 = 위조)
 *   · 프랜차이즈 창업자에게는 부착하지 않는다 (본사 물류 강제) — 라우트 게이트
 *
 *  팩트 검증일: 2026-08-04 (웹 실측 조사). 수치 갱신 주기: 연 1회 권장.
 */

export type SupplyBrand = {
  name: string;
  /** 검증 가능한 근거 한 줄 — "2024 도축실적 점유율 1위(20.4%)" */
  note: string;
  /** 공식/B2B 채널 — 공식 도메인만 (프랜차이즈 URL 원칙 동일) */
  url?: string;
};

export type SupplyBrandGroup = {
  /** 카드 라벨 — "닭고기", "돼지고기(한돈)" */
  category: string;
  brands: SupplyBrand[];
  /** 추천 기준 설명 — 평점이 아님을 명시하는 문장 */
  basis: string;
  /** 근거 출처 (기사·공식 페이지) */
  sourceUrl: string;
};

// 재사용 그룹 — 여러 세부업종이 공유
const CHICKEN: SupplyBrandGroup = {
  category: "닭고기",
  brands: [
    { name: "하림", note: "2024 도축실적 점유율 1위 (20.4%)", url: "https://www.harim.com" },
    { name: "마니커", note: "점유율 2위 (9.1%)", url: "https://www.maniker.co.kr" },
    { name: "올품", note: "점유율 3위 (8.7%)" },
  ],
  basis: "2024년 도축 실적 기준 시장 점유율 상위 — 평점이 아닌 시장 검증 지표예요.",
  sourceUrl: "https://www.newsis.com/view/NISX20250318_0003103599",
};

const PORK_HANDON: SupplyBrandGroup = {
  category: "돼지고기 (한돈)",
  brands: [
    { name: "도드람한돈", note: "양돈협동조합 계열화 — 식당용 B2B몰(도드람비즈) 직영", url: "https://www.dodrambiz.com" },
    { name: "선진포크한돈", note: "국내 최초 돈육 브랜드 · 스마트 HACCP · 우수 축산물브랜드 18년 연속", url: "https://www.sj.co.kr" },
    { name: "하이포크", note: "팜스코 계열 한돈 브랜드 — 대형마트·식당 납품", url: "https://www.farmsco.com" },
  ],
  basis: "국산 '한돈' 인증 대표 브랜드 — 계열화·HACCP 등 공적 인증 기준이에요.",
  sourceUrl: "http://www.pignpork.com/news/articleView.html?idxno=1252",
};

const FLOUR: SupplyBrandGroup = {
  category: "밀가루·제분",
  brands: [
    { name: "대한제분 (곰표)", note: "제과·제빵 특화 제분 — 상위 3사", url: "https://www.dhflour.co.kr" },
    { name: "CJ제일제당 (백설)", note: "가정용 점유율 1위 브랜드", url: "https://www.cj.co.kr" },
    { name: "사조동아원", note: "B2B 납품 비중 최상위 제분사", url: "https://www.sajodongaone.com" },
  ],
  basis: "국내 제분 상위 3사(시장 70%+ 과점) — 평점이 아닌 시장 지위 기준이에요.",
  sourceUrl: "https://www.thepublic.kr/news/articleView.html?idxno=305095",
};

const COFFEE_ROASTERS: SupplyBrandGroup = {
  category: "원두 (로스터리 B2B)",
  brands: [
    { name: "테라로사", note: "스페셜티 대표 로스터리 — B2B 도매·교육 지원", url: "https://terarosa.com" },
    { name: "프릳츠", note: "스페셜티 로스터리 — 카페 납품·블렌드 컨설팅", url: "https://fritz.co.kr" },
    { name: "커피리브레", note: "스페셜티 1세대 로스터리 — 원두 도매", url: "https://coffeelibre.kr" },
  ],
  basis: "국내 스페셜티 대표 로스터리 B2B — 인지도·업력 기준 큐레이션이에요 (점유율 통계 부재).",
  sourceUrl: "https://terarosa.com",
};

/** subIndustryId → 브랜드 그룹. 근거 없는 업종은 등재하지 않는다 (빈 결과가 정직). */
const BY_SUB_INDUSTRY: Record<string, SupplyBrandGroup[]> = {
  "chicken-burger": [CHICKEN],
  "korean-casual": [PORK_HANDON, CHICKEN],
  "delivery-meals": [PORK_HANDON, CHICKEN],
  "ramen-noodle": [FLOUR, PORK_HANDON],
  "bakery-studio": [FLOUR],
  "specialty-coffee": [COFFEE_ROASTERS],
  "takeout-coffee": [COFFEE_ROASTERS],
  "self-serve-cafe": [COFFEE_ROASTERS],
  "dessert-cafe": [COFFEE_ROASTERS, FLOUR],
  "icecream-bingsu": [],
  "western-pasta-brunch": [FLOUR],
};

export function getSupplyBrands(subIndustryId: string | null | undefined): SupplyBrandGroup[] {
  if (!subIndustryId) return [];
  return BY_SUB_INDUSTRY[subIndustryId] ?? [];
}
