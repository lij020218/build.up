/**
 * 게스트(둘러보기, /browse) 가드 테스트 — iOS 5.1.1(v) 게스트 모드의 웹 미러.
 *
 * 계약: 게스트 화면이 렌더하는 surface 들은 makeGuestDashboardCtx 가 제공하는
 *  필드만 읽는다(부분 캐스트 계약 — guest-dashboard-ctx.ts). 여기서 실렌더로 검증:
 *  1) FranchiseView — 게스트 ctx 로 크래시 없이 렌더 (번들 데이터, 인증 불필요)
 *  2) TaxSurface guest — 개인화 자리에 가입 안내 행, "기록하면" 카피 미노출
 *  3) GuestStageContentRenderer — 정적 콘텐츠 렌더 + 인터랙티브는 잠금 행으로 대체
 */
import "./_install-localstorage";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STAGE_CONTENT_REGISTRY } from "@foundone/shared";
import { DashboardProvider } from "../app/lib/contexts/DashboardContext";
import { FranchiseView } from "../app/lib/components/surfaces/FranchiseView";
import { TaxSurface } from "../app/lib/components/surfaces/TaxSurface";
import { GuestStageContentRenderer } from "../app/lib/components/stages/shared/StageContentRenderer";
import { makeGuestDashboardCtx } from "../app/browse/guest-dashboard-ctx";

describe("guest browse mode (/browse)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  // JSX 미사용 — apps/web tsconfig jsx:preserve 가 vitest esbuild 와 충돌 (기존 tsx 테스트 관례).
  function renderGuest(node: React.ReactNode) {
    const ctx = makeGuestDashboardCtx("ko");
    act(() => {
      root.render(React.createElement(DashboardProvider, { value: ctx, children: node }));
    });
  }

  it("FranchiseView renders with guest ctx (bundled data, no auth)", () => {
    renderGuest(React.createElement(FranchiseView));
    expect(container.textContent).toContain("프랜차이즈 브랜드");
    // 브랜드 행이 실제로 나온다 (빈 화면 아님)
    expect(container.querySelectorAll("button.bento-card").length).toBeGreaterThan(0);
  });

  it("TaxSurface guest shows signup rows instead of personalization prompts", () => {
    renderGuest(React.createElement(TaxSurface, { guest: true }));
    const text = container.textContent ?? "";
    expect(text).toContain("내 세금");
    // 개인화 자리 → 가입 안내 (가짜 숫자·"기록하면" 카피 금지)
    expect(text).toContain("내 가게 기준으로 보려면 가입하세요");
    expect(text).not.toContain("매출을 기록하면 계산돼요");
    // 정보성 섹션(공통 세액공제)은 그대로 노출
    expect(text).toContain("신고 일정");
    // 가입 링크는 /auth 로
    const links = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(links).toContain("/auth");
  });

  it("GuestStageContentRenderer renders static content and locks interactive sections", () => {
    const content = STAGE_CONTENT_REGISTRY["registration-setup"];
    expect(content).toBeTruthy();
    renderGuest(React.createElement(GuestStageContentRenderer, { content, ko: true }));
    // 정적 콘텐츠(KEY ACTION 히어로 제목)가 렌더됨
    expect(container.textContent ?? "").toContain(content.keyAction?.title ?? content.shell.title);

    // 인터랙티브 섹션이 있는 페이지(사업자등록 — storeName·bizVerify 등)로 이동
    const lockedPageIdx = content.pages.findIndex((p) =>
      p.sections.some((s) => s.kind === "interactive"),
    );
    expect(lockedPageIdx).toBeGreaterThanOrEqual(0);
    const label = content.pages[lockedPageIdx].label;
    const navButton = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").trim() === label,
    );
    expect(navButton).toBeTruthy();
    act(() => {
      navButton!.click();
    });

    const text = container.textContent ?? "";
    // 인터랙티브 섹션은 잠금 행으로 대체 (페이지당 1회)
    expect(text).toContain("가입 후 이용할 수 있어요");
    // 국세청 확인 위젯(bizVerify)·상호명 입력(storeName) 등 쓰기 위젯이 렌더되지 않음
    expect(container.querySelector("input")).toBeNull();
  });

  it("all preview stages in the registry render without crashing", () => {
    for (const stageId of Object.keys(STAGE_CONTENT_REGISTRY)) {
      renderGuest(React.createElement(GuestStageContentRenderer, { content: STAGE_CONTENT_REGISTRY[stageId], ko: true }));
      expect((container.textContent ?? "").length).toBeGreaterThan(0);
    }
  });
});
