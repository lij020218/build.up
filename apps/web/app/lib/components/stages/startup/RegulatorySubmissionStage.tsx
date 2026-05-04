"use client";

import { Award, Clock, FileCheck, Sparkles } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster C — Deep Tech Lab 4/4: 인허가 제출 및 승인
 *
 * 검증 출처:
 *   • IntoInWorld 2026 — Korea launches Fast-Track 80-140일 (2026.01.26 시행)
 *   • 199 device categories qualify, 113 AI-based digital devices
 *   • MFDS 일반 경로: 490일 → 295일 단축
 *   • KoreaBiomed: Fast-Track 의료기기 80일 진입 가능
 */

const robotics: ClusterStageContent = {
  keyAction: {
    title: "KC + 안전인증 — 로봇 제품은 무선·전기·산업안전 3중 인증 필요",
    detail: "산업용 로봇: 산업안전보건법 + KS 인증 / 서비스 로봇: KC 전기·EMC + 안전 인증. 통신 모듈 포함 시 KC-RRA 추가. 일반 4-16주, 무선 8-16주.",
  },
  facts: [
    {
      icon: FileCheck,
      label: "필요 인증 종류",
      value: "산업용: 산업안전 (KOSHA) + KC 전기 / 서비스용: KC 전기·EMC + 안전 / 무선통신 모듈: KC-RRA 추가",
    },
    {
      icon: Clock,
      label: "인증 일정",
      value: "비무선 4-8주, 무선 (KC-RRA + Safety + EMC) 8-16주. 산업안전은 별도 6-12주",
      source: "IB-Lenhardt · KOSHA",
    },
  ],
  traps: [
    { label: "인증 없이 시연·판매 → 영업정지 + 형사처벌", text: "산업안전법·전기용품안전법 위반 시 영업정지·과태료·형사처벌. 시연 영상 SNS 노출만으로도 처벌 사례 있음." },
  ],
  wrapup: {
    nextStageLabelKo: "법인 설립·운영",
    doneItemsKo: [
      { label: "1. 인증 종류 확정", detail: "산업용: KOSHA + KC 전기 / 서비스용: KC 전기·EMC + 안전" },
      { label: "2. 무선 통신 모듈", detail: "KC-RRA 추가 인증 (8~16주), 누락 시 통신 기능 사용 불가" },
      { label: "3. 인증 시험 완료", detail: "한국 시험소·한국 대리인 지정 + 한국어 문서 + 샘플 제출" },
      { label: "4. 인증 라벨·표시", detail: "KC·CE·FCC 마크 정확 표시, 위조·누락 시 표시광고법 위반" },
    ],
    verifyItemsKo: [
      "산업안전법 — 인증 없이 시연·판매 시 영업정지 + 형사처벌, SNS 노출만으로도 처벌",
      "전기용품안전법 — 위반 시 영업정지 + 과태료 + 회수 명령, 비용 막대",
      "PL — 인증 통과해도 결함 발생 시 PL 책임, 보험 가입 + 위험 평가 사전 수행",
      "유럽 CE·미국 FCC — 동시 진행 시 비용·일정 절감, 한국 출시만 하면 미국·유럽 차단",
      "사후 관리 — 인증 후에도 정기 검증 의무, 미준수 시 인증 취소 + 영업정지",
      "지속적 개선 — 펌웨어 업데이트로 인증 변경 위험, 변경 사전 신고 의무",
    ],
    nextSummaryKo: "KC·KOSHA·RRA 인증 완료 → 법인 설립·운영 단계로 진입",
  },
};

const biotech: ClusterStageContent = {
  keyAction: {
    title: "MFDS Fast-Track (80-140일) 자격 검토 — 일반 295일 vs Fast-Track 80-140일",
    detail: "Fast-Track 자격: 199개 device 카테고리 (113개 AI 디지털 의료기기 포함). 자격되면 시장 진입 시간 5-6배 단축. Pre-consultation 단계에서 Fast-Track 자격 여부 미리 확정.",
  },
  facts: [
    {
      icon: Sparkles,
      label: "Fast-Track 시스템 (2026.01.26 시행)",
      value: "Market Immediate Entry Medical Technology — 시장 진입 시간 490일 → 80-140일. 199개 카테고리 (113개 AI 디지털 의료기기)",
      source: "IntoInWorld 2026 · KoreaBiomed",
    },
    {
      icon: Clock,
      label: "일반 경로 단축",
      value: "MFDS 일반 의약품/의료기기 인허가 420일 → 295일 (전담팀 + GMP 검사 병행)",
      source: "MFDS Drug Approval Reform 2025",
    },
    {
      icon: Award,
      label: "Fast-Track 자격 요건",
      value: "혁신성 + 강화된 임상 평가 통과 + MFDS authorization 단계에서 사전 검증 — Pre-consultation 으로 자격 확정 권장",
      source: "Complife Group · IntoInWorld",
    },
    {
      icon: FileCheck,
      label: "Digital Medical Device Product Act (2025.01)",
      value: "디지털 의료기기 별도 인허가 트랙. 2025년 IND 126건 중 45-50% 가 SaMD/AI",
      source: "Emergo by UL · MFDS",
    },
  ],
  traps: [
    { label: "Fast-Track 자격 미확인 → 일반 경로로 1년 + 손실", text: "Pre-consultation 단계에서 Fast-Track 자격 검토 안 하면 일반 경로 295일. AI 디지털 의료기기는 Fast-Track 자격 가능성 높음 — 반드시 미리 확인." },
    { label: "임상 데이터 부족으로 Fast-Track fail → 일반 경로 재시작", text: "Fast-Track 은 강화된 임상 평가 요구. 데이터 부족 시 거부 → 일반 경로로 다시 시작 = 추가 6개월. 임상 단계에서 Fast-Track 기준 데이터 수집 필수." },
  ],
  links: [
    { name: "Korea Fast-Track 80일 진입 — KoreaBiomed", href: "https://www.koreabiomed.com/news/articleView.html?idxno=30423" },
    { name: "Fast-Track 시스템 분석 — Complife Group", href: "https://www.complifegroup.com/2026/02/18/south-korea-medical-devices/" },
    { name: "Digital Medical Products Act — Emergo by UL", href: "https://www.emergobyul.com/news/south-koreas-digital-medical-products-act-now-enforced" },
  ],
  wrapup: {
    nextStageLabelKo: "법인 설립·운영",
    doneItemsKo: [
      { label: "1. Fast-Track 자격 검토", detail: "199개 카테고리 중 자격 사전 확인 — 진입 시간 80~140일 단축" },
      { label: "2. Pre-consultation 진행", detail: "MFDS 사전 협의로 우려사항 식별 + 자격 확정" },
      { label: "3. IND·인허가 dossier", detail: "프로토콜·임상 데이터·CMC·GMP·피험자 보험 모두 통합" },
      { label: "4. 시판 후 안전 시스템", detail: "PMS(시판 후 안전관리) 시스템 + AE(이상사례) 보고 체계" },
    ],
    verifyItemsKo: [
      "Fast-Track 자격 — 미확인 시 일반 경로 295일, AI 디지털 의료기기는 자격 가능성 높음 미리 확인",
      "임상 데이터 — Fast-Track은 강화된 임상 평가, 데이터 부족 시 일반 경로 재시작",
      "GMP 검사 — 인허가와 별도, 사전 GMP 인증 확보 못하면 시판 불가",
      "피험자 보상 보험 — 임상 시작 전 가입, 미가입 시 사고 보상 무한 책임",
      "변경 신고 — 시판 후 제조 변경 사전 신고 의무, 미신고 시 인증 취소",
      "AE 보고 — 중대한 이상사례 24~48시간 내 MFDS 보고 의무, 누락 시 인증 취소",
    ],
    nextSummaryKo: "MFDS 인허가 + GMP·PMS·AE 시스템 완비 → 법인 설립·운영 단계로 진입",
  },
};

export function RegulatorySubmissionStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster C — Deep Tech Lab 4/4"
      title="인허가 제출 및 승인"
      contextLabel="12단계 / 22"
      contentBySubIndustry={{
        "robotics-physical-ai": robotics,
        "biotech-medtech": biotech,
      }}
      defaultContent={biotech}
    />
  );
}
