"use client";

/**
 * ActivityPanel — 사용자별 일자 활동 로그 (2026-08-01 사장님 요청)
 *
 *   "a사용자 8월 3일 로드맵 사용 (최신 사용일 8월 3일)"
 *
 *  두 시선을 한 화면에:
 *   · 날짜별 — 그 날 몇 명이 썼나 (막대 + 클릭해 그날 사용자만 보기)
 *   · 사용자별 — 최신 사용일 순. 펼치면 날짜별로 어떤 화면·AI 를 썼는지
 *
 *  정직성: 계측 시작일(2026-07-28) 이전은 기록 자체가 없다 → 화면이 그 사실을 말한다.
 *   조회 실패는 "집계 불가 + 사유" (빈 목록으로 위장 금지).
 */
import { useMemo, useState } from "react";
import { useAdminFetch } from "./useAdminFetch";
import { Card, EmptyState, tableStyles, MUTED, NAVY, fmtNum } from "./ui";
import { MetricCard, MetricGrid } from "./MetricCard";
import { surfaceLabel, aiFeatureLabel, formatKoreanDay, relativeDayLabel } from "./activity-labels";

type DayActivity = {
  date: string;
  surfaces: Array<{ surface: string; count: number }>;
  aiFeatures: Array<{ feature: string; count: number }>;
};
type UserActivity = {
  userId: string;
  email: string;
  lastActiveDate: string;
  activeDays: number;
  days: DayActivity[];
};
type ActivityResp = {
  ok: boolean;
  days: number;
  visitsFailed: boolean;
  aiFailed: boolean;
  trackingSince: string;
  daily: Array<{ date: string; users: number }>;
  users: UserActivity[];
};

const RANGES = [7, 14, 30] as const;

export function ActivityPanel() {
  const [days, setDays] = useState<number>(14);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState<string | null>(null);
  const { data, loading, error } = useAdminFetch<ActivityResp>(`/api/admin/activity?days=${days}`);

  const daily = data?.daily ?? [];
  const maxUsers = useMemo(() => Math.max(1, ...daily.map((d) => d.users)), [daily]);

  // 날짜를 고르면 그 날 활동한 사용자만
  const users = useMemo(() => {
    const all = data?.users ?? [];
    if (!selectedDate) return all;
    return all
      .filter((u) => u.days.some((d) => d.date === selectedDate))
      .map((u) => ({ ...u, days: u.days.filter((d) => d.date === selectedDate) }));
  }, [data, selectedDate]);

  const todayUsers = daily[0]?.users ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 기간 선택 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => { setDays(r); setSelectedDate(null); }}
            style={{
              padding: "7px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              border: days === r ? `1.5px solid ${NAVY}` : "1px solid rgba(15,23,42,0.12)",
              background: days === r ? "rgba(25,25,112,0.06)" : "#fff",
              color: days === r ? NAVY : MUTED,
            }}
          >
            최근 {r}일
          </button>
        ))}
        {selectedDate && (
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            style={{
              padding: "7px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: "1px solid rgba(15,23,42,0.12)", background: "#fff", color: MUTED,
            }}
          >
            ✕ {formatKoreanDay(selectedDate)} 필터 해제
          </button>
        )}
      </div>

      {error && <Card><EmptyState>불러오지 못했습니다 — {error}</EmptyState></Card>}

      {(data?.visitsFailed || data?.aiFailed) && (
        <Card style={{ background: "rgba(182,76,76,0.05)" }}>
          <div style={{ fontSize: 12.5, color: "#b64c4c", lineHeight: 1.6 }}>
            {data?.visitsFailed && <div>화면 방문 집계 불가 — surface_daily_visits 조회 실패 (마이그레이션 20260728_000002 확인).</div>}
            {data?.aiFailed && <div>AI 사용 집계 불가 — ai_daily_usage 조회 실패.</div>}
            아래 목록은 성공한 항목만 담고 있어 실제보다 적을 수 있습니다.
          </div>
        </Card>
      )}

      <MetricGrid>
        <MetricCard label="오늘 사용자" value={todayUsers} unit="명" hint="계측된 활동 기준" />
        <MetricCard label={`최근 ${days}일 사용자`} value={data ? data.users.length : null} unit="명" hint="1회 이상 활동" />
        <MetricCard label="활동 기록 일수" value={data ? data.daily.length : null} unit="일" hint={`계측 시작 ${data?.trackingSince ?? "—"}`} />
      </MetricGrid>

      {/* 날짜별 — 그 날 몇 명이 썼나 */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 750, color: "#0f172a", marginBottom: 4 }}>날짜별 사용자 수</div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
          막대를 누르면 그 날 사용한 사람만 아래에 보입니다.
        </div>
        {loading && daily.length === 0 ? (
          <EmptyState>불러오는 중…</EmptyState>
        ) : daily.length === 0 ? (
          <EmptyState>기간 내 계측된 활동이 없습니다.</EmptyState>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {daily.map((d) => {
              const on = selectedDate === d.date;
              const rel = relativeDayLabel(d.date);
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(on ? null : d.date)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "7px 10px", borderRadius: 9, cursor: "pointer", textAlign: "left",
                    border: on ? `1.5px solid ${NAVY}` : "1px solid transparent",
                    background: on ? "rgba(25,25,112,0.05)" : "transparent",
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 650, color: "#0f172a", minWidth: 116 }}>
                    {formatKoreanDay(d.date)}
                  </span>
                  <span style={{ fontSize: 11, color: MUTED, minWidth: 40 }}>{rel ?? ""}</span>
                  <span style={{ flex: 1, height: 8, background: "rgba(15,23,42,0.05)", borderRadius: 999, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${(d.users / maxUsers) * 100}%`, background: NAVY, borderRadius: 999 }} />
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 750, color: NAVY, minWidth: 34, textAlign: "right" }}>
                    {fmtNum(d.users)}명
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* 사용자별 — 최신 사용일 순 */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 750, color: "#0f172a", marginBottom: 4 }}>
          사용자별 활동 {selectedDate && <span style={{ color: NAVY }}>· {formatKoreanDay(selectedDate)}</span>}
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
          최신 사용일이 빠른 순. 행을 누르면 날짜별로 무엇을 썼는지 펼쳐집니다.
        </div>
        {loading && users.length === 0 ? (
          <EmptyState>불러오는 중…</EmptyState>
        ) : users.length === 0 ? (
          <EmptyState>
            {selectedDate ? "이 날 계측된 활동이 없습니다." : "기간 내 계측된 활동이 없습니다."}
          </EmptyState>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                <th style={tableStyles.th}>사용자</th>
                <th style={tableStyles.th}>최신 사용일</th>
                <th style={{ ...tableStyles.th, textAlign: "right" }}>활동일</th>
                <th style={tableStyles.th}>최근 사용 내역</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const open = openUser === u.userId;
                const top = u.days[0];
                const rel = relativeDayLabel(u.lastActiveDate);
                return (
                  <>
                    <tr
                      key={u.userId}
                      onClick={() => setOpenUser(open ? null : u.userId)}
                      style={{ cursor: "pointer", background: open ? "rgba(25,25,112,0.03)" : undefined }}
                    >
                      <td style={{ ...tableStyles.td, fontWeight: 650 }}>{u.email || "—"}</td>
                      <td style={tableStyles.td}>
                        {formatKoreanDay(u.lastActiveDate)}
                        {rel && <span style={{ color: MUTED, fontSize: 11.5, marginLeft: 6 }}>{rel}</span>}
                      </td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>{fmtNum(u.activeDays)}일</td>
                      <td style={{ ...tableStyles.td, color: MUTED }}>
                        {top
                          ? [
                              ...top.surfaces.slice(0, 3).map((s) => surfaceLabel(s.surface)),
                              ...top.aiFeatures.slice(0, 2).map((f) => `${aiFeatureLabel(f.feature)}(AI)`),
                            ].join(" · ") || "—"
                          : "—"}
                        <span style={{ marginLeft: 8, color: NAVY, fontSize: 11.5, fontWeight: 700 }}>
                          {open ? "접기" : "펼치기"}
                        </span>
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${u.userId}-detail`}>
                        <td colSpan={4} style={{ ...tableStyles.td, background: "rgba(15,23,42,0.02)" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "4px 0" }}>
                            {u.days.map((d) => (
                              <div key={d.date} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", minWidth: 112 }}>
                                  {formatKoreanDay(d.date)}
                                </span>
                                <span style={{ flex: 1, minWidth: 220, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {d.surfaces.map((s) => (
                                    <span key={s.surface} style={chip}>
                                      {surfaceLabel(s.surface)}
                                      <span style={{ color: MUTED, marginLeft: 4 }}>{s.count}회</span>
                                    </span>
                                  ))}
                                  {d.aiFeatures.map((f) => (
                                    <span key={f.feature} style={{ ...chip, background: "rgba(25,25,112,0.06)", color: NAVY }}>
                                      {aiFeatureLabel(f.feature)} <span style={{ opacity: 0.7 }}>AI {f.count}회</span>
                                    </span>
                                  ))}
                                  {d.surfaces.length === 0 && d.aiFeatures.length === 0 && (
                                    <span style={{ fontSize: 12, color: MUTED }}>—</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
        <div style={{ fontSize: 11, color: MUTED, marginTop: 12, lineHeight: 1.6 }}>
          화면 방문은 탭 진입 기준이라 체류·완료를 뜻하지 않습니다. 목록에 없는 사용자는
          “안 썼다”가 아니라 <strong>계측된 활동이 없다</strong>는 뜻이며,
          {data?.trackingSince ?? "계측 시작일"} 이전 활동은 기록이 없습니다.
        </div>
      </Card>
    </div>
  );
}

const chip: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 650,
  color: "#0f172a",
  background: "rgba(15,23,42,0.05)",
  borderRadius: 999,
  padding: "3px 9px",
  whiteSpace: "nowrap",
};
