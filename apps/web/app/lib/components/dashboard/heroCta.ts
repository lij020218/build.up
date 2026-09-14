/**
 * heroCta.ts — 히어로 "오늘 할 일" 버튼의 목적지 디스패치 (2026-09-12).
 *
 * 종전에는 CEOMorningHero 안에만 있었다. 오늘의 요약 카드에도 같은 버튼이 생기면서
 * 한 곳으로 뺐다 — 두 카드가 같은 briefing 을 보고 같은 곳으로 가야 한다.
 *
 * 규칙: 모든 분기에서 무언가는 반드시 일어난다(무반응 클릭 금지). 타깃 카드를 못 찾아도
 * 무조건 매출 입력으로 떨어뜨리지 않는다 — 대상별 정직한 폴백.
 */

import type { Hero } from "./heroInsight";
import { requestHomeFocus } from "./homeSegments";

/** 카드 1.1초 링 하이라이트 — 사장님이 "버튼이 어디로 데려갔는지" 눈으로 확인. */
export function flashHighlight(el: HTMLElement) {
  const prev = el.style.boxShadow;
  const prevTransition = el.style.transition;
  el.style.transition = "box-shadow 0.2s ease";
  el.style.boxShadow = "0 0 0 3px rgba(25,25,112,0.35)";
  window.setTimeout(() => {
    el.style.boxShadow = prev;
    window.setTimeout(() => { el.style.transition = prevTransition; }, 250);
  }, 1100);
}

function focusBySelector(selector: string, opts: { focusInput?: boolean } = {}): boolean {
  if (typeof document === "undefined") return false;
  const el = document.querySelector<HTMLElement>(selector);
  // 카드가 다른 홈 세그먼트에 있으면 DOM 에 없다 → 세그먼트 전환 + 스크롤 요청.
  if (!el) return requestHomeFocus(selector, opts);
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (opts.focusInput) {
    window.setTimeout(() => {
      const input = el.querySelector<HTMLInputElement>('input[inputmode="numeric"], input[type="number"], input[type="text"]');
      input?.focus();
    }, 450);
  }
  flashHighlight(el);
  return true;
}

function navigateFeature(detail: { surface: string; selector?: string }) {
  if (typeof window === "undefined") return false;
  window.dispatchEvent(new CustomEvent("bup:navigate-feature", { detail }));
  return true;
}

export function dispatchHeroCta(briefing: Pick<Hero, "ctaTarget">): void {
  let handled = false;
  switch (briefing.ctaTarget) {
    case "sales":
      handled = focusBySelector("[data-sales-input]", { focusInput: true });
      break;
    case "users":
      handled = focusBySelector("[data-user-activity]") || focusBySelector("[data-first-customers-card]");
      break;
    case "cashflow":
      handled = focusBySelector("[data-cashflow-hero]");
      break;
    case "costs":
      handled = focusBySelector("[data-cost-structure]") || focusBySelector("[data-pl-hero]")
        || navigateFeature({ surface: "analytics", selector: "[data-cost-management]" });
      break;
    case "inventory":
      handled = focusBySelector("[data-inventory-card]");
      break;
    case "team":
      handled = focusBySelector("[data-team-card]");
      break;
    case "primeCost":
      handled = focusBySelector("[data-prime-cost-card]")
        || navigateFeature({ surface: "analytics", selector: "[data-cost-management]" });
      break;
    case "operations":
      handled = focusBySelector("[data-ops-rituals]");
      break;
    case "marketing":
      handled = navigateFeature({ surface: "marketing" });
      break;
  }
  if (!handled && typeof window !== "undefined") {
    if (briefing.ctaTarget === "sales") {
      focusBySelector("[data-sales-input]", { focusInput: true });
    } else {
      // 마지막 안전망 — 페이지 상단. 매출로 떨어뜨리지 않는다.
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}
