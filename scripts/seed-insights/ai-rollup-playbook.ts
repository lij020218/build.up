/**
 * Seed script: ingest the "AI 롤업 사모펀드 플레이북" article into the insight RAG.
 *
 * Run from repo root (install tsx first if not present):
 *   pnpm dlx tsx scripts/seed-insights/ai-rollup-playbook.ts
 *   pnpm dlx tsx scripts/seed-insights/ai-rollup-playbook.ts --replace
 *
 * Required env (read from .env.local at repo root or apps/web/.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - OPENAI_API_KEY
 *
 * Idempotent: re-running with the same body skips embedding + insertion.
 * Pass --replace to force a re-ingest after edits to the body.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestInsightDocument } from "@build-up/ai";
import { createClient } from "@supabase/supabase-js";

const TITLE = "AI 롤업 사모펀드 플레이북";
const SOURCE_NAME = "bzcf";
const SOURCE_URL = "https://bzcf.io/ai-roleob-samopeondeu-peulreibug/";
const PUBLISHED_AT = "2026-05-05";
const CATEGORY = "ai_strategy";
const TAGS = [
  "ai_rollup",
  "private_equity",
  "venture_capital",
  "valuation",
  "rule_of_40",
  "anthropic",
  "openai",
  "general_catalyst",
  "thrive_capital",
];

// ── Body — verbatim from user's message. Each numbered section becomes a
//    natural paragraph; the chunker preserves the section boundaries.
const BODY = `미국인들은 돈 버는 귀신들이다. PE/VC들이 인공지능 회사들이랑 손 합쳐서 AI Roll-up 엄청 하고 있다. 새로운 밸류업 플레이북이 만들어지고 있는 것 같다.

1. 전통 PE는 플레이북이 정해져 있었다. LBO 걸고, 재무 모델 돌리고, 비용 커팅하고, 3~5년 안에 엑싯한다. 볼트온 몇 개 붙인다. 타깃 스크리닝부터 엑싯까지 단계별 플레이북이 정해져 있었다. 누가 뛰어도 비슷한 게임이었고, 차이는 실행 속도와 디테일, 혹은 쏘싱에서 났다.

2. AI Roll-up은 아무나 못한다. 아무나 못한다. 먼저 AI 네이티브 할 수 있어야 한다. 그 다음 전통 서비스 회사를 사들인다. 노동집약 업무의 30~70%를 자동화로 갈아치운다. 저마진 서비스 회사가 고마진 확장 자산으로 둔갑한다. 시간축도 다르다. 엑싯하지 않는다. 3~5년 안에 팔고 빠지는 게임이 아니라, 장기 컴파운딩이 목표다.

3. 제너럴 카탈리스트가 잘하고 있다. 이 전략을 가장 명확하게 언어화한 곳이 제너럴 카탈리스트(GC)다. AUM 400억 달러(약 56조 원), 글로벌 톱3 VC다. 그 안에 15억 달러(약 2조 원) 규모의 AI 롤업 전용 엔진을 따로 만들었다. AI 네이티브 회사 하나 인큐베이션에 1억~1억5천만 달러(약 1,400억~2,100억 원)를 투입한다. GC는 이렇게 정의한다. "전통 LBO와 달리, 목적에 맞춰 만든 AI로 새로운 운영 역량을 깔고, 탑라인 자체를 키우면서 인수로 플랫폼을 확장하는 모델." 벤처 크리에이션, 운영 변환, 그리고 원래 PE의 영역. 그 셋이 만나는 정확한 교집합이다.

4. 숫자가 따라오고 있다. 포트폴리오 회사들이 이미 결과를 내고 있다. Long Lake (HOA) — 6.7억 달러(약 9,400억 원) 조달, 2년 안에 EBITDA 1억 달러 도달. 18개 사업 인수, AI 도구로 생산성 25~30% 향상, 신규 고객 파이프라인 10배. Crescendo (콜센터) — 밸류 5억 달러(약 7,000억 원). 전통 콜센터 대비 마진 4배. 고객 인터랙션의 80%+ 자동화. PartnerHero 인수 후 매출총이익률 60~65%. Eudia (법률) — 약 1조 달러 규모 글로벌 법률 시장 타깃. Johnson Hana 인수로 300명+ 법률 전문가 확보. 계약·컴플라이언스·M&A DD 자동화. Crete Professionals (회계, 스라이브 백업) — 30개+ 펌, 연 매출 3억 달러+. Accounting Today 선정 2025년 가장 빠르게 성장한 회계법인. Dwelly (영국 부동산 관리) — 6개 에이전시 인수. 기술이 완전히 적용된 에이전시는 EBITDA 마진 2배, 수리 대기시간 40% 단축.

5. 다른 곳들도 따라온다. 라이트스피드, 스라이브 캐피털, 8VC가 전부 같은 전략에 더블다운했다. 회계, IT 서비스, 보험, 법률. 공통점은 분절돼 있고, 노동집약적이고, AI로 재구축 가능하다는 것. 스라이브는 아예 Thrive Holdings라는 10억 달러(약 1조 4천억 원)+ 규모의 전용 비히클까지 따로 차렸다.

6. Rule of 40이 무너진다. SaaS 업계의 "Rule of 40"은 성장률과 수익성의 합이 40을 넘어야 한다는 룰이었다. AI 롤업은 이 트레이드오프 자체를 없앤다. GC는 자기네 Long Lake가 "Rule of 60"을 향해 간다고 주장한다.

7. 같은 1달러여도, 멀티플이 높다. AI 네이티브 OS 모델: 1달러당 8~10달러. 부분 변환 모델: 1달러당 1.5~3달러. 가벼운 자동화 모델: 1달러당 0.3~0.8달러. 전통 컨설팅: 1달러당 0.1~0.3달러. 같은 1달러를 벌어도 30~100배 차이다.

8. Anthropic × Blackstone × H&F × Goldman Sachs 직접 신설법인 만든다. 2026년 5월 4일 공식 발표. 총 약정자본 15억 달러(약 2조 원). Anthropic의 Claude를 PE 포트폴리오 기업에 직접 임베드.

9. 같은 날, OpenAI도 — "The Deployment Company". 19개 기관에서 40억 달러+ 조달. 자본 유입 전 밸류 100억 달러.

10. 결론. 돈을 버는 곳은 기술을 만든 쪽도, 기술을 사다 쓰는 쪽도 아니다. 기술을 가장 먼저 들고 들어가 회사 자체를 다시 짓는 쪽이다.`;

function loadEnv(): Record<string, string> {
  const candidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "apps/web/.env.local"),
  ];
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  for (const path of candidates) {
    try {
      const content = readFileSync(path, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        if (!env[key] || env[key].length === 0) env[key] = val;
      }
    } catch {
      /* file missing — ok */
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiKey = env.OPENAI_API_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  if (!openAiKey) throw new Error("OPENAI_API_KEY is required.");

  const replace = process.argv.includes("--replace");

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`[seed] ingesting "${TITLE}" (replace=${replace})`);
  const result = await ingestInsightDocument(
    {
      title: TITLE,
      body: BODY,
      category: CATEGORY,
      tags: TAGS,
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      language: "ko",
      publishedAt: PUBLISHED_AT,
    },
    {
      supabase: supabase as unknown as Parameters<typeof ingestInsightDocument>[1]["supabase"],
      embed: { apiKey: openAiKey },
    },
    { replace },
  );

  if (result.inserted) {
    console.log(`[seed] ✓ inserted document_id=${result.documentId} chunks=${result.chunkCount}`);
  } else {
    console.log(`[seed] ↺ already present (document_id=${result.documentId}). Use --replace to re-ingest.`);
  }
}

main().catch((err) => {
  console.error("[seed] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
