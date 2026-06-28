/**
 * content/tax-guide.ts — "세무 가이드" 단계 콘텐츠 SSOT.
 *
 * stageId: "tax-guide"
 * 웹 원본: apps/web/.../shared-tail/TaxGuideStage.tsx (keyActions·traps·taxSchedule·taxTips·taxCheckItems·cpaNeeded)
 * iOS 원본: apps/ios/.../Stages/TaxGuideStageView.swift (calendar·checklist·savings·cpa·warning)
 *
 * 2축 분기: isStartup(스타트업 vs SMB) × category(절세팁은 업종별).
 *   startup-tech 는 CategoryId 의 한 값이므로 byCategory 로 흡수 — SMB_BASE(전 업종 공통)
 *   + 업종별 taxTips + startup-tech 별도. 페이지별 KEY ACTION·일정·체크리스트·CPA·트랩은
 *   startup/SMB 두 갈래만 다르고 SMB 안에서는 동일(taxTips 만 업종별).
 *
 * 통일(둘 다 살리기): 신고 캘린더(iOS)·과세유형 가이드(iOS)·바로가기 링크(웹)·업종별 절세팁(웹)·
 *   CPA 기준(웹+iOS)·FAQ(양쪽 위젯) 모두 보존. FAQ·체크리스트·CPA 결정은 interactive ref.
 *
 * 2026 검증: 간이과세 1억 400만원(부가세법 시행령 §109) / 미신고 가산세 20% + 지연 일 0.022% /
 *   가공 세금계산서 가산세 3%→4% / 종소세 2026년 6/1까지 / 법인세 전 구간 1%p 인상.
 */

import type { CategoryContent, IconCard, ScheduleRow, StageContent, TrapItem } from "../schema";

const TH = "1억 400만원"; // 간이과세 기준

/* ── 페이지별 KEY ACTION ── */
const SMB_KEY_ACTIONS: Record<string, { title: string; detail: string }> = {
  calendar: {
    title: "부가세·종소세 신고 캘린더 등록 — 1건 누락 = 무신고 가산세 20%",
    detail: "일반과세: 부가세 1·7월 25일 / 간이과세: 1월 25일 / 종소세: 5월 1~31일 (2026년은 6월 1일까지). 미신고 시 무신고 20% + 납부지연 일 0.022%.",
  },
  setup: {
    title: "지금 홈택스 가입 + 사업용 카드 1개 분리 — 첫 영업일부터 적용",
    detail: "공동인증서 등록 → 세금계산서 발행 가능 + 사업용 카드로 모든 경비 결제. 개인카드 혼용은 비용처리 거부 사유.",
  },
  savings: {
    title: "매입세금계산서 받기 — VAT 환급의 시작점",
    detail: "거래처에 사업자등록증 전달 → 세금계산서 발급 요청. 카드영수증·간이영수증 5년 보관(앱 백업 권장).",
  },
  cpa: {
    title: `직원 채용·매출 ${TH}+ 시 세무사 선임 결정`,
    detail: "월 10~30만원 수임료 < 가산세·놓친 공제. 직접 신고는 1인 매장+SaaS(캐시노트·삼쩜삼) 조합만 권장.",
  },
};

const STARTUP_KEY_ACTIONS: Record<string, { title: string; detail: string }> = {
  calendar: {
    title: "2026 법인세 1%p 인상 — 신고 캘린더 미등록 = 가산세 20% + 일 0.022%",
    detail: "2026년부터 법인세율 전 구간 1%p 인상: 2억 이하 9→10% / 2-200억 19→20% / 200-3000억 21→22% / 3000억+ 24→25%. 가공 세금계산서 가산세 3%→4%. 법인세 3월 31일 / 부가세 분기 25일 / 원천세·4대보험 매월 10일.",
  },
  setup: {
    title: "홈택스 법인 가입 + 법인카드 의무 — 개인카드 = 비용 불인정",
    detail: "공동인증서 → 세금계산서 발행·법인세 신고 활성화. 모든 경비 법인카드 결제. 영수증 5년 보관 (앱 백업 권장). R&D 인건비는 별도 분류 — 25% 세액공제 받기 위해.",
  },
  savings: {
    title: "절세 핵심: 청년창업 세액감면 + 벤처인증 + R&D — 누락 시 수천만원 손실",
    detail: "① 청년창업 (만 15~34세, 병역 6년까지 차감) — 5년간 법인세/소득세 100% (수도권외+인구감소) / 75% (수도권) / 50% (수도권과밀). ② 벤처기업 인증 — 별도 5년 50% 감면 + 스톡옵션 행사이익 연 2억·누적 5억 비과세 (~2027.12.31 부여분). ③ R&D 인건비 세액공제 25% (벤처기업).",
  },
  cpa: {
    title: "본인 모드에 맞는 세무 처리 결정 — 1인 인디는 DIY OK, 시드+ 는 세무사 필수",
    detail: "인디·솔로 1인 = 자비스·삼쩜삼 SaaS + 분기당 1회 세무사 검토 (10-30만). 부트스트랩 3-5명 = 월 기장 10만+ 세무조정 30만. 시드 이상 = 월 위임 30-50만 (R&D·스톡옵션 처리).",
  },
};

/* ── 신고 캘린더 ── */
const SMB_SCHEDULE: ScheduleRow[] = [
  { date: "1월 25일", title: "부가세 확정신고·납부", detail: "개인 일반과세: 2기(7~12월) 확정신고. 간이과세: 연 1회(1~12월) 확정신고" },
  { date: "7월 25일", title: "부가세 확정신고 (1기)", detail: "개인 일반과세: 상반기(1~6월) 확정 신고·납부. 개인은 예정신고 없이 4·10월 예정고지로 납부(예정신고는 법인만)" },
  { date: "5월 1~31일", title: "종합소득세 신고", detail: "전년도 사업소득 신고. 2026년은 6월 1일까지" },
  { date: "매월 10일", title: "원천세 신고·납부", detail: "직원 급여 지급 월 다음달 10일까지" },
  { date: "매월 10일", title: "4대보험료 자동이체", detail: "자동이체 설정 권장 — 연체 시 가산금 발생" },
];

const STARTUP_SCHEDULE: ScheduleRow[] = [
  { date: "3월 31일", title: "법인세 신고·납부", detail: "전년도 사업연도 법인세. 2026년 세율 전 구간 1%p 인상 (2억↓ 9→10% 등)" },
  { date: "분기 25일", title: "부가세 신고 (법인)", detail: "법인 일반과세 분기별 (1·4·7·10월 25일) 예정·확정신고" },
  { date: "매월 10일", title: "원천세 신고·납부", detail: "임직원 급여 지급 월 다음달 10일까지" },
  { date: "매월 10일", title: "4대보험료 자동이체", detail: "자동이체 설정 권장 — 연체 시 가산금 발생" },
  { date: "5월 1~31일", title: "대표자 종합소득세", detail: "법인 대표 개인 급여·배당 등 소득 별도 신고" },
];

/* ── 트랩(페이지별 경고) ── */
const TRAP_CALENDAR: TrapItem[] = [
  { label: "기한 놓쳐도 1개월 내 기한후신고 시 무신고가산세 50% 감면", text: "1일 늦은 건 '무신고'가 아니라 '기한후신고'. 법정신고기한 후 1개월 내 신고하면 무신고가산세(최고 20%)의 50% 감면(1~3개월 30%, 3~6개월 20%). 단 납부지연가산세(미납세액 일 0.022%)는 감면 안 됨 — 빨리 신고·납부할수록 유리. 캘린더 등록 + 알림 필수." },
  { label: "2026년부터 가공 세금계산서 가산세 3% → 4% 상향", text: "허위·중복 발급 시 공급가액 기준 4% 부과. 세금계산서 받을 때 진위 확인 필수." },
];
const TRAP_SETUP_SMB: TrapItem[] = [
  { label: "현금영수증 미발급 = 거래액의 20% 가산세 (소득세법 §162의3)", text: "고객이 요청하지 않아도 의무 발급 거래(10만원 이상). 자영업 적발 1순위 항목." },
  { label: "카드단말기는 홈택스 별도 신고 의무 없음 (VAN사가 자동 등록)", text: "단말기 개통 시 VAN사가 국세청에 가맹점 데이터를 자동 전송. 사업자가 '사업장 현황신고'로 단말기를 신고하는 절차는 없음(사업장 현황신고는 면세사업자 매출신고로 별개). 직전기 수입 2,400만+ 또는 의료·약사·전문직은 신용카드가맹점 가입 의무자 — 단말기 개통으로 충족." },
];
const TRAP_SETUP_STARTUP: TrapItem[] = [
  { label: "개인카드로 경비 결제 시 비용 불인정", text: "법인 경비는 무조건 법인카드. 회식·소모품도 예외 없음. 모르고 섞어 쓰면 1년 결산 때 수백만원 차이." },
  { label: "R&D 비용 분류 안 하면 25% 세액공제 못 받음", text: "연구인력개발비를 일반 인건비와 별도 분류 + 증빙(연구 노트·코드 commit log 등) 필요." },
];
const TRAP_SAVINGS: TrapItem[] = [
  { label: "감가상각 누락 = 수년간 비용 처리 못함", text: "300만원 이상 자산은 5~10년 감가상각. 첫 해에 전액 처리하면 거부됨. 세무사 또는 SaaS 자동 계산 활용." },
  { label: "복리후생비 ≠ 접대비 — 명확히 구분", text: "직원용=복리후생비(전액), 거래처 식사=접대비(한도). 잘못 분류하면 비용 부인." },
];
const TRAP_CPA: TrapItem[] = [
  { label: "세무사 비용 < 가산세 + 놓친 공제 — 거의 항상", text: "월 10~30만원 수임료가 부담 같지만, 직원 1명 채용·매출 1억 넘으면 직접 신고 사실상 불가능. 빨리 위임이 정답." },
  { label: "세무사 한 명에 모두 맡기지 말 것 — 큰 결정은 검증 받기", text: "벤처인증·R&D 공제·해외 진출 등은 전문 세무사·세무법인에 별도 자문. 일반 세무사가 모를 수 있음." },
];

/* ── 체크리스트(게이팅) ── */
const SMB_CHECKLIST = [
  { id: "tc-hometax", label: "홈택스 사업자 회원가입", detail: "hometax.go.kr → 사업자 공동인증서 가입. 세금계산서 발행·조회 필수", required: true },
  { id: "tc-bizcard", label: "사업용 카드 별도 개설", detail: "개인 카드 혼용 시 비용처리 불인정 위험. 전용 카드 1개+ 필수", required: true },
  { id: "tc-cash", label: "현금영수증 가맹점 등록", detail: "10만원+ 거래는 의무 발급. 미발급 시 거래액의 20% 가산세 (소득세법 §162의3)", required: true },
  { id: "tc-pos", label: "신용카드 가맹점 가입 확인", detail: "단말기 설치 시 VAN사가 국세청에 가맹점을 자동 등록 — 사업자가 홈택스에 별도 신고할 의무는 없음. 정상 개통·정산 계좌만 확인" },
  { id: "tc-receipt", label: "매입 영수증 5년 보관 체계", detail: "앱(삼쩜삼·자비스·캐시노트) 또는 월별 폴더로 분류. 5년 보관 의무" },
  { id: "tc-vat-type", label: "과세유형 확인 (일반 / 간이)", detail: `★ 간이과세 기준 8천만 → ${TH} 상향 (부가가치세법 시행령 §109, 2024.1.1 시행). 직전연도 매출 ${TH} 미만이면 간이 가능` },
];
const STARTUP_CHECKLIST = [
  { id: "tc-hometax", label: "홈택스 법인 회원가입", detail: "hometax.go.kr → 법인 공동인증서 가입. 세금계산서 발행·법인세 신고 필수", required: true },
  { id: "tc-bizcard", label: "법인카드 개설 + 전 경비 결제", detail: "모든 경비를 법인카드로 결제. 개인카드 사용 시 비용 불인정 위험", required: true },
  { id: "tc-receipt", label: "비용 증빙 5년 보관 체계 수립", detail: "클라우드·SaaS 구독료, 외주비, 출장비 전량 법인카드 결제 + 5년 보관 의무", required: true },
  { id: "tc-rnd", label: "R&D 비용 분류 체계 설정", detail: "연구인력개발비 세액공제(최대 25%) 받으려면 별도 분류 + 증빙 필수" },
  { id: "tc-payroll", label: "급여·4대보험 신고 체계", detail: "직원 채용 시 매월 10일 원천세 + 4대보험 신고. 세무사 위임 권장" },
  { id: "tc-venture", label: "청년창업 + 벤처인증 세제 혜택 확인", detail: "① 청년창업중소기업 (만 15~34세, 조특법 §6) — 5년 100%/75%/50%. ② 벤처기업 (조특법 §62의2) — 별도 5년 50%. ③ 스톡옵션 연 2억·누적 5억 비과세 (~2027.12.31)" },
];

/* ── CPA 필요 시점 ── */
const SMB_CPA = [
  { condition: "직원 고용", reason: "4대보험·원천세 신고 오류 가능성 ↑. 월 수임료 < 가산세", recommend: true },
  { condition: `연 매출 ${TH}+ 예상`, reason: "★ 일반과세 전환·VAT·종소세 복잡도 급증", recommend: true },
  { condition: "인테리어 비용 3,000만원+", reason: "감가상각 스케줄 오류 시 수년간 비용 누락", recommend: true },
  { condition: "복수 사업장 운영", reason: "사업장별 세금 분리 신고 필요", recommend: true },
  { condition: "1인 매장·연 매출 5천만 미만", reason: "삼쩜삼·캐시노트 SaaS 직접 신고 OK", recommend: false },
];
const STARTUP_CPA = [
  { condition: `1인 인디 — 매출 < ${TH}`, reason: "DIY 가능. 자비스·삼쩜삼 SaaS (월 0~3만) + 분기당 세무사 검토 1회 (10-30만). 종소세 1년 1회만 신경 쓰면 됨", recommend: false },
  { condition: "부트스트랩 3-5명 / 시드 전", reason: "월 기장 10-15만 + 종소세 조정 30만. 자비스 ASSIST + 비대면 세무사 추천. R&D 25% 공제 받으려면 필수", recommend: true },
  { condition: "시드 라운드 받음 (1억+)", reason: "투자금 회계·전환사채 처리 복잡도 ↑. 월 위임 20-30만 필수. 벤처인증 후 5년 50% 감면 신청 누락 = 수천만 손실", recommend: true },
  { condition: "시리즈A 이상 / 직원 5명+", reason: "월 30-50만 또는 인하우스 회계담당자. 스톡옵션·R&D 25%·해외 자회사·옵션풀 50% 모두 위임 필수", recommend: true },
];

/* ── 업종별 절세팁 ── */
const TAX_TIPS: Record<string, IconCard[]> = {
  food: [
    { icon: "fileText", label: "식재료·소모품 전액 비용처리", detail: "원재료, 포장재, 냅킨, 위생용품 매입 세금계산서·카드영수증 5년 보관" },
    { icon: "banknote", label: "배달 수수료 전액 비용처리", detail: "배민·쿠팡이츠 수수료 = 사업 비용. 월 정산서 PDF로 보관" },
    { icon: "sparkles", label: "인테리어비 5년 감가상각", detail: "전액 즉시 공제 불가. 5년 정액/정률 감가상각으로 분산 처리" },
    { icon: "clipboard", label: "유니폼·작업복 복리후생비", detail: "직원 전용 의류는 복리후생비로 전액 처리 가능" },
  ],
  "cafe-dessert": [
    { icon: "fileText", label: "원두·식재료 매입세금계산서", detail: "거래처에 사업자등록증 전달 → 세금계산서 발급 요청. VAT 환급 핵심" },
    { icon: "sparkles", label: "에스프레소 머신 등 고가장비 감가상각", detail: "300만원+ 장비 5년+ 감가상각. 소모품(필터·청소용품)은 즉시 처리" },
    { icon: "clipboard", label: "인테리어비 5년 감가상각", detail: "카페 특성상 인테리어 비중 큼 — 감가상각 스케줄 세무사와 설정" },
    { icon: "banknote", label: "배달·픽업 포장재 전액 비용처리", detail: "컵·홀더·봉투 등 포장재 영수증 전량 보관" },
  ],
  beauty: [
    { icon: "fileText", label: "시술 소모품 전액 비용처리", detail: "필러·왁스·시술 재료 매입 즉시 전액 처리" },
    { icon: "sparkles", label: "기기·장비 감가상각", detail: "레이저·피부관리 기기 등 고가 장비 내용연수 따라 분산" },
    { icon: "clipboard", label: "위생용품 전액 비용처리", detail: "장갑·마스크·소독제 등 위생 소모품 전액" },
    { icon: "banknote", label: "고객 홍보비 (광고선전비)", detail: "SNS 광고비·이벤트·촬영비 전액 광고선전비 처리" },
  ],
  fitness: [
    { icon: "sparkles", label: "운동 기구 감가상각", detail: "대형 기구 내용연수 5~8년. 소형 소모품 즉시 비용처리" },
    { icon: "clipboard", label: "시설 유지보수 비용처리", detail: "에어컨 필터·청소·소독·환기 시설 유지비 전액" },
    { icon: "banknote", label: "강사 인건비 처리 (3.3% 원천징수)", detail: "프리랜서 강사는 원천징수 후 사업소득 지급명세서 제출" },
    { icon: "fileText", label: "음악 저작권료 (KOMCA)", detail: "월 4천원~. 미가입 시 손해배상 + 형사처벌 리스크" },
  ],
  "online-digital": [
    { icon: "banknote", label: "플랫폼 수수료 전액 비용처리", detail: "네이버·쿠팡·배민 수수료 + PG사 결제 수수료 전액 지급수수료" },
    { icon: "clipboard", label: "택배·물류비 전액 비용처리", detail: "포장재·택배비·반품 배송비 전액 운반비" },
    { icon: "fileText", label: "광고비 전액 광고선전비", detail: "네이버 키워드·인스타·쿠팡 광고 전액 광고선전비" },
    { icon: "sparkles", label: "상품 촬영·디자인 외주비", detail: "상품 사진·상세페이지 외주 제작비 전액 비용처리" },
  ],
};
// 전용 절세팁 없는 SMB 업종(학원·펫·소매·생활·공간) 폴백 — 공통 비용처리 원칙.
const SMB_DEFAULT_TIPS: IconCard[] = [
  { icon: "fileText", label: "매입세금계산서 수취", detail: "공급업체에 사업자등록증 전달 → 세금계산서 요청. 부가세 매입세액 공제 = VAT 절감 핵심" },
  { icon: "creditCard", label: "사업용 카드 경비 처리", detail: "모든 사업 경비를 사업용 카드로 — 연말 소득 차감. 회식·소모품·교통비 포함" },
  { icon: "users", label: "인건비·4대보험 비용 처리", detail: "직원 급여 + 사업주 부담 4대보험 전액 비용 처리 가능" },
  { icon: "sparkles", label: "인테리어·설비 감가상각", detail: "5~10년 감가상각으로 매년 비용 분산. 초기 투자 세금 효과 장기화" },
];
const STARTUP_TIPS: IconCard[] = [
  { icon: "sparkles", label: "청년창업 세액감면 — 만 15~34세 / 5년", detail: "조특법 §6. 수도권외+인구감소=100%, 수도권=75%, 과밀=50%. 5년간 법인세/소득세. 세무서 통해 신청(자동 X)" },
  { icon: "rosette", label: "벤처기업 인증 — 별도 5년 50% + 스톡옵션 비과세", detail: "벤처 인증 후 부여 스톡옵션 행사이익 연 2억·누적 5억 비과세 (~2027.12.31). ZUZU·Carta 로 캡테이블 관리" },
  { icon: "percent", label: "R&D 인건비 세액공제 25%", detail: "벤처기업 연구개발 인건비 25% 세액공제. 별도 분류 + 연구노트·과제계획서 5년 보관 필수" },
  { icon: "creditCard", label: "법인카드 경비 처리", detail: "모든 경비 법인카드 결제 — 개인카드 혼용 = 비용 불인정. 영수증 5년 보관" },
  { icon: "fileText", label: "매입세금계산서 수취", detail: "거래처에 세금계산서 요청 → 부가세 매입세액 공제. VAT 절감 핵심" },
];

/* ── byCategory 구성 ── */
const LABELS: Record<string, string> = {
  food: "음식점",
  "cafe-dessert": "카페·디저트",
  beauty: "미용·뷰티",
  fitness: "피트니스",
  education: "학원",
  pet: "반려동물 서비스",
  retail: "소매·리테일",
  "living-service": "생활 서비스",
  space: "공간 임대",
  "online-digital": "온라인·디지털",
  "startup-tech": "스타트업",
};

const SMB_BASE: Omit<CategoryContent, "label" | "taxTips"> = {
  pageKeyActions: SMB_KEY_ACTIONS,
  schedule: SMB_SCHEDULE,
  trapsByPage: { calendar: TRAP_CALENDAR, setup: TRAP_SETUP_SMB, savings: TRAP_SAVINGS, cpa: TRAP_CPA },
  cpaNeeded: SMB_CPA,
  taxChecklist: SMB_CHECKLIST,
};

const byCategory: Record<string, CategoryContent> = {
  "startup-tech": {
    label: LABELS["startup-tech"],
    pageKeyActions: STARTUP_KEY_ACTIONS,
    schedule: STARTUP_SCHEDULE,
    taxTips: STARTUP_TIPS,
    trapsByPage: { calendar: TRAP_CALENDAR, setup: TRAP_SETUP_STARTUP, savings: TRAP_SAVINGS, cpa: TRAP_CPA },
    cpaNeeded: STARTUP_CPA,
    taxChecklist: STARTUP_CHECKLIST,
  },
};
for (const cat of ["food", "cafe-dessert", "beauty", "fitness", "education", "pet", "retail", "living-service", "space", "online-digital"]) {
  byCategory[cat] = { label: LABELS[cat], ...SMB_BASE, taxTips: TAX_TIPS[cat] ?? SMB_DEFAULT_TIPS };
}

/* ── 단계 콘텐츠 ── */
export const TAX_GUIDE_CONTENT: StageContent = {
  stageId: "tax-guide",
  shell: {
    title: "세무 가이드",
    stageEyebrow: "단계 11 · 세무 가이드",
    helperText: "부가세·종소세 신고 캘린더 — 1건 누락 = 가산세 20%. 미신고 시 납부지연 일 0.022% 추가.",
  },
  // 페이지별 KEY ACTION 히어로를 쓰므로 단계 상단 히어로(keyAction) 생략.
  pages: [
    {
      id: "calendar",
      label: "신고 캘린더",
      sections: [
        { kind: "pageKeyAction" },
        { kind: "scheduleList", eyebrow: "연간 세금 신고 캘린더 (2026)" },
        { kind: "calloutWarning", severity: "danger", title: "2026년 가산세 주의" },
        { kind: "interactive", ref: "vatCalendarToggle", platforms: ["ios"], config: { label: "세금 신고 캘린더 등록 완료" } },
      ],
    },
    {
      id: "setup",
      label: "필수 세팅",
      sections: [
        { kind: "pageKeyAction" },
        { kind: "interactive", ref: "hometaxLink", platforms: ["ios"] },
        { kind: "interactive", ref: "taxChecklist", config: { title: "필수 세무 세팅" } },
        {
          kind: "comparisonCards",
          eyebrow: "과세유형 가이드",
          cards: [
            { title: "간이과세", criteria: `연 매출 ${TH} 미만`, desc: "부가세 면제(4,800만 미만) or 대폭 경감. 세금계산서 발행 불가 — 단, 직전연도 공급대가 4,800만원 이상 간이과세자는 발급 의무. 1월 신고 1회." },
            { title: "일반과세", criteria: `연 매출 ${TH} 이상`, desc: "부가세 10% (매입세액 공제). 세금계산서 발행 가능. 1·7월 신고 2회." },
          ],
        },
        {
          kind: "linkCards",
          eyebrow: "바로가기",
          links: [
            { name: "홈택스", desc: "사업자등록·세금계산서·신고", url: "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3", badge: "홈" },
            { name: "캐시노트 (무료)", desc: "소상공인 매출·경비 자동 분류", url: "https://cashnote.kr", badge: "캐" },
            { name: "삼쩜삼", desc: "프리랜서·소형 사업자 종소세 환급", url: "https://3o3.co.kr", badge: "3" },
            { name: "자비스 (Jobis)", desc: "스타트업·법인 회계·세무 SaaS", url: "https://jobis.co", badge: "자" },
          ],
        },
        { kind: "calloutWarning", severity: "danger" },
      ],
    },
    {
      id: "savings",
      label: "절세 포인트",
      sections: [
        { kind: "pageKeyAction" },
        { kind: "iconCardList", eyebrow: "절세 포인트", subtitle: "비용처리만 잘해도 세금이 확 달라집니다. 아래 항목을 절대 놓치지 마세요." },
        { kind: "calloutWarning", severity: "warn", title: "놓치기 쉬운 함정" },
      ],
    },
    {
      id: "cpa",
      label: "세무사 판단",
      sections: [
        { kind: "pageKeyAction" },
        { kind: "cpaCriteria", eyebrow: "세무사가 필요한 순간", subtitle: "아래 조건 중 하나라도 해당되면, 월 10~30만원 수임료가 가산세보다 압도적으로 저렴합니다." },
        {
          kind: "interactive",
          ref: "cpaDecision",
          config: {
            eyebrow: "내 세무 처리 방식 선택",
            options: [
              { value: "self", title: "직접 신고", subtitle: "1인 매장·간이과세자만 권장", desc: "캐시노트·자비스·삼쩜삼 활용. 직원 X + 매출 단순할 때만 권장", pros: ["홈택스 + 삼쩜삼 SaaS", "1인 매장·간이과세자만 권장", "무료~소액"], cost: "무료~월 수만원" },
              { value: "cpa", title: "세무사 선임", subtitle: "직원·투자·R&D 공제 시 필수", desc: "월 10~30만원. 직원·투자·R&D 공제 시 필수. 가산세 방어", pros: ["신고 대행 + 절세 컨설팅", "가산세 예방 효과", "직원 있거나 매출 1억+ 필수"], cost: "월 10~30만원" },
            ],
          },
        },
        { kind: "calloutWarning", severity: "danger" },
      ],
    },
    {
      id: "faq",
      label: "FAQ",
      sections: [{ kind: "interactive", ref: "taxFaq" }],
    },
  ],
  byCategory,
  wrapupMode: "always",
  wrapup: {
    nextStageLabel: "채용·운영 세팅",
    doneItems: [
      { label: "1. 부가세 신고 일정", detail: "1·7월(개인 일반)·1·4·7·10월(법인) 분기별 신고일 + 자동이체 셋업" },
      { label: "2. 종합소득세 시뮬", detail: "추정 매출·비용 기반 5월 종소세 신고 사전 시뮬, 누진세율 구간 점검" },
      { label: "3. 비용처리 인식", detail: "사업자 카드·홈택스 현금영수증·전자세금계산서 모든 매입 자동 수집 셋업" },
      { label: "4. 절세 포인트 점검", detail: "창업중소기업 세액감면(50~100%)·청년 추가 감면·연구개발비 세액공제 검토" },
    ],
    verifyItems: [
      "부가세 — 매입세액 공제 위해 모든 매입 「세금계산서」 받기, 간이영수증은 공제 불가",
      "종소세 — 5월 신고 누락 시 무신고 가산세 20% + 일별 지연이자, 폐업해도 신고 의무 잔존",
      "창업 세액감면 — 청년창업·수도권 외 지역 창업 시 5년간 50~100% 감면 (신청 필수, 자동 X)",
      "현금영수증 — 의무발행업종(음식·미용·헬스 등)은 건당 10만원 이상 현금거래 시 소비자 요청 없어도 의무 발급, 미발급 시 거래액 20% 가산세",
      "사업용 카드 — 홈택스 등록 시 매입세액 공제·경비 자동 분류, 미등록 시 매번 수동 입력 부담",
      "전자세금계산서 — 일정 매출 이상 의무, 종이 세금계산서 발급 시 가산세 + 매입자 공제 거부 위험",
    ],
    nextSummary: "세무 신고 일정·비용처리·절세 포인트 셋업 완료 → 채용·운영 세팅 단계로 진입",
  },
};
