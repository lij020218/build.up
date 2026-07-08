/**
 * content/permit-check.ts — "인허가 사전 확인" 단계 콘텐츠 SSOT.
 *
 * stageId: "permit-check"
 * 웹 원본: apps/web/.../offline/PermitCheckPanels.tsx (KeyActionHero·StageOverview·WorkStep·negotiateFavorable·live data·permit cards)
 * iOS 원본: apps/ios/.../Stages/PermitCheckStageView.swift (overview·BUWorkStep·axisChecklist 9토글·rowSpecs·favorable)
 *
 * 6페이지: 개요 / 1.건물 / 2.사람 / 3.시설 / 4.협상 / 체크리스트.
 * 통일(둘 다 살리기): iOS의 업종별 rowSpecs(건물·사람·시설 11업종)를 WorkStep tasks 로 채택(웹이 per-cat 획득),
 *   웹의 live data(생존율 API)·permit cards(getPermitsForCategory)는 interactiveRef 로 보존(웹 우선, iOS 후속).
 *   3축 9토글 axisChecklist 는 양쪽 표시(웹 신규 획득, iOS는 게이팅).
 *
 * axis tasks 의 id(bldg-*·person-*·fac-*)는 axisChecklist 토글·게이팅과 공유.
 */

import type { CategoryContent, Favorable, StageContent, TrapItem, WorkStepTask } from "../schema";

const OFFLINE_CATS = ["food", "cafe-dessert", "beauty", "fitness", "education", "pet", "retail", "living-service", "space", "online-digital", "startup-tech"];

const LABELS: Record<string, string> = {
  food: "음식점", "cafe-dessert": "카페·디저트", beauty: "미용·뷰티", fitness: "피트니스",
  education: "학원", pet: "반려동물 서비스", retail: "소매·리테일", "living-service": "생활 서비스",
  space: "공간 임대", "online-digital": "온라인·디지털", "startup-tech": "스타트업",
};

/* ── why 접두(axisSubtitle, 업종별) + 정적 접미 ── */
const BLD_SUFFIX = " 임대인의 말 「용도 OK」는 절대 신뢰 X — 정부24 건축물대장으로만 검증합니다.";
const PER_SUFFIX = " 영업 시작 후 발견하면 즉시 영업 정지 + 과태료. 사전에 일정 잡아두면 영업 시작 지연 0.";
const FAC_SUFFIX = " 시설 미달 시 영업신고 거절 또는 영업 중 단속·과태료. 임대 전에 보강 가능 여부 확인.";

const BUILDING_SUB: Record<string, string> = {
  food: "건축물대장 — 용도·정화조·위반 표시를 확인합니다.",
  "cafe-dessert": "건축물대장 — 용도·정화조·위반 표시를 확인합니다.",
  beauty: "건축물대장 — 용도·배수·위반 표시를 확인합니다.",
  fitness: "건축물대장 — 용도·바닥 하중·위반 표시를 확인합니다.",
  education: "건축물대장 — 용도·비상구·위반 표시를 확인합니다.",
  pet: "건축물대장 — 용도·배수·위반 표시를 확인합니다.",
  "living-service": "건축물대장 — 용도·폐수·위반 표시를 확인합니다.",
  space: "건축물대장 — 용도·방음·위반 표시를 확인합니다.",
  retail: "건축물대장 — 용도·매장 면적·위반 표시를 확인합니다.",
  "online-digital": "건축물대장 — 용도·위반 표시를 확인합니다.",
  "startup-tech": "건축물대장 — 용도·위반 표시를 확인합니다.",
};
const PERSON_SUB: Record<string, string> = {
  food: "식품접객업 필수 자격(위생교육·보건증)을 사전 신청합니다.",
  "cafe-dessert": "식품접객업 필수 자격(위생교육·보건증)을 사전 신청합니다.",
  beauty: "공중위생업 필수 자격(면허·위생교육)을 확인합니다.",
  fitness: "체육시설 안전·강사 자격을 확인합니다.",
  education: "강사 자격·인력을 검증합니다.",
  pet: "동물보호법 자격·교육을 확인합니다.",
  "living-service": "공중위생업 자격·교육을 확인합니다.",
  space: "운영자 자격·교육을 점검합니다.",
  retail: "운영자 자격·교육을 점검합니다.",
  "online-digital": "운영자 자격·교육을 점검합니다.",
  "startup-tech": "운영자 자격·교육을 점검합니다.",
};
const FACILITY_SUB: Record<string, string> = {
  food: "소방·환기·전기·가스 — 임대 전 보강 가능 여부를 확인합니다.",
  "cafe-dessert": "소방·환기·전기·가스 — 임대 전 보강 가능 여부를 확인합니다.",
  beauty: "소방·환기·전기·위생설비를 임대 전 확인합니다.",
  fitness: "소방·바닥·환기·전기를 임대 전 확인합니다.",
  education: "소방·환기·전기·안전을 임대 전 확인합니다.",
  pet: "소방·방음·환기·전기를 임대 전 확인합니다.",
  "living-service": "소방·배수·전기·환기를 임대 전 확인합니다.",
  space: "소방·방음·전기·CCTV를 임대 전 확인합니다.",
  retail: "소방·조명·전기·CCTV를 임대 전 확인합니다.",
  "online-digital": "전기·인터넷·환기·CCTV를 임대 전 확인합니다.",
  "startup-tech": "전기·인터넷·환기·보안을 임대 전 확인합니다.",
};

/* ── 업종별 행(rowSpec → WorkStepTask, id 위치 고정) ── */
type Row = [string, string]; // [label, tip]
const FOODLIKE_BLD: Row[] = [
  ["건축물대장 용도 = 근린생활시설 (1·2종) 확인", "정부24 무료 발급. 음식점은 근린생활시설만 가능."],
  ["정화조 BOD 용량 충분 (30평 기준 7~10인용 이상)", "부족 시 증축 1,000만원+. 계약 전 반드시 확인."],
  ["건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 신규 영업신고 제한(시정·이행강제금 해결 또는 기존 영업 지위승계 시 가능). 계약 전 해제·승계 여부 확인."],
];
const BUILDING_ROWS: Record<string, Row[]> = {
  food: FOODLIKE_BLD,
  "cafe-dessert": FOODLIKE_BLD,
  beauty: [
    ["건축물대장 용도 = 근린생활시설 (1·2종) 확인", "공중위생업 가능 용도. 정부24 무료 발급."],
    ["배수·온수 시설 충분 (샴푸대 1대당 30L/분)", "보일러 용량 확인. 부족 시 추가 시공 200~500만원."],
    ["건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 신규 영업신고 제한(시정·이행강제금 해결 또는 기존 영업 지위승계 시 가능). 계약 전 해제·승계 여부 확인."],
  ],
  fitness: [
    ["건축물대장 용도 = 운동시설 가능 (1·2종 근린)", "체력단련장은 근린생활시설 가능. 정부24 확인."],
    ["바닥 하중 충족 (헬스 기준 400kg/㎡ 이상)", "부족 시 보강 공사 2,000만+. 임대 전 필수 확인."],
    ["건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 신고 불가. 매물 변경."],
  ],
  education: [
    ["건축물대장 용도 = 교육연구시설 또는 근린생활", "학원 = 교육연구시설. 교습소 = 근린 가능."],
    ["비상구·소화기 동선 확보 가능", "다중이용시설 + 학생 안전 의무."],
    ["건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 신고 불가."],
  ],
  pet: [
    ["건축물대장 용도 = 근린생활시설 + 동물업 가능", "지자체 조례 확인. 일부 주거지역 제한."],
    ["배수 시설 충분 (동물 미용·세척 폐수)", "폐수 처리 별도 계약 의무."],
    ["건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 등록 불가."],
  ],
  "living-service": [
    ["건축물대장 용도 = 근린생활시설 (세탁·청소 가능)", "공중위생업 분류 확인. 일부 주거 제한."],
    ["폐수 처리 시설 충분 (세탁업 의무)", "환경 기준 미달 시 영업 불가."],
    ["건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 신고 불가."],
  ],
  space: [
    ["건축물대장 용도 = 근린생활 또는 업무시설", "공유공간 = 임대업. 다중이용시설 분류."],
    ["방음·환기 기준 충족 (소음 민원 대비)", "스튜디오·파티룸 1순위 민원."],
    ["건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 임대 사고 위험."],
  ],
  retail: [
    ["건축물대장 용도 = 근린생활시설 (소매)", "매장 면적 50㎡ 이상 일부 추가 요건."],
    ["매장 출입·진열 동선 확보", "지하·2층 매장은 소방 별도 요건."],
    ["건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 영업 불가."],
  ],
  "online-digital": [
    ["건축물대장 용도 = 창고·작업장 가능", "온라인 전용은 매장 X. 창고 임대 가능 용도 확인."],
    ["택배 출입·하역 동선 확보", "일일 택배 수거 가능한 1층·진입로."],
    ["건축물대장에 '위반건축물' 표시 없음", "임대 사고 방지."],
  ],
  "startup-tech": [
    ["건축물대장 용도 = 업무시설 가능", "오피스·코워킹 입주 가능 용도."],
    ["전기·인터넷·환기 안정 (서버·다중 단말)", "용량 부족 시 별도 증설."],
    ["건축물대장에 '위반건축물' 표시 없음", "임대 사고 방지."],
  ],
};
const FOODLIKE_PER: Row[] = [
  ["식품위생교육 6시간 수강 완료 (한국외식업중앙회)", "영업신고 전 의무. 신규 3만원. 온라인 수강 가능."],
  ["보건증(건강진단결과서) 발급 완료 — 본인 + 종업원", "보건소 3,000원 (지자체별 무료~3천원) · 민간병원 1.5~3만원. 1년 유효. 갱신 시 영업 중단 주의."],
];
const PERSON_ROWS: Record<string, Row[]> = {
  food: FOODLIKE_PER,
  "cafe-dessert": FOODLIKE_PER,
  beauty: [
    ["미용사·이용사·네일·피부 면허증 확인", "국가자격. 무자격 단속 시 영업정지 + 과태료."],
    ["위생교육 3시간 수강 완료 (미용사회)", "영업신고 전 의무 — 영업신고하는 대표자(신규 창업 사장)만 이수. 직원은 면허증만 확인."],
  ],
  fitness: [
    ["강사·트레이너 자격증 (생활체육·필라테스)", "민간·국가자격 모두 가능. 응급처치 교육 권장."],
    ["체육시설 책임보험 가입", "회원 사고 대비. 분쟁 시 필수."],
  ],
  education: [
    ["정교사·강사 자격 (학원·교습소 분류별)", "교육청 등록 강사만 합법. 무자격 = 행정처분."],
    ["응급처치·안전교육 수강", "학생 안전 의무."],
  ],
  pet: [
    ["동물보건사·미용사 자격 확인 (국가/민간)", "농식품부 / 민간 미용사 자격 — 무자격 단속."],
    ["동물 폐기물 처리 계약 체결", "별도 계약 의무. 위반 시 환경법 처벌."],
  ],
  "living-service": [
    ["공중위생교육 3시간 수강 완료", "공중위생업 의무 — 영업신고하는 대표자(영업자)가 이수. 직원은 자격만 확인."],
    ["위생관리책임자 지정 (50평+)", "대형 매장 필수."],
  ],
  space: [
    ["운영자 안전교육 수강 (다중이용시설)", "사고 예방·민원 대응 매뉴얼 숙지."],
    ["응급처치 교육 권장", "긴급 상황 대비."],
  ],
  retail: [
    ["사업주 기본 교육 수강 (소상공인진흥공단)", "온라인 무료. 권장."],
    ["응급처치 교육 권장", "기본 안전."],
  ],
  "online-digital": [
    ["사업주 기본 교육 수강 (소상공인진흥공단)", "온라인 무료. 권장."],
    ["응급처치 교육 권장", "기본 안전."],
  ],
  "startup-tech": [
    ["사업주 기본 교육 수강 (소상공인진흥공단)", "온라인 무료. 권장."],
    ["응급처치 교육 권장", "기본 안전."],
  ],
};
const FOODLIKE_FAC: Row[] = [
  ["소방완비증명서 (바닥면적 100㎡↑·지하 66㎡↑) 발급 가능", "100~300만원 + 2~3주. 다중이용업소 필수. 1층 등 지상 직접 접하는 층은 면적 제외."],
  ["환기·후드 외부 덕트 설치 가능 확인", "배달전문도 조리 시 대형 후드 필요. 외부 배기 불가 매물은 불가."],
  ["전기 용량 충분 (카페 30A↑ 권장)", "에스프레소·오븐·제빙 동시 가동 시 30A 필수. 가스레인지·냉장고 포함 계산."],
  ["가스 시설 한국가스안전공사 검사 가능 확인", "임대인이 '검사 통과'라 해도 직접 증명서 확인 필수."],
];
const FACILITY_ROWS: Record<string, Row[]> = {
  food: FOODLIKE_FAC,
  "cafe-dessert": FOODLIKE_FAC,
  beauty: [
    ["기본 소방시설(소화기·비상구·유도등) 확인", "미용업은 다중이용업 미해당 — 소방완비증명서 대상 아님(면적·층수 무관). 소화기 비치·피난 동선만 점검."],
    ["환기·약품 배출 (펌·염색제) 가능", "환기량 충분치 않으면 시술 불가."],
    ["전기 용량 (드라이·고주파 동시 가동)", "분전반 20A+ 권장."],
    ["위생설비·온수·세면대 충분", "샴푸대 1대 + 손세정 1대 최소."],
  ],
  fitness: [
    ["소방완비증명서 (다중이용시설)", "지하·2층 의무."],
    ["바닥 충격흡수 (우레탄/고무 매트)", "아래층 민원 1순위. 시공 필수."],
    ["환기 (시간당 6회+) 가능", "땀·CO2 배출 의무."],
    ["전기 용량 (카디오 머신·음향)", "분전반 30A+ 권장."],
  ],
  education: [
    ["소방완비증명서·비상구·소화기", "학생 안전 의무."],
    ["환기 (CO2 1000ppm 이하)", "다인 학습 환경."],
    ["전기 (프로젝터·노트북 다수)", "분전반 20A+."],
    ["CCTV·출입통제 설치 가능", "학부모 신뢰·안전 의무."],
  ],
  pet: [
    ["소방완비증명서", "100㎡↑ 의무."],
    ["방음 (짖음 차단 다중 레이어)", "이웃 민원 1순위."],
    ["환기 (냄새 배출 강력)", "환기 부족 = 영업 신뢰 손실."],
    ["전기 (미용 장비·드라이 동시)", "분전반 20A+."],
  ],
  "living-service": [
    ["소방완비증명서 (필요 시)", "코인세탁·매장 운영 시."],
    ["배수 시설 (산업용 세탁기 폐수)", "환경 기준 충족."],
    ["전기 (세탁·건조기 단상/3상)", "30~50A 권장."],
    ["환기·소음 (이웃 민원 대비)", "기계 소음 차단."],
  ],
  space: [
    ["소방완비증명서·비상구", "다중이용시설 의무."],
    ["방음 (스튜디오·파티룸 의무)", "이웃 민원 1순위."],
    ["전기 (조명·음향·기자재 동시)", "분전반 20A+."],
    ["CCTV·스마트락 (무인 운영 시)", "사고·분쟁 대비."],
  ],
  retail: [
    ["소방완비증명서 (100㎡↑)", "다중이용시설."],
    ["조명 (상품 강조·매장 동선)", "분전반 15A+."],
    ["전기 (POS·CCTV·조명)", "분전반 15A+."],
    ["CCTV·도난방지", "오프라인 리테일 필수."],
  ],
  "online-digital": [
    ["전기 (창고·작업장 안정 전원)", "프린터·라벨기 + 작업등."],
    ["인터넷 (백본 안정)", "주문 동기화 끊김 사고."],
    ["환기 (작업 환경)", "포장 작업 장기 체류."],
    ["CCTV (재고 도난·분쟁 대비)", "택배 사진 자동 저장 워크플로."],
  ],
  "startup-tech": [
    ["전기 (다중 단말·서버)", "분전반 30A+ 권장."],
    ["인터넷 (안정·백업 회선)", "장애 시 즉시 백업."],
    ["환기 (다중 인원 작업)", "CO2 1000ppm 이하."],
    ["보안 출입 (카드·생체)", "IP 보호·고객 데이터 보안."],
  ],
};

const FAVORABLE: Record<string, Favorable> = {
  food: { context: "음식점 / F&B", recommendation: "정화조 BOD 부족 매물은 협상 X — 무조건 패스", rationale: "정화조 증축은 건물주 동의 + 1,000~3,000만원 + 1~2개월 공사. 환기 덕트 외부 배기 불가 매물도 패스." },
  "cafe-dessert": { context: "카페 / 디저트", recommendation: "「전기 30A↑ + 급배수 가능」 임대 전 확답 받기", rationale: "머신·제빙기 동시 가동 시 20A 차단기 빈번. 임대인 확답 없으면 매물 변경." },
  beauty: { context: "미용 / 뷰티", recommendation: "면허자 의존 X(본인 취득·2명+) · 배수·온수 부족은 임대인 분담 특약", rationale: "채용 면허자 퇴사 시 즉시 무자격 영업. 샴푸대 추가 시공 200~500만원, 펌·염색 환기 미달 매물은 패스." },
  retail: { context: "리테일 / 일반 소매", recommendation: "건축물 「판매시설」·「근린생활시설」 만 확인하면 끝", rationale: "건강식·주류·의약품·전자담배 외엔 인허가 거의 없음. 사업자등록만으로 시작." },
  fitness: { context: "필라테스·요가·PT", recommendation: "층고 2.5m 이하·바닥 하중 부족은 패스", rationale: "PT·필라 3m+, 요가 2.7m+ 권장. 바닥 보강은 2,000만원+ — 협상보다 매물 변경이 빠름." },
  education: { context: "학원 / 교육", recommendation: "건축물 용도 「교육연구시설」·「근린생활시설(학원)」 + 100㎡↑ 소방완비", rationale: "용도 미일치 시 학원 등록 거부. 어린이 학원은 안전 기준 엄격." },
  pet: { context: "펫 미용·호텔·훈련", recommendation: "주거 인접 매물 X — 상가 단독 입지 우선", rationale: "짖음·털 알레르기 민원으로 시간 제한·계약 해지 사례 다수." },
  "living-service": { context: "세탁·청소·수리", recommendation: "특수 업종 신고/등록 의무 사전 확인", rationale: "세탁업·인쇄업은 시·구청 별도 신고 절차. 일반 청소는 면제." },
  space: { context: "공간 임대 (스튜디오·파티룸·연습실)", recommendation: "「숙박 가능 여부 + 소음 허용」 명문화", rationale: "소음 분쟁 1순위. 영업시간·데시벨 제한 특약 안 적으면 후일 분쟁." },
  "online-digital": { context: "온라인·디지털", recommendation: "부족 시설은 「임대인 1/2 부담 + 원상회복 의무 제외(시설물 인수·현 상태 인도)」 특약으로", rationale: "사인 전 특약 명시. 보강 불가하거나 임대인이 거부하면 다른 매물이 낫습니다." },
  "startup-tech": { context: "스타트업", recommendation: "부족 시설은 「임대인 1/2 부담 + 원상회복 의무 제외(시설물 인수·현 상태 인도)」 특약으로", rationale: "사인 전 특약 명시. 보강 불가하거나 임대인이 거부하면 다른 매물이 낫습니다." },
};

const BLD_WATCH_BASE: TrapItem = { label: "위반건축물 표시 = 신규 영업신고 제한 (시정·승계로 해제 가능)", text: "건축물대장에 「위반건축물」 표기 시 신규 영업신고가 제한됩니다. 다만 위반사항 시정(이행강제금 해결 포함) 또는 기존 영업의 지위승계 시 신고 가능 — 계약 전 해제·승계 가능 여부를 반드시 확인. 불확실하면 매물 변경." };
const BLD_WATCH_SEPTIC: TrapItem = { label: "정화조 용량 부족 = 증축 1,000만원+ 또는 매물 변경", text: "건물주 동의 + 시·군청 신고 + 1~2개월 공사. 안 되면 다른 매물." };
const PER_WATCH: TrapItem = { label: "면허자 채용에만 의존 = 퇴사 시 즉시 무자격 영업", text: "본인이 면허 없을 때 채용 면허자가 퇴사하면 그날부터 무자격 영업. 본인 면허 취득 또는 2명+ 채용으로 분산." };
const FAC_WATCH_FOOD: TrapItem[] = [
  { label: "외부 환기 덕트 불가 매물 = 음식점 운영 불가능", text: "공동주택·창문 없음·옥상 미사용 매물에서는 후드 설치 불가. 임대 전 외부 배기 가능 여부 확답 필수." },
  { label: "가스시설 검사 미통과 = 영업신고 거절", text: "한국가스안전공사 검사 필수. 임대인이 「검사 통과 매물」이라 해도 직접 증명서 확인." },
];
const FAC_WATCH_OTHER: TrapItem[] = [
  { label: "소방완비증명서 없이 영업 = 단속·과태료", text: "다중이용업(휴게·일반음식점 100㎡↑, 학원 등)은 소방완비 의무. 내 업종이 다중이용업인지 관할 소방서에 발급 대상 여부부터 확인." },
];
// 미용업은 다중이용업 미해당 → 소방완비 대상 아님 (2026-07-02 정정).
const FAC_WATCH_BEAUTY: TrapItem[] = [
  { label: "미용업은 소방완비증명서 대상 아님 — 잘못된 안내 주의", text: "미용업(일반 미용실)은 다중이용업에 해당하지 않아 면적·층수와 무관하게 소방시설등완비증명서 발급 의무가 없습니다. 소화기 비치·피난 동선 등 기본 소방시설만 갖추면 됩니다." },
];

const toTasks = (rows: Row[], prefix: string): WorkStepTask[] =>
  rows.map(([label, tip], i) => ({ id: `${prefix}-${i + 1}`, title: label, detail: tip }));

const byCategory: Record<string, CategoryContent> = {};
for (const cat of OFFLINE_CATS) {
  const isFoodLike = cat === "food" || cat === "cafe-dessert";
  byCategory[cat] = {
    label: LABELS[cat],
    favorable: FAVORABLE[cat],
    workSteps: {
      building: {
        why: BUILDING_SUB[cat] + BLD_SUFFIX,
        tasks: toTasks(BUILDING_ROWS[cat], "bldg"),
        watchouts: isFoodLike ? [BLD_WATCH_BASE, BLD_WATCH_SEPTIC] : [BLD_WATCH_BASE],
      },
      person: {
        why: PERSON_SUB[cat] + PER_SUFFIX,
        tasks: toTasks(PERSON_ROWS[cat], "person"),
        watchouts: [PER_WATCH],
      },
      facility: {
        why: FACILITY_SUB[cat] + FAC_SUFFIX,
        tasks: toTasks(FACILITY_ROWS[cat], "fac"),
        watchouts: cat === "beauty" ? FAC_WATCH_BEAUTY : isFoodLike ? FAC_WATCH_FOOD : FAC_WATCH_OTHER,
      },
    },
  };
}

/* ── 단계 콘텐츠 ── */
export const PERMIT_CHECK_CONTENT: StageContent = {
  stageId: "permit-check",
  shell: {
    title: "인허가 사전 확인",
    stageEyebrow: "단계 6 · 인허가 사전 점검",
    helperText: "계약 전에 내 업종에 필요한 인허가·위생 교육·안전 요건을 확인 — 발급은 나중, 지금은 '무엇이 필요한지'만.",
  },
  keyAction: {
    eyebrow: "이 단계에서 꼭 할 일",
    title: "내 업종이 이 건물에서 가능한지 — 계약 전 30분 안에 확인",
    subtitle:
      "임대 계약 후 「영업 불가」 발견 시 보증금 1,000~5,000만원 즉시 묶임. 지금은 발급이 아닌 \"무엇이 필요한지\"만 파악하는 사전 매핑 단계입니다.",
    pillars: [
      { icon: "building", label: "건물", meta: "용도 · 정화조" },
      { icon: "users", label: "사람", meta: "면허 · 보건증" },
      { icon: "shieldCheck", label: "시설", meta: "소방 · 환기" },
    ],
  },
  pages: [
    {
      id: "overview",
      label: "개요",
      sections: [
        {
          kind: "stageOverview",
          headline: "임대 계약 전 30분 — 영업 가능 여부를 확정해 보증금을 지킵니다",
          intro:
            "건축물 용도, 정화조, 환기, 소방, 면허 — 이 중 하나라도 안 맞으면 영업신고 자체가 거절됩니다. 임대 계약 후 발견하면 보증금 1,000~5,000만원이 즉시 묶입니다. 지금은 발급이 아닌 \"무엇이 필요한지\"만 파악하는 사전 매핑 단계.",
          stat: { value: "70%", label: "임대 계약 전 인허가 사전 점검을 안 하는 사장님 비율" },
          outlineEyebrow: "이 단계에서 진행 — 총 4단계",
          workOutline: [
            { title: "건물 적합성", detail: "건축물대장 → 용도·정화조·위반 표시 확인", time: "10분" },
            { title: "사람 적합성", detail: "본인 면허·위생교육·보건증 일정 확정", time: "10분" },
            { title: "시설 적합성", detail: "소방완비·환기·전기·가스 검사 가능 여부", time: "10분" },
            { title: "임대인 협상", detail: "빠진 항목 = 임대인 협상 카드로 정리" },
          ],
          outcomeTitle: "이 단계가 끝나면",
          outcome:
            "내 업종이 이 건물에서 영업 가능한지 확정됩니다. 부족한 항목은 임대인 협상 카드로 사용해 임대료 인하 또는 보강 비용 부담을 받아냅니다.",
        },
      ],
    },
    {
      id: "building",
      label: "1. 건물",
      sections: [
        { kind: "workStep", axis: "building", stepLabel: "1. 건물 적합성", time: "10분", headline: "건축물대장으로 「용도 + 시설(정화조·배수 등) + 위반 표시」 확인" },
      ],
    },
    {
      id: "person",
      label: "2. 사람",
      sections: [
        { kind: "workStep", axis: "person", stepLabel: "2. 사람 적합성", time: "10분", headline: "면허·자격·위생교육 — 영업 시작 전 의무 (식품업은 보건증 포함)" },
      ],
    },
    {
      id: "facility",
      label: "3. 시설",
      sections: [
        { kind: "workStep", axis: "facility", stepLabel: "3. 시설 적합성", time: "10분", headline: "소방·안전 + 환기 + 전기·가스 시설 확인 (업종별 기준 상이)" },
      ],
    },
    {
      id: "negotiate",
      label: "4. 협상",
      sections: [
        {
          kind: "workStep",
          axis: "negotiate",
          stepLabel: "4. 임대인 협상",
          headline: "빠진 항목 = 임대인 협상 카드 — 사인 전 특약으로 명시",
          why: "부족 항목(정화조·환기·전기·배수 등)은 임대료 인하 또는 보강 비용 임대인 부담으로 협상. 사인 전 특약 명시 못 받으면 매물 변경.",
          tasks: [
            { id: "neg-1", title: "후보 매물 3곳에 같은 질문", detail: "「내 업종 영업 가능?」 + 「부족 시설 보강 가능?」 + 「검사 증명서 보유?」 — 답변 거부 임대인은 패스." },
            { id: "neg-2", title: "보강 가능 항목 = 비용 분담 특약", detail: "「임대인이 1/2 부담 + 임차 종료 시 원상회복 의무 제외(시설물 인수·현 상태 인도)」 사인 전 특약. 모호한 '원상복구 면제'가 아니라 '시설물 인수·현 상태 반환'으로 명확히 써야 종료 시 분쟁 예방. 평균 500만원 절약." },
            { id: "neg-3", title: "다음 단계 (상권 후보 비교) 로 진행", detail: "건물·사람·시설 3축 모두 통과한 매물만 다음 단계로. 협상 거부 매물은 후보에서 제외." },
          ],
          showFavorable: true,
        },
      ],
    },
    {
      id: "checklist",
      label: "체크리스트",
      sections: [
        {
          kind: "axisChecklist",
          eyebrow: "내 매물 점검 체크리스트",
          subtitle: "위 가이드대로 직접 확인한 항목을 체크하세요. 3축 모두 통과해야 다음 단계로 진행됩니다.",
          axes: [
            { axis: "building", icon: "building", title: "1. 건물 적합성" },
            { axis: "person", icon: "users", title: "2. 사람 적합성" },
            { axis: "facility", icon: "shieldCheck", title: "3. 시설 적합성" },
          ],
        },
        { kind: "interactive", ref: "liveData", platforms: ["web"] },
        { kind: "interactive", ref: "permitCards", platforms: ["web"] },
        { kind: "wrapup" },
      ],
    },
  ],
  byCategory,
  wrapup: {
    nextStageLabel: "상권 후보 비교",
    doneItems: [
      { label: "1. 건물 적합성", detail: "건축물대장 용도·시설(정화조·배수 등)·위반 표시 — 영업 가능 건물인지 확정" },
      { label: "2. 사람 적합성", detail: "본인 면허·자격·위생교육 일정 확정 (식품업은 보건증 포함)" },
      { label: "3. 시설 적합성", detail: "소방·안전·환기·전기 보강 가능 여부 확인 (업종별 기준)" },
      { label: "4. 임대인 협상", detail: "빠진 항목 = 임대료 인하·보강 비용 분담 협상 카드로 정리" },
    ],
    verifyItems: [
      "건축물대장은 임대인 말이 아니라 정부24(gov.kr)에서 직접 발급해 확인 — 「위반건축물」 표시는 신규 영업신고 제한(시정·지위승계로 해제 가능 여부 확인)",
      "용도지역·정화조·배수·소음 등 업종별 시설 기준 — 계약 전 영업 가능 여부 확정 (음식=정화조 BOD·환기 덕트 / 미용·펫=배수·온수 / 학원·공간=소방·방음)",
      "면허·자격·위생교육은 영업 시작 전 의무 — 위생교육은 영업신고하는 대표자 이수(식품업은 보건증 별도), 사전 일정 확보로 오픈 지연 0",
      "소방·안전 요건은 업종별 상이 — 다중이용업(음식점 100㎡↑·학원 등)은 소방완비증명, 미용업 등 그 외는 소화기·비상구. 내 업종이 발급 대상인지 관할 소방서 확인",
      "환기·전기 용량 보강 가능 여부 — 임대 전 확인 (음식=외부 덕트, 미용=약품 환기·급배수, 헬스=바닥 하중)",
      "부족 항목은 사인 전 특약(임대인 비용 분담 + 원상회복 의무 제외〔시설물 인수·현 상태 인도〕)으로 명시 — 모호한 '원상복구 면제'는 분쟁 소지, 못 받으면 매물 변경",
    ],
    nextSummary: "내 업종이 이 건물에서 영업 가능한지 확정 → 상권·매물 후보 비교 단계로",
  },
};
