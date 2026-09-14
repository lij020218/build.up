// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchRssEntries, toKstDateString } from "../app/api/_lib/rss";
import {
  isItemFresh,
  sanitizeMemeItem,
  previousWeekKeys,
  getMemeWeekKey,
  MEME_SOURCE_FEEDS,
  MEME_SOURCE_DOMAINS,
  type CollectedDoc,
} from "../app/api/_lib/marketing-memes";

/**
 * 밈 팩 수집기 회귀 가드 (2026-09-12).
 *
 * 이 테스트가 막는 것 — 전부 프로드에서 실제로 났던 일이다:
 *  ① 발행일 없는 소재가 팩에 들어가 "신선도" 표기가 거짓이 되는 것
 *     (W33~W37 팩 항목 대부분 publishedAt 누락 → 45일 게이트가 꺼져 있었다)
 *  ② LLM 이 적어낸 발행일·매체명을 그대로 믿는 것 → 코드가 피드 pubDate 로 덮어써야 한다
 *  ③ 수집물에 없던 URL(환각)이 원본 링크로 나가는 것
 *  ④ 수명이 지난 소재가 계속 노출되는 것 (6월 밈이 9월까지 남아 있었다)
 */

const FEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>고구마팜</title>
  <item>
    <title><![CDATA[대박삐? 삐바삐? 밈잘알삐 만들어 주는 [2026년 8월 최신 밈 모음]]]></title>
    <link>https://gogumafarm.kr/meme-2026-08/</link>
    <pubDate>Wed, 26 Aug 2026 01:00:00 +0000</pubDate>
    <description><![CDATA[<p>요약 &amp; 소개</p>]]></description>
    <content:encoded><![CDATA[<p>면접 포기하겠습니다 밈은 <strong>결정을 번복</strong>하는 상황에 씁니다.</p>]]></content:encoded>
  </item>
  <item>
    <title>날짜 없는 글</title>
    <link>https://gogumafarm.kr/no-date/</link>
    <description>본문</description>
  </item>
  <item>
    <title>자정 직전 발행 (UTC)</title>
    <link>https://gogumafarm.kr/kst-edge/</link>
    <pubDate>Tue, 25 Aug 2026 16:30:00 +0000</pubDate>
    <description>KST 로는 8월 26일</description>
  </item>
</channel>
</rss>`;

function mockFetchOnce(body: string, init: { status?: number; contentLength?: string } = {}) {
  const headers = new Headers();
  if (init.contentLength) headers.set("content-length", init.contentLength);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: init.status ?? 200, headers })));
}

afterEach(() => vi.unstubAllGlobals());

describe("RSS 파서", () => {
  it("CDATA 제목·본문을 풀고, content:encoded 를 description 보다 우선한다", async () => {
    mockFetchOnce(FEED_XML);
    const entries = await fetchRssEntries("https://gogumafarm.kr/category/trends/feed/");
    expect(entries).toHaveLength(3);
    expect(entries[0].title).toContain("2026년 8월 최신 밈 모음");
    expect(entries[0].url).toBe("https://gogumafarm.kr/meme-2026-08/");
    expect(entries[0].content).toContain("면접 포기하겠습니다");
    expect(entries[0].content).not.toContain("<strong>");
    expect(entries[0].content).not.toContain("요약"); // description 이 아니라 content:encoded
  });

  it("pubDate 를 KST 날짜로 변환하고, 없으면 null 로 남긴다", async () => {
    mockFetchOnce(FEED_XML);
    const entries = await fetchRssEntries("https://gogumafarm.kr/category/trends/feed/");
    expect(entries[0].publishedAt).toBe("2026-08-26");
    expect(entries[1].publishedAt).toBeNull();
    // UTC 8/25 16:30 = KST 8/26 01:30 — 한국 매체 기준 날짜로 찍혀야 한다
    expect(entries[2].publishedAt).toBe("2026-08-26");
  });

  it("toKstDateString — 파싱 불가·빈 값은 null", () => {
    expect(toKstDateString(null)).toBeNull();
    expect(toKstDateString("어제")).toBeNull();
    expect(toKstDateString("2026-09-12T00:00:00Z")).toBe("2026-09-12");
  });

  it("http 응답 실패·비XML·http 스킴은 빈 배열 (한 매체 장애가 수집을 멈추지 않는다)", async () => {
    mockFetchOnce("nope", { status: 500 });
    expect(await fetchRssEntries("https://gogumafarm.kr/feed/")).toEqual([]);
    mockFetchOnce("<html><body>not a feed</body></html>");
    expect(await fetchRssEntries("https://gogumafarm.kr/feed/")).toEqual([]);
    expect(await fetchRssEntries("http://insecure.example/feed")).toEqual([]);
  });
});

describe("수명 게이트", () => {
  const now = new Date("2026-09-12T00:00:00+09:00");

  it("발행일이 없으면 신선하지 않다 (표기 근거가 없으므로)", () => {
    expect(isItemFresh({ kind: "meme", publishedAt: undefined }, now)).toBe(false);
  });

  it("밈·챌린지 45일, 포맷 120일", () => {
    expect(isItemFresh({ kind: "meme", publishedAt: "2026-08-26" }, now)).toBe(true);   // 17일
    expect(isItemFresh({ kind: "meme", publishedAt: "2026-07-01" }, now)).toBe(false);  // 73일
    expect(isItemFresh({ kind: "challenge", publishedAt: "2026-06-10" }, now)).toBe(false);
    expect(isItemFresh({ kind: "format", publishedAt: "2026-07-01" }, now)).toBe(true); // 73일 < 120
  });
});

describe("sanitizeMemeItem — 발행일·매체명은 코드가 소유", () => {
  const now = new Date("2026-09-12T00:00:00+09:00");
  const doc: CollectedDoc = {
    url: "https://gogumafarm.kr/meme-2026-08/",
    title: "8월 최신 밈 모음",
    content: "본문",
    publishedAt: "2026-08-26",
    sourceName: "고구마팜",
  };
  const docByUrl = new Map([[doc.url, doc]]);
  const base = {
    kind: "meme",
    title: "삐에로 밈",
    originDesc: "삐에로를 줄여 부르는 밈.",
    originUrl: doc.url,
    applyHint: "사장님 메뉴 소개에 적용해보세요",
    industryFit: ["food"],
  };

  it("LLM 이 적어낸 발행일·매체명을 무시하고 원문 값으로 덮어쓴다", () => {
    const item = sanitizeMemeItem({ ...base, publishedAt: "2026-01-01", sourceName: "아무데나" }, docByUrl, now);
    expect(item?.publishedAt).toBe("2026-08-26");
    expect(item?.sourceName).toBe("고구마팜");
  });

  it("수집물에 없던 URL(환각)은 드롭", () => {
    expect(sanitizeMemeItem({ ...base, originUrl: "https://example.com/made-up" }, docByUrl, now)).toBeNull();
  });

  it("원문이 수명을 넘겼으면 드롭", () => {
    const old: CollectedDoc = { ...doc, url: "https://gogumafarm.kr/june/", publishedAt: "2026-06-10" };
    const map = new Map([[old.url, old]]);
    expect(sanitizeMemeItem({ ...base, originUrl: old.url }, map, now)).toBeNull();
  });

  it("필수 필드 누락·미지원 kind 는 드롭", () => {
    expect(sanitizeMemeItem({ ...base, kind: "news" }, docByUrl, now)).toBeNull();
    expect(sanitizeMemeItem({ ...base, applyHint: "" }, docByUrl, now)).toBeNull();
  });

  it("industryFit 은 허용 목록만 남기고, 비면 all", () => {
    const item = sanitizeMemeItem({ ...base, industryFit: ["food", "우주항공"] }, docByUrl, now);
    expect(item?.industryFit).toEqual(["food"]);
    expect(sanitizeMemeItem({ ...base, industryFit: ["우주항공"] }, docByUrl, now)?.industryFit).toEqual(["all"]);
  });
});

describe("전역 중복 제거 범위", () => {
  it("previousWeekKeys — 이번 주를 빼고 과거 N주를 준다", () => {
    const now = new Date("2026-09-12T00:00:00+09:00");
    const thisWeek = getMemeWeekKey(now);
    const keys = previousWeekKeys(thisWeek, 8, now);
    expect(keys).not.toContain(thisWeek);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(getMemeWeekKey(new Date(now.getTime() - 7 * 86_400_000)));
    expect(keys.length).toBeGreaterThanOrEqual(7);
  });
});

describe("소스 화이트리스트", () => {
  it("피드 도메인과 검색 도메인이 합쳐져 화이트리스트가 된다", () => {
    expect(MEME_SOURCE_FEEDS.every((f) => f.feedUrl.startsWith("https://"))).toBe(true);
    for (const f of MEME_SOURCE_FEEDS) expect(MEME_SOURCE_DOMAINS).toContain(f.domain);
    expect(MEME_SOURCE_DOMAINS).toContain("careet.net");
  });
});
