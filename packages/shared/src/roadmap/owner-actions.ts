/**
 * owner-actions.ts — "사장님만 할 수 있는 일" 분업 명세 SSOT
 *
 * 사용자 요구 원문 (2026-08-03):
 *   "사업은 하고 싶은데 너무 복잡하고 어렵고 귀찮아. AI가 어려운 건 해결해주고
 *    내가 해야 할 부분만 남겨주면 좋겠다."
 *
 * 설계 원칙:
 *  1) **결정론** — LLM 산출물이 아니다. 트랙(오프라인/온라인/스타트업)별 고정 목록에
 *     생성 결과의 실데이터(permitsDetailed 의 장소·비용·기간)만 병합한다.
 *     같은 입력 → 같은 목록. 환각 불가.
 *  2) **사장님 몫의 정의** = 물리적 실행(방문·발품·서명·결제)과 법적 본인 행위(신청·서명)만.
 *     판단·계산·목록화·순서는 전부 "AI가 준비한 것" 칸으로 — 그게 이 기능의 약속이다.
 *  3) **이중 관리 금지** — 각 액션은 기존 로드맵 단계(stageId)로 딥링크한다.
 *     완료 상태는 단계가 소유하고, 이 목록은 요약 뷰다. 별도 완료 상태를 만들지 않는다.
 *  4) 시간 추정은 관공서 고지 범위(permitsDetailed.duration)가 있으면 그 값, 없으면
 *     보수적 어림("반나절")만. 분 단위 정밀 추정 위조 금지.
 *
 * ⚠️ iOS 미러: apps/ios/Sources/FoundOneCore/OwnerActionsRegistry.swift 와 1:1.
 *    여기 수정 시 양쪽 동시 + owner-actions 가드 테스트 갱신.
 */

export type OwnerActionTrack = "offline" | "online" | "startup";

export type OwnerAction = {
  id: string;
  /** 사장님이 실제로 하는 일 — 동사로 시작, 한 문장 */
  title: string;
  /** 왜 이건 AI 가 대신 못 하는지 (분업의 근거 — 사용자가 납득해야 목록이 짧아 보인다) */
  whyYou: string;
  /** AI/서비스가 이미 준비해 둔 것 — "맨손으로 가지 않는다"는 증거 */
  aiPrepared: string;
  /** 해당 로드맵 단계 — 상세·완료는 여기서 */
  stageId: string;
  /** 예상 소요 — 관공서 고지 범위 or 보수적 어림. 없으면 미표시 */
  estimate?: string;
  /** 인허가 항목에서 온 경우 실비용 (permitsDetailed.cost 그대로) */
  cost?: string;
};

/** 생성 결과에서 이 SSOT 가 쓰는 최소 단면 (packages/ai 타입에 의존하지 않기 위한 구조적 타입) */
export type OwnerActionInput = {
  track: OwnerActionTrack;
  startupType?: "independent" | "franchise";
  permitsDetailed?: Array<{
    name: string;
    kind: string;
    where: string;
    cost: string;
    duration: string;
    required: boolean;
  }>;
  /** 추천 은행 라벨 (moneyInfra.recommendedBank 표시명) */
  recommendedBankLabel?: string;
  /** 과세 유형 라벨 ("간이과세" 등) */
  taxTypeLabel?: string;
};

/**
 * 인허가명 → 담당 단계. 등록/신고류는 registration-setup 이 아니라 permit-check 가
 * 다루는 항목도 있어 이름 기반 매핑 (permit-check 콘텐츠와 동일 어휘).
 */
function permitStageId(permitName: string): string {
  if (/사업자\s*등록/.test(permitName)) return "registration-setup";
  if (/통신판매업/.test(permitName)) return "online-registration";
  return "permit-check";
}

/** moneyInfra.recommendedBank id → 표시명 (프롬프트 enum 과 동일 집합) */
export function bankLabel(id: string | undefined): string | undefined {
  if (!id) return undefined;
  const map: Record<string, string> = {
    ibk: "IBK기업은행", kakaobank: "카카오뱅크", woori: "우리은행", shinhan: "신한은행",
    kb: "KB국민은행", hana: "하나은행", nh: "NH농협", kbank: "케이뱅크", toss: "토스뱅크",
  };
  return map[id];
}

/** industryCategoryId → 분업 트랙 */
export function ownerActionTrackFor(industryCategoryId: string): OwnerActionTrack {
  if (industryCategoryId === "startup-tech") return "startup";
  if (industryCategoryId === "online-digital") return "online";
  return "offline";
}

export function buildOwnerActions(input: OwnerActionInput): OwnerAction[] {
  const actions: OwnerAction[] = [];
  const isFranchise = input.startupType === "franchise";

  if (input.track === "offline") {
    // ── 1. 자리 — 발품은 대신 못 뛴다 ──
    actions.push({
      id: "visit-candidates",
      title: "후보 자리 2~3곳을 직접 가서 보기",
      whyYou: "낮과 밤, 평일과 주말의 그 거리는 직접 서 봐야 압니다.",
      aiPrepared: "방문 시 확인할 체크리스트와 후보지 비교표를 입지 단계에 준비해뒀어요.",
      stageId: "location-candidates",
      estimate: "반나절 × 2~3회",
    });
    actions.push({
      id: "sign-lease",
      title: "임대차 계약서에 서명하기",
      whyYou: "계약 당사자는 사장님입니다. 서명 전 확인이 마지막 방어선이에요.",
      aiPrepared: "계약서 사진을 올리면 AI가 독소조항을 먼저 읽어드립니다. 확정일자(세무서) 안내 포함.",
      stageId: "contract-review",
      estimate: "1일",
    });
    if (isFranchise) {
      actions.push({
        id: "franchise-contract",
        title: "가맹 상담 후 정보공개서 숙려기간 지키고 계약하기",
        whyYou: "가맹 계약도 본인 서명입니다. 14일 숙려기간은 법이 사장님께 준 시간이에요.",
        aiPrepared: "브랜드별 공정위 등록 정보(가맹점 수·평균 매출)와 가맹문의 공식 링크를 정리해뒀어요.",
        stageId: "franchise-application",
        estimate: "2~3주 (숙려기간 포함)",
      });
    }
  }

  // ── 2. 인허가 — 생성 결과의 실데이터를 그대로 (required 만) ──
  const permits = (input.permitsDetailed ?? []).filter((p) => p.required);
  for (const p of permits) {
    // 같은 문장 반복은 시각 피로 — 종류별로 "준비됨"을 다르게 (군더더기 금지 원칙)
    const prepared = /사업자\s*등록/.test(p.name)
      ? "업종코드와 과세 유형 추천까지 채워뒀어요. 홈택스에서 그대로 입력하면 됩니다."
      : p.kind === "교육"
        ? "교육 신청처와 준비물을 단계에 정리해뒀어요. 온라인 수료 가능 여부도 표시돼 있어요."
        : "필요 서류와 순서를 단계에 정리해뒀어요. 순서가 틀리면 반려되는 항목은 순서까지 잠궈뒀습니다.";
    actions.push({
      id: `permit-${p.name}`,
      title: `${p.name} ${p.kind === "허가" ? "받기" : "하기"} — ${p.where}`,
      whyYou: "본인(또는 대표자) 신청이 원칙인 행정 절차입니다.",
      aiPrepared: prepared,
      stageId: permitStageId(p.name),
      ...(p.duration ? { estimate: p.duration } : {}),
      ...(p.cost ? { cost: p.cost } : {}),
    });
  }

  // ── 3. 돈 — 계좌 개설·자금 신청은 본인 확인이 필수 ──
  actions.push({
    id: "open-bank",
    title: `사업용 통장 만들기${input.recommendedBankLabel ? ` (추천: ${input.recommendedBankLabel})` : ""}`,
    whyYou: "계좌 개설은 본인 확인이 필요해 사장님만 할 수 있어요.",
    aiPrepared: "어느 은행이 유리한지, 사업용 카드·홈택스 연동까지 순서를 정리해뒀어요.",
    stageId: input.track === "startup" ? "company-setup" : "registration-setup",
    estimate: "30분 (모바일 개설 기준)",
  });

  if (input.track === "offline") {
    actions.push({
      id: "confirm-construction",
      title: "시공 업체 견적 비교하고 계약하기",
      whyYou: "견적 협상과 계약은 돈 주인의 일입니다. AI는 바가지 신호를 알려드릴 수 있을 뿐이에요.",
      aiPrepared: "업종에 맞는 검증 시공 체크리스트와 견적서에서 확인할 항목을 준비해뒀어요.",
      stageId: "construction-setup",
      estimate: "1~2주",
    });
  }

  if (input.track === "online") {
    actions.push({
      id: "open-store-account",
      title: "판매 채널 계정 만들고 본인 인증하기",
      whyYou: "스마트스토어·마켓 입점의 본인 인증과 정산 계좌 등록은 대표자 몫이에요.",
      aiPrepared: "채널별 입점 순서와 수수료 비교를 준비해뒀어요.",
      stageId: "platform-setup",
      estimate: "1~2시간",
    });
  }

  if (input.track === "startup") {
    actions.push({
      id: "incorporate",
      title: "법인 설립(또는 개인사업자) 등기·등록 마치기",
      whyYou: "설립 등기는 발기인 본인 절차입니다. 온라인(법인설립시스템)으로 가능해요.",
      aiPrepared: `과세 유형${input.taxTypeLabel ? `(추천: ${input.taxTypeLabel})` : ""}·업종코드·설립 순서를 정리해뒀어요.`,
      stageId: "company-setup",
      estimate: "3~7일",
    });
  }

  return actions;
}

/**
 * "AI가 끝낸 것" 요약 — 리뷰 화면 히어로에서 분업의 반대편을 보여준다.
 * 생성 결과에 실제로 존재하는 것만 셀 것 (없는 걸 했다고 말하면 그게 또 위조다).
 */
export type AiDoneSummaryInput = {
  hasIndustryMatch: boolean;
  budgetAllocated: boolean;
  permitCount: number;
  supplierCount: number;
  channelCount: number;
  hasTaxType: boolean;
  hasInsurance: boolean;
  hasMenuOrProducts: boolean;
};

export function buildAiDoneList(s: AiDoneSummaryInput): string[] {
  const done: string[] = [];
  if (s.hasIndustryMatch) done.push("업종 분류와 그에 맞는 로드맵 구성");
  if (s.budgetAllocated) done.push("예산 배분(보증금·인테리어·설비·운전자금)");
  if (s.permitCount > 0) done.push(`필수 인허가 ${s.permitCount}건의 순서·장소·비용 정리`);
  if (s.hasTaxType) done.push("과세 유형 추천과 업종코드 준비");
  if (s.supplierCount > 0) done.push(`공급업체·시공 후보 ${s.supplierCount}곳 선별 (검증 풀 기반)`);
  if (s.channelCount > 0) done.push(`운영 채널 ${s.channelCount}개 우선순위 결정`);
  if (s.hasInsurance) done.push("필요 보험 목록과 대략 보험료");
  if (s.hasMenuOrProducts) done.push("첫 메뉴/상품 구성 초안");
  return done;
}
