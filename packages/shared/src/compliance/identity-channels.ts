/**
 * compliance/identity-channels.ts — 휴대폰 본인인증 채널 SSOT + 선택기 로직.
 *
 * 문제(구함 사례 2026-09): 포트원 V2 본인인증 채널 3종의 차이(비용 모델·성별/내외국인 반환·테스트 환경·
 *   보증보험·계약 기간)는 문서 3~4개를 교차해야 보인다. 성별이 핵심인 서비스가 '싼 채널'(통합인증)을 고르면
 *   치명적이고, 테스트가 필요한데 다날을 고르면 계약 전까지 아무것도 돌려볼 수 없다.
 *
 * 파운드원이 대신 하는 것: 서비스 요건(성별·내외국인·월 건수·출시 전 테스트·결제 병행)을 받아
 *   채널을 걸러 순위를 매기고, 월 비용을 추정하고, 콘솔에서 눌러야 할 것과 누르면 안 되는 것(카드 PG 가입비)을 붙여준다.
 *
 * 사실 규칙: 수치는 아래 sources 의 공개 페이지 값만. 없는 값은 null 로 두고 화면은 "미확인" 으로 표기.
 *   - 다날: 요금제 5만/1,200 · 10만/2,400 · 20만/4,800 · 30만/7,200, 직계약 등록비 10만(VAT별도), 포트원 경유 가입비 무료,
 *           절차에 보증보험(1년) 가입 단계 포함(본인확인 서비스 소개 페이지 6단계 중 4단계). 소요 다날 FAQ 7~10일 / 구함 체감 2~3주.
 *           서류(개인): 계약서 원본 2부·사업자등록증 사본·인감증명서 원본(전자계약 시 제외)·신분증 앞뒤·고객정보 및 실제소유자 확인서.
 *   - NHN KCP: 응답 성별코드·내외국인·통신사·CI·DI, 테스트 서버(testcert.kcp.co.kr, 사전 발급 키). 요금 공개 페이지 없음(1666-6410).
 *   - KG이니시스 통합인증: 건당 40원, 내외국인·통신사·성별 미응답(포트원 개발자 문서).
 *
 * 소비처: 웹 AuthChannelPickerWidget · iOS BUAuthChannelPicker(JSON 코드젠 compliance-data.json).
 */

export type IdentityChannelId = "danal" | "kcp" | "inicis-unified";

export type MonthlyPlan = { monthlyKrw: number; cases: number };

export type IdentityChannel = {
  id: IdentityChannelId;
  name: string;
  /** 인증 방식 한 줄. */
  method: string;
  /** 요금 모델. plans = 월정액 티어, perCaseKrw = 건당. 둘 다 null 이면 공개 요금 없음(견적). */
  plans: MonthlyPlan[] | null;
  perCaseKrw: number | null;
  /** 포트원 경유 가입비(0=무료). null=미확인. */
  joinFeeViaPortoneKrw: number | null;
  /** 직계약 등록비(VAT별도). null=미확인. */
  joinFeeDirectKrw: number | null;
  /** 성별·내외국인 반환. null=미확인. */
  returnsGender: boolean | null;
  returnsForeigner: boolean | null;
  /** 계약 전 테스트 환경. null=미확인. */
  testBeforeContract: boolean | null;
  testNote: string;
  /** 보증보험 요구. null=미확인. */
  suretyBond: boolean | null;
  suretyNote: string;
  /** 계약 소요 — 출처별 표기(충돌 시 둘 다). */
  contractLeadTime: string;
  /** 개인사업자 계약 서류(공식 안내 기준). 비어 있으면 미확인. */
  documents: string[];
  /** 요금 문의처(공개 요금 없을 때). */
  quoteContact: string | null;
  sources: Array<{ label: string; url: string }>;
};

export const IDENTITY_CHANNELS: readonly IdentityChannel[] = [
  {
    id: "danal",
    name: "다날 휴대폰 본인인증",
    method: "휴대폰(PASS앱/SMS) 본인확인 — 통신3사 대행",
    plans: [
      { monthlyKrw: 50_000, cases: 1_200 },
      { monthlyKrw: 100_000, cases: 2_400 },
      { monthlyKrw: 200_000, cases: 4_800 },
      { monthlyKrw: 300_000, cases: 7_200 },
    ],
    perCaseKrw: null,
    joinFeeViaPortoneKrw: 0,
    joinFeeDirectKrw: 100_000,
    returnsGender: true,
    returnsForeigner: null,
    testBeforeContract: false,
    testNote: "계약 전 테스트 채널 없음(구함 확인, 2026-09). 다날 절차상 '모듈 설치 및 테스트'는 계약·등록비·보증보험 뒤 5단계.",
    suretyBond: true,
    suretyNote: "다날 본인확인 서비스 신청 절차에 보증보험(1년, 만료 시 재가입) 가입 단계 포함. 보험료 미확인.",
    contractLeadTime: "다날 FAQ: 실서비스 오픈까지 약 7~10일 / 구함 체감(포트원 경유): 2~3주",
    documents: [
      "계약서 원본 2부(본인확인: 통합계약서 + 특약서)",
      "사업자등록증 사본 1부",
      "인감증명서 원본(대표자 명의) 1부 — 전자계약 시 제외",
      "대표자 신분증 앞·뒤 사본",
      "고객정보 및 실제소유자 확인서",
    ],
    quoteContact: null,
    sources: [
      { label: "포트원 블로그 — 본인인증 도입 방법", url: "https://blog.portone.io/authorization-payment-2/" },
      { label: "다날 신청 절차", url: "https://www.danalpay.com/service_application/application_process" },
      { label: "다날 본인확인 서비스", url: "https://www.danalpay.com/service_introduction/personal_check" },
    ],
  },
  {
    id: "kcp",
    name: "NHN KCP 휴대폰 본인확인",
    method: "휴대폰(PASS앱/SMS) 본인확인 — 통신3사 대행",
    plans: null,
    perCaseKrw: null,
    joinFeeViaPortoneKrw: 0,
    joinFeeDirectKrw: null,
    returnsGender: true,
    returnsForeigner: true,
    testBeforeContract: true,
    testNote: "테스트 서버 testcert.kcp.co.kr — 테스트용 인증키가 사전 발급되어 별도 요청 없이 연동 가능(KCP 개발자센터).",
    suretyBond: null,
    suretyNote: "미확인",
    contractLeadTime: "미확인",
    documents: [],
    quoteContact: "NHN KCP 고객센터 1666-6410 (요금제 공개 페이지 없음, 월 기본 건수 이월 없음·인증 시도 기준 과금)",
    sources: [
      { label: "KCP 개발자센터 — 본인확인 V2", url: "https://developer.kcp.co.kr/guide/cert" },
      { label: "sir.kr — KCP 휴대폰 본인확인 안내", url: "https://sir.kr/services/auth/kcp" },
    ],
  },
  {
    id: "inicis-unified",
    name: "KG이니시스 통합인증",
    method: "카카오·네이버 등 민간 인증서(간편인증)",
    plans: null,
    perCaseKrw: 40,
    joinFeeViaPortoneKrw: 0,
    joinFeeDirectKrw: null,
    returnsGender: false,
    returnsForeigner: false,
    testBeforeContract: null,
    testNote: "미확인",
    suretyBond: null,
    suretyNote: "미확인",
    contractLeadTime: "미확인",
    documents: [],
    quoteContact: null,
    sources: [
      { label: "포트원 개발자 문서 — 본인인증 연동(V2)", url: "https://developers.portone.io/opi/ko/extra/identity-verification/readme-v2?v=v2" },
    ],
  },
];

/* ───────────────────────── 선택기 ───────────────────────── */

export type IdentityRequirements = {
  /** 성별이 서비스 로직에 필요한가(만남·성별 격리 등). */
  needsGender: boolean;
  /** 내외국인 구분이 필요한가. */
  needsForeigner: boolean;
  /** 월 예상 인증 건수(가입 수 기준). */
  monthlyCases: number;
  /** 출시 전에 실제 인증 흐름을 돌려봐야 하는가. */
  needsPreLaunchTest: boolean;
  /** 결제(카드 등)도 같이 받는가. false 면 '본인인증만' 시나리오. */
  acceptsPayments: boolean;
};

export type ChannelVerdict = {
  channelId: IdentityChannelId;
  name: string;
  /** "recommended" = 1순위, "possible" = 조건 충족(차순위), "excluded" = 요건 미충족. */
  status: "recommended" | "possible" | "excluded";
  /** 순위 근거·탈락 사유(화면에 그대로). */
  reasons: string[];
  /** 월 비용 추정 라벨. 공개 요금 없으면 "견적 문의". */
  monthlyCostLabel: string;
  /** 추정 월 비용(원). 알 수 없으면 null. */
  monthlyCostKrw: number | null;
  warnings: string[];
};

export type IdentityRecommendation = {
  verdicts: ChannelVerdict[];
  /** 결제 안 받는 앱이 포트원 콘솔에서 밟아야 할 클릭 경로 + 피해야 할 화면. */
  consoleSteps: string[];
  /** 요건과 무관하게 항상 붙는 경고(33만 원 화면 등). */
  globalWarnings: string[];
};

/** 월정액 티어에서 건수를 덮는 최소 요금제. 최대 티어 초과면 null. */
export function pickPlan(plans: MonthlyPlan[], monthlyCases: number): MonthlyPlan | null {
  const sorted = [...plans].sort((a, b) => a.cases - b.cases);
  return sorted.find((p) => p.cases >= Math.max(0, monthlyCases)) ?? null;
}

function costFor(ch: IdentityChannel, monthlyCases: number): { label: string; krw: number | null } {
  if (ch.plans) {
    const plan = pickPlan(ch.plans, monthlyCases);
    if (!plan) return { label: `월 ${monthlyCases.toLocaleString("ko-KR")}건은 공개 요금제(최대 7,200건) 초과 — 견적 문의`, krw: null };
    return { label: `월정액 ${plan.monthlyKrw.toLocaleString("ko-KR")}원 (${plan.cases.toLocaleString("ko-KR")}건 요금제)`, krw: plan.monthlyKrw };
  }
  if (ch.perCaseKrw != null) {
    const krw = ch.perCaseKrw * Math.max(0, monthlyCases);
    return { label: `건당 ${ch.perCaseKrw}원 × ${monthlyCases.toLocaleString("ko-KR")}건 = 약 ${krw.toLocaleString("ko-KR")}원`, krw };
  }
  return { label: ch.quoteContact ? `견적 문의 — ${ch.quoteContact}` : "견적 문의", krw: null };
}

/** 포트원 콘솔 클릭 경로 — 구함 실측(2026-09) + 포트원 콘솔 가이드(본인인증은 별도 섹션). */
export const PORTONE_CONSOLE_STEPS_IDENTITY_ONLY: readonly string[] = [
  "포트원 관리자콘솔 좌측 하단 [전자결제 신청] — 이름이 '결제'지만 본인인증도 여기서 신청합니다.",
  "'전자결제 직접 선택하기' → 일반결제·간편결제·해외결제·본인인증 4개 섹션 중 **본인인증 섹션만** 선택합니다.",
  "결제수단(신용카드 등)이 기본으로 체크돼 있으면 **모두 해제** — 카드가 포함된 채 제출되면 카드 PG 가입비 결제 화면으로 이어집니다.",
  "채널 추가에서 대행사(다날 등)를 고르면 결제 모듈만 보입니다. 다음 단계 **'채널 속성' 토글에서 본인인증**을 켭니다.",
  "약 3영업일 내 대행사 담당자가 연락 — 계약서·서류(아래 목록)를 미리 준비하면 여기서 시간을 아낍니다.",
];

const CARD_PG_TRAP =
  "33만 원(카드 PG 가입비 30만 + VAT) 결제 화면이 뜨면 결제하지 마세요 — 결제 안 받는 앱은 해당 없음. 본인인증은 포트원 경유 가입비 무료(구함 콘솔 실측, 2026-09).";

export function recommendIdentityChannel(req: IdentityRequirements): IdentityRecommendation {
  const verdicts: ChannelVerdict[] = IDENTITY_CHANNELS.map((ch) => {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let excluded = false;

    if (req.needsGender && ch.returnsGender === false) {
      excluded = true;
      reasons.push("성별을 응답하지 않음 — 성별이 필요한 서비스엔 부적합");
    }
    if (req.needsGender && ch.returnsGender === true) reasons.push("성별 반환");
    if (req.needsGender && ch.returnsGender === null) warnings.push("성별 반환 여부 미확인 — 계약 전 확인");

    if (req.needsForeigner && ch.returnsForeigner === false) {
      excluded = true;
      reasons.push("내외국인을 응답하지 않음");
    }
    if (req.needsForeigner && ch.returnsForeigner === true) reasons.push("내외국인 반환");
    if (req.needsForeigner && ch.returnsForeigner === null) warnings.push("내외국인 반환 여부 미확인 — 계약 전 확인");

    if (req.needsPreLaunchTest) {
      if (ch.testBeforeContract === true) reasons.push("계약 전 테스트 가능 — 출시 전 검증 OK");
      if (ch.testBeforeContract === false) warnings.push(`계약 전 테스트 불가 — ${ch.testNote}`);
      if (ch.testBeforeContract === null) warnings.push("테스트 환경 미확인 — 계약 전 확인");
    }

    const cost = costFor(ch, req.monthlyCases);
    if (ch.suretyBond === true) warnings.push(`보증보험 필요 — ${ch.suretyNote}`);

    return {
      channelId: ch.id,
      name: ch.name,
      status: excluded ? "excluded" : "possible",
      reasons,
      monthlyCostLabel: cost.label,
      monthlyCostKrw: cost.krw,
      warnings,
    };
  });

  // 순위: 요건 충족 채널 중 (테스트 필요 시) 테스트 가능 > 비용 알려진 것 중 저렴 > 나머지.
  const eligible = verdicts.filter((v) => v.status !== "excluded");
  const byId = (id: IdentityChannelId) => IDENTITY_CHANNELS.find((c) => c.id === id)!;
  const rank = (v: ChannelVerdict): number => {
    const ch = byId(v.channelId);
    let score = 0;
    if (req.needsPreLaunchTest && ch.testBeforeContract === true) score += 100;
    if (req.needsPreLaunchTest && ch.testBeforeContract === false) score -= 50;
    if (v.monthlyCostKrw != null) score += 20;
    if (v.monthlyCostKrw != null) score -= v.monthlyCostKrw / 100_000; // 10만원당 -1
    return score;
  };
  const top = [...eligible].sort((a, b) => rank(b) - rank(a))[0];
  if (top) top.status = "recommended";

  const consoleSteps = req.acceptsPayments ? [] : [...PORTONE_CONSOLE_STEPS_IDENTITY_ONLY];
  const globalWarnings = req.acceptsPayments ? [] : [CARD_PG_TRAP];

  // 추천 순으로 정렬해 반환(recommended → possible → excluded).
  const order = { recommended: 0, possible: 1, excluded: 2 } as const;
  verdicts.sort((a, b) => order[a.status] - order[b.status]);
  return { verdicts, consoleSteps, globalWarnings };
}
