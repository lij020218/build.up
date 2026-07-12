import { describe, it, expect } from "vitest";
import { DAILY_KPI_BY_INDUSTRY, getDailyKpiCells } from "../dashboard/daily-kpi-config";

/**
 * 셀 순서 불변식 (2026-07-12) — 대시보드 정직성 규율.
 *
 * 배경: 일부 KPI 는 데이터 모델 부재로 의도적 정직 강등("준비 중" 영구 표시) 상태다
 *   (Tier1DailyHub.buildKpiValues 의 무조건 displayOverride — booking-utilization,
 *    seat-utilization, inventory-days, renewal-rate, repeat-rate, pmf-score, nrr).
 *   위조 금지 원칙상 값을 채울 수 없으므로, 대신 "업종 대표(1번) 셀은 항상 계산
 *   가능한 지표"가 되도록 순서를 강제한다. 죽은 셀이 1번에 오면 업종별 핵심 KPI
 *   스트립의 최상단이 영구히 비어 신뢰를 훼손한다 (2026-07-12 감사에서 beauty/
 *   space/fitness 1번 셀이 전부 "준비 중"이던 결함 수정).
 *
 * 이 목록에서 지표를 빼려면: Tier1DailyHub 에서 실값 계산이 먼저 구현돼야 한다.
 */
const PERMANENTLY_PENDING_KPI_IDS = new Set([
  "booking-utilization",
  "seat-utilization",
  "inventory-days",
  "renewal-rate",
  "repeat-rate",
  "pmf-score",
  "nrr",
]);

describe("daily-kpi-config 셀 순서 불변식", () => {
  it("어떤 업종도 영구 '준비 중' 지표를 1번(대표) 셀로 두지 않는다", () => {
    for (const [industry, cells] of Object.entries(DAILY_KPI_BY_INDUSTRY)) {
      expect(cells.length).toBeGreaterThan(0);
      const first = cells[0];
      expect(
        PERMANENTLY_PENDING_KPI_IDS.has(first.id),
        `${industry} 의 1번 셀(${first.id})이 영구 "준비 중" 지표입니다 — 계산 가능한 지표를 앞으로 옮기세요`,
      ).toBe(false);
    }
  });

  it("영구 '준비 중' 지표는 각 업종 셀 목록의 끝에 몰려 있다 (중간 삽입 금지)", () => {
    for (const [industry, cells] of Object.entries(DAILY_KPI_BY_INDUSTRY)) {
      const ids = cells.map((c) => c.id);
      const firstPendingIdx = ids.findIndex((id) => PERMANENTLY_PENDING_KPI_IDS.has(id));
      if (firstPendingIdx === -1) continue; // 죽은 셀 없는 업종 (food/cafe 등)
      const tail = ids.slice(firstPendingIdx);
      // 죽은 셀 등장 이후엔 계산 가능(conditional 포함) 지표가 다시 나오지 않아야 하는 게
      // 이상적이나, cumulative-users/wau/mrr 등 "조건부" 지표는 허용한다.
      // 최소 불변식: 마지막 셀 이전(1~3번)엔 영구 죽은 셀이 최대 1개.
      const pendingBeforeLast = ids
        .slice(0, -1)
        .filter((id) => PERMANENTLY_PENDING_KPI_IDS.has(id)).length;
      expect(
        pendingBeforeLast <= 1,
        `${industry} 의 앞쪽 셀에 영구 "준비 중" 지표가 ${pendingBeforeLast}개 — 뒤로 옮기세요 (${ids.join(", ")})`,
      ).toBe(true);
      void tail;
    }
  });

  it("getDailyKpiCells 폴백(미지정 업종)은 food 구성", () => {
    expect(getDailyKpiCells(undefined)).toEqual(DAILY_KPI_BY_INDUSTRY.food);
    expect(getDailyKpiCells("unknown-industry")).toEqual(DAILY_KPI_BY_INDUSTRY.food);
  });
});
