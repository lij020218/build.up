/**
 * stage-key-actions.ts — 특수업종(specialty)별 KEY ACTION SSOT.
 *
 * 사장님 신고 (2026-06-30): "스터디카페면 스터디카페, 편의점이면 편의점, SaaS면 SaaS —
 *   업종에 정확히 맞는 KEY ACTION이 나와야 한다. 특수업종 단위까지."
 *
 * 구조: STAGE_KEY_ACTIONS_BY_SPECIALTY[key][stageId] = { title, detail, bullets }
 *   - key 는 세부업종(specialty) id (예: "study-cafe-space", "convenience-small")
 *     또는 대분류(category) id (예: "startup-tech") 둘 다 가능.
 *   - resolveSpecialtyKeyAction 이 specialty → category 순으로 조회, 없으면 null →
 *     호출부가 기존 cluster/글로벌 KEY ACTION 으로 폴백(절대 빈 화면 X).
 *
 * 패턴: cluster-budget-benchmarks.ts 의 resolveBudgetBenchmark(specialty 우선) 와 동일.
 * 코드젠: scripts/gen-stage-key-actions.mts → apps/ios/.../Resources/stage-key-actions.json (iOS 심링크/번들).
 *
 * 콘텐츠 규칙: 2026 최신 정보를 웹으로 검증한 것만. 추측·일반론 금지. 업종 고유의
 *   "이 단계에서 진짜 중요한 1가지"를 title 로, 근거·디테일을 detail 로, 실행 3줄을 bullets 로.
 */

export type SpecialtyKeyAction = {
  /** 이 업종이 이 단계에서 꼭 해야 할 핵심 한 줄 */
  title: string;
  /** 왜·어떻게 (업종 고유 근거 + 2026 디테일) */
  detail: string;
  /** 실행 체크 3줄 (UI 미니카드/불릿) */
  bullets?: string[];
};

/**
 * 특수업종(또는 대분류)별 × 단계별 KEY ACTION.
 *   플래그십(2026-06-30): pre-launch-final 의 study-cafe-space / convenience-small / startup-tech.
 *   이후 60개 specialty × 단계로 확장.
 */
export const STAGE_KEY_ACTIONS_BY_SPECIALTY: Record<string, Record<string, SpecialtyKeyAction>> = {
  // ── 스터디카페 (space 클러스터, 무인 운영) ──
  "study-cafe-space": {
    "pre-launch-final": {
      title: "무인 3종(키오스크·출입·좌석발권) 실거래 1사이클 + 소방·환기 마지막 점검",
      detail:
        "스터디카페는 상주 인력 없이 도는 게 핵심 — 오픈 전 키오스크 결제 → 좌석 발권 → 출입문 개폐 → 이용권 연장까지 본인이 한 바퀴 돌려 끊기는 지점을 잡으세요. 24시간 무인이라 ① 소방(건축법상 피난통로·소화기·비상구 유도등) ② 전열교환기 환기(장시간 체류 CO₂) ③ CCTV·비상벨이 통과돼야 사고·민원이 안 납니다. 앱 좌석 점유·정산이 실제와 일치하는지 마지막으로 대조.",
      bullets: [
        "무인 1사이클: 결제 → 발권 → 출입 → 연장 끊김 점검",
        "소방(피난·소화기·유도등) + 전열교환기 환기 + CCTV·비상벨",
        "앱 좌석 점유·정산 ↔ 실제 일치 대조",
      ],
    },
  },

  // ── 편의점 (retail 클러스터, 본사 프랜차이즈) ──
  "convenience-small": {
    "pre-launch-final": {
      title: "담배소매인 지정·주류면허 게시 + 본사 POS·발주 교육 수료 + 3교대 세팅",
      detail:
        "편의점은 '본사 시스템을 내 매장에 앉히는' 단계 — 오픈 전 ① 담배소매인 지정(관할 구청, 필수)·주류 판매 면허 원본 게시 ② 본사 POS·자동발주 교육 수료 후 실제 테스트 발주 1건 ③ 24시간이면 1일 3교대(야간수당 의무) 인력·매뉴얼 확정. 본사 추천 발주는 맹신하지 말고 상권·초도 물량을 직접 조정하세요. 폐기·유통기한 관리 루틴까지 잡아야 첫 주 로스가 안 터집니다.",
      bullets: [
        "담배소매인 지정·주류면허 원본 게시 (관할 구청)",
        "본사 POS·자동발주 교육 수료 + 테스트 발주 1건",
        "3교대(야간수당)·폐기/유통기한 관리 루틴 확정",
      ],
    },
  },

  // ── SaaS / 기술 스타트업 (대분류 startup-tech) ──
  "startup-tech": {
    "pre-launch-final": {
      title: "배포·결제·모니터링 실거래 1사이클 + PIPA 2025·AI 가이드라인 풋터 락",
      detail:
        "SaaS 출시는 '연결만 끝'이 아니라 '실제로 도는지' 검증 — 오픈 전 ① 프로덕션 배포 + 도메인·SSL ② Stripe/Toss 라이브 100원 결제 → 웹훅 → 환불 1사이클 ③ Sentry/Slack 알람을 실제 에러로 1번 트리거. 법적으로 PIPA(안전조치 미흡 시 글로벌 매출 3% 과징금) + 2025.8 PIPC 생성형 AI 가이드라인(동의 분리·데이터 이동권·국외 사업자 국내대리인)이 풋터·정책에 박혀야 합니다. 런치는 화·수 12:01 PT Product Hunt + 사전 확보 200명이 표준.",
      bullets: [
        "배포 + 결제(100원→웹훅→환불) + 모니터링 실거래 1사이클",
        "PIPA 2025·PIPC 생성형 AI 가이드라인 풋터·정책 락",
        "Product Hunt 화·수 12:01 PT + 사전 200명 확보",
      ],
    },
  },
};

/**
 * specialty(세부업종) → category(대분류) 순으로 KEY ACTION 조회.
 * 없으면 null → 호출부가 기존 cluster/글로벌 KEY ACTION 으로 폴백.
 */
export function resolveSpecialtyKeyAction(
  stageId: string,
  specialtyId?: string,
  categoryId?: string,
): SpecialtyKeyAction | null {
  if (specialtyId && STAGE_KEY_ACTIONS_BY_SPECIALTY[specialtyId]?.[stageId]) {
    return STAGE_KEY_ACTIONS_BY_SPECIALTY[specialtyId][stageId];
  }
  if (categoryId && STAGE_KEY_ACTIONS_BY_SPECIALTY[categoryId]?.[stageId]) {
    return STAGE_KEY_ACTIONS_BY_SPECIALTY[categoryId][stageId];
  }
  return null;
}
