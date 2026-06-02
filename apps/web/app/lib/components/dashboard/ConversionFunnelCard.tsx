"use client";

/**
 * ConversionFunnelCard — 온라인 커머스 · 스타트업 SaaS 통합 전환율 카드.
 *
 * 2026-05-19 사장님 결정:
 *   • 온라인/SaaS 는 "전환율" 이 가장 본질적인 지표 — 운영 대시보드 반드시 반영.
 *   • 두 카드(EcommerceConversionCard·StartupMetricsCard) 통합 → mode prop 분기.
 *   • 헤더에 "전환율" 명시 (iOS ConversionFunnelFocusCard 패턴 동일).
 *
 * iOS SSOT:
 *   apps/ios/Sources/FoundOneFeatures/DailyHub/ConversionFunnelFocusCard.swift
 *
 * 데이터:
 *   v_saas_funnel_unified (manual > ga4 > webhook). useFunnelMetrics 훅 사용.
 *   Phase 1: 사장님 수동 입력 (saas_funnel_manual_weekly upsert).
 *   Phase 2 (예정): GA4 OAuth + Custom Webhook.
 *
 * Mode 별 funnel 단계:
 *   - commerce: 방문 → 장바구니 → 결제 시작 → 구매
 *   - saas:     방문 → 가입 → 활성화 → 유료
 */

import { useMemo, useState } from "react";
import { ShoppingCart, TrendingUp, Pencil, Sparkles, Check, X } from "lucide-react";
import { useFunnelMetrics, type FunnelMode, type FunnelRow } from "../../hooks/useFunnelMetrics";

const MIDNIGHT = "#191970";

const STEP_LABELS_COMMERCE = ["방문", "장바구니", "결제 시작", "구매"];
const STEP_LABELS_SAAS = ["방문", "가입", "활성화", "유료"];

// 입력 전 카드가 비어보이지 않도록 light demo (iOS 와 동일 수치)
const SAMPLE_COMMERCE: [number, number, number, number] = [1240, 396, 148, 39];
const SAMPLE_SAAS: [number, number, number, number] = [2480, 287, 98, 23];

// 산업 평균 (메시지 톤·리크 분석 기준)
const BENCHMARK_COMMERCE = 2.0; // 이커머스 평균 2-3%
const BENCHMARK_SAAS = 1.0; // SaaS trial→paid 1-3%

type Props = {
  mode: FunnelMode;
  ko?: boolean;
  /** ecommerce 또는 startup-tech 가 아니면 렌더 안 함 (상위에서도 가드하지만 이중 안전). */
  industryCategoryId?: string;
};

export function ConversionFunnelCard(props: Props) {
  // 업종 가드 — wrapper/inner 분리로 훅 전 early return 회피(rules-of-hooks). 동작 동일.
  const { mode, industryCategoryId } = props;
  if (mode === "commerce" && industryCategoryId && industryCategoryId !== "ecommerce") return null;
  if (mode === "saas" && industryCategoryId && industryCategoryId !== "startup-tech") return null;
  return <ConversionFunnelCardInner {...props} />;
}

function ConversionFunnelCardInner({ mode, ko = true, industryCategoryId }: Props) {

  const { rows, loading, save } = useFunnelMetrics(mode);

  const latest = rows[0];
  const prev = rows[1];

  const isEmpty =
    !latest ||
    (latest.step_1 === 0 && latest.step_2 === 0 && latest.step_3 === 0 && latest.step_4 === 0);

  const stepValues: [number, number, number, number] = isEmpty
    ? mode === "commerce"
      ? SAMPLE_COMMERCE
      : SAMPLE_SAAS
    : [latest.step_1, latest.step_2, latest.step_3, latest.step_4];

  const stepLabels = mode === "commerce" ? STEP_LABELS_COMMERCE : STEP_LABELS_SAAS;

  // 전체 전환율
  const overallConv = stepValues[0] > 0 ? (stepValues[3] / stepValues[0]) * 100 : 0;

  // WoW (전주 대비 %p)
  const prevOverall =
    prev && prev.step_1 > 0 ? (prev.step_4 / prev.step_1) * 100 : null;
  const wowDelta = prevOverall != null && !isEmpty ? overallConv - prevOverall : null;

  // 단계 간 전환율 + 최대 누수 단계
  const stepConvs: number[] = stepValues.map((v, i) => {
    if (i === 0) return 100;
    const prevV = stepValues[i - 1];
    return prevV > 0 ? (v / prevV) * 100 : 0;
  });

  const leakInfo = useMemo(() => {
    let worstDrop = 0;
    let worstIdx = -1;
    for (let i = 1; i < stepValues.length; i++) {
      const drop = 100 - stepConvs[i];
      if (drop > worstDrop) {
        worstDrop = drop;
        worstIdx = i;
      }
    }
    return { worstIdx, worstDrop };
  }, [stepValues, stepConvs]);

  const benchmark = mode === "commerce" ? BENCHMARK_COMMERCE : BENCHMARK_SAAS;
  const grade: "good" | "notable" | "warning" | "critical" = (() => {
    const ratio = overallConv / benchmark;
    if (ratio >= 1.5) return "good";
    if (ratio >= 1.0) return "notable";
    if (ratio >= 0.6) return "warning";
    return "critical";
  })();

  // ─── 인라인 수동 입력 ────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<[string, string, string, string]>(["", "", "", ""]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const startEditing = () => {
    setDraft(
      isEmpty
        ? ["", "", "", ""]
        : [String(latest.step_1), String(latest.step_2), String(latest.step_3), String(latest.step_4)],
    );
    setSaveState("idle");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveState("idle");
  };

  const submitDraft = async () => {
    const parsed: [number, number, number, number] = [
      Math.max(0, parseInt(draft[0], 10) || 0),
      Math.max(0, parseInt(draft[1], 10) || 0),
      Math.max(0, parseInt(draft[2], 10) || 0),
      Math.max(0, parseInt(draft[3], 10) || 0),
    ];
    setSaveState("saving");
    try {
      await save(parsed);
      setSaveState("saved");
      setEditing(false);
    } catch {
      setSaveState("error");
    }
  };

  // ─── 소스 배지 ──────────────────────────────────────────────────
  const source: FunnelRow["source"] = isEmpty ? "none" : latest?.source ?? "none";
  const sourceBadge: { label: string; bg: string; text: string } | null = (() => {
    if (isEmpty) return null;
    switch (source) {
      case "manual":
        return { label: "수동", bg: `${MIDNIGHT}10`, text: MIDNIGHT };
      case "ga4":
        return { label: "GA4 연동", bg: "rgba(5,150,105,0.10)", text: "#047857" };
      case "webhook":
        return { label: "Webhook", bg: "rgba(124,58,237,0.10)", text: "#6d28d9" };
      default:
        return null;
    }
  })();

  // 누수 메시지
  const leakAction: { headline: string; action: string } | null = (() => {
    if (isEmpty || leakInfo.worstIdx < 1) return null;
    const fromLabel = stepLabels[leakInfo.worstIdx - 1];
    const toLabel = stepLabels[leakInfo.worstIdx];
    const dropPct = Math.round(leakInfo.worstDrop);
    const headline = ko
      ? `${fromLabel} → ${toLabel} 단계에서 ${dropPct}% 이탈`
      : `${fromLabel} → ${toLabel} drop ${dropPct}%`;

    let action = "";
    if (mode === "commerce") {
      // 단계별 행동 (결제 UX 중심)
      if (leakInfo.worstIdx === 1) action = ko ? "장바구니 진입률 낮음 — 상품 상세·리뷰·가격 가시성 점검" : "Improve product detail/reviews";
      else if (leakInfo.worstIdx === 2) action = ko ? "결제 시작률 낮음 — 장바구니 페이지 CTA·배송비 표기 명확화" : "Cart CTA · shipping clarity";
      else action = ko ? "결제 완주율 낮음 — 결제 단계 입력 필드 축소·간편결제 추가" : "Reduce checkout fields · add easy pay";
    } else {
      // SaaS (온보딩·활성화 중심)
      if (leakInfo.worstIdx === 1) action = ko ? "가입 전환 낮음 — 랜딩 가치제안·CTA·소셜 로그인 점검" : "Improve landing value prop";
      else if (leakInfo.worstIdx === 2) action = ko ? "활성화 낮음 — 첫 가치 경험까지의 단계 축소·온보딩 체크리스트" : "Trim onboarding to first value";
      else action = ko ? "유료 전환 낮음 — 사용량 한계·유료 가치 알림·결제 마찰 점검" : "Pricing trigger · checkout friction";
    }
    return { headline, action };
  })();

  // ─── 색상 톤 ────────────────────────────────────────────────────
  const tone = {
    good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
    notable: { bg: `${MIDNIGHT}08`, border: `${MIDNIGHT}22`, text: MIDNIGHT },
    warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
    critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
  }[grade];

  const maxValue = Math.max(...stepValues, 1);

  return (
    <article style={{ ...cardStyle, opacity: loading ? 0.85 : 1 }}>
      {/* ─── Header ─── */}
      <header style={headerRow}>
        <span style={{ ...iconBadge, background: `linear-gradient(135deg, ${tone.text} 0%, ${tone.text}cc 100%)` }}>
          {mode === "commerce" ? (
            <ShoppingCart size={14} strokeWidth={2.2} />
          ) : (
            <TrendingUp size={14} strokeWidth={2.2} />
          )}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <div style={labelStyle}>
            {mode === "commerce"
              ? ko
                ? "온라인 커머스 · 전환율"
                : "Commerce · Conversion"
              : ko
                ? "스타트업 · 전환율"
                : "Startup · Conversion"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(15,23,42,0.55)" }}>
            {mode === "commerce"
              ? ko
                ? "방문 → 구매 funnel"
                : "Visit → Purchase"
              : ko
                ? "가입 → 유료 funnel"
                : "Visit → Paid"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {sourceBadge && (
            <span style={{ ...sourceBadgeStyle, background: sourceBadge.bg, color: sourceBadge.text }}>
              {sourceBadge.label}
            </span>
          )}
          {!editing && (
            <button type="button" onClick={startEditing} style={editBtnStyle} aria-label={ko ? "수동 입력" : "Edit"}>
              <Pencil size={12} strokeWidth={2.2} />
              <span>{ko ? "수정" : "Edit"}</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── Primary metric ─── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: tone.text,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {overallConv.toFixed(1)}%
        </div>
        <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)" }}>
          {ko ? "전체 전환율 (1주)" : "Overall (1w)"}
        </div>
        {wowDelta != null && (
          <span
            style={{
              ...wowPillStyle,
              background: wowDelta >= 0 ? "rgba(5,150,105,0.10)" : "rgba(220,38,38,0.08)",
              color: wowDelta >= 0 ? "#059669" : "#b91c1c",
            }}
          >
            {wowDelta >= 0 ? "▲" : "▼"} {Math.abs(wowDelta).toFixed(1)}%p {ko ? "전주" : "WoW"}
          </span>
        )}
        {isEmpty && (
          <span style={sampleBadgeStyle}>{ko ? "샘플" : "Sample"}</span>
        )}
      </div>

      {/* ─── Funnel bars OR edit form ─── */}
      {editing ? (
        <EditForm
          ko={ko}
          labels={stepLabels}
          draft={draft}
          onChange={setDraft}
          onCancel={cancelEditing}
          onSave={submitDraft}
          state={saveState}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stepValues.map((v, i) => {
            const width = (v / maxValue) * 100;
            const isLeak = leakInfo.worstIdx === i && !isEmpty;
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "6px 10px",
                  borderRadius: 9,
                  background: isLeak ? "rgba(217,119,6,0.05)" : "rgba(15,23,42,0.02)",
                  border: `1px solid ${isLeak ? "rgba(217,119,6,0.20)" : "rgba(25,25,112,0.06)"}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{stepLabels[i]}</div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 6,
                    background: "rgba(15,23,42,0.06)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${Math.max(width, 2)}%`,
                      background: `linear-gradient(90deg, ${tone.text} 0%, ${tone.text}aa 100%)`,
                      borderRadius: 6,
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end", minWidth: 92 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                    {v.toLocaleString()}
                  </span>
                  {i > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isLeak ? "#b45309" : "rgba(15,23,42,0.55)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {stepConvs[i].toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Empty CTA / Leak action ─── */}
      {!editing && isEmpty && (
        <button type="button" onClick={startEditing} style={emptyCTAStyle}>
          <Pencil size={13} strokeWidth={2.2} />
          <span>{ko ? "+ 내 가게 funnel 입력하기" : "+ Enter your funnel"}</span>
        </button>
      )}

      {!editing && !isEmpty && leakAction && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: tone.bg,
            border: `1px solid ${tone.border}`,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: tone.text,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {ko ? "가장 큰 누수" : "Biggest leak"}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.4 }}>
            {leakAction.headline}
          </div>
          <div style={{ fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
            {leakAction.action}
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      {!isEmpty && latest && (
        <div style={footerStyle}>
          <Sparkles size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
          {ko
            ? `${sourceLabelKo(source)} · 주 시작 ${latest.week_start} · 산업 평균 ${benchmark}%`
            : `${source} · week ${latest.week_start} · benchmark ${benchmark}%`}
        </div>
      )}
    </article>
  );
}

// ─── Edit form (inline) ──────────────────────────────────────────

function EditForm({
  ko,
  labels,
  draft,
  onChange,
  onCancel,
  onSave,
  state,
}: {
  ko: boolean;
  labels: string[];
  draft: [string, string, string, string];
  onChange: (d: [string, string, string, string]) => void;
  onCancel: () => void;
  onSave: () => void;
  state: "idle" | "saving" | "saved" | "error";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 12,
        background: `${MIDNIGHT}06`,
        border: `1px dashed ${MIDNIGHT}33`,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: MIDNIGHT,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {ko ? "이번 주 수동 입력 (단계별 사람 수)" : "Manual entry (this week)"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
        {labels.map((lab, i) => (
          <label key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,23,42,0.65)" }}>{lab}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={draft[i]}
              onChange={(e) => {
                const next: [string, string, string, string] = [...draft] as [string, string, string, string];
                next[i] = e.target.value;
                onChange(next);
              }}
              style={inputStyle}
              placeholder="0"
            />
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={onSave} disabled={state === "saving"} style={saveBtnStyle}>
          <Check size={13} strokeWidth={2.4} />
          <span>{state === "saving" ? (ko ? "저장 중…" : "Saving…") : ko ? "저장" : "Save"}</span>
        </button>
        <button type="button" onClick={onCancel} style={cancelBtnStyle}>
          <X size={13} strokeWidth={2.4} />
          <span>{ko ? "취소" : "Cancel"}</span>
        </button>
        {state === "error" && (
          <span style={{ fontSize: 11.5, color: "#b91c1c", fontWeight: 600 }}>
            {ko ? "저장 실패 — 다시 시도해 주세요" : "Save failed — retry"}
          </span>
        )}
        {state === "saved" && (
          <span style={{ fontSize: 11.5, color: "#059669", fontWeight: 600 }}>
            {ko ? "저장됨" : "Saved"}
          </span>
        )}
      </div>
    </div>
  );
}

function sourceLabelKo(s: FunnelRow["source"]): string {
  switch (s) {
    case "manual":
      return "수동 입력";
    case "ga4":
      return "GA4 연동";
    case "webhook":
      return "Webhook 연동";
    default:
      return "데이터 없음";
  }
}

// ─── Styles ──────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  padding: "22px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const headerRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10 };

const iconBadge: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 9,
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(25,25,112,0.18)",
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.85,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const sourceBadgeStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 999,
  letterSpacing: "0.04em",
};

const editBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  height: 32,
  padding: "0 10px",
  borderRadius: 8,
  background: `${MIDNIGHT}0d`,
  color: MIDNIGHT,
  border: `1px solid ${MIDNIGHT}22`,
  fontSize: 11.5,
  fontWeight: 700,
  cursor: "pointer",
};

const wowPillStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  padding: "3px 9px",
  borderRadius: 999,
  letterSpacing: "0.02em",
  fontVariantNumeric: "tabular-nums",
};

const sampleBadgeStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.06)",
  color: "rgba(15,23,42,0.55)",
};

const emptyCTAStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 38,
  padding: "0 14px",
  borderRadius: 12,
  background: `${MIDNIGHT}08`,
  color: MIDNIGHT,
  border: `1px dashed ${MIDNIGHT}55`,
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  height: 36,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid rgba(25,25,112,0.18)",
  background: "white",
  fontSize: 13,
  fontWeight: 600,
  color: "#0f172a",
  fontVariantNumeric: "tabular-nums",
  width: "100%",
  boxSizing: "border-box",
};

const saveBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 34,
  padding: "0 14px",
  borderRadius: 8,
  background: MIDNIGHT,
  color: "white",
  border: "none",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
};

const cancelBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 34,
  padding: "0 12px",
  borderRadius: 8,
  background: "white",
  color: "#0f172a",
  border: "1px solid rgba(15,23,42,0.18)",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: 11,
  color: "rgba(15,23,42,0.55)",
  lineHeight: 1.5,
  padding: "8px 12px",
  borderRadius: 9,
  background: "rgba(15,23,42,0.03)",
  border: "1px solid rgba(15,23,42,0.06)",
};
