"use client";

/** /admin/users — 가입자 목록. */
import { PageHeader } from "../../lib/components/admin/ui";
import { UserTable } from "../../lib/components/admin/UserTable";

export default function AdminUsersPage() {
  return (
    <div>
      <PageHeader title="사용자" subtitle="가입자 현황 — 이메일은 보호를 위해 마스킹됩니다" />
      <UserTable />
    </div>
  );
}
