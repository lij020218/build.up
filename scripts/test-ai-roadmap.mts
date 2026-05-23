/**
 * AI 로드맵 생성 검증 — Pass 1 (generateRoadmap) 만 호출.
 * Pass 2 (selectFromPool)는 Supabase 풀 데이터가 필요해서 생략.
 *
 * 실행: cd apps/web && npx tsx ../../scripts/test-ai-roadmap.mts
 */

import { generateRoadmap } from "../packages/ai/src/roadmap/generate";
import type { RoadmapGenerationInput } from "../packages/ai/src/roadmap/prompt";

// 2026-05-11 마이그레이션 이후 백엔드는 OpenAI(gpt-5.4-mini). createAiClient가
// 받는 키는 OpenAI 키여야 함. ANTHROPIC_API_KEY는 fallback으로만 쓰임.
const apiKey = process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY (또는 ANTHROPIC_API_KEY) 환경변수가 필요합니다.");
  process.exit(1);
}

const testCases: Array<{ name: string; input: RoadmapGenerationInput }> = [
  {
    name: "음식점 — 강남 한식집",
    input: {
      ideaText: "강남에서 1인 한식집 창업. 점심 직장인 대상 백반·찌개. 4-5천 객단가 목표.",
      budget: 8000,
      region: "서울 강남구",
      teamSize: 2,
      language: "ko",
    },
  },
  {
    name: "스타트업 — AI SaaS",
    input: {
      ideaText:
        "B2B 영업팀용 AI 통화 분석 SaaS. 한국 SMB 50-200명 회사 대상. 월 정기과금.",
      budget: 5000,
      region: "서울",
      teamSize: 3,
      language: "ko",
    },
  },
  {
    name: "온라인 — 셀러",
    input: {
      ideaText: "스마트스토어에서 30대 여성 대상 비건 화장품 판매.",
      budget: 3000,
      region: "온라인",
      teamSize: 1,
      language: "ko",
    },
  },
];

const summary: Array<{ name: string; ok: boolean; ms: number; note: string }> = [];

for (const tc of testCases) {
  const t0 = Date.now();
  console.log(`\n══════════ ${tc.name} ══════════`);
  try {
    const result = await generateRoadmap(tc.input, { apiKey });
    const ms = Date.now() - t0;

    const r = result;
    const p = r.parsed;
    console.log(`✓ ${ms}ms — ${p.industryCategoryId} / ${p.subIndustryId} / ${p.startupType} (신뢰도 ${p.matchingConfidence}%)`);
    console.log(`  매칭이유: ${p.matchingReason}`);
    console.log(`  컨셉: ${r.conceptSummary.slice(0, 120)}...`);
    console.log(`  시장점수: ${r.marketAnalysis?.grade ?? "?"} / ${r.marketAnalysis?.score ?? "?"}점`);
    console.log(`  예산배분: 보증금 ${r.budgetAllocation?.deposit ?? 0}만 · 인테리어 ${r.budgetAllocation?.interior ?? 0}만 · 장비 ${r.budgetAllocation?.equipment ?? 0}만 · 운영 ${r.budgetAllocation?.workingCapital ?? 0}만`);
    console.log(`  허가: ${r.legal?.permitsDetailed?.length ?? 0}개  보험: ${r.insurance?.length ?? 0}개  자금프로그램: ${r.fundingPrograms?.length ?? 0}개`);
    console.log(`  대안 sub-industry: ${(p.alternativeSubIndustries ?? []).map(a => a.id).join(", ")}`);

    // 핵심 sanity checks
    const issues: string[] = [];
    if (!p.industryCategoryId) issues.push("industryCategoryId 누락");
    if (!p.subIndustryId) issues.push("subIndustryId 누락");
    if (p.matchingConfidence < 30) issues.push(`매칭신뢰도 낮음 (${p.matchingConfidence}%)`);
    if (!r.budgetAllocation || r.budgetAllocation.total === 0) issues.push("budgetAllocation 누락");
    if (!r.marketAnalysis?.grade) issues.push("marketAnalysis 누락");
    if (!r.legal?.permitsDetailed?.length) issues.push("permitsDetailed 비어있음");

    if (issues.length) {
      console.log(`  ⚠ 이슈: ${issues.join(" / ")}`);
      summary.push({ name: tc.name, ok: false, ms, note: issues.join(" / ") });
    } else {
      summary.push({ name: tc.name, ok: true, ms, note: "정상" });
    }
  } catch (e) {
    const ms = Date.now() - t0;
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`✗ ${ms}ms — 실패: ${msg}`);
    summary.push({ name: tc.name, ok: false, ms, note: msg.slice(0, 120) });
  }
}

console.log("\n══════════ 결과 요약 ══════════");
for (const s of summary) {
  console.log(`${s.ok ? "✓" : "✗"} ${s.name} (${s.ms}ms) — ${s.note}`);
}
const passed = summary.filter(s => s.ok).length;
console.log(`\n총 ${summary.length}건 중 ${passed}건 정상.`);
process.exit(passed === summary.length ? 0 : 1);
