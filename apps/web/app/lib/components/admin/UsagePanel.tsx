"use client";

/**
 * UsagePanel — 기능 사용량 + AI 비용 집계 화면.
 *   실데이터 원장(ai_daily_usage · ai_monthly_spend · marketing_engagement_events)만 표시.
 *   블록별 집계 실패는 "—" + 사유(가짜 0 금지). 비용은 상한가 선차감 기준임을 명시.
 */
import { useAdminFetch } from "./useAdminFetch";
import { MetricCard, MetricGrid } from "./MetricCard";
import { Card, EmptyState, tableStyles, MUTED, NAVY, fmtNum } from "./ui";
import { ExclusionNote } from "./ExclusionNote";
import { SURFACE_LABELS, AI_FEATURE_LABELS as FEATURE_LABELS } from "./activity-labels";

type FeatureUsageRow = { feature: string; calls7d: number; calls30d: number; users30d: number };
type SpendRow = { email: string; spentWon: number };
type EngagementRow = { event: string; count30d: number; users30d: number };
type SurfaceVisitRow = { surface: string; visitDays30d: number; visitDays7d: number; users30d: number };
type UsageResp = {
  ok: boolean;
  /** 집계에서 제외한 내부 계정 수·기준 (조용한 제외 금지 — 화면이 명시) */
  excludedAccounts?: number;
  excludedRules?: string[];
  aiUsage: { features: FeatureUsageRow[]; totalCalls30d: number; aiUsers30d: number } | null;
  spend: {
    monthKey: string;
    budgetWon: number;
    totalWon: number;
    users: number;
    nearBudgetUsers: number;
    top: SpendRow[];
  } | null;
  engagement: EngagementRow[] | null;
  surfaceVisits: SurfaceVisitRow[] | null;
  derived: {
    salesEntryUsers30d: number | null;
    roadmapActiveUsers30d: number | null;
    attendanceStores30d: number | null;
  } | null;
};


/** feature 키 → 한글 라벨 (없는 키는 원문 표기 — 라벨 누락이 데이터를 숨기면 안 됨) */

const ENGAGEMENT_LABELS: Record<string, string> = {
  copy_click: "실행물 [복사] 클릭",
  meme_origin_click: "밈 [원본 보기] 클릭",
};

export function UsagePanel() {
  const { data, loading, error } = useAdminFetch<UsageResp>("/api/admin/usage");
  const usage = data?.aiUsage ?? null;
  const spend = data?.spend ?? null;
  const engagement = data?.engagement ?? null;
  const surfaceVisits = data?.surfaceVisits ?? null;
  const derived = data?.derived ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {error && <Card style={{ padding: 16, color: "#b64c4c", fontSize: 13.5 }}>{error}</Card>}

      <ExclusionNote count={data?.excludedAccounts} rules={data?.excludedRules} />

      <MetricGrid>
        <MetricCard label="AI 호출 (30일)" value={usage?.totalCalls30d ?? null} unit="회" accent hint="ai_daily_usage 원장 합계" />
        <MetricCard label="AI 사용 유저 (30일)" value={usage?.aiUsers30d ?? null} unit="명" />
        <MetricCard
          label={`이번 달 AI 비용 (${spend?.monthKey ?? "—"})`}
          value={spend ? spend.totalWon : null}
          unit="원"
          hint="상한가 선차감 기준 — 실비용은 이보다 낮음"
        />
        <MetricCard
          label="예산 근접 유저"
          value={spend ? spend.nearBudgetUsers : null}
          unit="명"
          hint={`월 ₩${(spend?.budgetWon ?? 6000).toLocaleString("ko-KR")} 의 80% 이상 사용`}
        />
      </MetricGrid>

      {/* 기능별 사용량 */}
      <Card style={{ overflow: "hidden" }}>
        <SectionTitle title="기능별 AI 사용량" sub="최근 30일 · 호출수 내림차순" />
        {usage === null && !loading ? (
          <EmptyState>
            집계 불가 — ai_daily_usage 조회 실패. 마이그레이션(20260629_000002) 적용 여부를 확인하세요.
          </EmptyState>
        ) : usage && usage.features.length === 0 ? (
          <EmptyState>최근 30일 기록된 AI 호출이 없습니다.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>기능</th>
                  <th style={{ ...tableStyles.th, textAlign: "right" }}>7일 호출</th>
                  <th style={{ ...tableStyles.th, textAlign: "right" }}>30일 호출</th>
                  <th style={{ ...tableStyles.th, textAlign: "right" }}>30일 사용자</th>
                  <th style={tableStyles.th}>비중</th>
                </tr>
              </thead>
              <tbody>
                {(usage?.features ?? []).map((f) => {
                  const share = usage && usage.totalCalls30d > 0 ? f.calls30d / usage.totalCalls30d : 0;
                  return (
                    <tr key={f.feature}>
                      <td style={tableStyles.td}>
                        {FEATURE_LABELS[f.feature] ?? f.feature}
                        <span style={{ color: MUTED, fontSize: 11.5, marginLeft: 7 }}>{f.feature}</span>
                      </td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>{fmtNum(f.calls7d)}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right", fontWeight: 700 }}>{fmtNum(f.calls30d)}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>{fmtNum(f.users30d)}</td>
                      <td style={{ ...tableStyles.td, minWidth: 120 }}>
                        <ShareBar ratio={share} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 이번 달 비용 상위 */}
      <Card style={{ overflow: "hidden" }}>
        <SectionTitle title="이번 달 AI 비용 상위 유저" sub="상한가 선차감 원장 기준 · 월 예산 대비" />
        {spend === null && !loading ? (
          <EmptyState>
            집계 불가 — ai_monthly_spend 조회 실패. 마이그레이션(20260728_000001) 적용 여부를 확인하세요.
          </EmptyState>
        ) : spend && spend.top.length === 0 ? (
          <EmptyState>이번 달 기록된 AI 비용이 없습니다.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>이메일</th>
                  <th style={{ ...tableStyles.th, textAlign: "right" }}>차감액</th>
                  <th style={tableStyles.th}>예산 대비</th>
                </tr>
              </thead>
              <tbody>
                {(spend?.top ?? []).map((r, i) => {
                  const ratio = spend ? r.spentWon / spend.budgetWon : 0;
                  return (
                    <tr key={`${r.email}-${i}`}>
                      <td style={tableStyles.td}>{r.email}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right", fontWeight: 700 }}>₩{fmtNum(r.spentWon)}</td>
                      <td style={{ ...tableStyles.td, minWidth: 140 }}>
                        <ShareBar ratio={ratio} label={`${Math.round(ratio * 100)}%`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 화면 방문 (조회형 기능 커버) */}
      <Card style={{ overflow: "hidden" }}>
        <SectionTitle title="화면 방문" sub="최근 30일 · 탭 진입 일 단위 (웹·iOS 공용, 하루 1회 집계)" />
        {surfaceVisits === null && !loading ? (
          <EmptyState>
            집계 불가 — surface_daily_visits 조회 실패. 마이그레이션(20260728_000002) 적용 여부를 확인하세요.
          </EmptyState>
        ) : surfaceVisits && surfaceVisits.length === 0 ? (
          <EmptyState>최근 30일 기록된 화면 방문이 없습니다. (배포 후부터 쌓입니다)</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>화면</th>
                  <th style={{ ...tableStyles.th, textAlign: "right" }}>7일 방문일</th>
                  <th style={{ ...tableStyles.th, textAlign: "right" }}>30일 방문일</th>
                  <th style={{ ...tableStyles.th, textAlign: "right" }}>30일 사용자</th>
                  <th style={tableStyles.th}>비중</th>
                </tr>
              </thead>
              <tbody>
                {(surfaceVisits ?? []).map((s) => {
                  const total = (surfaceVisits ?? []).reduce((sum, r) => sum + r.visitDays30d, 0);
                  const share = total > 0 ? s.visitDays30d / total : 0;
                  return (
                    <tr key={s.surface}>
                      <td style={tableStyles.td}>
                        {SURFACE_LABELS[s.surface] ?? s.surface}
                        <span style={{ color: MUTED, fontSize: 11.5, marginLeft: 7 }}>{s.surface}</span>
                      </td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>{fmtNum(s.visitDays7d)}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right", fontWeight: 700 }}>{fmtNum(s.visitDays30d)}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>{fmtNum(s.users30d)}</td>
                      <td style={{ ...tableStyles.td, minWidth: 120 }}>
                        <ShareBar ratio={share} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 저장 기반 활동 — 계측 없이 기존 데이터에서 파생 */}
      <Card style={{ overflow: "hidden" }}>
        <SectionTitle title="저장 기반 활동" sub="최근 30일 · 저장 발생 기준 (열람만 한 사용은 위 화면 방문에서)" />
        {derived === null && !loading ? (
          <EmptyState>집계 불가 — 파생 지표 조회 실패.</EmptyState>
        ) : (
          <div style={{ display: "flex", gap: 28, padding: "14px 18px 18px", flexWrap: "wrap" }}>
            <DerivedStat label="매출 입력 유저" value={derived?.salesEntryUsers30d ?? null} unit="명" hint="daily_entries 30일 내 날짜" />
            <DerivedStat label="로드맵 진행 유저" value={derived?.roadmapActiveUsers30d ?? null} unit="명" hint="로드맵 30일 내 갱신" />
            <DerivedStat label="출퇴근 기록 가게" value={derived?.attendanceStores30d ?? null} unit="곳" hint="근태 30일 내 기록" />
          </div>
        )}
      </Card>

      {/* 마케팅 실행 신호 */}
      <Card style={{ overflow: "hidden" }}>
        <SectionTitle title="마케팅 실행 신호" sub="최근 30일 — v2 개편(쓸 재료)의 성패 지표" />
        {engagement === null && !loading ? (
          <EmptyState>
            집계 불가 — marketing_engagement_events 조회 실패. 마이그레이션(20260725_000001) 적용 여부를 확인하세요.
          </EmptyState>
        ) : engagement && engagement.length === 0 ? (
          <EmptyState>최근 30일 기록된 실행 신호가 없습니다.</EmptyState>
        ) : (
          <div style={{ display: "flex", gap: 24, padding: "14px 18px 18px", flexWrap: "wrap" }}>
            {(engagement ?? []).map((e) => (
              <div key={e.event}>
                <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 4 }}>
                  {ENGAGEMENT_LABELS[e.event] ?? e.event}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>
                  {fmtNum(e.count30d)}
                  <span style={{ fontSize: 12.5, color: MUTED, fontWeight: 600, marginLeft: 5 }}>
                    회 · {fmtNum(e.users30d)}명
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/** 파생 지표 스탯 — null 이면 "—" (가짜 0 금지) */
function DerivedStat({ label, value, unit, hint }: { label: string; value: number | null; unit: string; hint: string }) {
  const shown = fmtNum(value);
  return (
    <div>
      <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>
        {shown}
        {shown !== "—" && <span style={{ fontSize: 12.5, color: MUTED, fontWeight: 600, marginLeft: 4 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{hint}</div>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: "16px 18px 10px", display: "flex", alignItems: "baseline", gap: 10 }}>
      <span style={{ fontSize: 14.5, fontWeight: 800, color: "#16181d", letterSpacing: "-0.01em" }}>{title}</span>
      {sub && <span style={{ fontSize: 12, color: MUTED }}>{sub}</span>}
    </div>
  );
}

/** 절제된 비중 바 — 네이비 단색, 신호등 금지 */
function ShareBar({ ratio, label }: { ratio: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(29,53,87,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: NAVY, opacity: 0.75 }} />
      </div>
      <span style={{ fontSize: 11.5, color: MUTED, minWidth: 34, textAlign: "right" }}>
        {label ?? `${Math.round(pct)}%`}
      </span>
    </div>
  );
}
