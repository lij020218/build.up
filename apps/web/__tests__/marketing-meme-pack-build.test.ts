// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * buildWeeklyMemePack 저장 로직 회귀 가드 (2026-09-12).
 *
 * 이 함수가 프로드 전역 팩(marketing_meme_packs)을 직접 쓴다. 검증하는 것:
 *  ① 최근 8주에 이미 소개한 링크는 다시 수집하지 않는다 (6월 글이 매주 NEW 로 재등장하던 버그)
 *  ② 새 글이 없으면 LLM 을 부르지 않는다 (비용 0)
 *  ③ 저장할 때 수명이 끝난 기존 항목을 함께 걷어낸다
 *  ④ 발행일은 피드 값이 찍힌다 (LLM 산출물 무시)
 */

const FEED_ENTRIES = [
  {
    title: "2026년 9월 최신 밈 모음",
    url: "https://gogumafarm.kr/new-2026-09/",
    publishedAt: "2026-09-10",
    content: "새 밈 본문",
  },
  {
    title: "이미 소개한 글",
    url: "https://gogumafarm.kr/already/",
    publishedAt: "2026-09-01",
    content: "기존 본문",
  },
];

const LLM_ITEMS = {
  items: [
    {
      kind: "meme",
      title: "새 밈",
      originDesc: "새로 뜬 밈입니다.",
      originUrl: "https://gogumafarm.kr/new-2026-09/",
      applyHint: "사장님 메뉴 소개에 적용해보세요",
      industryFit: ["food"],
      // LLM 이 엉뚱한 발행일을 적어도 코드가 피드 값으로 덮어써야 한다
      publishedAt: "2020-01-01",
      sourceName: "지어낸매체",
    },
  ],
};

const createMock = vi.fn(async () => ({
  model: "gpt-5.6-terra",
  usage: { prompt_tokens: 10, completion_tokens: 10 },
  choices: [{ message: { content: JSON.stringify(LLM_ITEMS) } }],
}));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

vi.mock("../app/api/_lib/rss", () => ({
  fetchRssEntries: vi.fn(async () => FEED_ENTRIES),
  toKstDateString: (s: string) => s,
}));

type UpsertPayload = { week_key: string; items: Array<Record<string, unknown>>; sources: unknown[]; updated_at: string };

function fakeSupabase(rows: Array<Record<string, unknown>>) {
  const upserts: UpsertPayload[] = [];
  const client = {
    from: () => ({
      select: () => ({ in: async () => ({ data: rows, error: null }) }),
      upsert: async (payload: UpsertPayload) => {
        upserts.push(payload);
        return { error: null };
      },
    }),
  };
  return { client, upserts };
}

const NOW = new Date("2026-09-12T09:00:00+09:00");

beforeEach(() => createMock.mockClear());

describe("buildWeeklyMemePack", () => {
  it("이미 소개한 링크만 나오면 LLM 을 부르지 않는다 (비용 0)", async () => {
    const { buildWeeklyMemePack } = await import("../app/api/_lib/marketing-memes");
    const { client, upserts } = fakeSupabase([
      {
        week_key: "2026-W36",
        items: FEED_ENTRIES.map((e) => ({
          kind: "meme", title: e.title, originDesc: "x", originUrl: e.url,
          sourceName: "고구마팜", publishedAt: e.publishedAt, industryFit: ["all"], applyHint: "x",
        })),
        sources: [],
        generated_at: "2026-09-01T00:00:00Z",
      },
    ]);
    const r = await buildWeeklyMemePack(client as never, {
      openaiKey: "k", weekKey: "2026-W37", now: NOW,
    });
    expect(createMock).not.toHaveBeenCalled();
    expect(upserts).toHaveLength(0);
    expect(r.status).toBe("skipped-thin"); // 이번 주 팩이 아직 없으므로
  });

  it("새 글이 있으면 구조화해 저장하고, 발행일은 피드 값으로 찍힌다", async () => {
    const { buildWeeklyMemePack } = await import("../app/api/_lib/marketing-memes");
    const { client, upserts } = fakeSupabase([
      {
        week_key: "2026-W37",
        // 기존 팩: 신선한 항목 2개 + 수명 지난 6월 항목 1개(정리 대상)
        items: [
          { kind: "meme", title: "최근 밈", originDesc: "x", originUrl: "https://gogumafarm.kr/recent/", sourceName: "고구마팜", publishedAt: "2026-09-05", industryFit: ["all"], applyHint: "x" },
          { kind: "format", title: "오래된 포맷", originDesc: "x", originUrl: "https://gogumafarm.kr/fmt/", sourceName: "고구마팜", publishedAt: "2026-07-20", industryFit: ["all"], applyHint: "x" },
          { kind: "meme", title: "6월 밈", originDesc: "x", originUrl: "https://gogumafarm.kr/june/", sourceName: "고구마팜", publishedAt: "2026-06-10", industryFit: ["all"], applyHint: "x" },
        ],
        sources: [],
        generated_at: "2026-09-07T00:00:00Z",
        updated_at: "2026-09-10T00:00:00Z", // 20시간 가드 통과
      },
    ]);
    const r = await buildWeeklyMemePack(client as never, {
      openaiKey: "k", weekKey: "2026-W37", now: NOW,
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(r.status).toBe("topped-up");
    expect(upserts).toHaveLength(1);
    const saved = upserts[0];
    const titles = saved.items.map((it) => it.title);

    // 새 소재가 앞에 오고, addedAt 은 코드가 오늘 날짜로 찍는다
    expect(titles[0]).toBe("새 밈");
    expect(saved.items[0].addedAt).toBe("2026-09-12");
    // 발행일·매체명은 피드 값 (LLM 이 적은 2020-01-01 / 지어낸매체 가 아니다)
    expect(saved.items[0].publishedAt).toBe("2026-09-10");
    expect(saved.items[0].sourceName).toBe("고구마팜");
    // 수명 지난 6월 밈은 저장 시 정리된다. 아직 유효한 7월 포맷(120일)은 남는다.
    expect(titles).not.toContain("6월 밈");
    expect(titles).toContain("최근 밈");
    expect(titles).toContain("오래된 포맷");
  });

  it("같은 날 다시 돌면 아무것도 하지 않는다 (크론 중복 실행 가드)", async () => {
    const { buildWeeklyMemePack } = await import("../app/api/_lib/marketing-memes");
    const { client, upserts } = fakeSupabase([
      {
        week_key: "2026-W37",
        items: [{ kind: "meme", title: "최근 밈", originDesc: "x", originUrl: "https://gogumafarm.kr/recent/", sourceName: "고구마팜", publishedAt: "2026-09-05", industryFit: ["all"], applyHint: "x" }],
        sources: [],
        generated_at: "2026-09-12T00:00:00Z",
        updated_at: "2026-09-12T00:00:00Z", // 9시간 전 — 20시간 가드에 걸린다
      },
    ]);
    const r = await buildWeeklyMemePack(client as never, { openaiKey: "k", weekKey: "2026-W37", now: NOW });
    expect(r.status).toBe("exists");
    expect(createMock).not.toHaveBeenCalled();
    expect(upserts).toHaveLength(0);
  });
});
