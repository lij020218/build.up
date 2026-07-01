"use client";

import { styles } from "../../styles";
import type { DashboardSurface } from "../../types";

type RoadmapCompleteViewProps = {
  language: "ko" | "en";
  pathTotalStages: number;
  handleLaunchBusiness: () => void;
  navigateToSurface: (surface: DashboardSurface) => void;
};

export function RoadmapCompleteView({
  language,
  pathTotalStages,
  handleLaunchBusiness,
  navigateToSurface,
}: RoadmapCompleteViewProps) {
  const ko = language === "ko";

  return (
    <section style={styles.section}>
      <div style={styles.sectionTitle}>{ko ? "로드맵 완료" : "Roadmap Complete"}</div>
      <article style={{
        background: "rgba(255,255,255,0.92)",
        borderRadius: "20px",
        border: "1px solid rgba(0,0,0,0.08)",
        padding: "40px 32px",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        textAlign: "center" as const,
        gap: "0",
      }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "rgba(29,53,87,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "24px",
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#1d3557"/>
            <path d="M10 18L15.5 24L26 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ fontSize: "26px", fontWeight: 720, letterSpacing: "0", color: "var(--primary)", marginBottom: "10px" }}>
          {ko ? `${pathTotalStages}단계 모두 완료했습니다` : `All ${pathTotalStages} stages complete`}
        </div>
        <div style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.65, maxWidth: "420px", marginBottom: "32px" }}>
          {ko
            ? "창업 준비의 모든 단계를 마쳤습니다. 이제 내 가게를 본격적으로 운영하거나, 로드맵을 다시 살펴볼 수 있습니다."
            : "You've completed every step of your startup journey. Head to your store dashboard or review your roadmap."}
        </div>

        <div style={{ width: "100%", maxWidth: "320px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
              {ko ? "진행률" : "Progress"}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1d3557" }}>100%</span>
          </div>
          <div style={{ height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "100%", background: "#1d3557", borderRadius: "999px" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, justifyContent: "center" }}>
          <button
            type="button"
            // Keep this on handleLaunchBusiness: an older inline launch missed Supabase
            // persistence and businessLaunched reverted after refresh.
            onClick={handleLaunchBusiness}
            style={{
              padding: "13px 28px", borderRadius: "999px",
              background: "#191970", color: "#fff",
              border: "none", fontSize: "15px", fontWeight: 700,
              cursor: "pointer", letterSpacing: "0",
              boxShadow: "0 4px 14px rgba(25,25,112,0.25)",
            }}
          >
            {ko ? "운영 대시보드로 이동" : "Go to Operational Dashboard"}
          </button>
          <button
            type="button"
            onClick={() => navigateToSurface("roadmap")}
            style={{
              padding: "13px 24px", borderRadius: "999px",
              background: "transparent", color: "var(--primary)",
              border: "1px solid rgba(0,0,0,0.14)", fontSize: "15px", fontWeight: 600,
              cursor: "pointer", letterSpacing: "0",
            }}
          >
            {ko ? "로드맵 다시 보기" : "Review Roadmap"}
          </button>
        </div>

        <div style={{ marginTop: "28px", display: "flex", gap: "20px" }}>
          {[
            { label: ko ? "완료 단계" : "Stages done", value: `${pathTotalStages}` },
            { label: ko ? "소요 기간" : "Journey", value: ko ? "창업 준비 완료" : "Ready to launch" },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" as const }}>
              <div style={{ fontSize: "18px", fontWeight: 720, color: "#1d3557", letterSpacing: "0" }}>{item.value}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", fontWeight: 500 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
