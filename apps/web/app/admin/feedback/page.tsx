"use client";

/** /admin/feedback — 피드백 수신함. */
import { PageHeader } from "../../lib/components/admin/ui";
import { FeedbackInbox } from "../../lib/components/admin/FeedbackInbox";

export default function AdminFeedbackPage() {
  return (
    <div>
      <PageHeader title="피드백" subtitle="사장님이 보낸 의견 — 카테고리로 필터링" />
      <FeedbackInbox />
    </div>
  );
}
