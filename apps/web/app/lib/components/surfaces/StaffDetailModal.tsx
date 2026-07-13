"use client";

/**
 * StaffDetailModal — 직원 상세 팝업 (사장 전용, 2026-07-13)
 *
 * 열림: TeamSurface 직원 카드 헤더 클릭.
 * 구성 (정보 계층 — 위에서 아래로):
 *   ① 프로필 — 이름 · 역할 · 근속 N일차 · 입사일
 *   ② 급여 — 시급(사장 편집: 읽기 default + 수정 + 저장 패턴) →
 *       주 근무시간(근무표 자동) · 주휴수당(주 15h↑) · 예상 월급(주휴 포함 ×4.345)
 *       공식 = TeamManagementSheet(급여 계산기) SSOT 미러. 최저임금 미달 시 경고.
 *   ③ 이번 달 근태 — 출근 일수 · 총 근무시간 + 최근 출퇴근 5건
 *   ④ 연차 요약 — 승인 · 대기 건수
 *
 * 개인정보: 시급은 store_members.hourly_wage — RLS 상 직원 본인 행만 SELECT 가능해
 *   동료 직원에게 노출되지 않음 (마이그레이션 20260713_000001 주석 참조).
 * 정직성: 시급 미설정이면 파생값 전부 "—" (위조 금지).
 */

import { useCallback, useEffect, useState } from "react";
import { X, Wallet, CalendarCheck2, Clock3 } from "lucide-react";
import { MINIMUM_WAGE_2026 } from "@foundone/shared";
import { supabase } from "../../../../lib/supabase";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const LEAVE = "#8b7fd4";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

type Member = { member_user_id: string; name: string; role: "staff" | "manager"; joined_at: string | null; hire_date: string | null; hourly_wage?: number | null };
type Rule = { member_user_id: string; weekday: number; start_time: string; end_time: string };
type Leave = { member_user_id: string; status: string };
type Attendance = { id: string; work_date: string; clock_in_at: string; clock_out_at: string | null };

const pad = (n: number) => String(n).padStart(2, "0");
const hm = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function fmtDur(min: number, ko: boolean): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return ko ? `${h}시간 ${m}분` : `${h}h ${m}m`;
  if (h) return ko ? `${h}시간` : `${h}h`;
  return ko ? `${m}분` : `${m}m`;
}

export function StaffDetailModal({ member, rules, leaves, ko, onClose, onWageSaved }: {
  member: Member;
  rules: Rule[];
  leaves: Leave[];
  ko: boolean;
  onClose: () => void;
  onWageSaved: (wage: number) => void;
}) {
  // ── 급여: 읽기 default + 수정 + 저장 (사장님 데이터 카드 표준 패턴) ──
  const [editingWage, setEditingWage] = useState(false);
  const [wageInput, setWageInput] = useState(member.hourly_wage != null ? String(member.hourly_wage) : "");
  const [wageState, setWageState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // ── 이번 달 근태 (owner RLS read) ──
  const [monthAtt, setMonthAtt] = useState<Attendance[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const monthEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
      const { data } = await supabase.from("attendance_records" as never)
        .select("id, work_date, clock_in_at, clock_out_at")
        .eq("member_user_id", member.member_user_id)
        .gte("work_date", monthStart).lte("work_date", monthEnd)
        .order("work_date", { ascending: false });
      if (!cancelled) setMonthAtt((data ?? []) as Attendance[]);
    })();
    return () => { cancelled = true; };
  }, [member.member_user_id]);

  const saveWage = async () => {
    const wage = Math.max(0, Math.round(Number(wageInput)));
    if (!Number.isFinite(wage) || wage <= 0) { setWageState("error"); return; }
    setWageState("saving");
    const { error } = await supabase.from("store_members" as never)
      .update({ hourly_wage: wage } as never)
      .eq("member_user_id", member.member_user_id);
    if (error) { setWageState("error"); return; }
    setWageState("saved");
    setEditingWage(false);
    onWageSaved(wage);
    window.setTimeout(() => setWageState("idle"), 1600);
  };

  // ── 급여 파생 계산 (TeamManagementSheet 공식 미러 — 주휴수당 포함, 직원 지급액 관점) ──
  const wage = member.hourly_wage ?? null;
  const weeklyMin = rules.reduce((sum, r) => {
    const [sh, sm] = r.start_time.split(":").map(Number);
    const [eh, em] = r.end_time.split(":").map(Number);
    let d = eh * 60 + em - (sh * 60 + sm);
    if (d <= 0) d += 1440; // 자정 넘는 야간 보정
    return sum + d;
  }, 0);
  const weeklyHours = weeklyMin / 60;
  const hasJuhyu = weeklyHours >= 15;
  const weeklyAllowance = wage != null && hasJuhyu ? (weeklyHours / 5) * wage : 0;
  const monthlyPay = wage != null ? Math.round((wage * weeklyHours + weeklyAllowance) * 4.345) : null;
  const belowMinimum = wage != null && wage < MINIMUM_WAGE_2026;

  // ── 이번 달 근태 요약 ──
  const workedDays = monthAtt?.length ?? 0;
  const totalMin = (monthAtt ?? []).reduce((sum, a) => {
    if (!a.clock_out_at) return sum;
    return sum + Math.max(0, Math.floor((new Date(a.clock_out_at).getTime() - new Date(a.clock_in_at).getTime()) / 60000));
  }, 0);

  const tenure = (() => {
    const base = member.hire_date ?? (member.joined_at ? member.joined_at.slice(0, 10) : null);
    if (!base) return null;
    const start = new Date(`${base}T00:00:00`).getTime();
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.floor((now.getTime() - start) / 86400000) + 1;
  })();

  const approvedLeaves = leaves.filter((l) => l.status === "approved").length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;

  const sectionTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 750, color: MIDNIGHT, marginBottom: 10 };
  const statCell: React.CSSProperties = { flex: 1, padding: "10px 12px", borderRadius: 12, background: MIDNIGHT_SOFT, textAlign: "center" };
  const statVal: React.CSSProperties = { fontSize: 16, fontWeight: 800, color: INK, letterSpacing: "-0.01em" };
  const statLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: MUTED, marginTop: 2 };

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 440, maxHeight: "86vh", overflowY: "auto",
        background: "white", borderRadius: 22, padding: "24px 22px",
        boxShadow: "0 24px 80px rgba(25,25,112,0.25)", border: "1px solid rgba(25,25,112,0.08)",
      }}>
        {/* ① 프로필 */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: INK, letterSpacing: "-0.01em" }}>{member.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: MIDNIGHT_SOFT, padding: "2px 8px", borderRadius: 999 }}>
                {member.role === "manager" ? (ko ? "매니저" : "Manager") : ko ? "직원" : "Staff"}
              </span>
              {tenure != null && tenure >= 1 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, border: `1px solid ${MIDNIGHT_BORDER}`, padding: "2px 8px", borderRadius: 999 }}>
                  {ko ? `근속 ${tenure.toLocaleString()}일차` : `Day ${tenure}`}
                </span>
              )}
            </div>
            {member.hire_date && (
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{ko ? "입사일" : "Hired"} {member.hire_date}</div>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={ko ? "닫기" : "Close"} style={{ border: "none", background: MIDNIGHT_SOFT, borderRadius: 10, padding: 7, cursor: "pointer" }}>
            <X size={15} strokeWidth={2.2} style={{ color: MIDNIGHT, display: "block" }} />
          </button>
        </div>

        {/* ② 급여 */}
        <div style={{ padding: "14px 16px", borderRadius: 16, border: `1px solid ${MIDNIGHT_BORDER}`, marginBottom: 12 }}>
          <div style={sectionTitle}><Wallet size={13} strokeWidth={2} />{ko ? "급여" : "Pay"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, flexShrink: 0 }}>{ko ? "시급" : "Hourly"}</span>
            {editingWage ? (
              <>
                <input
                  type="number" inputMode="numeric" value={wageInput} autoFocus
                  onChange={(e) => setWageInput(e.target.value)}
                  placeholder="10320"
                  style={{ flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, fontSize: 14, outline: "none" }}
                />
                <button type="button" onClick={saveWage} disabled={wageState === "saving"} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  {wageState === "saving" ? (ko ? "저장 중…" : "…") : ko ? "저장" : "Save"}
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 17, fontWeight: 800, color: INK }}>
                  {wage != null ? `${wage.toLocaleString()}${ko ? "원" : " KRW"}` : "—"}
                </span>
                {wageState === "saved" && <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT }}>{ko ? "저장됨" : "Saved"}</span>}
                <button type="button" onClick={() => { setEditingWage(true); setWageInput(wage != null ? String(wage) : ""); }} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 9, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: MIDNIGHT, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {ko ? (wage != null ? "수정" : "시급 설정") : "Edit"}
                </button>
              </>
            )}
          </div>
          {wageState === "error" && (
            <div style={{ fontSize: 11.5, color: "#b64c4c", marginBottom: 8 }}>
              {ko ? "저장 실패 — 값을 확인하거나 잠시 후 다시 시도해 주세요. (서버에 시급 컬럼 마이그레이션이 필요할 수 있어요)" : "Save failed."}
            </div>
          )}
          {belowMinimum && (
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#b64c4c", marginBottom: 8 }}>
              {ko ? `⚠ 2026 최저시급 ${MINIMUM_WAGE_2026.toLocaleString()}원 미달` : `Below 2026 minimum wage`}
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={statCell}>
              <div style={statVal}>{weeklyMin > 0 ? fmtDur(weeklyMin, ko) : "—"}</div>
              <div style={statLabel}>{ko ? "주 근무 (근무표)" : "Weekly"}</div>
            </div>
            <div style={statCell}>
              <div style={statVal}>{wage != null && weeklyMin > 0 ? (hasJuhyu ? `${Math.round(weeklyAllowance).toLocaleString()}원` : ko ? "해당 없음" : "N/A") : "—"}</div>
              <div style={statLabel}>{ko ? "주휴수당 (주 15h↑)" : "Weekly holiday pay"}</div>
            </div>
            <div style={statCell}>
              <div style={statVal}>{monthlyPay != null && weeklyMin > 0 ? `${monthlyPay.toLocaleString()}원` : "—"}</div>
              <div style={statLabel}>{ko ? "예상 월급" : "Est. monthly"}</div>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
            {ko ? "근무표 기준 추정치 (주휴수당 포함, 4대보험·세금 미반영). 시급·근무표가 바뀌면 자동 재계산." : "Estimate based on schedule, incl. weekly holiday pay."}
          </div>
        </div>

        {/* ③ 이번 달 근태 */}
        <div style={{ padding: "14px 16px", borderRadius: 16, border: `1px solid ${MIDNIGHT_BORDER}`, marginBottom: 12 }}>
          <div style={sectionTitle}><Clock3 size={13} strokeWidth={2} />{ko ? "이번 달 근태" : "This month"}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: monthAtt && monthAtt.length > 0 ? 10 : 0 }}>
            <div style={statCell}>
              <div style={statVal}>{monthAtt == null ? "…" : `${workedDays}${ko ? "일" : "d"}`}</div>
              <div style={statLabel}>{ko ? "출근" : "Days"}</div>
            </div>
            <div style={statCell}>
              <div style={statVal}>{monthAtt == null ? "…" : totalMin > 0 ? fmtDur(totalMin, ko) : "—"}</div>
              <div style={statLabel}>{ko ? "총 근무 (퇴근 완료분)" : "Total worked"}</div>
            </div>
          </div>
          {monthAtt && monthAtt.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {monthAtt.slice(0, 5).map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: MUTED }}>
                  <span style={{ fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{a.work_date.slice(5).replace("-", ".")}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {hm(a.clock_in_at)} → {a.clock_out_at ? hm(a.clock_out_at) : (ko ? "근무 중" : "on shift")}
                  </span>
                  {a.clock_out_at && (
                    <span style={{ marginLeft: "auto", fontWeight: 600 }}>
                      {fmtDur(Math.max(0, Math.floor((new Date(a.clock_out_at).getTime() - new Date(a.clock_in_at).getTime()) / 60000)), ko)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {monthAtt != null && monthAtt.length === 0 && (
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{ko ? "아직 이번 달 출근 기록이 없어요." : "No attendance yet."}</div>
          )}
        </div>

        {/* ④ 연차 요약 */}
        <div style={{ padding: "14px 16px", borderRadius: 16, border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <div style={sectionTitle}><CalendarCheck2 size={13} strokeWidth={2} />{ko ? "연차·휴가" : "Time off"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={statCell}>
              <div style={{ ...statVal, color: MIDNIGHT }}>{approvedLeaves}</div>
              <div style={statLabel}>{ko ? "승인" : "Approved"}</div>
            </div>
            <div style={statCell}>
              <div style={{ ...statVal, color: LEAVE }}>{pendingLeaves}</div>
              <div style={statLabel}>{ko ? "대기" : "Pending"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
