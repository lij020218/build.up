/**
 * rss.ts — RSS 2.0 / Atom 최소 파서 (외부 의존성 0).
 *
 * 왜 검색이 아니라 피드인가 (2026-09-12 냉정 점검의 결론):
 *   밈 팩 수집이 Tavily 검색(`includeDomains`)에 의존하던 동안, 검색은 매주 같은 상위 글을
 *   돌려줬다. 프로드 실측: 고구마팜이 2026-08-26 에 올린 "8월 최신 밈 모음"이 17일 지나도록
 *   팩에 없었고, 6월 글이 매주 "NEW" 로 재등장했다. 발행일(publishedDate)도 대부분 비어 있어
 *   "45일 지난 소재 드롭" 게이트가 사실상 꺼져 있었다.
 *
 *   피드는 그 두 문제를 원천에서 없앤다 — **최신 글이 시간순으로**, **pubDate 가 항상** 온다.
 *
 * 검증(2026-09-12 직접 호출):
 *   · https://gogumafarm.kr/category/trends/feed/ → 200 RSS, 12 items, pubDate 정확, 8/26 글이 최상단
 *   · https://somako.co.kr/feed/                  → 200 RSS
 *   · careet.net / letter.wepick.kr / maily.so    → RSS 없음(404·HTML 리다이렉트) → Tavily 보조 유지
 *
 * 안전장치: https 강제 · 12초 타임아웃 · 2MB 상한 · 리다이렉트 추적 금지 · 실패 시 빈 배열(호출부 무중단).
 */

export type RssEntry = {
  title: string;
  url: string;
  /** YYYY-MM-DD (KST). pubDate 가 없거나 파싱 실패면 null — 호출부가 드롭 판단. */
  publishedAt: string | null;
  /** 본문 요약(HTML 태그 제거). */
  content: string;
};

const TIMEOUT_MS = 12_000;
const MAX_BYTES = 2_000_000;
const DEFAULT_LIMIT = 15;
/** 본문 보존 길이 — 밈 모음 글 1건에 소재가 5개씩 들어 있어 짧게 자르면 뒤쪽 소재를 통째로 놓친다
 *  (2026-09-12 실측: 1,200자로 자르니 8월 밈 5개 중 2개만 추출됐다). */
const CONTENT_CHARS = 4_000;

/** XML/HTML 엔티티 최소 디코드 — 피드 제목·본문에 실제로 나오는 것들만. */
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&"); // 반드시 마지막 — 이중 인코딩 복원
}

function stripHtml(s: string): string {
  return decodeEntities(
    s
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** 블록에서 태그 하나를 뽑는다. CDATA 우선. */
function pickTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = re.exec(block);
  if (!m) return null;
  const raw = m[1];
  const cdata = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(raw);
  return (cdata ? cdata[1] : raw).trim();
}

/** Atom 의 <link href="..."/> 형태. */
function pickAtomLink(block: string): string | null {
  const m = /<link[^>]*\shref=["']([^"']+)["'][^>]*\/?>/i.exec(block);
  return m ? m[1].trim() : null;
}

/** pubDate → KST 기준 YYYY-MM-DD. 파싱 실패면 null. */
export function toKstDateString(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = Date.parse(raw.trim());
  if (Number.isNaN(t)) return null;
  // sv-SE 로케일이 YYYY-MM-DD 형식을 준다 (Asia/Seoul 기준으로 환산).
  return new Date(t).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/**
 * 피드 URL → 최신 항목 목록. 실패(네트워크·비XML·빈 피드)는 빈 배열 —
 * 수집 파이프라인이 한 매체 장애로 통째로 멈추지 않게 한다.
 */
export async function fetchRssEntries(feedUrl: string, opts: { limit?: number } = {}): Promise<RssEntry[]> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  let parsed: URL;
  try {
    parsed = new URL(feedUrl);
  } catch {
    return [];
  }
  if (parsed.protocol !== "https:") return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let xml = "";
  try {
    const res = await fetch(feedUrl, {
      method: "GET",
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "foundone-trend-collector/1.0 (+https://found.one)",
      },
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    if (!res.ok) return [];
    const len = Number(res.headers.get("content-length") ?? "0");
    if (Number.isFinite(len) && len > MAX_BYTES) return [];
    xml = (await res.text()).slice(0, MAX_BYTES);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }

  if (!xml.includes("<item") && !xml.includes("<entry")) return [];

  const blocks = [
    ...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi),
  ].map((m) => m[1]);

  const out: RssEntry[] = [];
  const seen = new Set<string>();
  for (const block of blocks) {
    const title = pickTag(block, "title");
    const link = pickTag(block, "link") || pickAtomLink(block);
    if (!title || !link) continue;
    const url = decodeEntities(link).trim();
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    const publishedAt =
      toKstDateString(pickTag(block, "pubDate")) ??
      toKstDateString(pickTag(block, "published")) ??
      toKstDateString(pickTag(block, "updated")) ??
      toKstDateString(pickTag(block, "dc:date"));
    const body = pickTag(block, "content:encoded") ?? pickTag(block, "description") ?? pickTag(block, "summary") ?? "";
    out.push({
      title: stripHtml(title).slice(0, 200),
      url,
      publishedAt,
      content: stripHtml(body).slice(0, CONTENT_CHARS),
    });
    if (out.length >= limit) break;
  }
  return out;
}
