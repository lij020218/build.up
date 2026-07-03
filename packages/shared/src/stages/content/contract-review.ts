/**
 * content/contract-review.ts — "임대 계약 검토" 단계 콘텐츠 SSOT.
 *
 * stageId: "contract-review"
 * 웹 원본: apps/web/.../selection/ContractReviewStage.tsx
 * iOS 원본: apps/ios/.../Stages/ContractReviewStageView.swift
 *
 * 6페이지: 개요 / 1.서류 / 2.현장 / 3.특약 / 4.사인 / 마무리.
 *  - 페이지0 = stageOverview, 페이지1~4 = workStep(인라인 tasks/watchouts, 정적 — 전 업종 공통).
 *  - 페이지3(특약)만 업종별 favorable(clauseFavorable 10업종) 표시.
 *  - 페이지5(마무리) = wrapup + 9대 핵심 조항 체크리스트(게이팅) + AI 계약 분석(별도 배선).
 *
 * 통일: 웹·iOS 페이지 0~4 텍스트가 이미 1:1 동일 — SSOT로 구조적 고정.
 */

import type { CategoryContent, Favorable, StageContent } from "../schema";

const OFFLINE_CATS = ["food", "cafe-dessert", "beauty", "fitness", "education", "pet", "retail", "living-service", "space", "online-digital", "startup-tech"];

const LABELS: Record<string, string> = {
  food: "음식점", "cafe-dessert": "카페·디저트", beauty: "미용·뷰티", fitness: "피트니스",
  education: "학원", pet: "반려동물 서비스", retail: "소매·리테일", "living-service": "생활 서비스",
  space: "공간 임대", "online-digital": "온라인·디지털", "startup-tech": "스타트업",
};

/* ── 업종별 「특약 협상」 권장 (clauseFavorable, 웹·iOS 1:1) ── */
const FAVORABLE: Record<string, Favorable> = {
  food: { context: "음식점 / F&B", recommendation: "「환기·정화조·전기 보강 비용 임대인 부담」 특약 무조건 받기", rationale: "후드·덕트·정화조 증축은 임대 후 발견 시 500~3,000만원. 임대인 부담 명시 또는 임대료 5% 인하로 보상. 거부 임대인 = 매물 변경." },
  "cafe-dessert": { context: "카페 / 베이커리", recommendation: "「전기 30A↑ 증설 가능 + 비용 분담」 명시", rationale: "머신·오븐·제빙기 동시 가동 시 20A 차단기 빈번. 한전 신청 30~80만원. 임대인 부담 또는 임대료 인하로 보상." },
  retail: { context: "리테일 / 소매", recommendation: "「온라인 판매 병행 가능」 + 「업종변경 자유」 명시", rationale: "오프라인만 묶이면 매출 다각화 어려움. 스마트스토어 병행이 매출 안전망. 미명시 시 분쟁 발생 시 임대인 우위." },
  beauty: { context: "미용·뷰티", recommendation: "「소음·향기 민원 시 임대인 1차 중재 책임」 명시", rationale: "옆 가게 민원으로 영업시간 제한 사례 다수. 임대인이 중재 안 하면 임차인이 직접 분쟁 — 책임 분담 명시 필수." },
  fitness: { context: "필라테스·요가·PT", recommendation: "「방음 보강 비용 임대인 부담」 + 「영업시간 06-23시 보장」", rationale: "운동 소음 민원이 폐점 1순위. 방음 보강 1,000~3,000만원을 임대인이 분담 안 하면 매물 변경." },
  education: { context: "학원", recommendation: "「학원 등록 가능 용도」 + 「소방완비증명서 책임 분담」 명시", rationale: "건축물 용도 「교육연구시설」 또는 학원 가능 「근린생활시설」 확약 안 받으면 등록 거부. 100㎡↑ 소방완비 필수." },
  pet: { context: "펫", recommendation: "「소음·냄새 민원 1차 중재 임대인 책임」 + 「업종 폐쇄 명령 시 환불」", rationale: "펫 업종 민원 영업정지 빈번. 환불 조항 없으면 보증금 묶인 채 폐업. 임대인 중재 + 환불 보장이 안전망." },
  "online-digital": { context: "온라인·디지털 (사무실·창고)", recommendation: "「사업자등록 가능」 명시", rationale: "주거용 임대차 계약서는 「사업자 등록 금지」 가 default. 사업자등록 못 하면 매출 신고·세금계산서 불가." },
  "living-service": { context: "세탁·청소·수리", recommendation: "「폐수·소음 기준 적합 매물 + 위반 시 임대인 책임」", rationale: "폐수·소음 위반은 영업정지 사유. 임대인이 사전 적합성 확약 없이 단속 시 임차인 부담." },
  space: { context: "공간 임대", recommendation: "「숙박 가능 여부 + 데시벨·시간 제한 명시」", rationale: "건축물 용도 미일치 시 영업허가 거부. 소음·시간 분쟁 1순위 — 특약에 명시." },
};
// startup-tech 등 미정의 업종 → food 기본값(웹·iOS 현행 default 동작 일치).
const favorableFor = (cat: string): Favorable => FAVORABLE[cat] ?? FAVORABLE.food;

const byCategory: Record<string, CategoryContent> = {};
for (const cat of OFFLINE_CATS) {
  byCategory[cat] = { label: LABELS[cat], favorable: favorableFor(cat) };
}

export const CONTRACT_REVIEW_CONTENT: StageContent = {
  stageId: "contract-review",
  shell: {
    title: "계약 전 검토",
    stageEyebrow: "단계 8 · 임대 계약 검토",
    helperText: "임대 계약서는 '표준 양식'이 없습니다. 임대인이 유리하게 작성합니다. 사장님이 직접 확인하거나 법무사 검토(5~10만원)를 권장합니다.",
  },
  keyAction: {
    eyebrow: "이 단계에서 꼭 할 일",
    title: "계약서 사인 전 75분 — 보증금 1,000~5,000만원을 지키는 시간",
    subtitle: "건물·계약·보호 3축을 점검하고 5종 특약을 협상해야 합니다. 사인 후 발견하는 문제는 거의 100% 임차인 부담.",
    pillars: [
      { icon: "building", label: "건물", meta: "용도 · 시설 · 전기" },
      { icon: "fileText", label: "계약", meta: "5% 상한 · 10년 갱신" },
      { icon: "shieldCheck", label: "보호", meta: "확정일자 · 근저당" },
    ],
  },
  pages: [
    {
      id: "overview",
      label: "개요",
      sections: [
        {
          kind: "stageOverview",
          headline: "계약서 사인 전 75분이 보증금 1,000~5,000만원을 결정합니다",
          intro:
            "임대차 계약은 사인 후 정정 가능성이 거의 0%. 건물(용도·시설·전기)·계약(특약)·보호(확정일자·근저당)를 사전에 점검해야 분쟁·손실을 막습니다. 인근 점주 인터뷰 + 정부 서류 + 표준 특약 5종만으로 80% 리스크 차단.",
          stat: { value: "₩2,800만", label: "분쟁 시 평균 손실액" },
          outlineEyebrow: "이 단계에서 진행 — 총 5단계",
          workOutline: [
            { title: "서류 발급", detail: "건축물대장 + 등기부등본 발급", time: "20분" },
            { title: "현장 방문", detail: "현장 방문 + 영상 + 인접 점주 인터뷰", time: "30분" },
            { title: "특약 협상", detail: "특약 5종 협상 — 임대료·갱신·원상복구·업종·시설", time: "25분" },
            { title: "사인 + 확정일자", detail: "사인 즉시 확정일자 (관할 세무서)", time: "당일" },
            { title: "마무리", detail: "필수 확인 항목 마킹 + 서명 완료" },
          ],
          outcomeTitle: "이 단계가 끝나면",
          outcome:
            "보증금 보호 (확정일자 + 5% 상한 + 갱신 10년 + 원상복구 「임차 시 상태」 기준) 가 모두 계약서에 명문화됩니다. 다음 단계 (인테리어 발주) 부터는 보증금 묶임 리스크가 사라진 상태에서 진행.",
        },
      ],
    },
    {
      id: "docs",
      label: "1. 서류",
      sections: [
        {
          kind: "workStep",
          axis: "docs",
          stepLabel: "1. 서류 발급",
          time: "20분",
          headline: "건축물대장 + 등기부등본을 사인 전에 직접 확인",
          why: "임대인 말로 「용도 OK·근저당 적음」 = 절대 신뢰 X. 정부 서류로만 검증. 근저당 50%↑ 매물은 임대인 부도 시 보증금 회수 위험.",
          tasks: [
            { id: "doc-1", title: "건축물대장 발급 (정부24·무료·5분)", detail: "정부24 → 「건축물대장 등본」 검색 → PDF 다운. 「용도」 + 「위반건축물」 표시 확인 (음식점은 「정화조 BOD 용량」, 미용·펫은 급배수 등 업종별 시설도 함께)." },
            { id: "doc-2", title: "등기부등본 발급 (인터넷등기소·700원·5분)", detail: "iros.go.kr → 「등기사항전부증명서」 → 부동산 주소 검색. 「갑구」 = 소유권, 「을구」 = 근저당·압류. 근저당 합계 ÷ 매물 시세 = 부도 위험률." },
          ],
          watchouts: [
            { label: "위반건축물 표시 = 신규 영업신고 제한 (시정·승계로 해제 가능)", text: "건축물대장에 「위반건축물」 표기 시 신규 영업신고가 제한됩니다. 위반사항 시정(이행강제금 해결) 또는 기존 영업 지위승계 시 가능 — 계약 전 해제·승계 여부 확인. 불확실하면 매물 변경." },
            { label: "근저당 50%↑ = 임대인 부도 시 보증금 후순위", text: "근저당 권자 (은행 등) 가 우선. 보증금이 후순위면 임대인 부도 시 잃을 가능성 큼." },
          ],
        },
      ],
    },
    {
      id: "site",
      label: "2. 현장",
      sections: [
        {
          kind: "workStep",
          axis: "site",
          stepLabel: "2. 현장 방문",
          time: "30분",
          headline: "휴대폰 영상 + 옆 가게 점주 인터뷰 = 80% 리스크 차단",
          why: "사진은 못 잡는 「소음·냄새·동선·환기」를 직접 점검. 옆 가게 점주에게 30초만 물어봐도 임대인 평판이 보임.",
          tasks: [
            { id: "site-1", title: "영상 기록 — 매장 전체 + 외부 + 시설", detail: "휴대폰으로 한 번에 쭉 촬영. 누수·곰팡이·전기 패널·환기·급배수·업종별 필수 시설 위치까지. 분쟁 시 증거." },
            { id: "site-2", title: "옆 가게 점주에게 3개 질문", detail: "「이 건물주 어때요?」 + 「임대료 어떻게 인상하세요?」 + 「민원 자주 있나요?」 — 임대인 평판 80% 노출." },
            { id: "site-3", title: "전기 용량·업종별 필수 시설 직접 확인", detail: "전기 패널 용량 표기 확인 + 업종별 필수 시설(음식=정화조·환기 덕트, 미용·펫=급배수, 헬스=바닥 하중 등) 직접 확인. 임대인 답변과 다르면 협상 카드." },
          ],
          watchouts: [
            { label: "낮 시간대만 가지 말 것 — 야간 소음 못 봄", text: "주거 인접 매물은 저녁 7시·아침 7시 다시 방문해 소음 점검. 영업 후 민원으로 시간 제한 가능성 사전 차단." },
          ],
        },
      ],
    },
    {
      id: "clauses",
      label: "3. 특약",
      sections: [
        {
          kind: "workStep",
          axis: "clauses",
          stepLabel: "3. 특약 협상",
          time: "25분",
          headline: "표준 임대차계약서 + 5종 특약 — 거부 임대인 = 매물 변경",
          why: "사인 후 정정 거의 불가. 5종 특약을 협상 못 하는 임대인은 분쟁 시 일방적. 협상 거부 자체가 위험 신호.",
          tasks: [
            { id: "clause-1", title: "표준 임대차계약서 사용 (법무부 양식)", detail: "법무부 「상가건물 임대차 표준계약서」 다운. 임대인이 본인 양식 고집하면 추가 위험 조항 의심." },
            { id: "clause-2", title: "특약 5종 명시 — 임대료 5%·갱신 10년·원상복구·업종변경·시설보강", detail: "「특약사항」 란에 5종 모두 명시. ① 임대료 인상 연 5% 이내 ② 10년 갱신권 ③ 원상복구 = 「임차 시 상태」 기준 ④ 업종변경 자유 ⑤ 시설보강 비용 임대인 부담." },
            { id: "clause-3", title: "거부 시 매물 변경 — 협상 못 하는 임대인은 위험", detail: "5종 모두 거부하면 분쟁 가능성 매우 높은 임대인. 보증금 1,000~5,000만원 묶을 가치 없음." },
          ],
          watchouts: [
            { label: "「임대료 5% 상한」 미명시 = 무제한 인상 가능", text: "⚠ 환산보증금 상한 — 서울 9억, 광역시 6.9억, 그 외 5.4억 (상가건물 임대차보호법 시행령 §2). 환산보증금 = 보증금 + (월세 × 100). 상한 초과면 법정 보호(5% 상한·우선변제권) 적용 X — 특약에 「갱신 시 5% 이내」 명시해야 안전. ✓ 대항력·계약갱신요구권(10년)·권리금 회수기회는 환산보증금 상관없이 모든 임차인에게 적용." },
            { label: "원상복구 「최초 인도 시 상태」 = 인테리어 철거 1,000~3,000만원", text: "본인이 한 시공을 모두 철거 + 원래대로 복구해야 함. 「임차 시 상태」 로 명시해야 본인 시공만 책임." },
          ],
          showFavorable: true,
        },
      ],
    },
    {
      id: "sign",
      label: "4. 사인",
      sections: [
        {
          kind: "workStep",
          axis: "sign",
          stepLabel: "4. 사인 + 확정일자",
          time: "당일 30분",
          headline: "사인 당일 무조건 확정일자 — 1일 늦으면 보증금 후순위",
          why: "확정일자가 보증금 우선변제권 결정. 다른 채권자가 그 사이 등기하면 사장님 보증금이 후순위로 밀려 임대인 부도 시 잃음.",
          tasks: [
            { id: "sign-1", title: "관할 세무서 방문 (상가 확정일자)", detail: "상가건물 임대차 확정일자는 상가 소재지 관할 세무서장이 부여(주택과 달리 동주민센터 X). 임대차계약서 + 신분증 지참, 1,000원 수수료, 30분 안에 끝남 — 평일 방문." },
            { id: "sign-2", title: "필요 서류 — 임대차계약서 + 신분증", detail: "원본 계약서 + 본인 신분증. 임대인 동행 X (임차인 단독 신청)." },
            { id: "sign-3", title: "확정일자 도장 받은 계약서는 절대 분실 X", detail: "스캔본 클라우드 + 원본 금고 보관. 분쟁 시 핵심 증거." },
            { id: "sign-4", title: "다음 단계 — 인테리어·집기 발주", detail: "확정일자 받으면 보증금 보호 완료. 다음 단계로 진행." },
          ],
          watchouts: [
            { label: "확정일자 1일 늦어도 우선변제권 후순위", text: "사인 후 다른 채권자가 그날 등기하면 사장님 보증금이 후순위. 사인 직후 바로 관할 세무서로." },
            { label: "권리금 회수기회 보호 — 임대차 종료 6개월 전~종료 시점", text: "상가건물 임대차보호법 §10조의4 — 임대인이 정당한 사유 없이 신규 임차인 거절 시 권리금 손해배상 청구 가능. 환산보증금 무관 모든 임차인에게 적용. 임대인 거절 사유는 서면 요구·증거 확보 필수." },
          ],
        },
      ],
    },
    {
      id: "wrapup",
      label: "마무리",
      sections: [
        {
          kind: "gateChecklist",
          eyebrow: "사인 전 최종 체크리스트 (9대 핵심 조항)",
          subtitle: "계약서에 아래 9대 핵심 조항이 모두 들어있는지 확인하세요. 모두 체크해야 다음 단계로 진행됩니다.",
          doneNote: "모든 항목 확인 완료! 계약 체결 가능합니다.",
          items: [
            { id: "term", label: "계약 기간 2년 이상 + 갱신 청구권 10년 확인" },
            { id: "deposit", label: "보증금·월세 금액·지급일 정확히 기재" },
            { id: "area", label: "임대 면적 건축물대장과 일치 여부 확인" },
            { id: "rent", label: "월세 인상률 상한 조항 삽입 (5% 이내)" },
            { id: "renewal", label: "갱신 청구권 조항 확인 (강행규정)" },
            { id: "restore", label: "원상복구 범위 「임차 시 상태」로 명시" },
            { id: "facility", label: "간판·환기·업종별 필수 시설 설치 허용 특약 확인" },
            { id: "sublease", label: "전대차 관련 조항 확인" },
            { id: "maintenance", label: "냉난방·전기·수도 주요 시설 하자 수리 주체 명확히" },
          ],
        },
        { kind: "interactive", ref: "contractSign" },
        {
          kind: "noteList",
          severity: "warn",
          title: "계약 후 즉시 할 일",
          items: [
            "계약서 사진·사본 즉시 안전한 곳에 백업 (분실 시 분쟁 증거 불가)",
            "확정일자 받기 — 관할 세무서 (상가는 세무서, 주택과 다름 · 1,000원). 임대인 파산 시 보증금 우선변제권 확보",
            "전입신고 (사업장 주소) — 확정일자와 함께 대항력 확보",
          ],
        },
        { kind: "interactive", ref: "contractAiAnalysis" },
        { kind: "wrapup" },
      ],
    },
  ],
  byCategory,
  wrapup: {
    nextStageLabel: "인테리어",
    doneItems: [
      { label: "1. 서류 발급", detail: "건축물대장 + 등기부등본 — 위반건축물 표시 + 근저당 ÷ 시세 = 부도 위험률" },
      { label: "2. 현장 방문 + 인접 점주 인터뷰", detail: "휴대폰 영상 + 30초 인터뷰 + 전기 용량·업종별 필수 시설 직접 검증" },
      { label: "3. 특약 5종 협상", detail: "임대료 5% 상한 + 10년 갱신 + 원상복구 「임차 시 상태」 + 업종변경 자유 + 시설보강 임대인 부담" },
      { label: "4. 사인 + 당일 확정일자", detail: "관할 세무서 30분 — 1,000원 — 보증금 우선변제권 확보" },
    ],
    verifyItems: [
      "확정일자 도장 받은 계약서 원본 보관 + 스캔본 클라우드 (분쟁 시 핵심 증거)",
      "특약 5종 모두 계약서 「특약사항」 란에 명문화 — 구두 약속은 분쟁 시 100% 임차인 불리",
      "근저당 합계 ÷ 시세 50% 이상이면 보증금 후순위 — 보증보험 가입 검토",
      "전기 용량·업종별 필수 시설 용량을 임대인 답변과 다르면 시설보강 임대인 부담 추가 협상",
      "원상복구 범위가 「임차 시 상태」 로 명시됐는지 다시 확인 — 「최초 인도 시」 = 인테리어 철거 1,000~3,000만원 부담",
    ],
    nextSummary: "보증금 보호 명문화 완료 → 인테리어·집기 발주 단계로 진입",
  },
};
