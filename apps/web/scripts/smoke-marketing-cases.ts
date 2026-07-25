/**
 * 마케팅 사례 엔진 v2 스모크 하네스 (2026-07-25).
 *
 * 목적: "LLM이 잘 가져오는지"를 배포 전에 실호출로 평가.
 *  - 라우트와 **동일 코드**(_lib/marketing-cases-core.generateMarketingPlays) 실행 — 복제본 드리프트 없음.
 *  - 대표 프로필 5개(외식·카페·뷰티·피트니스·B2B SaaS) × 1회 호출.
 *  - 1층(결정적) 검사 자동 채점: 빈칸 금지 / 상호 실주입 / 미션 형식 / 업종-채널 정합 /
 *    case 실재성(브랜드+URL, URL 생존 실측) / deliverables 개수.
 *  - 산출물 전문을 마크다운으로 덤프 → 사장님 육안 스팟체크용.
 *
 * 실행:  cd apps/web && npx tsx scripts/smoke-marketing-cases.ts
 * 필요 env(.env.local): OPENAI_API_KEY, TAVILY_API_KEY
 * 출력:  scripts/output/smoke-marketing-cases-<timestamp>.md + 콘솔 요약.
 *
 * 비용: 프로필당 리서치(Tavily 수 회 + web_search) + 합성 1회 ≈ 수십 원. 총 5프로필.
 * 주의: 레이트리밋·캐시를 우회한다(코어 직접 호출) — CI 아닌 수동 평가 전용.
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateMarketingPlays, type MarketingPlay } from "../app/api/_lib/marketing-cases-core";

const HERE = dirname(fileURLToPath(import.meta.url));

// ── env 로딩 (scripts/seed-insights 패턴) ──
function loadEnv(): Record<string, string> {
  const candidates = [
    resolve(HERE, "..", ".env.local"),               // apps/web/.env.local
    resolve(HERE, "..", "..", "..", ".env.local"),   // repo root
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
    } catch { /* file missing — ok */ }
  }
  return env;
}

// ── 대표 프로필 — 업종 스펙트럼 (외식/카페/뷰티/피트니스/스타트업) ──
type Profile = {
  key: string;
  storeName: string;
  categoryId: string;
  label: string;              // 프롬프트 주입 업종 라벨 (라우트의 label 해석 결과에 해당)
  /** 동네 라벨 — 일부 프로필은 의도적으로 생략해 "지역 모르면 빈칸 금지" 규칙을 함께 검증 */
  region?: string;
  monthlyRevenueWon?: number;
  activeChannels?: string[];
};

const PROFILES: Profile[] = [
  { key: "food",         storeName: "우리집도시락",   categoryId: "food",         label: "한식 도시락 전문점", region: "관악구 신림동",   monthlyRevenueWon: 12_000_000, activeChannels: ["naver-place"] },
  { key: "cafe",         storeName: "라떼는말이야",   categoryId: "cafe-dessert", label: "동네 카페·디저트",   monthlyRevenueWon: 8_000_000 },  // region 없음 — 빈칸 금지 규칙 검증
  { key: "beauty",       storeName: "글로우네일",     categoryId: "beauty",       label: "네일·속눈썹 샵",     region: "분당구 정자동",   monthlyRevenueWon: 6_000_000, activeChannels: ["instagram"] },
  { key: "fitness",      storeName: "코어핏필라테스", categoryId: "fitness",      label: "필라테스 스튜디오",  region: "마포구 연남동",   monthlyRevenueWon: 15_000_000 },
  { key: "startup-tech", storeName: "리포트요약봇",   categoryId: "startup-tech", label: "B2B SaaS·AI 스타트업" },                            // region 없음
];

// ── 1층 결정적 검사 ──

// 빈칸/플레이스홀더 — "content 는 완성형" 규칙 위반 검출
const PLACEHOLDER_RE = /(OO|○○|◯◯|XX|\[[^\]]{1,14}\]|\{[^}]{1,14}\}|\(상호명?\)|메뉴명을|이름을 넣)/;

// 업종-채널 정합 — 이 단어가 나오면 업종 미스매치 (mission+title+deliverables+steps 전체 텍스트 기준)
const FORBIDDEN_BY_CATEGORY: Record<string, string[]> = {
  "food":         ["링크드인", "디스콰이엇", "콜드메일", "콜드 아웃리치"],
  "cafe-dessert": ["링크드인", "디스콰이엇", "콜드메일"],
  "beauty":       ["링크드인", "디스콰이엇", "배달앱", "배민"],
  "fitness":      ["링크드인", "디스콰이엇", "배달앱", "배민"],
  "startup-tech": ["배달앱", "배민", "네이버 플레이스", "당근마켓", "리뷰이벤트"],
};

type CheckResult = { name: string; pass: boolean; note?: string };

function playText(p: MarketingPlay): string {
  return [
    p.mission ?? "", p.title,
    ...(p.deliverables ?? []).map((d) => `${d.label} ${d.content}`),
    ...p.application.steps,
  ].join("\n");
}

async function urlAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8000) });
    if (res.status < 400) return true;
    // 일부 서버는 HEAD 405 — GET 재시도
    const res2 = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(8000) });
    return res2.status < 400;
  } catch {
    return false;
  }
}

async function checkProfile(profile: Profile, plays: MarketingPlay[]): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];
  const hero = plays[0];

  checks.push({ name: "plays ≥ 3", pass: plays.length >= 3, note: `${plays.length}개` });
  checks.push({ name: "hero.mission 존재", pass: !!hero?.mission });
  if (hero?.mission) {
    const len = [...hero.mission].length;
    checks.push({ name: "mission ≤ 30자", pass: len <= 30, note: `${len}자: "${hero.mission}"` });
  }
  checks.push({ name: "hero.timeLabel 존재", pass: !!hero?.timeLabel, note: hero?.timeLabel });
  const dvCount = hero?.deliverables?.length ?? 0;
  checks.push({ name: "hero.deliverables ≥ 2", pass: dvCount >= 2, note: `${dvCount}개` });

  // 빈칸 금지 + 상호 실주입 (전체 플레이의 deliverables 대상)
  const allDv = plays.flatMap((p) => p.deliverables ?? []);
  const placeholderHits = allDv.filter((d) => PLACEHOLDER_RE.test(d.content)).map((d) => d.label);
  checks.push({
    name: "빈칸/플레이스홀더 없음",
    pass: placeholderHits.length === 0,
    note: placeholderHits.length > 0 ? `위반: ${placeholderHits.join(", ")}` : undefined,
  });
  checks.push({
    name: "상호가 실행물에 실제 포함",
    pass: allDv.some((d) => d.content.includes(profile.storeName)),
  });

  // 업종-채널 정합
  const forbidden = FORBIDDEN_BY_CATEGORY[profile.categoryId] ?? [];
  const fullText = plays.map(playText).join("\n");
  const misfits = forbidden.filter((w) => fullText.includes(w));
  checks.push({
    name: "업종-채널 정합 (금지어 0)",
    pass: misfits.length === 0,
    note: misfits.length > 0 ? `미스매치: ${misfits.join(", ")}` : undefined,
  });

  // case 실재성 — 강등 게이트 통과 후에도 URL 이 실제로 살아있는지 실측
  const cases = plays.filter((p) => p.kind === "case");
  checks.push({ name: "case 는 brand+url 보유 (게이트)", pass: cases.every((p) => !!p.source.brand && !!p.source.url) });
  for (const c of cases) {
    if (c.source.url) {
      const alive = await urlAlive(c.source.url);
      checks.push({ name: `case URL 생존: ${c.source.brand}`, pass: alive, note: c.source.url });
    }
  }
  return checks;
}

// ── 마크다운 덤프 ──
function playToMd(p: MarketingPlay, idx: number): string {
  const lines = [
    `#### plays[${idx}] — ${p.kind === "case" ? "검증된 사례" : "트렌드"} · ${p.title}`,
    p.mission ? `- **미션**: ${p.mission}  ${p.timeLabel ? `(⏱ ${p.timeLabel})` : ""}` : "- **미션**: (없음 — v1 형식)",
  ];
  for (const d of p.deliverables ?? []) {
    lines.push(`- **[${d.kind}] ${d.label}**:\n  > ${d.content.replaceAll("\n", "\n  > ")}`);
  }
  lines.push(`- 근거: ${p.source.brand ?? "(무명)"} — ${p.source.whatHappened}${p.source.metric ? ` [${p.source.metric}]` : ""}${p.source.url ? ` (${p.source.url})` : ""}`);
  lines.push(`- 단계: ${p.application.steps.join(" / ")}`);
  return lines.join("\n");
}

// ── main ──
async function main() {
  const env = loadEnv();
  const openaiKey = env.OPENAI_API_KEY;
  const tavilyKey = env.TAVILY_API_KEY;
  if (!openaiKey) {
    console.error("❌ OPENAI_API_KEY 없음 (.env.local 확인)");
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13);
  const outDir = resolve(HERE, "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `smoke-marketing-cases-${stamp}.md`);

  const md: string[] = [
    `# 마케팅 사례 엔진 v2 스모크 리포트`,
    `- 실행: ${new Date().toISOString()} (KST 기준 표시는 +9h)`,
    `- 모델: gpt-5.4-mini · 코어: _lib/marketing-cases-core.ts (라우트와 동일 코드)`,
    ``,
  ];

  let totalPass = 0;
  let totalFail = 0;

  for (const profile of PROFILES) {
    const t0 = Date.now();
    console.log(`\n▶ [${profile.key}] ${profile.storeName} (${profile.label}) 생성 중…`);
    let plays: MarketingPlay[] = [];
    let researchLen = 0;
    let errNote = "";
    try {
      const r = await generateMarketingPlays({
        openaiKey,
        tavilyKey,
        label: profile.label,
        categoryId: profile.categoryId,
        language: "ko",
        storeName: profile.storeName,
        region: profile.region,
        monthlyRevenueWon: profile.monthlyRevenueWon,
        activeChannels: profile.activeChannels,
        currentStageLabel: "운영 중",
        launchDate: "2026-01-01",
        hasUserSales: !!profile.monthlyRevenueWon,
      });
      plays = r.plays;
      researchLen = r.researchText.length;
    } catch (e) {
      errNote = e instanceof Error ? e.message : String(e);
    }
    const ms = Date.now() - t0;

    md.push(`## ${profile.key} — ${profile.storeName} (${profile.label})`);
    md.push(`- 소요 ${Math.round(ms / 1000)}s · 리서치 ${researchLen.toLocaleString()}자 · plays ${plays.length}개${errNote ? ` · ❌ 오류: ${errNote}` : ""}`);

    const checks = errNote
      ? [{ name: "생성 성공", pass: false, note: errNote } as CheckResult]
      : await checkProfile(profile, plays);

    md.push(``, `| 검사 | 결과 | 비고 |`, `|---|---|---|`);
    for (const c of checks) {
      md.push(`| ${c.name} | ${c.pass ? "✅" : "❌"} | ${c.note ?? ""} |`);
      if (c.pass) totalPass += 1; else totalFail += 1;
      console.log(`  ${c.pass ? "✅" : "❌"} ${c.name}${c.note ? ` — ${c.note}` : ""}`);
    }

    md.push(``, `### 산출물 전문 (육안 스팟체크용)`);
    plays.forEach((p, i) => md.push(playToMd(p, i), ""));
    md.push(`---`, ``);
  }

  md.push(`## 총평`, `- ✅ ${totalPass} / ❌ ${totalFail}`);
  md.push(``, `> 1층(결정적) 검사만 자동화됨. "원론적인가"는 위 산출물 전문을 사장님이 직접 읽고 판단 — 루브릭: 오늘 30분 내 실행? / 수정 없이 복붙? / 업종에 맞나? / 출처 사실? / 원론적이지 않나?`);

  writeFileSync(outPath, md.join("\n"), "utf-8");
  console.log(`\n📄 리포트: ${outPath}`);
  console.log(`총평: ✅ ${totalPass} / ❌ ${totalFail}`);
  process.exit(totalFail > 0 ? 2 : 0);
}

void main().catch((e) => { console.error(e); process.exit(1); });
