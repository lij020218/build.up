"use client";

/**
 * MyIngredientsPlanCard — 내 가게의 월 식자재·매입 원가 계획 입력.
 *
 * 위치: VendorSetupStage 하단.
 * 저장: stage_decisions["vendor-setup"].inputs.{ingredientsMonthlyKrw, ingredientsCogsRate, ingredientsMode, ingredientsExpectedRevenueKrw}.
 * 소비처: FinancialReviewStage 의 ingredients 추정 (이전엔 카테고리 default 매출 × 평균 cogsRate 로 "이전 단계 기반" 위장 — 2026-05-04 수정).
 *
 * 두 가지 입력 모드:
 *   ① 월 합계 직접 (예: 700만원/월) — 견적서 합산 가능한 사장에게 권장
 *   ② 매출 대비 비율 % (예: 30%) — 매출 추정만 있는 사장
 *   ③ 둘 다 모르면 미입력 — FinancialReview 가 "업종 평균" 으로 라벨링 (정직하게)
 */

import { useEffect, useState } from "react";
import { Boxes, ChartPie } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";

type Mode = "monthly" | "rate" | "skip";

const fmtWon = (n: number) => {
  const abs = Math.abs(Math.round(n));
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${abs.toLocaleString()}원`;
};

export function MyIngredientsPlanCard({ ko }: { ko: boolean }) {
  const d = useDashboardCtx();
  const decisions = d.decisions as Record<
    string,
    {
      inputs?: {
        ingredientsMode?: Mode;
        ingredientsMonthlyKrw?: number;
        ingredientsCogsRate?: number;
        ingredientsExpectedRevenueKrw?: number;
      };
    } | undefined
  >;
  const saved = decisions["vendor-setup"]?.inputs;

  const [mode, setMode] = useState<Mode>(saved?.ingredientsMode ?? "skip");
  const [monthlyManwon, setMonthlyManwon] = useState<string>(
    saved?.ingredientsMonthlyKrw != null ? String(Math.round(saved.ingredientsMonthlyKrw / 10_000)) : "",
  );
  const [ratePct, setRatePct] = useState<string>(
    saved?.ingredientsCogsRate != null ? String(Math.round(saved.ingredientsCogsRate * 100)) : "",
  );
  const [expectedRevManwon, setExpectedRevManwon] = useState<string>(
    saved?.ingredientsExpectedRevenueKrw != null ? String(Math.round(saved.ingredientsExpectedRevenueKrw / 10_000)) : "",
  );

  // 자동 저장
  useEffect(() => {
    const monthlyKrw = monthlyManwon ? Math.max(0, Number(monthlyManwon)) * 10_000 : undefined;
    const rate = ratePct ? Math.min(1, Math.max(0, Number(ratePct) / 100)) : undefined;
    const expectedRev = expectedRevManwon ? Math.max(0, Number(expectedRevManwon)) * 10_000 : undefined;
    d.setDecisions((prev: Record<string, unknown>) => ({
      ...prev,
      "vendor-setup": {
        ...((prev["vendor-setup"] as Record<string, unknown>) ?? {}),
        stageId: "vendor-setup",
        inputs: {
          ...(((prev["vendor-setup"] as Record<string, unknown>)?.inputs as Record<string, unknown>) ?? {}),
          ingredientsMode: mode,
          ingredientsMonthlyKrw: mode === "monthly" ? monthlyKrw : undefined,
          ingredientsCogsRate: mode === "rate" ? rate : undefined,
          ingredientsExpectedRevenueKrw: mode === "rate" ? expectedRev : undefined,
        },
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, monthlyManwon, ratePct, expectedRevManwon]);

  // 미리보기
  const preview = (() => {
    if (mode === "monthly" && monthlyManwon) {
      return Number(monthlyManwon) * 10_000;
    }
    if (mode === "rate" && ratePct && expectedRevManwon) {
      return (Number(ratePct) / 100) * Number(expectedRevManwon) * 10_000;
    }
    return null;
  })();

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
        marginBottom: 16,
      }}
    >
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
          <Boxes size={14} strokeWidth={1.6} />
        </span>
        <div>
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
            {ko ? "내 식자재·매입 원가" : "My ingredients / COGS"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {ko ? "월 식자재 원가, 어떻게 계산할까요?" : "How to compute monthly ingredient cost?"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {(
          [
            { id: "monthly", ko: "월 합계 입력", en: "Monthly total", desc: { ko: "공급처 견적 합산 — 가장 정확", en: "From quotes — most accurate" } },
            { id: "rate", ko: "매출 대비 %", en: "% of revenue", desc: { ko: "매출 추정만 있을 때", en: "When only revenue est." } },
            { id: "skip", ko: "아직 모름", en: "Not yet", desc: { ko: "재무 검토는 업종 평균 표시", en: "Financial review shows avg" } },
          ] as { id: Mode; ko: string; en: string; desc: { ko: string; en: string } }[]
        ).map((opt) => {
          const sel = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
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

      {mode === "monthly" && (
        <div style={inputBlock}>
          <div style={fieldLabel}>{ko ? "월 식자재·매입 원가 합계" : "Monthly ingredients total"}</div>
          <TextInput value={monthlyManwon} onChange={setMonthlyManwon} placeholder={ko ? "예: 700" : "e.g., 700"} suffix={ko ? "만원" : "Manwon"} />
          <div style={hint}>
            {ko
              ? "위에서 정한 공급처별 견적 합산 — 식자재·소모품·포장재까지 모두 포함."
              : "Sum of quotes from selected suppliers — incl. consumables/packaging."}
          </div>
        </div>
      )}

      {mode === "rate" && (
        <div style={inputBlock}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={fieldLabel}>{ko ? "예상 월 매출" : "Expected monthly revenue"}</div>
              <TextInput value={expectedRevManwon} onChange={setExpectedRevManwon} placeholder={ko ? "예: 2000" : "e.g., 2000"} suffix={ko ? "만원" : "Manwon"} />
            </div>
            <div>
              <div style={fieldLabel}>{ko ? "원가율 (매출 대비 %)" : "COGS rate (% of revenue)"}</div>
              <TextInput value={ratePct} onChange={(v) => setRatePct(v.slice(0, 3))} placeholder={ko ? "예: 33" : "e.g., 33"} suffix="%" />
            </div>
          </div>
          <div style={hint}>
            <ChartPie size={11} strokeWidth={1.6} style={{ display: "inline-block", verticalAlign: -1, marginRight: 4, color: MIDNIGHT }} />
            {ko
              ? "외식 평균 30~35%, 카페 25~30%, 소매 50~60%, 뷰티 15~20%. 동종 업계 사장님과 비교해 보세요."
              : "Restaurant avg 30-35%, cafe 25-30%, retail 50-60%, beauty 15-20%."}
          </div>
        </div>
      )}

      {mode === "skip" && (
        <div style={{ ...inputBlock, padding: "12px 14px", background: "rgba(15,23,42,0.025)", border: "1px solid rgba(15,23,42,0.08)" }}>
          <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.55 }}>
            {ko
              ? "재무 검토 단계는 「업종 평균」 라벨로 표시됩니다. 견적서 합산이 끝나면 위 옵션 중 하나를 선택해 정확한 값으로 바꿔 주세요."
              : "Financial Review will show 'industry average' label. Switch to Monthly/Rate once you have quotes."}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          background: mode === "skip" ? "rgba(15,23,42,0.03)" : "rgba(25,25,112,0.04)",
          border: `1px solid ${mode === "skip" ? "rgba(15,23,42,0.08)" : MIDNIGHT_BORDER}`,
          borderRadius: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.6)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {ko ? "월 식자재·원가 (재무 검토에 반영)" : "Monthly ingredients (carries to Financial Review)"}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: preview != null ? MIDNIGHT : "rgba(15,23,42,0.5)",
              letterSpacing: "-0.01em",
              marginTop: 2,
            }}
          >
            {preview != null ? `₩${Math.round(preview).toLocaleString()}` : ko ? "업종 평균으로 표시됨" : "Shown as industry avg"}
          </div>
          {preview != null && mode === "rate" && (
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
              {ko
                ? `예상 매출 ${fmtWon(Number(expectedRevManwon) * 10_000)} × 원가율 ${ratePct}%`
                : `Revenue ${fmtWon(Number(expectedRevManwon) * 10_000)} × ${ratePct}%`}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
        {ko
          ? "이 값은 「재무 검토」 단계의 식자재 칸으로 자동 전달됩니다. 미입력 시 업종 평균치(매출 평균 × 평균 원가율)로 대체되어 「업종 평균」 으로 라벨링됩니다."
          : "Carries into Financial Review's ingredients field. Blank = industry-average label."}
      </div>
    </div>
  );
}

const inputBlock: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "12px 14px",
  background: "rgba(15,23,42,0.02)",
  borderRadius: 12,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(15,23,42,0.6)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 5,
};

const hint: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
  lineHeight: 1.5,
};

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
          padding: "8px 44px 8px 10px",
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
