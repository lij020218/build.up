"use client";

/**
 * BusinessHealthScoreCard — 사장님 사업 건강 점수 한눈 카드.
 *
 *  ── 2026-05-11 이동 ─────────────────────────────────────
 *  사용자 지침: "경영 건강 점수 — 현재는 내 정보 페이지에 있는데 운영 대시보드나
 *               내 가게 페이지에 있는 것이 좋을 것 같아."
 *  → ProfileView 에 인라인으로 박혀있던 블록을 재사용 가능 카드로 추출 + Tier0
 *     (헤더 직하) 에 배치.
 *
 *  분기:
 *   · 항상 노출 (단, businessLaunched === true 인 경우만 — 미런칭은 점수 의미 X)
 *   · businessHealthScore: "healthy" / "caution" / "danger" / "unknown" — useDashboardComputed SSOT
 *
 *  디자인: SVG 원형 게이지 + 큰 점수 + grade 라벨 + 진단 한 줄.
 */

const SIZE_RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * SIZE_RADIUS;

export function BusinessHealthScoreCard({
  ko,
  businessHealthScore,
}: {
  ko: boolean;
  businessHealthScore: "healthy" | "caution" | "danger" | "unknown";
}) {
  // 점수 매핑 — healthy 85 / caution 55 / danger 30 / unknown 0
  const score =
    businessHealthScore === "healthy" ? 85
    : businessHealthScore === "caution" ? 55
    : businessHealthScore === "danger" ? 30
    : 0;
  const grade =
    businessHealthScore === "healthy" ? (ko ? "건강" : "Healthy")
    : businessHealthScore === "caution" ? (ko ? "주의" : "Caution")
    : businessHealthScore === "danger" ? (ko ? "위험" : "Danger")
    : "—";
  const gradeColor =
    businessHealthScore === "healthy" ? "#059669"
    : businessHealthScore === "caution" ? "#d97706"
    : businessHealthScore === "danger" ? "#dc2626"
    : "rgba(15,23,42,0.4)";

  const strokeDash = (score / 100) * CIRCUMFERENCE;
  const advice =
    score >= 80
      ? (ko ? "안정적인 경영 구조입니다. 이 상태를 유지하세요." : "Stable business structure. Maintain this level.")
      : score >= 50
        ? (ko ? "몇 가지 개선이 필요합니다. AI 액션을 확인하세요." : "Some improvements needed. Check AI actions.")
        : score > 0
          ? (ko ? "긴급한 조치가 필요합니다. 비용 구조를 점검하세요." : "Urgent action needed. Review your cost structure.")
          : (ko ? "데이터가 더 필요합니다. 매출·비용을 입력하세요." : "More data needed. Enter sales and costs.");

  return (
    <div style={card}>
      {/* SVG 원형 게이지 */}
      <div style={{ position: "relative" as const, width: "100px", height: "100px", flexShrink: 0 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={SIZE_RADIUS} fill="none" stroke="rgba(15,23,42,0.05)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={SIZE_RADIUS}
            fill="none"
            stroke={gradeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div style={{
          position: "absolute" as const, inset: 0,
          display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
        }}>
          <span className="bento-number" style={{
            fontSize: "28px", fontWeight: 780, letterSpacing: "-0.04em",
            color: gradeColor, lineHeight: 1,
          }}>
            {businessHealthScore === "unknown" ? "–" : score}
          </span>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.35)", marginTop: "2px" }}>
            /100
          </span>
        </div>
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "11px", fontWeight: 650, letterSpacing: "0.08em",
          textTransform: "uppercase" as const, color: "rgba(15,23,42,0.4)",
          marginBottom: "4px",
        }}>
          {ko ? "경영 건강 점수" : "Business Health Score"}
        </div>
        <div style={{
          fontSize: "22px", fontWeight: 740, letterSpacing: "-0.03em",
          color: gradeColor, marginBottom: "4px",
        }}>
          {grade}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>
          {advice}
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  padding: "24px",
  borderRadius: "24px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
  border: "1px solid rgba(15,23,42,0.05)",
  boxShadow: "0 2px 12px rgba(15,23,42,0.03)",
  display: "flex",
  alignItems: "center",
  gap: "24px",
};
