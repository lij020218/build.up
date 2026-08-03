/**
 * eval-roadmap-quality.mts — AI 로드맵 Pass1 품질 평가 하네스.
 *
 * 목적: 모델·effort·프롬프트를 바꿀 때마다 "충분한 퀄리티"를 실측으로 확인 (2026-08-03 사장님 기준).
 *  가장 위험한 지점만 객관 채점: 업종 오분류(로드맵 전체가 틀어지는 유일 지점)·과세유형·
 *  인허가 실재성(없어야 할 인허가 혼입)·창업형태.
 *
 * 실행 (회당 5 케이스 ≈ ₩1,500·약 2~3분):
 *   cd apps/web && npx tsx ../../scripts/eval-roadmap-quality.mts
 *
 * 기준: 필수(MUST) 전부 통과해야 케이스 PASS. 4/5 미만이면 모델·프롬프트 조정 필요.
 */
import { readFileSync } from "node:fs";

const mod = await import("../packages/ai/src/roadmap/generate.ts") as Record<string, unknown>;
const generateRoadmap = (mod.generateRoadmap ?? (mod.default as Record<string, unknown> | undefined)?.generateRoadmap) as
  typeof import("../packages/ai/src/roadmap/generate").generateRoadmap;

const env = Object.fromEntries(readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8")
  .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
  .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const apiKey = env.OPENAI_API_KEY as string;

type Case = {
  name: string;
  input: { ideaText: string; budget?: number; region?: string; teamSize?: number; language: "ko" };
  /** 허용 세부업종 (하나면 정답 고정, 여럿이면 합리적 범위) */
  expectSub: string[];
  expectStartupType?: "independent" | "franchise";
  expectTaxType?: "simplified" | "standard" | "corporation";
  /** 인허가에 반드시 포함(부분 문자열) */
  permitsMust?: string[];
  /** 인허가에 있으면 안 됨 — 다른 업종 인허가 혼입 감지 */
  permitsMustNot?: string[];
};

const CASES: Case[] = [
  {
    name: "모호 업종 — 무인 스터디카페 (space vs education 갈림)",
    input: { ideaText: "무인으로 운영하는 스터디카페를 차리고 싶어요. 24시간 운영하고 키오스크로 결제받으려고 합니다.", budget: 80_000_000, region: "대구 수성구", language: "ko" },
    expectSub: ["study-cafe-space"],
    expectStartupType: "independent",
    permitsMustNot: ["위생교육", "영업신고"],   // 스터디카페는 음식점 인허가 아님 (음료 자판기는 별개)
  },
  {
    name: "B2B SaaS 법인 — 오프라인 인허가 혼입 감지",
    input: { ideaText: "중소기업용 재고관리 B2B SaaS를 만들려고 합니다. 법인 설립하고 팀 3명으로 시작해요.", budget: 100_000_000, teamSize: 3, language: "ko" },
    expectSub: ["b2b-saas"],
    expectTaxType: "corporation",
    permitsMustNot: ["위생교육", "영업신고", "미용", "통신판매업"],   // B2B SW 는 통신판매업 신고 대상 아님(전상법 소비자 대상 아님)
  },
  {
    name: "프랜차이즈 카페 — 창업형태 판별",
    input: { ideaText: "메가커피 같은 저가 커피 프랜차이즈 가맹점을 하고 싶습니다.", budget: 90_000_000, region: "부산 서면", language: "ko" },
    expectSub: ["takeout-coffee", "specialty-coffee"],
    expectStartupType: "franchise",
    permitsMust: ["위생교육"],
    // ⚠️ 과세유형은 채점하지 않는다 (2026-08-03 설계 오류 정정): 서면 등 주요 상권은
    //   간이과세 배제지역 고시 대상일 수 있고 저가커피 가맹 평균매출(2~3억)이면 일반과세
    //   판단도 타당 — 단정 불가 항목은 우리 정직성 원칙상 앱도 단정하지 않는다.
  },
  {
    name: "온라인 커머스 — 통신판매업 필수·음식 인허가 배제",
    input: { ideaText: "스마트스토어에서 반려동물 용품을 팔고 싶어요. 집에서 혼자 시작합니다.", budget: 20_000_000, language: "ko" },
    expectSub: ["smart-store", "consignment-commerce"],
    expectStartupType: "independent",
    permitsMust: ["통신판매업"],
    permitsMustNot: ["위생교육", "영업신고"],
    expectTaxType: "simplified",
  },
  {
    name: "뷰티 1인 — 면허·위생교육 필수",
    input: { ideaText: "네일아트를 배워서 1인 네일샵을 열려고 해요.", budget: 40_000_000, region: "인천 부평", language: "ko" },
    expectSub: ["nail-studio"],
    expectStartupType: "independent",
    permitsMust: ["미용"],
    permitsMustNot: ["통신판매업"],
    expectTaxType: "simplified",
  },
];

let pass = 0;
const failures: string[] = [];

const filter = process.argv[2];
const RUN = filter ? CASES.filter((c) => c.name.includes(filter)) : CASES;

for (const c of RUN) {
  const t0 = Date.now();
  try {
    const r = await generateRoadmap(c.input, { apiKey });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const permits = (r.legal?.permitsDetailed ?? []).map((p) => p.name).join(" / ");
    const errs: string[] = [];

    if (!c.expectSub.includes(r.parsed.subIndustryId)) {
      errs.push(`업종: ${r.parsed.subIndustryId} (기대: ${c.expectSub.join("|")})`);
    }
    if (c.expectStartupType && r.parsed.startupType !== c.expectStartupType) {
      errs.push(`창업형태: ${r.parsed.startupType} (기대: ${c.expectStartupType})`);
    }
    if (c.expectTaxType && r.legal?.taxType !== c.expectTaxType) {
      errs.push(`과세: ${r.legal?.taxType} (기대: ${c.expectTaxType})`);
    }
    for (const must of c.permitsMust ?? []) {
      if (!permits.includes(must)) errs.push(`인허가 누락: ${must}`);
    }
    for (const not of c.permitsMustNot ?? []) {
      if (permits.includes(not)) errs.push(`인허가 혼입: ${not}`);
    }

    const ok = errs.length === 0;
    if (ok) pass++;
    else failures.push(`${c.name}: ${errs.join(" · ")}`);
    console.log(`${ok ? "✅" : "❌"} [${secs}s] ${c.name}`);
    console.log(`   sub=${r.parsed.subIndustryId} conf=${r.parsed.matchingConfidence} type=${r.parsed.startupType} tax=${r.legal?.taxType}`);
    console.log(`   permits: ${permits || "(없음)"}`);
    if (!ok) console.log(`   ⚠️ ${errs.join(" · ")}`);
  } catch (e) {
    failures.push(`${c.name}: 호출 실패 — ${e instanceof Error ? e.message.slice(0, 120) : e}`);
    console.log(`❌ [${((Date.now() - t0) / 1000).toFixed(1)}s] ${c.name} — FAILED`);
  }
}

console.log(`\n═══ 결과: ${pass}/${RUN.length} PASS ═══`);
if (failures.length) {
  console.log("실패 상세:");
  for (const f of failures) console.log(" ·", f);
  process.exitCode = 1;
}
