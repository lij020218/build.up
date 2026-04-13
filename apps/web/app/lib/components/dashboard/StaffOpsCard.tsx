"use client";

import { useState } from "react";
import type { DashboardHook } from "../../useDashboard";
import { supabase } from "../../../../lib/supabase";

type EmployeeEntry = {
  id: string;
  name: string;
  hourlyWage?: number;
  weeklyHours?: number;
  isInsured?: boolean;
};

interface StaffOpsCardProps {
  ko: boolean;
  employees: EmployeeEntry[];
  estimatedMonthlyPayroll: number;
  insuredEmployees: number;
  totalSales: number;
  d: DashboardHook;
}

/** 정확한 원화 표시. 반올림 없음. */
const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000);
    const remain = abs % 100000000;
    const man = Math.floor(remain / 10000);
    return man > 0 ? `${sign}${eok}억 ${man.toLocaleString()}만원` : `${sign}${eok}억원`;
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const remain = abs % 10000;
    return remain > 0 ? `${sign}${man.toLocaleString()}만 ${remain.toLocaleString()}원` : `${sign}${man.toLocaleString()}만원`;
  }
  return `${sign}${abs.toLocaleString()}원`;
};

export function StaffOpsCard({
  ko,
  employees,
  estimatedMonthlyPayroll,
  insuredEmployees,
  totalSales,
  d,
}: StaffOpsCardProps) {
  const totalWeeklyHours = employees.reduce((s, e) => s + (e.weeklyHours ?? 0), 0);
  const monthlyHours = totalWeeklyHours * 4.34;
  const revenuePerHour = monthlyHours > 0 && totalSales > 0 ? Math.round(totalSales / monthlyHours) : 0;
  const isEditing = Boolean(d.empEditId);
  const [addMode, setAddMode] = useState<"choice" | "member" | "manual" | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(15,23,42,0.10)",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <section style={opsCard} className="bento-card">
      <div style={opsHeader}>
        <div>
          <div style={sectionEyebrow}>{ko ? "직원 관리" : "Staff management"}</div>
          <div style={opsTitle}>{ko ? "근무 인력" : "Working team"}</div>
        </div>
        <div style={opsActionRow}>
          <button
            type="button"
            onClick={() => {
              if (addMode) {
                setAddMode(null);
                d.setEmpFormOpen(false);
              } else {
                setAddMode("choice");
                setGeneratedCode(null);
                setInviteEmail("");
                setInviteStatus("idle");
              }
            }}
            style={opsActionPrimary}
          >
            {ko ? "직원 추가" : "Add staff"}
          </button>
          <div style={opsPill}>{employees.length}{ko ? "명" : ""}</div>
        </div>
      </div>

      <div style={{ ...opsMetricGrid, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "예상 인건비" : "Est. payroll"}</div>
          <div style={opsMetricValue}>{employees.length > 0 ? fmt(estimatedMonthlyPayroll) : "—"}</div>
        </div>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "보험 적용" : "Insured"}</div>
          <div style={opsMetricValue}>{insuredEmployees}{ko ? "명" : ""}</div>
        </div>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "시간당 매출" : "Rev/hour"}</div>
          <div style={{ ...opsMetricValue, color: revenuePerHour > 0 ? "#0f172a" : "rgba(15,23,42,0.34)" }}>
            {revenuePerHour > 0 ? fmt(revenuePerHour) : "—"}
          </div>
        </div>
      </div>

      <div style={listStack}>
        {employees.slice(0, 4).map((employee) => (
          <div key={employee.id} style={listRow}>
            <div>
              <div style={listTitle}>{employee.name}</div>
              <div style={listMeta}>
                {employee.weeklyHours != null
                  ? `${employee.weeklyHours}${ko ? "시간/주" : " hrs/week"}`
                  : ko
                    ? "근무시간 미입력"
                    : "Hours missing"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={listTitle}>{employee.hourlyWage ? fmt(employee.hourlyWage) : "—"}</div>
              <div style={listMeta}>
                {employee.isInsured ? (ko ? "보험 적용" : "Insured") : (ko ? "보험 미적용" : "Uninsured")}
              </div>
            </div>
            <div style={rowActions}>
              <button type="button" onClick={() => d.openEmpEdit(employee as never)} style={tinyAction}>
                {ko ? "수정" : "Edit"}
              </button>
              <button type="button" onClick={() => d.handleEmpDelete(employee.id)} style={tinyDangerAction}>
                {ko ? "삭제" : "Delete"}
              </button>
            </div>
          </div>
        ))}
        {employees.length === 0 ? (
          <div style={emptyState}>
            {ko ? "직원이나 파트타이머가 있다면 먼저 등록해 두세요." : "Add staff members here if you work with employees or part-timers."}
          </div>
        ) : null}
      </div>

      {/* ── Step 1: 회원/비회원 선택 ── */}
      {addMode === "choice" && (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>{ko ? "직원 추가" : "Add staff"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginBottom: "14px", lineHeight: 1.5 }}>
            {ko ? "이 직원이 build.up 회원인가요?" : "Is this employee a build.up member?"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button type="button" onClick={() => setAddMode("member")} style={{
              padding: "16px 12px", borderRadius: "14px", border: "1.5px solid rgba(15,23,42,0.08)",
              background: "#fff", cursor: "pointer", textAlign: "center" as const, transition: "all 0.15s ease",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px", display: "block" }}>
                <circle cx="12" cy="8" r="4" stroke="rgba(15,23,42,0.5)" strokeWidth="1.5" fill="none" />
                <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="rgba(15,23,42,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M17 8l2 2 2-2" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>{ko ? "네, 회원이에요" : "Yes, member"}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "4px" }}>
                {ko ? "이메일로 초대합니다" : "Invite by email"}
              </div>
            </button>
            <button type="button" onClick={() => { setAddMode("manual"); d.setEmpFormOpen(true); d.setEmpEditId(null); d.setEmpName(""); d.setEmpWage(""); d.setEmpHours(""); d.setEmpInsured(false); }} style={{
              padding: "16px 12px", borderRadius: "14px", border: "1.5px solid rgba(15,23,42,0.08)",
              background: "#fff", cursor: "pointer", textAlign: "center" as const, transition: "all 0.15s ease",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px", display: "block" }}>
                <circle cx="12" cy="8" r="4" stroke="rgba(15,23,42,0.5)" strokeWidth="1.5" fill="none" />
                <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="rgba(15,23,42,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
              <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>{ko ? "아니요" : "No, not yet"}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "4px" }}>
                {ko ? "이름/시급만 기록합니다" : "Record name & wage only"}
              </div>
            </button>
          </div>
          <button type="button" onClick={() => setAddMode(null)} style={{ ...opsActionSecondary, marginTop: "8px", width: "100%" }}>
            {ko ? "취소" : "Cancel"}
          </button>
        </div>
      )}

      {/* ── Step 2a: 회원 초대 ── */}
      {addMode === "member" && (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>{ko ? "회원 직원 초대" : "Invite member"}</div>
          {!generatedCode ? (
            <>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginBottom: "12px", lineHeight: 1.5 }}>
                {ko ? "직원의 이메일을 입력하세요. 초대 코드가 생성됩니다." : "Enter the employee's email. An invite code will be generated."}
              </div>
              <div style={formGridTwo}>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={ko ? "직원 이메일" : "Employee email"} style={inputStyle} />
                <input type="text" value={d.empName} onChange={(e) => d.setEmpName(e.target.value)}
                  placeholder={ko ? "이름 (선택)" : "Name (optional)"} style={inputStyle} />
              </div>
              <div style={editorActions}>
                <button type="button" disabled={!inviteEmail.includes("@") || inviteStatus === "loading"}
                  onClick={async () => {
                    setInviteStatus("loading");
                    try {
                      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        await supabase.from("store_invites" as never).insert({
                          owner_user_id: user.id,
                          invite_code: code,
                          role: "staff",
                        } as never);
                      }
                      // 직원 정보도 기본 등록 (연동 전이라 시급 등은 나중에)
                      if (d.empName.trim()) {
                        d.setEmpWage("0"); d.setEmpHours("0"); d.setEmpInsured(false);
                        d.setEmpFormOpen(true);
                        d.handleEmpSave();
                      }
                      setGeneratedCode(code);
                      setInviteStatus("sent");
                    } catch {
                      setInviteStatus("error");
                    }
                  }}
                  style={{ ...opsActionPrimary, opacity: !inviteEmail.includes("@") || inviteStatus === "loading" ? 0.4 : 1 }}>
                  {inviteStatus === "loading" ? (ko ? "생성 중..." : "Creating...") : (ko ? "초대 코드 생성" : "Generate code")}
                </button>
                <button type="button" onClick={() => { setAddMode("choice"); setInviteEmail(""); }} style={opsActionSecondary}>
                  {ko ? "뒤로" : "Back"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginBottom: "12px", lineHeight: 1.5 }}>
                {ko ? "아래 초대 코드를 직원에게 전달하세요." : "Share this invite code with your employee."}
              </div>
              <div style={{
                padding: "20px", borderRadius: "14px", background: "rgba(37,99,235,0.04)",
                border: "1px solid rgba(37,99,235,0.1)", textAlign: "center" as const, marginBottom: "12px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
                  {ko ? "초대 코드" : "Invite Code"}
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "0.15em", color: "#0f172a", fontFamily: "monospace" }}>
                  {generatedCode}
                </div>
                <button type="button" onClick={() => { void navigator.clipboard.writeText(generatedCode ?? ""); }}
                  style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", marginTop: "8px" }}>
                  {ko ? "코드 복사" : "Copy code"}
                </button>
              </div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", lineHeight: 1.5, marginBottom: "12px" }}>
                {ko
                  ? "직원이 build.up 가입 후 '직원' 역할을 선택하고 이 코드를 입력하면 가게에 연결됩니다. 코드는 7일간 유효합니다."
                  : "The employee signs up, selects 'Staff' role, and enters this code to connect. Valid for 7 days."}
              </div>
              <button type="button" onClick={() => { setAddMode(null); setGeneratedCode(null); setInviteEmail(""); setInviteStatus("idle"); }} style={{ ...opsActionPrimary, width: "100%" }}>
                {ko ? "완료" : "Done"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Step 2b: 비회원 수동 등록 (기존 폼) ── */}
      {(addMode === "manual" || isEditing) && d.empFormOpen ? (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>
            {isEditing ? (ko ? "직원 수정" : "Edit staff") : (ko ? "직원 정보 입력" : "Enter staff info")}
          </div>
          {!isEditing && (
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)", marginBottom: "10px" }}>
              {ko ? "나중에 이 직원이 build.up에 가입하면 연동할 수 있습니다." : "You can link this employee later if they join build.up."}
            </div>
          )}
          <div style={formGridTwo}>
            <input
              type="text"
              value={d.empName}
              onChange={(event) => d.setEmpName(event.target.value)}
              placeholder={ko ? "이름" : "Name"}
              style={inputStyle}
            />
            <input
              type="text"
              inputMode="numeric"
              value={d.empWage}
              onChange={(event) => d.setEmpWage(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder={ko ? "시급 (원)" : "Hourly wage"}
              style={inputStyle}
            />
          </div>
          <div style={formGridTwo}>
            <input
              type="text"
              inputMode="numeric"
              value={d.empHours}
              onChange={(event) => d.setEmpHours(event.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={ko ? "주간 근무시간" : "Hours/week"}
              style={inputStyle}
            />
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                checked={d.empInsured}
                onChange={(event) => d.setEmpInsured(event.target.checked)}
              />
              <span>{ko ? "4대보험 적용" : "Insured"}</span>
            </label>
          </div>
          <div style={editorActions}>
            <button type="button" onClick={() => { d.handleEmpSave(); setAddMode(null); }} style={opsActionPrimary}>
              {isEditing ? (ko ? "수정 저장" : "Save") : (ko ? "직원 추가" : "Add")}
            </button>
            <button
              type="button"
              onClick={() => {
                d.setEmpFormOpen(false);
                d.setEmpEditId(null);
                d.setEmpName(""); d.setEmpWage(""); d.setEmpHours(""); d.setEmpInsured(false);
                setAddMode(null);
              }}
              style={opsActionSecondary}
            >
              {ko ? "취소" : "Cancel"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const opsCard: React.CSSProperties = {
  borderRadius: "14px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,244,255,0.45) 100%)",
  border: "1px solid rgba(5, 97, 252, 0.06)",
  boxShadow: "0 21px 94px rgba(0, 0, 0, 0.03)",
  display: "grid",
  gap: "14px",
};

const opsHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const sectionEyebrow: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.46)",
  marginBottom: "6px",
};

const opsTitle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 740,
  letterSpacing: "-0.04em",
  color: "#0f172a",
};

const opsPill: React.CSSProperties = {
  borderRadius: "999px",
  padding: "8px 12px",
  background: "rgba(15, 23, 42, 0.04)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
  fontSize: "12px",
  fontWeight: 700,
  color: "rgba(15, 23, 42, 0.72)",
  whiteSpace: "nowrap",
};

const opsActionRow: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const opsActionPrimary: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "9px 12px",
  background: "#0561fc",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5, 97, 252, 0.25)",
};

const opsActionSecondary: React.CSSProperties = {
  border: "1px solid rgba(5, 97, 252, 0.12)",
  borderRadius: "8px",
  padding: "9px 12px",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const opsMetricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const opsMetricCard: React.CSSProperties = {
  borderRadius: "10px",
  padding: "14px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.55) 0%, rgba(248,250,255,0.35) 100%)",
  border: "1px solid rgba(5,97,252,0.04)",
};

const opsMetricLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(15, 23, 42, 0.46)",
  marginBottom: "8px",
};

const opsMetricValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 720,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const rowActions: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "flex-end",
};

const tinyAction: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

const tinyDangerAction: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#b42318",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

const listStack: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const listRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.5) 0%, rgba(248,250,255,0.3) 100%)",
  border: "1px solid rgba(5,97,252,0.04)",
};

const listTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 650,
  color: "#0f172a",
};

const listMeta: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "11px",
  color: "rgba(15, 23, 42, 0.48)",
};

const emptyState: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.4) 0%, rgba(248,250,255,0.25) 100%)",
  border: "1px solid rgba(5,97,252,0.04)",
  fontSize: "13px",
  lineHeight: 1.55,
  color: "rgba(15, 23, 42, 0.58)",
};

const inlineEditor: React.CSSProperties = {
  borderTop: "1px solid rgba(15, 23, 42, 0.08)",
  paddingTop: "14px",
  display: "grid",
  gap: "10px",
};

const inlineEditorTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#2563eb",
  letterSpacing: "0.02em",
};

const formGridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const editorActions: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#fff",
  border: "1px solid rgba(15,23,42,0.10)",
  fontSize: "13px",
  color: "#0f172a",
};
