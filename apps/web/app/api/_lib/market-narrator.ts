/**
 * market-narrator.ts — 상권 후보 LLM 내레이터 (해설 전용, 2026-08-03)
 *
 * 역할 분리 (사장님 결정): **점수는 market-scoring.ts 가 실측으로 확정.**
 *  LLM 은 summary/reasons/warnings 서술만 생성한다 — 응답에 score 가 있어도 파서가 읽지 않는다.
 *  LLM 실패/키 없음/파싱 실패 → buildTemplateNarration 으로 전 후보 템플릿 서술 (HTTP 200 유지,
 *  LLM 0 의존 경로). 강제 경고(mandatoryWarnings)는 호출측이 warnings 선두에 병합한다.
 */
import { createAiClient } from "@foundone/ai/utils/client";
import type { DeterministicScore } from "./market-scoring";
import { MARKET_RENT_QUARTER_LABEL } from "@foundone/shared";
import { DONG_POP_YM_LABEL } from "./dong-population";

export type CandidateNarrationFacts = {
  districtName: string;
  det: DeterministicScore;
  /** 실측 라인 (아래 buildFactLines 산출) — LLM 입력 + 템플릿 폴백 공용 */
  factLines: string;
};

export type Narration = {
  title: string;
  summary: string;
  reasons: string[];
  warnings: string[];
};

// ── 실측 팩트 라인 빌더 (구 candidateLines 이관 — 문구 규칙 불변) ──────────
export function buildFactLines(input: {
  districtName: string;
  lat: number; lng: number;
  officialSameCount?: number | null;
  officialTotalCount?: number | null;
  competitionCount?: number;
  cafeCount?: number; subwayCount?: number; cultureCount?: number;
  rent: { district: string; bldgLabel: string; manwonPerM2: string; vacancyPct: number | null } | null;
  pop: { total: number; age2030Pct: number; age40PlusPct: number } | null;
  trend?: { daysAgo: number; sameDelta: number; totalDelta: number | null } | null;
  franchise?: { sameBrand: number; peers: Array<{ name: string; count: number }>; sampled: boolean } | null;
}): string {
  const rentLine = input.rent
    ? `실측 임대료(한국부동산원 ${MARKET_RENT_QUARTER_LABEL}): ${input.rent.district} 상권 ${input.rent.bldgLabel} ㎡당 월 ${input.rent.manwonPerM2}만원${input.rent.vacancyPct != null ? ` · 공실률 ${input.rent.vacancyPct}%` : ""}`
    : "실측 임대료: 없음 (조사상권 밖 — 임대료·공실률 언급 금지)";
  const popLine = input.pop
    ? `배후 주거인구(주민등록 ${DONG_POP_YM_LABEL}): ${input.pop.total.toLocaleString()}명 · 20~30대 ${input.pop.age2030Pct}% · 40대+ ${input.pop.age40PlusPct}% (거주 인구 — 유동 아님)`
    : "배후 주거인구: 매칭 없음 (언급 금지)";
  const trendLine = input.trend
    ? `개폐업 추이(자체 스냅샷 실측): ${input.trend.daysAgo}일 전 대비 동종 ${input.trend.sameDelta >= 0 ? "+" : ""}${input.trend.sameDelta}곳${input.trend.totalDelta != null ? ` · 전체 ${input.trend.totalDelta >= 0 ? "+" : ""}${input.trend.totalDelta}곳` : ""}`
    : "개폐업 추이: 관측 이력 없음 (언급 금지)";
  const frLine = input.franchise
    ? `프랜차이즈 실측(상호명 매칭, 500m${input.franchise.sampled ? " · 동종 300개 표본" : ""}): 같은 브랜드 ${input.franchise.sameBrand}개${input.franchise.peers.length > 0 ? ` / 동종 프랜차이즈: ${input.franchise.peers.map((x) => `${x.name} ${x.count}`).join("·")}` : " / 동종 주요 프랜차이즈 미발견"}`
    : "";
  const compLine = typeof input.officialSameCount === "number"
    ? `동종업종 매장 [공식]: ${input.officialSameCount}개 (소진공·국세청 원천, 500m)${typeof input.officialTotalCount === "number" ? ` / 전체 업소 ${input.officialTotalCount}개` : ""}`
    : `동종업종 매장 [지도]: ${input.competitionCount ?? 0}개 (카카오, 500m)`;
  return `- ${compLine}
- 카페 밀도: ${input.cafeCount ?? 0}개 (유동인구 proxy)
- 지하철역: ${input.subwayCount ?? 0}개 (접근성)
- 문화시설: ${input.cultureCount ?? 0}개 (앵커 시설)
- ${rentLine}
- ${popLine}
- ${trendLine}${frLine ? `\n- ${frLine}` : ""}`;
}

// ── LLM 시스템 프롬프트 — 해설 전용 (점수 산정 지시 없음) ─────────────────
const NARRATOR_SYSTEM_PROMPT = `당신은 한국 창업 상권 분석 전문가입니다. 각 후보 상권의 **확정된 점수와 실측 데이터**를 받아
사용자(예비 창업자)에게 보여줄 서술만 작성합니다.

## 절대 규칙
- **점수는 서버가 실측으로 이미 확정했다. 재산정·변경·언급 금지.** 당신의 출력에 score 필드가 있어도 무시된다.
- 수치는 입력에 주입된 실측값만 인용하라. 수치 변형·추정 금지.
- "실측 임대료: 없음" 인 후보는 임대료·공실률을 일절 언급 금지 — 추정 밴드를 만들지 마라.
- "배후 주거인구: 매칭 없음 (언급 금지)" 인 후보는 인구 수치 언급 금지. 주민등록 = 거주 인구다 — "유동인구" 라고 부르지 마라.
- "개폐업 추이: 관측 이력 없음 (언급 금지)" 인 후보는 추이 언급 금지.
- 실측 라인이 없으면 프랜차이즈 관련 언급 금지.
- 경쟁 수 인용 시 소스 태그를 함께 ("공식 107개" / "지도 32개") — [공식] 은 사업자 등록 기준이라 지도 노출보다 1.5~2배 높게 잡힌다.
- 점수 근거(가감 내역)가 함께 주입된다 — reasons 는 그 근거를 자연어로 풀어쓰되 새 근거를 지어내지 마라.

## 출력 형식 — JSON 배열만, 마크다운 펜스 금지, 첫 글자 [
[
  {
    "districtName": "입력 그대로 (매칭 키)",
    "title": "사용자에게 보여줄 매력적 명칭 (예: '망원역 카페거리')",
    "summary": "한 문장 — 이 상권의 정체성 + 사용자 업종 적합도 (60자 내외)",
    "reasons": ["실측 수치를 인용한 강점 2~3개"],
    "warnings": ["주의 0~2개 (실측 기반만). 없으면 빈 배열"]
  }
]`;

export type NarratorCtx = {
  region: string;
  categoryId: string;
  subIndustryId?: string;
  capital?: number;
  language: "ko" | "en";
  franchiseRegionalLine?: string | null;
};

/**
 * LLM 해설 생성. 실패 시 null — 호출측은 buildTemplateNarration 폴백 (200 유지).
 */
export async function narrateCandidates(
  facts: CandidateNarrationFacts[],
  ctx: NarratorCtx,
  apiKey: string,
): Promise<{ byDistrict: Map<string, Narration>; usage: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number } | null } | null> {
  const ko = ctx.language === "ko";
  const lines = facts.map((f, i) =>
    `${i + 1}. ${f.districtName} — 확정 점수 ${f.det.score}점
   점수 근거: ${f.det.breakdown}
${f.factLines.split("\n").map((l) => `   ${l}`).join("\n")}`,
  ).join("\n\n");

  const userPrompt = `## 사용자 컨텍스트
- 희망 지역: "${ctx.region}"
- 업종 카테고리: ${ctx.categoryId}${ctx.subIndustryId ? ` (세부: ${ctx.subIndustryId})` : ""}
- 자본금: ${ctx.capital ? `${(ctx.capital / 10000).toLocaleString()}만원` : "미설정"}${ctx.franchiseRegionalLine ? `\n- 브랜드 시도 분포(실측): ${ctx.franchiseRegionalLine} — 시도 포화도 참고 (반경 실측이 우선 신호)` : ""}
- 응답 언어: ${ko ? "한국어" : "English"}

## 후보 상권 — 확정 점수 + 실측
${lines}

각 후보의 서술만 작성하세요. JSON 배열만 출력.`;

  try {
    const client = createAiClient(apiKey);
    const response = await client.messages.create({
      model: "gpt-5.4-mini",
      max_tokens: 2048,
      system: [{ type: "text", text: NARRATOR_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("\n");
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) {
      console.warn("[market-narrator] no JSON array | first 300:", text.slice(0, 300));
      return null;
    }
    const parsed = JSON.parse(m[0].replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "")) as Array<{
      districtName?: string; title?: string; summary?: string; reasons?: string[]; warnings?: string[];
    }>;
    const byDistrict = new Map<string, Narration>();
    for (const p of parsed) {
      if (!p.districtName || !p.summary) continue;
      byDistrict.set(p.districtName, {
        title: p.title || p.districtName,
        summary: p.summary,
        reasons: Array.isArray(p.reasons) ? p.reasons.slice(0, 4) : [],
        warnings: Array.isArray(p.warnings) ? p.warnings.slice(0, 3) : [],
      });
    }
    return { byDistrict, usage: response.usage };
  } catch (e) {
    console.warn("[market-narrator] LLM failed:", (e as Error).message);
    return null;
  }
}

/**
 * 템플릿 서술 폴백 — 실측 evidence 를 그대로 문장화 (LLM 0 의존).
 *  위조 없음: 모든 문장이 measured 축의 evidence 에서만 나온다.
 */
export function buildTemplateNarration(districtName: string, det: DeterministicScore): Narration {
  const positives = det.axes.filter((a) => a.measured && a.delta > 0);
  const negatives = det.axes.filter((a) => a.measured && a.delta < 0);
  const reasons = positives.slice(0, 3).map((a) => a.evidence);
  const warnings = negatives.slice(0, 2).map((a) => a.evidence);
  const summary = positives.length > 0
    ? `실측 기준 ${det.score}점 — ${positives[0]!.evidence}`
    : `실측 기준 ${det.score}점 상권`;
  return { title: districtName, summary, reasons, warnings };
}

/** 강제 경고 + 서술 경고 병합 (강제가 선두, 중복 제거, 최대 4) */
export function mergeWarnings(mandatory: string[], narrated: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of [...mandatory, ...narrated]) {
    const key = w.replace(/\s+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
    if (out.length >= 4) break;
  }
  return out;
}
