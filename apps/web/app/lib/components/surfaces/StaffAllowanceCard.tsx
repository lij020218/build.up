"use client";

/**
 * StaffAllowanceCard — 직원용 「추가 수당 신청」 (2026-07-13)
 *
 * 사용자 지침: "추가 수당을 줘야 하는 사항이 생기면 사장에게 알리고 직원에게도
 *   추가 수당 신청이라는 UI 가 생기게" — 몰랐다가 얼굴 붉히는 상황 방지.
 *
 * 동작:
 *   ① 정규 시간을 초과한 근무(출퇴근 기록 기준)를 자동 감지 → "신청" 원탭.
 *   ② 야간·휴일 등은 직접 신청 폼(유형·날짜·시간·사유).
 *   ③ 내 신청 목록(대기/승인/반려) + 대기 건 취소.
 *
 * 냉정 리뷰 원칙(Slice A와 동일): 가산수당 50%(근기법 §56)는 상시 5인 이상만 의무.
 *   앱은 상시 근로자 수를 확정할 수 없으므로 "금액"이 아니라 시간·유형만 신청하고,
 *   가산 여부·금액 확정은 사장 몫으로 남긴다.
 */

import { useState } from "react";
import { Coins, Plus, X, Clock3, Moon, CalendarClock } from "lucide-react";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const LEAVE = "#8b7fd4";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";
const OK = "#1a7a36";

export type AllowanceType = "overtime" | "night" | "holiday" | "other";
export type AllowanceStatus = "pending" | "approved" | "rejected";
export type AllowanceReq = { id: string; work_date: string; allowance_type: AllowanceType; minutes: number; reason: string | null; status: AllowanceStatus };
export type OvertimeCandidate = { work_date: string; minutes: number };

const TYPE_LABEL: Record<AllowanceType, string> = { overtime: "연장근로", night: "야간근로", holiday: "휴일근로", other: "기타" };
const TYPE_LABEL_EN: Record<AllowanceType, string> = { overtime: "Overtime", night: "Night", holiday: "Holiday", other: "Other" };

function fmtMin(min: number, ko: boolean): string {
  const h = Math.floor(min / 60), m = min % 60;
  const hu = ko ? "시간" : "h", mu = ko ? "분" : "m";
  if (h && m) return `${h}${hu} ${m}${mu}`;
  if (h) return `${h}${hu}`;
  return `${m}${mu}`;
}
function mdLabel(d: string, ko: boolean): string {
  const [, mm, dd] = d.split("-");
  return ko ? `${Number(mm)}월 ${Number(dd)}일` : `${mm}/${dd}`;
}

export function StaffAllowanceCard({ ko, allowances, candidates, onRequest, onCancel }: {
  ko: boolean;
  allowances: AllowanceReq[];
  candidates: OvertimeCandidate[];
  onRequest: (payload: { work_date: string; allowance_type: AllowanceType; minutes: number; reason: string }) => Promise<boolean>;
  onCancel: (id: string) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null); // work_date or "form"

  const sectionLaw: React.CSSProperties = { fontSize: 11, color: MUTED, marginTop: 10, lineHeight: 1.55 };
  const statusPill = (s: AllowanceStatus): React.CSSProperties => ({
    marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, flexShrink: 0,
    background: s === "approved" ? "rgba(26,122,54,0.10)" : s === "rejected" ? "rgba(15,23,42,0.06)" : MIDNIGHT_SOFT,
    color: s === "approved" ? OK : s === "rejected" ? MUTED : MIDNIGHT,
    border: `1px solid ${s === "approved" ? "rgba(26,122,54,0.22)" : MIDNIGHT_BORDER}`,
  });

  const quickRequest = async (c: OvertimeCandidate) => {
    setSubmitting(c.work_date);
    try { await onRequest({ work_date: c.work_date, allowance_type: "overtime", minutes: c.minutes, reason: "" }); }
    finally { setSubmitting(null); }
  };

  return (
    <section style={{ background: "white", borderRadius: 22, padding: "22px 22px", boxShadow: "0 6px 30px rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Coins size={17} strokeWidth={1.9} style={{ color: MIDNIGHT }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: INK, letterSpacing: "-0.01em" }}>{ko ? "추가 수당 신청" : "Allowance request"}</div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: MIDNIGHT, fontSize: 12, fontWeight: 700 }}
        >
          <Plus size={13} strokeWidth={2.2} />{ko ? "직접 신청" : "New"}
        </button>
      </div>

      {/* ① 자동 감지된 연장근로 */}
      {candidates.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: allowances.length || formOpen ? 12 : 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: LEAVE, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock3 size={13} strokeWidth={2} />{ko ? "정규 시간을 초과한 근무가 있어요" : "Overtime detected"}
          </div>
          {candidates.map((c) => (
            <div key={c.work_date} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(139,127,212,0.08)", border: "1px solid rgba(139,127,212,0.22)" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{mdLabel(c.work_date, ko)}</span>
              <span style={{ fontSize: 12.5, color: MIDNIGHT, fontWeight: 700 }}>{ko ? `연장 ${fmtMin(c.minutes, ko)}` : `+${fmtMin(c.minutes, ko)}`}</span>
              <button
                type="button"
                onClick={() => quickRequest(c)}
                disabled={submitting === c.work_date}
                style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 9, cursor: "pointer", border: "none", background: MIDNIGHT, color: "white", fontSize: 12, fontWeight: 700 }}
              >
                {submitting === c.work_date ? (ko ? "신청 중…" : "…") : (ko ? "신청" : "Request")}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ② 직접 신청 폼 */}
      {formOpen && (
        <AllowanceForm
          ko={ko}
          submitting={submitting === "form"}
          onSubmit={async (p) => {
            setSubmitting("form");
            try { const ok = await onRequest(p); if (ok) setFormOpen(false); }
            finally { setSubmitting(null); }
          }}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {/* ③ 내 신청 목록 */}
      {allowances.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: candidates.length || formOpen ? 12 : 0 }}>
          {allowances.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, background: MIDNIGHT_SOFT }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "white", background: a.allowance_type === "night" ? LEAVE : MIDNIGHT, padding: "3px 8px", borderRadius: 999, flexShrink: 0 }}>
                {ko ? TYPE_LABEL[a.allowance_type] : TYPE_LABEL_EN[a.allowance_type]}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{mdLabel(a.work_date, ko)} · {fmtMin(a.minutes, ko)}</span>
              <span style={statusPill(a.status)}>{a.status === "approved" ? (ko ? "승인" : "Approved") : a.status === "rejected" ? (ko ? "반려" : "Declined") : (ko ? "대기" : "Pending")}</span>
              {a.status === "pending" && (
                <button type="button" onClick={() => onCancel(a.id)} aria-label={ko ? "취소" : "Cancel"} style={{ padding: 5, border: "none", background: "transparent", cursor: "pointer", color: MUTED }}>
                  <X size={14} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {candidates.length === 0 && allowances.length === 0 && !formOpen && (
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
          {ko ? "연장·야간·휴일 근로가 있으면 여기서 신청하세요. 정규 시간을 초과해 근무하면 자동으로 감지됩니다." : "Request overtime/night/holiday allowances here."}
        </div>
      )}

      <div style={sectionLaw}>
        {ko
          ? "연장·야간·휴일근로는 상시 5인 이상 사업장에서 통상임금 50% 가산(근로기준법 §56). 5인 미만은 초과 시간분 시급 지급. 정확한 금액은 사장님과 확인하세요."
          : "50% premium applies at workplaces with 5+ staff (LSA §56). Confirm exact amount with your employer."}
      </div>
    </section>
  );
}

/* ── 직접 신청 폼 ── */
function AllowanceForm({ ko, submitting, onSubmit, onCancel }: {
  ko: boolean;
  submitting: boolean;
  onSubmit: (p: { work_date: string; allowance_type: AllowanceType; minutes: number; reason: string }) => void;
  onCancel: () => void;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; })();
  const [type, setType] = useState<AllowanceType>("overtime");
  const [date, setDate] = useState(todayStr);
  const [hours, setHours] = useState("1");
  const [mins, setMins] = useState("0");
  const [reason, setReason] = useState("");

  const types: { key: AllowanceType; icon: React.ReactNode }[] = [
    { key: "overtime", icon: <Clock3 size={13} strokeWidth={2} /> },
    { key: "night", icon: <Moon size={13} strokeWidth={2} /> },
    { key: "holiday", icon: <CalendarClock size={13} strokeWidth={2} /> },
    { key: "other", icon: <Plus size={13} strokeWidth={2} /> },
  ];
  const totalMin = Math.max(0, (parseInt(hours || "0", 10) * 60) + parseInt(mins || "0", 10));
  const fieldLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 4 };
  const input: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, fontSize: 13, color: INK, background: "white", boxSizing: "border-box" };

  return (
    <div style={{ padding: 14, borderRadius: 14, background: MIDNIGHT_SOFT, display: "flex", flexDirection: "column", gap: 12, marginBottom: 4 }}>
      <div>
        <div style={fieldLabel}>{ko ? "유형" : "Type"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {types.map((t) => {
            const sel = type === t.key;
            return (
              <button key={t.key} type="button" onClick={() => setType(t.key)}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 4px", borderRadius: 9, cursor: "pointer",
                  border: `1px solid ${sel ? MIDNIGHT : MIDNIGHT_BORDER}`, background: sel ? MIDNIGHT : "white", color: sel ? "white" : INK, fontSize: 11.5, fontWeight: 700 }}>
                {t.icon}{ko ? TYPE_LABEL[t.key] : TYPE_LABEL_EN[t.key]}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={fieldLabel}>{ko ? "근무일" : "Date"}</div>
          <input type="date" value={date} max={todayStr} onChange={(e) => setDate(e.target.value)} style={input} />
        </div>
        <div style={{ width: 80 }}>
          <div style={fieldLabel}>{ko ? "시간" : "Hours"}</div>
          <input type="number" min="0" max="24" value={hours} onChange={(e) => setHours(e.target.value)} style={input} />
        </div>
        <div style={{ width: 80 }}>
          <div style={fieldLabel}>{ko ? "분" : "Min"}</div>
          <input type="number" min="0" max="59" value={mins} onChange={(e) => setMins(e.target.value)} style={input} />
        </div>
      </div>
      <div>
        <div style={fieldLabel}>{ko ? "사유 (선택)" : "Reason (optional)"}</div>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={ko ? "예: 마감 후 정리" : "e.g. closing"} style={input} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: MUTED, fontSize: 13, fontWeight: 700 }}>
          {ko ? "취소" : "Cancel"}
        </button>
        <button type="button" disabled={submitting || totalMin <= 0} onClick={() => onSubmit({ work_date: date, allowance_type: type, minutes: totalMin, reason })}
          style={{ flex: 2, padding: "10px", borderRadius: 10, cursor: totalMin > 0 ? "pointer" : "not-allowed", border: "none", background: totalMin > 0 ? MIDNIGHT : MIDNIGHT_BORDER, color: "white", fontSize: 13, fontWeight: 700, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? (ko ? "신청 중…" : "…") : (ko ? "신청하기" : "Submit")}
        </button>
      </div>
    </div>
  );
}
