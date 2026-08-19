"use client";

/** /admin/usage — 기능 사용량 + AI 비용. */
import { PageHeader } from "../../lib/components/admin/ui";
import { UsagePanel } from "../../lib/components/admin/UsagePanel";
import { AiCallQualityPanel } from "../../lib/components/admin/AiCallQualityPanel";

export default function AdminUsagePage() {
  return (
    <div>
      <PageHeader
        title="기능 사용량"
        subtitle="AI 호출 원장·비용 미터·실행 신호 — 전부 실데이터, 집계 불가 시 사유 표시"
      />
      <UsagePanel />
      <div style={{ height: 18 }} />
      <AiCallQualityPanel />
    </div>
  );
}
