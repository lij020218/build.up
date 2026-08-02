"use client";

/**
 * /dev/activity-preview — 사용자 활동 패널 렌더 검증 (dev 전용).
 *   /admin/activity 는 로그인 게이트라 실렌더 확인이 불가 → 패널을 목데이터로 띄운다.
 *   prod 에서는 404.
 */
import { notFound } from "next/navigation";
import { ActivityPanel } from "../../lib/components/admin/ActivityPanel";

export default function ActivityPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", letterSpacing: "0.12em", marginBottom: 6 }}>
        DEV 프리뷰 — 실제 API 호출 (미인증이면 오류 상태를 그대로 보여줍니다)
      </div>
      <ActivityPanel />
    </div>
  );
}
