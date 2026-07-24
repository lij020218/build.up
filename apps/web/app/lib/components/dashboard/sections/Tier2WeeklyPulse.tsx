"use client";

/**
 * Tier 2 — 이번 주 점검 (DeepDive 안, 주 1회 클릭).
 *
 * 카드 목록 (위→아래):
 *   - Cashflow13WeekForecastCard — 13주 자금흐름 예측 (모두, 미설정 시 nudge)
 *   - SurvivalBoardCard          — 생존 보드 (2-col 좌)
 *   - CostCompositionDonutCard   — 비용 도넛 (2-col 우)
 *   - SocialBenchmarkCard        — 동종업 벤치마크
 *   - SalesBreakdownCard / MonthlyProgressCard (entries ≥ 2)
 *   - CostStructureCard / BenchmarkCard (entries ≥ 1, 분기 다름)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { DeepDiveSection } from "../DeepDiveSection";
import { CoachingHistoryCard } from "../CoachingHistoryCard";
import { CostCompositionDonutCard } from "../CostCompositionDonutCard";
import { SocialBenchmarkCard } from "../SocialBenchmarkCard";
import { SalesBreakdownCard } from "../SalesBreakdownCard";
import { CostStructureCard } from "../CostStructureCard";
import { BenchmarkCard } from "../BenchmarkCard";
// 2026-05-12 사장님 결정: UserActivityCard 는 Tier 1 으로 되돌림 — 사용자 수 변화 그래프는 매일 hero level 유지.

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
};

export function Tier2WeeklyPulse({ d, c, ko, fmt }: Props) {
  return (
    <DeepDiveSection
      id="weekly-pulse"
      title={ko ? "이번 주 점검" : "Weekly Pulse"}
      subtitle={
        ko
          ? "생존 지표 · 비용 구조 · 매출 분해 · 월간 진행 · 벤치마크 — 주 1회 점검"
          : "Survival · Cost · Sales breakdown · Monthly · Benchmark — review weekly"
      }
      defaultOpen={false}
      ko={ko}
    >
      {/* 코칭 누적 일지 (14일) — 홈에서 이동 (2026-07-13 lean 재설계): 매일 필수 아닌
          회고성 lock-in 카드. 접힘 섹션 최상단에 두어 "이번 주 한 번" 성격으로. */}
      <CoachingHistoryCard ko={ko} />

      {/* 13주 자금흐름 예측 — Quicken/CFO 표준 + AI 처방 */}
      {/* 13주 예측·생존 보드·월간 진행·What-If → "재무" 탭으로 이관 (2026-07-24 재무 페이지 신설) */}
      <a href="/finance" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        padding: "13px 16px", borderRadius: 14, textDecoration: "none",
        border: "1px solid rgba(25,25,112,0.10)", background: "rgba(25,25,112,0.03)",
      }}>
        <span style={{ fontSize: 13, fontWeight: 650, color: "#191970" }}>
          {ko ? "재무 전망 — 손익분기 · 13주 자금흐름 · 12개월 시뮬레이션" : "Finance — break-even · 13-week cash · 12-month simulation"}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#191970" }}>{ko ? "재무 탭 →" : "Open →"}</span>
      </a>

      {/* 비용 도넛 (생존 보드는 재무 탭으로 이관) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
        <CostCompositionDonutCard
          ko={ko}
          totalSales={c.totalSales}
          monthlyCosts={c.monthlyCosts}
          industryCategoryId={d.industryCategoryId}
          fmt={fmt}
          expenseFields={d.businessCtx.expenseFields?.map((f) => ({
            fieldKey: f.fieldKey,
            label: f.label,
          }))}
        />
      </div>

      {/* 동종업 벤치마크 */}
      <SocialBenchmarkCard
        ko={ko}
        industryCategoryId={d.industryCategoryId}
        dailyEntries={c.allEntries as Array<{ date: string; sales: number; customers: number }>}
      />

      {/* 매출 분해 (entries ≥ 2) — 월간 진행은 재무 탭 손익분기 트래커로 흡수 (2026-07-24) */}
      {c.allEntries.length >= 2 && <SalesBreakdownCard />}

      {/* 비용 구조 + 벤치마크 (entries ≥ 1, 분기 다름) */}
      {c.allEntries.length >= 1 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              !c.isStartupCompany && !c.isOnlineCategory ? "1fr 1fr" : "1fr",
            gap: "14px",
          }}
        >
          {!c.isStartupCompany && !c.isOnlineCategory && <CostStructureCard />}
          <BenchmarkCard />
        </div>
      )}
    </DeepDiveSection>
  );
}
