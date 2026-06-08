"use client";

/** RevenuePanel — 구독 결제 요약 + 최근 결제. (foundone_payments) */
import { useAdminFetch } from "./useAdminFetch";
import { MetricCard, MetricGrid } from "./MetricCard";
import { Card, EmptyState, StatusDot, tableStyles, MUTED, fmtDate, fmtNum } from "./ui";

type RecentPayment = {
  id: string; email: string; amount: number; currency: string;
  status: string; plan: string; paidAt: string | null; createdAt: string;
};
type RevenueResp = {
  ok: boolean;
  metrics: { paidCount: number; paidTotal: number; currency: string; activeSubscribers: number; totalRows: number };
  recent: RecentPayment[];
};

function statusTone(status: string): "ok" | "warn" | "off" {
  if (status === "PAID") return "ok";
  if (status === "FAILED" || status === "CANCELLED") return "off";
  return "warn";
}

export function RevenuePanel() {
  const { data, loading, error } = useAdminFetch<RevenueResp>("/api/admin/revenue");
  const m = data?.metrics;
  const recent = data?.recent ?? [];

  return (
    <div>
      {error && <Card style={{ padding: 16, color: "#b64c4c", fontSize: 13.5, marginBottom: 16 }}>{error}</Card>}

      <MetricGrid>
        <MetricCard label="누적 결제액 (PAID)" value={m?.paidTotal ?? null} unit="원" accent />
        <MetricCard label="결제 건수 (PAID)" value={m?.paidCount ?? null} unit="건" />
        <MetricCard label="활성 구독자" value={m?.activeSubscribers ?? null} unit="명" hint="최근 31일 결제" />
      </MetricGrid>

      <div style={{ marginTop: 22 }}>
        <Card style={{ overflow: "hidden" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#16181d", padding: "16px 18px 4px" }}>최근 결제</div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>이메일</th>
                  <th style={tableStyles.th}>플랜</th>
                  <th style={tableStyles.th}>금액</th>
                  <th style={tableStyles.th}>상태</th>
                  <th style={tableStyles.th}>결제일</th>
                </tr>
              </thead>
              <tbody>
                {!loading && recent.map((r) => (
                  <tr key={r.id}>
                    <td style={tableStyles.td}>{r.email}</td>
                    <td style={tableStyles.td}>{r.plan}</td>
                    <td style={tableStyles.td}>{fmtNum(r.amount)} {r.currency}</td>
                    <td style={tableStyles.td}><StatusDot tone={statusTone(r.status)} />{r.status}</td>
                    <td style={tableStyles.td}>{fmtDate(r.paidAt ?? r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <EmptyState>불러오는 중…</EmptyState>}
          {!loading && recent.length === 0 && <EmptyState>결제 내역이 없습니다.</EmptyState>}
        </Card>
        <p style={{ fontSize: 11.5, color: MUTED, marginTop: 10 }}>
          ※ Found.One 구독 결제 기준(foundone_payments). 사장님 매장 매출과는 별개입니다.
        </p>
      </div>
    </div>
  );
}
