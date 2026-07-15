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
import { X, Wallet, CalendarCheck2, Clock3, ShieldCheck, Briefcase, Check, UserMinus } from "lucide-react";
import { MINIMUM_WAGE_2026, checkSeveranceObligation, EMPLOYMENT_TYPES, getJobDuties, jobDutyLabel } from "@foundone/shared";
import { supabase } from "../../../../lib/supabase";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const LEAVE = "#8b7fd4";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

type Member = { member_user_id: string; name: string; role: "staff" | "manager"; joined_at: string | null; hire_date: string | null; hourly_wage?: number | null; employment_type?: string | null; job_duties?: string[] | null };
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

export function StaffDetailModal({ member, rules, leaves, ko, categoryId, onClose, onWageSaved, onJobSaved, onMarkLeft }: {
  member: Member;
  rules: Rule[];
  leaves: Leave[];
  ko: boolean;
  categoryId?: string | null;
  onClose: () => void;
  onWageSaved: (wage: number) => void;
  onJobSaved: (employmentType: string | null, jobDuties: string[]) => void;
  /** 퇴사 처리 — 행을 지우지 않고 left_at 만 찍는다(근로기록 보존). 이후 「퇴사자 정산」 섹션으로 이동. */
  onMarkLeft: () => void;
}) {
  // 퇴사 처리는 되돌리기 번거로운 상태 변경이라 2단계 확인.
  const [confirmLeave, setConfirmLeave] = useState(false);
  // ── 급여: 읽기 default + 수정 + 저장 (사장님 데이터 카드 표준 패턴) ──
  const [editingWage, setEditingWage] = useState(false);
  const [wageInput, setWageInput] = useState(member.hourly_wage != null ? String(member.hourly_wage) : "");
  const [wageState, setWageState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // ── 고용형태·직무: 읽기 default + 수정 + 저장 (동일 표준 패턴) ──
  const [editingJob, setEditingJob] = useState(false);
  const [empType, setEmpType] = useState<string | null>(member.employment_type ?? null);
  const [duties, setDuties] = useState<string[]>(member.job_duties ?? []);
  const [jobState, setJobState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dutyOptions = getJobDuties(categoryId);

  const saveJob = async () => {
    setJobState("saving");
    const { error } = await supabase.from("store_members" as never)
      .update({ employment_type: empType, job_duties: duties } as never)
      .eq("member_user_id", member.member_user_id);
    if (error) { setJobState("error"); return; }
    setJobState("saved");
    setEditingJob(false);
    onJobSaved(empType, duties);
    window.setTimeout(() => setJobState("idle"), 1600);
  };
  const toggleDuty = (key: string) => setDuties((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

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

  // 퇴직금 자격 — SSOT(labor-law-checks) 재사용, 직원 화면과 동일 판정 (2026-07-13)
  const severanceHire = member.hire_date ?? (member.joined_at ? member.joined_at.slice(0, 10) : undefined);
  const sev = checkSeveranceObligation([{ id: member.member_user_id, name: member.name, hireDate: severanceHire, weeklyHours, hourlyWage: wage ?? 0 }])[0];

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

        {/* ①-b 고용형태 · 직무 (사장 설정 → 양쪽 표시) */}
        <div style={{ padding: "14px 16px", borderRadius: 16, border: `1px solid ${MIDNIGHT_BORDER}`, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: editingJob ? 12 : 10 }}>
            <div style={{ ...sectionTitle, marginBottom: 0 }}><Briefcase size={13} strokeWidth={2} />{ko ? "고용형태 · 직무" : "Employment · Duties"}</div>
            {jobState === "saved" && <span style={{ fontSize: 11, fontWeight: 700, color: "#1a7a36" }}>{ko ? "저장됨" : "Saved"}</span>}
            {!editingJob && (
              <button type="button" onClick={() => { setEmpType(member.employment_type ?? null); setDuties(member.job_duties ?? []); setEditingJob(true); }}
                style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: MIDNIGHT, background: "white", border: `1px solid ${MIDNIGHT_BORDER}`, borderRadius: 9, padding: "5px 11px", cursor: "pointer" }}>
                {(member.employment_type || (member.job_duties?.length ?? 0) > 0) ? (ko ? "수정" : "Edit") : (ko ? "설정" : "Set")}
              </button>
            )}
          </div>

          {editingJob ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 6 }}>{ko ? "고용형태" : "Employment type"}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {EMPLOYMENT_TYPES.map((t) => {
                  const on = empType === t.key;
                  return (
                    <button key={t.key} type="button" onClick={() => setEmpType(on ? null : t.key)}
                      style={{ flex: 1, padding: "9px 4px", borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                        border: `1px solid ${on ? MIDNIGHT : MIDNIGHT_BORDER}`, background: on ? MIDNIGHT : "white", color: on ? "white" : INK }}>
                      {ko ? t.ko : t.en}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 6 }}>{ko ? "업무 직무 (복수 선택)" : "Duties (multi-select)"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {dutyOptions.map((d) => {
                  const on = duties.includes(d.key);
                  return (
                    <button key={d.key} type="button" onClick={() => toggleDuty(d.key)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "7px 11px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 600,
                        border: `1px solid ${on ? MIDNIGHT : MIDNIGHT_BORDER}`, background: on ? MIDNIGHT : "white", color: on ? "white" : INK }}>
                      {on && <Check size={11} strokeWidth={2.6} />}{ko ? d.ko : d.en}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => { setEditingJob(false); setJobState("idle"); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: MUTED, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {ko ? "취소" : "Cancel"}
                </button>
                <button type="button" onClick={saveJob} disabled={jobState === "saving"} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {jobState === "saving" ? (ko ? "저장 중…" : "…") : ko ? "저장" : "Save"}
                </button>
              </div>
              {jobState === "error" && <div style={{ fontSize: 11.5, color: "#b64c4c", marginTop: 8 }}>{ko ? "저장 실패 — 잠시 후 다시 시도해 주세요." : "Save failed — please retry."}</div>}
            </>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              {member.employment_type && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "white", background: MIDNIGHT, padding: "4px 10px", borderRadius: 999 }}>
                  {ko ? (EMPLOYMENT_TYPES.find((t) => t.key === member.employment_type)?.ko ?? member.employment_type) : (EMPLOYMENT_TYPES.find((t) => t.key === member.employment_type)?.en ?? member.employment_type)}
                </span>
              )}
              {(member.job_duties ?? []).map((k) => (
                <span key={k} style={{ fontSize: 12, fontWeight: 600, color: MIDNIGHT, background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}`, padding: "4px 10px", borderRadius: 999 }}>
                  {jobDutyLabel(k, ko)}
                </span>
              ))}
              {!member.employment_type && (member.job_duties?.length ?? 0) === 0 && (
                <span style={{ fontSize: 12.5, color: MUTED }}>{ko ? "아직 설정되지 않았어요. [설정]에서 고용형태·직무를 지정하세요." : "Not set yet."}</span>
              )}
            </div>
          )}
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

        {/* ②-b 퇴직금 자격 — 직원 화면과 동일 판정 (2026-07-13) */}
        <div style={{
          padding: "14px 16px", borderRadius: 16, marginBottom: 12,
          border: `1px solid ${sev?.level === "eligible" ? "rgba(26,122,54,0.25)" : MIDNIGHT_BORDER}`,
          background: sev?.level === "eligible" ? "rgba(26,122,54,0.05)" : "transparent",
        }}>
          <div style={sectionTitle}><ShieldCheck size={13} strokeWidth={2} />{ko ? "퇴직금 의무" : "Severance"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: sev?.level === "eligible" ? "#1a7a36" : INK }}>
              {weeklyHours < 15
                ? (ko ? "비대상 (주 15h 미만)" : "Not eligible")
                : sev?.level === "eligible"
                  ? (ko ? "지급 대상" : "Eligible")
                  : sev?.level === "approaching"
                    ? (ko ? `1년 임박 D-${Math.max(0, 365 - (sev?.daysSinceHire ?? 0))}` : `Soon`)
                    : (ko ? `미도달 D-${Math.max(0, 365 - (sev?.daysSinceHire ?? 0))}` : "Not yet")}
            </span>
            {sev && sev.daysSinceHire > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: MUTED, fontWeight: 600 }}>
                {ko ? `근속 ${Math.floor(sev.daysSinceHire / 30)}개월 (${sev.daysSinceHire}일)` : `${sev.daysSinceHire}d`}
              </span>
            )}
          </div>
          {sev?.level === "eligible" && (
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#b64c4c", marginBottom: 4 }}>
              {ko ? "⚠ 퇴직 시 14일 이내 지급 의무 (위반 시 지연이자 20% + 형사처벌)." : "⚠ Pay within 14 days of leaving."}
            </div>
          )}
          <div style={{ fontSize: 10.5, color: MUTED, lineHeight: 1.5 }}>
            {ko
              ? "근로자퇴직급여법 §4 · 1년↑ + 주 15h↑ (5인 미만도 의무). 정확한 금액은 퇴직 전 3개월 평균임금 기준 — 노무사·고용노동부 계산기."
              : "Severance Act §4 · 1yr+ & 15h+. Exact amount = avg wage of last 3 months."}
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

        {/* ⑤ 퇴사 처리 (2026-07-15) — 파괴적 동작이 아니라 상태 전환. 근태·연차 기록은 남는다. */}
        <div style={{ padding: "14px 16px", borderRadius: 16, border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <div style={sectionTitle}><UserMinus size={13} strokeWidth={2} />{ko ? "퇴사 처리" : "Offboard"}</div>
          {!confirmLeave ? (
            <>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, margin: "0 0 10px" }}>
                {ko
                  ? "퇴사 처리하면 근무표에서 빠지고 「퇴사자 정산」 목록으로 이동합니다. 임금·퇴직금은 퇴사일부터 14일 이내에 지급해야 합니다(근로기준법 §36)."
                  : "Moves to the offboarding list. Final pay is due within 14 days (LSA §36)."}
              </p>
              <button type="button" onClick={() => setConfirmLeave(true)}
                style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, background: "transparent", color: MUTED, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                {ko ? "퇴사 처리" : "Offboard"}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 12.5, color: INK, fontWeight: 600, lineHeight: 1.55, margin: "0 0 10px" }}>
                {ko ? `${member.name} 님을 오늘 자로 퇴사 처리할까요?` : `Offboard ${member.name} as of today?`}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={onMarkLeft}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  {ko ? "퇴사 처리" : "Confirm"}
                </button>
                <button type="button" onClick={() => setConfirmLeave(false)}
                  style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, background: "transparent", color: MUTED, fontSize: 12.5, cursor: "pointer" }}>
                  {ko ? "취소" : "Cancel"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
