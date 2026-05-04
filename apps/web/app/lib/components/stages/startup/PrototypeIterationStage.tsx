"use client";

import { GitBranch, Calendar, FlaskConical, RefreshCw } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster C — Deep Tech Lab 2/4: 프로토타입 반복 사이클
 *
 * 검증 출처:
 *   • IntoInWorld 2026 — 한국 Digital Medical Device Product Act (2025.01) — SaMD 빠른 경로
 *   • MFDS 2025: 의료기기 IND 126건 승인, 45-50% SaMD
 *   • Eric Ries 'Lean Startup' / Steve Blank — go/no-go gates 표준
 */

const robotics: ClusterStageContent = {
  keyAction: {
    title: "v0 → v3 주간 반복 + 명확한 go/no-go 게이트 — 'v1 완벽주의' 가 회사를 죽입니다",
    detail: "주간 단위로 v0(개념검증) → v1(기본동작) → v2(외형 통합) → v3(파일럿 후보) 진행. 각 v 완료 시 go/no-go 결정 기준 미리 정의 (성능·내구성·비용 임계치). 임계치 미달 시 깨끗하게 폐기하고 다음 v 로.",
  },
  facts: [
    {
      icon: Calendar,
      label: "반복 주기 표준",
      value: "주간 sprint — 월: 설계 / 화-목: 제작·실험 / 금: 데이터 분석 + 다음 v 결정. 4-6주에 한 번 메이저 v 업데이트",
      source: "Lean Hardware",
    },
    {
      icon: GitBranch,
      label: "Go/No-Go 게이트",
      value: "각 v 마다 명시적 합격 기준 (예: 'v1: 1m 거리 99% 정확도 / v2: 5kg 부하 30분 동작'). 미달 시 폐기 결정",
    },
    {
      icon: FlaskConical,
      label: "데이터 기록",
      value: "모든 실험 결과 raw data + 메타데이터 (조건·환경·기기 ID) 저장. 재현성 검증 + 향후 인증 자료로 활용",
    },
  ],
  traps: [
    { label: "'v1 완벽' 추구하다 1년 소진", text: "딥테크 창업자 가장 흔한 실패. 일정 안에 안 되면 폐기하고 다음 v 로. 1년에 v3 까지 못 가면 회사가 끝남." },
    { label: "데이터 기록 없이 실험 — 다음 단계에서 재시험", text: "raw data + 환경 메타데이터 없으면 인허가에서 무효. 처음부터 디지털 실험노트 + 자동 로깅 시스템." },
  ],
  wrapup: {
    nextStageLabelKo: "필드/임상 시험",
    doneItemsKo: [
      { label: "1. v0~v3 주간 반복", detail: "개념·기본동작·외형통합·파일럿 4단계 — 각 단계 go/no-go 명시" },
      { label: "2. Go/No-Go 기준 정의", detail: "성능·내구성·비용 임계치 미리 설정 — 미달 시 즉시 폐기" },
      { label: "3. 디지털 실험노트", detail: "raw data + 환경 메타데이터 자동 로깅, 인증 자료 활용" },
      { label: "4. 외부 평가·시연", detail: "리드 고객·잠재 투자자 대상 시연 + 피드백 반영" },
    ],
    verifyItemsKo: [
      "안전 — 외부 시연 시 PL 보험 사전 가입, 사고 시 손해배상 한계 점검",
      "특허 — 시연·발표 전 특허 출원 또는 비공개 NDA 체결, 외부 공개 후 특허성 상실 위험",
      "데이터 무결성 — 모든 실험 raw data + 메타데이터 보관, 사후 인증·분쟁 자료",
      "리드 후보 1개 의존 — 백업 후보 2~3개 병행, 단일 후보 실패 시 회사 위기",
      "예산·일정 — v3 까지 1년 내 도달 못 하면 자본 잠식, 단계별 자본 한계 미리 결정",
      "외부 자문 — 영역 전문가 1명 이상 자문 계약, 회로·바이오 등 미상황 결정 방지",
    ],
    nextSummaryKo: "v0~v3 반복·게이트 통과 → 필드/임상 시험 단계로 진입",
  },
};

const biotech: ClusterStageContent = {
  keyAction: {
    title: "후보물질 스크리닝 + 단계별 결정 기준 — 임상 진입 전 '죽일 후보' 빨리 결정",
    detail: "후보 50-200개 → in vitro 1차 스크리닝 → in vivo 동물 효능·독성 → 임상 진입 후보 선정. 각 단계마다 명시적 cutoff 기준 (효능·안전성·약동학·제조 가능성). 디지털 의료기기는 SaMD 임상 워크플로 통합 검증.",
  },
  facts: [
    {
      icon: FlaskConical,
      label: "스크리닝 깔때기",
      value: "초기 후보 50-200개 → in vitro 통과 5-20% → 동물시험 통과 5-10% → 임상 진입 1-3개. 각 단계 cutoff 미리 정의",
    },
    {
      icon: RefreshCw,
      label: "Digital Medical Device (SaMD) 빠른 경로",
      value: "한국 Digital Medical Device Product Act (2025.01) — SaMD 빠른 인허가 경로. 2025년 IND 승인 126건 중 45-50% 가 SaMD/AI 진단",
      source: "IntoInWorld 2026 · MFDS",
    },
    {
      icon: GitBranch,
      label: "Go/No-Go 데이터",
      value: "효능 (EC50/IC50) + 안전성 (LD50, NOAEL) + 약동학 (PK) + 제조 가능성 (수율·비용) — 4개 모두 통과해야 임상 진입",
    },
  ],
  traps: [
    { label: "후보 1개에 올인 — 실패하면 회사 끝", text: "리드 후보 외 백업 2-3개 동시 진행 필수. 1개 실패 = 회사 위기, 백업 없으면 처음부터 재시작." },
    { label: "Cutoff 기준 없이 진행 — 좋은 데이터 없는데도 임상 진입", text: "임상 1상에서 fail 하면 5-10억 + 1-2년 손실. 동물시험에서 미달 후보는 깨끗하게 폐기." },
  ],
  wrapup: {
    nextStageLabelKo: "필드/임상 시험",
    doneItemsKo: [
      { label: "1. 후보 50~200개 스크리닝", detail: "in vitro 1차 스크리닝 → in vivo 동물 효능·독성 깔때기" },
      { label: "2. Cutoff 기준 정의", detail: "효능(EC50)·안전성(LD50)·약동학(PK)·제조 가능성 4축" },
      { label: "3. 백업 후보 2~3개 동시 진행", detail: "리드 후보 실패 대비 — 1개 의존은 회사 위기" },
      { label: "4. SaMD 빠른 경로 검토", detail: "한국 Digital Medical Device Product Act 활용 가능성 평가" },
    ],
    verifyItemsKo: [
      "GLP 데이터 — 비-GLP 시설 데이터는 IND에서 거절, 처음부터 GLP 또는 인증 CRO 위탁",
      "동물실험 — IACUC 승인 사전 확보, 미승인 시 데이터 무효 + 처분",
      "특허 — 후보 결정 후 특허 출원, 외부 발표 전 출원 완료 (1년 grace period 한계)",
      "독성 — NOAEL 미만 용량으로 임상 1상 설계, 누락 시 IND 거절 또는 임상 중단",
      "제조 가능성 — Lab scale → Pilot → Commercial 3단계 시뮬, 미고려 시 임상 후 제조 불가",
      "예산 — 임상 1상 평균 5~10억, 진입 전 자본 또는 추가 펀딩 사전 확보",
    ],
    nextSummaryKo: "후보 스크리닝·Cutoff 통과 → 필드/임상 시험 단계로 진입",
  },
};

export function PrototypeIterationStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster C — Deep Tech Lab 2/4"
      title="프로토타입 반복 사이클"
      contextLabel="10단계 / 22"
      contentBySubIndustry={{
        "robotics-physical-ai": robotics,
        "biotech-medtech": biotech,
      }}
      defaultContent={biotech}
    />
  );
}
