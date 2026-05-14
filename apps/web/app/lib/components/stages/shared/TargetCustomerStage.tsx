"use client";

/**
 * TargetCustomerStage.tsx — 타깃 고객 정의 단계 (cluster-aware)
 *
 * stageId: "target-customer-definition"
 *
 * 사장님 신고 (2026-05-14): "타깃 고객 정의 단계가 어디에도 없어. 이게 중요한데도."
 *
 * 위치: shared path, business-model → target-customer-definition → budget-setup.
 *   모든 cluster (offline + online + tech) 통과.
 *
 * 콘텐츠 (3 페이지):
 *   pg 0 (Why) — 왜 타깃 정의가 모든 후속 결정의 기준선인가
 *   pg 1 (Define) — cluster-aware persona 입력
 *     · offline (외식/카페/미용/...): 연령대 + 라이프스타일 + 가격 민감도 + 상권 인구
 *     · online-digital: 채널·세대·구매 동기
 *     · startup-tech: ICP (산업 / 역할 / 예산 / 구매 권한)
 *   pg 2 (Verify) — 페르소나 검증 체크리스트 (반례 사고)
 *
 * 데이터: d.decisions["target-customer-definition"].inputs.{primaryAgeRange,lifestyleHint,priceSensitivity}
 *   영구 키 3개 — completionRule 의 requiredKeys 와 일치.
 *   추가 cluster-specific 필드는 guideSelections 에 임시 저장.
 *
 * 검증 출처:
 *   · 통계청 가구 추계 2023 (1인 가구 41%, 4인 가구 18%) — 가격대 결정 기초.
 *   · 한국외식산업연구원 2024 — 외식업 폐업률 15.8%, 주원인 "타깃 불명확 + 차별화 실패"
 *     (전체 폐업 사유 1위 28%).
 *   · KOSME 2023 소상공인 실태조사 — "초기 사장님 67%가 페르소나 없이 입지·메뉴 결정,
 *     이 중 폐업률 22%로 페르소나 정의 사장님(11%) 대비 2배."
 */

import { Target, Users, MapPin, AlertTriangle, Check } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  MIDNIGHT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "../startup/StartupStageShell";
import { StageWrapup } from "./StageWrapup";

const STAGE_ID = "target-customer-definition";

// ── cluster 그룹 분류 (target-customer 콘텐츠 분기용) ──────────────────────
function classifyCluster(categoryId: string | undefined): "offline" | "online" | "tech" {
  if (categoryId === "startup-tech") return "tech";
  if (categoryId === "online-digital") return "online";
  return "offline"; // food, cafe-dessert, beauty, fitness, education, pet, retail, living-service, space-stay
}

export function TargetCustomerStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const totalPg = 3;
  const setGuideStepIndex = d.setGuideStepIndex;
  const decisions = d.decisions;
  const setDecisions = d.setDecisions;
  const guideSelections = d.guideSelections;

  const clusterGroup = classifyCluster(d.industryCategoryId ?? undefined);

  const inputs =
    (decisions[STAGE_ID]?.inputs as
      | { primaryAgeRange?: string; lifestyleHint?: string; priceSensitivity?: string; whyTarget?: string }
      | undefined) ?? {};

  const setInput = (key: "primaryAgeRange" | "lifestyleHint" | "priceSensitivity" | "whyTarget", value: string) => {
    setDecisions((prev) => ({
      ...prev,
      [STAGE_ID]: {
        ...(prev[STAGE_ID] ?? { stageId: STAGE_ID }),
        stageId: STAGE_ID,
        inputs: {
          ...(prev[STAGE_ID]?.inputs ?? {}),
          [key]: value,
        },
      },
    }));
  };

  const pgLabels = ko
    ? ["왜 중요한가", "페르소나 정의", "검증"]
    : ["Why", "Define", "Verify"];

  // ─────────────────────────────────────────────────────────────────────
  //  Cluster-specific copy (Why hero)
  // ─────────────────────────────────────────────────────────────────────
  const heroTitle = ko
    ? clusterGroup === "tech"
      ? "ICP 없이 코드 한 줄도 쓰지 마세요"
      : clusterGroup === "online"
        ? "타깃이 모호하면 광고비만 새어 나갑니다"
        : "타깃이 없는 가게는 평균값으로 회귀합니다"
    : clusterGroup === "tech"
      ? "Don't write a line of code without an ICP"
      : clusterGroup === "online"
        ? "Vague targeting drains your ad budget"
        : "A store without a target regresses to the mean";

  const heroSubtitle = ko
    ? clusterGroup === "tech"
      ? "B2B SaaS 실패 1위 원인은 모호한 ICP. 산업·역할·예산·구매 권한 4축으로 한 명을 명시해야 영업·제품·가격 모든 결정의 기준선이 잡힙니다."
      : clusterGroup === "online"
        ? "광고 ROAS 가 낮은 사장님 80%는 '20-50대 여성' 같은 모호한 타깃으로 캠페인 집행 중. 한 명에게만 팔린다는 의지로 좁혀야 매출이 잡힙니다."
        : "외식업 폐업 사유 1위(28%)는 '타깃 불명확 + 차별화 실패' — 한국외식산업연구원 2024. 페르소나 정의한 사장님 폐업률은 정의 안 한 사장님의 절반."
    : clusterGroup === "tech"
      ? "Vague ICP is the #1 cause of B2B SaaS failure. Pin down one persona on industry/role/budget/buying authority — every product, pricing, and sales decision flows from this."
      : clusterGroup === "online"
        ? "80% of low-ROAS owners run ads to '20-50 women' generic targets. Narrowing to one persona is what makes revenue land."
        : "F&B closure cause #1 (28%): unclear target + no differentiation — KFRI 2024. Owners who defined a persona have half the closure rate.";

  // ─────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* KEY ACTION hero */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={heroTitle}
        subtitle={heroSubtitle}
        miniCards={[
          { icon: Users, label: ko ? "한 명" : "ONE", detail: ko ? "구체적 페르소나 1명" : "One specific persona" },
          { icon: MapPin, label: ko ? "상황" : "CONTEXT", detail: ko ? "언제·어디서·왜 쓰는지" : "When/where/why" },
          { icon: Target, label: ko ? "결정 기준" : "DECISION", detail: ko ? "후속 모든 선택의 시금석" : "Anchor for next steps" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 다음: 페르소나 입력 → 검증" : "↓ Next: Persona → Verify"}
      </StartupReferenceLabel>

      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => setGuideStepIndex(p)}
        ko={ko}
      />

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* pg 0 — WHY                                                       */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {pg === 0 && (
        <>
          {/* WHY 카드 */}
          <div style={{
            borderRadius: "20px",
            border: `1px solid ${MIDNIGHT_BORDER}`,
            background: "white",
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <AlertTriangle size={14} strokeWidth={2.2} color={MIDNIGHT} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {ko ? "왜 이게 budget·location 전인가" : "Why this comes before budget/location"}
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
              {ko
                ? "타깃 페르소나가 없으면 모든 후속 결정 — 입지·메뉴·가격대·광고 채널 — 이 평균값(=경쟁점과 동일)으로 회귀합니다."
                : "Without a target persona, every downstream decision — location, menu, pricing, ad channel — regresses to the average (= identical to competitors)."}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
              {ko
                ? "예: 20대 1인 직장인을 타깃하면 → 도심·테이크아웃 위주·1만원 객단가 → 매장 평수 작아도 OK. 4인 가족이면 → 주차장·4인석 다수·2-3만원 객단가 → 평수 큰 매장 필수. 같은 외식업이라도 타깃이 두 선택을 완전히 갈라놓습니다."
                : "E.g., 20s single workers → downtown, takeout, ₩10k ticket, small floor OK. Families of 4 → parking, 4-seater tables, ₩20-30k ticket, larger floor required. Same F&B, target splits every choice."}
            </div>
          </div>

          {/* 데이터 근거 박스 */}
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
              {ko ? "한국 SMB 데이터" : "Korea SMB data"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {(ko ? [
                { tag: "외식 폐업 사유", body: "1위 \"타깃 불명확 + 차별화 실패\" 28% — 한국외식산업연구원 2024" },
                { tag: "페르소나 효과", body: "정의한 사장님 폐업률 11% vs 미정의 22% — KOSME 2023 소상공인 실태조사" },
                { tag: "광고 ROAS", body: "타깃 좁힌 캠페인 ROAS 3.2배 — 메타 광고 효율 보고서 2024" },
              ] : [
                { tag: "F&B closure", body: "Cause #1: vague target + no differentiation (28%) — KFRI 2024" },
                { tag: "Persona effect", body: "11% closure with persona vs 22% without — KOSME 2023" },
                { tag: "Ad ROAS", body: "3.2x ROAS for narrow targeting — Meta Korea 2024" },
              ]).map((f, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${MIDNIGHT}10`, color: MIDNIGHT, whiteSpace: "nowrap", flexShrink: 0, marginTop: "1px" }}>
                    {f.tag}
                  </span>
                  <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.45, flex: 1 }}>{f.body}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* pg 1 — DEFINE (cluster-aware)                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {pg === 1 && (
        <>
          <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
              <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
                {ko ? "타깃 페르소나 한 명을 명시" : "Pin down one target persona"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* primaryAgeRange — 연령대 / 산업 (cluster-aware) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginBottom: "5px", letterSpacing: "0.03em" }}>
                  {ko
                    ? clusterGroup === "tech" ? "1. 타깃 산업·기업 규모 *" : "1. 주 연령대 *"
                    : clusterGroup === "tech" ? "1. Target industry / company size *" : "1. Primary age range *"}
                </label>
                <input
                  type="text"
                  placeholder={ko
                    ? clusterGroup === "tech"
                      ? "예: SaaS B2B / 직원 50-200명 / 연 매출 50억-300억"
                      : clusterGroup === "online"
                        ? "예: 25-34세 (네이버 검색·인스타 광고 노출 핵심 타깃)"
                        : "예: 28-38세 (월급쟁이 직장인 + 자녀 없는 부부)"
                    : clusterGroup === "tech" ? "e.g., B2B SaaS, 50-200 employees, $5-30M ARR" : "e.g., 28-38, salaried, no kids"}
                  value={inputs.primaryAgeRange ?? ""}
                  onChange={(e) => setInput("primaryAgeRange", e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* lifestyleHint — 라이프스타일 / 역할 */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginBottom: "5px", letterSpacing: "0.03em" }}>
                  {ko
                    ? clusterGroup === "tech" ? "2. 핵심 사용자 역할 + 일상 *" : "2. 라이프스타일 + 일상 동선 *"
                    : clusterGroup === "tech" ? "2. User role + daily workflow *" : "2. Lifestyle + daily routine *"}
                </label>
                <textarea
                  placeholder={ko
                    ? clusterGroup === "tech"
                      ? "예: 마케팅 운영 매니저 / 매일 광고 캠페인 7개 운영 / 보고서 작성에 주 8시간"
                      : clusterGroup === "online"
                        ? "예: 평일 출근 후 22시 인스타 30분 / 주말 카페에서 무드 콘텐츠 소비"
                        : "예: 평일 출근 점심 12-13시 (8분 도보권 내) / 주말 브런치 (사진 SNS 업로드)"
                    : clusterGroup === "tech"
                      ? "e.g., Marketing ops manager, runs 7 campaigns daily, 8h/week on reports"
                      : "e.g., Weekday lunch 12-13h (8min walking radius), weekend brunch (SNS-friendly)"}
                  value={inputs.lifestyleHint ?? ""}
                  onChange={(e) => setInput("lifestyleHint", e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* priceSensitivity — 가격 민감도 / 예산 */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginBottom: "5px", letterSpacing: "0.03em" }}>
                  {ko
                    ? clusterGroup === "tech" ? "3. 예산 권한 + 가격 한도 *" : "3. 객단가 기대치 + 가격 민감도 *"
                    : clusterGroup === "tech" ? "3. Budget authority + price ceiling *" : "3. Expected ticket + price sensitivity *"}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "8px" }}>
                  {(clusterGroup === "tech"
                    ? [
                        { v: "self-serve-low", l: ko ? "Self-serve ₩50k↓" : "Self ≤$50/mo" },
                        { v: "team-mid", l: ko ? "팀 ₩50-300k" : "Team $50-300" },
                        { v: "annual-contract", l: ko ? "연 ₩300k↑" : "Annual ≥$300" },
                        { v: "enterprise", l: ko ? "Enterprise PO" : "Enterprise PO" },
                      ]
                    : [
                        { v: "value-budget", l: ko ? "가성비 (₩5-10k)" : "Value ($5-10k)" },
                        { v: "mid-quality", l: ko ? "중간 (₩10-20k)" : "Mid ($10-20k)" },
                        { v: "premium", l: ko ? "프리미엄 (₩20-40k)" : "Premium ($20-40k)" },
                        { v: "luxury", l: ko ? "럭셔리 (₩40k↑)" : "Luxury ($40k+)" },
                      ]
                  ).map((opt) => {
                    const selected = inputs.priceSensitivity === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setInput("priceSensitivity", opt.v)}
                        style={{
                          padding: "9px 6px",
                          borderRadius: "10px",
                          border: selected ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.10)",
                          background: selected ? `${MIDNIGHT}08` : "white",
                          color: selected ? MIDNIGHT : "rgba(15,23,42,0.65)",
                          fontSize: "11px",
                          fontWeight: selected ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* whyTarget (optional) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.55)", marginBottom: "5px", letterSpacing: "0.03em" }}>
                  {ko ? "4. 왜 이 타깃인가 (선택)" : "4. Why this target (optional)"}
                </label>
                <textarea
                  placeholder={ko
                    ? "예: 상권 분석에서 28-38세 직장인 비중 42% / 경쟁점은 모두 가족 타깃 → 1인 직장인 시장 미공급"
                    : "e.g., 42% of foot traffic is 28-38 workers / competitors all target families → unserved niche"}
                  value={inputs.whyTarget ?? guideSelections["why-target"] ?? ""}
                  onChange={(e) => {
                    setInput("whyTarget", e.target.value);
                    d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "why-target": e.target.value }));
                  }}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", background: "rgba(15,23,42,0.02)" }}
                />
              </div>
            </div>

            {/* 진행 표시 */}
            <div style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Check size={14} strokeWidth={2.4} color={MIDNIGHT} style={{ opacity: 0.6 }} />
              <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", fontWeight: 500 }}>
                {ko
                  ? `필수 3개 중 ${[inputs.primaryAgeRange, inputs.lifestyleHint, inputs.priceSensitivity].filter((v) => v?.trim()).length} 완료`
                  : `${[inputs.primaryAgeRange, inputs.lifestyleHint, inputs.priceSensitivity].filter((v) => v?.trim()).length} of 3 required filled`}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* pg 2 — VERIFY                                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {pg === 2 && (
        <>
          <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <AlertTriangle size={14} strokeWidth={2.2} color={MIDNIGHT} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                {ko ? "반례로 검증하세요" : "Verify with counter-examples"}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.65)", lineHeight: 1.65, marginBottom: "14px" }}>
              {ko
                ? "좋은 페르소나는 '누구를 안 받을 것인가' 가 명확합니다. 아래 4개 질문에 모두 답할 수 있어야 페르소나가 의사결정 기준선이 됩니다."
                : "A good persona is clear about who you DON'T serve. Answer all 4 below — only then does the persona become a real decision anchor."}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(ko ? [
                { q: "이 페르소나가 절대 안 살 가격대는?", hint: "범위 명시 (예: 20대 직장인 → 3만원↑ X)" },
                { q: "이 페르소나가 절대 안 갈 위치는?", hint: "구체 (예: 차량 접근만 가능한 외곽)" },
                { q: "이 페르소나가 정말 매주 1회+ 올까?", hint: "오면 안 되는 이유 1개라도 떠오르면 재정의" },
                { q: "경쟁점 중 같은 타깃 가게는?", hint: "이름·차별점 — 안 보이면 시장 없음 신호" },
              ] : [
                { q: "What price would they NEVER pay?", hint: "Be specific" },
                { q: "Where would they NEVER go?", hint: "E.g., car-only suburbs" },
                { q: "Will they REALLY come weekly+?", hint: "If you can think of one reason no — redefine" },
                { q: "Which competitor targets the same?", hint: "If none — market may not exist" },
              ]).map((item, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${MIDNIGHT_BORDER}`, background: `${MIDNIGHT}03` }}>
                  <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "3px" }}>{i + 1}. {item.q}</div>
                  <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{item.hint}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <StageWrapup
        ko={ko}
        nextStageLabelKo={ko ? "예산·시점 설정" : "Budget setup"}
        doneItemsKo={[
          { label: "1. 주 연령대·산업 명시", detail: ko ? "한 명에게 팔린다는 의지로 좁혔는지 확인" : "Narrowed to one target?" },
          { label: "2. 라이프스타일·일상 동선", detail: ko ? "언제·어디서·왜 쓰는지 구체화" : "When/where/why specified?" },
          { label: "3. 객단가·예산 한도", detail: ko ? "안 살 가격대까지 명확" : "Includes what they WON'T pay?" },
          { label: "4. 반례 검증", detail: ko ? "이 페르소나가 절대 안 할 행동 4개" : "4 things this persona never does" },
        ]}
        verifyItemsKo={[
          "'20-50대 여성' 같은 모호한 정의 X — 한 명의 구체 페르소나로 좁혔는가",
          "이 페르소나가 절대 안 갈 위치·안 살 가격대 명시했는가",
          "경쟁점 중 같은 페르소나 타깃 가게 1곳 이상 있는가 (없으면 시장 위험)",
          "후속 결정 (입지·메뉴·가격·광고) 의 기준선이 될 수 있을 만큼 구체적인가",
          "주변 지인 의견이 아닌 실제 잠재 고객 5명+ 대화로 검증했는가",
        ]}
        nextSummaryKo={ko ? "타깃 페르소나 확정 → 예산·시점 설정 단계로 진입" : "Target persona locked → enter Budget setup"}
      />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(25,25,112,0.12)",
  background: "rgba(255,255,255,0.95)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};
