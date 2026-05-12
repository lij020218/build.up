"use client";

import { useRef, useState } from "react";
import { Building2, FileSignature, ShieldCheck } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  getContractAnalysisHints,
  getContractTaskDetail,
} from "../../../helpers";
import {
  KeyActionHero,
  StageTabNav,
  StageOverview,
  WorkStep,
} from "../shared/StageActionHero";

// ── Apple-style 토큰 — permit-check 와 결 통일 ──────────────────
const ACCENT_RGB = "29,53,87";
const MIDNIGHT = "#191970";
const MIDNIGHT_RGB = "25,25,112";
const surfaceCard = {
  marginBottom: "12px",
  padding: "28px 28px",
  borderRadius: "20px",
  background: `linear-gradient(180deg, rgba(${ACCENT_RGB},0.018) 0%, rgba(255,255,255,0.96) 60%)`,
  border: `1px solid rgba(${ACCENT_RGB},0.10)`,
  boxShadow: `0 1px 2px rgba(${ACCENT_RGB},0.04)`,
} as const;
const eyebrow = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: MIDNIGHT,
  textTransform: "uppercase" as const,
  marginBottom: "10px",
} as const;
const hairline = `1px solid rgba(${ACCENT_RGB},0.10)`;

export function ContractReviewStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    isDigitalCategory,
    contractTasks,
    activeContractTask,
    activeContractTaskDetail,
    setSelectedContractTaskId,
    effectiveContractAnalysis,
    contractSubChecks, setContractSubChecks,
    contractText,
    setContractText,
    contractAnalysisStatus,
    handleContractAnalysis,
    contractAnalysisError,
    prevTraversedStage,
    setViewingStageId,
    handleContractTaskToggle,
    handleContractContinue,
    handleStageEdit,
    decisions,
    editSaveStatus,
    resetDemo,
  } = d;
  const isStageCompleted = !!decisions["contract-review"]?.completedAt;
  const _editStatus = editSaveStatus?.stageId === "contract-review" ? editSaveStatus.status : null;
  const _editLabel = _editStatus === "saving"
    ? (language === "ko" ? "저장 중..." : "Saving...")
    : _editStatus === "saved"
      ? (language === "ko" ? "✓ 수정 완료" : "✓ Saved")
      : _editStatus === "error"
        ? (language === "ko" ? "⚠ 다시 시도" : "⚠ Retry")
        : (language === "ko" ? "✓ 수정 저장" : "✓ Save edits");
  const _editBg = _editStatus === "saved" ? "#16a34a" : _editStatus === "error" ? "#dc2626" : "#34c759";

  const contractRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);

  // ⚠️ 페이지네이션 — 한 화면 = 한 흐름. 사용자 피드백으로 스크롤 분량 줄임.
  //    탭: 왜 중요 → 뭘 해야 → 뭘 주의 → 유리한 길 → 체크리스트
  const [pageIdx, setPageIdx] = useState(0);

  const ko = language === "ko";

  // 2026-05-12 P1 fix (사장님 신고): septic-tank-checked 는 음식·카페만 의무지만
  //  UI 가 unconditionally 표시 → 비음식 업종도 정화조 항목 체크해야 진행 가능.
  //  contractTasks 자체를 카테고리 필터링 후 모든 곳에서 사용.
  //  음식·카페: 정화조 포함 (5개) / 그 외: 제외 (4개).
  const FOOD_LIKE_CATS = new Set(["food", "cafe-dessert"]);
  const visibleContractTasks = contractTasks.filter((task) => {
    if (task.taskId !== "septic-tank-checked") return true;
    return industryCategoryId ? FOOD_LIKE_CATS.has(industryCategoryId) : true;
  });
  const canCompleteContractStep = visibleContractTasks.every((task) => task.status === "completed");

  // ★ 페이지 0 = 개요 (이 단계 왜·무엇을·기대 결과). 그 후 작업 흐름.
  const pageLabels = ko
    ? ["개요", "1. 서류", "2. 현장", "3. 특약", "4. 사인", "마무리"]
    : ["Overview", "1. Docs", "2. Site", "3. Clauses", "4. Sign", "Wrap-up"];

  // ── 카테고리별 함정 (intro pitfall card) ───────────────────────
  const categoryPitfalls: Record<string, string> = {
    food: ko
      ? "정화조 용량 확인 누락 → 영업신고 거부 → 정화조 증축 1,000만원+ 또는 계약 해지"
      : "Missing septic check → permit denied → ₩10M+ tank expansion or contract termination",
    cafe: ko
      ? "급배수·전기 용량 미확인 후 계약 → 인테리어 단계에서 추가 공사 500~2,000만원"
      : "Signing without verifying water/electrical → ₩5–20M extra work during interior",
    beauty: ko
      ? "전기 용량 부족 → 헤어드라이기·왁싱기·관리기 동시 사용 시 차단 → 영업 중단"
      : "Insufficient electrical → simultaneous use of dryers/wax/devices trips breakers → service halt",
    fitness: ko
      ? "층고·방음 부족 사전 확인 누락 → 입주 후 민원·소음 분쟁 + 방음 공사 1,000만원+"
      : "Missing ceiling/sound check → noise complaints + ₩10M+ soundproofing post move-in",
    education: ko
      ? "건축물 용도 '교육연구시설' 아니면 학원 등록 거부 → 보증금 회수 어려움"
      : "If use code isn't 'educational research facility,' academy registration is denied",
    pet: ko
      ? "주거지 인접 시 소음·분뇨 민원 → 계약 해지 또는 영업시간 제한"
      : "Adjacent residential complaints → contract termination or limited hours",
    "online-digital": ko
      ? "주거 임대차 계약에서 사업자 등록 금지 조항 누락 시 분쟁 → 사업자 주소 사용 불가"
      : "Missing business-use clause in residential lease → can't use as business address",
    "living-service": ko
      ? "폐수·소음 기준 미확인 후 입주 → 단속 시 영업정지 + 시설 보강 비용"
      : "Wastewater/noise non-compliance → operations halted + facility upgrades",
    space: ko
      ? "건축물 용도 불일치 (숙박업·근린생활) → 영업허가 거부 → 보증금 묶임"
      : "Use-code mismatch (lodging/neighborhood) → permit denial → deposit locked",
  };
  const pitfall = categoryPitfalls[industryCategoryId] ?? categoryPitfalls.food;

  // ─── 카테고리별 「특약 협상 페이지」 의 사장님 상황 맞춤 권장 (페이지 3 inline) ───
  const clauseFavorable: Record<string, { context: string; recommendation: string; rationale: string }> = {
    food: { context: "음식점 / F&B", recommendation: "「환기·정화조·전기 보강 비용 임대인 부담」 특약 무조건 받기",
      rationale: "후드·덕트·정화조 증축은 임대 후 발견 시 500~3,000만원. 임대인 부담 명시 또는 임대료 5% 인하로 보상. 거부 임대인 = 매물 변경." },
    "cafe-dessert": { context: "카페 / 베이커리", recommendation: "「전기 30A↑ 증설 가능 + 비용 분담」 명시",
      rationale: "머신·오븐·제빙기 동시 가동 시 20A 차단기 빈번. 한전 신청 30~80만원. 임대인 부담 또는 임대료 인하로 보상." },
    retail: { context: "리테일 / 소매", recommendation: "「온라인 판매 병행 가능」 + 「업종변경 자유」 명시",
      rationale: "오프라인만 묶이면 매출 다각화 어려움. 스마트스토어 병행이 매출 안전망. 미명시 시 분쟁 발생 시 임대인 우위." },
    beauty: { context: "미용·뷰티", recommendation: "「소음·향기 민원 시 임대인 1차 중재 책임」 명시",
      rationale: "옆 가게 민원으로 영업시간 제한 사례 다수. 임대인이 중재 안 하면 임차인이 직접 분쟁 — 책임 분담 명시 필수." },
    fitness: { context: "필라테스·요가·PT", recommendation: "「방음 보강 비용 임대인 부담」 + 「영업시간 06-23시 보장」",
      rationale: "운동 소음 민원이 폐점 1순위. 방음 보강 1,000~3,000만원을 임대인이 분담 안 하면 매물 변경." },
    education: { context: "학원", recommendation: "「학원 등록 가능 용도」 + 「소방완비증명서 책임 분담」 명시",
      rationale: "건축물 용도 「교육연구시설」 또는 학원 가능 「근린생활시설」 확약 안 받으면 등록 거부. 100㎡↑ 소방완비 필수." },
    pet: { context: "펫", recommendation: "「소음·냄새 민원 1차 중재 임대인 책임」 + 「업종 폐쇄 명령 시 환불」",
      rationale: "펫 업종 민원 영업정지 빈번. 환불 조항 없으면 보증금 묶인 채 폐업. 임대인 중재 + 환불 보장이 안전망." },
    "online-digital": { context: "온라인·디지털 (사무실·창고)", recommendation: "「사업자등록 가능」 명시",
      rationale: "주거용 임대차 계약서는 「사업자 등록 금지」 가 default. 사업자등록 못 하면 매출 신고·세금계산서 불가." },
    "living-service": { context: "세탁·청소·수리", recommendation: "「폐수·소음 기준 적합 매물 + 위반 시 임대인 책임」",
      rationale: "폐수·소음 위반은 영업정지 사유. 임대인이 사전 적합성 확약 없이 단속 시 임차인 부담." },
    space: { context: "공간 임대", recommendation: "「숙박 가능 여부 + 데시벨·시간 제한 명시」",
      rationale: "건축물 용도 미일치 시 영업허가 거부. 소음·시간 분쟁 1순위 — 특약에 명시." },
  };
  const myClauseTip = clauseFavorable[industryCategoryId] ?? clauseFavorable.food;

  return (
    <>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko ? "계약서 사인 전 75분 — 보증금 1,000~5,000만원을 지키는 시간" : "75 min before signing — protect your ₩10-50M deposit",
          detail: ko
            ? "건물·계약·보호 3축을 점검하고 5종 특약을 협상해야 합니다. 사인 후 발견하는 문제는 거의 100% 임차인 부담."
            : "Audit 3 axes + negotiate 5 clauses. Post-sign issues are almost always tenant's burden.",
        }}
        pillars={[
          { icon: <Building2 size={12} strokeWidth={1.5} />, label: ko ? "건물" : "Building", meta: ko ? "용도 · 정화조 · 전기" : "Class · Septic · Power" },
          { icon: <FileSignature size={12} strokeWidth={1.5} />, label: ko ? "계약" : "Contract", meta: ko ? "5% 상한 · 10년 갱신" : "5% cap · 10y renewal" },
          { icon: <ShieldCheck size={12} strokeWidth={1.5} />, label: ko ? "보호" : "Protection", meta: ko ? "확정일자 · 근저당" : "Cert · Mortgages" },
        ]}
      />

      <StageTabNav
        ko={ko}
        pageIndex={pageIdx}
        pageLabels={pageLabels}
        onPrev={() => setPageIdx(p => Math.max(0, p - 1))}
        onNext={() => setPageIdx(p => Math.min(pageLabels.length - 1, p + 1))}
        onJump={setPageIdx}
      />

      {/* ── 페이지 0: 단계 개요 (왜 + 작업 목차 + 기대 결과) ── */}
      {pageIdx === 0 && (
        <StageOverview
          ko={ko}
          headline={ko
            ? "계약서 사인 전 75분이 보증금 1,000~5,000만원을 결정합니다"
            : "75 min before signing decides your ₩10-50M deposit"}
          why={ko
            ? "임대차 계약은 사인 후 정정 가능성이 거의 0%. 건물(용도·정화조·전기)·계약(특약)·보호(확정일자·근저당)를 사전에 점검해야 분쟁·손실을 막습니다. 인근 점주 인터뷰 + 정부 서류 + 표준 특약 5종만으로 80% 리스크 차단."
            : "Lease amendments post-sign are ~0%. Pre-inspect building / clauses / protection to prevent disputes. Neighbor interview + gov docs + 5 standard clauses block 80% of risk."}
          stat={{
            value: ko ? "₩2,800만" : "₩28M",
            label: ko ? "분쟁 시 평균 손실액" : "avg dispute loss",
          }}
          workOutline={[
            { stepLabel: ko ? "1. 서류" : "1. Docs", title: ko ? "건축물대장 + 등기부등본 발급" : "Building register + deed", time: ko ? "20분" : "20m" },
            { stepLabel: ko ? "2. 현장" : "2. Site", title: ko ? "현장 방문 + 영상 + 인접 점주 인터뷰" : "Site visit + video + neighbor interview", time: ko ? "30분" : "30m" },
            { stepLabel: ko ? "3. 특약" : "3. Clauses", title: ko ? "특약 5종 협상 — 임대료·갱신·원상복구·업종·시설" : "Negotiate 5 clauses", time: ko ? "25분" : "25m" },
            { stepLabel: ko ? "4. 사인" : "4. Sign", title: ko ? "사인 즉시 확정일자 (동주민센터)" : "Sign + same-day certified date", time: ko ? "당일" : "Same day" },
            { stepLabel: ko ? "체크리스트" : "Checklist", title: ko ? "AI 계약 분석 + 필수 확인 항목 마킹" : "AI clause review + checklist" },
          ]}
          outcome={ko
            ? "보증금 보호 (확정일자 + 5% 상한 + 갱신 10년 + 원상복구 「임차 시 상태」 기준) 가 모두 계약서에 명문화됩니다. 다음 단계 (인테리어 발주) 부터는 보증금 묶임 리스크가 사라진 상태에서 진행."
            : "Deposit protection (certified date + 5% cap + 10y renewal + 'as-leased' restoration) is locked into the lease. Next stage (interior) proceeds risk-free."}
          nextStage={ko ? "인테리어·집기 발주 (construction-setup)" : "Interior setup"}
        />
      )}

      {/* ── 페이지 1: 서류 발급 (gov24 + 인터넷등기소) ── */}
      {pageIdx === 1 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "1. 서류 발급" : "1. Documents"}
          time={ko ? "20분" : "20m"}
          headline={ko ? "건축물대장 + 등기부등본을 사인 전에 직접 확인" : "Pull building register + deed before signing"}
          why={ko
            ? "임대인 말로 「용도 OK·근저당 적음」 = 절대 신뢰 X. 정부 서류로만 검증. 근저당 50%↑ 매물은 임대인 부도 시 보증금 회수 위험."
            : "Don't trust landlord's verbal claims — verify with government docs. Mortgages over 50% = deposit recovery risk if landlord defaults."}
          how={[
            { title: ko ? "건축물대장 발급 (정부24·무료·5분)" : "Building register (gov24 · free · 5m)", detail: ko ? "정부24 → 「건축물대장 등본」 검색 → PDF 다운. 「용도」 + 「위반건축물」 표시 + 「정화조 BOD 용량」 확인." : "gov.kr → search 'building register' → PDF. Check use class, violation flag, septic BOD." },
            { title: ko ? "등기부등본 발급 (인터넷등기소·700원·5분)" : "Deed register (iros.go.kr · ₩700 · 5m)", detail: ko ? "iros.go.kr → 「등기사항전부증명서」 → 부동산 주소 검색. 「갑구」 = 소유권, 「을구」 = 근저당·압류. 근저당 합계 ÷ 매물 시세 = 부도 위험률." : "iros.go.kr → property address. 갑구 = ownership, 을구 = mortgages. Total mortgages / market value = default risk." },
          ]}
          watchouts={ko ? [
            { label: "위반건축물 표시 = 영업신고 영구 불가", text: "건축물대장에 「위반건축물」 표기 시 무조건 매물 변경. 무허가 증축·용도 변경은 시정 명령 + 보증금 묶임." },
            { label: "근저당 50%↑ = 임대인 부도 시 보증금 후순위", text: "근저당 권자 (은행 등) 가 우선. 보증금이 후순위면 임대인 부도 시 잃을 가능성 큼." },
          ] : [
            { label: "Violation flag = permanent denial", text: "If building register shows '위반건축물', walk away. Unauthorized changes = remedial order + deposit lock." },
            { label: "Mortgages > 50% = deposit risk", text: "Mortgage holders rank above tenant. Default = deposit at risk." },
          ]}
        />
      )}

      {/* ── 페이지 1: 현장 방문 (영상 + 인접 점주 인터뷰) ── */}
      {pageIdx === 2 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "2. 현장 방문" : "2. Site visit"}
          time={ko ? "30분" : "30m"}
          headline={ko ? "휴대폰 영상 + 옆 가게 점주 인터뷰 = 80% 리스크 차단" : "Phone video + neighbor interview = block 80% risk"}
          why={ko
            ? "사진은 못 잡는 「소음·냄새·동선·환기」를 직접 점검. 옆 가게 점주에게 30초만 물어봐도 임대인 평판이 보임."
            : "Photos miss noise/smell/flow/ventilation — verify in person. 30-second neighbor interview reveals landlord reputation."}
          how={[
            { title: ko ? "영상 기록 — 매장 전체 + 외부 + 시설" : "Video — interior + exterior + utilities", detail: ko ? "휴대폰으로 한 번에 쭉 촬영. 누수·곰팡이·전기 패널·환기 후드·정화조 위치까지. 분쟁 시 증거." : "Single-take phone video. Cover leaks, mold, electrical panel, vent hood, septic. Evidence for disputes." },
            { title: ko ? "옆 가게 점주에게 3개 질문" : "3 questions to neighbor", detail: ko ? "「이 건물주 어때요?」 + 「임대료 어떻게 인상하세요?」 + 「민원 자주 있나요?」 — 임대인 평판 80% 노출." : "How's the landlord? How are rent increases handled? Many complaints? — 80% reveal." },
            { title: ko ? "전기 용량·정화조 용량 직접 확인" : "Electrical · septic capacity check", detail: ko ? "전기 패널 30A 표기 확인 + 건물 외부 정화조 위치·크기 확인. 임대인 답변과 다르면 협상 카드." : "Verify 30A panel + septic location/size. Discrepancy with landlord = negotiation lever." },
          ]}
          watchouts={ko ? [
            { label: "낮 시간대만 가지 말 것 — 야간 소음 못 봄", text: "주거 인접 매물은 저녁 7시·아침 7시 다시 방문해 소음 점검. 영업 후 민원으로 시간 제한 가능성 사전 차단." },
          ] : [
            { label: "Daytime visit only misses night noise", text: "Re-visit at 7pm/7am for residential-adjacent properties. Pre-emptive noise check." },
          ]}
        />
      )}

      {/* ── 페이지 2: 특약 5종 협상 ── */}
      {pageIdx === 3 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "3. 특약 협상" : "3. Special clauses"}
          time={ko ? "25분" : "25m"}
          headline={ko ? "표준 임대차계약서 + 5종 특약 — 거부 임대인 = 매물 변경" : "Standard lease + 5 clauses — refusal = walk away"}
          why={ko
            ? "사인 후 정정 거의 불가. 5종 특약을 협상 못 하는 임대인은 분쟁 시 일방적. 협상 거부 자체가 위험 신호."
            : "Post-sign amendment ~0%. A landlord who refuses standard clauses is a red flag for future disputes."}
          how={[
            { title: ko ? "표준 임대차계약서 사용 (법무부 양식)" : "Use MOJ standard lease form", detail: ko ? "법무부 「상가건물 임대차 표준계약서」 다운. 임대인이 본인 양식 고집하면 추가 위험 조항 의심." : "MOJ standard form. Landlord's own form may hide risky clauses." },
            { title: ko ? "특약 5종 명시 — 임대료 5%·갱신 10년·원상복구·업종변경·시설보강" : "5 clauses — 5% cap·10y renewal·restoration·business-type·upgrades", detail: ko ? "「특약사항」 란에 5종 모두 명시. ① 임대료 인상 연 5% 이내 ② 10년 갱신권 ③ 원상복구 = 「임차 시 상태」 기준 ④ 업종변경 자유 ⑤ 시설보강 비용 임대인 부담." : "Specify all 5 in addendum. ① 5% rent cap ② 10y renewal ③ restoration to as-leased state ④ business-type freedom ⑤ landlord-paid upgrades." },
            { title: ko ? "거부 시 매물 변경 — 협상 못 하는 임대인은 위험" : "Walk away on refusal", detail: ko ? "5종 모두 거부하면 분쟁 가능성 매우 높은 임대인. 보증금 1,000~5,000만원 묶을 가치 없음." : "Refusal of all 5 = high-dispute landlord. Not worth ₩10-50M deposit risk." },
          ]}
          watchouts={ko ? [
            { label: "「임대료 5% 상한」 미명시 = 무제한 인상 가능", text: "⚠ 환산보증금 상한 — 서울 9억, 광역시 6.9억, 그 외 5.4억 (상가건물 임대차보호법 시행령 §2). 환산보증금 = 보증금 + (월세 × 100). 상한 초과면 법정 보호(5% 상한·우선변제권) 적용 X — 특약에 「갱신 시 5% 이내」 명시해야 안전. ✓ 대항력·계약갱신요구권(10년)·권리금 회수기회는 환산보증금 상관없이 모든 임차인에게 적용." },
            { label: "원상복구 「최초 인도 시 상태」 = 인테리어 철거 1,000~3,000만원", text: "본인이 한 시공을 모두 철거 + 원래대로 복구해야 함. 「임차 시 상태」 로 명시해야 본인 시공만 책임." },
          ] : [
            { label: "No 5% cap clause = unlimited yearly increase", text: "Above deposit limit, statutory cap doesn't apply. Explicit clause is only protection." },
            { label: "'Original' restoration = ₩10-30M demolition", text: "Strip everything to first-delivery state. Use 'as-leased' to limit scope." },
          ]}
          favorable={{ context: myClauseTip.context, recommendation: myClauseTip.recommendation, rationale: myClauseTip.rationale }}
        />
      )}

      {/* ── 페이지 3: 사인 + 확정일자 ── */}
      {pageIdx === 4 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "4. 사인 + 확정일자" : "4. Sign + certified date"}
          time={ko ? "당일 30분" : "Same day · 30m"}
          headline={ko ? "사인 당일 무조건 확정일자 — 1일 늦으면 보증금 후순위" : "Get certified date the SAME DAY — 1 day late = subordinated"}
          why={ko
            ? "확정일자가 보증금 우선변제권 결정. 다른 채권자가 그 사이 등기하면 사장님 보증금이 후순위로 밀려 임대인 부도 시 잃음."
            : "Certified date sets your deposit priority. If another creditor records first, your deposit is subordinated."}
          how={[
            { title: ko ? "관할 동주민센터 또는 세무서 방문" : "Local center / tax office visit", detail: ko ? "임차물건 주소 관할. 1,000원 수수료. 30분 안에 끝남. 토요일 일부 가능 — 평일에 사인하는 게 안전." : "Property's jurisdiction. ₩1K fee. 30 minutes. Some Sat hours — weekday safer." },
            { title: ko ? "필요 서류 — 임대차계약서 + 신분증" : "Required — lease + ID", detail: ko ? "원본 계약서 + 본인 신분증. 임대인 동행 X (임차인 단독 신청)." : "Original lease + your ID. No landlord needed." },
            { title: ko ? "확정일자 도장 받은 계약서는 절대 분실 X" : "Never lose the stamped lease", detail: ko ? "스캔본 클라우드 + 원본 금고 보관. 분쟁 시 핵심 증거." : "Scan to cloud + safe storage. Key dispute evidence." },
            { title: ko ? "다음 단계 — 인테리어·집기 발주" : "Next stage — interior setup", detail: ko ? "확정일자 받으면 보증금 보호 완료. 다음 단계로 진행." : "Once certified, protected. Move to interior setup." },
          ]}
          watchouts={ko ? [
            { label: "확정일자 1일 늦어도 우선변제권 후순위", text: "사인 후 다른 채권자가 그날 등기하면 사장님 보증금이 후순위. 사인 직후 바로 동주민센터로." },
            { label: "권리금 회수기회 보호 — 임대차 종료 6개월 전~종료 시점", text: "상가건물 임대차보호법 §10조의4 — 임대인이 정당한 사유 없이 신규 임차인 거절 시 권리금 손해배상 청구 가능. 환산보증금 무관 모든 임차인에게 적용. 임대인 거절 사유는 서면 요구·증거 확보 필수." },
          ] : [
            { label: "1 day late = subordinated", text: "If another creditor files same day, you're junior. Go to local center IMMEDIATELY after signing." },
            { label: "Key-money recovery — 6mo before lease end to end date", text: "Commercial Lease Protection Act §10-4. Landlord must not unjustly reject your replacement tenant. Compensation available. Applies to all tenants regardless of deposit ceiling. Demand written reason for rejection." },
          ]}
        />
      )}

      {/* ── 페이지 5 — 마무리 (한 일 + 다음 단계 전 주의) + 필수 확인 항목 ── */}
      {pageIdx === 5 && (
        <>
      {/* 마무리 카드 — 한 일 + 다음 단계 전 주의 */}
      <div style={{
        background: "white", borderRadius: 16,
        border: "1px solid rgba(25,25,112,0.08)",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 18,
        marginBottom: 16,
      }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
            letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 4,
          }}>
            {ko ? "마무리" : "Wrap-up"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.4 }}>
            {ko ? "이 단계에서 한 일 + 다음 단계 전 반드시 확인" : "What you did + must-verify before next stage"}
          </div>
        </div>

        {/* 이 단계에서 한 일 */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
            letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10,
          }}>
            {ko ? "이 단계에서 한 일" : "What you did"}
          </div>
          <ol style={{
            margin: 0, padding: 0, listStyle: "none",
            border: "1px solid rgba(25,25,112,0.10)", borderRadius: 12, overflow: "hidden",
          }}>
            {(ko ? [
              { label: "1. 서류 발급", detail: "건축물대장 + 등기부등본 — 위반건축물 표시 + 근저당 ÷ 시세 = 부도 위험률" },
              { label: "2. 현장 방문 + 인접 점주 인터뷰", detail: "휴대폰 영상 + 30초 인터뷰 + 전기 30A·정화조 직접 검증" },
              { label: "3. 특약 5종 협상", detail: "임대료 5% 상한 + 10년 갱신 + 원상복구 「임차 시 상태」 + 업종변경 자유 + 시설보강 임대인 부담" },
              { label: "4. 사인 + 당일 확정일자", detail: "동주민센터 30분 — 1,000원 — 보증금 우선변제권 확보" },
            ] : [
              { label: "1. Pulled docs", detail: "Building register + deed — violations + mortgage / value ratio" },
              { label: "2. Site visit + neighbor interview", detail: "Phone video + 30s chat + 30A/septic verified" },
              { label: "3. Negotiated 5 clauses", detail: "5% cap + 10y renewal + as-leased + business freedom + landlord pays upgrades" },
              { label: "4. Signed + same-day cert", detail: "Local center · 30m · ₩1K — deposit priority secured" },
            ]).map((item, i) => (
              <li key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
                background: "rgba(25,25,112,0.025)",
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 7,
                  background: MIDNIGHT, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1, fontSize: 12, fontWeight: 800,
                }}>✓</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginTop: 3 }}>
                    {item.detail}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* 다음 단계 전 반드시 확인 */}
        <div style={{
          padding: "14px 16px", borderRadius: 12,
          background: "rgba(220,38,38,0.04)",
          border: "1px solid rgba(220,38,38,0.14)",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#dc2626",
            letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8,
          }}>
            {ko ? "다음 단계(인테리어) 전 반드시 확인" : "Verify before interior setup"}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {(ko ? [
              "확정일자 도장 받은 계약서 원본 보관 + 스캔본 클라우드 (분쟁 시 핵심 증거)",
              "특약 5종 모두 계약서 「특약사항」 란에 명문화 — 구두 약속은 분쟁 시 100% 임차인 불리",
              "근저당 합계 ÷ 시세 50% 이상이면 보증금 후순위 — 보증보험 가입 검토",
              "전기 용량·정화조 용량을 임대인 답변과 다르면 시설보강 임대인 부담 추가 협상",
              "원상복구 범위가 「임차 시 상태」 로 명시됐는지 다시 확인 — 「최초 인도 시」 = 인테리어 철거 1,000~3,000만원 부담",
            ] : [
              "Keep stamped lease original + cloud scan — key dispute evidence",
              "All 5 clauses in addendum — verbal promises lose 100% in dispute",
              "Mortgages > 50% of value = deposit risk — consider deposit insurance",
              "If electric/septic differs from landlord's words, demand cost-share clause",
              "Restoration scope = 'as-leased' (not 'original') — saves ₩10-30M demolition",
            ]).map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: "#dc2626" }} />
                <span style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6, fontWeight: 500 }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 다음 단계 안내 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 15px", borderRadius: 12,
          background: "linear-gradient(180deg, rgba(5,150,105,0.05) 0%, rgba(5,150,105,0.02) 100%)",
          border: "1px solid rgba(5,150,105,0.16)",
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: "rgba(5,150,105,0.12)", color: "#059669",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: 13, fontWeight: 800,
          }}>✓</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 2 }}>
              {ko ? "이 단계가 끝나면" : "When done"}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em", lineHeight: 1.4 }}>
              {ko
                ? "보증금 보호 명문화 완료 → 인테리어·집기 발주 (construction-setup) 진입"
                : "Deposit protection locked → enter interior setup"}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.helper}>
        {isDigitalCategory
          ? ko
            ? "운영 공간, 보관, 택배, 공급 접근성처럼 온라인 판매의 실제 실행 조건을 먼저 점검합니다."
            : "Review workspace, storage, shipping, and sourcing conditions before scaling online operations."
          : copy.home.contractHelp}
      </div>
      <div style={styles.budgetLabel}>
        {ko ? `필수 확인 항목 ${visibleContractTasks.length}개` : `${visibleContractTasks.length} required items`}
      </div>

      {/* ── Accordion 체크리스트 — PermitCheckPanels 와 동일 결 ──
          각 task 가 클릭 시 펼쳐지며 summary / checklist / traps / actions / questions 를 inline 표시.
          이전 구현 (카드 그리드 + 별도 detail 패널) 을 단일 흐름으로 정리해 다른 단계와 일관성 확보. */}
      <div
        ref={contractRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "16px",
          ...(shakeWarning ? { outline: "2px solid #dc2626", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}),
        }}
      >
        {visibleContractTasks.map((task) => {
          const completed = task.status === "completed";
          const expanded = activeContractTask?.taskId === task.taskId;
          const detail = getContractTaskDetail(task.taskId, language, industryCategoryId);
          const analysisHints = getContractAnalysisHints(
            effectiveContractAnalysis,
            task.taskId,
            industryCategoryId,
            language,
          );
          // ⚠️ 체크리스트 100% 완료 강제 — 부분 체크로 자동 진행 방지
          const checklistTotal = detail.checklist.length;
          const checklistDone = detail.checklist.filter((_, i) => contractSubChecks[`${task.taskId}:${i}`]).length;
          const checklistAllDone = checklistTotal === 0 || checklistDone === checklistTotal;
          // task 가 todo → completed 로 바뀌려면 체크리스트 100% 필요. 이미 completed 면 해제는 항상 가능.
          const canMarkComplete = completed || checklistAllDone;
          return (
            <div
              key={task.taskId}
              style={{
                borderRadius: "16px",
                border: expanded
                  ? `1px solid rgba(${MIDNIGHT_RGB},0.22)`
                  : completed
                    ? "1px solid rgba(34,139,34,0.20)"
                    : `1px solid rgba(${ACCENT_RGB},0.08)`,
                background: expanded
                  ? `linear-gradient(180deg, rgba(${MIDNIGHT_RGB},0.025) 0%, rgba(255,255,255,0.97) 60%)`
                  : completed
                    ? "linear-gradient(180deg, rgba(52,199,89,0.04) 0%, rgba(255,255,255,0.96) 100%)"
                    : "rgba(255,255,255,0.94)",
                overflow: "hidden",
                transition: "all 0.2s ease",
                boxShadow: expanded ? `0 4px 14px rgba(${MIDNIGHT_RGB},0.06)` : "none",
              }}
            >
              {/* Header — 두 개의 분리된 클릭 영역
                  - 동그라미: task 완료 토글
                  - 나머지 (제목/뱃지/시간/chevron): 펼치기/접기 */}
              <div style={{
                width: "100%",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                {/* ① Status circle — 클릭 시 task 완료 토글 (⚠️ 체크리스트 100% 미완료 시 차단) */}
                <button
                  type="button"
                  aria-label={
                    completed
                      ? (ko ? "확인 완료 해제" : "Mark not done")
                      : !canMarkComplete
                        ? (ko ? `체크리스트 ${checklistDone}/${checklistTotal} 완료 필요` : `Complete ${checklistDone}/${checklistTotal} checklist first`)
                        : (ko ? "확인 완료" : "Mark done")
                  }
                  disabled={!canMarkComplete}
                  title={
                    !canMarkComplete
                      ? (ko ? `이 task 의 체크리스트 (${checklistDone}/${checklistTotal}) 를 모두 완료해야 합니다.` : `Complete all ${checklistTotal} checklist items first.`)
                      : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canMarkComplete) {
                      // 사용자에게 명확한 피드백 — 펼쳐서 체크리스트 보이게
                      setSelectedContractTaskId(task.taskId);
                      return;
                    }
                    handleContractTaskToggle(task.taskId);
                  }}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    border: completed
                      ? "none"
                      : !canMarkComplete
                        ? "1.5px dashed rgba(0,0,0,0.18)"
                        : "1.5px solid rgba(0,0,0,0.22)",
                    background: completed ? "#34c759" : "transparent",
                    boxShadow: completed ? "0 2px 6px rgba(52,199,89,0.28)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    cursor: canMarkComplete ? "pointer" : "not-allowed",
                    opacity: !canMarkComplete ? 0.45 : 1,
                    padding: 0,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!completed && canMarkComplete) {
                      e.currentTarget.style.borderColor = "#34c759";
                      e.currentTarget.style.background = "rgba(52,199,89,0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!completed && canMarkComplete) {
                      e.currentTarget.style.borderColor = "rgba(0,0,0,0.22)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {completed ? (
                    <svg width="13" height="10" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : !canMarkComplete && checklistTotal > 0 ? (
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(0,0,0,0.42)", fontVariantNumeric: "tabular-nums" }}>
                      {checklistDone}/{checklistTotal}
                    </span>
                  ) : null}
                </button>

                {/* ② 펼치기/접기 영역 (제목 + 뱃지 + 시간 + chevron) */}
                <button
                  type="button"
                  onClick={() => setSelectedContractTaskId(expanded ? undefined : task.taskId)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: 0,
                    minWidth: 0,
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", minWidth: 0 }}>
                    <span style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: completed ? "rgba(0,0,0,0.45)" : "#0f172a",
                      letterSpacing: "-0.01em",
                      textDecoration: completed ? "line-through" : "none",
                    }}>
                      {detail.title}
                    </span>
                    {task.required && !completed ? (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(220,38,38,0.10)",
                        color: "#dc2626",
                        letterSpacing: "0.04em",
                      }}>
                        {ko ? "필수" : "REQUIRED"}
                      </span>
                    ) : null}
                    {analysisHints.length > 0 ? (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(200,150,0,0.12)",
                        color: "#9a6a00",
                        letterSpacing: "0.04em",
                      }}>
                        {ko ? `AI 주의 ${analysisHints.length}` : `AI ${analysisHints.length}`}
                      </span>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", fontVariantNumeric: "tabular-nums" }}>
                      {completed ? (ko ? "완료" : "Done") : `${task.estimatedMinutes ?? "-"}${ko ? "분" : "m"}`}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      color: "rgba(0,0,0,0.4)",
                      transform: expanded ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                    }}>
                      ▾
                    </span>
                  </div>
                </button>
              </div>

              {/* Body — 펼쳐진 상태에서만 */}
              {expanded ? (
                <div style={{
                  padding: "0 18px 18px",
                  borderTop: hairline,
                  display: "grid",
                  gap: "16px",
                  paddingTop: "16px",
                  marginTop: "0",
                }}>
                  {/* Summary */}
                  {detail.summary ? (
                    <div style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(0,0,0,0.7)" }}>
                      {detail.summary}
                    </div>
                  ) : null}

                  {/* AI hints */}
                  {analysisHints.length > 0 ? (
                    <div style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,200,50,0.08)",
                      border: "1px solid rgba(200,150,0,0.16)",
                    }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: "#9a6a00",
                        marginBottom: "6px",
                      }}>
                        {ko ? "AI가 먼저 보라고 한 이유" : "Why AI flagged this"}
                      </div>
                      {analysisHints.map((item: string) => (
                        <div key={item} style={{ fontSize: "13px", lineHeight: 1.6, color: "#6f4d00" }}>• {item}</div>
                      ))}
                    </div>
                  ) : null}

                  {/* Checklist — 각 항목 클릭 가능 + 체크 상태 영구 저장 */}
                  {detail.checklist.length > 0 ? (() => {
                    const checkedCount = detail.checklist.filter((_, i) => contractSubChecks[`${task.taskId}:${i}`]).length;
                    const allChecked = checkedCount === detail.checklist.length;
                    return (
                      <div>
                        <div style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase" as const,
                            color: "rgba(0,0,0,0.5)",
                          }}>
                            {ko ? "확인할 항목" : "Checklist"}
                          </div>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: allChecked ? "#34c759" : "rgba(0,0,0,0.45)",
                            fontVariantNumeric: "tabular-nums",
                          }}>
                            {checkedCount} / {detail.checklist.length}
                          </div>
                        </div>
                        <div style={{ display: "grid", gap: "4px" }}>
                          {detail.checklist.map((item, i) => {
                            const key = `${task.taskId}:${i}`;
                            const checked = !!contractSubChecks[key];
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setContractSubChecks((prev) => ({ ...prev, [key]: !prev[key] }))}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                  padding: "8px 10px",
                                  borderRadius: "10px",
                                  background: checked ? "rgba(52,199,89,0.06)" : "transparent",
                                  border: "1px solid transparent",
                                  cursor: "pointer",
                                  textAlign: "left" as const,
                                  width: "100%",
                                  transition: "background 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!checked) e.currentTarget.style.background = `rgba(${MIDNIGHT_RGB},0.04)`;
                                }}
                                onMouseLeave={(e) => {
                                  if (!checked) e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <div style={{
                                  width: "18px", height: "18px",
                                  borderRadius: "5px",
                                  border: checked ? "none" : `1.5px solid rgba(${MIDNIGHT_RGB},0.30)`,
                                  background: checked ? "#34c759" : "rgba(255,255,255,0.7)",
                                  flexShrink: 0, marginTop: "1px",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}>
                                  {checked ? (
                                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : null}
                                </div>
                                <div style={{
                                  fontSize: "14px",
                                  lineHeight: 1.55,
                                  color: checked ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.78)",
                                  textDecoration: checked ? "line-through" : "none",
                                  transition: "color 0.15s ease",
                                }}>
                                  {item}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })() : null}

                  {/* Traps */}
                  {detail.traps.length > 0 ? (
                    <div>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: "rgba(0,0,0,0.5)",
                        marginBottom: "8px",
                      }}>
                        {ko ? "흔한 함정" : "Common pitfalls"}
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {detail.traps.map((trap) => (
                          <div key={trap.label} style={{
                            padding: "12px 14px",
                            borderRadius: "12px",
                            background: "rgba(220,38,38,0.04)",
                            border: "1px solid rgba(220,38,38,0.14)",
                          }}>
                            <div style={{ fontSize: "13px", fontWeight: 620, color: "#dc2626", marginBottom: "4px" }}>
                              ⚠ {trap.label}
                            </div>
                            <div style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(0,0,0,0.65)" }}>{trap.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Actions */}
                  {detail.actions.length > 0 ? (
                    <div>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: "rgba(0,0,0,0.5)",
                        marginBottom: "8px",
                      }}>
                        {ko ? "지금 할 행동" : "Action steps"}
                      </div>
                      <div style={{ display: "grid", gap: "6px" }}>
                        {detail.actions.map((action) => (
                          action.href ? (
                            <a
                              key={action.label}
                              href={action.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                lineHeight: 1.5,
                                color: MIDNIGHT,
                                textDecoration: "none",
                                fontWeight: 550,
                              }}
                            >
                              <span style={{ flexShrink: 0, opacity: 0.7 }}>↗</span>
                              <span>{action.label}</span>
                            </a>
                          ) : (
                            <div key={action.label} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <span style={{ fontSize: "14px", color: "rgba(0,0,0,0.4)", flexShrink: 0, marginTop: "1px" }}>→</span>
                              <div style={{ fontSize: "14px", lineHeight: 1.5, color: "rgba(0,0,0,0.78)" }}>{action.label}</div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Questions */}
                  {detail.questions.length > 0 ? (
                    <div>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: "rgba(0,0,0,0.5)",
                        marginBottom: "8px",
                      }}>
                        {ko ? "건물주·중개사에게 물어볼 것" : "Ask the landlord / agent"}
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {detail.questions.map((q) => (
                          <div key={q} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <div style={{ fontSize: "12px", color: MIDNIGHT, flexShrink: 0, marginTop: "2px", fontWeight: 700 }}>Q</div>
                            <div style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(0,0,0,0.78)", fontStyle: "italic" }}>{q}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Complete toggle */}
                  <button
                    type="button"
                    style={completed ? styles.button : styles.primaryButton}
                    onClick={() => handleContractTaskToggle(task.taskId)}
                  >
                    {completed
                      ? ko ? "다시 확인하기로 표시" : "Mark as not reviewed"
                      : ko ? "이 항목 확인 완료" : "Mark this item reviewed"}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={styles.inlinePanel}>
        <div style={styles.inlinePanelHeader}>
          <div style={styles.budgetLabel}>{language === "ko" ? "계약서 조항 분석" : "Contract clause analysis"}</div>
          <div style={styles.helper}>
            {language === "ko"
              ? "상가 임대차 계약서 원문을 붙여넣으면 위험 조항, 누락 항목, 특이 조건을 먼저 짚어드립니다."
              : "Paste the lease text to flag risky clauses, missing items, and unusual terms before signing."}
          </div>
        </div>
        <div style={styles.aiHelper}>
          {language === "ko"
            ? "법률 자문이 아닌 1차 위험 점검입니다. 긴 계약서는 핵심 조항 중심으로 나눠 검토하는 편이 안전합니다."
            : "This is a first-pass risk review, not legal advice. Review long leases in smaller key-clause sections."}
        </div>
        <textarea
          value={contractText}
          onChange={(event) => setContractText(event.target.value)}
          placeholder={
            language === "ko"
              ? "임대차 계약서 원문을 붙여넣어 보세요. 예: 임대료, 원상복구, 권리금, 해지 조항..."
              : "Paste the lease text here. Focus on rent, restoration, key money, termination, and renewal clauses."
          }
          style={{ ...styles.textarea, ...styles.aiTextarea }}
        />
        <div style={styles.aiHelper}>
          {language === "ko"
            ? "최소 100자 이상, 10,000자 이하의 텍스트를 권장합니다."
            : "Use at least 100 characters and keep the text under 10,000 characters."}
        </div>
        <div style={styles.stageInlineActions}>
          <button
            type="button"
            style={{ ...styles.button, ...(contractText.trim() ? styles.surfaceNavButtonSelected : {}) }}
            onClick={handleContractAnalysis}
            disabled={!contractText.trim() || contractAnalysisStatus === "loading"}
          >
            {contractAnalysisStatus === "loading"
              ? language === "ko"
                ? "분석 중..."
                : "Analyzing..."
              : language === "ko"
                ? "계약서 분석하기"
                : "Analyze contract"}
          </button>
        </div>
        {contractAnalysisError ? <div style={styles.warningText}>{contractAnalysisError}</div> : null}
        {effectiveContractAnalysis ? (
          <div style={{ ...styles.inlinePanel, ...styles.aiInlinePanel }}>
            <div style={styles.inlinePanelMetaRow}>
              <div style={styles.budgetLabel}>
                {language === "ko" ? "AI 해석 · 계약서 원문 기반" : "AI interpretation · grounded in contract text"}
              </div>
              <div style={styles.confidenceBadge}>
                {language === "ko"
                  ? effectiveContractAnalysis.riskLevel === "critical"
                    ? "위험 높음"
                    : effectiveContractAnalysis.riskLevel === "high"
                      ? "주의 필요"
                      : effectiveContractAnalysis.riskLevel === "medium"
                        ? "검토 권장"
                        : "기본 확인"
                  : effectiveContractAnalysis.riskLevel}
              </div>
            </div>
            <div style={styles.inlinePanelHeader}>
              <div style={styles.budgetLabel}>{language === "ko" ? "한 줄 요약" : "Summary"}</div>
              <div style={styles.optionTitle}>{effectiveContractAnalysis.summary}</div>
            </div>
            {effectiveContractAnalysis.flaggedClauses.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "위험 조항" : "Flagged clauses"}</div>
                {effectiveContractAnalysis.flaggedClauses.slice(0, 3).map((clause) => (
                  <div key={`${clause.excerpt}-${clause.issue}`} style={styles.budgetPanel}>
                    <div style={styles.optionSummary}>{clause.excerpt}</div>
                    <div style={clause.severity === "danger" ? styles.criticalText : styles.warningText}>
                      {clause.issue}
                    </div>
                  </div>
                ))}
              </>
            ) : null}
            {effectiveContractAnalysis.missingItems.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "누락 확인 항목" : "Missing checks"}</div>
                {effectiveContractAnalysis.missingItems.slice(0, 3).map((item) => (
                  <div key={item} style={styles.aiHelper}>• {item}</div>
                ))}
              </>
            ) : null}
            {effectiveContractAnalysis.unusualTerms.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "특이 조건" : "Unusual terms"}</div>
                {effectiveContractAnalysis.unusualTerms.slice(0, 3).map((item) => (
                  <div key={item} style={styles.aiHelper}>• {item}</div>
                ))}
              </>
            ) : null}
            <div style={styles.budgetLabel}>{language === "ko" ? "다음 행동" : "Next actions"}</div>
            {effectiveContractAnalysis.nextActions.slice(0, 3).map((item) => (
              <div key={item} style={styles.aiHelper}>• {item}</div>
            ))}
          </div>
        ) : null}
      </div>
        </>
      )}

      <div style={styles.stageFooter}>
        {/* ⚠️ 항상 노출 — prevTraversedStage 가 null 이어도 (사용자가 미완료 단계를 viewing 중) 로드맵으로 돌아가는 fallback */}
        <button
          type="button"
          style={styles.button}
          onClick={() => {
            if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
            else setViewingStageId(null); // 로드맵 surface 로 복귀
          }}
        >
          {language === "ko" ? "← 이전 단계" : "← Back"}
        </button>
        {/* "수정 저장" — editSaveStatus 따라 라벨/색 변경. */}
        {isStageCompleted && (
          <button
            type="button"
            style={{
              ...styles.primaryButton,
              opacity: canCompleteContractStep && _editStatus !== "saving" ? 1 : 0.5,
              background: _editBg,
              cursor: _editStatus === "saving" ? "wait" : "pointer",
            }}
            disabled={_editStatus === "saving"}
            onClick={() => {
              if (!canCompleteContractStep) return;
              void handleStageEdit("contract-review");
            }}
          >
            {_editLabel}
          </button>
        )}
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            opacity: canCompleteContractStep ? 1 : 0.45,
          }}
          onClick={() => {
            if (!canCompleteContractStep) {
              setShakeWarning(true);
              contractRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleContractContinue();
          }}
        >
          {!canCompleteContractStep
            ? (language === "ko" ? "↑ 항목을 모두 확인하세요" : "↑ Complete all checklist items")
            : copy.home.completeContractReview}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
