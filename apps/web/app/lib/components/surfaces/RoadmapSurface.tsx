"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { localizeStage, getUiCopy, formatStageStatus } from "@foundone/shared";
import { styles } from "../../styles";
import { useRouter } from "next/navigation";
import { AuroraBackground } from "../../../../components/ui/aurora-background";

const SURFACE_HREFS = { current: "/current" } as const;

export function RoadmapSurface() {
  const d = useDashboardCtx();
  const router = useRouter();
  const {
    language, roadmap, currentStage, industryCategoryId,
    completedCount, pathTotalStages, correctedProgressPercent,
    pathStageIds, // ⚠️ useComputedDashboard의 path filter 사용 — 자체 Set은 go-live·cluster 누락
  } = d;
  const copy = getUiCopy(language);

  // pathStageIds는 useComputedDashboard에서 isPathStage로 정확히 계산된 사용자 path
  // (offline/online/startup × franchise × cluster B/C/D 모두 반영)
  const visibleStages = roadmap.stages.filter((s) => pathStageIds.has(s.stageId));

  const ko = language === "ko";

  const tagMap: Record<string, Array<{ label: string; color: string }>> = {
    "budget_setup": [{ label: ko ? "재무 시뮬레이션" : "Finance Sim", color: "#7c3aed" }],
    "franchise_application": [{ label: ko ? "가맹 절차" : "Franchise", color: "#0891b2" }],
    "location_candidates": [{ label: ko ? "상권 분석" : "Market Analysis", color: "#2563eb" }],
    "contract_review": [{ label: ko ? "AI 계약 분석" : "AI Contract", color: "#7c3aed" }],
    "construction_setup": [{ label: ko ? "인테리어 · 집기" : "Interior · FF&E", color: "#d97706" }],
    "vendor_setup": [{ label: ko ? "공급업체" : "Suppliers", color: "#059669" }],
    "operations_setup": [{ label: ko ? "배달 · SNS" : "Delivery · SNS", color: "#db2777" }],
    "pre_launch": [{ label: ko ? "소프트오픈" : "Soft Open", color: "#ea580c" }],
    "tax_guide": [{ label: ko ? "절세 가이드" : "Tax Guide", color: "#0d9488" }],
    "loan_guide": [{ label: ko ? "자금조달 · 지원사업" : "Funding · Programs", color: "#059669" }],
    "venture_certification": [{ label: ko ? "벤처인증 · 지원사업" : "Venture Cert", color: "#059669" }],
    "launch_gtm": [{ label: ko ? "GTM 전략" : "GTM Strategy", color: "#db2777" }],
  };

  return (
    <section style={styles.section}>
      {/* Roadmap header with progress */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 650, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "rgba(15,23,42,0.4)", marginBottom: "6px" }}>
              {ko ? "창업 로드맵" : "Startup Roadmap"}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a", lineHeight: 1.1 }}>
              {copy.home.starterFlow}
            </div>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontSize: "36px", fontWeight: 780, letterSpacing: "-0.05em", color: "#0f172a", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {correctedProgressPercent}<span style={{ fontSize: "16px", fontWeight: 500, color: "rgba(15,23,42,0.35)" }}>%</span>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>
              {completedCount} / {pathTotalStages} {ko ? "완료" : "done"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "3px" }}>
          {Array.from({ length: pathTotalStages }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: "4px", borderRadius: "2px",
              background: i < completedCount ? "#1d3557" : i === completedCount ? "rgba(29,53,87,0.3)" : "rgba(0,0,0,0.05)",
              transition: "background 0.4s ease",
            }} />
          ))}
        </div>
      </div>

      <div style={styles.roadmapList} className="roadmap-timeline">
        {visibleStages.map((stage, index) => {
          const isCurrent = stage.stageId === currentStage.stageId;
          const isCompleted = stage.status === "completed";
          const isLocked = stage.status === "locked";
          const isClickable = !isLocked;
          const handleCardClick = () => { router.push(`${SURFACE_HREFS.current}?editStage=${stage.stageId}`); };
          const nodeClass = isCurrent ? "roadmap-node roadmap-node-current" : isCompleted ? "roadmap-node roadmap-node-completed" : "roadmap-node roadmap-node-locked";
          const cardClass = `roadmap-card${isCurrent ? " roadmap-card-current" : ""}${isLocked ? " roadmap-card-locked" : ""}`;
          const tags = tagMap[stage.code as string];

          const cardContent = (
            <>
              <div className={nodeClass} />
              <div style={styles.roadmapRowTop}>
                <div style={styles.roadmapIndex}>
                  {ko ? `${index + 1}단계` : `Step ${index + 1}`}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {isCompleted && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#1d3557" />
                      <path d="M4.5 7l1.8 1.8 3.2-3.6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isCurrent && (
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(29,53,87,0.08)", color: "var(--primary)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                      {ko ? "현재" : "Current"}
                    </span>
                  )}
                  {isLocked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="2" y="5" width="8" height="6" rx="1.5" fill="rgba(0,0,0,0.12)" />
                      <path d="M4 5V3.5a2 2 0 114 0V5" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  )}
                  {isClickable && !isCurrent && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <div style={{ ...styles.roadmapTitle, ...(isCompleted && !isCurrent ? styles.roadmapTitleQuiet : {}), ...(isCurrent ? { fontSize: "20px", fontWeight: 700 } : {}) }}>
                {localizeStage(stage, language, industryCategoryId).title}
              </div>
              {!isCompleted && tags && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const }}>
                  {tags.map(t => (
                    <span key={t.label} style={{ fontSize: "10px", fontWeight: 600, padding: "3px 10px", borderRadius: "8px", background: `${t.color}0a`, color: t.color, letterSpacing: "0.02em" }}>
                      {t.label}
                    </span>
                  ))}
                </div>
              )}
              {!isCompleted && (
                <div style={{ fontSize: isCurrent ? "14px" : "13px", lineHeight: 1.55, color: "rgba(15,23,42,0.5)", marginTop: "2px" }}>
                  {localizeStage(stage, language, industryCategoryId).goal}
                </div>
              )}
            </>
          );

          return (
            <article
              key={stage.code}
              onClick={isClickable ? handleCardClick : undefined}
              className={cardClass}
              style={{
                ...styles.roadmapRow,
                ...(isCurrent ? { ...styles.roadmapRowCurrent, padding: 0, overflow: "hidden" as const } : {}),
                ...(isCompleted ? styles.roadmapRowCompleted : {}),
                cursor: isClickable ? "pointer" : "default",
                opacity: isLocked ? 0.4 : 1,
                userSelect: "none" as const,
              }}
            >
              {isCurrent ? (
                <AuroraBackground
                  className="rounded-[inherit]"
                  style={{ minHeight: "auto", padding: "20px 24px" }}
                  showRadialGradient
                >
                  {cardContent}
                </AuroraBackground>
              ) : (
                cardContent
              )}
            </article>
          );
        })}
      </div>

      <style>{`
        .roadmap-timeline { position: relative; }
        .roadmap-timeline::before { content: ''; position: absolute; left: 10px; top: 20px; bottom: 20px; width: 2px; background: linear-gradient(180deg, var(--primary) 0%, rgba(29,53,87,0.08) 100%); border-radius: 1px; }
        .roadmap-node { position: absolute; left: -24px; top: 20px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--primary); background: #fff; z-index: 1; transition: all 0.3s ease; }
        .roadmap-node-current { background: var(--primary); box-shadow: 0 0 0 4px rgba(29,53,87,0.1); animation: roadmapPulse 2s ease-in-out infinite; }
        .roadmap-node-completed { background: var(--primary); border-color: var(--primary); width: 10px; height: 10px; top: 21px; left: -23px; }
        .roadmap-node-locked { border-color: rgba(0,0,0,0.12); background: rgba(0,0,0,0.03); }
        @keyframes roadmapPulse { 0%, 100% { box-shadow: 0 0 0 4px rgba(29,53,87,0.1); } 50% { box-shadow: 0 0 0 8px rgba(29,53,87,0.05); } }
        .roadmap-card { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease !important; }
        .roadmap-card:hover:not(.roadmap-card-locked) { transform: translateY(-2px) !important; box-shadow: 0 12px 36px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.9) inset !important; }
        .roadmap-card-current { animation: bentoFadeIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>
    </section>
  );
}
