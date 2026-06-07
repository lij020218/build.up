"use client";

/**
 * FranchiseApplicationStage.tsx — 프랜차이즈 가맹 절차 단계
 *
 * stageId: "franchise-application"
 *
 * 사장님 신고 (2026-05-17): "다른 단계랑 흐름이 달라. 그냥 버튼 누르면 되는거?
 *   뭘 해야 할지 모르겠음."
 *
 * 재구성 — 다른 stage 와 동일한 3-page 구조:
 *   pg 0 (Why)    — 왜 정보공개서·14일 숙려가 중요한가 + 한국 가맹 분쟁 데이터
 *   pg 1 (Process) — 6개 task (fc-inquiry → fc-training) 명시적 체크박스
 *                    handleTaskToggle 로 generic checklist 와 동기화
 *   pg 2 (Verify) — 정보공개서 핵심 확인 항목 + 외부 링크 (공정위·KFA·표준계약서)
 *
 * brand 선택된 경우: 최상단에 brand header card 유지.
 */

import {
  contractCheckpoints,
  formatFranchiseCost,
  getFranchiseBrandById,
} from "@foundone/shared";
import { AlertTriangle, FileText, Clock, MapPin } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  MIDNIGHT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "../startup/StartupStageShell";
import { StageWrapup } from "../shared/StageWrapup";

const STAGE_ID = "franchise-application";

const FRANCHISE_WRAPUP = {
  done: [
    { label: "1. 정보공개서 검토", detail: "공정위 franchise.ftc.go.kr — 가맹점 수·폐점률·평균 매출·가맹비 4항목 직접 확인" },
    { label: "2. 본사 미팅·교육", detail: "본사 담당자 직접 면담 + 가맹점 운영 교육 4~12주 일정 확인" },
    { label: "3. 입지·계약 진행", detail: "본사 추천 입지 vs 자율 입지 비교 + 가맹계약서·인테리어 견적 검토" },
    { label: "4. 가맹비·로열티 확정", detail: "가맹금·교육비·인테리어 강제·로열티 5년 총비용 시뮬" },
  ],
  verify: [
    "정보공개서 — 최근 3년 폐점률 30% 이상 브랜드 회피, 가맹점주 평균 운영기간 5년 미만 위험",
    "가맹계약 14일 숙려기간 — 가맹사업법 의무, 본사가 압박 시 위반 (공정위 신고 가능)",
    "인테리어 강제 — 본사 지정 업체만 가능 시 시장가 대비 30~50% 부풀림 흔함, 견적 비교 필수",
    "필수 구매 비율 — 70% 이상이면 식자재 단가 협상력 X, 마진 압박 위험",
    "영업지역 보호 — 반경 OO미터 내 추가 가맹점 금지 조항 명문화 (없으면 잠식 리스크)",
    "본사 광고비 — 분담률·집행 내역 공개 의무, 불투명하면 가맹사업법 위반 신고 가능",
  ],
  next: "정보공개서·계약서 검토 완료 → 인테리어 시공·운영 준비 단계로 진입",
};

// 6 task 메타 — taskId 는 starter-data.ts 의 franchise-application task 와 1:1 일치.
const PROCESS_STEPS_KO: ReadonlyArray<{
  taskId: string;
  title: string;
  time: string;
  detail: string;
  link?: { url: string; label: string };
}> = [
  {
    taskId: "fc-inquiry",
    title: "본사 가맹 상담 신청",
    time: "1~2주",
    detail: "본사 홈페이지·전화로 상담 예약. 사업 경험·자본금·희망 지역을 전달하고 가맹부 담당자 미팅.",
  },
  {
    taskId: "fc-disclosure",
    title: "정보공개서 수령·검토 (14일 숙려기간)",
    time: "14일",
    detail: "가맹사업법 의무 제공 자료. 가맹점 수·폐점률·평균 영업이익·최근 3년 분쟁 이력 4항목을 직접 확인.",
    link: { url: "https://franchise.ftc.go.kr", label: "공정위 정보공개서 조회" },
  },
  {
    taskId: "fc-visit",
    title: "기존 가맹점 3곳 이상 방문",
    time: "1주",
    detail: "정보공개서 목록의 가맹점 직접 방문 — 실제 일매출·본사 지원 만족도·물류 문제를 점주에게 질문.",
  },
  {
    taskId: "fc-legal",
    title: "가맹계약 법률 검토",
    time: "2~3일",
    detail: "변호사·가맹거래사 자문 — 영업지역 보호·필수구매 비율·중도 해지 위약금 조항을 review.",
    link: { url: "https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=203&bbsId=BBSMSTR_000000002321", label: "표준가맹계약서 양식" },
  },
  {
    taskId: "fc-contract",
    title: "가맹계약 체결 및 가맹비 납부",
    time: "1일",
    detail: "가맹비·교육비·인테리어비·로열티 조건 최종 확인. 중도 해지 위약금이 총 투자비 50% 초과면 재협상.",
  },
  {
    taskId: "fc-training",
    title: "본사 교육 프로그램 이수",
    time: "2~4주",
    detail: "조리법·운영 매뉴얼·POS·위생 교육. 본사 매뉴얼이 부실하면 오픈 후 운영 사고 위험 ↑.",
  },
];

const PROCESS_STEPS_EN: ReadonlyArray<{
  taskId: string;
  title: string;
  time: string;
  detail: string;
  link?: { url: string; label: string };
}> = [
  { taskId: "fc-inquiry", title: "Request franchise consultation", time: "1-2 wk", detail: "Book HQ consultation. Share experience, capital, preferred area." },
  { taskId: "fc-disclosure", title: "Review disclosure document (14-day period)", time: "14 days", detail: "Legally required. Check store count, closure rate, avg profit, dispute history.", link: { url: "https://franchise.ftc.go.kr", label: "KFTC Disclosure Lookup" } },
  { taskId: "fc-visit", title: "Visit 3+ existing franchisees", time: "1 wk", detail: "Visit stores from disclosure list. Ask about real daily revenue, HQ support quality, logistics issues." },
  { taskId: "fc-legal", title: "Legal review of franchise contract", time: "2-3 days", detail: "Lawyer review. Verify territory protection, required purchase ratio, early termination penalties.", link: { url: "https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=203&bbsId=BBSMSTR_000000002321", label: "Standard Contract Form (FTC)" } },
  { taskId: "fc-contract", title: "Sign franchise agreement, pay fee", time: "1 day", detail: "Final check of fees, royalty, interior costs, termination penalties. Renegotiate if penalty > 50% of investment." },
  { taskId: "fc-training", title: "Complete HQ training program", time: "2-4 wk", detail: "Recipes, operations, POS, hygiene training. Weak HQ manuals = high post-opening risk." },
];

// Why 페이지 데이터 — 한국 가맹사업 통계 (공정위·KFA 자료 기반)
const WHY_FACTS_KO = [
  { tag: "가맹 분쟁 1위", body: "공정위 2024 가맹분야 분쟁조정 — '계약 해지 시 위약금·인테리어 강제' 32%" },
  { tag: "3년 폐업률", body: "가맹점 3년 폐업률 평균 30% — 정보공개서 미검토 사장님 폐업률 47% (KFA 2024)" },
  { tag: "정보공개서 효과", body: "14일 숙려기간 활용한 사장님 분쟁률 11% vs 미활용 26% — 공정위 모니터링 보고서" },
  { tag: "인테리어 강제", body: "본사 지정 인테리어 평균 시장가 대비 30~50% 부풀림 — 공정위 시정명령 사례 다수" },
];

const WHY_FACTS_EN = [
  { tag: "Top dispute", body: "KFTC 2024: 'Termination penalty + forced interior' = 32% of franchise disputes" },
  { tag: "3yr closure", body: "30% avg 3yr closure — 47% for franchisees who skipped disclosure review (KFA 2024)" },
  { tag: "Disclosure effect", body: "11% dispute rate with 14-day review vs 26% without — KFTC monitoring" },
  { tag: "Forced interior", body: "HQ-mandated interior runs 30-50% above market — multiple KFTC corrective orders" },
];

export function FranchiseApplicationStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const setGuideStepIndex = d.setGuideStepIndex;
  const totalPg = 3;
  const pgLabels = ko ? ["왜 중요한가", "가맹 절차", "정보공개서 검증"] : ["Why", "Process", "Verify"];

  const taskMap = d.taskMap;
  const handleTaskToggle = d.handleTaskToggle;
  const tasks = taskMap[STAGE_ID] ?? [];
  const isTaskDone = (taskId: string) =>
    tasks.find((t) => t.taskId === taskId)?.status === "completed";

  const processSteps = ko ? PROCESS_STEPS_KO : PROCESS_STEPS_EN;
  const whyFacts = ko ? WHY_FACTS_KO : WHY_FACTS_EN;

  const completedCount = processSteps.filter((s) => isTaskDone(s.taskId)).length;

  const brandHeader = (() => {
    const id = d.selectedFranchiseBrandId;
    if (!id) return null;
    const fb = getFranchiseBrandById(id);
    if (!fb) return null;
    return (
      <div
        style={{
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.78)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
          boxShadow: "0 8px 22px rgba(17,17,17,0.04)",
          padding: "22px 24px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "17px",
              fontWeight: 700,
            }}
          >
            {fb.name.ko.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {fb.name[d.language]}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              {ko ? "선택한 브랜드 — 가맹 절차를 단계별로 진행하세요" : "Selected brand — complete the steps below"}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--muted)",
            display: "flex",
            gap: "14px",
            flexWrap: "wrap" as const,
          }}
        >
          <span>{ko ? `창업비용 ${formatFranchiseCost(fb.startupCostWon)}원` : `Startup ${formatFranchiseCost(fb.startupCostWon)}`}</span>
          <span>{ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}원` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}</span>
          <span>{ko ? `로열티 ${fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "만/월" : "없음"}` : `Royalty ${fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "K/mo" : "None"}`}</span>
        </div>
        {fb.franchiseUrl && (
          <a
            href={fb.franchiseUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "999px",
              background: "var(--primary)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              width: "fit-content",
            }}
          >
            {ko ? `${fb.name.ko} 가맹 상담 페이지 →` : `${fb.name.en} Inquiry →`}
          </a>
        )}
      </div>
    );
  })();

  return (
    <div style={{ display: "grid", gap: "14px", marginBottom: "20px" }}>
      {brandHeader}

      {/* KEY ACTION hero — 다른 stage 와 동일한 미드나잇 강조 카드 */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko
          ? "정보공개서·14일 숙려·가맹점 방문 — 이 3개가 가맹 성공의 90%"
          : "Disclosure + 14-day review + franchisee visits = 90% of franchise success"}
        subtitle={ko
          ? "본사가 보여주는 매출 자료보다 정보공개서 + 실제 가맹점주 증언이 진짜 신호입니다. 가맹사업법이 14일 숙려기간을 의무화한 이유."
          : "HQ revenue pitches lie; disclosure documents + existing franchisees tell the truth. KFTC mandates the 14-day cool-off period for exactly this reason."}
        miniCards={[
          { icon: FileText, label: ko ? "검증" : "VERIFY", detail: ko ? "정보공개서 4항목 직접 확인" : "Check disclosure 4 items" },
          { icon: Clock, label: ko ? "시간" : "TIME", detail: ko ? "14일 숙려기간 의무 활용" : "Use 14-day cool-off" },
          { icon: MapPin, label: ko ? "현장" : "VISIT", detail: ko ? "기존 가맹점 3곳 이상" : "Visit 3+ existing stores" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 다음: 절차 → 정보공개서 검증" : "↓ Next: Process → Verify"}
      </StartupReferenceLabel>

      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => setGuideStepIndex(p)}
        ko={ko}
      />

      {/* ───────────────────────────────── pg 0 — WHY ──────────────────────────────── */}
      {pg === 0 && (
        <>
          <div
            style={{
              borderRadius: "20px",
              border: `1px solid ${MIDNIGHT_BORDER}`,
              background: "white",
              padding: "20px 22px",
              boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <AlertTriangle size={14} strokeWidth={2.2} color={MIDNIGHT} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: MIDNIGHT,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {ko ? "왜 정보공개서·14일 숙려가 핵심인가" : "Why disclosure + 14-day review matters"}
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
              {ko
                ? "가맹은 시스템 구매입니다. 본사가 보여주는 매출 자료보다 *정보공개서 + 기존 가맹점주의 실제 증언* 이 진짜 신호입니다."
                : "Franchising = buying a system. Real signal is in the disclosure + existing franchisees' actual stories — not HQ's revenue pitch."}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
              {ko
                ? "공정위가 14일 숙려기간을 의무화한 이유 — 가맹비 입금 전 사장님이 정보공개서를 충분히 읽고 결정할 시간을 강제로 확보하기 위함. 본사가 압박해도 신고 가능."
                : "KFTC mandates the 14-day cool-off period specifically so you can review the disclosure BEFORE paying. HQ pressure is reportable."}
            </div>
          </div>

          <div
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              background: "rgba(15,23,42,0.02)",
              border: "1px solid rgba(15,23,42,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(0,0,0,0.3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              {ko ? "한국 가맹 데이터" : "Korea franchise data"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {whyFacts.map((f, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: `${MIDNIGHT}10`,
                      color: MIDNIGHT,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {f.tag}
                  </span>
                  <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.45, flex: 1 }}>
                    {f.body}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ───────────────────────────────── pg 1 — PROCESS ──────────────────────────── */}
      {pg === 1 && (
        <>
          <div
            style={{
              borderRadius: "20px",
              border: "1px solid rgba(25,25,112,0.08)",
              background: "white",
              padding: "20px 22px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  {ko ? "6단계 가맹 절차" : "6-Step Franchise Process"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginTop: "2px" }}>
                  {ko
                    ? "각 단계를 마칠 때마다 체크하세요. 6개 모두 체크되면 다음 단계로 진행할 수 있어요."
                    : "Check each step as you complete it. All 6 done = stage complete."}
                </div>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: MIDNIGHT,
                  padding: "5px 10px",
                  borderRadius: "999px",
                  background: `${MIDNIGHT}10`,
                  whiteSpace: "nowrap" as const,
                }}
              >
                {completedCount}/{processSteps.length}
              </div>
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              {processSteps.map((step, idx) => {
                const done = isTaskDone(step.taskId);
                return (
                  <button
                    key={step.taskId}
                    type="button"
                    onClick={() => handleTaskToggle(STAGE_ID, step.taskId)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "26px 1fr auto",
                      gap: "12px",
                      alignItems: "flex-start",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: done
                        ? `1.5px solid ${MIDNIGHT}40`
                        : `1px solid ${MIDNIGHT_BORDER}`,
                      background: done ? `${MIDNIGHT}06` : "white",
                      textAlign: "left" as const,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      width: "100%",
                    }}
                  >
                    {/* 체크박스 */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        border: done ? "none" : `1.5px solid ${MIDNIGHT}40`,
                        background: done ? MIDNIGHT : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "1px",
                        flexShrink: 0,
                      }}
                    >
                      {done && (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M3 7l3 3 5-6"
                            stroke="white"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    {/* 본문 */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: MIDNIGHT,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {ko ? `단계 ${idx + 1}` : `Step ${idx + 1}`}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "1px 6px",
                            borderRadius: "5px",
                            background: "rgba(25,25,112,0.06)",
                            color: MIDNIGHT,
                          }}
                        >
                          {step.time}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 640,
                          color: done ? "rgba(15,23,42,0.55)" : "#0f172a",
                          textDecoration: done ? "line-through" : "none",
                          lineHeight: 1.4,
                          marginBottom: "3px",
                        }}
                      >
                        {step.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                        {step.detail}
                      </div>
                      {step.link && (
                        <a
                          href={step.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            marginTop: "6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: MIDNIGHT,
                            textDecoration: "none",
                          }}
                        >
                          {step.link.label} ↗
                        </a>
                      )}
                    </div>

                    {/* placeholder right cell (grid 안정성) */}
                    <span style={{ width: "1px" }} />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ───────────────────────────────── pg 2 — VERIFY ──────────────────────────── */}
      {pg === 2 && (
        <>
          <div
            style={{
              borderRadius: "20px",
              border: `1px solid ${MIDNIGHT_BORDER}`,
              background: "white",
              padding: "20px 22px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              {ko ? "정보공개서·계약서 핵심 확인 포인트" : "Disclosure / Contract Verify Checklist"}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5, marginBottom: "14px" }}>
              {ko
                ? "빨간 점 = 반드시 / 주황 점 = 중요 / 회색 점 = 참고. 빨간 점 중 하나라도 미흡하면 계약 보류 권장."
                : "Red = must-check, orange = important, gray = reference. Pause signing if any red is unclear."}
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {contractCheckpoints.map((cp) => {
                const dotColor =
                  cp.riskLevel === "critical"
                    ? "#b64c4c"
                    : cp.riskLevel === "important"
                      ? "#191970"
                      : "var(--muted)";
                return (
                  <div
                    key={cp.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: `1px solid ${cp.riskLevel === "critical" ? "rgba(182,76,76,0.12)" : MIDNIGHT_BORDER}`,
                      background: cp.riskLevel === "critical" ? "rgba(182,76,76,0.03)" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: dotColor, flexShrink: 0 }} />
                      <span style={{ fontSize: "13.5px", fontWeight: 640 }}>{cp.title[d.language]}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5, paddingLeft: "16px" }}>
                      {cp.description[d.language]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(25,25,112,0.08)",
              background: "rgba(255,255,255,0.7)",
              padding: "16px 18px",
              display: "grid",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              {ko ? "유용한 외부 링크" : "Useful Links"}
            </div>
            {[
              { label: ko ? "공정거래위원회 정보공개서 조회" : "KFTC Disclosure Lookup", url: "https://franchise.ftc.go.kr" },
              { label: ko ? "가맹사업법 안내 (생활법령)" : "Franchise Act Guide", url: "https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=647" },
              { label: ko ? "분쟁조정 신청 (한국프랜차이즈산업협회)" : "Dispute Mediation (KFA)", url: "https://www.ikfa.or.kr/" },
              { label: ko ? "표준가맹계약서 양식 (공정위)" : "Standard Contract Form (FTC)", url: "https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=203&bbsId=BBSMSTR_000000002321" },
            ].map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(25,25,112,0.03)",
                  border: `1px solid ${MIDNIGHT_BORDER}`,
                  textDecoration: "none",
                  color: "inherit",
                  fontSize: "12.5px",
                }}
              >
                <span style={{ fontWeight: 500 }}>{link.label}</span>
                <span style={{ color: MIDNIGHT, fontWeight: 600 }}>↗</span>
              </a>
            ))}
          </div>
        </>
      )}

      <StageWrapup
        ko={ko}
        nextStageLabelKo="인테리어 시공"
        doneItemsKo={FRANCHISE_WRAPUP.done}
        verifyItemsKo={FRANCHISE_WRAPUP.verify}
        nextSummaryKo={FRANCHISE_WRAPUP.next}
      />
    </div>
  );
}
