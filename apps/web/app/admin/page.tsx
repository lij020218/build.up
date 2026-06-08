"use client";

/** /admin — 개요(핵심 지표). */
import { useAdminFetch } from "../lib/components/admin/useAdminFetch";
import { MetricCard, MetricGrid } from "../lib/components/admin/MetricCard";
import { Card, PageHeader, EmptyState, MUTED, NAVY, fmtNum } from "../lib/components/admin/ui";

type StageBucket = { stage: string; count: number };
type Overview = {
  ok: boolean;
  metrics: {
    totalUsers: number | null;
    todayUsers: number | null;
    activeUsers7d: number | null;
    totalFeedback: number | null;
    stageDistribution: StageBucket[] | null;
  };
};

export default function AdminOverviewPage() {
  const { data, loading, error } = useAdminFetch<Overview>("/api/admin/overview");
  const m = data?.metrics;

  return (
    <div>
      <PageHeader title="개요" subtitle="가입·활성·피드백 한눈에 보기 (KST 기준)" />

      {error && <Card style={{ padding: 16, color: "#b64c4c", fontSize: 13.5, marginBottom: 16 }}>{error}</Card>}

      <MetricGrid>
        <MetricCard label="총 가입자" value={m?.totalUsers ?? null} unit="명" accent />
        <MetricCard label="오늘 가입" value={m?.todayUsers ?? null} unit="명" />
        <MetricCard label="활성 사장님" value={m?.activeUsers7d ?? null} unit="명" hint="최근 7일 매출 입력" />
        <MetricCard label="누적 피드백" value={m?.totalFeedback ?? null} unit="건" />
      </MetricGrid>

      <div style={{ marginTop: 22 }}>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#16181d", marginBottom: 14 }}>로드맵 단계 분포</div>
          {loading && <EmptyState>불러오는 중…</EmptyState>}
          {!loading && (!m?.stageDistribution || m.stageDistribution.length === 0) && (
            <EmptyState>아직 데이터가 없습니다.</EmptyState>
          )}
          {!loading && m?.stageDistribution && m.stageDistribution.length > 0 && (
            <StageBars buckets={m.stageDistribution} />
          )}
        </Card>
      </div>
    </div>
  );
}

function StageBars({ buckets }: { buckets: StageBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {buckets.map((b) => (
        <div key={b.stage} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 130, fontSize: 12.5, color: "#3a3f49", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.stage}</div>
          <div style={{ flex: 1, height: 10, background: "rgba(29,53,87,0.06)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${(b.count / max) * 100}%`, height: "100%", background: NAVY, borderRadius: 6 }} />
          </div>
          <div style={{ width: 44, textAlign: "right", fontSize: 12.5, fontWeight: 600, color: MUTED }}>{fmtNum(b.count)}</div>
        </div>
      ))}
    </div>
  );
}
