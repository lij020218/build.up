"use client";

/** /admin/applications — 지원사업 신청 목록. */
import { PageHeader } from "../../lib/components/admin/ui";
import { ApplicationsInbox } from "../../lib/components/admin/ApplicationsInbox";

export default function AdminApplicationsPage() {
  return (
    <div>
      <PageHeader title="지원사업 신청" subtitle="파운드원 지원사업에 신청한 사장님 사업체 정보" />
      <ApplicationsInbox />
    </div>
  );
}
