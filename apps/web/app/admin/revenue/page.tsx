"use client";

/** /admin/revenue — 구독·매출 현황. */
import { PageHeader } from "../../lib/components/admin/ui";
import { RevenuePanel } from "../../lib/components/admin/RevenuePanel";

export default function AdminRevenuePage() {
  return (
    <div>
      <PageHeader title="매출·구독" subtitle="Found.One 구독 결제 현황" />
      <RevenuePanel />
    </div>
  );
}
