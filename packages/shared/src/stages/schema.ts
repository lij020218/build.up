/**
 * stages/schema.ts — 로드맵 단계 "내용" SSOT 스키마.
 *
 * 목적: 단계의 교육 콘텐츠(왜·단계·요건·함정·유리한 길·체크리스트·마무리)를
 *   웹(Next/TSX)·iOS(SwiftUI)가 **각자 손으로 재구현**하던 구조를 끝내고,
 *   여기 한 곳에 데이터로 정의 → 웹은 React 렌더러로, iOS는 codegen JSON + SwiftUI 렌더러로
 *   **같은 내용을 렌더**한다. 무드리프트(제목·내용 차이)가 구조적으로 불가능해진다.
 *
 * 선례:
 *   - 인-코드 데이터-렌더: ClusterStageContent / ClusterStageTemplate (딥테크 12단계)
 *   - TS SSOT → iOS JSON codegen: mobile-launch-guide.ts → gen-mobile-launch-json.mts
 *
 * 직렬화 규칙(중요): 이 스키마는 JSON 으로 직렬화되어 iOS 가 읽는다.
 *   - 함수·React 컴포넌트·LucideIcon 레퍼런스 금지 → **모두 평문 데이터**.
 *   - 아이콘은 문자열 키(IconKey). 웹은 lucide, iOS는 SF Symbol 로 매핑.
 *   - 색 강조는 의미 토큰(Accent). 플랫폼이 디자인 시스템 색으로 매핑.
 *
 * 인터랙티브 위젯(계산기·폼·토글·서버저장 선택)은 **유일한 비공유점**:
 *   섹션 kind="interactive" + ref(문자열 ID)로 *위치·존재만* 스키마가 보장하고,
 *   실제 구현은 플랫폼별(웹 React 컴포넌트 / iOS SwiftUI 뷰)로 ref→위젯 매핑.
 */

/** 아이콘 문자열 키 — 웹(lucide)·iOS(SF Symbol) 가 각자 매핑. */
export type IconKey =
  | "fileText"
  | "shieldCheck"
  | "building"
  | "alertTriangle"
  | "sparkles"
  | "receipt"
  | "lightbulb"
  | "arrowRight"
  | "checklist"
  // tax-guide 절세팁 등에서 추가
  | "banknote"
  | "clipboard"
  | "percent"
  | "creditCard"
  | "users"
  | "rosette"
  | "calendar";

/** 색 강조 의미 토큰 — 플랫폼이 디자인 시스템 색으로 매핑. */
export type Accent = "midnight" | "blue" | "danger";

/** 인허가 유형. */
export type PermitKind = "신고" | "허가" | "등록" | "면허";

/* ───────────────────────── 공용 데이터 조각 ───────────────────────── */

/** KEY ACTION 히어로 미니카드. */
export type MiniCard = { icon: IconKey; label: string; detail: string };

/** KEY ACTION 히어로 기둥(아이콘 + 라벨 + 메타) — permit-check 식 pillars 히어로. */
export type Pillar = { icon: IconKey; label: string; meta: string };

/** KEY ACTION 히어로(단계 최상단). miniCards 또는 pillars 중 하나 사용. */
export type KeyAction = {
  eyebrow: string;
  title: string;
  /** 평문 — 강조는 렌더러가 처리하지 않음(단순 텍스트). */
  subtitle: string;
  miniCards?: MiniCard[];
  /** pillars 가 있으면 웹은 KeyActionHero(pillars) 렌더(permit-check). */
  pillars?: Pillar[];
};

/** 왜-카드(악센트 점 + 제목 + 본문). */
export type WhyItem = { accent: Accent; title: string; body: string };

/** 번호 단계 한 줄. detailFromCategory 가 있으면 byCategory[cat] 의 해당 키 값으로 detail 을 대체/보강. */
export type Step = {
  title: string;
  detail: string;
  /** byCategory[cat] 에서 가져올 키(예: "industryCodeHint"). 있으면 detail 끝에 이어붙임. */
  detailFromCategory?: keyof CategoryContent;
};

/** 비용/소요/장소 같은 메타 3분할. */
export type Meta = { label: string; value: string; sublabel?: string };

/** 외부 링크 칩. */
export type LinkRef = { label: string; url: string };

/** 유리한 길 카드. */
export type PathCard = { condition: string; recommendation: string; reason: string };

/** 페이지별 KEY ACTION 히어로(tax-guide 처럼 페이지마다 다른 단계). */
export type PageKeyAction = { title: string; detail: string };

/** 신고/일정 행(날짜 칩 + 제목 + 상세). */
export type ScheduleRow = { date: string; title: string; detail: string };

/** 아이콘 카드(절세팁 등). */
export type IconCard = { icon: IconKey; label: string; detail: string };

/** 경고 콜아웃 항목. */
export type TrapItem = { label: string; text: string };

/** 세무사(전문가) 필요 시점 카드. recommend=false 면 "직접 처리 OK" 톤. */
export type CpaNeed = { condition: string; reason: string; recommend?: boolean };

/** 비교 카드(과세유형 가이드 등). */
export type ComparisonCard = { title: string; criteria?: string; desc: string };

/** 아이콘 배지 링크 카드(공식 사이트 바로가기). */
export type LinkCard = { name: string; desc: string; url: string; badge: string };

/* ── permit-check 식 stageOverview / workStep / axisChecklist ── */

/** 통계 강조(예: 70% · "사전점검 안하는 사장님 비율"). */
export type Stat = { value: string; label: string };

/** 작업 목차 한 줄. */
export type OutlineItem = { title: string; detail: string; time?: string };

/** WorkStep 할 일 한 줄(id 는 axisChecklist 토글·게이팅과 공유). */
export type WorkStepTask = { id: string; title: string; detail: string };

/** WorkStep 본문(업종별 분기 데이터) — why + 할 일 + 주의. */
export type WorkStepData = { why: string; tasks: WorkStepTask[]; watchouts: TrapItem[] };

/** 사장님 상황 권장(WorkStep 하단) — 업종별. */
export type Favorable = { context: string; recommendation: string; rationale: string };

/** 정적 게이팅 체크리스트 항목(contract-review 9대 조항 등) — 인라인, 전 업종 공통. */
export type GateItem = { id: string; label: string; detail?: string };

/** 정적 안내 콜아웃 한 줄(contract-review "계약 후 즉시 할 일" 등). */
export type NoteItem = string;

/* ─────────────────── 카테고리(업종)별 분기 데이터 ─────────────────── */

/** 웹 PERMIT_BY_CATEGORY 의 풍부한 인허가 정보(서류·요건·비용·기간). */
export type PermitInfo = {
  kind: PermitKind;
  name: string;
  where: string;
  cost: string;
  duration: string;
  documents: string[];
  requirements: string[];
  externalUrl?: string;
  description: string;
};

/** iOS requiredPermits 의 인허가 항목(발급기관·처리일 리스트). */
export type PermitRequirement = {
  label: string;
  agency: string;
  detail: string;
  estimatedDays: number;
};

/**
 * 한 업종(카테고리)에 종속된 콘텐츠. 키는 CategoryId.rawValue(=웹 industryCategoryId).
 * 필드는 stage 별로 필요한 것만 채운다(label 만 필수). 예: registration-setup 은
 * permit/pitfalls/weeklyChecklist, tax-guide 는 schedule/taxTips/cpaNeeded 등.
 */
export type CategoryContent = {
  /** 한국어 카테고리 라벨(음식점, 카페·디저트 …). */
  label: string;

  /* ── registration-setup 등에서 쓰는 인허가 데이터(모두 optional) ── */
  /** 국세청 업종코드 힌트(사업자등록 step). */
  industryCodeHint?: string;
  /** 풍부한 인허가 정보(웹 PermitInfo). */
  permit?: PermitInfo;
  /** 인허가 항목 리스트(iOS requiredPermits) — 발급기관·처리일. */
  requiredPermits?: PermitRequirement[];
  /** 자주 거절·지연 사유(iOS pitfalls, 전 업종). */
  pitfalls?: string[];
  /** 이번 주 체크리스트 — 발급 순서(iOS weeklyChecklist). */
  weeklyChecklist?: string[];
  /** 업종 특성 유리한 길(웹 카테고리별 PathCard). 없으면 일반 paths 만. */
  extraPath?: PathCard;

  /* ── tax-guide 등에서 쓰는 페이지·업종 종속 데이터(모두 optional) ── */
  /** 페이지 id → 페이지별 KEY ACTION 히어로. */
  pageKeyActions?: Record<string, PageKeyAction>;
  /** 신고/일정 표(date·title·detail). */
  schedule?: ScheduleRow[];
  /** 절세팁 등 아이콘 카드. */
  taxTips?: IconCard[];
  /** 페이지 id → 경고 콜아웃 항목. */
  trapsByPage?: Record<string, TrapItem[]>;
  /** 전문가(세무사) 필요 시점. */
  cpaNeeded?: CpaNeed[];
  /** 게이팅 체크리스트(id·label·detail). interactive taxChecklist 가 렌더+게이트.
   *  required=true 인 항목만 "다음 단계" 게이트에 포함(나머지는 권장). */
  taxChecklist?: Array<{ id: string; label: string; detail: string; required?: boolean }>;

  /* ── permit-check 등에서 쓰는 축(axis)별 데이터(optional) ── */
  /** axis(building/person/facility/...) → WorkStep 본문(why·tasks·watchouts). */
  workSteps?: Record<string, WorkStepData>;
  /** 사장님 상황 권장(협상 페이지). */
  favorable?: Favorable;
};

/* ───────────────────────────── 섹션 ──────────────────────────────── */

/** 인터랙티브 위젯 참조 ID — 플랫폼이 ref→네이티브 위젯으로 매핑. */
export type InteractiveRef =
  | "storeName"        // 상호명 입력(서버 저장)
  | "hometaxLink"      // 홈택스 바로가기
  | "bizRegToggle"     // 사업자등록 완료 토글
  | "permitToggle"     // 인허가 발급 완료 토글
  | "taxTypeSelect"    // 과세유형 선택(간이/일반, 서버 저장)
  | "docUpload"        // 서류 업로드
  | "vatCalendarToggle" // 세금 신고 캘린더 등록 완료 토글(tax-guide)
  | "taxChecklist"     // 필수 세무 세팅 체크리스트(게이팅)
  | "cpaDecision"      // 세무사/직접 결정(서버 저장, 게이팅)
  | "taxFaq"           // 세무 FAQ(+AI) 위젯
  | "liveData"         // 영업 현황/생존율 라이브 데이터(API, permit-check)
  | "permitCards"      // 업종별 인허가 체크리스트 카드(getPermitsForCategory)
  | "contractSign"     // 임대 계약서 서명 완료 토글(게이팅, contract-review)
  | "contractAiAnalysis" // 계약서 원문 붙여넣기 → AI 위험조항 분석(contract-review)
  // ── hiring-setup ──
  | "hiringPlan"          // 내 채용 계획 입력(staffPlan 영속 → 재무검토 연동)
  | "hiringCalculator"    // 시급·시간 → 사업주 4대보험 포함 실부담 시뮬
  | "soloOperator"        // 1인 운영(직원 없음) 토글 — 채용 없이 단계 통과
  | "hiringContractDone"  // 근로계약서 작성·교부 완료 토글(게이팅)
  | "hiringInsuranceDone" // 4대보험 신고 완료 토글
  | "hiringPayslipDone";  // 급여명세서 자동 발송 셋업 토글

/**
 * 섹션 프리미티브. kind 로 분기.
 *  - 정적(static): whyList·stepList·pathCards·infoCard·wrapup — 전 업종 공통.
 *  - 업종분기(byCategory): permit·pitfalls·checklist — byCategory[cat] 에서 읽음.
 *  - interactive: 플랫폼별 위젯(위치·존재만 보장).
 */
export type Section =
  | { kind: "whyList"; eyebrow?: string; subtitle?: string; items: WhyItem[] }
  | {
      kind: "stepList";
      icon?: IconKey;
      eyebrow: string;
      subtitle?: string;
      steps: Step[];
      meta?: Meta[];
      links?: LinkRef[];
    }
  /** byCategory[cat].permit(+requiredPermits) 렌더. */
  | { kind: "permit"; icon?: IconKey }
  /** byCategory[cat].pitfalls 렌더. */
  | { kind: "pitfalls"; title: string }
  | {
      kind: "pathCards";
      icon?: IconKey;
      eyebrow: string;
      subtitle?: string;
      cards: PathCard[];
      /** true 면 byCategory[cat].extraPath 를 마지막에 덧붙임. */
      includeCategoryPath?: boolean;
    }
  /** byCategory[cat].weeklyChecklist 렌더. */
  | { kind: "checklist"; eyebrow: string }
  | { kind: "infoCard"; icon?: IconKey; accent?: Accent; title: string; body: string }
  /** 페이지별 KEY ACTION 히어로 — byCategory[cat].pageKeyActions[현재 pageId]. */
  | { kind: "pageKeyAction"; icon?: IconKey }
  /** 신고/일정 표 — byCategory[cat].schedule. */
  | { kind: "scheduleList"; eyebrow: string }
  /** 아이콘 카드 목록(절세팁 등) — byCategory[cat].taxTips. */
  | { kind: "iconCardList"; eyebrow: string; subtitle?: string }
  /** 경고 콜아웃 — byCategory[cat].trapsByPage[현재 pageId]. */
  | { kind: "calloutWarning"; severity?: "danger" | "warn"; title?: string }
  /** 비교 카드(과세유형 가이드 등) — 정적. */
  | { kind: "comparisonCards"; eyebrow: string; cards: ComparisonCard[] }
  /** 전문가 필요 시점 — byCategory[cat].cpaNeeded. */
  | { kind: "cpaCriteria"; eyebrow: string; subtitle?: string }
  /** 아이콘 배지 링크 카드 — 정적. */
  | { kind: "linkCards"; eyebrow: string; links: LinkCard[] }
  /** 단계 개요(헤드라인+stat+작업목차+결과박스) — 정적. permit-check 페이지0. */
  | {
      kind: "stageOverview";
      headline: string;
      intro: string;
      stat: Stat;
      outlineEyebrow: string;
      workOutline: OutlineItem[];
      outcomeTitle: string;
      outcome: string;
    }
  /**
   * 작업 단계(WorkStep) — stepLabel·time·headline·why·tasks·watchouts·favorable.
   * axis 로 byCategory[cat].workSteps[axis] 에서 why/tasks/watchouts 조회.
   * inline tasks/why/watchouts 가 있으면 그것을 우선(정적 단계: 협상).
   */
  | {
      kind: "workStep";
      axis: string;
      stepLabel: string;
      time?: string;
      headline: string;
      why?: string;
      tasks?: WorkStepTask[];
      watchouts?: TrapItem[];
      /** true 면 byCategory[cat].favorable 를 하단에 표시. */
      showFavorable?: boolean;
    }
  /**
   * 축별 게이팅 체크리스트 — building/person/facility 토글(byCategory[cat].workSteps[axis].tasks).
   * interactive 가 아닌 정적 선언이지만 토글 상태·게이팅은 렌더러가 관리.
   */
  | {
      kind: "axisChecklist";
      eyebrow: string;
      subtitle?: string;
      axes: Array<{ axis: string; icon: IconKey; title: string }>;
    }
  /**
   * 정적 게이팅 체크리스트 — 인라인 items(전 업종 공통). contract-review 9대 핵심 조항.
   * 모든 항목 체크 시 게이트 통과(상태·게이팅은 렌더러/footer 가 관리).
   */
  | {
      kind: "gateChecklist";
      eyebrow: string;
      subtitle?: string;
      items: GateItem[];
      /** 전부 체크되면 표시할 완료 메시지(예: "모든 항목 확인 완료! 계약 체결 가능"). */
      doneNote?: string;
    }
  /** 정적 안내 콜아웃(제목 + 인라인 항목) — contract-review "계약 후 즉시 할 일". */
  | { kind: "noteList"; severity?: "danger" | "warn"; title: string; items: NoteItem[] }
  /** 마지막 페이지 마무리 — 단계 최상위 wrapup 데이터를 렌더(웹) / BUStageShell(iOS). */
  | { kind: "wrapup" }
  /** 플랫폼별 인터랙티브 위젯. config 는 ref 별 임의 설정(loose). */
  | {
      kind: "interactive";
      ref: InteractiveRef;
      /** 이 ref 를 렌더할 플랫폼(미지정=양쪽). 미구현 플랫폼은 자연스럽게 생략. */
      platforms?: Array<"web" | "ios">;
      config?: Record<string, unknown>;
    };

/** 한 페이지(위저드 탭). */
export type StagePage = {
  id: string;
  /** 페이지 네비 라벨. */
  label: string;
  sections: Section[];
};

/** 마무리(StageWrapup / BUStageShell wrapup) 데이터. */
export type WrapupData = {
  nextStageLabel: string;
  doneItems: Array<{ label: string; detail: string }>;
  verifyItems: string[];
  nextSummary: string;
};

/** 한 단계의 전체 콘텐츠 SSOT. */
export type StageContent = {
  /** stageId(예: "registration-setup"). */
  stageId: string;
  /** iOS BUStageShell 상단 + 게이팅 카피. */
  shell: {
    title: string;
    stageEyebrow: string;
    helperText: string;
  };
  /** 단계 상단 히어로(nav 위). 페이지별 히어로를 쓰는 단계(tax-guide)는 생략하고
   *  섹션 kind="pageKeyAction" 사용. */
  keyAction?: KeyAction;
  pages: StagePage[];
  /** 업종(카테고리)별 분기 데이터. 키 = CategoryId.rawValue. */
  byCategory: Record<string, CategoryContent>;
  wrapup: WrapupData;
  /** wrapup 렌더 위치: "page"=전용 마무리 페이지의 kind:"wrapup" 섹션(기본),
   *  "always"=웹은 모든 페이지 하단에 항상 표시(iOS는 BUStageShell 처리). */
  wrapupMode?: "page" | "always";
};
