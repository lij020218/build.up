"use client";

/**
 * StaffRightsCard — 직원용 「내 근로 권리」 (2026-07-13)
 *
 * 사용자 지침: "몰랐다가 서로 얼굴 붉히는 상황" 방지 — 조건이 충족되면 직원에게도
 *   자격을 표시. 금액 "계산기"가 아니라 자격·법적 근거·기한 안내 (냉정 리뷰 결론:
 *   퇴직금은 평균임금 기반이라 앱은 추정만 → 확정 금액 단정 회피, 공식 계산기 링크).
 *
 * 표시:
 *   ① 주휴수당 — 주 15h↑ 대상 여부 (근기법 §55)
 *   ② 퇴직금   — 1년↑ + 주 15h↑ 자격 (퇴직급여법 §4), 재직일 표시. 대상 도달 시 강조.
 *   ③ 연차     — 1년↑ 15일 (근기법 §60, 상시 5인↑ 사업장 한정)
 *
 * SSOT: checkSeveranceObligation·checkAnnualLeaveAccrual (labor-law-checks.ts) 재사용
 *   — 사장 알림과 동일 계산 → 사장·직원이 같은 판정을 봄 (분쟁 방지 핵심).
 */

import { ShieldCheck, ExternalLink } from "lucide-react";
import { checkSeveranceObligation, checkAnnualLeaveAccrual, MINIMUM_WAGE_2026 } from "@foundone/shared";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";
const OK = "#1a7a36"; // 자격 충족 — 신호등 금지 원칙상 미드나잇 계열 녹색은 배지에만 최소 사용

const MOEL_SEVERANCE = "https://www.moel.go.kr/retirementpayCal.do"; // 고용노동부 퇴직금 계산
const MINWAGE_CALC = "https://www.minimumwage.go.kr/"; // 최저임금위 모의계산

export function StaffRightsCard({ ko, hourlyWage, hireDate, joinedAt, weeklyMinutes }: {
  ko: boolean;
  hourlyWage: number | null;
  hireDate: string | null;
  joinedAt: string | null;
  weeklyMinutes: number;
}) {
  const weeklyHours = weeklyMinutes / 60;
  const effectiveHire = hireDate ?? (joinedAt ? joinedAt.slice(0, 10) : undefined);

  // SSOT 재사용 — 직원 1명 배열로 호출 (사장 알림과 동일 판정)
  const sev = checkSeveranceObligation([{ id: "me", name: ko ? "나" : "Me", hireDate: effectiveHire, weeklyHours, hourlyWage: hourlyWage ?? 0 }])[0];
  const leave = checkAnnualLeaveAccrual([{ id: "me", name: ko ? "나" : "Me", hireDate: effectiveHire }])[0];

  const daysSinceHire = sev?.daysSinceHire ?? 0;
  const monthsSinceHire = Math.floor(daysSinceHire / 30);
  const juhyuEligible = weeklyHours >= 15;
  const severanceEligible = sev?.level === "eligible";
  const severanceApproaching = sev?.level === "approaching";
  const belowMinimum = hourlyWage != null && hourlyWage > 0 && hourlyWage < MINIMUM_WAGE_2026;

  const sectionTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 750, color: MIDNIGHT, marginBottom: 4 };
  const itemBox = (highlight: boolean): React.CSSProperties => ({
    padding: "12px 14px", borderRadius: 12,
    background: highlight ? "rgba(26,122,54,0.06)" : MIDNIGHT_SOFT,
    border: `1px solid ${highlight ? "rgba(26,122,54,0.25)" : "transparent"}`,
  });
  const badge = (on: boolean): React.CSSProperties => ({
    fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, flexShrink: 0,
    background: on ? "rgba(26,122,54,0.10)" : "rgba(15,23,42,0.06)",
    color: on ? OK : MUTED,
    border: `1px solid ${on ? "rgba(26,122,54,0.22)" : "rgba(15,23,42,0.10)"}`,
  });
  const lawRef: React.CSSProperties = { fontSize: 11, color: MUTED, marginTop: 4, lineHeight: 1.5 };
  const link: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: MIDNIGHT, textDecoration: "none", marginTop: 4 };

  return (
    <section style={{ background: "white", borderRadius: 22, padding: "22px 22px", boxShadow: "0 6px 30px rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <ShieldCheck size={17} strokeWidth={1.9} style={{ color: MIDNIGHT }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: INK, letterSpacing: "-0.01em" }}>{ko ? "내 근로 권리" : "My rights"}</div>
      </div>

      {hourlyWage == null && (
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12, lineHeight: 1.5 }}>
          {ko ? "사장님이 시급을 등록하면 주휴수당·퇴직금 자격이 여기 표시됩니다." : "Once your hourly wage is set, your entitlements appear here."}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* ① 주휴수당 */}
        <div style={itemBox(juhyuEligible)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={sectionTitle}>{ko ? "주휴수당" : "Weekly holiday pay"}</span>
            <span style={{ marginLeft: "auto", ...badge(juhyuEligible) }}>
              {juhyuEligible ? (ko ? "대상" : "Eligible") : (ko ? "비대상" : "Not eligible")}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: INK, fontWeight: 600 }}>
            {juhyuEligible
              ? (ko ? `주 ${weeklyHours.toFixed(0)}시간 근무 — 매주 개근 시 주휴수당 대상입니다.` : `${weeklyHours.toFixed(0)}h/week — eligible with full attendance.`)
              : (ko ? `주 ${weeklyHours.toFixed(0)}시간 — 주 15시간 이상 근무 시 대상이 됩니다.` : `${weeklyHours.toFixed(0)}h/week — needs 15h+.`)}
          </div>
          <div style={lawRef}>{ko ? "근로기준법 §55 · 주 15시간↑ + 개근. 정확한 금액은 급여명세서 확인." : "Labor Standards Act §55."}</div>
        </div>

        {/* ② 퇴직금 */}
        <div style={itemBox(severanceEligible)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={sectionTitle}>{ko ? "퇴직금" : "Severance"}</span>
            <span style={{ marginLeft: "auto", ...badge(severanceEligible) }}>
              {severanceEligible ? (ko ? "대상 도달" : "Eligible") : severanceApproaching ? (ko ? "임박" : "Soon") : (ko ? "미도달" : "Not yet")}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: INK, fontWeight: 600 }}>
            {weeklyHours < 15
              ? (ko ? "주 15시간 미만 — 퇴직금 비대상입니다." : "Under 15h/week — not eligible.")
              : severanceEligible
                ? (ko ? `근속 ${monthsSinceHire}개월 — 퇴직 시 퇴직금 지급 대상입니다.` : `${monthsSinceHire} months — eligible on leaving.`)
                : (ko ? `근속 ${daysSinceHire}일 — 1년(365일) 도달 시 대상이 됩니다. D-${Math.max(0, 365 - daysSinceHire)}` : `${daysSinceHire} days — eligible at 1 year. D-${Math.max(0, 365 - daysSinceHire)}`)}
          </div>
          <div style={lawRef}>{ko ? "근로자퇴직급여법 §4 · 1년↑ + 주 15시간↑. 사장님은 퇴직 후 14일 이내 지급 의무." : "Severance Act §4 · pay within 14 days of leaving."}</div>
          {(severanceEligible || severanceApproaching) && (
            <a href={MOEL_SEVERANCE} target="_blank" rel="noopener noreferrer" style={link}>
              {ko ? "고용노동부 퇴직금 계산기" : "Official calculator"}<ExternalLink size={11} strokeWidth={2} />
            </a>
          )}
        </div>

        {/* ③ 연차 */}
        <div style={itemBox(leave?.level === "due" || leave?.level === "overdue")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={sectionTitle}>{ko ? "연차유급휴가" : "Annual leave"}</span>
            <span style={{ marginLeft: "auto", ...badge(daysSinceHire >= 365) }}>
              {daysSinceHire >= 365 ? (ko ? "15일 발생" : "15 days") : (ko ? "1년 미만" : "<1yr")}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: INK, fontWeight: 600 }}>
            {daysSinceHire >= 365
              ? (ko ? "근속 1년 이상 — 연차 15일 발생. 미사용분은 수당으로 받을 수 있어요." : "1yr+ — 15 days accrued.")
              : (ko ? `근속 1년 도달 시 연차 15일이 발생합니다. D-${Math.max(0, 365 - daysSinceHire)}` : `15 days at 1 year. D-${Math.max(0, 365 - daysSinceHire)}`)}
          </div>
          <div style={lawRef}>{ko ? "근로기준법 §60 · 상시 5인 이상 사업장 한정 (4인 이하 미적용)." : "Labor Standards Act §60 · workplaces with 5+ staff."}</div>
        </div>

        {/* 최저임금 미달 경고 */}
        {belowMinimum && (
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(182,76,76,0.06)", border: "1px solid rgba(182,76,76,0.22)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#b64c4c" }}>
              {ko ? `⚠ 현재 시급 ${hourlyWage!.toLocaleString()}원 — 2026 최저시급 ${MINIMUM_WAGE_2026.toLocaleString()}원 미달` : `Below 2026 minimum wage`}
            </div>
            <a href={MINWAGE_CALC} target="_blank" rel="noopener noreferrer" style={link}>
              {ko ? "최저임금 확인" : "Check minimum wage"}<ExternalLink size={11} strokeWidth={2} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
