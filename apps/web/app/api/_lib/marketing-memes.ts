import OpenAI from "openai";
import { parseLlmJson } from "@foundone/ai/utils/parse-json";
import { withOpenAiFallback, OPENAI_SDK_MAX_RETRIES } from "./openai-fallback";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tavilySearch } from "./tavily";
import { fetchRssEntries } from "./rss";

/**
 * 주간 밈·챌린지 팩 — 수집·구조화·게이트 (2026-07-24 신설 · 2026-09-12 피드 기반 전면 교체).
 *
 * 설계 원칙 (사장님 피드백 3연타의 산물):
 *  1) AI 에게 "트렌드를 알아내라"고 시키지 않는다 — 그게 기존 trend-generator(2026-08-03 삭제)가
 *     원론적 블로그를 물어온 원인. 대신 **사람이 고른 업자용 큐레이션 소스**
 *     (고구마팜·캐릿·소마코·위픽레터 등, 마케터들이 실제 구독하는 곳)만 수집한다.
 *  2) AI 의 역할은 수집물의 "요약·태깅"까지. **가게 버전 대사 개사 금지** —
 *     원본 설명 + 원본 링크 + "적용해보세요" 권유 1문장만. 개그 각은 사장님 몫.
 *  3) 게이트는 코드가: originUrl 은 실제 수집된 URL 만 허용(환각 차단),
 *     발행일 상한(밈 45일·포맷 120일), 필수 필드 없으면 드롭.
 *
 * ── 2026-09-12 재설계 (프로드 실측 후) ──────────────────────────────────
 *  문제(측정된 것): Tavily 검색이 매주 같은 상위 글을 돌려줘 고구마팜 2026-08-26 "8월 최신 밈 모음"이
 *   17일간 팩에 없었고, 6월 글이 매주 addedAt 만 새로 찍혀 "NEW" 로 재등장했다. 수집물의 publishedDate 가
 *   대부분 비어 발행일 게이트가 무력했다(W33~W37 팩 항목 대부분 pub=?).
 *  고친 것:
 *   · **RSS 우선** — 매체 최신 글 목록을 시간순으로 직접 읽는다(gogumafarm·somako 검증 완료).
 *     RSS 가 없는 매체(careet·wepick·maily)만 Tavily 로 보조.
 *   · **발행일은 코드가 소유** — LLM 산출물의 publishedAt 을 믿지 않고 피드 pubDate 로 덮어쓴다.
 *     발행일을 못 구한 소재는 드롭(신선도 표기가 거짓이 되지 않게).
 *   · **전역 중복 제거** — 최근 8주 팩의 originUrl 전체를 제외 목록으로 쓴다. 같은 글이 다시 NEW 가 되지 않는다.
 *   · **저장 시 만료 정리** — 새 소재를 쓸 때 기존 팩에서 수명 지난 항목을 함께 걷어낸다.
 *
 * 저장: marketing_meme_packs (week_key PK, 전역 1행/주) — cron 이 매일 호출, 새 글이 있을 때만 LLM.
 * 서빙: /api/ai/marketing/meme-pack — 이번주 → 지난주(stale) → 시드 폴백.
 */

// ── 소스 ① RSS 피드 (주력) — 2026-09-12 직접 호출로 200·pubDate 확인 ──
export const MEME_SOURCE_FEEDS = [
  { name: "고구마팜", feedUrl: "https://gogumafarm.kr/category/trends/feed/", domain: "gogumafarm.kr" },
  { name: "소마코", feedUrl: "https://somako.co.kr/feed/", domain: "somako.co.kr" },
] as const;

// ── 소스 ② RSS 가 없는 매체 (보조, Tavily 검색) — 404·HTML 리다이렉트 확인(2026-09-12) ──
export const MEME_SEARCH_DOMAINS = [
  "careet.net",        // 캐릿 — '요즘 뜨는 밈' 시리즈
  "letter.wepick.kr",  // 위픽레터 — 밈 아카이브
  "maily.so",          // 바이럴 믹스 등 사장님 대상 릴스 공식 뉴스레터
] as const;

/** 화이트리스트 전체(피드 + 검색) — 이 도메인 밖은 수집하지 않는다. */
export const MEME_SOURCE_DOMAINS = [
  ...MEME_SOURCE_FEEDS.map((f) => f.domain),
  ...MEME_SEARCH_DOMAINS,
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
  publishedAt?: string;           // 소스 발행일 YYYY-MM-DD — 코드가 피드에서 찍는다(LLM 산출물 아님)
  industryFit: string[];          // MEME_FIT_CATEGORIES 부분집합 — 업종 fit 태그
  effortLabel?: string;           // "15초" · "글 1개" 등 짧은 규모 표시
  applyHint: string;              // "사장님 가게 이야기로 적용해보세요" — 권유 1문장, 대사 금지
  /** 팩에 추가된 날짜 (YYYY-MM-DD) — 코드가 찍는다. UI "NEW" 배지용. */
  addedAt?: string;
};

export type MemeSource = { name: string; url: string };

export type MemePack = {
  weekKey: string;
  items: MemeItem[];
  sources: MemeSource[];
  generatedAt: string;
};

/** 수집된 원문 1건 — 피드/검색 공통 형태. publishedAt 은 필수(없으면 수집 단계에서 드롭). */
export type CollectedDoc = {
  url: string;
  title: string;
  content: string;
  publishedAt: string;
  sourceName: string;
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

/** weekKey 에서 N주 전 키 — 전역 중복 제거용 조회 범위. */
export function previousWeekKeys(weekKey: string, count: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= count; i++) keys.push(getMemeWeekKey(new Date(now.getTime() - i * 7 * 86_400_000)));
  return keys.filter((k) => k !== weekKey);
}

// ── 게이트 상수 ──
const MAX_ITEMS = 8;
const MAX_AGE_DAYS: Record<MemeItemKind, number> = {
  meme: 45,        // 밈은 수명이 짧다
  challenge: 45,
  format: 120,     // "3초 명물 컷" 같은 포맷 공식은 오래 유효
};
/** 수집 창 — 이보다 오래된 글은 아예 읽지 않는다. 항목별 수명은 MAX_AGE_DAYS 가 다시 건다. */
const COLLECT_MAX_AGE_DAYS = 60;
/** 한 번에 LLM 에 넘길 원문 수 상한. */
const MAX_DOCS_PER_RUN = 6;
/** 이 수보다 적으면 주간 팩을 새로 저장하지 않는다(지난주/시드 폴백이 낫다). */
const MIN_PACK_ITEMS = 3;
/** 전역 중복 제거에 쓸 과거 주 수. */
const DEDUPE_LOOKBACK_WEEKS = 8;

function str(v: unknown, max = 400): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

function daysSince(dateStr: string, now: Date): number | null {
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 86_400_000);
}

/** 항목 수명 판정 — 발행일이 없거나 수명을 넘겼으면 false. */
export function isItemFresh(item: Pick<MemeItem, "kind" | "publishedAt">, now: Date = new Date()): boolean {
  if (!item.publishedAt) return false;
  const age = daysSince(item.publishedAt, now);
  if (age === null) return false;
  return age <= MAX_AGE_DAYS[item.kind];
}

/**
 * LLM 산출물 → MemeItem 정제. 규칙 위반은 드롭(null).
 * @param docByUrl 수집 단계에서 실제로 확보한 원문 — 여기 없는 originUrl 은 환각으로 간주.
 *                 발행일·매체명은 **이 원문에서 코드가 찍는다**(LLM 산출물 무시).
 */
export function sanitizeMemeItem(
  raw: unknown,
  docByUrl: Map<string, CollectedDoc>,
  now = new Date(),
): MemeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind: MemeItemKind | null =
    r.kind === "meme" || r.kind === "challenge" || r.kind === "format" ? r.kind : null;
  const title = str(r.title, 60);
  const originDesc = str(r.originDesc, 300);
  const originUrl = str(r.originUrl, 400);
  const applyHint = str(r.applyHint, 80);
  if (!kind || !title || !originDesc || !originUrl || !applyHint) return null;
  if (!/^https?:\/\//i.test(originUrl)) return null;
  const doc = docByUrl.get(originUrl);
  if (!doc) return null; // 환각 URL 차단 — 수집물에 없던 링크는 버림

  // 발행일·매체명은 원문(피드)이 진실. LLM 이 뭐라 적었든 덮어쓴다.
  const publishedAt = doc.publishedAt;
  const sourceName = doc.sourceName;
  if (!isItemFresh({ kind, publishedAt }, now)) return null; // 시기 지난 소재 드롭

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

// ── 수집 ──────────────────────────────────────────────────────────────

/** 밈·챌린지·포맷 글일 가능성이 높은 제목 신호 — 코퍼스 예산을 이런 글에 먼저 쓴다(하드 필터 아님). */
const RELEVANCE_HINT = /밈|챌린지|릴스|숏폼|포맷|유행|트렌드|meme|challenge|reels/i;

/** RSS 없는 매체용 검색 쿼리. */
const SEARCH_QUERIES = [
  "요즘 뜨는 밈 최신 밈 모음",
  "릴스 챌린지 유행 포맷 숏폼",
];

/**
 * 신규 원문 수집 — 피드 우선, 부족하면 검색 보조.
 *  · 발행일 없는 글은 제외(신선도 표기의 근거가 없으므로)
 *  · knownUrls(최근 주 팩에 이미 쓴 링크) 제외 → 같은 글이 다시 NEW 가 되지 않는다
 */
export async function collectNewDocs(opts: {
  tavilyKey?: string;
  knownUrls: Set<string>;
  now?: Date;
  maxDocs?: number;
}): Promise<CollectedDoc[]> {
  const now = opts.now ?? new Date();
  const maxDocs = opts.maxDocs ?? MAX_DOCS_PER_RUN;
  const out: CollectedDoc[] = [];
  const seen = new Set<string>(opts.knownUrls);

  const accept = (doc: CollectedDoc): boolean => {
    if (seen.has(doc.url)) return false;
    const age = daysSince(doc.publishedAt, now);
    if (age === null || age > COLLECT_MAX_AGE_DAYS || age < -1) return false;
    seen.add(doc.url);
    out.push(doc);
    return true;
  };

  // ① RSS — 매체 최신 글을 시간순으로
  const feeds = await Promise.all(
    MEME_SOURCE_FEEDS.map(async (f) => ({ name: f.name, entries: await fetchRssEntries(f.feedUrl) })),
  );
  for (const feed of feeds) {
    for (const e of feed.entries) {
      if (out.length >= maxDocs) break;
      if (!e.publishedAt) continue;
      accept({ url: e.url, title: e.title, content: e.content, publishedAt: e.publishedAt, sourceName: feed.name });
    }
  }

  // ② 보조 검색 — RSS 없는 매체만. 발행일 없는 결과는 버린다.
  if (out.length < maxDocs && opts.tavilyKey) {
    for (const q of SEARCH_QUERIES) {
      if (out.length >= maxDocs) break;
      const res = await tavilySearch(opts.tavilyKey, q, {
        maxResults: 5,
        searchDepth: "advanced",
        includeAnswer: false,
        includeDomains: [...MEME_SEARCH_DOMAINS],
        days: COLLECT_MAX_AGE_DAYS,
      });
      for (const item of res?.results ?? []) {
        if (out.length >= maxDocs) break;
        const publishedAt = item.publishedDate ? item.publishedDate.slice(0, 10) : null;
        if (!publishedAt) continue;
        let host = item.url;
        try { host = new URL(item.url).hostname.replace(/^www\./, ""); } catch { /* keep */ }
        accept({ url: item.url, title: item.title, content: item.content, publishedAt, sourceName: host });
      }
    }
  }

  // 밈·챌린지 글을 앞으로 — 뒤에서 코퍼스가 잘릴 때 굿즈·크리에이터 목록이 자리를 차지하지 않게.
  out.sort((a, b) => {
    const ra = RELEVANCE_HINT.test(a.title) ? 1 : 0;
    const rb = RELEVANCE_HINT.test(b.title) ? 1 : 0;
    if (ra !== rb) return rb - ra;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
  return out;
}

/** LLM 구조화 — 수집 원문 → 정제된 MemeItem[]. 게이트(sanitize)까지 통과한 것만. */
export async function structureMemeDocs(openaiKey: string, docs: CollectedDoc[], now: Date): Promise<MemeItem[]> {
  if (docs.length === 0) return [];
  const corpus = docs
    .map((d, i) => `[${i + 1}] ${d.title}\nURL: ${d.url}\n매체: ${d.sourceName}\n발행일: ${d.publishedAt}\n내용: ${d.content}`)
    .join("\n\n")
    // 밈 모음 글은 한 편에 소재가 5개씩 들어 있다 — 예산을 넉넉히(하루 1회 전역 호출이라 비용 무시 수준).
    .slice(0, 16_000);

  const system = `당신은 한국 소상공인 서비스의 트렌드 큐레이터입니다. [수집자료]는 마케터용 트렌드 매체
(고구마팜·캐릿·소마코·위픽레터 등)의 **최신 글**입니다. 이를 사장님에게 보여줄 카드 항목(JSON)으로 구조화하세요.

절대 규칙:
- 한 글에 밈·챌린지·포맷이 여러 개 실려 있으면 **각각을 별도 항목으로** 뽑는다(글 1개 = 항목 1개가 아니다).
- 원본 설명(originDesc)은 그 밈/챌린지가 **무엇인지**만 1~2문장으로. 가게 버전 대사·개사·예시 창작 금지.
- originExample 은 [수집자료] 안에 실제로 적힌 활용례(브랜드 사례 등)가 있을 때만 그대로 인용. 없으면 생략.
- originUrl 은 반드시 [수집자료]의 URL 중 하나. 새 URL 을 만들지 말 것.
- applyHint 는 "사장님 ○○에 적용해보세요" 식 권유 1문장. 대사·문구를 써주지 말 것.
- 밈·챌린지·릴스 포맷이 **아닌** 글(굿즈 목록·크리에이터 소개·시장 분석 등)은 항목으로 만들지 말 것.
- 특정 날짜·주간에 묶여 이미 지난 소재(예: 특정 주간 기념 밈)는 제외.
- industryFit: 이 소재가 특히 잘 맞는 업종만 골라 태깅 — ${MEME_FIT_CATEGORIES.join(", ")} 중에서.
  범용이면 ["all"]. 음식점·카페에 맞는 것 최소 1개, startup-tech 에 맞는 것 최소 1개를 포함하도록 노력.
- 최대 ${MAX_ITEMS}개, 신선하고 실행 가능한 것 우선.`;

  const user = `[수집자료]
${corpus}

위 자료의 밈·챌린지·릴스 포맷을 아래 JSON 으로만 응답하세요:
{"items":[{"kind":"meme|challenge|format","title":"원본 이름","originDesc":"원본 설명 1~2문장","originExample":"자료 속 실제 활용례 인용(없으면 생략)","originUrl":"자료의 URL","industryFit":["food"],"effortLabel":"15초","applyHint":"사장님 ○○에 적용해보세요"}]}`;

  // SDK 재시도 3 + 일시 오류 시 gpt-5.4-mini 폴백 (2026-08-19). response_format json_object 필요라 OpenAI 직접 호출 유지.
  const client = new OpenAI({ apiKey: openaiKey, timeout: 55_000, maxRetries: OPENAI_SDK_MAX_RETRIES });
  const r = await withOpenAiFallback("gpt-5.6-terra", (model) => client.chat.completions.create({
    // 2026-07-27 gpt-5.6-terra 전환 (주 1회 전역이라 비용 무시 수준, 큐레이션 판단력 우선).
    //  5.6 계열은 temperature 미지원(400) — 제거. 추론 토큰 여유 +400.
    model,
    reasoning_effort: "low",
    max_completion_tokens: 2600,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  }), "[marketing-memes]");

  console.info("[ai-cost] meme-pack", JSON.stringify({ model: r.model, in: r.usage?.prompt_tokens, out: r.usage?.completion_tokens }));

  let parsed: { items?: unknown[] };
  try {
    const content = r.choices[0]?.message?.content ?? "";
    // robust 4단계 파서(strict → loose → damage fix → truncated repair)
    parsed = content.trim() ? parseLlmJson<{ items?: unknown[] }>(content) : {};
  } catch {
    console.warn("[marketing-memes] JSON parse failed");
    return [];
  }

  const docByUrl = new Map(docs.map((d) => [d.url, d]));
  return (Array.isArray(parsed.items) ? parsed.items : [])
    .map((it) => sanitizeMemeItem(it, docByUrl, now))
    .filter((it): it is MemeItem => it !== null)
    .slice(0, MAX_ITEMS);
}

// ── 크론 진입점 ────────────────────────────────────────────────────────

type PackRow = { week_key: string; items: MemeItem[]; sources: MemeSource[]; generated_at: string; updated_at?: string };

/** 하루 1회 가드 — 크론 외 수동 호출이 겹쳐도 같은 날 두 번 수집하지 않는다. */
const RUN_MIN_INTERVAL_HOURS = 20;
/** 팩 보관 상한 — 서빙은 fit 정렬 후 6개. */
const MAX_PACK_ITEMS = 12;

/**
 * 크론 진입점 (매일 08:00 KST 호출).
 *  1) 최근 8주 팩의 링크를 모아 제외 목록(전역 중복 제거)
 *  2) 피드에서 **아직 소개하지 않은 최신 글**만 수집 — 없으면 LLM 호출 0 (비용 0)
 *  3) 구조화 → addedAt 찍어 팩 앞에 추가, 같은 저장에서 수명 지난 기존 항목 정리
 *  4) 이번 주 팩이 없고 결과가 3개 미만이면 저장하지 않는다(지난주/시드 폴백이 낫다)
 */
export async function buildWeeklyMemePack(
  supabase: SupabaseClient,
  input: { openaiKey: string; tavilyKey?: string; weekKey: string; force?: boolean; now?: Date },
): Promise<{ status: "exists" | "saved" | "topped-up" | "skipped-thin" | "error"; itemCount: number; error?: string }> {
  const { weekKey, force } = input;
  const now = input.now ?? new Date();
  try {
    // ── 1) 이번 주 + 최근 주 팩 조회 ──
    const lookback = previousWeekKeys(weekKey, DEDUPE_LOOKBACK_WEEKS, now);
    const { data, error: readErr } = await supabase
      .from("marketing_meme_packs")
      .select("week_key, items, sources, generated_at, updated_at")
      .in("week_key", [weekKey, ...lookback]);
    if (readErr) return { status: "error", itemCount: 0, error: readErr.message };

    const rows = (data ?? []) as PackRow[];
    const current = rows.find((r) => r.week_key === weekKey);
    const currentItems = Array.isArray(current?.items) ? current.items : [];

    // 같은 날 재실행 방지 (force 면 무시)
    if (!force && current?.updated_at) {
      const last = Date.parse(current.updated_at);
      if (Number.isFinite(last) && now.getTime() - last < RUN_MIN_INTERVAL_HOURS * 3_600_000) {
        return { status: "exists", itemCount: currentItems.length };
      }
    }

    // ── 2) 전역 중복 제거 목록 — 최근 8주에 한 번이라도 소개한 링크는 다시 쓰지 않는다 ──
    const knownUrls = new Set<string>();
    if (!force) {
      for (const row of rows) {
        for (const it of Array.isArray(row.items) ? row.items : []) {
          if (it?.originUrl) knownUrls.add(it.originUrl);
        }
      }
    }

    const docs = await collectNewDocs({ tavilyKey: input.tavilyKey, knownUrls, now });
    if (docs.length === 0) {
      // 새 글 없음 — LLM 비용 0. 기존 팩 유지.
      return { status: currentItems.length > 0 ? "exists" : "skipped-thin", itemCount: currentItems.length };
    }

    // ── 3) 구조화 ──
    const structured = await structureMemeDocs(input.openaiKey, docs, now);
    const today = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    const fresh = structured
      .filter((it) => !knownUrls.has(it.originUrl))
      .map((it) => ({ ...it, addedAt: today }));
    if (fresh.length === 0) {
      return { status: currentItems.length > 0 ? "exists" : "skipped-thin", itemCount: currentItems.length };
    }

    // 기존 항목 중 수명이 끝난 것은 이 기회에 정리 (6월 소재가 9월까지 남던 문제)
    const kept = currentItems.filter((it) => isItemFresh(it, now));
    const merged = [...fresh, ...kept]
      .filter((it, i, arr) => arr.findIndex((x) => x.originUrl === it.originUrl && x.title === it.title) === i)
      .slice(0, MAX_PACK_ITEMS);

    const isNewWeek = !current || currentItems.length === 0;
    if (isNewWeek && merged.length < MIN_PACK_ITEMS) {
      return { status: "skipped-thin", itemCount: merged.length };
    }

    // ── 4) 저장 — sources 는 실제 채택된 링크만 ──
    const usedUrls = new Set(merged.map((it) => it.originUrl));
    const freshSources: MemeSource[] = docs
      .filter((d) => usedUrls.has(d.url))
      .map((d) => ({ name: `${d.sourceName} — ${d.title}`.slice(0, 80), url: d.url }));
    const mergedSources = [...freshSources, ...(current?.sources ?? [])]
      .filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i)
      .filter((s) => usedUrls.has(s.url));

    const nowIso = now.toISOString();
    const { error } = await supabase.from("marketing_meme_packs").upsert(
      {
        week_key: weekKey,
        items: merged,
        sources: mergedSources,
        generated_at: current?.generated_at ?? nowIso,
        updated_at: nowIso,
      },
      { onConflict: "week_key" },
    );
    if (error) return { status: "error", itemCount: merged.length, error: error.message };
    return { status: isNewWeek ? "saved" : "topped-up", itemCount: merged.length };
  } catch (err) {
    return { status: "error", itemCount: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
