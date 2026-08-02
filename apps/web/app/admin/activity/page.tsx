"use client";

/** /admin/activity — 사용자별 일자 활동 로그 (누가 언제 무엇을 썼나). */
import { PageHeader } from "../../lib/components/admin/ui";
import { ActivityPanel } from "../../lib/components/admin/ActivityPanel";

export default function AdminActivityPage() {
  return (
    <div>
      <PageHeader
        title="사용자 활동"
        subtitle="날짜별·사용자별 실사용 기록 — 화면 방문·AI 사용 원장 기준, 집계 불가 시 사유 표시"
      />
      <ActivityPanel />
    </div>
  );
}
