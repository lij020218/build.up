"use client";

/**
 * Tier 5 — 예측 · 플레이북 · 내보내기 (DeepDive 접힘 기본).
 *
 * 카드 목록 (위→아래):
 *   - ForecastCard         — 매출 예측 (entries ≥ 3)
 *   - FirstCustomersCard   — 첫 100명 플레이북 (개업 ≤90일 또는 미개업)
 *   - ExportPanel          — 데이터 내보내기 (매출/재고/직원 있을 때)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { DeepDiveSection } from "../DeepDiveSection";
import { ForecastCard } from "../ForecastCard";
import { FirstCustomersCard } from "../FirstCustomersCard";
import { ExportPanel } from "../ExportPanel";
import type {
  InventoryItem,
  Employee,
  Product,
  UnifiedProduct,
} from "../../../stores/operations-store";

type MonthlyCostsDetail = {
  ingredients: number;
  labor: number;
  rent: number;
  utilities: number;
  sga: number;
  marketing: number;
  other: number;
  interest: number;
};

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
};

export function Tier5ForecastTools({ d, c, ko }: Props) {
  return (
    <DeepDiveSection
      id="forecast-tools"
      title={ko ? "예측 · 플레이북 · 내보내기" : "Forecast · Playbook · Export"}
      subtitle={
        ko
          ? "매출 예측 · 첫 100명 플레이북 · 데이터 내보내기"
          : "Sales forecast · First 100 customers playbook · Data export"
      }
      defaultOpen={false}
      ko={ko}
    >
      {c.allEntries.length >= 3 && (
        <ForecastCard
          ko={ko}
          dailyEntries={c.allEntries}
          monthlyCosts={d.monthlyCosts as MonthlyCostsDetail}
          capitalLeft={c.capitalLeft}
          breakEvenDailySales={c.breakEvenDailySales}
          industryCategoryId={d.industryCategoryId}
          initialOperatingCapital={d.initialOperatingCapital}
        />
      )}
      {(c.daysSinceLaunch <= 90 || c.daysSinceLaunch === 0) && (
        <FirstCustomersCard
          ko={ko}
          industryCategoryId={d.industryCategoryId}
          businessLaunched={d.businessLaunched}
          businessLaunchedDate={c.launchDateText}
        />
      )}
      {(c.totalSales > 0 || c.inventory.length > 0 || c.employees.length > 0) && (
        <ExportPanel
          ko={ko}
          storeName={d.storeName}
          entries={c.allEntries}
          monthlyCosts={d.monthlyCosts as MonthlyCostsDetail}
          inventory={c.inventory as unknown as InventoryItem[]}
          employees={c.employees as unknown as Employee[]}
          products={d.products as Product[] | undefined}
          unifiedProducts={d.unifiedProducts as UnifiedProduct[] | undefined}
        />
      )}
    </DeepDiveSection>
  );
}
