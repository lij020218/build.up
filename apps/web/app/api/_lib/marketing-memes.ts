import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tavilySearch, type TavilyResult } from "./tavily";

/**
 * 주간 밈·챌린지 팩 — 수집·구조화·게이트 (2026-07-24 신설).
 *
 * 설계 원칙 (사장님 피드백 3연타의 산물):
 *  1) AI 에게 "트렌드를 알아내라"고 시키지 않는다 — 그게 기존 trend-generator 가
 *     원론적 블로그를 물어온 원인. 대신 **사람이 고른 업자용 큐레이션 소스**
 *     (고구마팜·캐릿·소마코·위픽레터 등, 마케터들이 실제 구독하는 곳)만 수집한다.
 *  2) AI 의 역할은 수집물의 "요약·태깅"까지. **가게 버전 대사 개사 금지** —
 *     원본 설명 + 원본 링크 + "적용해보세요" 권유 1문장만. 개그 각은 사장님 몫.
 *  3) 게이트는 코드가: originUrl 은 실제 수집된 URL 만 허용(환각 차단),
 *     발행일 상한(밈 45일·포맷 120일), 필수 필드 없으면 드롭.
 *
 * 저장: marketing_meme_packs (week_key PK, 전역 1행/주) — cron 이 주 1회 생성.
 * 서빙: /api/ai/marketing/meme-pack — 이번주 → 지난주(stale) → 시드 폴백.
 */

// ── 소스 화이트리스트 — 업자용 트렌드 큐레이션 (2026-07-24 검증) ──
// 여기 없는 도메인은 수집하지 않는다. 품질 문제가 생기면 이 목록만 고친다.
export const MEME_SOURCE_DOMAINS = [
  "gogumafarm.kr",     // 고구마팜 — 월간 최신 밈 모음 (더에스엠씨 운영, 마케터용)
  "careet.net",        // 캐릿 — '요즘 뜨는 밈' 시리즈 (트렌드 당일 배송)
  "somako.co.kr",      // 소마코 — 마케터 활용 가능 밈 정리
  "letter.wepick.kr",  // 위픽레터 — 밈 아카이브
  "maily.so",          // 바이럴 믹스 등 사장님 대상 릴스 공식 뉴스레터
] as const;

/** industryFit 에 허용되는 값 — TREND_GROUP_LABELS.categoryId 전집합 + "all". */
export const MEME_FIT_CATEGORIES = [
  "all",
  "food", "cafe-dessert", "retail", "beauty", "fitness", "education",
  "pet", "living-service", "space", "online-digital", "startup-tech",
] as const;

export type MemeItemKind = "meme" | "challenge" | "format";

export type MemeItem = {
  kind: MemeItemKind;             // 밈 | 챌린지 | 릴스·콘텐츠 포맷
  title: string;                  // "천연 위고비" — 원본 이름 그대로
  originDesc: string;             // 원본이 무엇인지 1~2문장 (설명만, 개사 금지)
  originExample?: string;         // 소스 원문에 실린 실제 활용례 인용 (있을 때만)
  originUrl: string;              // 원문 링크 — 수집된 URL 만 (게이트에서 검증)
  sourceName: string;             // "고구마팜"
  publishedAt?: string;           // 소스 발행일 YYYY-MM-DD (신선도 표시·게이트)
  industryFit: string[];          // MEME_FIT_CATEGORIES 부분집합 — 업종 fit 태그
  effortLabel?: string;           // "15초" · "글 1개" 등 짧은 규모 표시
  applyHint: string;              // "사장님 가게 이야기로 적용해보세요" — 권유 1문장, 대사 금지
};

export type MemeSource = { name: string; url: string };

export type MemePack = {
  weekKey: string;
  items: MemeItem[];
  sources: MemeSource[];
  generatedAt: string;
};

/** ISO 주차 키 (YYYY-Www) — KST 기준. cases 라우트·MarketingSurface 와 동일 규약. */
export function getMemeWeekKey(date: Date = new Date()): string {
  const kst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const target = new Date(Date.UTC(kst.getFullYear(), kst.getMonth(), kst.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const jan4 = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target.getTime() - jan4.getTime()) / 86_400_000 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ── 게이트 상수 ──
const MAX_ITEMS = 8;
const MAX_AGE_DAYS: Record<MemeItemKind, number> = {
  meme: 45,        // 밈은 수명이 짧다
  challenge: 45,
  format: 120,     // "3초 명물 컷" 같은 포맷 공식은 오래 유효
};

function str(v: unknown, max = 400): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

function daysSince(dateStr: string, now: Date): number | null {
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 86_400_000);
}

/**
 * LLM 산출물 → MemeItem 정제. 규칙 위반은 드롭(null).
 * @param allowedUrls 수집 단계에서 실제로 확보한 URL 집합 — 여기 없는 originUrl 은 환각으로 간주.
 */
export function sanitizeMemeItem(raw: unknown, allowedUrls: Set<string>, now = new Date()): MemeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind: MemeItemKind | null =
    r.kind === "meme" || r.kind === "challenge" || r.kind === "format" ? r.kind : null;
  const title = str(r.title, 60);
  const originDesc = str(r.originDesc, 300);
  const originUrl = str(r.originUrl, 400);
  const sourceName = str(r.sourceName, 40);
  const applyHint = str(r.applyHint, 80);
  if (!kind || !title || !originDesc || !originUrl || !sourceName || !applyHint) return null;
  if (!/^https?:\/\//i.test(originUrl)) return null;
  if (!allowedUrls.has(originUrl)) return null; // 환각 URL 차단 — 수집물에 없던 링크는 버림
  const publishedAt = str(r.publishedAt, 10);
  if (publishedAt) {
    const age = daysSince(publishedAt, now);
    if (age !== null && age > MAX_AGE_DAYS[kind]) return null; // 시기 지난 소재 드롭
  }
  const fitRaw = Array.isArray(r.industryFit) ? r.industryFit : [];
  const industryFit = fitRaw
    .map((f) => str(f, 30))
    .filter((f): f is string => !!f && (MEME_FIT_CATEGORIES as readonly string[]).includes(f));
  return {
    kind,
    title,
    originDesc,
    originExample: str(r.originExample, 200),
    originUrl,
    sourceName,
    publishedAt,
    industryFit: industryFit.length > 0 ? industryFit : ["all"],
    effortLabel: str(r.effortLabel, 20),
    applyHint,
  };
}

// ── 수집 쿼리 — 화이트리스트 도메인 안에서만 검색 ──
const COLLECT_QUERIES = [
  "요즘 뜨는 밈 최신 밈 모음",
  "릴스 챌린지 유행 포맷 숏폼",
  "가게 홍보 릴스 마케팅 밈 활용",
];

export type CollectMemePackInput = {
  openaiKey: string;
  tavilyKey: string;
  weekKey: string;
};

/**
 * 주간 밈 팩 수집·구조화. 실패(수집 0건·파싱 실패)는 items:[] 로 반환 —
 * 호출자(cron)는 빈 팩을 저장하지 않는다(서빙이 지난주/시드로 폴백).
 */
export async function collectMemePack(input: CollectMemePackInput): Promise<MemePack> {
  const { openaiKey, tavilyKey, weekKey } = input;
  const now = new Date();
  const empty: MemePack = { weekKey, items: [], sources: [], generatedAt: now.toISOString() };

  // 1) 화이트리스트 소스에서 최근 45일 글 수집
  const results: TavilyResult[] = [];
  for (const q of COLLECT_QUERIES) {
    const res = await tavilySearch(tavilyKey, q, {
      maxResults: 8,
      searchDepth: "advanced",
      includeAnswer: false,
      includeDomains: [...MEME_SOURCE_DOMAINS],
      days: 45,
    });
    if (res) results.push(...res.results);
  }
  // URL 중복 제거
  const seen = new Set<string>();
  const docs = results.filter((r) => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  if (docs.length === 0) return empty;

  // 2) LLM 구조화 — 요약·태깅만. 개사 금지.
  const corpus = docs
    .map((d, i) => `[${i + 1}] ${d.title}\nURL: ${d.url}\n발행일: ${d.publishedDate ?? "미상"}\n내용: ${d.content}`)
    .join("\n\n")
    .slice(0, 9000);

  const system = `당신은 한국 소상공인 서비스의 트렌드 큐레이터입니다. [수집자료]는 마케터용 트렌드 매체
(고구마팜·캐릿·소마코·위픽레터 등)에서 가져온 최신 밈·챌린지·릴스 포맷 글입니다.
이를 사장님에게 보여줄 카드 항목(JSON)으로 구조화하세요.

절대 규칙:
- 원본 설명(originDesc)은 그 밈/챌린지가 **무엇인지**만 1~2문장으로. 가게 버전 대사·개사·예시 창작 금지.
- originExample 은 [수집자료] 안에 실제로 적힌 활용례가 있을 때만 그대로 인용. 없으면 생략.
- originUrl 은 반드시 [수집자료]의 URL 중 하나. 새 URL 을 만들지 말 것.
- applyHint 는 "사장님 ○○에 적용해보세요" 식 권유 1문장. 대사·문구를 써주지 말 것.
- 특정 날짜·주간에 묶여 이미 지난 소재(예: 특정 주간 기념 밈)는 제외.
- industryFit: 이 소재가 특히 잘 맞는 업종만 골라 태깅 — ${MEME_FIT_CATEGORIES.join(", ")} 중에서.
  범용이면 ["all"]. 음식점·카페에 맞는 것 최소 1개, startup-tech 에 맞는 것 최소 1개를 포함하도록 노력.
- 최대 ${MAX_ITEMS}개, 신선하고 실행 가능한 것 우선.`;

  const user = `[수집자료]
${corpus}

위 자료의 밈·챌린지·릴스 포맷을 아래 JSON 으로만 응답하세요:
{"items":[{"kind":"meme|challenge|format","title":"원본 이름","originDesc":"원본 설명 1~2문장","originExample":"자료 속 실제 활용례 인용(없으면 생략)","originUrl":"자료의 URL","sourceName":"매체명","publishedAt":"YYYY-MM-DD(자료에 있으면)","industryFit":["food"],"effortLabel":"15초","applyHint":"사장님 ○○에 적용해보세요"}]}`;

  const client = new OpenAI({ apiKey: openaiKey, timeout: 55_000 });
  const r = await client.chat.completions.create({
    // 2026-07-27 gpt-5.6-terra 전환 (주 1회 전역이라 비용 무시 수준, 큐레이션 판단력 우선).
    //  5.6 계열은 temperature 미지원(400) — 제거. 추론 토큰 여유 +400.
    model: "gpt-5.6-terra",
    reasoning_effort: "low",
    max_completion_tokens: 2600,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  console.info("[ai-cost] meme-pack", JSON.stringify({ model: "gpt-5.6-terra", in: r.usage?.prompt_tokens, out: r.usage?.completion_tokens }));

  let parsed: { items?: unknown[] };
  try {
    parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}");
  } catch {
    console.warn("[marketing-memes] JSON parse failed");
    return empty;
  }

  const allowedUrls = new Set(docs.map((d) => d.url));
  const items = (Array.isArray(parsed.items) ? parsed.items : [])
    .map((it) => sanitizeMemeItem(it, allowedUrls, now))
    .filter((it): it is MemeItem => it !== null)
    .slice(0, MAX_ITEMS);

  const usedUrls = new Set(items.map((it) => it.originUrl));
  const sources: MemeSource[] = docs
    .filter((d) => usedUrls.has(d.url))
    .map((d) => ({ name: d.title.slice(0, 60), url: d.url }));

  return { weekKey, items, sources, generatedAt: now.toISOString() };
}

/**
 * 크론 진입점 — 이번 주 팩이 없을 때만 수집해 저장(멱등: 매일 도는 크론에서 호출해도
 * 실제 작업은 주 1회). 수집 결과가 3개 미만이면 저장하지 않는다 — 서빙이
 * 지난주/시드로 폴백하며, 빈 팩으로 덮어써 좋은 팩을 밀어내는 사고를 막는다.
 */
export async function buildWeeklyMemePack(
  supabase: SupabaseClient,
  input: { openaiKey: string; tavilyKey: string; weekKey: string; force?: boolean },
): Promise<{ status: "exists" | "saved" | "skipped-thin" | "error"; itemCount: number; error?: string }> {
  const { weekKey, force } = input;
  try {
    if (!force) {
      const { data: existing } = await supabase
        .from("marketing_meme_packs")
        .select("week_key, items")
        .eq("week_key", weekKey)
        .maybeSingle();
      if (existing && Array.isArray(existing.items) && existing.items.length > 0) {
        return { status: "exists", itemCount: existing.items.length };
      }
    }

    const pack = await collectMemePack(input);
    if (pack.items.length < 3) {
      return { status: "skipped-thin", itemCount: pack.items.length };
    }

    const { error } = await supabase.from("marketing_meme_packs").upsert(
      {
        week_key: weekKey,
        items: pack.items,
        sources: pack.sources,
        generated_at: pack.generatedAt,
        updated_at: pack.generatedAt,
      },
      { onConflict: "week_key" },
    );
    if (error) return { status: "error", itemCount: pack.items.length, error: error.message };
    return { status: "saved", itemCount: pack.items.length };
  } catch (err) {
    return { status: "error", itemCount: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
