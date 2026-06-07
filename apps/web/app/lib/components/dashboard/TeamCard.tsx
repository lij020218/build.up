"use client";

/**
 * 팀 현황 카드 — 인원 / 예상 급여 / 4대보험 등록 수 한눈에.
 *
 *  ── 사용처 ──────────────────────────────
 *  • Tier 1.5 코칭 (DailyOpsRitualCard 직후 — 매일 보는 핵심 운영 카드)
 *  • (이전엔 Tier 3 운영관리 그리드에 있었으나 사장님 요청으로 상단 이동 2026-05-07)
 *  ─────────────────────────────────────
 */

import { useState } from "react";
import { Calendar, Check } from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import type { DashboardComputed } from "../../hooks/useDashboardComputed";
import { useProfileStore } from "../../stores/profile-store";

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
};

export function TeamCard({ d, c, ko, fmt }: Props) {
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
            {c.employees.length}
            {ko ? "명" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={() => d.navigateToSurface("analytics")}
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
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{c.employees.length}</div>
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
            {fmt(c.estimatedMonthlyPayroll)}
          </div>
          <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>
            {ko ? "예상 급여" : "Payroll"}
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
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{c.insuredEmployees}</div>
          <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>
            {ko ? "4대보험" : "Insured"}
          </div>
        </div>
      </div>
      {c.employees.length === 0 && (
        <button
          type="button"
          onClick={() => d.navigateToSurface("analytics")}
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
            ? "직원을 등록하면 급여·보험 현황을 한눈에 볼 수 있어요"
            : "Add staff to see payroll & insurance at a glance"}
        </button>
      )}

      {/* 월급일 설정 — 임금체불 방지 알림용 (사용자 요청 2026-05-09) */}
      {c.employees.length > 0 && (
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
