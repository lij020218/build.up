"use client";

/**
 * ApplicationsInbox — 지원사업 앱 내부 신청 목록.
 *   사장님이 "신청하기"로 보낸 현 사업체 스냅샷(이름·아이디어·최근 매출·사용자 수 변화 등)을 카드로 정리.
 *   읽기 전용(상태 변경 없음) — 선정/연락은 오프라인으로.
 */
import { useState } from "react";
import { useAdminFetch } from "./useAdminFetch";
import { Card, EmptyState, MUTED, NAVY, fmtNum, fmtDate } from "./ui";
import { Pager } from "./FeedbackInbox";

type ApplicationItem = {
  id: string;
  programId: string;
  status: string;
  pitch: string | null;
  storeName: string | null;
  industryCategoryId: string | null;
  businessLaunched: boolean | null;
  businessLaunchedDate: string | null;
  monthlyAvgRevenue: number | null;
  hasUserSales: boolean | null;
  weeklySalesChangePct: number | null;
  recentCustomers: number | null;
  customerChangePct: number | null;
  employeesCount: number | null;
  createdAt: string;
  email: string;
};
type ApplicationsResp = { ok: boolean; items: ApplicationItem[]; page: number; total: number | null; hasMore: boolean };

const PROGRAM_LABEL: Record<string, string> = {
  "foundone-startup-grant-1": "파운드원 1차 창업지원금",
};

/** 변화율 표기 — null 이면 "—", 부호·색 포함. */
function pctLabel(v: number | null): { text: string; color: string } {
  if (v == null) return { text: "—", color: MUTED };
  const sign = v > 0 ? "+" : "";
  const color = v > 0 ? "#2d6a4f" : v < 0 ? "#b64c4c" : MUTED;
  return { text: `${sign}${v}%`, color };
}

export function ApplicationsInbox() {
  const [page, setPage] = useState(0);
  const { data, loading, error } = useAdminFetch<ApplicationsResp>(`/api/admin/applications?page=${page}`);
  const items = data?.items ?? [];

  return (
    <div>
      {typeof data?.total === "number" && (
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12 }}>
          총 <strong style={{ color: NAVY }}>{data.total}</strong>건 신청
        </div>
      )}

      {error && <Card style={{ padding: 16, color: "#b64c4c", fontSize: 13.5 }}>{error}</Card>}

      <Card style={{ overflow: "hidden" }}>
        {loading && <EmptyState>불러오는 중…</EmptyState>}
        {!loading && items.length === 0 && <EmptyState>아직 신청이 없습니다.</EmptyState>}
        {!loading && items.map((it, i) => {
          const change = pctLabel(it.customerChangePct ?? it.weeklySalesChangePct);
          const changeLabel = it.customerChangePct != null ? "손님·사용자 변화(주간)" : "매출 변화(주간)";
          const opMonths = it.businessLaunchedDate
            ? Math.max(0, Math.round((Date.now() - new Date(it.businessLaunchedDate).getTime()) / (30 * 86400000)))
            : null;
          return (
            <div key={it.id} style={{ padding: "16px 18px", borderTop: i === 0 ? "none" : "1px solid rgba(17,17,17,0.05)" }}>
              {/* 헤더: 사업체명 + 프로그램 + 신청일 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#16181d" }}>{it.storeName ?? "(이름 미입력)"}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, background: "rgba(29,53,87,0.06)", padding: "2px 8px", borderRadius: 999 }}>
                  {PROGRAM_LABEL[it.programId] ?? it.programId}
                </span>
                {it.industryCategoryId && (
                  <span style={{ fontSize: 11.5, color: MUTED, border: "1px solid rgba(17,17,17,0.1)", padding: "2px 8px", borderRadius: 999 }}>
                    {it.industryCategoryId}
                  </span>
                )}
                <span style={{ fontSize: 11.5, color: MUTED, marginLeft: "auto" }}>{it.email}</span>
                <span style={{ fontSize: 11.5, color: MUTED }}>{fmtDate(it.createdAt)}</span>
              </div>

              {/* 아이디어·열정 */}
              {it.pitch && (
                <div style={{ fontSize: 13, color: "#23262d", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "rgba(29,53,87,0.03)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                  {it.pitch}
                </div>
              )}

              {/* 지표 */}
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
                <Metric label="최근 매출(월환산)" value={it.monthlyAvgRevenue != null ? `${fmtNum(it.monthlyAvgRevenue)}원` : (it.hasUserSales === false ? "매출 없음" : "—")} />
                <Metric label={changeLabel} value={change.text} valueColor={change.color} />
                <Metric label="최근 손님·사용자" value={it.recentCustomers != null ? `${fmtNum(it.recentCustomers)}명` : "—"} />
                <Metric label="운영 기간" value={it.businessLaunched === false ? "예비창업" : opMonths != null ? `약 ${opMonths}개월` : "—"} />
                <Metric label="직원 수" value={it.employeesCount != null ? `${fmtNum(it.employeesCount)}명` : "—"} />
              </div>
            </div>
          );
        })}
      </Card>

      <Pager page={page} hasMore={data?.hasMore ?? false} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
    </div>
  );
}

function Metric({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: MUTED, letterSpacing: "0.02em" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: valueColor ?? "#16181d" }}>{value}</span>
    </div>
  );
}
