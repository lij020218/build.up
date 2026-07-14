"use client";

/**
 * 팀 현황 카드 — 인원 / 예상 급여 / 4대보험 등록 수 한눈에.
 *
 *  ── 사용처 ──────────────────────────────
 *  • Tier 1.5 코칭 (DailyOpsRitualCard 직후 — 매일 보는 핵심 운영 카드)
 *  • (이전엔 Tier 3 운영관리 그리드에 있었으나 사장님 요청으로 상단 이동 2026-05-07)
 *  ─────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { Calendar, Check } from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import type { DashboardComputed } from "../../hooks/useDashboardComputed";
import { useProfileStore } from "../../stores/profile-store";
import { supabase } from "../../../../lib/supabase";

// 초대된 직원 (store_members) — 대시보드 팀카드가 세는 대상 (2026-07-14).
type StoreMember = { member_user_id: string; name: string; role: "staff" | "manager" };

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
};

export function TeamCard({ d, c, ko, fmt }: Props) {
  // ⚠️ 2026-07-14 버그픽스: 종전엔 c.employees(수동 급여 명단, operations-store)만 세어
  //   초대 링크로 연결된 직원(store_members)이 팀카드에 안 잡혔음 (직원 관리 페이지엔 뜨는데).
  //   TeamSurface 와 동일하게 get_store_members SECURITY DEFINER RPC 로 조회
  //   (user_profiles 는 본인전용 RLS라 직접 조인 불가).
  const [members, setMembers] = useState<StoreMember[]>([]);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.rpc("get_store_members" as never);
      if (alive && Array.isArray(data)) setMembers(data as StoreMember[]);
    })();
    return () => { alive = false; };
  }, []);
  const manualCount = c.employees.length;          // 수동 급여 명단 (시급·4대보험 산정용)
  const teamCount = members.length > 0 ? members.length : manualCount; // 초대 직원 우선, 없으면 수동
  const hasPayroll = manualCount > 0;              // 인건비·4대보험은 수동 명단 있을 때만 산정 가능

  const payDay = useProfileStore((s) => s.payDay);
  const setPayDay = useProfileStore((s) => s.setPayDay);
  const [editingPayDay, setEditingPayDay] = useState(false);
  const [draftPayDay, setDraftPayDay] = useState<string>(payDay != null ? String(payDay) : "25");

  const savePayDay = () => {
    const n = parseInt(draftPayDay, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 31) {
      setPayDay(n);
      setEditingPayDay(false);
    }
  };
  const clearPayDay = () => {
    setPayDay(null);
    setEditingPayDay(false);
  };
  return (
    <article
      style={{
        borderRadius: "20px",
        border: "1px solid rgba(25,25,112,0.10)",
        background: "#fff",
        padding: "18px 22px",
        display: "grid",
        gap: "10px",
      }}
      className="bento-card"
      data-team-card
      id="team-card"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {ko ? "팀 현황" : "Team"}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 650,
              padding: "2px 8px",
              borderRadius: "6px",
              background: "rgba(25,25,112,0.06)",
              color: "var(--primary)",
            }}
          >
            {teamCount}
            {ko ? "명" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={() => d.navigateToSurface("team")}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--primary)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {ko ? "관리하기 →" : "Manage →"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
        <div
          style={{
            padding: "10px",
            borderRadius: "10px",
            background: "rgba(25,25,112,0.025)",
            textAlign: "center" as const,
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{teamCount}</div>
          <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>
            {ko ? "인원" : "Staff"}
          </div>
        </div>
        <div
          style={{
            padding: "10px",
            borderRadius: "10px",
            background: "rgba(25,25,112,0.025)",
            textAlign: "center" as const,
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
            {hasPayroll ? fmt(c.estimatedMonthlyPayroll) : "—"}
          </div>
          <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>
            {ko ? "예상 인건비" : "Labor cost"}
          </div>
        </div>
        <div
          style={{
            padding: "10px",
            borderRadius: "10px",
            background: "rgba(25,25,112,0.025)",
            textAlign: "center" as const,
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{hasPayroll ? c.insuredEmployees : "—"}</div>
          <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>
            {ko ? "4대보험" : "Insured"}
          </div>
        </div>
      </div>

      {/* 직원 명단 — 초대된 직원 이름 칩 (사장님: 팀카드에 명단이 안 뜬다) 2026-07-14 */}
      {members.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {members.map((m) => (
            <span
              key={m.member_user_id}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                fontSize: "12px", fontWeight: 650, color: "#0f172a",
                background: "rgba(25,25,112,0.05)", padding: "5px 10px", borderRadius: "999px",
              }}
            >
              {m.name}
              {m.role === "manager" && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--primary)" }}>
                  {ko ? "매니저" : "Mgr"}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {teamCount === 0 && (
        <button
          type="button"
          onClick={() => d.navigateToSurface("team")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px dashed rgba(0,0,0,0.1)",
            background: "transparent",
            cursor: "pointer",
            fontSize: "13px",
            color: "var(--muted)",
            fontWeight: 500,
          }}
        >
          {ko
            ? "직원 페이지에서 초대 링크로 직원을 연결하세요 — 근무표·출퇴근·연차 관리"
            : "Invite staff from the Team page — schedules, attendance & time off"}
        </button>
      )}

      {/* 월급일 설정 — 임금체불 방지 알림용 (사용자 요청 2026-05-09) */}
      {teamCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(25,25,112,0.025)",
            border: "1px solid rgba(25,25,112,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
            <Calendar size={14} strokeWidth={1.5} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.65)" }}>
              {ko ? "월급 지급일" : "Payday"}
            </span>
            {editingPayDay ? (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "매월" : "Day"}</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={draftPayDay}
                  onChange={(e) => setDraftPayDay(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") savePayDay();
                    if (e.key === "Escape") setEditingPayDay(false);
                  }}
                  autoFocus
                  style={{
                    width: "44px",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    border: "1px solid rgba(25,25,112,0.2)",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "center" as const,
                    color: "var(--primary)",
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "일" : ""}</span>
              </div>
            ) : payDay ? (
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>
                {ko ? `매월 ${payDay}일` : `Day ${payDay}`}
              </span>
            ) : (
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                {ko ? "미설정 — 알림 OFF" : "Not set"}
              </span>
            )}
          </div>
          {editingPayDay ? (
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={savePayDay}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--primary)",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <Check size={11} strokeWidth={2.4} />
                {ko ? "저장" : "Save"}
              </button>
              {payDay && (
                <button
                  type="button"
                  onClick={clearPayDay}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(15,23,42,0.1)",
                    background: "white",
                    color: "var(--muted)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {ko ? "해제" : "Off"}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftPayDay(payDay != null ? String(payDay) : "25");
                setEditingPayDay(true);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(25,25,112,0.15)",
                background: "white",
                color: "var(--primary)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {payDay ? (ko ? "변경" : "Edit") : (ko ? "설정" : "Set")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
