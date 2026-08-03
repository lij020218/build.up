/**
 * market-scoring.ts — 상권 후보 결정론 점수 엔진 (measured-v1, 2026-08-03)
 *
 * 원칙 (사장님 결정): **점수 = 실측 결정론, LLM = 해설만.**
 *  기존 SCORING_SYSTEM_PROMPT 의 밴드를 그대로 코드로 이식했다 (점수 분포 급변 최소화).
 *  실측 없는 축은 delta 0 (결측 = 중립 — 위조 금지). 모든 가감점은 evidence(수치+출처) 동봉.
 *
 * 서버 전용 — 입력 타입이 서버 _lib(sbiz-store 등) 소유라 shared 로 올리지 않는다.
 *  내장 118개 상권의 정성 점수(packages/shared/src/market/scoring.ts)와는 별개 엔진이며
 *  meta.scoreEngine("measured-v1" | "curated") 라벨로 출처를 구분한다.
 */

export type AxisDelta = {
  axis: "competition" | "foot" | "access" | "anchor" | "franchise" | "vacancy" | "population" | "compound";
  delta: number;
  /** false = 실측 없음 → delta 는 반드시 0 */
  measured: boolean;
  /** 수치+출처 강제 — "공식 24개 (소진공, 500m)" */
  evidence: string;
};

export type DeterministicScore = {
  score: number;          // 0~100 clamp
  base: number;           // 60
  axes: AxisDelta[];
  /** 서버가 warnings 선두에 강제 병합 — LLM 이 지울 수 없다 */
  mandatoryWarnings: string[];
  /** 사용자 노출용 한 줄 — "기준 60 · 경쟁 +10(공식 24개) · 프랜차이즈 -15" */
  breakdown: string;
};

export type ScoreInput = {
  /** 소진공 공식 동종 수 (null/undefined = 실측 없음 → 지도 폴백) */
  officialSameCount?: number | null;
  /** 카카오 지도 동종 수 (공식 실측 없을 때만 사용) */
  competitionCount?: number;
  cafeCount?: number;
  subwayCount?: number;
  cultureCount?: number;
  franchise?: { sameBrand: number; peers: Array<{ name: string; count: number }> } | null;
  /** 부동산원 실측 공실률 (실측 매칭 시만) */
  vacancyPct?: number | null;
  /** 행안부 동 매칭 시만 */
  population?: { age2030Pct: number; age40PlusPct: number } | null;
  categoryId: string;
  subIndustryId?: string;
};

const BASE = 60;

/** 앵커(문화시설) 의존 업종 — 기존 프롬프트의 "카페/디저트/엔터" */
const ANCHOR_DEPENDENT_CATEGORIES = new Set(["cafe"]);
const ANCHOR_DEPENDENT_SUBS = new Set(["dessert-cafe", "icecream-bingsu", "party-room"]);

/** 인구 적합 ±3 — 명백한 타깃 업종만 (애매하면 0, 과잉 판정 금지) */
const YOUNG_TARGET_CATEGORIES = new Set(["cafe", "fitness", "beauty"]);
const FAMILY_TARGET_CATEGORIES = new Set(["education", "pet"]);

export function scoreCandidateDeterministic(input: ScoreInput): DeterministicScore {
  const axes: AxisDelta[] = [];
  const mandatoryWarnings: string[] = [];

  // ── 1. 경쟁 (소스 분기 — 공식은 지도보다 1.5~2배 높게 잡히므로 밴드가 다르다) ──
  if (typeof input.officialSameCount === "number") {
    const n = input.officialSameCount;
    const ev = `공식 ${n}개 (소진공, 500m)`;
    let delta: number;
    if (n <= 5) { delta = -10; mandatoryWarnings.push(`동종 매장 ${n}개 — 수요가 검증되지 않은 상권일 수 있어요 (직접 답사로 확인 필수)`); }
    else if (n <= 30) delta = 10;
    else if (n <= 70) delta = 5;
    else if (n <= 120) delta = -12;
    else { delta = -20; }
    axes.push({ axis: "competition", delta, measured: true, evidence: ev });
  } else {
    const n = input.competitionCount ?? 0;
    const ev = `지도 ${n}개 (카카오, 500m)`;
    let delta: number;
    if (n <= 3) delta = -10;
    else if (n <= 15) delta = 10;
    else if (n <= 35) delta = 5;
    else if (n <= 60) delta = -12;
    else delta = -20;
    axes.push({ axis: "competition", delta, measured: true, evidence: ev });
  }

  // ── 2. 유동 proxy (카페 밀도) ──
  {
    const n = input.cafeCount ?? 0;
    const ev = `카페 ${n}개 (카카오, 500m)`;
    let delta = 0;
    if (n >= 30) delta = 10;
    else if (n >= 10) delta = 5;
    else if (n <= 4) { delta = -7; mandatoryWarnings.push(`카페 ${n}개 — 유동 신호가 약해 방문자가 발견하기 어려울 수 있어요`); }
    axes.push({ axis: "foot", delta, measured: true, evidence: ev });
  }

  // ── 3. 접근성 (지하철) ──
  {
    const n = input.subwayCount ?? 0;
    axes.push({ axis: "access", delta: n >= 1 ? 5 : 0, measured: true, evidence: `지하철역 ${n}개 (500m)` });
  }

  // ── 4. 앵커 (문화시설) ──
  {
    const n = input.cultureCount ?? 0;
    const anchorDependent = ANCHOR_DEPENDENT_CATEGORIES.has(input.categoryId)
      || (input.subIndustryId ? ANCHOR_DEPENDENT_SUBS.has(input.subIndustryId) : false);
    let delta = 0;
    if (n >= 5) delta = 5;
    else if (n === 0 && anchorDependent) delta = -3;
    axes.push({ axis: "anchor", delta, measured: true, evidence: `문화시설 ${n}개 (500m)` });
  }

  // ── 5. 프랜차이즈 실측 (주입 시만) ──
  if (input.franchise) {
    const f = input.franchise;
    if (f.sameBrand >= 1) {
      axes.push({ axis: "franchise", delta: -15, measured: true, evidence: `같은 브랜드 ${f.sameBrand}개 (소진공 상호명 실측, 500m)` });
      mandatoryWarnings.unshift(`같은 브랜드 ${f.sameBrand}개 — 대부분의 가맹계약은 영업지역 보호로 인근 출점이 제한돼요. 본사 영업담당에게 출점 가능 여부 확인 필수`);
    } else {
      const peerSum = f.peers.reduce((a, p) => a + p.count, 0);
      if (peerSum >= 5) {
        const names = f.peers.slice(0, 3).map((p) => `${p.name} ${p.count}`).join("·");
        axes.push({ axis: "franchise", delta: -7, measured: true, evidence: `동종 브랜드 ${peerSum}개 (${names})` });
      } else {
        axes.push({ axis: "franchise", delta: 0, measured: true, evidence: `같은 브랜드 0개 · 동종 ${peerSum}개` });
      }
    }
  } else {
    axes.push({ axis: "franchise", delta: 0, measured: false, evidence: "실측 없음" });
  }

  // ── 6. 공실률 (부동산원 실측 시만) ──
  if (typeof input.vacancyPct === "number") {
    const v = input.vacancyPct;
    const high = v >= 8;
    axes.push({ axis: "vacancy", delta: high ? -5 : 0, measured: true, evidence: `공실률 ${v}% (한국부동산원)` });
    if (high) mandatoryWarnings.push(`공실률 ${v}% — 상권 침체 신호일 수 있어요 (주변 공실 원인 답사 확인)`);
  } else {
    axes.push({ axis: "vacancy", delta: 0, measured: false, evidence: "실측 없음" });
  }

  // ── 7. 인구 적합 ±3 (행안부 동 매칭 + 명백한 타깃 업종만) ──
  if (input.population) {
    const p = input.population;
    let delta = 0;
    let ev = `20~30대 ${p.age2030Pct}% · 40대+ ${p.age40PlusPct}% (주민등록)`;
    if (YOUNG_TARGET_CATEGORIES.has(input.categoryId)) {
      if (p.age2030Pct >= 30) { delta = 3; ev += " — 젊은층 타깃 적합"; }
      else if (p.age2030Pct < 20) { delta = -3; ev += " — 젊은층 비중 낮음"; }
    } else if (FAMILY_TARGET_CATEGORIES.has(input.categoryId)) {
      if (p.age40PlusPct >= 45) { delta = 3; ev += " — 가족·정주층 타깃 적합"; }
    }
    axes.push({ axis: "population", delta, measured: true, evidence: ev });
  } else {
    axes.push({ axis: "population", delta: 0, measured: false, evidence: "실측 없음" });
  }

  // ── 8. 복합 실패 시그널 — 레드오션 ∧ 유동 부족 ──
  {
    const comp = axes.find((a) => a.axis === "competition")!;
    const redOcean = comp.delta === -20;
    const lowFoot = (input.cafeCount ?? 0) < 5;
    if (redOcean && lowFoot) {
      axes.push({ axis: "compound", delta: -8, measured: true, evidence: "과밀 + 유동 부족 (최악 조합)" });
    }
  }

  const score = Math.max(0, Math.min(100, BASE + axes.reduce((a, x) => a + x.delta, 0)));

  const AXIS_LABEL: Record<AxisDelta["axis"], string> = {
    competition: "경쟁", foot: "유동", access: "접근성", anchor: "앵커",
    franchise: "프랜차이즈", vacancy: "공실", population: "인구", compound: "복합",
  };
  const parts = axes
    .filter((a) => a.delta !== 0)
    .map((a) => `${AXIS_LABEL[a.axis]} ${a.delta > 0 ? "+" : ""}${a.delta}(${a.evidence})`);
  const breakdown = [`기준 ${BASE}`, ...parts].join(" · ");

  return { score, base: BASE, axes, mandatoryWarnings, breakdown };
}
