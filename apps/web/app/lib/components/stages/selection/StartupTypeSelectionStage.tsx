"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import { StageWrapup } from "../shared/StageWrapup";
import { KeyActionHero } from "../shared/StageActionHero";
import { isDigitalFulfillment } from "../online/DigitalFulfillmentNotice";
import {
  computeOverallScore,
  formatFranchiseCost,
  formatStartupType,
  getFranchiseBrandById,
  getFranchiseBrandsForCategory,
  getFranchiseBrandsForSubIndustry,
  getScoreColor,
  getScoreLabel,
} from "@foundone/shared";

// 2026-07-03 정합: 창업 형태 확인 항목·다음 안내를 카테고리군(cluster)별로 분기.
//   오프라인은 기존(프랜차이즈+독립) 유지, online(무재고·플랫폼)·tech(런웨이·지분)만 전용.
type StartupTypeCluster = "offline" | "online" | "tech";
const STARTUP_TYPE_VERIFY_ITEMS_KO: Record<StartupTypeCluster, string[]> = {
  offline: [
    "프랜차이즈 — 공정위 정보공개서(franchise.ftc.go.kr)에서 가맹사업자 신고 여부·매출액·폐점률 직접 확인",
    "프랜차이즈 — 가맹금 vs 인테리어비 vs 로열티 3개 항목별 별도 견적 (계약서 1식 표기 시 위반)",
    "독립창업 — 상품·인테리어·시스템 모두 본인 부담 인식, 6개월~1년 안정화 기간 자본 별도 확보",
    "프랜차이즈 — 가맹점 폐점률 20% 이상 브랜드 회피, 점주 평균 운영기간 5년 미만이면 위험",
    "프랜차이즈 — 점포환경개선(인테리어·간판)은 본사가 정당한 사유 없이 강요 불가 + 강요 시 비용 20~40% 법정 분담(가맹사업법 §12의2·시행령 §13의2) · 원부자재 공급단가 변경 조건도 계약서로 사전 확인",
    "독립창업 — 검증된 레퍼런스(타 매장 분석·상품/서비스 시연·POS 시뮬) 1개 이상 확보 후 진입",
  ],
  online: [
    "독립창업 — 상품 매입비·마케팅 툴·솔루션 비용을 본인 부담으로 인식, 초기 시드머니 + 광고비 버퍼 별도 확보 (인테리어·권리금 없음)",
    "독립창업 — 검증된 레퍼런스(경쟁 스토어 분석·아이템 소싱처 확보·판매 데이터 분석) 1개 이상 확보 후 진입",
    "위탁 vs 사입 결정 — 위탁=무재고·저마진, 사입=재고 부담·고마진. 초기 현금흐름에 맞게 선택",
    "플랫폼 의존 리스크 — 스마트스토어·쿠팡 등 수수료·노출 정책 변경에 매출이 흔들림, 자사몰·다채널 병행 검토",
    "통신판매업 신고 + 취급 품목별 인허가(식품·건강기능식품·화장품 등) 선행 확인",
    "(프랜차이즈·총판 계약 시) 공급 단가·독점권·최소주문량(MOQ)을 계약서로 확인 — 구두 합의 지양",
  ],
  tech: [
    "독립창업 — 개발·인건·인프라 비용을 본인 부담으로 인식, 매출 0 가정 최소 1년 이상 버틸 시드(런웨이) 별도 확보",
    "독립창업 — 검증된 레퍼런스(경쟁 스타트업·대체재 분석·유저 인터뷰·데이터) 1개 이상 확보 후 진입",
    "공동창업 시 역할·지분·베스팅(vesting)을 초기에 서면 합의 — 창업자 분쟁의 최다 원인",
    "시장 검증 — MVP로 '돈 내는 문제'인지 실측한 뒤 본개발 진행",
    "규제 산업 여부 — 핀테크=전자금융업, 헬스·의료기기=식약처 인증 등 사전 확인",
    "투자·정부지원 필요 시 — 예비창업패키지·TIPS 등 요건과 마일스톤을 역산해 준비",
  ],
};
const STARTUP_TYPE_NEXT_SUMMARY_KO: Record<StartupTypeCluster, string> = {
  offline: "창업 형태 확정 → 운영 모델(매장형·배달·하이브리드·무인 등) 선택 진입",
  online: "창업 형태 확정 → 운영 모델(위탁판매·국내몰 사입·해외 구매대행·자체 제조 등) 선택 진입",
  tech: "창업 형태 확정 → 사업·수익 모델(제품·수익 구조·시장 진입) 설계 진입",
};
// 2026-07-10 정합: online 안에서도 디지털 콘텐츠(무배송) 서브타입은 위탁·사입·MOQ·총판이 성립하지 않아 전용 항목.
const STARTUP_TYPE_VERIFY_ITEMS_ONLINE_DIGITAL_KO: string[] = [
  "독립창업 — 콘텐츠 제작·툴 구독·마케팅 비용을 본인 부담으로 인식, 초기 시드머니 + 광고비 버퍼 별도 확보 (재고·인테리어·권리금 없음)",
  "독립창업 — 검증된 레퍼런스(경쟁 콘텐츠 분석·제작 역량·판매 데이터) 1개 이상 확보 후 진입",
  "자체 제작 vs 외부 라이선스 — 직접 제작(고마진) 또는 외부 소스 재가공(라이선스 비용 발생) 중 선택",
  "플랫폼 의존 리스크 — 크몽·클래스101·스티비 등 수수료·노출 정책 변경에 매출이 흔들림, 자사몰(자동 전달) 병행 검토",
  "통신판매업 신고 선행 + 저작권·라이선스(폰트·이미지·음원 2차 사용권) 확보, 유료 강의·교육은 학원·평생교육시설 등록 대상 여부 확인",
  "디지털 환불 정책 명문화 — 콘텐츠 청약철회 예외 요건·이용약관을 판매 전에 고지 (분쟁·차지백 예방)",
];
const STARTUP_TYPE_NEXT_SUMMARY_ONLINE_DIGITAL_KO =
  "창업 형태 확정 → 판매 방식(플랫폼 입점·자사몰·구독형 등) 선택 진입";

export function StartupTypeSelectionStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    selectedIndustryId,
    selectedSpecialtyId,
    startupType, setStartupType,
    showFranchisePicker, setShowFranchisePicker,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    canCompleteStartupTypeStep, handleStartupTypeContinue,
    prevTraversedStage, setViewingStageId,
    resetDemo,
  } = d;

  const startupTypeRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);
  // 프랜차이즈 피커 — 검색 + 더보기(전체 노출). 상한 60 대신 30개씩 확장. (2026-07-02)
  const [franchiseSearch, setFranchiseSearch] = useState("");
  const [franchiseVisible, setFranchiseVisible] = useState(30);
  const FRANCHISE_PAGE = 30;

  const isStartupCategory = industryCategoryId === "startup-tech";
  const startupTypeCluster: StartupTypeCluster =
    isStartupCategory ? "tech"
    : industryCategoryId === "online-digital" ? "online"
    : "offline";
  const isDigitalContent = startupTypeCluster === "online" && isDigitalFulfillment(selectedIndustryId);

  // 2026-07-10: 프랜차이즈가 개념적으로 성립하지 않는 카테고리에서만 옵션을 숨김.
  //   startup-tech = 설계상 독립창업 전용 / online-digital = 등록 프랜차이즈 없고 성격상 무관.
  //   ⚠️ 오프라인 세부업종(요가·펫호텔 등)의 브랜드 DB 공백은 "데이터 문제"이지 "경로 부재"가 아니므로 숨기지 않음
  //     (프랜차이즈 카드 유지 + 브랜드 없으면 종전의 빈 피커 안내). 데이터가 채워지면 자동 노출됨.
  const franchiseAvailable = industryCategoryId !== "startup-tech" && industryCategoryId !== "online-digital";
  const startupTypeOptions: Array<"independent" | "franchise"> = franchiseAvailable
    ? ["independent", "franchise"]
    : ["independent"];

  // stale 상태 방어: 이전 오프라인 업종에서 franchise 를 골라둔 채 online-digital/tech 로 바꿔 재진입하면
  //   startupType 이 "franchise" 로 남아 예산 단계가 franchise-application 으로 오라우팅됨 → 진입 시 리셋.
  useEffect(() => {
    if (!franchiseAvailable && startupType === "franchise") {
      setStartupType(undefined);
      setSelectedFranchiseBrandId(null);
      setShowFranchisePicker(false);
    }
  }, [franchiseAvailable, startupType, setStartupType, setSelectedFranchiseBrandId, setShowFranchisePicker]);

  const startupTypeVerifyItems = isDigitalContent
    ? STARTUP_TYPE_VERIFY_ITEMS_ONLINE_DIGITAL_KO
    : STARTUP_TYPE_VERIFY_ITEMS_KO[startupTypeCluster];
  const startupTypeNextSummary = isDigitalContent
    ? STARTUP_TYPE_NEXT_SUMMARY_ONLINE_DIGITAL_KO
    : STARTUP_TYPE_NEXT_SUMMARY_KO[startupTypeCluster];

  return (
    <>
      <KeyActionHero
        ko={language === "ko"}
        action={{
          title: language === "ko"
            ? "창업 형태가 모든 절차·세무·자금원을 결정합니다"
            : "Your startup type decides every procedure, tax path, and funding source",
          detail: language === "ko"
            ? "프랜차이즈 · 자영업 · 스타트업 — 형태별로 인허가·자금·세무 경로가 완전히 다름. 한 번 선택하면 이후 로드맵이 그 형태에 맞게 분기."
            : "Franchise · independent · startup — permits, funding, and tax differ entirely by type. Once chosen, the rest of the roadmap branches to fit it.",
        }}
      />
      {!showFranchisePicker ? (
        /* ── Screen 1: Choose startup type ── */
        <>
          <div style={styles.helper}>
            {!franchiseAvailable && !isStartupCategory
              ? (language === "ko"
                  ? "이 업종은 등록된 프랜차이즈 브랜드가 없어 독립 창업으로 진행합니다."
                  : "No franchise brands are registered for this industry — you'll proceed as an independent founder.")
              : copy.home.startupTypeHelp}
          </div>
          <div ref={startupTypeRef} style={{ display: "grid", gridTemplateColumns: `repeat(${startupTypeOptions.length}, 1fr)`, gap: "10px", ...(shakeWarning ? { outline: "2px solid #b64c4c", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
            {startupTypeOptions.map((type) => {
              const ko = language === "ko";
              const selected = startupType === type;
              const config: Record<string, { icon: string; color: string; subtitle: string }> = {
                independent: {
                  icon: industryCategoryId === "startup-tech"
                    ? "M13 10V3L4 14h7v7l9-11h-7z"       // 번개
                    : "M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z", // 별
                  color: "#2563eb",
                  subtitle: industryCategoryId === "startup-tech"
                    ? (ko ? "직접 제품과 회사를 만드는 기술 스타트업입니다" : "Build a product company yourself")
                    : (ko ? "본인이 직접 브랜드와 메뉴를 구성합니다" : "Build your own brand and concept"),
                },
                franchise: {
                  icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v4m4-4v4", // 빌딩
                  color: "#7c3aed",
                  subtitle: ko ? "검증된 브랜드로 빠르게 시작합니다" : "Start fast with a proven brand",
                },
                undecided: {
                  icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 14v.01M12 8a2 2 0 012 2c0 1.5-2 2-2 3", // 물음표
                  color: "#6b7280",
                  subtitle: ko ? "아직 결정하지 않았습니다" : "Haven't decided yet",
                },
              };
              const c = config[type] ?? config.undecided;
              return (
              <button
                key={type}
                type="button"
                style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const,
                  gap: "8px", padding: "32px 20px", borderRadius: "20px", cursor: "pointer", width: "100%",
                  border: selected ? `1.5px solid ${c.color}40` : "1.5px solid rgba(0,0,0,0.04)",
                  background: selected
                    ? `linear-gradient(160deg, ${c.color}10 0%, ${c.color}06 100%)`
                    : "rgba(255,255,255,0.8)",
                  boxShadow: selected ? `0 0 0 3px ${c.color}0c, 0 4px 12px ${c.color}0a` : "none",
                  transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                onClick={() => { setStartupType(type); if (type !== "franchise") { setSelectedFranchiseBrandId(null); setShowFranchisePicker(false); } }}
              >
                <div style={{
                  width: "56px", height: "56px", borderRadius: "16px",
                  background: selected ? `${c.color}14` : "rgba(0,0,0,0.035)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke={selected ? c.color : "rgba(15,23,42,0.35)"}
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "stroke 0.2s ease" }}>
                    <path d={c.icon} />
                  </svg>
                </div>
                <div style={{ fontSize: "17px", fontWeight: 680, letterSpacing: "-0.02em", color: selected ? c.color : "#0f172a" }}>
                  {formatStartupType(type, language)}
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--muted)" }}>
                  {c.subtitle}
                </div>
              </button>
            )})}
          </div>

          <StageWrapup
            ko={language === "ko"}
            nextStageLabelKo={isStartupCategory ? "운영 모델" : "운영 모델"}
            doneItemsKo={franchiseAvailable ? [
              { label: "1. 창업 형태 검토", detail: "독립창업·프랜차이즈 2옵션 비교" },
              { label: "2. 형태별 장단점 인식", detail: "독립=자유도/리스크, 프랜차이즈=즉시런칭/로열티" },
              { label: "3. 본인 성향 매칭", detail: "운영 자유도·자본 여력·시장 검증 욕구로 자가 진단" },
              { label: "4. 형태 확정", detail: "프랜차이즈 선택 시 브랜드 후보 비교 후 1개 확정" },
            ] : [
              { label: "1. 창업 형태 확인", detail: isStartupCategory
                ? "기술 스타트업은 독립창업으로 진행"
                : "이 업종은 등록된 프랜차이즈가 없어 독립창업으로 진행" },
              { label: "2. 독립창업 장단점 인식", detail: "자유도가 높은 대신 상품·시스템·마케팅을 직접 구축" },
              { label: "3. 본인 성향 매칭", detail: "운영 자유도·자본 여력·시장 검증 욕구로 자가 진단" },
              { label: "4. 형태 확정", detail: "독립창업으로 확정 후 다음 단계 진입" },
            ]}
            verifyItemsKo={startupTypeVerifyItems}
            nextSummaryKo={startupTypeNextSummary}
          />

          <div style={styles.stageFooter}>
            {prevTraversedStage ? (
              <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
                {language === "ko" ? "← 이전 단계" : "← Back"}
              </button>
            ) : null}
            <button
              type="button"
              style={{ ...styles.primaryButton, opacity: canCompleteStartupTypeStep ? 1 : 0.45 }}
              onClick={() => {
                if (!canCompleteStartupTypeStep) {
                  setShakeWarning(true);
                  startupTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => setShakeWarning(false), 2000);
                  return;
                }
                handleStartupTypeContinue();
              }}
            >
              {canCompleteStartupTypeStep
                ? (startupType === "franchise"
                    ? (language === "ko" ? "브랜드 선택하기 →" : "Choose brand →")
                    : (language === "ko" ? "이 창업 형태로 계속" : "Use this startup type and continue"))
                : (language === "ko" ? "↑ 창업 형태를 선택하세요" : "↑ Select a startup type")}
            </button>
            <button type="button" style={styles.button} onClick={resetDemo}>
              {copy.common.resetDemo}
            </button>
          </div>
        </>
      ) : (
        /* ── Screen 2: Franchise brand picker ── */
        (() => {
          // ⚠️ 2026-06-27: 세부업종 매칭만 — categoryId 폴백 금지(무관 브랜드 오염 방지). 세부업종 없을 때만 카테고리.
          // 2026-07-02: limit 0 = 세부업종 매칭 전체 로드 → 검색 + 더보기로 전량 노출 (기존 상한 60 제거).
          const allBrands = (selectedIndustryId
            ? getFranchiseBrandsForSubIndustry(selectedIndustryId, selectedSpecialtyId, 0)
            : getFranchiseBrandsForCategory(industryCategoryId)
          ).slice().sort((a, b) => computeOverallScore(b.scores) - computeOverallScore(a.scores));
          const q = franchiseSearch.trim().toLowerCase();
          const filtered = q
            ? allBrands.filter((b) => b.name.ko.toLowerCase().includes(q) || b.name.en.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
            : allBrands;
          const shownBrands = filtered.slice(0, franchiseVisible);
          const ko = language === "ko";
          return (
            <>
              <div style={{ fontSize: "22px", fontWeight: 680, letterSpacing: "-0.03em", marginBottom: "6px" }}>
                {ko ? "프랜차이즈 브랜드 선택" : "Choose a Franchise Brand"}
              </div>
              <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                {ko
                  ? "공정거래위원회 정보공개서 기반 데이터입니다. 점수는 수익성·안정성·진입장벽·브랜드력·본사지원을 종합한 결과입니다."
                  : "Data based on KFTC disclosure. Scores combine profitability, stability, accessibility, brand power, and HQ support."}
              </div>

              {/* 검색창 + 개수 요약 (2026-07-02) */}
              {allBrands.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" as const }}>
                  <input
                    type="text"
                    value={franchiseSearch}
                    onChange={(e) => { setFranchiseSearch(e.target.value); setFranchiseVisible(FRANCHISE_PAGE); }}
                    placeholder={ko ? "브랜드 검색 (예: 맘스터치, BBQ, 메가커피)" : "Search brands (e.g., BBQ, Mom's Touch)"}
                    style={{ flex: 1, minWidth: "220px", padding: "11px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.9)", fontSize: "14px", outline: "none" }}
                  />
                  <span style={{ fontSize: "12.5px", color: "var(--muted)", whiteSpace: "nowrap" as const }}>
                    {ko
                      ? (q ? `${filtered.length}개 검색 (전체 ${allBrands.length})` : `전체 ${allBrands.length}개`)
                      : (q ? `${filtered.length} of ${allBrands.length}` : `${allBrands.length} brands`)}
                  </span>
                </div>
              )}

              {filtered.length === 0 ? (
                <div style={{ padding: "24px", borderRadius: "16px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.6)", color: "var(--muted)", textAlign: "center" }}>
                  {allBrands.length === 0
                    ? (ko ? "이 업종에는 아직 등록된 프랜차이즈가 없습니다." : "No franchise brands registered for this industry yet.")
                    : (ko ? `"${franchiseSearch.trim()}" 검색 결과가 없습니다.` : `No results for "${franchiseSearch.trim()}".`)}
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {shownBrands
                    .map((fb) => {
                    const overall = computeOverallScore(fb.scores);
                    const sel = selectedFranchiseBrandId === fb.id;
                    const scoreEntries: { key: string; label: string; value: number }[] = [
                      { key: "profit", label: ko ? "수익성" : "Profit", value: fb.scores.profitability },
                      { key: "stable", label: ko ? "안정성" : "Stability", value: fb.scores.stability },
                      { key: "access", label: ko ? "진입장벽" : "Access", value: fb.scores.accessibility },
                      { key: "brand", label: ko ? "브랜드" : "Brand", value: fb.scores.brandPower },
                      { key: "support", label: ko ? "지원" : "Support", value: fb.scores.support },
                    ];
                    return (
                      // ⚠️ 무효 HTML 방지: 카드 안에 "가맹 문의" 외부 링크(<a href>)가 있어
                      //   <button> 으로 감싸면 interactive content 중첩(React validateDOMNesting 경고
                      //   + 브라우저별 클릭/포커스 동작 불안정). div[role=button] 로 변환해 합법화.
                      <div
                        key={fb.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedFranchiseBrandId(sel ? null : fb.id)}
                        onKeyDown={(e) => {
                          // 카드 자체에 포커스가 있을 때만 토글 (내부 링크·요소 상호작용은 제외).
                          if (e.target !== e.currentTarget) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedFranchiseBrandId(sel ? null : fb.id);
                          }
                        }}
                        style={{
                          display: "grid",
                          gap: "14px",
                          padding: "20px",
                          borderRadius: "20px",
                          border: sel ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: sel ? "rgba(29,53,87,0.04)" : "rgba(255,255,255,0.82)",
                          boxShadow: sel ? "0 0 0 4px rgba(29,53,87,0.06)" : "0 2px 8px rgba(17,17,17,0.03)",
                          cursor: "pointer",
                          textAlign: "left" as const,
                          transition: "all 0.2s ease"
                        }}
                      >
                        {/* header row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>{fb.name[language]}</span>
                              {sel && <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--primary)", background: "rgba(29,53,87,0.08)", padding: "2px 8px", borderRadius: "6px" }}>{ko ? "선택됨" : "Selected"}</span>}
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>{fb.tagline[language]}</div>
                          </div>
                          {/* overall score circle */}
                          <div style={{
                            width: 52, height: 52, borderRadius: 26,
                            background: `conic-gradient(${getScoreColor(overall)} ${overall * 3.6}deg, rgba(0,0,0,0.04) 0deg)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <div style={{ width: 42, height: 42, borderRadius: 21, background: sel ? "rgba(255,255,255,0.95)" : "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1, color: getScoreColor(overall) }}>{overall}</span>
                              <span style={{ fontSize: "8px", color: "var(--muted)", marginTop: "1px" }}>{getScoreLabel(overall, language)}</span>
                            </div>
                          </div>
                        </div>

                        {/* key metrics */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                          {[
                            { label: ko ? "창업비용" : "Startup", value: formatFranchiseCost(fb.startupCostWon) },
                            { label: ko ? "연매출" : "Revenue", value: formatFranchiseCost(fb.avgAnnualRevenueWon) },
                            { label: ko ? "폐점률" : "Closure", value: `${fb.closureRate}%` },
                            { label: ko ? "매장수" : "Stores", value: fb.storeCount.toLocaleString() }
                          ].map((m) => (
                            <div key={m.label} style={{ padding: "8px 6px", borderRadius: "10px", background: sel ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.02)", textAlign: "center" }}>
                              <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em" }}>{m.value}</div>
                              <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{m.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* score bars */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                          {scoreEntries.map((s) => (
                            <div key={s.key} style={{ textAlign: "center" }}>
                              <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.04)", marginBottom: "4px", overflow: "hidden" }}>
                                <div style={{ width: `${s.value}%`, height: "100%", borderRadius: "2px", background: getScoreColor(s.value), transition: "width 0.5s ease" }} />
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--muted)" }}>{s.label}</div>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: getScoreColor(s.value) }}>{s.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* expanded detail when selected */}
                        {sel && (
                          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "grid", gap: "8px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                              {ko ? "프랜차이즈 로드맵 특이사항" : "Franchise Roadmap Notes"}
                            </div>
                            {fb.roadmapNotes[language].map((note, ni) => (
                              <div key={ni} style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--muted)", display: "flex", gap: "6px" }}>
                                <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                                <span>{note}</span>
                              </div>
                            ))}
                            <div style={{ marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" as const, fontSize: "12px", color: "var(--muted)" }}>
                              <span>{ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}원` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}</span>
                              <span>·</span>
                              <span>{ko ? `로열티 ${fb.monthlyRoyalty ? fb.monthlyRoyalty + "만/월" : "없음"}` : `Royalty ${fb.monthlyRoyalty ? fb.monthlyRoyalty + "K/mo" : "None"}`}</span>
                              <span>·</span>
                              <span>{ko ? `데이터 ${fb.dataYear}년` : `Data ${fb.dataYear}`}</span>
                            </div>
                            {fb.costSource && (
                              <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>
                                {ko ? `출처: ${fb.costSource}` : `Source: ${fb.costSource}`}
                              </div>
                            )}
                            {fb.franchiseUrl && (
                              <a
                                href={fb.franchiseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  marginTop: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "10px 16px",
                                  borderRadius: "999px",
                                  border: "none",
                                  background: "var(--primary)",
                                  color: "#fff",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  cursor: "pointer",
                                  width: "fit-content"
                                }}
                              >
                                {ko ? `${fb.name.ko} 가맹 문의 →` : `${fb.name.en} Franchise Inquiry →`}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 더보기 — 남은 매칭 브랜드 전량 노출 (2026-07-02) */}
              {filtered.length > franchiseVisible && (
                <button
                  type="button"
                  onClick={() => setFranchiseVisible((v) => v + FRANCHISE_PAGE)}
                  style={{ marginTop: "14px", width: "100%", padding: "13px", borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.9)", fontSize: "13.5px", fontWeight: 600, color: "var(--text)", cursor: "pointer" }}
                >
                  {ko
                    ? `더보기 (${Math.min(FRANCHISE_PAGE, filtered.length - franchiseVisible)}개 더 · 남은 ${filtered.length - franchiseVisible}개)`
                    : `Show more (${filtered.length - franchiseVisible} left)`}
                </button>
              )}

              <div style={styles.stageFooter}>
                <button type="button" style={styles.button} onClick={() => setShowFranchisePicker(false)}>
                  {language === "ko" ? "← 창업 형태로 돌아가기" : "← Back to startup type"}
                </button>
                <button
                  type="button"
                  style={{ ...styles.primaryButton, opacity: selectedFranchiseBrandId ? 1 : 0.45 }}
                  onClick={handleStartupTypeContinue}
                  disabled={!selectedFranchiseBrandId}
                >
                  {language === "ko"
                    ? (selectedFranchiseBrandId
                        ? `${getFranchiseBrandById(selectedFranchiseBrandId)?.name.ko}(으)로 계속`
                        : "브랜드를 선택해주세요")
                    : (selectedFranchiseBrandId
                        ? `Continue with ${getFranchiseBrandById(selectedFranchiseBrandId)?.name.en}`
                        : "Select a brand")}
                </button>
                <button type="button" style={styles.button} onClick={resetDemo}>
                  {copy.common.resetDemo}
                </button>
              </div>
            </>
          );
        })()
      )}
    </>
  );
}
