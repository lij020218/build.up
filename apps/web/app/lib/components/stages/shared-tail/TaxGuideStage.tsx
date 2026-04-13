"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";

export function TaxGuideStage() {
  const d = useDashboardCtx();
  const {
    language, copy,
    industryCategoryId,
    taxChecks, setTaxChecks,
    guideQuestion, setGuideQuestion,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError, setKnowledgeQaError,
    handleKnowledgeQuestion,
    activeGuide, activeGuideFreshness,
    prevTraversedStage, setViewingStageId,
    handleVerificationContinue,
  } = d;

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
    retail: [
      { label: "매입 원가 정확히 기록", detail: "재고 매입 세금계산서 전량 보관. 매출원가 계산 기준이 됨" },
      { label: "재고 손모·폐기 비용처리", detail: "폐기 시 사진·폐기확인서 보관하면 손실 비용처리 가능" },
      { label: "매장 집기 감가상각", detail: "진열대, 냉장쇼케이스 등 집기는 5년 감가상각" },
      { label: "플랫폼 수수료 비용처리", detail: "스마트스토어, 쿠팡 수수료 정산내역 월별 보관" },
    ],
    fitness: [
      { label: "수업 장비·운동기구 감가상각", detail: "트레드밀, 웨이트 기구 등 내용연수 5년 기준 감가상각" },
      { label: "강사 인건비 원천세 처리", detail: "프리랜서 강사 3.3% 원천징수 의무. 급여 지급 시 즉시 신고" },
      { label: "수업 영상·홍보 콘텐츠 비용처리", detail: "촬영, 편집, 플랫폼 구독비 전액 광고선전비·교육비 처리" },
      { label: "소모품(수건, 위생용품) 비용처리", detail: "회원 제공 소모품 전액 복리후생비 또는 소모품비로 처리" },
    ],
    "online-digital": [
      { label: "서버·클라우드·SaaS 비용처리", detail: "AWS, 카페24, 솔루션 구독료 전액 통신비·지급수수료로 처리" },
      { label: "플랫폼 수수료 비용처리", detail: "스마트스토어·쿠팡·크몽 수수료 정산서 월별 보관" },
      { label: "광고비 전액 비용처리", detail: "네이버·구글·메타 광고비 세금계산서 or 신용카드 영수증 보관" },
      { label: "프리랜서 용역비 원천세 처리", detail: "디자이너, 개발자 외주 시 3.3% 원천징수 후 다음달 10일 납부" },
    ],
    education: [
      { label: "교재·학습자료 매입비 비용처리", detail: "교재, 문제집, 인쇄물 구매 영수증 전량 보관. 교육비 또는 소모품비 처리" },
      { label: "강사 인건비 원천세 처리", detail: "프리랜서 강사 3.3% 원천징수 의무. 정규직은 근로소득세. 매월 10일 홈택스 신고" },
      { label: "학원 시설비 감가상각", detail: "책상·칠판·프로젝터 등 집기는 5년 감가상각. 300만원 미만 소액은 즉시 비용처리" },
      { label: "온라인 교육 플랫폼 비용처리", detail: "Zoom, 구글 워크스페이스, LMS 구독료 전액 통신비·지급수수료 처리" },
    ],
    pet: [
      { label: "반려동물 사료·소모품 전액 비용처리", detail: "사료, 간식, 위생용품, 장난감 등 매입 영수증 보관. 매출원가 또는 소모품비" },
      { label: "의료·미용 장비 감가상각", detail: "미용 테이블, 드라이어, 욕조 등 장비는 5년 기준 감가상각" },
      { label: "위생·살균 소모품 비용처리", detail: "살균제, 일회용 장갑, 타올 등 위생용품 전액 소모품비 처리" },
      { label: "수의사 자문료·위탁 비용처리", detail: "건강 관리 자문, 예방접종 위탁 시 전문가 용역비 비용처리 가능" },
    ],
    "living-service": [
      { label: "세제·세탁용품 전액 비용처리", detail: "업소용 세제, 유연제 등 소모품 매입 영수증 보관" },
      { label: "장비 수리·유지비 비용처리", detail: "세탁기·건조기 수리비, AS 비용 전액 수선유지비 처리" },
      { label: "차량 유류비 비용처리", detail: "배달·출장 서비스 시 차량 유류비, 주차비 전액 비용처리" },
    ],
    space: [
      { label: "공간 임대료 전액 비용처리", detail: "건물 월세, 관리비, 공과금 전액 임차료·지급임차료 처리" },
      { label: "인테리어·비품 감가상각", detail: "소파, 책상, 파티션 등 비품 5년 감가상각. 300만원 미만 즉시 비용" },
      { label: "Wi-Fi·CCTV 구독료 비용처리", detail: "통신비·보안 비용으로 전액 처리 가능" },
    ],
    "startup-tech": [
      { label: "클라우드·SaaS 구독료 전액 비용처리", detail: "AWS, Vercel, GitHub, Notion 등 구독료 전액 지급수수료 처리" },
      { label: "인건비 세액공제 (R&D)", detail: "연구인력개발비 세액공제 최대 25%. 벤처인증 시 추가 혜택" },
      { label: "법인카드 사용 의무화", detail: "모든 경비를 법인카드로 결제. 개인카드 사용 시 비용 불인정 위험" },
      { label: "스톡옵션 비과세 활용", detail: "벤처기업 인증 후 부여 시 행사 차익 연 5천만원 비과세" },
    ],
  };
  const isStartup = industryCategoryId === "startup-tech" || d.industryCategoryId === "startup-tech";
  const effectiveCat = isStartup ? "startup-tech" : (industryCategoryId || d.industryCategoryId || "food");
  const taxTips = taxTipsMap[effectiveCat] ?? taxTipsMap["food"];

  const taxCheckItems = isStartup ? [
    { id: "tc-hometax",  label: "홈택스 법인 회원가입",           detail: "hometax.go.kr → 법인 공동인증서 가입. 세금계산서 발행·법인세 신고 필수" },
    { id: "tc-bizcard",  label: "법인카드 개설 + 전 경비 결제",    detail: "법인카드로 모든 경비 결제. 개인카드 사용 시 비용 불인정 위험" },
    { id: "tc-receipt",  label: "비용 증빙 체계 수립",            detail: "클라우드·SaaS 구독료, 외주비, 출장비 등 전량 법인카드 결제 + 5년 보관" },
    { id: "tc-r&d",     label: "R&D 비용 분류 체계 설정",        detail: "연구인력개발비 세액공제(최대 25%) 받으려면 R&D 비용을 별도 분류해야 함" },
    { id: "tc-payroll", label: "급여·4대보험 신고 체계",          detail: "직원 채용 시 매월 10일 원천세 + 4대보험 신고. 세무사 위임 권장" },
    { id: "tc-venture", label: "벤처인증 후 세제 혜택 확인",       detail: "법인세 50% 감면, 스톡옵션 비과세 등 인증 시점부터 적용" },
  ] : [
    { id: "tc-hometax",  label: "홈택스 사업자 회원가입",       detail: "hometax.go.kr → 사업자 공인인증서 가입. 세금계산서 발행·조회 필수" },
    { id: "tc-bizcard",  label: "사업용 카드 별도 개설",         detail: "개인 카드 혼용 시 비용처리 불인정 위험. 전용 카드 1개 이상 필수" },
    { id: "tc-pos",      label: "카드단말기 국세청 신고",         detail: "홈택스 → 사업장 현황신고 → 결제단말기 신고. 미신고 시 가산세" },
    { id: "tc-cash",     label: "현금영수증 가맹점 등록",         detail: "소비자 요청 시 의무 발급. 미등록 시 건당 5% 과태료" },
    { id: "tc-receipt",  label: "매입 영수증 보관 체계 수립",     detail: "앱(삼쩜삼·자비스) 또는 월별 폴더로 분류. 5년간 보관 의무" },
    { id: "tc-vat-type", label: "과세유형 확인 (일반 / 간이)",   detail: "직전연도 매출 8,000만 원 미만이면 간이과세 가능. 세무사 상담 권장" },
  ];
  const tcChecked = taxCheckItems.filter(t => taxChecks[t.id]).length;

  const taxSchedule = isStartup ? [
    { tax: "법인세",     timing: "3월 31일",    cycle: "연 1회", note: "12월 결산법인 기준. 성실신고 시 4/30" },
    { tax: "부가가치세", timing: "1월·4월·7월·10월 25일", cycle: "분기", note: "법인은 분기별 신고 의무" },
    { tax: "원천세",    timing: "매월 10일",    cycle: "월납",  note: "직원 급여 지급 시 의무" },
    { tax: "4대보험",   timing: "매월 10일",    cycle: "월납",  note: "직원 채용 시 가입 의무" },
  ] : [
    { tax: "부가가치세", timing: "1월·7월 25일", cycle: "반기", note: "간이과세자는 1월만" },
    { tax: "종합소득세", timing: "5월 31일",    cycle: "연 1회", note: "성실신고 대상자는 6월" },
    { tax: "원천세",    timing: "매월 10일",    cycle: "월납",  note: "직원 고용 시만 해당" },
    { tax: "4대보험",   timing: "매월 10일",    cycle: "월납",  note: "직원 고용 시만 해당" },
  ];

  const cpaNeeded = isStartup ? [
    { condition: "첫 직원 고용",             reason: "4대보험·원천세·연말정산 의무 발생. 월 수임료 << 가산세" },
    { condition: "투자금 유치",              reason: "전환사채·투자금 회계 처리, 법인세 신고 복잡도 급증" },
    { condition: "R&D 세액공제 신청",         reason: "연구인력개발비 요건 충족 여부 검증 + 증빙 정리 필수" },
    { condition: "스톡옵션 부여",             reason: "행사 시점 과세·비과세 판단, 캡테이블 관리" },
  ] : [
    { condition: "직원 고용",              reason: "4대보험·원천세 신고 오류 가능성 높음. 월 수임료 < 가산세" },
    { condition: "연 매출 1억 원 초과 예상", reason: "일반과세 전환·부가세·종소세 복잡도 급증" },
    { condition: "인테리어 비용 3,000만 원+", reason: "감가상각 스케줄 오류 시 수년간 비용 누락" },
    { condition: "복수 사업장 운영",         reason: "사업장별 세금 분리 신고 필요" },
  ];

  return (
    <>
      <div style={styles.stageFooter}>
        {prevTraversedStage && (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {language === "ko" ? "← 이전 단계" : "← Back"}
          </button>
        )}
        <button type="button" style={{ ...styles.primaryButton }} onClick={() => handleVerificationContinue("tax-guide")}>
          {copy.home.markTaxReviewed}
        </button>
      </div>
      <article style={styles.step}>
        <div style={styles.stepMeta}>{language === "ko" ? "세무" : "Tax"}</div>
        <div style={styles.stepTitle}>{isStartup
          ? (language === "ko" ? "스타트업 세무·비용처리 기본 가이드" : "Startup Tax & Expense Basics")
          : (activeGuide?.title ?? (language === "ko" ? "세무 기본 가이드" : "Tax Basics Guide"))}</div>
        <div style={styles.stepBody}>{isStartup
          ? (language === "ko" ? "법인 설립 후 반드시 세팅해야 할 세무 기초와 절세 전략을 정리합니다." : "Essential tax setup and savings strategies after incorporation.")
          : (activeGuide?.summary ?? (language === "ko" ? "오픈 전후 꼭 확인해야 할 세무 기초를 단계별로 정리합니다." : "Step-by-step tax basics to review before and after opening."))}</div>
        {activeGuide && !isStartup && (
          <div style={activeGuideFreshness.tone === "critical" ? styles.criticalText : activeGuideFreshness.tone === "warning" ? styles.warningText : styles.freshnessText}>
            {activeGuideFreshness.summary}
          </div>
        )}

        {/* 신고 일정표 */}
        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "20px" }}>
          <div style={{ padding: "20px 20px 14px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Tax Calendar</div>
            <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>신고 일정표</div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>놓치면 가산세. 미리 캘린더에 등록해두세요.</div>
          </div>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
          {taxSchedule.map((row, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
              <div style={{ display: "flex", alignItems: "center", padding: "13px 20px", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14.5px", fontWeight: 560, color: "var(--text)", letterSpacing: "-0.2px" }}>{row.tax}</div>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)", marginTop: "2px" }}>{row.note}</div>
                </div>
                <div style={{ textAlign: "right" as const }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 620, color: "rgb(0,122,255)", letterSpacing: "-0.2px" }}>{row.timing}</div>
                  <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.38)", marginTop: "2px" }}>{row.cycle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 오픈 전 필수 세팅 체크리스트 */}
        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" }}>
          <div style={{ padding: "20px 20px 14px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Must-Do</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>오픈 전 필수 세팅</div>
              <div style={{ fontSize: "13px", fontWeight: 620, color: tcChecked === taxCheckItems.length ? "rgb(52,199,89)" : "rgba(0,0,0,0.35)", transition: "color 0.2s" }}>{tcChecked} / {taxCheckItems.length}</div>
            </div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>놓치면 나중에 가산세·과태료로 돌아옵니다.</div>
          </div>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
          {taxCheckItems.map((item, i) => {
            const done = !!taxChecks[item.id];
            return (
              <div key={item.id}>
                {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: done ? "rgba(52,199,89,0.04)" : "white", transition: "background 0.15s" }}
                  onClick={() => setTaxChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                  <div style={{ flexShrink: 0, marginTop: "1px", width: "22px", height: "22px", borderRadius: "7px", border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: done ? "rgb(52,199,89)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    {done && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14.5px", fontWeight: 500, color: done ? "rgba(0,0,0,0.28)" : "var(--text)", textDecoration: done ? "line-through" : "none", letterSpacing: "-0.2px", lineHeight: 1.4, transition: "all 0.15s" }}>{item.label}</div>
                    {!done && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{item.detail}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 절세 포인트 */}
        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" }}>
          <div style={{ padding: "20px 20px 14px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Tax Savings</div>
            <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>절세 포인트</div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>비용처리만 잘해도 세금이 달라집니다.</div>
          </div>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
          {taxTips.map((tip, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
              <div style={{ padding: "14px 20px" }}>
                <div style={{ fontSize: "14.5px", fontWeight: 560, color: "var(--text)", letterSpacing: "-0.2px", marginBottom: "4px" }}>{tip.label}</div>
                <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.45)", lineHeight: 1.5 }}>{tip.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 세무사가 필요한 순간 */}
        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" }}>
          <div style={{ padding: "20px 20px 14px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>When to Hire</div>
            <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>세무사가 필요한 순간</div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>이 조건 중 하나라도 해당되면 혼자 하지 마세요.</div>
          </div>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
          {cpaNeeded.map((item, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "13px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgb(255,59,48)", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", fontWeight: 570, color: "var(--text)", letterSpacing: "-0.2px" }}>{item.condition}</span>
                </div>
                <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", textAlign: "right" as const, lineHeight: 1.45 }}>{item.reason}</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Q&A */}
        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" }}>
          <div style={{ padding: "20px 20px 14px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Tax Q&A</div>
            <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>세무 질문하기</div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>세금 신고, 비용처리, 증빙 등 궁금한 점을 물어보세요.</div>
          </div>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <textarea
              value={guideQuestion}
              onChange={(e) => { setGuideQuestion(e.target.value); setKnowledgeQaText(""); setKnowledgeQaError(""); }}
              placeholder="예: 인테리어 비용은 전액 비용처리가 되나요?"
              style={{ ...styles.textarea, ...styles.aiTextarea, borderRadius: "12px" }}
            />
            <button
              type="button"
              style={{ alignSelf: "flex-end", fontSize: "14px", fontWeight: 600, color: guideQuestion.trim() ? "white" : "rgba(0,0,0,0.3)", background: guideQuestion.trim() ? "rgb(0,122,255)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: "10px", padding: "9px 18px", cursor: guideQuestion.trim() ? "pointer" : "default", transition: "all 0.2s" }}
              onClick={() => handleKnowledgeQuestion("tax")}
              disabled={!guideQuestion.trim() || knowledgeQaStatus === "loading"}
            >
              {knowledgeQaStatus === "loading" ? "답변 중..." : "질문하기"}
            </button>
            {knowledgeQaError && <div style={styles.warningText}>{knowledgeQaError}</div>}
            {(knowledgeQaText || knowledgeQaStatus === "loading") && (
              <div style={{ borderRadius: "14px", background: "rgba(0,122,255,0.04)", border: "0.5px solid rgba(0,122,255,0.15)", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,80,200,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>AI 답변 · 2026 지식베이스 기반</div>
                <div style={{ fontSize: "14px", color: "rgba(0,0,0,0.75)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
                  {knowledgeQaText}
                  {knowledgeQaStatus === "loading" && <span style={{ display: "inline-block", width: "2px", height: "14px", background: "rgba(0,122,255,0.7)", marginLeft: "2px", verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" }} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
