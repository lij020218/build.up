"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";

export function TaxGuideStage() {
  const d = useDashboardCtx();
  const {
    language, copy,
    industryCategoryId,
    taxChecks, setTaxChecks,
    guideStepIndex, setGuideStepIndex,
    cpaDecision, setCpaDecision,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError, setKnowledgeQaError,
    handleKnowledgeQuestion,
    activeGuide, activeGuideFreshness,
    prevTraversedStage, setViewingStageId,
    handleVerificationContinue,
  } = d;

  const ko = language === "ko";
  const isStartup = industryCategoryId === "startup-tech";
  const pg = guideStepIndex;
  const totalPg = 4;
  const pgLabels = isStartup
    ? (ko ? ["왜 중요한가", "필수 세팅", "절세 전략", "세무사 판단"] : ["Why", "Setup", "Tax Savings", "CPA"])
    : (ko ? ["왜 중요한가", "필수 세팅", "절세 포인트", "세무사 판단"] : ["Why", "Setup", "Savings", "CPA"]);

  // ── 업종별 절세 포인트 데이터 ──
  const taxTipsMap: Record<string, { label: string; detail: string }[]> = {
    food: [
      { label: "식재료·소모품 전액 비용처리", detail: "원재료, 포장재, 냅킨, 위생용품 등 매입 세금계산서·카드영수증 필수 보관" },
      { label: "배달 수수료 비용처리", detail: "배민·쿠팡이츠 수수료는 전액 사업 비용. 월 정산서 파일로 보관" },
      { label: "인테리어비 5년 감가상각", detail: "전액 즉시 공제 불가. 5년 정액/정률 감가상각으로 분산 처리" },
      { label: "유니폼·작업복 비용처리", detail: "직원 전용 의류는 복리후생비로 전액 처리 가능" },
    ],
    "cafe-dessert": [
      { label: "원두·식재료 매입세금계산서 챙기기", detail: "거래처에 사업자등록증 전달하고 세금계산서 발급 요청. VAT 환급 핵심" },
      { label: "에스프레소 머신 등 고가장비 감가상각", detail: "300만 원 이상 장비는 5년 이상 감가상각. 소모품(필터, 청소용품)은 즉시 처리" },
      { label: "인테리어비 5년 감가상각", detail: "카페 특성상 인테리어 비중 높음. 감가상각 스케줄 세무사와 설정" },
      { label: "배달·픽업 포장재 전액 비용처리", detail: "컵, 홀더, 봉투 등 포장재 구입 영수증 전량 보관" },
    ],
    beauty: [
      { label: "시술 소모품 전액 비용처리", detail: "필러, 왁스, 시술 재료 등 소모품은 매입 즉시 전액 비용처리" },
      { label: "기기·장비 감가상각", detail: "레이저, 피부관리 기기 등 고가 장비는 내용연수에 따라 감가상각" },
      { label: "위생용품·소모품 비용처리", detail: "장갑, 마스크, 소독제 등 위생 소모품 전액 처리" },
      { label: "고객 홍보비 비용처리", detail: "SNS 광고비, 이벤트 비용, 촬영비 전액 광고선전비 처리" },
    ],
    fitness: [
      { label: "운동 기구 감가상각", detail: "대형 기구는 내용연수(5~8년) 적용. 소형 소모품은 즉시 비용처리" },
      { label: "시설 유지보수 비용처리", detail: "에어컨 필터, 청소, 소독, 환기 시설 유지비 전액 처리" },
      { label: "강사 인건비 처리", detail: "프리랜서 강사는 3.3% 원천징수 후 사업소득 지급명세서 제출" },
      { label: "음악 저작권료", detail: "매장 음악 사용료(KOMCA) 월 4천원~. 미가입 시 벌금" },
    ],
    "online-digital": [
      { label: "플랫폼 수수료 비용처리", detail: "네이버·쿠팡·배민 수수료, PG사 결제 수수료 전액 지급수수료 처리" },
      { label: "택배·물류비 비용처리", detail: "포장재, 택배비, 반품 배송비 전액 운반비/복리후생비 처리" },
      { label: "광고비 전액 비용처리", detail: "네이버 키워드, 인스타 광고, 쿠팡 광고 전액 광고선전비" },
      { label: "상품 촬영·디자인 비용", detail: "상품 사진 촬영, 상세페이지 외주 제작비 전액 비용처리" },
    ],
    "startup-tech": [
      { label: "클라우드·SaaS 구독료 전액 비용처리", detail: "AWS, Vercel, GitHub, Notion 등 구독료 전액 지급수수료 처리" },
      { label: "R&D 인건비 세액공제 (최대 25%)", detail: "연구인력개발비 세액공제. 벤처인증 시 추가 혜택. 연구소 설립 불요" },
      { label: "법인카드 사용 의무화", detail: "모든 경비를 법인카드로 결제. 개인카드 사용 시 비용 불인정 위험" },
      { label: "스톡옵션 비과세 활용", detail: "벤처기업 인증 후 부여 시 행사 차익 연 2억원(2023년~) 비과세" },
    ],
  };
  const effectiveCat = isStartup ? "startup-tech" : (industryCategoryId || "food");
  const taxTips = taxTipsMap[effectiveCat] ?? taxTipsMap["food"];

  const taxCheckItems = isStartup ? [
    { id: "tc-hometax", label: ko ? "홈택스 법인 회원가입" : "HomeTax corp registration", detail: ko ? "hometax.go.kr → 법인 공동인증서 가입. 세금계산서 발행·법인세 신고 필수" : "Required for invoices and corporate tax filing" },
    { id: "tc-bizcard", label: ko ? "법인카드 개설 + 전 경비 결제" : "Corp card for all expenses", detail: ko ? "모든 경비를 법인카드로 결제. 개인카드 사용 시 비용 불인정 위험" : "Personal card expenses may be rejected" },
    { id: "tc-receipt", label: ko ? "비용 증빙 체계 수립" : "Expense documentation system", detail: ko ? "클라우드·SaaS 구독료, 외주비, 출장비 등 전량 법인카드 결제 + 5년 보관" : "5-year retention required" },
    { id: "tc-r&d", label: ko ? "R&D 비용 분류 체계 설정" : "R&D expense classification", detail: ko ? "연구인력개발비 세액공제(최대 25%) 받으려면 R&D 비용을 별도 분류해야 함" : "Required for up to 25% R&D tax credit" },
    { id: "tc-payroll", label: ko ? "급여·4대보험 신고 체계" : "Payroll & insurance filing", detail: ko ? "직원 채용 시 매월 10일 원천세 + 4대보험 신고. 세무사 위임 권장" : "Monthly by 10th. Tax accountant recommended" },
    { id: "tc-venture", label: ko ? "벤처인증 후 세제 혜택 확인" : "Venture cert tax benefits", detail: ko ? "법인세 50% 감면, 스톡옵션 비과세 등 인증 시점부터 적용" : "50% corp tax cut, stock option tax-free from cert date" },
  ] : [
    { id: "tc-hometax", label: ko ? "홈택스 사업자 회원가입" : "HomeTax registration", detail: ko ? "hometax.go.kr → 사업자 공인인증서 가입. 세금계산서 발행·조회 필수" : "Required for tax invoices" },
    { id: "tc-bizcard", label: ko ? "사업용 카드 별도 개설" : "Dedicated business card", detail: ko ? "개인 카드 혼용 시 비용처리 불인정 위험. 전용 카드 1개 이상 필수" : "Personal card mixing risks rejected deductions" },
    { id: "tc-pos", label: ko ? "카드단말기 국세청 신고" : "POS terminal tax report", detail: ko ? "홈택스 → 사업장 현황신고 → 결제단말기 신고. 미신고 시 가산세" : "Required. Penalty for non-report" },
    { id: "tc-cash", label: ko ? "현금영수증 가맹점 등록" : "Cash receipt registration", detail: ko ? "소비자 요청 시 의무 발급. 미등록 시 건당 5% 과태료" : "5% penalty per missed receipt" },
    { id: "tc-receipt", label: ko ? "매입 영수증 보관 체계 수립" : "Expense receipt system", detail: ko ? "앱(삼쩜삼·자비스) 또는 월별 폴더로 분류. 5년간 보관 의무" : "5-year retention. Use 3o3 or Jobis app" },
    { id: "tc-vat-type", label: ko ? "과세유형 확인 (일반 / 간이)" : "Tax type confirmation", detail: ko ? "직전연도 매출 1억 400만 원 미만이면 간이과세 가능. 세무사 상담 권장" : "Simplified if revenue <₩104M" },
  ];
  const tcChecked = taxCheckItems.filter(t => taxChecks[t.id]).length;

  const taxSchedule = isStartup ? [
    { tax: ko ? "법인세" : "Corp Tax", timing: ko ? "3월 31일" : "Mar 31", cycle: ko ? "연 1회" : "Annual", note: ko ? "12월 결산법인 기준" : "Dec fiscal year" },
    { tax: ko ? "부가가치세" : "VAT", timing: ko ? "1·4·7·10월 25일" : "Jan/Apr/Jul/Oct 25", cycle: ko ? "분기" : "Quarterly", note: ko ? "법인은 분기별 의무" : "Corp = quarterly" },
    { tax: ko ? "원천세" : "Withholding", timing: ko ? "매월 10일" : "Monthly 10th", cycle: ko ? "월납" : "Monthly", note: ko ? "직원 급여 지급 시" : "When paying salary" },
    { tax: ko ? "4대보험" : "4 Insurance", timing: ko ? "매월 10일" : "Monthly 10th", cycle: ko ? "월납" : "Monthly", note: ko ? "직원 채용 시" : "When hiring" },
  ] : [
    { tax: ko ? "부가가치세" : "VAT", timing: ko ? "1·7월 25일" : "Jan/Jul 25", cycle: ko ? "반기" : "Semi-annual", note: ko ? "간이과세자는 1월만" : "Simplified: Jan only" },
    { tax: ko ? "종합소득세" : "Income Tax", timing: ko ? "5월 31일" : "May 31", cycle: ko ? "연 1회" : "Annual", note: ko ? "성실신고 대상자는 6월" : "June for diligent filers" },
    { tax: ko ? "원천세" : "Withholding", timing: ko ? "매월 10일" : "Monthly 10th", cycle: ko ? "월납" : "Monthly", note: ko ? "직원 고용 시만" : "Only with employees" },
    { tax: ko ? "4대보험" : "4 Insurance", timing: ko ? "매월 10일" : "Monthly 10th", cycle: ko ? "월납" : "Monthly", note: ko ? "직원 고용 시만" : "Only with employees" },
  ];

  const cpaNeeded = isStartup ? (ko ? [
    { condition: "첫 직원 고용", reason: "4대보험·원천세·연말정산 의무 발생. 월 수임료가 가산세보다 쌈" },
    { condition: "투자금 유치", reason: "전환사채·투자금 회계 처리, 법인세 신고 복잡도 급증" },
    { condition: "R&D 세액공제 신청", reason: "연구인력개발비 요건 충족 여부 검증 + 증빙 정리 필수" },
    { condition: "스톡옵션 부여", reason: "행사 시점 과세·비과세 판단, 캡테이블 관리" },
  ] : [
    { condition: "First employee hire", reason: "Insurance/withholding obligations arise" },
    { condition: "Investment received", reason: "Convertible notes/accounting complexity" },
    { condition: "R&D credit application", reason: "Documentation requirements" },
    { condition: "Stock option grant", reason: "Tax/non-tax determination" },
  ]) : (ko ? [
    { condition: "직원 고용", reason: "4대보험·원천세 신고 오류 가능성 높음. 월 수임료 < 가산세" },
    { condition: "연 매출 1억 원 초과 예상", reason: "일반과세 전환·부가세·종소세 복잡도 급증" },
    { condition: "인테리어 비용 3,000만 원+", reason: "감가상각 스케줄 오류 시 수년간 비용 누락" },
    { condition: "복수 사업장 운영", reason: "사업장별 세금 분리 신고 필요" },
  ] : [
    { condition: "Hire employees", reason: "Insurance/tax filing error risk high" },
    { condition: "Revenue >₩100M expected", reason: "Tax type change + complexity increase" },
    { condition: "Interior costs >₩30M", reason: "Depreciation schedule errors = years of missed deductions" },
    { condition: "Multiple locations", reason: "Separate filings per location" },
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* ── 단계 네비게이션 (이전 단계 / 확인 완료) ── */}
      <div style={styles.stageFooter}>
        {prevTraversedStage && (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {ko ? "← 이전 단계" : "← Back"}
          </button>
        )}
        <button type="button" style={styles.primaryButton} onClick={() => handleVerificationContinue("tax-guide")}>
          {copy.home.markTaxReviewed}
        </button>
      </div>

      {/* ── 페이지 네비 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>← {ko ? "이전" : "Prev"}</button>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? "#0d9488" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
              border: "none", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex((p: number) => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
        }}>{ko ? "다음" : "Next"} →</button>
      </div>

      {/* ── Page 0: 왜 중요한가 ── */}
      {pg === 0 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(13,148,136,0.08)", background: "linear-gradient(180deg, rgba(13,148,136,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0d9488" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0d9488", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
          </div>
          <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
            {isStartup
              ? (ko ? "세무 구조를 잘못 세팅하면 수천만원의 공제 혜택을 놓칩니다." : "Wrong tax setup loses tens of millions in deductions.")
              : (ko ? "초기 세무 세팅이 첫 해 세금 신고의 정확성을 결정합니다." : "Initial tax setup determines first-year filing accuracy.")}
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
            {isStartup
              ? (ko ? "R&D 세액공제(최대 25%), 스톡옵션 비과세(연 2억), 법인세 50% 감면(벤처인증) 등 스타트업만의 세제 혜택이 있습니다. 하지만 이 혜택들은 사전에 세팅을 해놓지 않으면 소급 적용이 안 됩니다. 홈택스 가입, 법인카드 설정, R&D 비용 분류 체계를 지금 잡아야 합니다." : "R&D credits (up to 25%), stock option tax-free (₩200M/yr), 50% corp tax reduction (venture cert) — but these require advance setup. No retroactive application.")
              : (ko ? "사업자등록 직후부터 세금 의무가 시작됩니다. 부가세 신고를 놓치면 가산세가 붙고, 현금영수증 미발급은 건당 5% 과태료입니다. 이 단계에서 홈택스 가입, 사업용 카드 분리, 증빙 보관 체계를 잡아야 첫 해 세금 신고가 정확합니다." : "Tax obligations begin immediately after registration. Missing VAT filing = penalty. No cash receipt = 5% per transaction fine.")}
          </div>
        </div>
        {/* 신고 일정표 */}
        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ fontSize: "13px", fontWeight: 650, color: "#0d9488", marginBottom: "8px" }}>{ko ? "주요 신고 일정" : "Key Tax Deadlines"}</div>
          {taxSchedule.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 0", gap: "12px", borderBottom: i < taxSchedule.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{row.tax}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)" }}>{row.note}</div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "#0d9488" }}>{row.timing}</div>
                <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.35)" }}>{row.cycle}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)", fontSize: "12px", color: "#dc2626", lineHeight: 1.5, fontWeight: 500 }}>
            {ko ? "⚠ 신고 기한을 놓치면 무신고 가산세 20% + 납부불성실 가산세가 추가됩니다. 캘린더에 미리 등록하세요." : "⚠ Missing deadlines = 20% non-filing penalty + late payment surcharge. Add to your calendar now."}
          </div>
        </div>
      </div>
      )}

      {/* ── Page 1: 필수 세팅 체크리스트 ── */}
      {pg === 1 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "필수 세무 세팅" : "Required Tax Setup"}</span>
            <span style={{ fontSize: "13px", fontWeight: 650, color: tcChecked === taxCheckItems.length ? "#059669" : "rgba(15,23,42,0.35)" }}>{tcChecked} / {taxCheckItems.length}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "4px" }}>
            {ko ? "각 항목을 클릭하여 완료 표시하세요. 놓치면 가산세·과태료로 돌아옵니다." : "Click each item to mark complete. Missing these = penalties."}
          </div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "flex", flexDirection: "column" as const, gap: "4px" }}>
          {taxCheckItems.map((item) => {
            const done = !!taxChecks[item.id];
            return (
              <div key={item.id} onClick={() => setTaxChecks((prev: Record<string, boolean>) => ({ ...prev, [item.id]: !prev[item.id] }))} style={{
                display: "flex", gap: "12px", alignItems: "flex-start",
                padding: "12px 14px", borderRadius: "12px", cursor: "pointer",
                background: done ? "rgba(5,150,105,0.04)" : "rgba(0,0,0,0.01)",
                border: `1px solid ${done ? "rgba(5,150,105,0.1)" : "rgba(0,0,0,0.04)"}`,
                transition: "all 0.15s ease",
              }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "7px", flexShrink: 0, marginTop: "1px",
                  border: done ? "none" : "1.5px solid rgba(0,0,0,0.15)",
                  background: done ? "#059669" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {done && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: done ? "rgba(15,23,42,0.35)" : "#0f172a", textDecoration: done ? "line-through" : "none", lineHeight: 1.4 }}>{item.label}</div>
                  {!done && <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.5, marginTop: "2px" }}>{item.detail}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "0 22px 16px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          <a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "8px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)", fontSize: "12px", fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>홈택스 ↗</a>
          <a href="https://cashnote.kr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.5)", textDecoration: "none" }}>{ko ? "캐시노트 (무료)" : "CashNote"} ↗</a>
        </div>
      </div>
      )}

      {/* ── Page 2: 절세 포인트 ── */}
      {pg === 2 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{ko ? "절세 포인트" : "Tax Savings"}</div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginBottom: "14px" }}>
          {ko ? "비용처리만 잘해도 세금이 확 달라집니다. 아래 항목을 놓치지 마세요." : "Proper expense recording dramatically changes your tax bill."}
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {taxTips.map((tip, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.06)" }}>
              <div style={{ fontSize: "14px", fontWeight: 640, color: "#059669" }}>{tip.label}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "3px" }}>{tip.detail}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ── Page 3: 세무사 판단 + Q&A ── */}
      {pg === 3 && (
      <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
        <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>{ko ? "세무사가 필요한 순간" : "When You Need a Tax Accountant"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginBottom: "12px" }}>
            {ko ? "아래 조건 중 하나라도 해당되면, 세무사 수임료(월 10~30만원)가 가산세보다 저렴합니다." : "If any condition below applies, accountant fees (₩100-300K/mo) are cheaper than penalties."}
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {cpaNeeded.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 14px", borderRadius: "12px", background: "rgba(124,58,237,0.03)", border: "1px solid rgba(124,58,237,0.06)" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", flexShrink: 0, marginTop: "7px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 640, color: "#7c3aed" }}>{item.condition}</div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "2px" }}>{item.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 세무사 선임 여부 선택 — 여기서 결정 */}
        <div style={{ borderRadius: "20px", border: "1px solid rgba(217,119,6,0.08)", background: "linear-gradient(180deg, rgba(217,119,6,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
            {ko ? "나의 세무 처리 방식을 선택하세요" : "Choose your tax handling method"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginBottom: "12px" }}>
            {ko ? "선택하면 자동 저장됩니다. 나중에 변경할 수 있어요." : "Auto-saved. You can change later."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button type="button" onClick={() => { setCpaDecision("self"); localStorage.setItem("cpaDecision", "self"); }} style={{
              padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
              background: cpaDecision === "self" ? "rgba(5,150,105,0.06)" : "rgba(0,0,0,0.01)",
              border: cpaDecision === "self" ? "2px solid #059669" : "1px solid rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: cpaDecision === "self" ? "6px solid #059669" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
                <div style={{ fontSize: "14px", fontWeight: 680, color: cpaDecision === "self" ? "#059669" : "#0f172a" }}>{ko ? "직접 신고" : "Self-file"}</div>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>
                {ko ? "캐시노트·자비스·삼쩜삼 등 SaaS 활용. 직원 없고 매출 단순하면 가능" : "Use CashNote/Jobis/3o3 SaaS. Viable if no employees and simple revenue"}
              </div>
            </button>
            <button type="button" onClick={() => { setCpaDecision("cpa"); localStorage.setItem("cpaDecision", "cpa"); }} style={{
              padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
              background: cpaDecision === "cpa" ? "rgba(37,99,235,0.06)" : "rgba(0,0,0,0.01)",
              border: cpaDecision === "cpa" ? "2px solid #2563eb" : "1px solid rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: cpaDecision === "cpa" ? "6px solid #2563eb" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
                <div style={{ fontSize: "14px", fontWeight: 680, color: cpaDecision === "cpa" ? "#2563eb" : "#0f172a" }}>{ko ? "세무사 선임" : "Hire CPA"}</div>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>
                {ko ? "월 10~30만원. 직원 채용·투자·R&D 공제 시 필수. 가산세 방어" : "₩100-300K/mo. Required for hiring, investment, R&D credits. Penalty defense"}
              </div>
            </button>
          </div>
          {cpaDecision && (
            <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "10px", background: cpaDecision === "self" ? "rgba(5,150,105,0.04)" : "rgba(37,99,235,0.04)", border: `1px solid ${cpaDecision === "self" ? "rgba(5,150,105,0.1)" : "rgba(37,99,235,0.1)"}` }}>
              <div style={{ fontSize: "12px", fontWeight: 640, color: cpaDecision === "self" ? "#059669" : "#2563eb" }}>
                ✓ {cpaDecision === "self"
                  ? (ko ? "직접 신고 선택됨 — 캐시노트나 자비스로 증빙 관리를 시작하세요" : "Self-file selected — start tracking with CashNote or Jobis")
                  : (ko ? "세무사 선임 선택됨 — 지인 추천이나 세무사닷컴에서 상담받으세요" : "CPA selected — get referrals or consult via taxaccountant.com")}
              </div>
            </div>
          )}
        </div>

        {/* 세무 Q&A */}
        <div style={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", padding: "16px 20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a", marginBottom: "8px" }}>{ko ? "세무 질문하기" : "Ask a Tax Question"}</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={knowledgeQaText}
              onChange={(e) => setKnowledgeQaText(e.target.value)}
              placeholder={ko ? "예: 간이과세자가 세금계산서를 발급할 수 있나요?" : "e.g., Can a simplified taxpayer issue tax invoices?"}
              style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "13px", outline: "none" }}
              onKeyDown={(e) => { if (e.key === "Enter" && knowledgeQaText.trim()) handleKnowledgeQuestion("tax"); }}
            />
            <button type="button" onClick={() => handleKnowledgeQuestion("tax")} disabled={!knowledgeQaText.trim() || knowledgeQaStatus === "loading"} style={{
              padding: "10px 16px", borderRadius: "10px", border: "none", background: "#0d9488", color: "#fff",
              fontSize: "13px", fontWeight: 600, cursor: knowledgeQaText.trim() ? "pointer" : "default",
              opacity: knowledgeQaText.trim() ? 1 : 0.4,
            }}>{knowledgeQaStatus === "loading" ? "..." : (ko ? "질문" : "Ask")}</button>
          </div>
          {knowledgeQaError && <div style={{ marginTop: "6px", fontSize: "12px", color: "#dc2626" }}>{knowledgeQaError}</div>}
        </div>
      </div>
      )}
    </div>
  );
}
