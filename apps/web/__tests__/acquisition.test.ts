/**
 * acquisition.test.ts — 가입 유입 출처(first-touch) 규칙 (2026-09-12).
 *
 * 광고 소재별 "가입자 1명당 비용"을 재려면 이 값이 정확해야 한다.
 * 특히 first-touch 규칙(덮어쓰기 금지)이 깨지면 광고 기여가 직접 유입으로 바뀐다.
 */

// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { parseAcquisition, captureAcquisition, readAcquisition } from "@foundone/shared";

describe("parseAcquisition", () => {
  it("utm 파라미터를 뽑는다", () => {
    const a = parseAcquisition("?utm_source=meta&utm_medium=cpc&utm_campaign=staff&utm_content=video1", "");
    expect(a?.source).toBe("meta");
    expect(a?.medium).toBe("cpc");
    expect(a?.campaign).toBe("staff");
    expect(a?.content).toBe("video1");
  });

  it("referrer 는 호스트만 남긴다 — 경로에 검색어가 붙을 수 있다", () => {
    const a = parseAcquisition("", "https://l.facebook.com/l.php?u=secret");
    expect(a?.referrer).toBe("l.facebook.com");
  });

  it("아무 신호도 없으면 null — 직접 유입까지 기록하지 않는다", () => {
    expect(parseAcquisition("", "")).toBeNull();
  });

  it("긴 값은 잘라 저장한다", () => {
    const long = "x".repeat(400);
    const a = parseAcquisition(`?utm_campaign=${long}`, "");
    expect(a?.campaign?.length).toBe(120);
  });
});

describe("captureAcquisition — first-touch", () => {
  beforeEach(() => {
    // 이 환경의 localStorage 는 전체 Storage 구현이 아니다 → 최소 구현으로 대체.
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => { store.clear(); },
      },
    });
    window.history.replaceState({}, "", "/?utm_source=meta&utm_campaign=staff");
  });

  it("첫 방문 값을 저장한다", () => {
    const a = captureAcquisition();
    expect(a?.campaign).toBe("staff");
    expect(readAcquisition()?.campaign).toBe("staff");
  });

  it("두 번째 방문이 광고가 아니어도 첫 값을 덮어쓰지 않는다", () => {
    captureAcquisition();
    window.history.replaceState({}, "", "/?utm_source=direct&utm_campaign=other");
    captureAcquisition();
    expect(readAcquisition()?.campaign).toBe("staff");
  });
});
