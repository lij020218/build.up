import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FEATURE_COST_SPEC,
  MONTHLY_AI_BUDGET_WON,
  costPerCallWon,
  featureCostWon,
  kstMonthKey,
} from "../app/api/_lib/ai-cost";
import { consumeMonthlyAiBudget } from "../app/api/_lib/rate-limit";

/**
 * AI 비용 예산 회귀 가드 (2026-07-28 사장님 지시: "1인당 최대 월 6,000원").
 *
 * 3중 가드:
 *  1) 드리프트: checkDailyRateLimit 를 쓰는 모든 라우트의 feature 키가 비용표(SSOT)에
 *     존재해야 한다. 새 LLM 라우트를 만들고 비용표에 안 넣으면 여기서 실패.
 *  2) 예산: 헤비 실사용 프로파일(상위 사용자 월간 사용량)의 상한가 합계 ≤ ₩6,000.
 *     모델 승급·토큰 캡 확대·쿼터 완화로 예산이 깨지면 여기서 실패.
 *  3) 미터 동작: consumeMonthlyAiBudget 이 예산 도달 시 실제로 차단하는지 (in-memory 경로).
 *
 * 실측 앵커(2026-07-28): marketing-cases terra in 4,898 / out 2,304 → 실비용 ≈ ₩66/회.
 * 상한가는 항상 실측 이상이어야 한다 (상한 선차감 → 실지출 ≤ 예산 보장의 전제).
 */

const __filename = fileURLToPath(import.meta.url);
const API_DIR = join(dirname(__filename), "..", "app", "api");

function collectRouteFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collectRouteFiles(p, out);
    else if (name === "route.ts") out.push(p);
  }
  return out;
}

/** 라우트 소스에서 checkDailyRateLimit 호출의 feature 키를 추출 */
function extractDailyLimitFeatures(): Map<string, string> {
  const found = new Map<string, string>(); // feature → route path
  for (const file of collectRouteFiles(API_DIR)) {
    const src = readFileSync(file, "utf8");
    if (!src.includes("checkDailyRateLimit")) continue;
    for (const m of src.matchAll(/feature:\s*"([^"]+)"/g)) {
      found.set(m[1], file);
    }
  }
  return found;
}

describe("ai-cost-budget: 드리프트 가드", () => {
  it("checkDailyRateLimit 를 쓰는 모든 feature 키가 비용표(FEATURE_COST_SPEC)에 있다", () => {
    const features = extractDailyLimitFeatures();
    expect(features.size).toBeGreaterThanOrEqual(20); // 추출 자체가 깨지면 여기서 감지
    const missing = [...features.entries()].filter(([f]) => !(f in FEATURE_COST_SPEC));
    expect(
      missing,
      `비용표에 없는 feature: ${missing.map(([f, p]) => `${f} (${p})`).join(", ")} — ` +
        `apps/web/app/api/_lib/ai-cost.ts 의 FEATURE_COST_SPEC 에 회당 상한 스펙을 추가하세요. ` +
        `LLM 을 안 쓰는 라우트면 null 로 명시.`,
    ).toEqual([]);
  });

  it("feature 키에 변수 전달(literal 아닌) 호출이 없다 — 추출 가드", () => {
    for (const file of collectRouteFiles(API_DIR)) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("checkDailyRateLimit")) continue;
      // checkDailyRateLimit 블록 안에 feature: "literal" 이 최소 1개는 있어야 함
      expect(/feature:\s*"/.test(src), `${file}: feature 키가 문자열 리터럴이 아님 — 비용표 매칭 불가`).toBe(true);
    }
  });
});

describe("ai-cost-budget: 단가·상한가", () => {
  it("월 예산은 ₩6,000 (사장님 지시 고정 — 바꾸려면 명시적 결정 필요)", () => {
    expect(MONTHLY_AI_BUDGET_WON).toBe(6000);
  });

  it("cases 상한가 ≥ 실측 비용 (상한 선차감 전제)", () => {
    // 실측 2026-07-28: terra in 4,898 / out 2,304 (+리서치·Tavily 별도)
    const measuredWon = costPerCallWon("gpt-5.6-terra", 4898, 2304);
    expect(measuredWon).toBeLessThanOrEqual(featureCostWon("marketing-cases"));
  });

  it("계약분석 상한가 ≥ 실측 비용 ₩85", () => {
    expect(featureCostWon("contract-analyze")).toBeGreaterThanOrEqual(85);
  });

  it("LLM 미사용 기능은 0원 — 스냅샷(공공 API만)", () => {
    expect(featureCostWon("market-snapshot")).toBe(0);
  });

  it("상권 추천은 내레이터(gpt-5.4-mini) 비용이 미터에 잡힌다 — 종전 null(미터 누락) 정정", () => {
    expect(featureCostWon("market-recommend")).toBeGreaterThan(0);
  });
});

describe("ai-cost-budget: 헤비 실사용 프로파일 ≤ 월 ₩6,000", () => {
  // 상위 사용자 월간 사용량 가정 (전 기능을 적극적으로 쓰는 사장님).
  // 실제 관측이 이보다 커지면 이 프로파일을 올리고 → 예산 초과 시 모델/캡/쿼터를 조정한다.
  const HEAVY_MONTHLY_PROFILE: Record<string, number> = {
    "marketing-cases": 8, // 주 1회 자동 + 재생성
    "marketing-cardnews": 8,
    "marketing-coach": 8,
    "marketing-trends": 8,
    "quick-query": 60, // 하루 2회 꼴
    "insights-industry-daily": 30, // 매일
    "contract-analyze": 2,
    "members-parse": 2,
    "products-parse": 2,
    "agents-content-draft": 6,
    "agents-coupon-copy": 6,
    "agents-feedback-form": 4,
    "business-plan-generate": 1,
    "roadmap-generate": 1,
    "roadmap-classify": 6, // 업종 확인 스텝 — 재분석 부담 없는 경량 호출 (회당 ~₩2)
    "interview": 2,
    "interview-analyze": 2,
    "health-diagnose": 4,
    "finance-interpret": 4,
    "market-narrative": 2,
    "report-insight": 4,
    "stage-brief": 6,
    "programs-match": 2,
    "funding-score": 2,
    "guides-ask": 10,
    "dashboard-actions": 10,
    "market-recommend": 30, // 0원
  };

  it("프로파일이 비용표의 모든 유료 기능을 포함한다 (누락 시 합계가 과소평가됨)", () => {
    const paidFeatures = Object.entries(FEATURE_COST_SPEC)
      .filter(([, spec]) => spec !== null)
      .map(([f]) => f);
    const missing = paidFeatures.filter((f) => !(f in HEAVY_MONTHLY_PROFILE));
    expect(missing, `프로파일에 없는 유료 기능: ${missing.join(", ")}`).toEqual([]);
  });

  it("헤비 프로파일 월 상한가 합계 ≤ ₩6,000", () => {
    let totalWon = 0;
    const lines: string[] = [];
    for (const [feature, calls] of Object.entries(HEAVY_MONTHLY_PROFILE)) {
      const per = featureCostWon(feature);
      totalWon += per * calls;
      if (per > 0) lines.push(`${feature}: ₩${per} × ${calls} = ₩${per * calls}`);
    }
    expect(
      totalWon,
      `헤비 프로파일 합계 ₩${totalWon} > 예산 ₩${MONTHLY_AI_BUDGET_WON}\n${lines.join("\n")}`,
    ).toBeLessThanOrEqual(MONTHLY_AI_BUDGET_WON);
  });
});

describe("ai-cost-budget: 월간 미터 동작 (in-memory 경로)", () => {
  it("예산 도달 시 차단하고, 차단 전 허용 횟수 = floor(예산/상한가)", async () => {
    const userId = `test-user-${kstMonthKey()}-meter`;
    const per = featureCostWon("contract-analyze");
    const expectAllowed = Math.floor(MONTHLY_AI_BUDGET_WON / per);
    let allowed = 0;
    for (let i = 0; i < expectAllowed + 3; i++) {
      const r = await consumeMonthlyAiBudget(userId, "contract-analyze");
      if (r === null) allowed += 1;
      else {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.status).toBe(429);
      }
    }
    expect(allowed).toBe(expectAllowed);
  });

  it("0원 기능은 무제한 통과", async () => {
    const userId = `test-user-${kstMonthKey()}-free`;
    for (let i = 0; i < 5; i++) {
      expect(await consumeMonthlyAiBudget(userId, "market-recommend")).toBeNull();
    }
  });
});
