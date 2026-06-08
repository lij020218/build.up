"use client";

/** UserTable — 가입자 테이블(검색 + 페이지네이션). */
import { useState } from "react";
import { useAdminFetch } from "./useAdminFetch";
import { Card, EmptyState, StatusDot, tableStyles, MUTED, NAVY, fmtDate } from "./ui";
import { Pager } from "./FeedbackInbox";

type UserRow = {
  id: string;
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  confirmed: boolean;
  storeName: string | null;
  industry: string | null;
  stage: string | null;
  progress: number | null;
  lastEntryDate: string | null;
};
type UsersResp = { ok: boolean; items: UserRow[]; page: number; hasMore: boolean };

export function UserTable() {
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  if (q) qs.set("q", q);
  const { data, loading, error } = useAdminFetch<UsersResp>(`/api/admin/users?${qs.toString()}`);
  const items = data?.items ?? [];

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); setQ(qInput.trim()); }}
        style={{ display: "flex", gap: 8, marginBottom: 14, maxWidth: 360 }}
      >
        <input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="이메일 검색 (현재 페이지 내)"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(17,17,17,0.12)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
        />
        <button type="submit" style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: NAVY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>검색</button>
      </form>

      {error && <Card style={{ padding: 16, color: "#b64c4c", fontSize: 13.5 }}>{error}</Card>}

      <Card style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyles.table}>
            <thead>
              <tr>
                <th style={tableStyles.th}>이메일</th>
                <th style={tableStyles.th}>상호</th>
                <th style={tableStyles.th}>업종</th>
                <th style={tableStyles.th}>단계</th>
                <th style={tableStyles.th}>최근 입력</th>
                <th style={tableStyles.th}>가입일</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.map((u) => (
                <tr key={u.id}>
                  <td style={tableStyles.td}>
                    <StatusDot tone={u.confirmed ? "ok" : "off"} />{u.email}
                  </td>
                  <td style={tableStyles.td}>{u.storeName ?? "—"}</td>
                  <td style={tableStyles.td}>{u.industry ?? "—"}</td>
                  <td style={tableStyles.td}>
                    {u.stage ?? "—"}
                    {typeof u.progress === "number" && <span style={{ color: MUTED, marginLeft: 6 }}>{u.progress}%</span>}
                  </td>
                  <td style={tableStyles.td}>{u.lastEntryDate ?? "—"}</td>
                  <td style={tableStyles.td}>{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <EmptyState>불러오는 중…</EmptyState>}
        {!loading && items.length === 0 && <EmptyState>사용자가 없습니다.</EmptyState>}
      </Card>

      <Pager page={page} base={1} hasMore={data?.hasMore ?? false} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => p + 1)} />
    </div>
  );
}
