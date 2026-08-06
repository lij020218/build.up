"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { localizeStage, getUiCopy, formatStageStatus } from "@foundone/shared";
import { styles } from "../../styles";
import { useRouter } from "next/navigation";

const SURFACE_HREFS = { current: "/current" } as const;

export function RoadmapSurface() {
  const d = useDashboardCtx();
  const router = useRouter();
  const {
    language, roadmap, currentStage, industryCategoryId,
    completedCount, pathTotalStages, correctedProgressPercent,
    pathStageList, // ⚠️ 실제 navigation 순서(traverseUserPath). 배열 순서 X — 번호 점프 방지.
  } = d;
  const copy = getUiCopy(language);

  // ⚠️ 리스트 순서·단계 번호는 *실제 navigation 경로 순서*(pathStageList)를 따른다.
  //   이전엔 roadmap.stages *배열 순서*로 필터해서, nextStageIds 재정렬(예: 계약검토→사업자등록)과
  //   어긋나 "다음 단계로"가 가는 단계와 리스트가 보여주는 다음 단계가 달랐고 번호가 튀었다.
  //   status(completed/locked/current)는 roadmap.stages 의 계산값을 사용.
  const stageById = new Map(roadmap.stages.map((s) => [s.stageId, s]));
  const visibleStages = pathStageList
    .map((s) => stageById.get(s.stageId))
    .filter((s): s is (typeof roadmap.stages)[number] => Boolean(s));

  const ko = language === "ko";

  // 목표 오픈 D-day — budget-setup 결정의 targetOpenDate (AI 위저드가 채움, 웹·iOS stage_decisions 동기).
  //   과거 날짜(이미 지났거나 오픈함)는 카운트다운이 무의미 → 미표시. 파싱은 로컬(UTC 함정 회피).
  const openDday = (() => {
    const raw = (d.decisions["budget-setup"]?.inputs as Record<string, unknown> | undefined)?.targetOpenDate;
    if (typeof raw !== "string") return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (!m) return null;
    const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (Number.isNaN(diff) || diff < 0 || diff > 730) return null;
    return { diff, label: `${Number(m[2])}월 ${Number(m[3])}일` };
  })();

  /** 단계 태그. **색은 단계마다 다르게 주지 않는다** — 종전에는 보라·파랑·분홍·청록이
   *  뒤섞여(#7c3aed·#2563eb·#db2777·#0d9488) 브랜드 토큰(미드나잇 네이비) 밖의 무지개가 됐다.
   *  (2026-08-06 정리 — iOS stageTagMap 과 동시에) */
  const TAG_COLOR = "#1d3557";
  const tagMap: Record<string, Array<{ label: string }>> = {
    "budget_setup": [{ label: ko ? "재무 시뮬레이션" : "Finance Sim" }],
    "franchise_application": [{ label: ko ? "가맹 절차" : "Franchise" }],
    "location_candidates": [{ label: ko ? "상권 분석" : "Market Analysis" }],
    "contract_review": [{ label: ko ? "AI 계약 분석" : "AI Contract" }],
    "construction_setup": [{ label: ko ? "인테리어 · 집기" : "Interior · FF&E" }],
    "vendor_setup": [{ label: ko ? "공급업체" : "Suppliers" }],
    "operations_setup": [{ label: ko ? "배달 · SNS" : "Delivery · SNS" }],
    "pre_launch": [{ label: ko ? "소프트오픈" : "Soft Open" }],
    "tax_guide": [{ label: ko ? "절세 가이드" : "Tax Guide" }],
    "loan_guide": [{ label: ko ? "자금조달 · 지원사업" : "Funding · Programs" }],
    "venture_certification": [{ label: ko ? "벤처인증 · 지원사업" : "Venture Cert" }],
    "launch_gtm": [{ label: ko ? "GTM 전략" : "GTM Strategy" }],
  };

  return (
    <section style={styles.section}>
      {/* Roadmap header with progress */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 650, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "6px" }}>
              {ko ? "창업 로드맵" : "Startup Roadmap"}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a", lineHeight: 1.1 }}>
              {copy.home.starterFlow}
            </div>
            {/* AI 인수인계 안내 — 위저드가 채운 상태로 도착한 사용자에게 "왜 앞이 ✓인지" 설명.
                aiGenerated 플래그는 budget-setup 프리필에만 있고, 사용자가 예산 단계를
                직접 완료하는 순간부터는 이 안내가 필요 없다 (완료 시 조건 소멸). */}
            {Boolean((d.decisions["budget-setup"]?.inputs as Record<string, unknown> | undefined)?.aiGenerated)
              && !d.decisions["budget-setup"]?.completedAt && (
              <div style={{ marginTop: 8, fontSize: 12.5, color: "rgba(15,23,42,0.6)", fontWeight: 500, lineHeight: 1.5 }}>
                {ko
                  ? "AI가 기획 단계를 채워뒀어요 — 다음 단계부터 확인만 하며 이어가면 됩니다."
                  : "The AI pre-filled the planning stages — continue by reviewing the next one."}
              </div>
            )}
            {openDday && (
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 999, background: "rgba(25,25,112,0.07)", border: "1px solid rgba(25,25,112,0.14)", fontSize: 12, fontWeight: 700, color: "#191970" }}>
                {ko
                  ? (openDday.diff === 0 ? `오늘이 목표 오픈일 (${openDday.label})` : `목표 오픈 D-${openDday.diff} · ${openDday.label}`)
                  : `Open target D-${openDday.diff}`}
              </div>
            )}
          </div>
          {/* 진행 0일 때 거대한 "0%" 가 화면을 지배하며 실패처럼 읽혔다 →
              숫자 무게를 낮추고 시작 전에는 회색으로 물러나게 한다 (2026-08-06, iOS 와 동시). */}
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontSize: "30px", fontWeight: 600, letterSpacing: "-0.04em", color: completedCount > 0 ? "#0f172a" : "rgba(15,23,42,0.42)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {correctedProgressPercent}<span style={{ fontSize: "14px", fontWeight: 500, color: "var(--muted)" }}>%</span>
            </div>
            <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)", marginTop: "2px" }}>
              {completedCount > 0
                ? `${completedCount} / ${pathTotalStages} ${ko ? "완료" : "done"}`
                : (ko ? `${pathTotalStages}단계 · 시작 전` : `${pathTotalStages} stages · not started`)}
            </div>
          </div>
        </div>
        {/* 연속 트랙 하나 — 종전에는 단계 수만큼(오프라인 21칸) 조각을 늘어놔
            진행 0일 때 회색 부스러기처럼 보였다 (2026-08-06 정리, iOS 와 동시). */}
        <div style={{ height: "4px", borderRadius: "999px", background: "rgba(29,53,87,0.08)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "999px", background: "#1d3557",
            width: `${pathTotalStages > 0 ? (completedCount / pathTotalStages) * 100 : 0}%`,
            transition: "width 0.4s ease",
          }} />
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
                    <span key={t.label} style={{ fontSize: "10px", fontWeight: 600, padding: "3px 10px", borderRadius: "8px", background: `${TAG_COLOR}0f`, color: TAG_COLOR, letterSpacing: "0.02em" }}>
                      {t.label}
                    </span>
                  ))}
                </div>
              )}
              {!isCompleted && (
                <div style={{ fontSize: isCurrent ? "14px" : "13px", lineHeight: 1.55, color: "var(--muted)", marginTop: "2px" }}>
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
                // 종전엔 카드 전체를 0.4 로 흐려 글자까지 뿌옇게 죽었다 →
                //   표면·글자색으로 위계를 만든다 (2026-08-06, iOS 와 동시).
                ...(isLocked ? styles.roadmapRowLocked : {}),
                userSelect: "none" as const,
              }}
            >
              {/* 2026-08-06: 현재 카드의 AuroraBackground(하늘색·보라·초록 블롭) 제거 —
                  카드 하나가 무지개로 보여 브랜드 토큰(미드나잇 네이비 + 라벤더)과 어긋났다.
                  iOS RoadmapView 의 배경 정리와 동시. */}
              {isCurrent ? <div style={{ padding: "20px 24px" }}>{cardContent}</div> : cardContent}
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
