/**
 * content/hiring-setup.ts — "직원 채용 및 근로계약" 단계 콘텐츠 SSOT.
 *
 * stageId: "hiring-setup"
 * 웹 원본: apps/web/.../offline/HiringSetupStage.tsx (+ MyHiringPlanCard·HiringCostCalculator)
 * iOS 원본: apps/ios/.../Stages/HiringSetupStageView.swift
 *
 * 6페이지: 개요 / 1.공고 / 2.계약서 / 3.보험·세금 / 4.첫 달 / 마무리.
 *  - 페이지0 = stageOverview, 페이지1~4 = workStep(인라인 tasks/watchouts + per-cat favorable).
 *  - 페이지별 공식 사이트 linkCards(공고5·계약3·보험4).
 *  - 인터랙티브: hiringCalculator(사업주 실부담 시뮬)·soloOperator(1인 운영 토글)·완료 토글 3종.
 *  - hiringPlan(채용 계획 입력→재무연동)은 증분B에서 양쪽 배선.
 *
 * 최저시급 SSOT: constants/benchmarks LEGAL.MINIMUM_WAGE_HOURLY(드리프트 방지).
 */

import { LEGAL } from "../../constants/benchmarks";
import type { CategoryContent, Favorable, StageContent } from "../schema";

const WAGE = LEGAL.MINIMUM_WAGE_HOURLY; // 10,320
const WAGE_D = WAGE.toLocaleString("en-US"); // "10,320"
const MONTH_HOURS = 209; // (40 + 주휴 8) × 4.345 — 주휴 포함 월 환산
const MONTH_WAGE_D = (WAGE * MONTH_HOURS).toLocaleString("en-US"); // "2,156,880"
const WEEKLY_30H_D = (30 * WAGE + WAGE * 8).toLocaleString("en-US"); // "392,160"

const OFFLINE_CATS = ["food", "cafe-dessert", "beauty", "fitness", "education", "pet", "retail", "living-service", "space", "online-digital", "startup-tech"];
const LABELS: Record<string, string> = {
  food: "음식점", "cafe-dessert": "카페·디저트", beauty: "미용·뷰티", fitness: "피트니스",
  education: "학원", pet: "반려동물 서비스", retail: "소매·리테일", "living-service": "생활 서비스",
  space: "공간 임대", "online-digital": "온라인·디지털", "startup-tech": "스타트업",
};

/* ── 업종별 채용 전략(myHiring, 웹·iOS 1:1) ── */
const FAVORABLE: Record<string, Favorable> = {
  food: { context: "음식점 / F&B", recommendation: "초기엔 알바몬·당근으로 알바 1~2명, 정직원은 매출 3개월 검증 후", rationale: "F&B는 매출 변동 큼. 정직원 무리하게 뽑으면 인건비가 매출의 40%↑로 폭증. 알바 → 우수 알바 정직원 전환이 안전." },
  "cafe-dessert": { context: "카페 / 디저트", recommendation: "오픈 1~2주 전 알바천국 + 당근으로 평일·주말 분리 채용", rationale: "카페는 시간대 편차 큼. 평일 오전·오후 / 주말 풀타임으로 시급 분산 채용 시 인건비 효율 ↑" },
  beauty: { context: "미용·뷰티", recommendation: "디자이너·관리사는 사람인·잡코리아, 보조는 알바몬", rationale: "면허·경력 검증이 필요한 직군은 이력서 기반 플랫폼이 정확. 보조 인력은 단기 알바로 충분." },
  fitness: { context: "필라테스·요가·PT", recommendation: "강사는 트레이너스 / 잡플래닛 + 자격증 사전 검증", rationale: "지도자 자격증·경력이 매출 직결. 일반 알바몬보다 트레이너 전문 플랫폼이 채용 품질 ↑" },
  education: { context: "학원", recommendation: "강사는 사람인·강사인, 행정 보조는 알바몬", rationale: "강사는 경력·과목 매칭이 핵심 — 전문 플랫폼. 행정·청소·셔틀 보조는 단기 알바로 분리." },
  pet: { context: "펫", recommendation: "미용사는 펫업 + 자격증 검증, 일반 보조는 당근", rationale: "반려동물 미용사·훈련사는 자격이 매출 직결. 펫 전문 플랫폼에서 검증된 인력 채용." },
  "online-digital": { context: "온라인·디지털", recommendation: "포장·배송 보조는 당근·알바천국, 운영 도우미는 사람인", rationale: "택배·재고 작업은 인근 거주자가 효율적 — 동네 알바. 마케팅·CS 등 사무 보조는 사람인." },
  "living-service": { context: "세탁·청소·수리", recommendation: "기술자는 사람인 + 면허 검증, 보조는 알바천국", rationale: "기술 인력은 자격·경력 검증 필요. 보조는 단기 알바로 시작해 적성 본 후 정직원 전환." },
  space: { context: "공간 임대", recommendation: "관리·청소 인력은 당근·알바천국으로 단기 채용", rationale: "공간 임대는 상주 인력 적음. 청소·관리 단기 알바로 운영 비용 최소화." },
};
const favorableFor = (cat: string): Favorable => FAVORABLE[cat] ?? FAVORABLE.food;

const byCategory: Record<string, CategoryContent> = {};
for (const cat of OFFLINE_CATS) byCategory[cat] = { label: LABELS[cat], favorable: favorableFor(cat) };

export const HIRING_SETUP_CONTENT: StageContent = {
  stageId: "hiring-setup",
  shell: {
    title: "직원 채용 및 근로계약",
    stageEyebrow: "단계 16 · 채용 설정",
    helperText: "알바 1명도 정직원과 동일한 법적 절차 적용. 계약서 미교부 = 500만원 이하 과태료. 1인 운영을 선택할 수도 있습니다.",
  },
  keyAction: {
    eyebrow: "이 단계에서 꼭 할 일",
    title: "첫 직원 채용 60분 — 근로계약서 + 4대보험 + 원천세 3축 점검",
    subtitle: "공고 → 면접 → 계약서 2부 + 1부 교부 → 14일 이내 4대보험 통합 신고 → 매월 원천세. 빠뜨리면 과태료 + 임금 체불 신고 + 세무조사 리스크.",
    pillars: [
      { icon: "users", label: "공고", meta: "알바몬·당근·사람인" },
      { icon: "fileText", label: "계약", meta: "2부 + 1부 교부" },
      { icon: "shieldCheck", label: "보험·세금", meta: "14일 + 월 10일" },
    ],
  },
  pages: [
    {
      id: "overview",
      label: "개요",
      sections: [
        {
          kind: "stageOverview",
          headline: "첫 직원 채용 60분이 인건비 리스크 1년치를 결정합니다",
          intro:
            "근로계약서 미교부·4대보험 미신고·원천세 누락 — 셋 다 노동청 신고 + 세무조사 사유. 사인 전·신고 전에 모든 항목을 표준에 맞춰야 분쟁·과태료를 막습니다. 알바 1명도 정직원과 동일한 법적 절차 적용.",
          stat: { value: "₩1,500만", label: "위반 1건당 평균 과태료·체불 합계" },
          outlineEyebrow: "이 단계에서 진행 — 총 5단계",
          workOutline: [
            { title: "공고", detail: "알바몬·당근에 구체 공고 등록 (시급·시간·식사)", time: "30분" },
            { title: "계약서", detail: "표준 근로계약서 2부 + 1부 교부 (필수 4항목)", time: "20분" },
            { title: "보험·세금", detail: "14일 이내 4대보험 통합 신고 + 매월 원천세", time: "30분" },
            { title: "첫 달", detail: "주휴수당·연장수당 정확히 + 급여명세서 교부", time: "월 30분" },
            { title: "마무리", detail: "공식 사이트 바로가기 + 자주 빠뜨리는 항목 점검" },
          ],
          outcomeTitle: "이 단계가 끝나면",
          outcome:
            "근로계약서·4대보험·원천세 3축이 법적 표준에 맞춰 셋업됩니다. 노동청 분쟁·세무조사·임금 체불 리스크가 사라진 상태로 다음 단계 (운영·마케팅 준비) 진입.",
        },
      ],
    },
    {
      id: "posting",
      label: "1. 공고",
      sections: [
        { kind: "interactive", ref: "hiringPlan" },
        {
          kind: "workStep",
          axis: "posting",
          stepLabel: "1. 채용 공고",
          time: "30분",
          headline: "오픈 1~2주 전 공고 — 시급·시간·요일·식사 구체적으로 명시",
          why: "공고에 「최저시급」 만 쓰면 지원자 0명. 「시급 10,500원, 평일 11-17시, 식사 제공」 처럼 구체적으로 쓰면 지원률 3배 ↑. 오픈 직전 채용은 교육·적응 시간 부족으로 실수 폭발.",
          tasks: [
            { id: "post-1", title: "알바몬 (단기·PT 1순위) — 24시간 내 지원자 다수", detail: "albamon.com → 무료 공고 등록 → 시급·시간·요일·식사 4항목 구체화. 음식점·카페 표준 채널." },
            { id: "post-2", title: "알바천국 (음식점·카페 표준) — 네이버 검색 연동", detail: "alba.co.kr → 등록. 네이버 「○○ 알바」 검색 시 노출 → 가까운 거주자 매칭." },
            { id: "post-3", title: "당근 동네알바 — 무료 + 출퇴근 거리 짧은 알바", detail: "daangn.com → 동네 인증 → 「알바」 채널 등록. 인근 거주자 직접 매칭." },
            { id: "post-4", title: "정직원·경력직은 사람인·잡코리아", detail: "이력서 기반. 면허·경력 매칭이 매출 직결인 직군 (디자이너·강사·기술자) 에 적합." },
          ],
          watchouts: [
            { label: "공고에 「최저시급」 만 쓰면 지원자 없음", text: "시급·근무 시간·요일·식사 제공 여부를 구체적으로 써야 지원률 3배 ↑. 「쉬운 일」 같은 모호한 표현 금지." },
            { label: "오픈 직전 채용은 위험", text: "교육·적응 기간 없이 오픈 당일 투입 = 실수 폭발. 최소 1~2주 전 채용 필수." },
            { label: "면접에서 「최저시급보다 적게」 협상 시 위법", text: `2026 최저시급 ${WAGE_D}원. 어떤 형태로도 미달 시 임금 체불 신고 대상.` },
          ],
          showFavorable: true,
        },
        {
          kind: "linkCards",
          eyebrow: "공고 플랫폼 — 클릭하면 바로 이동",
          links: [
            { name: "알바몬", desc: "단기·파트타임 1순위 · 소상공인 무료 공고 · 24h 내 지원자 다수", url: "https://www.albamon.com", badge: "알" },
            { name: "알바천국", desc: "음식점·카페 표준 · 네이버 검색 연동 · 인근 거주자 매칭", url: "https://www.alba.co.kr", badge: "천" },
            { name: "당근 동네알바", desc: "지역 주민 즉시 매칭 · 무료 · 출퇴근 거리 짧은 알바", url: "https://www.daangn.com", badge: "당" },
            { name: "사람인", desc: "정직원·경력직 채용 · 이력서 기반 · 디자이너·강사·기술자", url: "https://www.saramin.co.kr", badge: "사" },
            { name: "잡코리아", desc: "정직원 채용 + 경력 매칭 · 면허·자격증 검증", url: "https://www.jobkorea.co.kr", badge: "잡" },
          ],
        },
        { kind: "interactive", ref: "soloOperator" },
      ],
    },
    {
      id: "contract",
      label: "2. 계약서",
      sections: [
        {
          kind: "workStep",
          axis: "contract",
          stepLabel: "2. 근로계약서",
          time: "20분",
          headline: "계약서 2부 작성 → 1부 반드시 직원 교부 (필수 4항목)",
          why: "계약서 미교부는 500만원 이하 과태료 + 임금 체불 신고 사유. 구두 약속은 분쟁 시 100% 사장님 불리. 표준 양식 사용이 가장 안전.",
          tasks: [
            { id: "cont-1", title: "고용노동부 표준 근로계약서 다운 (무료)", detail: "moel.go.kr → 「근로계약서」 검색 → 표준 양식 PDF. 임시·기간제·정규직 양식 분리." },
            { id: "cont-2", title: "필수 4항목 명시 — 임금·시간·휴게·계약기간", detail: "① 임금 (시급/월급, 지급일, 지급방법) ② 근무 시간·요일 + 휴게 (4h↑ 30분 / 8h↑ 1시간) ③ 업무·근무지 ④ 계약기간 (기간제 vs 무기)." },
            { id: "cont-3", title: `2026 최저시급 ${WAGE_D}원 기준 수치 검증`, detail: `월 ${MONTH_HOURS}시간(주 40h × 4.345주) × ${WAGE_D}원 = ${MONTH_WAGE_D}원. 주휴수당 별도. minimumwage.go.kr 모의 계산기로 확인.` },
            { id: "cont-4", title: "2부 인쇄 → 양측 서명 → 1부 직원 교부", detail: "교부 영수증 받아두면 분쟁 시 증거. 메일로 PDF 전송도 합법 (수신 확인 보존)." },
          ],
          watchouts: [
            { label: "계약서 미교부 시 500만원 이하 과태료", text: "「나중에 줄게」 = 즉시 신고 사유. 사인 후 그 자리에서 1부 교부 필수." },
            { label: "수습 90% 감액은 조건 엄격", text: "1년 이상 계약 + 수습 3개월 이내만. 단순 노무직 (배달·청소·서빙) 은 적용 X. 잘못 적용 시 차액 소급 + 과태료." },
            { label: "주휴수당 모르면 임금 체불", text: "주 15시간↑ 개근 시 1일치(시급 × 8시간) 추가. 계약서에 「주휴수당 포함/별도」 명시 필수." },
          ],
          showFavorable: true,
        },
        { kind: "interactive", ref: "hiringCalculator" },
        {
          kind: "linkCards",
          eyebrow: "계약서·임금 공식 사이트 — 클릭하면 바로 이동",
          links: [
            { name: "고용노동부 표준 근로계약서", desc: "공식 근로계약서 무료 다운로드 (정규·기간제·단시간)", url: "https://www.moel.go.kr/policy/policydata/list.do", badge: "고용" },
            { name: "최저임금위원회", desc: `2026년 최저임금 ${WAGE_D}원 · 모의 계산기`, url: "https://www.minimumwage.go.kr", badge: "최임" },
            { name: "노동OK", desc: "무료 노동법률 상담·노무 서식 포털", url: "https://www.nodong.or.kr", badge: "노동" },
          ],
        },
        { kind: "interactive", ref: "hiringContractDone" },
      ],
    },
    {
      id: "insurance",
      label: "3. 보험·세금",
      sections: [
        {
          kind: "workStep",
          axis: "insurance",
          stepLabel: "3. 4대보험 + 원천세",
          time: "30분",
          headline: "채용 14일 이내 4insure.or.kr 통합 신고 + 매월 10일 원천세",
          why: "5인 미만 사업장도 4대보험 의무. 1인 고용부터 의무. 미신고는 소급 납부 + 가산세. 원천세 누락은 세무조사 사유. 한 번에 셋업하면 매월 자동.",
          tasks: [
            { id: "ins-1", title: "4insure.or.kr 통합 신고 (D+14 이내)", detail: "국민연금·건강·고용·산재 한 사이트. 사업자등록증·근로계약서·통장사본 PDF 업로드. 평균 30분." },
            { id: "ins-2", title: "사업주 부담 월 약 19만원 (월급 209만원 기준)", detail: "국민연금 9.4만 (사업주 50%) + 건강 7.5만 (50%) + 고용 1.9만 (50%) + 산재 (사업주 100%). 자동이체 신청 권장." },
            { id: "ins-3", title: "홈택스에서 매월 원천세 신고·납부 (다음달 10일까지)", detail: "hometax.go.kr → 「원천세」 메뉴 → 간이세액표 자동 계산 → 신고 → 자동이체. 납부지연 시 미납세액 3% + 일 0.022% 가산세." },
            { id: "ins-4", title: "연말정산 — 다음 해 2월 사업주 의무", detail: "직원 1명도 의무. 세무사 위임 가능 (월 5~15만원). 직접 처리 시 홈택스 자동 정산 메뉴 사용." },
          ],
          watchouts: [
            { label: "1인 고용도 4대보험 의무", text: "5인 미만이라도 의무. 위반 시 소급 납부 + 가산세 + 노동청 신고 위험. 채용 즉시 신고가 안전." },
            { label: "현금 급여 + 미신고 = 세무조사", text: "국세청 PCI 분석 (카드 매출 vs 신고 인건비) 으로 자동 추적. 미신고 시 추징 + 과태료 폭증." },
            { label: "산재보험은 사업주 100% 부담 (별도 계산)", text: "나머지 3종은 50:50 분담. 산재만 전액 사업주 — 업종별 요율 0.7~5.6% 다름. 음식점 약 1%." },
          ],
          showFavorable: true,
        },
        {
          kind: "linkCards",
          eyebrow: "보험·세금 공식 사이트 — 클릭하면 바로 이동",
          links: [
            { name: "4대보험 정보연계센터", desc: "국민연금·건강·고용·산재 통합 신고 (필수, 채용 14일 이내)", url: "https://www.4insure.or.kr", badge: "4대" },
            { name: "홈택스", desc: "원천세 매월 신고·납부, 사업자등록·연말정산", url: "https://hometax.go.kr/websquare/websquare.html?w2xPath=%2Fui%2Fpp%2Findex_pp.xml", badge: "홈" },
            { name: "국민건강보험공단", desc: "직원 보험료 조회·납부", url: "https://www.nhis.or.kr", badge: "건강" },
            { name: "근로복지공단", desc: "산재·고용보험 가입·신고 (사업주 부담)", url: "https://www.kcomwel.or.kr", badge: "근로" },
          ],
        },
        { kind: "interactive", ref: "hiringInsuranceDone" },
        { kind: "interactive", ref: "hiringPayslipDone" },
      ],
    },
    {
      id: "month1",
      label: "4. 첫 달",
      sections: [
        {
          kind: "workStep",
          axis: "month1",
          stepLabel: "4. 첫 달 운영",
          time: "월 30분",
          headline: "주휴수당·연장수당 정확히 계산 + 급여명세서 의무 교부",
          why: "급여명세서 미교부는 2021년부터 과태료 대상 (500만원 이하). 주휴수당·연장수당 계산 실수가 가장 흔한 임금 체불 신고 사유. 세무사·급여 SaaS 사용 시 자동.",
          tasks: [
            { id: "m1-1", title: "주휴수당 — 주 15h↑ 개근 시 시급 × 8h 추가", detail: `예: 시급 ${WAGE_D}원, 주 30시간 근무 → 30 × ${WAGE_D} + (${WAGE_D} × 8) = ${WEEKLY_30H_D}원. 결근 1일이라도 주휴수당 X.` },
            { id: "m1-2", title: "연장수당 — 주 40h 또는 1일 8h 초과 시 1.5배", detail: "5인 이상 사업장만 의무. 5인 미만은 일반 임금. 야간(22~06시)·휴일 연장은 추가 가산 검토." },
            { id: "m1-3", title: "퇴직금 — 5인 미만도 의무 (주 15h↑ + 1년↑ 근속)", detail: "연장수당과 달리 퇴직금은 사업장 규모 무관. 「5인 미만은 안 줘도 된다」는 흔한 오해 — 주 15시간 이상 + 1년 이상 근속이면 알바·일용직도 의무. 30일분 평균임금 이상, 미지급 시 임금체불(형사처벌·지연이자). 매달 1/12씩 적립 권장." },
            { id: "m1-4", title: "급여명세서 의무 교부 — PDF 또는 종이", detail: "임금·근무시간·공제 내역·실수령액 명시. 카카오톡 전송도 합법 (수신 확인). 미교부 500만원 이하 과태료." },
            { id: "m1-5", title: "급여 자동화 — 세무사 또는 급여 SaaS", detail: "세무사: 월 5~15만원 (4대보험·원천세·연말정산 포함). SaaS: 자비스·페이워크·로보스 (월 1~5만원). 직원 3명↑면 자동화 권장." },
          ],
          watchouts: [
            { label: "급여명세서 미교부 = 500만원 이하 과태료", text: "2021.11 시행. 카톡·이메일 전송도 합법 — 단, 수신 확인 보존 필수. 매달 빠뜨리지 말고 자동 발송 셋업." },
            { label: "주휴수당 「포함된 시급」 협상은 불법", text: "「시급에 주휴수당 포함」 같은 조항은 무효. 시급은 시급, 주휴는 주휴 별도 표기 필수. 위반 시 차액 + 가산금." },
            { label: "5인 미만이라도 야간·휴일 근무는 가산 권장", text: "5인 미만은 법적 가산 의무 X 이지만, 야간(22-06시)·일요일 근무는 1.5배 가산 합의가 노동 분쟁 예방." },
          ],
          showFavorable: true,
        },
      ],
    },
    {
      id: "wrapup",
      label: "마무리",
      sections: [{ kind: "wrapup" }],
    },
  ],
  byCategory,
  wrapup: {
    nextStageLabel: "다음 단계(운영·마케팅 준비) 전 반드시 확인",
    doneItems: [
      { label: "1. 채용 공고 등록", detail: "알바몬·알바천국·당근·사람인 — 시급·시간·요일·식사 4항목 구체화" },
      { label: "2. 근로계약서 작성·교부", detail: "표준 양식 2부 + 1부 직원 교부 + 4항목(임금·시간·휴게·기간) 명시 + 채용 비용 시뮬" },
      { label: "3. 4대보험 + 원천세 셋업", detail: "4insure.or.kr 통합 신고(D+14) + 홈택스 매월 10일 원천세 + 자동이체" },
      { label: "4. 첫 달 운영 표준 셋업", detail: "주휴수당·연장수당 정확 계산 + 급여명세서 자동 발송 + (선택) CPA·SaaS 자동화" },
    ],
    verifyItems: [
      "근로계약서 1부 직원 교부 영수증·수신 확인 — 미교부 500만원 이하 과태료",
      "주휴수당 「포함된 시급」 X — 시급·주휴수당 별도 표기 (위반 시 차액·가산금)",
      "4대보험 채용 14일 이내 신고 완료 — 5인 미만도 의무, 1인 고용부터 적용",
      "원천세 매월 10일까지 홈택스 자동 납부 셋업 — 납부지연 시 미납세액 3% + 일 0.022% 가산세",
      "급여명세서 카톡·메일 자동 발송 셋업 — 2021.11~ 미교부 500만원 이하 과태료",
      "산재보험 사업주 100% 부담 별도 계산 — 업종별 요율 0.7~5.6%",
    ],
    nextSummary: "근로계약·4대보험·원천세 3축 셋업 완료 → 운영·마케팅 준비 진입",
  },
};
