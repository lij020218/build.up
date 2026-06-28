// ────────────────────────────────────────────────────────────────────────────
//  세무 FAQ SSOT (2026-05 검증)
//
//  목적:
//    - 사장님이 자주 묻는 세무 기초·중요 질문 12개를 사전 검증된 답변으로 제공
//    - AI 호출 비용·할루시네이션 회피 (99% 사장님이 같은 5~10개 반복 질문)
//    - 매칭 안 되는 질문만 AI fallback (TaxGuideStage Q&A 카드에서 사용)
//
//  업데이트 규칙:
//    - 법령·고시·국세청 공지 변경 시 즉시 갱신 (특히 1~2월 새해)
//    - 각 entry 의 lastVerified 일자 함께 수정
//    - 답변에 *변동* 정보 (세율 누진공제·기준액·과태료율) 포함 시 출처 URL 명시
//
//  검증 출처: 국세청 hometax / nts.go.kr / 국가법령정보센터 / 정책브리핑
// ────────────────────────────────────────────────────────────────────────────

export type TaxFaqCategory =
  | "registration"  // 사업자등록·과세유형
  | "vat"           // 부가세
  | "income"        // 종합소득세
  | "deduction"     // 매입세액·경비 처리
  | "compliance"    // 신고 의무·가산세
  | "saving";       // 절세·감면

export type TaxFaqEntry = {
  id: string;
  category: TaxFaqCategory;
  /** 사장님이 검색·클릭할 짧은 질문 */
  question: string;
  /** 200~400자 답변. 검증된 사실만, 변동 정보엔 *2026년 기준* 명시 */
  answer: string;
  /** 검색 매칭용 키워드 (구어·동의어) */
  keywords: string[];
  /** 출처 URL */
  sources: Array<{ label: string; url: string }>;
  /** 마지막 검증 일자 (YYYY-MM-DD) */
  lastVerified: string;
};

export const TAX_FAQ_ENTRIES: TaxFaqEntry[] = [
  // ─── 사업자등록·과세유형 ───
  {
    id: "vat-simplified-vs-general",
    category: "registration",
    question: "간이과세 vs 일반과세 — 어떻게 선택하나요?",
    answer:
      "간이과세 기준은 직전연도 매출 **1억 400만원 미만**(2024.1.1 시행, 2026년에도 동일). 부가세율은 간이 1.5~4% (소매·음식 1.5% / 제조 2% / 숙박 2.5% / 건설·서비스 3% / 부동산임대 4.5%), 일반 10%. 세금계산서 발급 의무는 직전연도 매출 4,800만원 이상 간이과세자부터. 매입세액 공제는 일반 100% 가능, 간이는 매입액의 0.5%만 공제. 매출 4,800만원 미만 간이는 부가세 납부 자체 면제.\n\n**판단 기준**: 매출이 적고 매입(인테리어·장비·재료)이 작으면 간이 유리. 매입이 크거나 거래처가 세금계산서를 요구하는 B2B면 일반 유리. 일부 간이과세 배제 지역·업종은 매출과 무관하게 일반 강제 적용.",
    keywords: ["간이", "일반", "과세", "간이과세", "일반과세", "선택", "1억 400만", "1억400만", "1억 4", "8천만"],
    sources: [
      { label: "국세청 부가가치세", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272" },
      { label: "2026년 간이과세 배제 — PortOne", url: "https://blog.portone.io/ps_2026_simplified-vat_exclusion/" },
    ],
    lastVerified: "2026-05-18",
  },

  // ─── 부가세 ───
  {
    id: "vat-filing-schedule",
    category: "vat",
    question: "부가세 신고 — 언제·어디서·어떻게?",
    answer:
      "**개인 일반과세자**: 연 2회 확정신고. 1기(1~6월)는 **7월 25일**, 2기(7~12월)는 다음해 **1월 25일**. 4월·10월에는 직전 과세기간 납부세액의 50%를 **예정고지** 자동 납부 (50만원 미만이면 생략). 직전 과세기간 공급가액 1.5억원+ 면 예정신고 의무.\n**개인 간이과세자**: 연 1회, 다음해 **1월 25일** 확정신고.\n**법인**: 연 4회 — 1·4·7·10월 25일.\n\n**신고처**: 홈택스 (hometax.go.kr) 전자신고. 모바일은 손택스. 신고 후 가상계좌·계좌이체·신용카드 납부. **자동이체**: 홈택스 [My홈택스 → 세금납부 → 계좌이체 출금계좌 신고]에서 등록.",
    keywords: ["부가세", "부가가치세", "신고", "신고일", "신고기간", "언제", "VAT", "홈택스"],
    sources: [
      { label: "국세청 부가세 신고납부기한", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2273&cntntsId=7694" },
      { label: "2026 부가세 신고기간 — 볼타", url: "https://bolta.io/insight/vat-filing-period-2026-guide" },
    ],
    lastVerified: "2026-05-18",
  },

  // ─── 종합소득세 ───
  {
    id: "income-tax-may",
    category: "income",
    question: "종합소득세 신고 — 5월 일정·대상·세율",
    answer:
      "**2026년 신고기간 5월 1일~6월 1일(월)** — 5월 31일이 일요일이라 국세기본법에 따라 1일 자동 연장. **성실신고확인대상자는 6월 30일(화)까지**. 성실신고 대상은 직전연도 수입금액 기준 — 도소매 15억 / 제조·음식점·숙박 7.5억 / 서비스(부동산임대·전문서비스 등) 5억 이상.\n\n**2026 누진세율**: 1,400만 이하 6% / 5,000만 이하 15% (공제 126만) / 8,800만 이하 24% (공제 576만) / 1.5억 이하 35% (공제 1,544만) / 3억 이하 38% (공제 1,994만) / 5억 이하 40% (공제 2,594만) / 10억 이하 42% (공제 3,594만) / 10억 초과 45% (공제 6,594만). 지방소득세 10% 별도.\n\n**경비율**: 직전연도 수입이 일정 기준 (음식·소매 3,600만 / 제조·숙박 2,400만 / 서비스 1,500만) 미만이면 단순경비율, 그 이상은 기준경비율.",
    keywords: ["종합소득세", "종소세", "5월", "세율", "누진", "성실신고", "경비율"],
    sources: [
      { label: "국세청 종소세 세율", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2227&cntntsId=7667" },
      { label: "국세청 종소세 신고납부기한", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2225&cntntsId=7665" },
      { label: "국세청 성실신고확인제도", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2234&cntntsId=7672" },
    ],
    lastVerified: "2026-05-18",
  },

  // ─── 매입세액·경비 ───
  {
    id: "business-card-registration",
    category: "deduction",
    question: "사업용 카드 — 홈택스에 등록해야 하나요?",
    answer:
      "**홈택스 등록 경로**: [전자(세금)계산서·현금영수증·신용카드] → [신용카드] → [사업용 신용카드 등록 및 조회]. **사업자 본인 명의 신용카드 최대 50개**까지 등록 (가족카드·기프트카드·충전식 선불·직불·백화점전용 제외).\n\n**효과**: 부가세 신고 시 '신용카드매출전표 수취명세서'에 일일이 입력하지 않아도 등록 카드로 결제한 매입 합계가 홈택스에 자동 집계 → **매입세액 공제 누락 방지**, 종소세 신고 시 경비 자동 분류.\n\n**개인카드 혼용 위험**: 미등록 거래는 매입 입증 자료가 분산되어 누락 가능성 높고, 사적 지출과 사업 지출이 섞이면 세무조사 시 경비 부인·가산세. 국세청은 특정 카드를 추천하지 않으며 본인 명의면 모두 등록 가능.",
    keywords: ["사업용 카드", "카드 등록", "홈택스", "신용카드", "사업자 카드"],
    sources: [
      { label: "국세청 사업용 신용카드 등록", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2475&cntntsId=7799" },
    ],
    lastVerified: "2026-05-18",
  },
  {
    id: "input-vat-deduction",
    category: "deduction",
    question: "매입세액 공제 — 어떻게 받나요?",
    answer:
      "**일반과세자만 매입세액 전액 공제 가능**. 간이과세자는 매입세액의 0.5%만. 세금계산서 발급의무 간이과세자(매출 4,800만~1억 400만 구간) 와 거래한 일반과세자는 공제 가능.\n\n**공제 받는 방법**:\n1. **세금계산서** 수취 (전자 권장, 5년 보관 의무)\n2. **사업용 신용카드·현금영수증(사업자번호)** — 홈택스 자동 집계\n3. **수입세금계산서** (수입 시)\n\n**공제 불가**: 접대비·교제비·경조사비, 가사용 지출, 면세사업 매입, **비영업용 승용차**(1,000cc 초과 일반 승용차) 구입·임차·유지비, 토지 자본적 지출, 세금계산서 미수취·기재불성실.\n\n**환급**: 매출세액 < 매입세액이면 자동. 신고기한 종료 후 30일 내 환급 (일반). 수출·시설투자 사유 시 조기환급 (15일 내).",
    keywords: ["매입세액", "공제", "환급", "부가세 환급", "비용 처리"],
    sources: [
      { label: "국세청 부가세 신고", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2273&cntntsId=7694" },
      { label: "매입세액 공제 가이드 — 클로브", url: "https://clobe.ai/blog/comprehensive-vat-deduction-guide-2026" },
      { label: "부가세 환급 시기 — 볼타", url: "https://bolta.io/insight/vat-refund-payment-schedule-guide" },
    ],
    lastVerified: "2026-05-18",
  },

  // ─── 신고 의무 ───
  {
    id: "cash-receipt-mandatory",
    category: "compliance",
    question: "현금영수증 — 의무발급 업종·기준은?",
    answer:
      "**의무발급 기준액**: 건당 **10만원 이상 현금 거래** (부가세 포함). 의무발행업종에서는 소비자 요청 없어도 자동 발급해야 하며, 신분 정보 미제공 시 국세청 지정코드 **010-000-1234** 로 자진발급 의무.\n\n**의무 업종**(시행령 별표 100여 개): 일반·무도유흥주점, 숙박업(고시원·공유숙박 포함), 출장음식 서비스업, 피부·손발톱·기타미용업, 스포츠시설(실내경기장·수영장·볼링장 등), 변호사·세무사·회계사, 학원, 골프장, 예식장, 산후조리원, 자동차 수리·중고차매매 등. **2026년 신규**: 기념품·관광민예품 소매, 사진처리업, 낚시장 운영, 기타 수상오락 서비스.\n\n**일반 음식점은 의무발행 X**이지만 소비자 요청 시 1원부터 무조건 발급. **위반 과태료**: 미발급액의 **20%**. 신고자에게 미발급액의 20% (최소 1만~최대 50만원/건) 포상금.",
    keywords: ["현금영수증", "의무발급", "10만원", "1만원", "과태료", "자진발급"],
    sources: [
      { label: "국세청 현금영수증 발급의무", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7796&mi=2471" },
      { label: "2026 의무발행 확대업종 — 정책브리핑", url: "https://www.korea.kr/multi/visualNewsView.do?newsId=148956966" },
    ],
    lastVerified: "2026-05-18",
  },
  {
    id: "electronic-tax-invoice",
    category: "compliance",
    question: "전자세금계산서 — 의무발급 기준은?",
    answer:
      "**개인사업자 의무 기준**: 직전연도 사업장별 공급가액 (과세+면세) 합계 **8,000만원 이상**. 2026년 5월 기준 적용 중. 의무 적용 시작은 기준 충족 다음해 **2기 과세기간 개시일(7월 1일)부터** 익년 6월 30일까지 1년간. 한 번 의무 대상이 되면 다음해 매출이 8천만 미만이어도 의무 유지.\n\n**법인은 100% 의무 발급**.\n\n**종이세금계산서 발급 시 가산세**: 발급자에게 공급가액의 **1%** (미발급 2%), 지연발급 1%, 미전송 0.5% (지연전송 0.3%). 수취자도 매입세액 공제는 가능하나 **0.5% 수취 가산세**.\n\n**발급 시점**: 공급일이 속하는 달의 다음 달 10일까지. **국세청 전송**: 발급일의 다음 날까지.\n\n**시스템**: 홈택스 (무료, 공동인증서·간편인증), 손택스 모바일, ARS(126), 또는 민간 ASP (더존·영림원·바로빌·볼타 등).",
    keywords: ["전자세금계산서", "전자세금", "세금계산서", "의무", "8천만", "종이"],
    sources: [
      { label: "국세청 전자세금계산서 의무", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2461&cntntsId=7787" },
      { label: "2026 의무 기준 — 볼타", url: "https://bolta.io/insight/electronic-tax-invoice-2026-mandatory-criteria" },
    ],
    lastVerified: "2026-05-18",
  },
  {
    id: "late-filing-penalty",
    category: "compliance",
    question: "무신고·과소신고 가산세 — 얼마인가요?",
    answer:
      "**신고불성실 가산세** (국세기본법 §47의2·3):\n- **무신고**: 일반 **20%** / 부정 **40%** (국제거래 부정 60%)\n- **과소신고**: 일반 **10%** / 부정 **40%**\n- 복식부기의무자 무신고: 산출세액의 20% 또는 수입금액의 0.07% 중 큰 금액\n\n**납부지연 가산세** (§47의4): 미납세액 × 미납일수 × **1일 0.022%** (연 환산 약 **8.03%**). 신고불성실과 **중복 적용**.\n\n**수정신고 감면** (과소신고분):\n- 1개월 내 90% / 3개월 내 75% / 6개월 내 50% / 1년 내 30% / 1.5년 내 20% / 2년 내 10%\n\n**기한 후 신고 감면** (무신고분):\n- 1개월 내 50% / 3개월 내 30% / 6개월 내 20%\n\n*(단, 세무조사 통지 후 신고하면 감면 불가)*\n\n**폐업 후에도** 폐업일이 속한 과세기간의 부가세·종소세 신고 의무 잔존. 폐업 신고와 세금 신고는 별개.",
    keywords: ["가산세", "무신고", "과소신고", "지연", "벌금", "수정신고"],
    sources: [
      { label: "국세청 가산세 — 종소세", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2228&cntntsId=7668" },
      { label: "국세기본법 §48", url: "https://www.law.go.kr/LSW/lsLawLinkInfo.do?lsJoLnkSeq=1000574868&chrClsCd=010202" },
    ],
    lastVerified: "2026-05-18",
  },

  // ─── 절세·감면 ───
  {
    id: "startup-tax-exemption",
    category: "saving",
    question: "창업·중소기업 세액감면 — 어떻게 신청?",
    answer:
      "조세특례제한법 §6 — 수도권 과밀억제권역 외 지역 창업 중소기업에 5년간 소득세·법인세 50% 감면.\n\n**청년 창업** (만 15~34세, 병역 최대 6년 차감), **2026.1.1 이후 창업 기준**:\n- 수도권 외 또는 수도권 인구감소지역: **100%**\n- 수도권 (과밀억제·인구감소지역 제외): **75%**\n- 수도권 과밀억제권역: **50%**\n\n**대상 업종**: 제조업·정보통신업·과학기술서비스업·건설업·물류산업·예술스포츠여가업·음식점업 등. **도소매업은 원칙 제외** (단 소기업의 수도권 외 도매업은 별도 감면), **비알코올 음료점업(카페)·부동산임대업·미용업 제외**.\n\n**자동 적용 X** — 종소세 (5월) 또는 법인세 (3월) 신고 시 **세액감면신청서** 를 과세표준 신고서와 함께 관할 세무서에 제출 필수.",
    keywords: ["세액감면", "감면", "창업", "청년", "100%", "조세특례", "감면 신청"],
    sources: [
      { label: "조세특례제한법 §6", url: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?lsJoLnkSeq=900239530&chrClsCd=010202&lsId=001584" },
      { label: "국세청 창업중소기업 감면", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6553&cntntsId=7979" },
    ],
    lastVerified: "2026-05-18",
  },
  {
    id: "youth-startup-vs-fund",
    category: "saving",
    question: "청년 세액감면 vs 청년 정책자금 — 다른 점은?",
    answer:
      "두 제도는 **법령·연령 기준이 완전히 다른 별개 제도**입니다.\n\n**청년창업 세액감면 (조특법 §6)**: 세금 감면 제도. 창업 당시 **만 15~34세** (병역기간 최대 6년 차감). 5년간 소득세·법인세 최대 100% 감면.\n\n**청년전용 창업자금 (중기부·중진공)**: 저리 대출 제도. **만 39세 이하**, 업력 3년 미만. 기업당 최대 1억원 (제조·지역특화 2억원), 2.5% 고정금리.\n\n**연령 차이 이유**: 소관 부처·정책 목적이 다름. 세제(기재부)는 조세 형평성 + 청년기본법(만 19~34세) 따름. 정책자금(중기부)은 청년 일자리·창업 활성화 목적으로 청년 정의 더 넓게.\n\n**두 제도 동시 신청·중복 수혜 가능** (서로 다른 법령). 단 정책자금 대출이자는 세무상 비용으로 처리되어 감면 후 과세표준에 영향.",
    keywords: ["청년", "감면", "자금", "39세", "34세", "차이", "청년창업"],
    sources: [
      { label: "조특법 시행령 §5", url: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lspttninfSeq=148488&chrClsCd=010202" },
      { label: "중진공 청년전용 창업자금", url: "https://www.kosmes.or.kr/nsh/SH/SBI/SHSBI004M0.do" },
    ],
    lastVerified: "2026-05-18",
  },
  {
    id: "cpa-cost-self-vs-outsource",
    category: "saving",
    question: "세무사 비용 — 직접 vs 위탁 어느게 유리?",
    answer:
      "**기장료**: 개인사업자 월 8~15만원 (평균 10만원), 법인 월 15~25만원. 매출·종업원·업종(요식업 가산)에 따라 인상.\n**세무조정료(결산료)**: 개인 종소세 30~80만원, 법인 45만원~.\n**직접 신고 도구** (삼쩜삼·자비스·캐시노트 등): 무료~월 1~2만원.\n\n**손익분기 기준**:\n- 연매출 5천만 이하 (단순경비율 영세) → **직접 신고** 유리\n- 매출 1억~2억부터 기장 대행이 절세 효과로 본전 회수\n\n**복식부기 의무자** (개인 매출 도소매 3억·음식 1.5억·서비스 7천5백만 이상)는 무기장 가산세 20% 부담 때문에 세무사 위탁이 사실상 필수.\n\n**성실신고확인 대상** (도소매 15억·음식 7.5억·서비스 5억 이상)은 세무사·회계사의 **성실신고확인서 첨부가 법적 의무** → 직접 신고 불가능.\n\n부가세만 위탁 (연 30~60만원) 도 가능하나 부가세 매입자료가 종소세 비용으로 연결되어 **통합 위탁이 일반적**.",
    keywords: ["세무사", "기장료", "조정료", "직접", "위탁", "삼쩜삼", "자비스", "캐시노트"],
    sources: [
      { label: "국세청 성실신고확인제도", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2234&cntntsId=7672" },
      { label: "세무사 수수료 표 — 한경세무회계", url: "https://www.protax.co.kr/plan" },
    ],
    lastVerified: "2026-05-18",
  },
  {
    id: "income-tax-rate-detail",
    category: "income",
    question: "종소세 세금 계산 — 예시로 알려주세요",
    answer:
      "**산출세액 = 과세표준 × 세율 − 누진공제**, **지방소득세 10% 별도** (합산 실효세율 6.6~49.5%).\n\n**2026 누진세율표**:\n| 과세표준 | 세율 | 누진공제 |\n|---|---|---|\n| 1,400만 이하 | 6% | — |\n| 5,000만 이하 | 15% | 126만 |\n| 8,800만 이하 | 24% | 576만 |\n| 1.5억 이하 | 35% | 1,544만 |\n| 3억 이하 | 38% | 1,994만 |\n| 5억 이하 | 40% | 2,594만 |\n| 10억 이하 | 42% | 3,594만 |\n| 10억 초과 | 45% | 6,594만 |\n\n**예시**: 매출 5천만 − 비용 3천만 = 과세표준 2천만 → 2천만 × 15% − 126만 = **174만원**, 지방소득세 17만 4천 → **총 191만 4천원**.\n\n매출 1억 − 비용 6천만 = 과세표준 4천만 → 4천만 × 15% − 126만 = **474만원** + 지방세 47만 4천 → **총 521만원**.",
    keywords: ["세율", "계산", "예시", "누진공제", "세금 계산", "얼마"],
    sources: [
      { label: "국세청 종소세 세율", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2227&cntntsId=7667" },
    ],
    lastVerified: "2026-05-18",
  },
];

/**
 * 사용자 질문 텍스트로 FAQ entry 매칭.
 *
 *  매칭 룰:
 *    1. keyword 정확 일치 (최우선)
 *    2. keyword 가 질문에 포함됨
 *    3. question 텍스트가 사용자 질문과 일부 겹침 (3+ 글자)
 *
 *  최대 3개까지 반환 (점수 순).
 */
export function matchTaxFaq(userQuestion: string): TaxFaqEntry[] {
  const q = userQuestion.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored = TAX_FAQ_ENTRIES.map((entry) => {
    let score = 0;
    // keyword 정확 일치
    for (const kw of entry.keywords) {
      const lk = kw.toLowerCase();
      if (q === lk) score += 100;
      else if (q.includes(lk)) score += 30;
      else if (lk.length >= 3 && lk.includes(q)) score += 20;
    }
    // question 텍스트 부분 매칭
    const lq = entry.question.toLowerCase();
    if (q.length >= 3 && lq.includes(q)) score += 15;
    // 답변 텍스트 부분 매칭 (낮은 가중치)
    if (q.length >= 4 && entry.answer.toLowerCase().includes(q)) score += 5;
    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((x) => x.entry);
}
