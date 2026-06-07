"use client";

import { useState } from "react";
import type { HealthDiagnosisResult } from "@foundone/ai";
import type { BusinessHealthMetrics } from "@foundone/shared";
import { HEALTH_COLORS, HEALTH_LABEL_KO, HEALTH_LABEL_EN } from "@foundone/shared";

type Props = {
  metrics: BusinessHealthMetrics;
  language: "ko" | "en";
  businessType?: string;
  monthsInBusiness?: number;
};

export default function HealthDiagnosisCard({ metrics, language, businessType, monthsInBusiness }: Props) {
  const [diagnosis, setDiagnosis] = useState<HealthDiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const ko = language === "ko";

  // 건강 등급 색상·라벨은 SSOT(HEALTH_COLORS / HEALTH_LABEL) 사용 — 네이비 농담 + 위험 1색.
  //   (종전 자체 gradeConfig 는 신호등 컬러 + SSOT 와 다른 라벨이었음.)
  const gradePalette = HEALTH_COLORS[metrics.healthGrade];
  const grade = {
    color: gradePalette.text,
    bg: gradePalette.bg,
    border: gradePalette.border,
    label: ko ? HEALTH_LABEL_KO[metrics.healthGrade] : HEALTH_LABEL_EN[metrics.healthGrade],
  };

  // 색각 보강 색: 위험만 danger(벽돌), 그 외는 중립 ink / 주의 네이비. 방향은 부호·화살표로 전달.
  const INK = "var(--text)";
  const DANGER = "var(--danger)";
  const NAVY_CAUTION = "#191970";

  async function requestDiagnosis() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/health/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: businessType ?? "일반",
          monthsInBusiness: monthsInBusiness ?? 0,
          avgDailySales: metrics.avgDailySales,
          avgDailyCustomers: metrics.avgDailyCustomers,
          operatingMargin: metrics.operatingMargin,
          primeCostRatio: metrics.primeCostRatio,
          rentCostRatio: metrics.rentCostRatio,
          salesTrend: metrics.salesTrend,
          salesTrendPercent: metrics.salesTrendPercent,
          healthScore: metrics.healthScore,
          cashRunwayMonths: metrics.cashRunwayMonths,
          alerts: metrics.alerts.map((a) => ({ type: a.type, title: a.title })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosis(data);
      }
    } catch {
      // 실패해도 기본 지표는 보여줌
    } finally {
      setLoading(false);
    }
  }

  // 방향은 화살표(↑↓→)로 1차 전달. 색은 declining 만 위험(danger), growing 은 중립 ink.
  const trendArrow = metrics.salesTrend === "growing" ? "↑" : metrics.salesTrend === "declining" ? "↓" : "→";
  const trendColor = metrics.salesTrend === "declining" ? DANGER : metrics.salesTrend === "growing" ? INK : "var(--muted)";

  return (
    <div style={{
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.78)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.76) 100%)",
      boxShadow: "0 12px 28px rgba(17,17,17,0.04)",
      backdropFilter: "blur(18px)",
      overflow: "hidden",
    }}>
      {/* 상단: 점수 + 등급 */}
      <div style={{ padding: "22px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontSize: "12px",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: "var(--muted)",
            marginBottom: "8px",
          }}>
            {ko ? "경영 건강" : "Business Health"}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "42px", fontWeight: 700, letterSpacing: "-2px", lineHeight: 1 }}>
              {metrics.healthScore}
            </span>
            <span style={{ fontSize: "16px", color: "var(--muted)", fontWeight: 500 }}>/100</span>
          </div>
        </div>
        <span style={{
          fontSize: "13px",
          fontWeight: 650,
          color: grade.color,
          padding: "6px 14px",
          borderRadius: "999px",
          background: grade.bg,
          border: `1px solid ${grade.border}`,
        }}>
          {grade.label}
        </span>
      </div>

      {/* 핵심 지표 3개 — 한 줄 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "1px",
        margin: "18px 22px",
        borderRadius: "14px",
        overflow: "hidden",
        background: "rgba(17,17,17,0.04)",
      }}>
        {[
          {
            // 부호(+/-)로 방향 전달. 음수(적자)만 위험색, 양수는 중립.
            label: ko ? "영업이익률" : "Op. Margin",
            value: `${metrics.operatingMargin > 0 ? "+" : ""}${metrics.operatingMargin.toFixed(1)}%`,
            color: metrics.operatingMargin >= 0 ? INK : DANGER,
          },
          {
            label: ko ? "매출 추세" : "Trend",
            value: `${trendArrow} ${Math.abs(metrics.salesTrendPercent).toFixed(1)}%`,
            color: trendColor,
          },
          {
            // %값으로 정도 전달. 70% 초과만 위험색, 65~70 주의 네이비, 이하 중립.
            label: ko ? "프라임코스트" : "Prime Cost",
            value: `${metrics.primeCostRatio.toFixed(1)}%`,
            color: metrics.primeCostRatio <= 65 ? INK : metrics.primeCostRatio <= 70 ? NAVY_CAUTION : DANGER,
          },
        ].map((item) => (
          <div key={item.label} style={{
            background: "rgba(255,255,255,0.85)",
            padding: "14px 12px",
            textAlign: "center" as const,
          }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{item.label}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* AI 진단 — 요청 전에는 버튼, 후에는 결과 */}
      <div style={{ padding: "0 22px 18px" }}>
        {diagnosis ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {/* 한 줄 진단 */}
            <div style={{
              fontSize: "15px",
              fontWeight: 600,
              lineHeight: 1.5,
              letterSpacing: "-0.2px",
            }}>
              {diagnosis.headline}
            </div>

            {/* 상세 보기 토글 */}
            <button
              onClick={() => setShowDetail(!showDetail)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--primary)",
                fontWeight: 600,
                textAlign: "left" as const,
              }}
            >
              {showDetail
                ? (ko ? "접기" : "Less")
                : (ko ? "상세 보기" : "More")}
            </button>

            {showDetail && (
              <>
                {/* 상태 요약 */}
                <div style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--muted)" }}>
                  {diagnosis.statusSummary}
                </div>

                {/* 핵심 액션 */}
                {diagnosis.actions.length > 0 && (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {diagnosis.actions.map((action, i) => (
                      <div key={i} style={{
                        borderRadius: "14px",
                        padding: "14px 16px",
                        background: "rgba(0,0,0,0.025)",
                        display: "grid",
                        gap: "4px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600 }}>{action.title}</span>
                          <span style={{
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            // 난이도는 라벨(쉬움/보통/어려움)로 구분 — 색은 네이비 농담(easy 옅음 → hard 짙음).
                            background: action.difficulty === "easy" ? "rgba(25,25,112,0.06)" : action.difficulty === "hard" ? "rgba(25,25,112,0.14)" : "rgba(25,25,112,0.10)",
                            color: action.difficulty === "hard" ? "#191970" : "#1d3557",
                            fontWeight: 600,
                          }}>
                            {action.difficulty === "easy" ? (ko ? "쉬움" : "Easy") : action.difficulty === "hard" ? (ko ? "어려움" : "Hard") : (ko ? "보통" : "Medium")}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                          {action.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 격려 */}
                {diagnosis.encouragement && (
                  <div style={{
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "#1d3557",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "rgba(25,25,112,0.05)",
                  }}>
                    {diagnosis.encouragement}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <button
            onClick={requestDiagnosis}
            disabled={loading}
            style={{
              width: "100%",
              borderRadius: "14px",
              border: "1px solid rgba(29,53,87,0.12)",
              background: "rgba(29,53,87,0.04)",
              padding: "12px",
              cursor: loading ? "wait" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--primary)",
            }}
          >
            {loading
              ? (ko ? "분석 중..." : "Analyzing...")
              : (ko ? "AI 경영 진단 받기" : "Get AI Diagnosis")}
          </button>
        )}
      </div>
    </div>
  );
}
