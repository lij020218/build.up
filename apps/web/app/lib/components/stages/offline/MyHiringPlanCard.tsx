"use client";

/**
 * MyHiringPlanCard — 내 가게의 실제 채용 계획 입력 폼.
 *
 * 위치: HiringSetupStage 상단.
 * 저장 경로: stage_decisions["hiring-setup"].inputs.staffPlan + .hiringStatus.
 * 소비처: FinancialReviewStage 의 인건비 추정 (이전엔 카테고리 평균치를 "이전 단계 기반" 으로 거짓 표시 — 2026-05-04 수정).
 *
 * UX 의도:
 *   ① "직원을 채용했나요?" 명시적 선택 (미고용 / 채용 예정 / 채용 완료).
 *   ② 정직원·알바 인원 + 단가를 입력 — calculateMonthlyTeamLaborCost 로 사업주 부담 즉시 미리보기.
 *   ③ 미고용 선택 시 0원 + 다음 단계에 그대로 반영. 가짜 평균치 노출 방지.
 */

import { useEffect, useMemo, useState } from "react";
import { Users, ShieldCheck } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { InviteLinkSection } from "../../InviteLinkSection";
import {
  calculateMonthlyTeamLaborCost,
  hourlyToMonthly,
  MINIMUM_WAGE_2026,
  type StaffPlan,
} from "@foundone/shared";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";

type HiringStatus = "not-yet" | "planned" | "hired";

type Props = { ko: boolean };

const fmt = (n: number) => {
  const abs = Math.abs(Math.round(n));
  if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString()}만원`;
  return `${abs.toLocaleString()}원`;
};

export function MyHiringPlanCard({ ko }: Props) {
  const d = useDashboardCtx();
  const decisions = d.decisions as Record<
    string,
    { inputs?: { staffPlan?: StaffPlan; hiringStatus?: HiringStatus } } | undefined
  >;
  const saved = decisions["hiring-setup"]?.inputs;

  // ── 로컬 폼 상태 (초기엔 saved 값 또는 빈값 — 자동 평균치 노출 X) ──
  const [status, setStatus] = useState<HiringStatus>(saved?.hiringStatus ?? "not-yet");
  const [ftCount, setFtCount] = useState<number>(saved?.staffPlan?.fullTimeCount ?? 0);
  const [ftMonthlyManwon, setFtMonthlyManwon] = useState<string>(
    saved?.staffPlan?.fullTimeMonthlyBase != null
      ? String(Math.round(saved.staffPlan.fullTimeMonthlyBase / 10_000))
      : "",
  );
  const [ptCount, setPtCount] = useState<number>(saved?.staffPlan?.partTimeCount ?? 0);
  const [ptHourly, setPtHourly] = useState<string>(
    saved?.staffPlan?.partTimeHourlyWage != null
      ? String(saved.staffPlan.partTimeHourlyWage)
      : "",
  );
  const [ptHoursPerWeek, setPtHoursPerWeek] = useState<number>(
    saved?.staffPlan?.partTimeHoursPerWeek ?? 25,
  );

  // ── 파생 staffPlan (수치 정규화) ──
  const staffPlan: StaffPlan = useMemo(() => {
    if (status === "not-yet") return { fullTimeCount: 0, partTimeCount: 0 };
    return {
      fullTimeCount: Math.max(0, ftCount),
      fullTimeMonthlyBase: ftMonthlyManwon ? Math.max(0, Number(ftMonthlyManwon)) * 10_000 : undefined,
      partTimeCount: Math.max(0, ptCount),
      partTimeHourlyWage: ptHourly ? Math.max(0, Number(ptHourly)) : undefined,
      partTimeHoursPerWeek: Math.max(0, ptHoursPerWeek),
    };
  }, [status, ftCount, ftMonthlyManwon, ptCount, ptHourly, ptHoursPerWeek]);

  // ── 월 인건비 미리보기 (사업주 총 부담 = 기본급 + 주휴 + 4대보험 + 퇴직 적립) ──
  const cost = useMemo(() => calculateMonthlyTeamLaborCost(staffPlan), [staffPlan]);
  const ftMonthlyPreviewKrw =
    staffPlan.fullTimeMonthlyBase ?? hourlyToMonthly(MINIMUM_WAGE_2026, 40);

  // ── 자동 저장: 폼 변경 시 stage_decisions["hiring-setup"].inputs 에 영구화 ──
  //   autosave 가 5초마다 Supabase upsert.
  useEffect(() => {
    d.setDecisions((prev: Record<string, unknown>) => ({
      ...prev,
      "hiring-setup": {
        ...((prev["hiring-setup"] as Record<string, unknown>) ?? {}),
        stageId: "hiring-setup",
        inputs: {
          ...(((prev["hiring-setup"] as Record<string, unknown>)?.inputs as Record<string, unknown>) ?? {}),
          hiringStatus: status,
          staffPlan,
        },
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, ftCount, ftMonthlyManwon, ptCount, ptHourly, ptHoursPerWeek]);

  return (
    <div
      style={{
        background: "white",
        border: `1px solid ${MIDNIGHT_BORDER}`,
        borderRadius: 16,
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: MIDNIGHT_SOFT,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: MIDNIGHT,
          }}
        >
          <Users size={14} strokeWidth={1.6} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: MIDNIGHT,
              opacity: 0.7,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {ko ? "내 채용 계획" : "My hiring plan"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {ko ? "직원을 채용하셨거나 채용 예정이신가요?" : "Have you hired or do you plan to?"}
          </div>
        </div>
      </div>

      {/* 상태 토글 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {(
          [
            { id: "not-yet", ko: "아직 채용 안 함", en: "Not hiring", desc: { ko: "1인 운영 / 본인만", en: "Solo / owner only" } },
            { id: "planned", ko: "채용 예정", en: "Planning", desc: { ko: "오픈 전후 채용 계획", en: "Plan to hire" } },
            { id: "hired", ko: "채용 완료", en: "Hired", desc: { ko: "근로계약 체결됨", en: "Contract signed" } },
          ] as { id: HiringStatus; ko: string; en: string; desc: { ko: string; en: string } }[]
        ).map((opt) => {
          const sel = status === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatus(opt.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: sel ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(15,23,42,0.08)",
                background: sel
                  ? `linear-gradient(160deg, ${MIDNIGHT_SOFT} 0%, rgba(25,25,112,0.02) 100%)`
                  : "white",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: sel ? MIDNIGHT : "#0f172a" }}>
                {ko ? opt.ko : opt.en}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>
                {ko ? opt.desc.ko : opt.desc.en}
              </span>
            </button>
          );
        })}
      </div>

      {/* 인원·단가 입력 (미고용은 숨김) */}
      {status !== "not-yet" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "12px 14px",
            background: "rgba(15,23,42,0.02)",
            borderRadius: 12,
          }}
        >
          {/* 정직원 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr", gap: 10, alignItems: "end" }}>
            <div>
              <div style={fieldLabel}>{ko ? "정직원 인원수" : "Full-time count"}</div>
              <NumberInput value={ftCount} onChange={setFtCount} min={0} max={50} />
            </div>
            <div>
              <div style={fieldLabel}>{ko ? "1명 월급" : "Monthly wage"}</div>
              <TextInput
                value={ftMonthlyManwon}
                onChange={setFtMonthlyManwon}
                placeholder={ko ? "예: 230" : "e.g., 230"}
                suffix={ko ? "만원" : "Manwon"}
              />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.4, paddingBottom: 8 }}>
              {ko
                ? `미입력 시 최저시급(주 40h) × ${Math.round(hourlyToMonthly(MINIMUM_WAGE_2026, 40) / 10_000)}만원으로 추정`
                : `Defaults to min-wage 40h baseline if blank`}
            </div>
          </div>

          {/* 알바·파트타임 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 1fr", gap: 10, alignItems: "end" }}>
            <div>
              <div style={fieldLabel}>{ko ? "알바·파트 인원수" : "Part-time count"}</div>
              <NumberInput value={ptCount} onChange={setPtCount} min={0} max={50} />
            </div>
            <div>
              <div style={fieldLabel}>{ko ? "시급" : "Hourly"}</div>
              <TextInput
                value={ptHourly}
                onChange={setPtHourly}
                placeholder={String(MINIMUM_WAGE_2026)}
                suffix={ko ? "원" : "KRW"}
              />
            </div>
            <div>
              <div style={fieldLabel}>{ko ? "주당 시간" : "Hrs/wk"}</div>
              <NumberInput value={ptHoursPerWeek} onChange={setPtHoursPerWeek} min={1} max={60} />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.4, paddingBottom: 8 }}>
              {ko
                ? `2026 최저시급 ${MINIMUM_WAGE_2026.toLocaleString()}원 자동 적용`
                : `Auto-applies 2026 min wage ${MINIMUM_WAGE_2026.toLocaleString()} KRW/h`}
            </div>
          </div>
        </div>
      )}

      {/* 월 인건비 합계 미리보기 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          background: status === "not-yet" ? "rgba(15,23,42,0.03)" : "rgba(25,25,112,0.04)",
          border: `1px solid ${status === "not-yet" ? "rgba(15,23,42,0.08)" : MIDNIGHT_BORDER}`,
          borderRadius: 12,
        }}
      >
        <ShieldCheck
          size={16}
          strokeWidth={1.6}
          style={{ color: status === "not-yet" ? "rgba(15,23,42,0.4)" : MIDNIGHT, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.6)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {ko ? "월 사업주 부담 (4대보험 + 퇴직 적립 포함)" : "Monthly employer cost (incl. insurance & severance)"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: status === "not-yet" ? "rgba(15,23,42,0.5)" : MIDNIGHT, letterSpacing: "-0.01em", marginTop: 2 }}>
            {status === "not-yet"
              ? (ko ? "₩0 — 채용 없음" : "₩0 — no hires")
              : `₩${cost.total.toLocaleString()}`}
          </div>
          {status !== "not-yet" && (cost.fullTimeCost > 0 || cost.partTimeCost > 0) && (
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
              {ko
                ? `정직원 ${fmt(cost.fullTimeCost)} + 알바 ${fmt(cost.partTimeCost)}`
                : `FT ${fmt(cost.fullTimeCost)} + PT ${fmt(cost.partTimeCost)}`}
              {ftCount > 0 && ftMonthlyManwon === "" && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  · {ko ? `정직원 1인 추정 ${fmt(ftMonthlyPreviewKrw)} 기본` : `FT base ${fmt(ftMonthlyPreviewKrw)}`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
        {ko
          ? "이 값은 다음 단계인 「재무 검토」의 월 운영비 인건비 칸으로 자동 전달됩니다. 입력하지 않으면 업종 평균치로 표시됩니다."
          : "Carried into Financial Review's labor field. Blank = industry average shown."}
      </div>

      {/* ── 직원 초대 링크 발송 — 직원이 Found.One 으로 가게에 연결되도록 ── */}
      {status !== "not-yet" && <InviteLinkSection ko={ko} />}
    </div>
  );
}

const fieldLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(15,23,42,0.6)",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  marginBottom: 5,
};

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
      }}
      style={{
        width: "100%",
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid rgba(15,23,42,0.12)",
        fontSize: 14,
        fontWeight: 600,
        color: "#0f172a",
        background: "white",
        outline: "none",
      }}
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        style={{
          width: "100%",
          padding: "8px 38px 8px 10px",
          borderRadius: 8,
          border: "1px solid rgba(15,23,42,0.12)",
          fontSize: 14,
          fontWeight: 600,
          color: "#0f172a",
          background: "white",
          outline: "none",
        }}
      />
      <span
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 11,
          color: "var(--muted)",
          pointerEvents: "none",
        }}
      >
        {suffix}
      </span>
    </div>
  );
}
