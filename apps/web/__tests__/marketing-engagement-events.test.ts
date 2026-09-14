import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 마케팅 계측 이벤트 목록 정합 가드 (2026-09-12).
 *
 * 라우트가 허용하는 이벤트와 DB CHECK 제약이 어긋나면, 클라이언트는 200 을 받는데
 * insert 는 조용히 실패한다(= 계측이 또 0건이 된다). 두 목록을 문자열로 대조한다.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const ROUTE = join(HERE, "..", "app", "api", "ai", "marketing", "engagement", "route.ts");
const MIGRATION = join(HERE, "..", "..", "..", "supabase", "migrations", "20260912000001_marketing_engagement_cardnews_events.sql");
const CARDNEWS = join(HERE, "..", "app", "lib", "components", "surfaces", "CardNewsStudio.tsx");
const SURFACE = join(HERE, "..", "app", "lib", "components", "surfaces", "MarketingSurface.tsx");
const IOS_CARDNEWS = join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Marketing", "CardNewsStudioCard.swift");
const IOS_VIEW = join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Marketing", "MarketingView.swift");

const EXPECTED = ["copy_click", "meme_origin_click", "cardnews_generate", "cardnews_save", "play_done"];

function listFrom(text: string, re: RegExp): string[] {
  const m = re.exec(text);
  expect(m, "목록을 찾지 못함").not.toBeNull();
  return [...m![1].matchAll(/'([a-z_]+)'|"([a-z_]+)"/g)].map((x) => x[1] ?? x[2]);
}

describe("마케팅 계측 이벤트", () => {
  it("라우트 허용 목록 = DB CHECK 목록", () => {
    const route = listFrom(readFileSync(ROUTE, "utf8"), /const EVENTS = new Set\(\[([^\]]+)\]\)/);
    const migration = listFrom(readFileSync(MIGRATION, "utf8"), /check \(event in \(([^)]+)\)\)/);
    expect(route.sort()).toEqual(EXPECTED.slice().sort());
    expect(migration.sort()).toEqual(EXPECTED.slice().sort());
  });

  it("카드뉴스·플레이 신호가 웹·iOS 양쪽에서 발신된다", () => {
    const web = readFileSync(CARDNEWS, "utf8");
    expect(web).toContain('logMarketingEvent("cardnews_generate")');
    expect(web).toContain('logMarketingEvent("cardnews_save")');
    expect(readFileSync(SURFACE, "utf8")).toContain('logMarketingEvent("play_done")');

    const ios = readFileSync(IOS_CARDNEWS, "utf8");
    expect(ios).toContain('logEngagement(event: "cardnews_generate")');
    expect(ios).toContain('logEngagement(event: "cardnews_save")');
    expect(readFileSync(IOS_VIEW, "utf8")).toContain('logEngagement(event: "play_done")');
  });
});
