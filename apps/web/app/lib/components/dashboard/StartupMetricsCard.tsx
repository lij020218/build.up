"use client";

import React from "react";

export function StartupMetricsCard({
  ko,
  recent7Customers,
  activeDays7,
  weeklySalesChange,
  monthlyBurn,
  runwayMonths,
  employeesCount,
  roadmapProgress,
  fmt,
}: {
  ko: boolean;
  recent7Customers: number;
  activeDays7: number;
  weeklySalesChange: number;
  monthlyBurn: number;
  runwayMonths: number;
  employeesCount: number;
  roadmapProgress: number;
  fmt: (n: number) => string;
}) {
  return (
    <section style={opsCard} className="bento-card">
      <div style={opsHeader}>
        <div>
          <div style={sectionEyebrow}>{ko ? "검증 가능한 운영 지표" : "Verified operating metrics"}</div>
          <div style={opsTitle}>{ko ? "활성·burn·실행 상태" : "Activity, burn, and execution"}</div>
        </div>
        <div style={opsPill}>{ko ? "실측 기준" : "Measured only"}</div>
      </div>

      <div style={startupMetricGrid}>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "최근 7일 활성 사용자/고객" : "7-day active users/customers"}</div>
          <div style={startupMetricValue}>{recent7Customers > 0 ? recent7Customers.toLocaleString() : "—"}</div>
          <div style={startupMetricNote}>{ko ? `${activeDays7}/7일 활동 기록` : `${activeDays7}/7 active days logged`}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "주간 성장률" : "Weekly growth"}</div>
          <div style={{ ...startupMetricValue, color: weeklySalesChange >= 0 ? "#177245" : "#b42318" }}>
            {weeklySalesChange >= 0 ? "+" : ""}{weeklySalesChange}%
          </div>
          <div style={startupMetricNote}>{ko ? "직전 7일 대비" : "vs previous 7 days"}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "월 burn" : "Monthly burn"}</div>
          <div style={{ ...startupMetricValue, color: monthlyBurn > 0 ? "#b54708" : "#177245" }}>
            {monthlyBurn > 0 ? fmt(monthlyBurn) : ko ? "흑자" : "Positive"}
          </div>
          <div style={startupMetricNote}>{ko ? "비용 - 매출 기준" : "Costs minus revenue"}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "런웨이" : "Runway"}</div>
          <div style={startupMetricValue}>
            {runwayMonths < 0 ? (ko ? "흑자" : "Positive") : `${runwayMonths}${ko ? "개월" : " mo"}`}
          </div>
          <div style={startupMetricNote}>{ko ? "Sequoia / YC식 생존 지표" : "Core survival metric"}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "팀" : "Team"}</div>
          <div style={startupMetricValue}>{employeesCount}{ko ? "명" : ""}</div>
          <div style={startupMetricNote}>{ko ? "등록된 인력 기준" : "Based on registered staff"}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "로드맵 실행률" : "Execution progress"}</div>
          <div style={startupMetricValue}>{roadmapProgress}%</div>
          <div style={startupMetricNote}>{ko ? "현재 경로 완료 비율" : "Completion on current path"}</div>
        </div>
      </div>

      <div style={verifiedNote}>
        {ko
          ? "리텐션, 파이프라인, burn multiple은 현재 데이터만으로는 검증 불가해서 일부러 제외했습니다. 코호트 이벤트, ARR, CRM 데이터가 연결되면 그때 실제 방식으로 추가하는 게 맞습니다."
          : "Retention, pipeline, and burn multiple are intentionally omitted until cohort events, ARR, and CRM data are available."}
      </div>
    </section>
  );
}

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
  fontWeight: 700,
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

const startupMetricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
};

const startupMetricBlock: React.CSSProperties = {
  borderRadius: "10px",
  padding: "14px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.55) 0%, rgba(248,250,255,0.35) 100%)",
  border: "1px solid rgba(5,97,252,0.04)",
  display: "grid",
  gap: "6px",
};

const startupMetricLabel: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: 1.45,
  color: "rgba(15, 23, 42, 0.50)",
};

const startupMetricValue: React.CSSProperties = {
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 760,
  letterSpacing: "-0.05em",
  color: "#0f172a",
};

const startupMetricNote: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: 1.5,
  color: "rgba(15, 23, 42, 0.48)",
};

const verifiedNote: React.CSSProperties = {
  borderRadius: "10px",
  padding: "12px 14px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.5) 0%, rgba(248,250,255,0.3) 100%)",
  border: "1px solid rgba(5, 97, 252, 0.06)",
  fontSize: "12px",
  lineHeight: 1.6,
  color: "rgba(15, 23, 42, 0.66)",
};
