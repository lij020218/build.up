import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  budgetItemsFor, budgetItemGroupFor, parseBudgetItems, sumBudgetItemsWon,
  BUDGET_ITEM_INPUT_PREFIX, MONTHLY_MARKETING_INPUT_KEY,
} from "@foundone/shared";

/**
 * 창업 예산 항목 SSOT 가드 (2026-08-07).
 *  SSOT = packages/shared/src/startup-budget-items.ts. iOS BudgetSetupStageView 는 손미러 —
 *  이 테스트가 Swift 파일을 파싱해 키가 어긋나면 CI 에서 실패시킨다.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IOS_STAGE = join(
  HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "BudgetSetupStageView.swift",
);

function swiftKeys(swift: string, arrayName: string): string[] {
  const m = swift.match(new RegExp(`${arrayName}: \\[BudgetItemDef\\] = \\[([\\s\\S]*?)\\n    \\]`));
  expect(m, `${arrayName} 배열을 찾지 못했습니다`).toBeTruthy();
  return [...m![1].matchAll(/key: "([a-zA-Z]+)"/g)].map((x) => x[1]);
}

describe("창업 예산 항목", () => {
  it("업종군 매핑 — 스타트업/온라인/그 외 오프라인", () => {
    expect(budgetItemGroupFor("startup-tech")).toBe("startup");
    expect(budgetItemGroupFor("online-digital")).toBe("online");
    expect(budgetItemGroupFor("food")).toBe("offline");
    expect(budgetItemGroupFor(null)).toBe("offline");
  });

  it("가맹비는 프랜차이즈일 때만 나온다", () => {
    const indep = budgetItemsFor("food", false).map((i) => i.key);
    const franchise = budgetItemsFor("food", true).map((i) => i.key);
    expect(indep).not.toContain("franchiseFee");
    expect(franchise).toContain("franchiseFee");
  });

  it("inputs 파싱·합계 — flat 키(만원 문자열) 규약, 잘못된 값은 무시", () => {
    const items = parseBudgetItems({
      [`${BUDGET_ITEM_INPUT_PREFIX}deposit`]: "3000",
      [`${BUDGET_ITEM_INPUT_PREFIX}interior`]: "2000",
      [`${BUDGET_ITEM_INPUT_PREFIX}bad`]: "abc",
      capital: 50_000_000,   // 접두사 없는 키는 항목이 아니다
    });
    expect(items).toEqual({ deposit: 3000, interior: 2000 });
    expect(sumBudgetItemsWon(items)).toBe(50_000_000);
    expect(sumBudgetItemsWon({})).toBeNull();   // 미입력 = 총액 직접입력 모드
  });

  it("iOS 손미러 — Swift 항목 키·구성이 SSOT 와 1:1", () => {
    const swift = readFileSync(IOS_STAGE, "utf8");
    expect(swiftKeys(swift, "offlineItems")).toEqual(budgetItemsFor("food", true).map((i) => i.key));
    expect(swiftKeys(swift, "onlineItems")).toEqual(budgetItemsFor("online-digital", true).map((i) => i.key));
    expect(swiftKeys(swift, "startupItems")).toEqual(budgetItemsFor("startup-tech", true).map((i) => i.key));
    // 저장 규약 문자열도 일치해야 한다 (flat 키 + 월 마케팅)
    expect(swift).toContain('"budgetItem.');
    expect(swift).toContain(`"${MONTHLY_MARKETING_INPUT_KEY}"`);
  });

  it("iOS 는 입력 중에도 서버 초안 저장을 건다 (로컬 상태로만 두면 이탈 시 유실)", () => {
    const swift = readFileSync(IOS_STAGE, "utf8");
    expect(swift).toContain("scheduleDraftSave()");
    expect(swift).toContain("saveInputsDraft(");
    const store = readFileSync(
      join(HERE, "..", "..", "ios", "Sources", "FoundOneData", "Stores", "RoadmapStore.swift"),
      "utf8",
    );
    // draft 저장은 완료 상태를 만들면 안 된다 — completedAt 설정 코드가 섞이면 실패
    const draftFn = store.match(/func saveInputsDraft[\s\S]*?\n    \}/)?.[0] ?? "";
    expect(draftFn).toContain("pushUpsert");
    expect(draftFn).not.toContain("completedAt =");
  });

  it("월 마케팅 예산이 재무 검토 추정치로 이어진다 — 같은 값을 두 번 묻지 않는다 (2026-08-12)", async () => {
    const { estimateMonthlyCosts } = await import("@foundone/shared");
    const withBudget = estimateMonthlyCosts({ categoryId: "food", marketingMonthlyKrw: 300_000 }, {});
    expect(withBudget.fields.marketing).toBe(300_000);
    expect(withBudget.sources.marketing).toBe("stage-derived");
    // 미입력이면 기존 업종 평균 유지
    const without = estimateMonthlyCosts({ categoryId: "food" }, {});
    expect(without.sources.marketing).toBe("industry-average");
    // 사장님이 재무 검토에서 직접 고친 값(override)이 항상 이긴다
    const overridden = estimateMonthlyCosts({ categoryId: "food", marketingMonthlyKrw: 300_000 }, { marketing: 500_000 });
    expect(overridden.fields.marketing).toBe(500_000);
    expect(overridden.sources.marketing).toBe("user-input");
  });

  it("운영예비 → 현금 잔고 시드 배선 — 비어 있을 때만 (직접 입력 잔고 보호)", () => {
    const webHook = readFileSync(
      join(HERE, "..", "app", "lib", "hooks", "useSelectionHandlers.ts"), "utf8",
    );
    expect(webHook).toContain("setCurrentBalance(operating)");
    expect(webHook).toContain("currentBalance <= 0");
    const projector = readFileSync(
      join(HERE, "..", "..", "ios", "Sources", "FoundOneData", "Repositories", "StageInputProjector.swift"), "utf8",
    );
    expect(projector).toContain('"operatingWon"');
    expect(projector).toContain("seedInitialCashIfEmpty");
    const repo = readFileSync(
      join(HERE, "..", "..", "ios", "Sources", "FoundOneData", "Cashflow", "CashflowRepository.swift"), "utf8",
    );
    // iOS 시드도 비어 있을 때만 — 이 가드가 사라지면 직접 입력 잔고를 덮는다
    expect(repo).toContain("settings.currentBalance <= 0 else { return }");
  });

  it("월 마케팅 예산이 iOS 투영 목록에 있다 (marketing_monthly_budget 로 흘러가야 한다)", () => {
    const projector = readFileSync(
      join(HERE, "..", "..", "ios", "Sources", "FoundOneData", "Repositories", "StageInputProjector.swift"),
      "utf8",
    );
    expect(projector).toContain(`"${MONTHLY_MARKETING_INPUT_KEY}"`);
    expect(projector).toContain("persistMonthlyBudgetForCurrentUser");
  });
});
