"use client";

/** FeedbackInbox — 종류·영역·상태 필터 + 피드백 행(영역 배지·상태 변경) + 페이지네이션. */
import { useState } from "react";
import { useAdminFetch, adminPost } from "./useAdminFetch";
import { Card, Chip, EmptyState, StatusDot, MUTED, NAVY, CATEGORY_LABEL, fmtDate } from "./ui";
import { FEEDBACK_AREAS, areaLabel } from "../../feedback/areas";

type FeedbackItem = {
  id: string;
  category: string;
  area: string | null;
  status: string;
  message: string;
  platform: string | null;
  screen: string | null;
  createdAt: string;
  email: string;
};
type FeedbackResp = { ok: boolean; items: FeedbackItem[]; page: number; total: number | null; hasMore: boolean };

const CAT_FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: "전체" },
  { key: "bug", label: "버그·오류" },
  { key: "idea", label: "기능 제안" },
  { key: "ux", label: "사용성" },
  { key: "other", label: "기타" },
];

const STATUS_FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: "전체" },
  { key: "new", label: "신규" },
  { key: "reviewing", label: "검토중" },
  { key: "resolved", label: "반영함" },
  { key: "wontfix", label: "보류" },
];

const STATUS_OPTS = [
  { key: "new", label: "신규" },
  { key: "reviewing", label: "검토중" },
  { key: "resolved", label: "반영함" },
  { key: "wontfix", label: "보류" },
];

function statusTone(s: string): "ok" | "warn" | "off" {
  if (s === "resolved") return "ok";
  if (s === "wontfix") return "off";
  return "warn"; // new, reviewing
}

export function FeedbackInbox() {
  const [category, setCategory] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (area) qs.set("area", area);
  if (statusFilter) qs.set("status", statusFilter);
  qs.set("page", String(page));
  const { data, loading, error, reload } = useAdminFetch<FeedbackResp>(`/api/admin/feedback?${qs.toString()}`);

  const items = data?.items ?? [];

  const changeStatus = async (id: string, status: string) => {
    setOverrides((o) => ({ ...o, [id]: status })); // 낙관적
    const res = await adminPost("/api/admin/feedback/status", { id, status });
    if (!res.ok) {
      setOverrides((o) => { const n = { ...o }; delete n[id]; return n; }); // 롤백
      reload();
    }
  };

  return (
    <div>
      {/* 필터: 종류 */}
      <FilterRow label="종류">
        {CAT_FILTERS.map((f) => (
          <Chip key={f.label} active={category === f.key} onClick={() => { setCategory(f.key); setPage(0); }}>{f.label}</Chip>
        ))}
      </FilterRow>

      {/* 필터: 상태 */}
      <FilterRow label="상태">
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.label} active={statusFilter === f.key} onClick={() => { setStatusFilter(f.key); setPage(0); }}>{f.label}</Chip>
        ))}
      </FilterRow>

      {/* 필터: 영역 (select — 10개) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: MUTED, width: 38, flexShrink: 0 }}>영역</span>
        <select
          value={area ?? ""}
          onChange={(e) => { setArea(e.target.value || null); setPage(0); }}
          style={{ padding: "7px 10px", borderRadius: 9, fontSize: 12.5, fontFamily: "inherit", border: "1px solid rgba(17,17,17,0.12)", background: "#fff", color: "#16181d", cursor: "pointer", outline: "none" }}
        >
          <option value="">전체 영역</option>
          {FEEDBACK_AREAS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
        </select>
      </div>

      {error && <Card style={{ padding: 16, color: "#b64c4c", fontSize: 13.5 }}>{error}</Card>}

      <Card style={{ overflow: "hidden" }}>
        {loading && <EmptyState>불러오는 중…</EmptyState>}
        {!loading && items.length === 0 && <EmptyState>해당 조건의 피드백이 없습니다.</EmptyState>}
        {!loading && items.map((it, i) => {
          const status = overrides[it.id] ?? it.status;
          return (
            <div key={it.id} style={{ padding: "14px 18px", borderTop: i === 0 ? "none" : "1px solid rgba(17,17,17,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                {/* 영역 배지 (주황 아님 — 네이비 틴트) */}
                <span style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, background: "rgba(29,53,87,0.06)", padding: "2px 8px", borderRadius: 999 }}>
                  {areaLabel(it.area)}
                </span>
                {/* 종류 */}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: MUTED, border: "1px solid rgba(17,17,17,0.1)", padding: "2px 8px", borderRadius: 999 }}>
                  {CATEGORY_LABEL[it.category] ?? it.category}
                </span>
                <span style={{ fontSize: 11.5, color: MUTED }}>{it.email}</span>
                <span style={{ fontSize: 11.5, color: MUTED, marginLeft: "auto" }}>{fmtDate(it.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13.5, color: "#23262d", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{it.message}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 9, flexWrap: "wrap" }}>
                {(it.platform || it.screen) && (
                  <span style={{ fontSize: 11, color: MUTED }}>
                    {it.platform && <span style={{ marginRight: 10 }}>플랫폼: {it.platform}</span>}
                    {it.screen && <span>화면: {it.screen}</span>}
                  </span>
                )}
                {/* 상태 변경 */}
                <label style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <StatusDot tone={statusTone(status)} />
                  <select
                    value={status}
                    onChange={(e) => changeStatus(it.id, e.target.value)}
                    style={{ padding: "5px 8px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", border: "1px solid rgba(17,17,17,0.14)", background: "#fff", color: "#23262d", cursor: "pointer", outline: "none" }}
                  >
                    {STATUS_OPTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </label>
              </div>
            </div>
          );
        })}
      </Card>

      <Pager page={page} hasMore={data?.hasMore ?? false} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: MUTED, width: 38, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div>
    </div>
  );
}

export function Pager({ page, hasMore, onPrev, onNext, base = 0 }: { page: number; hasMore: boolean; onPrev: () => void; onNext: () => void; base?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 }}>
      <button type="button" onClick={onPrev} disabled={page <= base} style={pagerBtn(page <= base)}>이전</button>
      <span style={{ fontSize: 12.5, color: MUTED }}>{page + (base === 0 ? 1 : 0)} 페이지</span>
      <button type="button" onClick={onNext} disabled={!hasMore} style={pagerBtn(!hasMore)}>다음</button>
    </div>
  );
}

function pagerBtn(disabled: boolean) {
  return {
    padding: "7px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: `1px solid ${disabled ? "rgba(17,17,17,0.08)" : "rgba(29,53,87,0.3)"}`,
    background: "#fff", color: disabled ? "#b6bbc4" : NAVY,
    cursor: disabled ? "default" : "pointer",
  } as const;
}
