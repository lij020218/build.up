/**
 * 전문가 체크포인트 SSOT (2026-07-27 사장님 승인).
 *
 * 배경: 알파브라더스 시장검증 피드백 — "전문성·책임" 질문에 대한 구조적 답.
 * 우리는 전문가의 대체가 아니라 **"언제 어떤 전문가가 필요한지 아는 내비게이션"** —
 * 판단이 필요한 시점에 겁주기 없이 정확한 상담 창구로 보낸다.
 *
 * 채널 우선순위 (사장님 지시):
 *  ① 무료 공공 채널 — 전화번호(126·1350·132)를 1급으로(정부 URL보다 부패에 강함)
 *  ② 내 주변 전문가 찾기 — 네이버 지도 검색 딥링크(평점·리뷰는 지도가 보여줌 — 위조 0)
 *
 * 정직성 원칙:
 *  - "이런 경우엔 확인을 권장" 시점 안내만 — 의무 단정·겁주기 금지.
 *  - URL 전수 실측(HTTP 200, 2026-07-27) + 공식 출처 근거만. 무료 여부도 공식 근거 확인:
 *    마을세무사(행안부·정책브리핑 2026 운영 확인) / 126·1350·132(각 기관 공식) /
 *    비즈니스지원단(중기부 — 변호사·세무사·노무사·회계사·변리사 무료 자문) /
 *    정보공개서 14일 전 제공 의무(생활법령 — 가맹사업법).
 *
 * 렌더: 웹 ExpertCheckpointCard(CurrentStageView 헤더 직후) /
 *       iOS ExpertCheckpointRegistry(codegen: gen-expert-checkpoints-swift.mts) + BUStageShell.
 * stage 키: starter-data.ts stageId(케밥). 웹 currentStage.code(스네이크)는 조회 헬퍼가 정규화.
 */

export type ExpertChannel = {
  key: string;
  nameKo: string;
  nameEn: string;
  /** 무료 공공 채널 여부 — true 면 "무료" 배지 */
  free?: boolean;
  /** 전화 상담 번호 — 있으면 1급 CTA (tel:) */
  phone?: string;
  /** 공식 URL — 2026-07-27 전수 200 실측 */
  url?: string;
  /** 내 주변 찾기 — 지도 검색어(렌더러가 동네 접두 + 네이버 지도 검색 URL 구성) */
  nearbyQuery?: string;
};

// ── 채널 카탈로그 (전 항목 실측·근거 확보) ──
export const EXPERT_CHANNELS = {
  nts126: {
    key: "nts126", nameKo: "국세청 국세상담센터", nameEn: "NTS call center",
    free: true, phone: "126",
    url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6694&cntntsId=8104",
  },
  villageTax: {
    key: "villageTax", nameKo: "마을세무사 무료 상담", nameEn: "Village tax accountant (free)",
    free: true,
    url: "https://www.kacpta.or.kr/education_view/tax_laboratory/vil.asp",
  },
  moel1350: {
    key: "moel1350", nameKo: "고용노동부 상담센터", nameEn: "MOEL call center",
    free: true, phone: "1350",
    url: "https://1350.moel.go.kr/home/",
  },
  klac132: {
    key: "klac132", nameKo: "대한법률구조공단", nameEn: "Korea Legal Aid (free)",
    free: true, phone: "132",
    url: "https://www.klac.or.kr/legalstruct/telephoneConsultation.do",
  },
  bizlink: {
    key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", nameEn: "SMEs expert advisory (free)",
    free: true,
    url: "https://www.smes.go.kr/bizlink/",
  },
  ftcFranchise: {
    key: "ftcFranchise", nameKo: "공정위 정보공개서 열람", nameEn: "FTC franchise disclosure",
    free: true,
    url: "https://franchise.ftc.go.kr",
  },
  kacptaFind: {
    key: "kacptaFind", nameKo: "한국세무사회 세무사 찾기", nameEn: "Find a tax accountant",
    url: "https://www.kacpta.or.kr",
  },
  kcplaaFind: {
    key: "kcplaaFind", nameKo: "한국공인노무사회", nameEn: "Find a labor attorney",
    url: "https://www.kcplaa.or.kr",
  },
  // ── 내 주변 찾기 (후순위 — 평점·리뷰는 네이버 지도가 표시, 우리는 검색만 연결) ──
  nearbyTax:   { key: "nearbyTax",   nameKo: "내 주변 세무사무소", nameEn: "Tax offices nearby",   nearbyQuery: "세무사" },
  nearbyLabor: { key: "nearbyLabor", nameKo: "내 주변 노무사무소", nameEn: "Labor attorneys nearby", nearbyQuery: "노무사" },
  nearbyLaw:   { key: "nearbyLaw",   nameKo: "내 주변 법률사무소", nameEn: "Law offices nearby",   nearbyQuery: "변호사" },
  nearbyAdmin: { key: "nearbyAdmin", nameKo: "내 주변 행정사", nameEn: "Admin agents nearby",  nearbyQuery: "행정사" },
} satisfies Record<string, ExpertChannel> as Record<
  "nts126" | "villageTax" | "moel1350" | "klac132" | "bizlink" | "ftcFranchise"
  | "kacptaFind" | "kcplaaFind" | "nearbyTax" | "nearbyLabor" | "nearbyLaw" | "nearbyAdmin",
  ExpertChannel
>;

/** 네이버 지도 검색 URL — 동네가 있으면 "서초동 세무사"처럼 지역 한정 (2026-07-27 실측 200) */
export function nearbySearchUrl(query: string, region?: string | null): string {
  const q = [region?.trim(), query].filter(Boolean).join(" ");
  return `https://map.naver.com/p/search/${encodeURIComponent(q)}`;
}

export type ExpertCheckpoint = {
  /** 적용 단계 — starter-data.ts stageId(케밥) */
  stageIds: string[];
  /** 전문가 라벨 — "세무사" / "노무사·세무사" 등 */
  expert: { ko: string; en: string };
  /** "이런 경우엔 확인을 권장" — 시점 안내 2~3개 (겁주기·의무 단정 금지) */
  when: { ko: string; en: string }[];
  /** 채널 — 무료 공공 먼저, 내 주변 찾기 후순위 (배열 순서 = 노출 순서) */
  channels: ExpertChannel[];
};

const C = EXPERT_CHANNELS;

export const EXPERT_CHECKPOINTS: ExpertCheckpoint[] = [
  {
    stageIds: ["permit-check"],
    expert: { ko: "행정사·관할기관", en: "Admin agent" },
    when: [
      { ko: "건축물대장에 위반건축물 표시가 있거나 용도변경이 필요할 때", en: "Building violations or use-change needed" },
      { ko: "소방·위생 등 인허가 요건 해당 여부가 애매할 때", en: "Unclear permit requirements" },
    ],
    channels: [C.bizlink, C.nearbyAdmin],
  },
  {
    stageIds: ["contract-review"],
    expert: { ko: "변호사·법무사", en: "Lawyer" },
    when: [
      { ko: "보증금·권리금 규모가 커서 특약을 꼼꼼히 봐야 할 때", en: "Large deposit/premium — review special terms" },
      { ko: "원상복구 범위·렌트프리 조건이 애매하게 적혀 있을 때", en: "Vague restoration/rent-free clauses" },
    ],
    // 132 = 상가임대차 분쟁조정위원회와 같은 기관 — 임대차 단계에 최적
    channels: [C.klac132, C.bizlink, C.nearbyLaw],
  },
  {
    stageIds: ["construction-setup"],
    expert: { ko: "변호사(계약·분쟁)", en: "Lawyer (contracts)" },
    when: [
      { ko: "견적 편차가 크거나 선금 비중이 과도하게 요구될 때", en: "Wild quotes or heavy upfront payment" },
      { ko: "공사 지연·하자 발생 시 계약서상 책임이 불분명할 때", en: "Unclear liability for delays/defects" },
    ],
    channels: [C.klac132, C.bizlink, C.nearbyLaw],
  },
  {
    stageIds: ["registration-setup", "online-registration"],
    expert: { ko: "세무사", en: "Tax accountant" },
    when: [
      { ko: "간이·일반 과세 선택이 애매할 때 (매출 전망·매입 규모에 따라 유불리가 갈려요)", en: "Simplified vs general VAT unclear" },
      { ko: "공동명의·겸업 등 등록 형태가 단순하지 않을 때", en: "Joint ownership or multiple businesses" },
    ],
    channels: [C.villageTax, C.nts126, C.nearbyTax],
  },
  {
    stageIds: ["company-setup"],
    expert: { ko: "세무사·변리사", en: "Tax accountant · Patent attorney" },
    when: [
      { ko: "법인 과세유형·창업감면 해당 여부 판단이 필요할 때", en: "Corporate tax type / startup tax relief" },
      { ko: "상표·특허를 직접 출원할지 위임할지 정할 때", en: "DIY vs delegated IP filing" },
    ],
    channels: [C.bizlink, C.nts126, C.nearbyTax],
  },
  {
    stageIds: ["biz-registration"],
    expert: { ko: "세무사(기장 위탁)", en: "Tax accountant (bookkeeping)" },
    when: [
      { ko: "복식부기 의무 대상인지 확인이 필요할 때", en: "Double-entry bookkeeping obligation" },
      { ko: "기장을 직접 할지 위탁할지 비용 대비 판단이 필요할 때", en: "DIY vs delegated bookkeeping" },
    ],
    channels: [C.villageTax, C.kacptaFind, C.nearbyTax],
  },
  {
    stageIds: ["tax-guide"],
    expert: { ko: "세무사", en: "Tax accountant" },
    when: [
      { ko: "첫 부가세·종합소득세 신고를 앞두고 있을 때", en: "First VAT/income tax filing" },
      { ko: "세액공제·감면 적용 대상인지 판단이 필요할 때", en: "Tax credit/relief eligibility" },
    ],
    channels: [C.villageTax, C.nts126, C.nearbyTax],
  },
  {
    stageIds: ["hiring-setup"],
    expert: { ko: "노무사", en: "Labor attorney" },
    when: [
      { ko: "첫 근로계약서를 쓸 때 (수습·주휴·연장수당 조건)", en: "First employment contract" },
      { ko: "5인 미만/이상에 따라 적용 규정이 달라 헷갈릴 때", en: "Rules differ by headcount" },
    ],
    channels: [C.moel1350, C.kcplaaFind, C.nearbyLabor],
  },
  {
    stageIds: ["insurance-tax-setup"],
    expert: { ko: "노무사·세무사", en: "Labor · Tax" },
    when: [
      { ko: "4대보험 취득신고·두루누리 신청이 처음일 때", en: "First social insurance filing" },
      { ko: "급여 원천세 신고 방식을 정해야 할 때", en: "Payroll withholding setup" },
    ],
    channels: [C.moel1350, C.nts126, C.bizlink],
  },
  {
    stageIds: ["franchise-application"],
    expert: { ko: "가맹거래사·변호사", en: "Franchise attorney" },
    when: [
      { ko: "정보공개서를 받았을 때 (계약 14일 전 제공이 법정 의무 — 검토 시간을 쓰세요)", en: "Disclosure doc review (14-day rule)" },
      { ko: "위약금·영업지역 보호·필수구매 조항이 있을 때", en: "Penalty/territory/mandatory-purchase clauses" },
    ],
    channels: [C.ftcFranchise, C.klac132, C.bizlink],
  },
  {
    stageIds: ["startup-foundation"],
    expert: { ko: "변호사(지분·계약)", en: "Startup lawyer" },
    when: [
      { ko: "공동창업 지분·베스팅·주주간계약(SHA)을 정할 때", en: "Equity split, vesting, SHA" },
    ],
    channels: [C.bizlink, C.nearbyLaw],
  },
  {
    stageIds: ["fundraising-readiness"],
    expert: { ko: "변호사(투자계약)", en: "Investment lawyer" },
    when: [
      { ko: "텀시트·투자계약서를 받았을 때 (서명 전 검토)", en: "Term sheet / investment agreement review" },
    ],
    channels: [C.bizlink, C.nearbyLaw],
  },
];

/** stageId(케밥) 또는 code(스네이크) → 체크포인트. 없으면 null (해당 단계엔 카드 미노출). */
export function expertCheckpointForStage(stageIdOrCode: string | null | undefined): ExpertCheckpoint | null {
  if (!stageIdOrCode) return null;
  const normalized = stageIdOrCode.replaceAll("_", "-");
  return EXPERT_CHECKPOINTS.find((c) => c.stageIds.includes(normalized)) ?? null;
}
