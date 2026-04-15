import type { KnowledgeItemRecord, KnowledgeItemSourceRecord } from "./types/freshness";
import type { RecommendationItem, RoadmapStageState } from "./types/roadmap";

export type Language = "en" | "ko";

type StarterCardShape = {
  title: string;
  summary: string;
  points: string[];
};

type GuideRecordShape = KnowledgeItemRecord & {
  sources: KnowledgeItemSourceRecord[];
};

const uiCopy = {
  en: {
    common: {
      language: "Language",
      back: "Back",
      home: "Home",
      connectAndLoad: "Connect and load",
      saveProgress: "Save progress",
      resetDemo: "Reset demo",
      openFullGuideDetail: "Open full guide detail",
      openAuth: "Open auth",
      locationData: "Location data",
      liveKnowledgeLayer: "Live knowledge layer",
      starterFallback: "Starter fallback",
      account: "Account",
      notSetYet: "Not set yet",
      loadingGuide: "Loading guide...",
      guideNotFound: "Guide not found.",
      failedToLoadGuide: "Failed to load guide.",
      saving: "Saving...",
      guideReviewSaveFailed: "Failed to save guide review.",
      sources: "Sources",
      source: "Source",
      verified: "Verified",
      expires: "Expires",
      requiredReviewItem: "Required review item before signing a lease."
    },
    auth: {
      eyebrow: "build.up auth",
      title: "Create an account, sign in, or change password.",
      subtitle:
        "Use your name, email, and password to create an account and continue your roadmap.",
      signup: "Sign up",
      login: "Log in",
      password: "Password",
      name: "Name",
      email: "Email",
      passwordLabel: "Password",
      newPassword: "New password",
      createAccount: "Create account",
      logIn: "Log in",
      logOut: "Log out",
      updatePassword: "Update password",
      initialMessage: "Create an account or sign in to continue.",
      genericError: "Something went wrong.",
      accountCreatedNew:
        "Account created. Your starter roadmap is ready.",
      accountCreatedExisting: "Account created. Your existing roadmap is ready.",
      loggedInNew: "Logged in and created your starter roadmap.",
      loggedIn: "Logged in successfully.",
      passwordUpdated: "Password updated successfully.",
      signedOut: "Signed out."
    },
    home: {
      heroFresh: "Let's start your roadmap with one clear choice.",
      heroActive: "Your next startup step, already lined up.",
      heroFreshBody:
        "New accounts start directly from industry selection, so the first useful decision happens immediately.",
      heroActiveBody:
        "Open build.up and move one clear stage forward. The product keeps your roadmap, profile, and progress aligned without turning the home screen into a cluttered dashboard.",
      today: "Today",
      profile: "Your Business Profile",
      savedFounderSetup: "Saved founder setup",
      profileBody:
        "Completed stages sync into your profile so build.up can keep adapting the roadmap.",
      operationalGuides: "Operational Guides",
      starterFlow: "Starter Flow",
      progress: "Progress",
      completed: "Completed",
      region: "Region",
      unlocked: "Unlocked",
      newlyUnlocked: "Newly unlocked",
      startupType: "Startup type",
      businessModel: "Business model",
      capital: "Capital",
      targetOpenDate: "Target open date",
      preferredRegion: "Preferred region",
      subIndustry: "Sub-industry",
      authRequiredTitle: "Sign in to open your roadmap.",
      authRequiredBody:
        "build.up now keeps roadmap progress per account. Open auth, sign in, and the current step will be restored automatically.",
      authRequiredAction: "Go to auth",
      noAccountSession: "No account session",
      signInRequired: "Sign in required",
      starterRoadmapCreated: "Starter roadmap created",
      loadedFromSupabase: "Loaded from Supabase",
      savedToSupabase: "Saved to Supabase",
      autosaved: "Autosaved",
      loadFailed: "Load failed",
      saveFailed: "Save failed",
      autosaveFailed: "Autosave failed",
      localDemoMode: "Local demo mode",
      notConnected: "Not connected",
      chooseIndustryHelp:
        "Pick one sub-industry first. Startup type comes in the next step.",
      startupTypeHelp:
        "Now choose whether this startup is independent, franchise-led, or still undecided.",
      businessModelHelp:
        "Choose the operating model that best fits your plan. This unlocks budget setup next.",
      budgetHelp:
        "Set capital and a target opening window. The market stage unlocks when both are saved.",
      locationHelp:
        "Review source-backed market candidates, choose one, and move into contract review.",
      contractHelp:
        "This execution step is checklist-driven. Every required review item must be cleared before the contract stage is considered complete.",
      guideHelp:
        "This stage uses verified guidance with freshness metadata. Review the checklist below, confirm the source, then clear the step to keep moving.",
      completeContractReview: "Complete contract review",
      selectMarketAndContinue: "Confirm this market and open contract review",
      completeStarterLoop:
        "The workflow engine has already moved you through industry, model, budget, market selection, contract review, and operating guidance.",
      nextStepIndustry: "Choose a sub-industry and startup type to start your roadmap.",
      nextStepStartupType: "Choose your startup type so the roadmap can branch more cleanly.",
      nextStepModel:
        "Lock the operating model so budget and location guidance can branch correctly.",
      nextStepBudget: "Set a realistic budget and opening date before reviewing markets.",
      nextStepLocation: "Pick one market candidate so contract review can begin.",
      nextStepContract: "Finish the lease review checklist before committing to a space.",
      nextStepPermit: "Review the permit sequence that fits your business before moving on.",
      nextStepTax: "Check the first tax setup guidance before opening.",
      nextStepLoan: "Review financing guidance and current funding assumptions.",
      nextStepDone: "Your first build.up starter loop is complete.",
      markPermitReviewed: "Finish permit review and continue",
      markTaxReviewed: "Finish tax review and continue",
      markLoanReviewed: "Finish loan review and continue",
      noPermitGuide: "No permit guide found for this category yet.",
      noTaxGuide: "No tax guide found for this category yet.",
      noLoanGuide: "No loan guide found for this category yet."
    },
    guide: {
      markPermitReviewedAndReturn: "Mark permit guide reviewed and return",
      markTaxReviewedAndReturn: "Mark tax guide reviewed and return",
      markLoanReviewedAndReturn: "Mark loan guide reviewed and return"
    }
  },
  ko: {
    common: {
      language: "언어",
      back: "뒤로",
      home: "홈",
      connectAndLoad: "불러오기",
      saveProgress: "진행 저장",
      resetDemo: "데모 초기화",
      openFullGuideDetail: "가이드 상세 보기",
      openAuth: "인증 열기",
      locationData: "상권 데이터",
      liveKnowledgeLayer: "실시간 지식 레이어",
      starterFallback: "기본 데모 데이터",
      account: "계정",
      notSetYet: "아직 없음",
      loadingGuide: "가이드를 불러오는 중입니다...",
      guideNotFound: "가이드를 찾을 수 없습니다.",
      failedToLoadGuide: "가이드를 불러오지 못했습니다.",
      saving: "저장 중...",
      guideReviewSaveFailed: "가이드 검토 저장에 실패했습니다.",
      sources: "출처",
      source: "출처",
      verified: "검증일",
      expires: "만료 예정",
      requiredReviewItem: "임대차 계약 전 꼭 확인해야 하는 항목입니다."
    },
    auth: {
      eyebrow: "build.up 인증",
      title: "회원가입, 로그인, 비밀번호 변경",
      subtitle:
        "이름, 이메일, 비밀번호로 계정을 만들고 바로 로드맵을 이어갈 수 있습니다.",
      signup: "회원가입",
      login: "로그인",
      password: "비밀번호",
      name: "이름",
      email: "이메일",
      passwordLabel: "비밀번호",
      newPassword: "새 비밀번호",
      createAccount: "계정 만들기",
      logIn: "로그인",
      logOut: "로그아웃",
      updatePassword: "비밀번호 변경",
      initialMessage: "회원가입하거나 로그인해서 계속 진행하세요.",
      genericError: "문제가 발생했습니다.",
      accountCreatedNew:
        "계정이 생성되었습니다. 스타터 로드맵이 준비됐습니다.",
      accountCreatedExisting: "계정이 생성되었습니다. 기존 로드맵을 바로 이어서 볼 수 있습니다.",
      loggedInNew: "로그인했고 스타터 로드맵도 함께 생성했습니다.",
      loggedIn: "로그인되었습니다.",
      passwordUpdated: "비밀번호가 변경되었습니다.",
      signedOut: "로그아웃되었습니다."
    },
    home: {
      heroFresh: "당신의 앞날을 위한\n첫단계.",
      heroActive: "당신의 앞날을 위한\n첫단계.",
      heroFreshBody:
        "새 계정은 업종 선택부터 바로 시작합니다. 가장 먼저 필요한 결정이 곧바로 화면에 나타납니다.",
      heroActiveBody:
        "build.up을 열면 지금 해야 할 단계 하나에만 집중할 수 있습니다. 로드맵, 프로필, 진행 상태는 계속 동기화되지만 홈은 복잡해지지 않습니다.",
      today: "오늘",
      profile: "내 창업 프로필",
      savedFounderSetup: "저장된 창업 설정",
      profileBody:
        "완료한 단계는 프로필에 자동 반영되어 build.up이 다음 로드맵을 더 정확하게 조정합니다.",
      operationalGuides: "운영 가이드",
      starterFlow: "스타터 플로우",
      progress: "진행률",
      completed: "완료",
      region: "지역",
      unlocked: "해제된 단계",
      newlyUnlocked: "방금 열린 단계",
      startupType: "창업 형태",
      businessModel: "운영 방식",
      capital: "자본금",
      targetOpenDate: "목표 오픈일",
      preferredRegion: "선호 지역",
      subIndustry: "세부 업종",
      authRequiredTitle: "로드맵을 열려면 로그인해주세요.",
      authRequiredBody:
        "이제 build.up은 계정 기준으로 로드맵을 저장합니다. 인증 화면에서 로그인하면 현재 단계를 자동으로 이어서 보여줍니다.",
      authRequiredAction: "인증으로 이동",
      noAccountSession: "계정 세션 없음",
      signInRequired: "로그인 필요",
      starterRoadmapCreated: "스타터 로드맵 생성 완료",
      loadedFromSupabase: "Supabase에서 불러옴",
      savedToSupabase: "Supabase에 저장됨",
      autosaved: "자동 저장됨",
      loadFailed: "불러오기 실패",
      saveFailed: "저장 실패",
      autosaveFailed: "자동 저장 실패",
      localDemoMode: "로컬 데모 모드",
      notConnected: "연결 안 됨",
      chooseIndustryHelp:
        "먼저 세부 업종 하나만 고르세요. 창업 형태는 다음 단계에서 선택합니다.",
      startupTypeHelp:
        "이제 독립 창업인지, 프랜차이즈인지, 아직 미정인지 선택하세요.",
      businessModelHelp:
        "운영 방식을 정하면 그에 맞는 예산 설정 단계가 다음으로 열립니다.",
      budgetHelp:
        "자본금과 목표 오픈 시점을 정하면 상권 검토 단계가 열립니다.",
      locationHelp:
        "출처가 확인된 상권 후보를 비교하고 하나를 고르면 계약 검토 단계로 넘어갑니다.",
      contractHelp:
        "이 단계는 체크리스트 기반입니다. 모든 필수 항목을 확인해야 계약 검토가 완료됩니다.",
      guideHelp:
        "이 단계는 최신성 메타데이터가 붙은 검증 가이드를 사용합니다. 핵심 항목과 출처를 확인한 뒤 다음 단계로 넘어가세요.",
      completeContractReview: "계약 검토를 마치고 다음으로",
      selectMarketAndContinue: "이 상권으로 계약 검토 시작",
      completeStarterLoop:
        "워크플로우 엔진이 업종, 운영 방식, 예산, 상권, 계약 검토, 운영 가이드까지 모두 진행했습니다.",
      nextStepIndustry: "세부 업종 하나를 정해 로드맵을 시작하세요.",
      nextStepStartupType: "이제 창업 형태를 정하면 다음 운영 방식 단계가 열립니다.",
      nextStepModel: "운영 방식을 확정해야 예산과 상권 가이드가 정확하게 분기됩니다.",
      nextStepBudget: "상권을 보기 전에 현실적인 예산과 오픈 시점을 먼저 정하세요.",
      nextStepLocation: "상권 후보 하나를 골라야 계약 검토를 시작할 수 있습니다.",
      nextStepContract: "점포 계약 전에 임대차 체크리스트를 모두 확인하세요.",
      nextStepPermit: "내 업종에 맞는 등록·인허가 순서를 먼저 확인하세요.",
      nextStepTax: "오픈 전 기본 세무 세팅을 먼저 확인하세요.",
      nextStepLoan: "자금 조달과 대출 가정을 검토하세요.",
      nextStepDone: "첫 번째 build.up 스타터 루프를 모두 완료했습니다.",
      markPermitReviewed: "인허가 검토를 마치고 계속",
      markTaxReviewed: "세무 검토를 마치고 계속",
      markLoanReviewed: "대출 검토를 마치고 계속",
      noPermitGuide: "이 카테고리에 맞는 인허가 가이드가 아직 없습니다.",
      noTaxGuide: "이 카테고리에 맞는 세무 가이드가 아직 없습니다.",
      noLoanGuide: "이 카테고리에 맞는 대출 가이드가 아직 없습니다."
    },
    guide: {
      markPermitReviewedAndReturn: "인허가 가이드 확인 후 돌아가기",
      markTaxReviewedAndReturn: "세무 가이드 확인 후 돌아가기",
      markLoanReviewedAndReturn: "대출 가이드 확인 후 돌아가기"
    }
  }
} as const;

export function getUiCopy(language: Language) {
  return uiCopy[language];
}

export function formatStageType(value: string, language: Language) {
  const map = {
    selection: { en: "selection", ko: "선택형" },
    comparison: { en: "comparison", ko: "비교형" },
    execution: { en: "execution", ko: "실행형" },
    verification: { en: "verification", ko: "확인형" }
  } as const;

  return map[value as keyof typeof map]?.[language] ?? value;
}

export function formatStageStatus(value: string, language: Language) {
  const map = {
    locked: { en: "locked", ko: "잠김" },
    available: { en: "available", ko: "대기" },
    in_progress: { en: "in progress", ko: "진행 중" },
    completed: { en: "completed", ko: "완료" }
  } as const;

  return map[value as keyof typeof map]?.[language] ?? value;
}

export function formatStartupType(value: string | undefined, language: Language) {
  if (!value) return uiCopy[language].common.notSetYet;
  const map = {
    independent: { en: "Independent", ko: "독립 창업" },
    franchise: { en: "Franchise", ko: "프랜차이즈" },
    undecided: { en: "Undecided", ko: "미정" }
  } as const;
  return map[value as keyof typeof map]?.[language] ?? value;
}

const categoryCopy: Record<string, { ko: { title: string; summary: string } }> = {
  food: { ko: { title: "외식업", summary: "식당, 배달 전문 주방, 캐주얼 식사형 업종" } },
  "cafe-dessert": { ko: { title: "카페/디저트", summary: "커피, 베이커리, 테이크아웃 음료, 디저트 중심 업종" } },
  retail: { ko: { title: "소매업", summary: "생활용품, 편의형 매장, 전문 소매" } },
  beauty: { ko: { title: "뷰티", summary: "헤어, 네일, 피부관리 등 예약형 서비스" } },
  fitness: { ko: { title: "피트니스", summary: "헬스장, 스튜디오, 멤버십 기반 운동 업종" } },
  education: { ko: { title: "교육", summary: "수업, 과외, 학원, 반복형 교육 서비스" } },
  pet: { ko: { title: "반려동물", summary: "펫 서비스, 미용, 용품, 케어형 매장" } },
  "living-service": { ko: { title: "생활 서비스", summary: "세탁, 청소, 수리, 동네 편의 서비스" } },
  space: { ko: { title: "공간/숙박", summary: "스터디룸, 대여 공간, 게스트하우스, 운영형 공간" } },
  "online-digital": { ko: { title: "온라인/디지털", summary: "이커머스, 디지털 상품, 크리에이터형 비즈니스" } },
  "startup-tech": { ko: { title: "기술 스타트업", summary: "AI, SaaS, 핀테크, 개발도구, 소프트웨어 스타트업" } }
};

export function localizeStarterIndustryCategory<T extends { id: string; title: string; summary: string }>(
  category: T,
  language: Language
) {
  if (language === "en") {
    return category;
  }

  const copy = categoryCopy[category.id];
  return copy ? { ...category, ...copy.ko } : category;
}

export function formatBudgetPresetLabel(value: number, language: Language) {
  if (language === "en") {
    return `KRW ${Math.round(value).toLocaleString("en-US")}`;
  }

  const eok = Math.floor(value / 100000000);
  const man = Math.round((value % 100000000) / 10000);

  if (eok > 0 && man > 0) {
    if (man % 1000 === 0) {
      return `${eok}억 ${man / 1000}천만원`;
    }

    return `${eok}억 ${man.toLocaleString("ko-KR")}만원`;
  }

  if (eok > 0) {
    return `${eok}억원`;
  }

  if (man >= 1000 && man % 1000 === 0) {
    return `${man / 1000}천만원`;
  }

  return `${man.toLocaleString("ko-KR")}만원`;
}

export function formatOpenDatePresetLabel(id: string, label: string, language: Language) {
  if (language === "en") {
    return label;
  }

  const map: Record<string, string> = {
    "open-next-month": "다음 달",
    "open-three-months": "3개월 이내",
    "open-six-months": "6개월 이내",
    "open-nine-months": "9개월 이내",
    "open-next-year": "1년 이내"
  };

  return map[id] ?? label;
}

const recCopy: Record<
  string,
  { ko: { title: string; summary?: string; reasons?: string[]; warnings?: string[]; categoryLabel?: string } }
> = {
  "korean-casual": { ko: { title: "한식/백반/캐주얼 식사", summary: "점심과 저녁 수요가 안정적이고 가장 넓은 고객층을 포괄하는 식사형 업종입니다.", reasons: ["고객 친숙도가 높음", "오피스와 주거가 섞인 지역에 잘 맞음"], warnings: ["주방 인력과 전처리 복잡도가 빠르게 높아질 수 있음"], categoryLabel: "외식업" } },
  "delivery-meals": { ko: { title: "배달 중심 식사형", summary: "소형 점포와 빠른 오픈을 원하는 창업자에게 잘 맞습니다.", reasons: ["좌석 의존도가 낮음", "전면 폭이 좁아도 운영 가능"], warnings: ["플랫폼 수수료와 포장비 관리가 중요"], categoryLabel: "외식업" } },
  "salad-healthy": { ko: { title: "샐러드/건강식", summary: "브랜드 스토리가 분명하고 반복 수요가 있지만, 식재료 폐기 관리가 중요합니다.", reasons: ["오피스/피트니스 고객층과 궁합이 좋음", "깔끔한 브랜드로 프리미엄 가격 가능"], warnings: ["신선 식재료 재고 관리가 민감함"], categoryLabel: "외식업" } },
  "ramen-noodle": { ko: { title: "면/국밥/해장국", summary: "메뉴 집중도가 높고 반복 수요를 만들기 쉬운 식사형 외식 포맷입니다.", reasons: ["고객이 이해하기 쉬움", "점심 수요 상권과 잘 맞음"], warnings: ["맛의 일관성이 바로 중요해짐"], categoryLabel: "외식업" } },
  "chicken-burger": { ko: { title: "치킨/버거/피자", summary: "배달과 테이크아웃을 함께 가져가기 좋은 빠른 회전형 포맷입니다.", reasons: ["메뉴 제안이 명확함", "하이브리드 채널과 잘 맞음"], warnings: ["프로모션 경쟁이 마진을 압박할 수 있음"], categoryLabel: "외식업" } },
  "western-pasta-brunch": { ko: { title: "양식/파스타/브런치", summary: "파스타집, 브런치, 가벼운 양식당을 함께 포괄하는 콘셉트형 외식 카드입니다.", reasons: ["파스타와 브런치 수요를 함께 흡수 가능", "콘셉트형 상권과 잘 맞음"], warnings: ["주방 준비와 고객 기대 수준이 더 높을 수 있음"], categoryLabel: "외식업" } },
  "takeout-coffee": { ko: { title: "테이크아웃 커피", summary: "회전율과 소형 점포 운영을 중시할 때 유리한 형태입니다.", reasons: ["좌석 의존도가 낮음", "작은 공간으로도 빠른 운영 가능"], warnings: ["경쟁이 치열한 상권에서는 차별화가 필요"], categoryLabel: "카페/디저트" } },
  "specialty-coffee": { ko: { title: "스페셜티 커피 바", summary: "원두 품질과 브랜드 감도를 앞세우는 프리미엄 커피형 콘셉트입니다.", reasons: ["프리미엄 포지셔닝에 유리", "단골 고객층 형성에 좋음"], warnings: ["원두 품질과 바 운영의 기본기가 중요"], categoryLabel: "카페/디저트" } },
  "dessert-cafe": { ko: { title: "디저트 카페", summary: "브랜딩과 재방문, SNS 확산 가능성이 높은 형태입니다.", reasons: ["비주얼 브랜딩에 유리", "테이크아웃 중심으로도 시작 가능"], warnings: ["재료 폐기 관리가 원가에 크게 영향"], categoryLabel: "카페/디저트" } },
  "bakery-studio": { ko: { title: "베이커리 스튜디오", summary: "준비 과정은 더 많지만 목적형 방문 상권에서 브랜드 깊이를 만들기 좋습니다.", reasons: ["체감 가치가 높음", "클래스나 브랜디드 상품 확장 가능"], warnings: ["장비와 생산 세팅 때문에 오픈이 늦어질 수 있음"], categoryLabel: "카페/디저트" } },
  "icecream-bingsu": { ko: { title: "아이스크림/빙수", summary: "시즌 피크가 분명하지만 콘셉트와 위치가 맞으면 강한 방문을 만들 수 있습니다.", reasons: ["비주얼 상품 매력이 높음", "목적형 유입을 만들기 좋음"], warnings: ["계절성이 현금흐름에 영향"], categoryLabel: "카페/디저트" } },
  "self-serve-cafe": { ko: { title: "무인/셀프 카페", summary: "인건비 부담을 낮출 수 있지만 위치와 자동화 품질이 더 중요한 카페형 모델입니다.", reasons: ["인력 구조를 가볍게 가져갈 수 있음", "생활형 유동 상권과 잘 맞을 수 있음"], warnings: ["차별화와 기기 유지보수가 중요"], categoryLabel: "카페/디저트" } },
  "convenience-small": { ko: { title: "동네 편의형 매장", summary: "유입은 예측 가능하지만 운영시간과 인력 설계가 중요합니다.", reasons: ["주거 밀집 지역과 궁합이 좋음", "재구매 패턴이 뚜렷함"], warnings: ["긴 운영시간이 인건비 부담으로 이어질 수 있음"], categoryLabel: "소매업" } },
  "lifestyle-goods": { ko: { title: "라이프스타일 소품샵", summary: "큐레이션과 발견 경험이 중요한 브랜드형 소매입니다.", reasons: ["충성 고객을 만들기 좋음", "디자인 상권과 잘 맞음"], warnings: ["재고 매입 통제가 핵심"], categoryLabel: "소매업" } },
  "beauty-supplies": { ko: { title: "뷰티 소매", summary: "큐레이션과 지역 수요가 맞을 때 강점이 생깁니다.", reasons: ["시술 서비스와 결합 가능", "제품 포지셔닝이 비교적 명확"], warnings: ["회전이 느린 재고가 자금을 묶을 수 있음"], categoryLabel: "소매업" } },
  "fashion-accessories": { ko: { title: "패션 액세서리", summary: "편의성보다 큐레이션과 브랜딩이 중요한 소형 패션 소매입니다.", reasons: ["큐레이션 상품에 유리", "SNS 발견형 유입과 잘 맞음"], warnings: ["트렌드 변화가 재고를 빠르게 노후화시킬 수 있음"], categoryLabel: "소매업" } },
  "health-food-store": { ko: { title: "건강식품 매장", summary: "신뢰와 제품 설명이 구매에 직접 연결되는 건강 중심 소매입니다.", reasons: ["건강 수요 니치가 분명함", "정기 구매 묶음이 가능함"], warnings: ["제품 신뢰와 준수 메시지가 중요"], categoryLabel: "소매업" } },
  "unmanned-retail": { ko: { title: "무인/편의형 소매", summary: "저접촉 운영이 가능하지만 상품 구성과 위치 적합도가 더 중요한 소매 모델입니다.", reasons: ["인력 부담을 낮출 수 있음", "작은 상권에도 맞출 수 있음"], warnings: ["도난과 상품 회전 관리가 중요"], categoryLabel: "소매업" } },
  "hair-salon": { ko: { title: "미용실", summary: "재방문 기반이 강한 서비스형 비즈니스입니다.", reasons: ["반복 예약 가능성이 높음", "동네 상권 충성도가 강할 수 있음"], warnings: ["운영자 실력과 직원 품질이 중요"], categoryLabel: "뷰티" } },
  "nail-studio": { ko: { title: "네일 스튜디오", summary: "작은 공간으로도 시작 가능하고 재방문 모델이 뚜렷합니다.", reasons: ["소형 점포 효율이 좋음", "예약 중심으로 스케줄 안정화 가능"], warnings: ["지역 경쟁 밀도가 높을 수 있음"], categoryLabel: "뷰티" } },
  "skin-care-room": { ko: { title: "피부관리실", summary: "신뢰 형성이 중요한 프리미엄 서비스형 업종입니다.", reasons: ["높은 단가 전략 가능", "멤버십 모델로 확장 가능"], warnings: ["허가와 신뢰 구축에 시간이 더 필요"], categoryLabel: "뷰티" } },
  "waxing-studio": { ko: { title: "왁싱 스튜디오", summary: "작은 공간으로도 운영 가능하고 반복 방문을 만들기 쉬운 뷰티 서비스입니다.", reasons: ["소형 공간으로 시작 가능", "반복 방문 구조가 강함"], warnings: ["기술 품질과 프라이버시 경험이 중요"], categoryLabel: "뷰티" } },
  "eyelash-brow": { ko: { title: "속눈썹/눈썹 스튜디오", summary: "공간 요구가 작고 반복 패턴이 뚜렷한 뷰티 시술형 업종입니다.", reasons: ["작은 세팅으로 시작 가능", "업셀 구조가 좋음"], warnings: ["지역 경쟁이 빠르게 치열해질 수 있음"], categoryLabel: "뷰티" } },
  "makeup-bridal": { ko: { title: "메이크업/브라이덜", summary: "예약 중심으로 운영되는 행사·프리미엄 뷰티 서비스 카드입니다.", reasons: ["프리미엄 서비스 구성이 가능", "브랜드 스토리를 만들기 좋음"], warnings: ["수요가 계절과 행사에 영향을 받을 수 있음"], categoryLabel: "뷰티" } },
  "pilates-studio": { ko: { title: "필라테스 스튜디오", summary: "예약과 멤버십을 함께 가져가기 좋은 구조입니다.", reasons: ["반복 매출 구조", "고객군이 비교적 명확함"], warnings: ["강사 스케줄과 이탈 관리가 중요"], categoryLabel: "피트니스" } },
  "pt-gym": { ko: { title: "PT 중심 헬스장", summary: "객단가는 높지만 공간과 인력 구조가 더 중요합니다.", reasons: ["고단가 서비스 가능", "회원권과 PT 업셀 조합 가능"], warnings: ["장비와 임대료 부담이 큼"], categoryLabel: "피트니스" } },
  "yoga-studio": { ko: { title: "요가 스튜디오", summary: "클래스 품질이 안정되면 커뮤니티 기반 유지가 가능합니다.", reasons: ["반복 수업 구조", "지역 커뮤니티 형성 가능"], warnings: ["시간대별 수강률 관리 필요"], categoryLabel: "피트니스" } },
  "crossfit-box": { ko: { title: "크로스핏/그룹 트레이닝", summary: "커뮤니티가 강한 그룹 운동 모델로 코칭 품질이 핵심입니다.", reasons: ["그룹 수업 에너지와 커뮤니티 형성", "멤버십 충성도가 생기기 쉬움"], warnings: ["소음, 안전, 코치 품질 영향이 큼"], categoryLabel: "피트니스" } },
  "golf-studio": { ko: { title: "스크린골프/골프 스튜디오", summary: "초기 비용은 높지만 프리미엄 포지셔닝이 쉬운 운동/레저형 업종입니다.", reasons: ["반복 레저 수요가 분명함", "프리미엄 가격 전략 가능"], warnings: ["장비와 임대료 부담이 큼"], categoryLabel: "피트니스" } },
  "unmanned-fitness": { ko: { title: "무인/24시 피트니스", summary: "운영은 가벼울 수 있지만 출입, 안전, 장비 관리가 더 중요해지는 피트니스 모델입니다.", reasons: ["프런트 인력 의존도를 줄일 수 있음", "회원 편의성을 만들기 좋음"], warnings: ["장비 유지보수와 안전 시스템이 중요"], categoryLabel: "피트니스" } },
  "study-room": { ko: { title: "스터디룸/스터디카페", summary: "교육 수요가 강한 지역에서 좌석 가동률 관리가 중요합니다.", reasons: ["타깃 고객이 분명함", "정기권 모델과 잘 맞음"], warnings: ["위치와 공간 품질이 핵심"], categoryLabel: "교육" } },
  "kids-academy": { ko: { title: "아동 학원", summary: "반복 매출 가능성은 높지만 신뢰와 규정 준비가 더 중요합니다.", reasons: ["가족 단위 반복 수요가 분명함", "성과가 보이면 유지율 상승"], warnings: ["강사 품질과 규정 준수 부담이 큼"], categoryLabel: "교육" } },
  "adult-class": { ko: { title: "성인 취미 클래스", summary: "브랜드화가 가능하고 소규모 예약형으로 시작하기 좋습니다.", reasons: ["가볍게 시작 가능", "예약형 소규모 운영과 잘 맞음"], warnings: ["수요가 계절 영향을 받을 수 있음"], categoryLabel: "교육" } },
  "language-academy": { ko: { title: "어학 학원", summary: "성과와 반복 등록 구조가 비교적 분명한 교육형 비즈니스입니다.", reasons: ["재등록 가능성이 높음", "성과 메시지를 설명하기 쉬움"], warnings: ["강사 품질과 유지율이 중요"], categoryLabel: "교육" } },
  "coding-class": { ko: { title: "코딩/디지털 스킬 클래스", summary: "청소년과 성인 모두를 대상으로 확장 가능한 기술 교육 포맷입니다.", reasons: ["현대 수요와 연관성이 큼", "오프라인과 온라인 혼합이 가능"], warnings: ["커리큘럼을 최신으로 유지해야 함"], categoryLabel: "교육" } },
  "small-study-room": { ko: { title: "공부방/소규모 튜터링", summary: "작은 공간으로도 시작 가능한 근거리 교육 서비스 카드입니다.", reasons: ["공간 부담이 비교적 작음", "지역 부모 수요와 연결 가능"], warnings: ["신뢰와 수업 품질이 초기 핵심"], categoryLabel: "교육" } },
  "pet-grooming": { ko: { title: "펫미용", summary: "반복 수요와 동네 재방문 가능성이 높은 서비스형 업종입니다.", reasons: ["정기 방문 패턴이 생기기 쉬움", "용품 판매와 결합 가능"], warnings: ["실력과 안전에 대한 신뢰가 핵심"], categoryLabel: "반려동물" } },
  "pet-supplies": { ko: { title: "펫용품점", summary: "서비스와 결합될수록 강해지는 소매형 모델입니다.", reasons: ["미용/호텔과 결합 가능", "소모품 반복 구매가 도움"], warnings: ["서비스 레이어 없으면 차별화가 어려움"], categoryLabel: "반려동물" } },
  "pet-hotel": { ko: { title: "펫호텔/데이케어", summary: "주말과 휴가철 수요가 강한 프리미엄 돌봄형 반려동물 서비스입니다.", reasons: ["반복 돌봄 관계 형성 가능", "프리미엄 서비스 포지셔닝 가능"], warnings: ["안전, 인력, 청결 관리가 핵심"], categoryLabel: "반려동물" } },
  "pet-cafe": { ko: { title: "펫카페", summary: "경험형 매력이 강하지만 위생과 규정이 더 중요한 복합 업종입니다.", reasons: ["경험형 콘셉트 매력", "목적형 방문 유도 가능"], warnings: ["규정과 위생 난도가 높음"], categoryLabel: "반려동물" } },
  "pet-training-school": { ko: { title: "펫 트레이닝/유치원", summary: "행동 교정과 돌봄 수요를 함께 담는 신뢰 중심 반려동물 서비스 카드입니다.", reasons: ["반복 돌봄 관계 형성 가능", "프리미엄 포지셔닝 가능"], warnings: ["인력 품질과 안전 기준이 중요"], categoryLabel: "반려동물" } },
  "pet-walking-visit": { ko: { title: "산책/방문 돌봄", summary: "점포 부담 없이 시작할 수 있지만 일정과 신뢰가 핵심인 방문형 서비스입니다.", reasons: ["대형 점포 없이 시작 가능", "고정비를 낮게 가져갈 수 있음"], warnings: ["스케줄 관리와 신뢰가 가장 중요"], categoryLabel: "반려동물" } },
  "laundry-service": { ko: { title: "세탁 서비스", summary: "생활 편의 수요가 안정적인 동네형 업종입니다.", reasons: ["지역 수요가 분명함", "서비스 설명이 쉬움"], warnings: ["기기 고장이 신뢰에 직접 영향"], categoryLabel: "생활 서비스" } },
  "cleaning-service": { ko: { title: "청소 서비스", summary: "수요는 충분하지만 인력 품질과 일정 관리가 핵심입니다.", reasons: ["점포 부담 없이 시작 가능", "가정용/B2B 수요 모두 가능"], warnings: ["채용 품질과 스케줄 운영이 핵심 리스크"], categoryLabel: "생활 서비스" } },
  "repair-service": { ko: { title: "수리/생활 해결 서비스", summary: "틈새형이지만 편의성과 신뢰를 만들면 강점이 있습니다.", reasons: ["문제 해결 가치가 분명함", "동네 충성도 형성 가능"], warnings: ["카테고리별 수요 예측이 어려울 수 있음"], categoryLabel: "생활 서비스" } },
  "self-laundry": { ko: { title: "셀프 빨래방", summary: "기기 중심의 저접촉 운영이 가능하지만 위치와 유지보수가 핵심입니다.", reasons: ["운영 구조가 단순함", "낮은 인력 의존도"], warnings: ["위치와 기기 관리가 전부일 수 있음"], categoryLabel: "생활 서비스" } },
  "print-copy": { ko: { title: "인쇄/복사 서비스", summary: "학교, 오피스, 관공서 인접 수요가 있는 실용형 생활 서비스입니다.", reasons: ["실무형 반복 수요 가능", "택배·문서 서비스 결합 가능"], warnings: ["순수 복사 수요가 줄어드는 지역도 있음"], categoryLabel: "생활 서비스" } },
  "device-repair": { ko: { title: "휴대폰/소형기기 수리", summary: "속도와 신뢰가 중요한 실용형 수리 서비스 카드입니다.", reasons: ["문제 해결 수요가 명확함", "액세서리 판매와 결합 가능"], warnings: ["기술력과 신뢰가 핵심"], categoryLabel: "생활 서비스" } },
  guesthouse: { ko: { title: "게스트하우스", summary: "관광 수요가 맞는 지역에선 강하지만 운영과 규정 부담이 큽니다.", reasons: ["입지 영향이 큼", "숙박 브랜드 차별화 가능"], warnings: ["운영·규정 복잡도가 높음"], categoryLabel: "공간/숙박" } },
  "rental-studio": { ko: { title: "대여 스튜디오", summary: "예약 기반 운영으로 크리에이터 수요와 잘 맞습니다.", reasons: ["활용처가 다양함", "시간 단위 수익화 가능"], warnings: ["가동률이 핵심"], categoryLabel: "공간/숙박" } },
  "party-room": { ko: { title: "파티룸", summary: "수요가 맞으면 단순하지만 소음·규정 리스크가 중요합니다.", reasons: ["제안이 단순하고 이해하기 쉬움", "예약 모델이 명확함"], warnings: ["민원과 지역 규정이 핵심 리스크"], categoryLabel: "공간/숙박" } },
  "study-cafe-space": { ko: { title: "스터디카페", summary: "좌석 가동률과 조용한 환경이 성패를 좌우하는 공간형 모델입니다.", reasons: ["타깃 수요가 분명함", "정기권 구조와 잘 맞음"], warnings: ["청결, 소음, 가동률 관리가 핵심"], categoryLabel: "공간/숙박" } },
  "shared-office": { ko: { title: "공유오피스/소형 워크스페이스", summary: "프리랜서와 소규모 팀 수요를 겨냥한 멤버십형 공간 비즈니스입니다.", reasons: ["반복 매출 구조 가능", "회의실 등 추가 수익화 가능"], warnings: ["지역 수요 적합성이 중요"], categoryLabel: "공간/숙박" } },
  "practice-room": { ko: { title: "연습실/레슨룸", summary: "음악, 댄스, 코칭 수요를 담을 수 있는 시간 단위 공간 대여 카드입니다.", reasons: ["시간 단위 수익화가 명확함", "창작자·강습 수요와 연결 가능"], warnings: ["가동률과 소음 관리가 중요"], categoryLabel: "공간/숙박" } },
  "smart-store": { ko: { title: "스마트스토어 판매", summary: "점포 임대 없이 제품형 비즈니스를 시험하기 좋은 시작점입니다.", reasons: ["오프라인 고정비가 낮음", "제품 적합도를 빠르게 검증 가능"], warnings: ["유입 확보와 마진 관리가 중요"], categoryLabel: "온라인/디지털" } },
  "digital-products": { ko: { title: "디지털 상품", summary: "재고 부담은 적지만 명확한 니치 포지셔닝이 중요합니다.", reasons: ["실물 재고 불필요", "소규모 팀으로 확장 가능"], warnings: ["신뢰와 니치 명확성이 핵심"], categoryLabel: "온라인/디지털" } },
  "creator-service": { ko: { title: "크리에이터 기반 서비스", summary: "콘텐츠와 컨설팅을 결합한 유연한 개인 브랜드형 모델입니다.", reasons: ["빠르게 출시 가능", "개인 브랜드와 궁합이 좋음"], warnings: ["반복 매출 구조가 없으면 매출 변동성이 큼"], categoryLabel: "온라인/디지털" } },
  "consignment-commerce": { ko: { title: "위탁/마켓플레이스 판매", summary: "재고 부담을 낮추고 수요를 먼저 검증하기 좋은 이커머스 진입형 모델입니다.", reasons: ["초기 재고 부담이 낮음", "여러 상품군 테스트가 빠름"], warnings: ["보유 재고보다 마진 통제가 약할 수 있음"], categoryLabel: "온라인/디지털" } },
  "newsletter-membership": { ko: { title: "뉴스레터/멤버십 콘텐츠", summary: "강한 니치 신뢰가 있을 때 반복 구독을 만들 수 있는 디지털 비즈니스입니다.", reasons: ["고정비가 낮음", "구독형 반복 매출 가능"], warnings: ["니치 신뢰와 꾸준함이 핵심"], categoryLabel: "온라인/디지털" } },
  "global-buying": { ko: { title: "해외구매대행/크로스보더 셀링", summary: "점포 임대 없이 상품을 팔 수 있지만 소싱과 배송 관리가 중요한 판매형 카드입니다.", reasons: ["점포 없이 테스트 가능", "니치 수요를 빨리 볼 수 있음"], warnings: ["배송, 소싱, 환불 관리가 중요"], categoryLabel: "온라인/디지털" } },
  "ai-application": { ko: { title: "AI 애플리케이션 / 에이전트", summary: "수요가 빠르게 커지고 있지만 유지율과 안정성이 즉시 중요합니다.", reasons: ["2025-2026 가장 강한 수요 신호", "좁은 유스케이스부터 검증 가능"], warnings: ["모델 비용, 평가 품질, 차별화를 빠르게 관리해야 함"], categoryLabel: "기술 스타트업" } },
  "developer-tools": { ko: { title: "개발자 도구 / 인프라", summary: "기술 창업자가 워크플로 병목을 해결할 때 강한 적합성을 가집니다.", reasons: ["개발 도구 시장 YC 활동 활발", "기술 바이어는 ROI에 민감"], warnings: ["좁고 명확한 타겟이 필요"], categoryLabel: "기술 스타트업" } },
  "b2b-saas": { ko: { title: "B2B SaaS / 워크플로 소프트웨어", summary: "고통스러운 업무 프로세스를 이해하고 한 팀부터 랜딩할 때 유효합니다.", reasons: ["반복 매출 모델이 복리 성장에 유리", "확장 매출 가능"], warnings: ["긴 세일즈 사이클이 초기 PMF를 가릴 수 있음"], categoryLabel: "기술 스타트업" } },
  "fintech-startup": { ko: { title: "핀테크 / 결제 / 자금관리", summary: "큰 시장이지만 컴플라이언스와 신뢰 요건이 무겁습니다.", reasons: ["결제, 재무 운영 여전히 큰 소프트웨어 카테고리", "시간 절약/비용 절감 ROI 명확"], warnings: ["규제, 리스크 관리, 통합 복잡성이 빠르게 증가"], categoryLabel: "기술 스타트업" } },
  "healthtech-startup": { ko: { title: "헬스테크 / 케어 운영", summary: "높은 가치 카테고리지만 워크플로와 규제가 까다롭습니다.", reasons: ["의료 운영이 여전히 파편화", "B2B 워크플로 소프트웨어로 강한 고착"], warnings: ["세일즈와 도입 사이클이 일반 SaaS보다 느림"], categoryLabel: "기술 스타트업" } },
  "security-startup": { ko: { title: "사이버보안 / 트러스트", summary: "강한 기술팀과 명확한 위협 프레이밍에 적합한 고우선순위 카테고리입니다.", reasons: ["보안 예산은 지속적인 우선순위", "신뢰와 긴급성이 프리미엄 가격 지원"], warnings: ["기술적 깊이와 좁은 공격 표면 집중 필요"], categoryLabel: "기술 스타트업" } },
  "storefront-cafe": { ko: { title: "매장형 카페", summary: "브랜드 노출, 좌석 운영, 지역 충성도까지 균형 있게 가져가는 모델입니다.", reasons: ["동네 반복 고객에 유리", "브랜드와 메뉴 스토리텔링 가능"], warnings: ["더 높은 임대료와 인건비 압박"], categoryLabel: "운영 방식" } },
  "takeout-focused": { ko: { title: "테이크아웃 중심", summary: "작은 공간과 빠른 세팅, 단순한 인력 구조에 유리합니다.", reasons: ["점포 면적 부담이 작음", "예산 통제가 중요할 때 적합"], warnings: ["회전율과 메뉴 포지셔닝이 더 중요"], categoryLabel: "운영 방식" } },
  "delivery-hybrid": { ko: { title: "배달 하이브리드", summary: "배달 비중이 필요한 경우 유용하지만 운영은 더 복잡해집니다.", reasons: ["유입 채널을 넓힐 수 있음", "워크인 외 수요를 확보 가능"], warnings: ["포장, 배차, 수수료 관리가 복잡"], categoryLabel: "운영 방식" } },
  "dine-in-restaurant": { ko: { title: "매장 식사형", summary: "한식, 파스타, 브런치처럼 매장 내 식사 경험이 중요한 외식형 모델입니다.", reasons: ["좌석 운영과 체류 경험에 유리", "식사형 메뉴 구성과 잘 맞음"], warnings: ["홀 운영과 인건비 부담이 큼"], categoryLabel: "운영 방식" } },
  "self-serve-light": { ko: { title: "무인/셀프 운영형", summary: "인건비를 낮추되 기기 품질과 입지 적합도가 더 중요해지는 모델입니다.", reasons: ["인력 구조를 가볍게 가져갈 수 있음", "기능형 상권과 잘 맞을 수 있음"], warnings: ["차별화와 유지보수가 중요"], categoryLabel: "운영 방식" } },
  "small-storefront-retail": { ko: { title: "오프라인 소형 매장형", summary: "큐레이션과 동네 재방문 수요를 살리는 기본 소매 모델입니다.", reasons: ["라이프스타일/전문 소매에 적합", "오프라인 경험을 만들기 좋음"], warnings: ["재고 통제가 핵심"], categoryLabel: "운영 방식" } },
  "unmanned-retail-model": { ko: { title: "무인 소매형", summary: "저접촉 운영이 가능하지만 상품 회전과 위치 적합도가 더 중요한 소매 모델입니다.", reasons: ["인력 부담을 낮출 수 있음", "작은 상권에도 맞출 수 있음"], warnings: ["도난과 재고 회전 리스크"], categoryLabel: "운영 방식" } },
  "omni-retail": { ko: { title: "오프라인+온라인 병행형", summary: "매장 판매와 온라인 유입을 함께 가져가는 혼합 소매 모델입니다.", reasons: ["채널을 넓힐 수 있음", "픽업/인스타 유입과 연결 가능"], warnings: ["운영이 분산되기 쉬움"], categoryLabel: "운영 방식" } },
  "appointment-studio": { ko: { title: "예약 중심 스튜디오형", summary: "미용실, 네일, 왁싱처럼 예약 반복이 핵심인 뷰티 서비스 모델입니다.", reasons: ["반복 예약 구조가 강함", "작은 공간으로도 가능"], warnings: ["스케줄 품질이 서비스 품질이 됨"], categoryLabel: "운영 방식" } },
  "premium-private-room": { ko: { title: "프라이빗 프리미엄형", summary: "피부관리, 브라이덜처럼 신뢰와 프라이버시가 중요한 고가 서비스 모델입니다.", reasons: ["프리미엄 가격 전략 가능", "상담형 서비스에 적합"], warnings: ["초기 신뢰 형성이 더 중요"], categoryLabel: "운영 방식" } },
  "beauty-retail-hybrid": { ko: { title: "시술+제품 하이브리드형", summary: "서비스와 홈케어 제품 판매를 함께 가져가는 뷰티 모델입니다.", reasons: ["객단가 확장 가능", "반복 제품 구매로 연결 가능"], warnings: ["재고 관리가 필요"], categoryLabel: "운영 방식" } },
  "membership-studio": { ko: { title: "멤버십 스튜디오형", summary: "필라테스, 요가처럼 반복 수강과 멤버십에 강한 피트니스 모델입니다.", reasons: ["반복 매출 구조가 분명함", "고객 유지 흐름이 좋음"], warnings: ["강사 품질 관리가 중요"], categoryLabel: "운영 방식" } },
  "coach-led-premium": { ko: { title: "코치 중심 프리미엄형", summary: "PT, 골프처럼 개인 코칭의 가치가 큰 고단가 피트니스 모델입니다.", reasons: ["고객당 가치가 높음", "프리미엄 가격 가능"], warnings: ["인력 품질과 임대료 부담이 큼"], categoryLabel: "운영 방식" } },
  "low-touch-fitness": { ko: { title: "저접촉/무인 피트니스형", summary: "인력은 줄일 수 있지만 출입과 장비 관리가 더 중요해지는 모델입니다.", reasons: ["프런트 인력 의존도를 낮춤", "단순한 회원제 제안 가능"], warnings: ["안전과 유지보수가 핵심"], categoryLabel: "운영 방식" } },
  "academy-classroom": { ko: { title: "클래스룸/학원형", summary: "어학, 학습, 기술 교육처럼 반복 수업 구조가 분명한 교육 모델입니다.", reasons: ["등록과 재등록 흐름이 있음", "성과를 설명하기 쉬움"], warnings: ["강사 품질이 핵심"], categoryLabel: "운영 방식" } },
  "small-group-tutoring": { ko: { title: "소규모 튜터링형", summary: "공부방, 소그룹 수업처럼 작은 공간에서 시작하기 좋은 교육 모델입니다.", reasons: ["공간 부담이 낮음", "근거리 수요와 잘 맞음"], warnings: ["성과와 신뢰에 크게 좌우됨"], categoryLabel: "운영 방식" } },
  "hybrid-learning": { ko: { title: "오프라인+온라인 교육형", summary: "코딩이나 성인 교육처럼 온라인을 함께 쓰기 좋은 혼합형 모델입니다.", reasons: ["전달 방식이 유연함", "대상 확장이 쉬움"], warnings: ["커리큘럼 일관성이 중요"], categoryLabel: "운영 방식" } },
  "pet-service-studio": { ko: { title: "예약형 펫 서비스 스튜디오", summary: "펫미용처럼 반복 예약과 소형 공간 운영이 핵심인 모델입니다.", reasons: ["반복 방문 패턴이 강함", "작은 공간으로도 가능"], warnings: ["기술과 안전 신뢰가 핵심"], categoryLabel: "운영 방식" } },
  "pet-care-center": { ko: { title: "펫 돌봄 센터형", summary: "호텔, 데이케어, 유치원처럼 돌봄과 관리가 핵심인 반려동물 모델입니다.", reasons: ["프리미엄 돌봄 포지셔닝 가능", "관계 기반 반복 수요 가능"], warnings: ["인력·청결·안전 부담이 큼"], categoryLabel: "운영 방식" } },
  "pet-retail-hybrid": { ko: { title: "서비스+용품 하이브리드형", summary: "펫 서비스와 용품 판매를 함께 가져가는 혼합 모델입니다.", reasons: ["매출 다변화 가능", "반복 소모품 구매 연결 가능"], warnings: ["서비스 차별화가 약하면 어려움"], categoryLabel: "운영 방식" } },
  "utility-storefront": { ko: { title: "생활 밀착 점포형", summary: "세탁, 수리, 인쇄처럼 오프라인 실용 수요에 맞는 기본형 모델입니다.", reasons: ["지역 수요가 비교적 분명함", "가치 설명이 쉬움"], warnings: ["편의성과 신뢰가 핵심"], categoryLabel: "운영 방식" } },
  "self-service-model": { ko: { title: "셀프서비스형", summary: "셀프 빨래방처럼 저접촉 운영이 가능한 생활 서비스 모델입니다.", reasons: ["인력 의존도가 낮음", "서비스 흐름이 단순함"], warnings: ["기기 상태와 위치가 성패를 좌우"], categoryLabel: "운영 방식" } },
  "visit-service-model": { ko: { title: "방문/출동 서비스형", summary: "청소, 수리처럼 점포보다 스케줄과 대응력이 중요한 방문형 모델입니다.", reasons: ["점포 부담이 낮음", "유연하게 시작 가능"], warnings: ["일정 관리가 곧 서비스 품질"], categoryLabel: "운영 방식" } },
  "reservation-space": { ko: { title: "예약형 공간 대여", summary: "스튜디오, 파티룸, 연습실처럼 시간 단위 예약이 중심인 공간 모델입니다.", reasons: ["시간 단위 수익화가 명확함", "목적형 수요를 받기 좋음"], warnings: ["가동률이 가장 중요"], categoryLabel: "운영 방식" } },
  "membership-space": { ko: { title: "멤버십 공간형", summary: "스터디카페, 공유오피스처럼 반복 이용이 중심인 공간 모델입니다.", reasons: ["반복 매출 구조 가능", "이용 패턴 예측이 쉬움"], warnings: ["위치 적합성과 이탈률 관리 중요"], categoryLabel: "운영 방식" } },
  "hospitality-operations": { ko: { title: "숙박/호스피탈리티 운영형", summary: "게스트하우스처럼 운영 난도가 더 높은 숙박형 모델입니다.", reasons: ["숙박 경험으로 차별화 가능", "입지 효과가 큼"], warnings: ["운영·규정 부담이 큼"], categoryLabel: "운영 방식" } },
  "marketplace-seller": { ko: { title: "마켓플레이스 판매형", summary: "스마트스토어, 위탁판매처럼 입점형 판매가 중심인 온라인 모델입니다.", reasons: ["가장 빠르게 시작 가능", "수요를 먼저 검증하기 좋음"], warnings: ["수수료와 유입 경쟁 압박"], categoryLabel: "운영 방식" } },
  "brand-storefront-online": { ko: { title: "브랜드 자사몰형", summary: "브랜드 경험과 반복 구매를 직접 관리하고 싶은 온라인 판매 모델입니다.", reasons: ["브랜드 통제력이 높음", "고객 데이터를 더 잘 쌓을 수 있음"], warnings: ["마케팅 역량이 더 필요"], categoryLabel: "운영 방식" } },
  "content-membership-model": { ko: { title: "콘텐츠/멤버십형", summary: "디지털 상품, 뉴스레터, 크리에이터 서비스처럼 구독과 콘텐츠가 중심인 모델입니다.", reasons: ["고정비가 낮음", "구독형 반복 매출 가능"], warnings: ["신뢰와 꾸준함이 가장 중요"], categoryLabel: "운영 방식" } },
  seongsu: { ko: { title: "성수", summary: "브랜드형 카페/디저트 콘셉트에 유리하고 목적형 유입이 강합니다.", reasons: ["20~30대 유동 인구가 강함", "브랜딩형 카페와 궁합이 좋음", "목적형 리테일 유입의 파급이 큼"], warnings: ["임대료 부담이 높음", "경쟁 밀도가 이미 높음"] } },
  mangwon: { ko: { title: "망원", summary: "지역 재방문 수요와 상대적으로 완만한 임대료가 강점인 상권입니다.", reasons: ["동네 반복 수요가 더 안정적임", "소형 점포 운영과 잘 맞음", "초기 예산을 조심스럽게 쓰는 창업자에게 유리"], warnings: ["성수보다 목적형 유입은 약함", "브랜드 확산 속도는 더 느릴 수 있음"] } },
  konkuk: { ko: { title: "건대입구", summary: "회전율이 중요한 테이크아웃형 카페에 잘 맞습니다.", reasons: ["학생과 저녁 유동 인구가 강함", "회전율 중심 콘셉트와 잘 맞음", "빠른 판매량 확보에 유리"], warnings: ["가격 민감도가 높을 수 있음", "주말 수요 변동이 큼"] } },
  "market-cafe-dessert-seongsu": { ko: { title: "성수", summary: "브랜드형 카페/디저트 콘셉트에 유리하고 목적형 유입이 강합니다.", reasons: ["20~30대 유동 인구가 강함", "브랜딩형 카페와 궁합이 좋음", "목적형 리테일 유입의 파급이 큼"], warnings: ["임대료 부담이 높음", "경쟁 밀도가 이미 높음"] } },
  "market-cafe-dessert-mangwon": { ko: { title: "망원", summary: "지역 재방문 수요와 상대적으로 완만한 임대료가 강점인 상권입니다.", reasons: ["동네 반복 수요가 더 안정적임", "소형 점포 운영과 잘 맞음", "초기 예산을 조심스럽게 쓰는 창업자에게 유리"], warnings: ["성수보다 목적형 유입은 약함", "브랜드 확산 속도는 더 느릴 수 있음"] } },
  "market-cafe-dessert-konkuk": { ko: { title: "건대입구", summary: "회전율이 중요한 테이크아웃형 카페에 잘 맞습니다.", reasons: ["학생과 저녁 유동 인구가 강함", "테이크아웃 비중이 높은 모델과 궁합이 좋음", "빠른 회전이 필요한 콘셉트에 유리"], warnings: ["가격 민감도가 높을 수 있음", "주말 수요 변동이 큼"] } },
  "market-food-yeoksam": { ko: { title: "역삼", summary: "패스트캐주얼·건강식 등 오피스 점심 수요가 강한 외식형 상권입니다.", reasons: ["점심 오피스 수요가 밀집", "건강식/패스트캐주얼과 잘 맞음", "주중 반복 수요 예측이 쉬움"], warnings: ["주중 비중이 지나치게 높을 수 있음", "블록별 저녁/주말 편차가 큼"] } },
  "market-food-seongsu": { ko: { title: "성수", summary: "목적형 방문과 브랜드 노출이 필요한 외식 콘셉트에 유리합니다.", reasons: ["콘셉트형 외식 브랜드에 유리", "주거지보다 브랜드 노출이 쉬움", "리테일 유입의 파급을 받을 수 있음"], warnings: ["임대료가 비쌈", "포지셔닝이 더 선명해야 함"] } },
  "market-food-mangwon": { ko: { title: "망원", summary: "트렌드보다는 지역 반복 수요를 노리는 외식 콘셉트에 잘 맞습니다.", reasons: ["동네 반복 수요가 안정적임", "소형 매장 운영에 적합", "예산을 아끼는 첫 오픈에 유리"], warnings: ["관광객 효과는 덜 예측 가능", "지역 맞춤 메뉴 포지셔닝 필요"] } },
  "plg-saas": { ko: { title: "제품 주도형 SaaS", summary: "셀프서브 또는 가볍게 터치하는 제품에서 활성화 속도가 중요할 때 적합합니다.", reasons: ["빠른 피드백 루프", "온보딩과 리텐션을 초기에 테스트하기 좋음"], warnings: ["낮은 활성화율이 성장을 조용히 죽일 수 있음"] } },
  "sales-led-b2b": { ko: { title: "영업 주도형 B2B", summary: "고통이 비싸고 구매자가 적으며 파일럿이 확장으로 이어질 때 유리합니다.", reasons: ["엔터프라이즈 워크플로 문제에 적합", "높은 ACV와 장기 계약 가능"], warnings: ["창업자 세일즈와 긴 사이클에 런웨이 관리 필요"] } },
  "usage-based-api": { ko: { title: "사용량 기반 API / 인프라", summary: "사용량이나 자동화 볼륨에 따라 가치가 확장되는 개발자 대상 도구에 적합합니다.", reasons: ["인프라와 AI 빌딩블록에 강한 적합성", "통합 후 사용량 성장이 복리로 증가"], warnings: ["안정성, 문서 품질, 마진이 핵심"] } },
  "hybrid-software-service": { ko: { title: "소프트웨어 + 서비스 하이브리드", summary: "제품이 따라잡기 전에 수동 서비스로 수요를 증명해야 할 때 유용합니다.", reasons: ["고객 고통을 더 빠르게 학습", "완전 자동화 전 초기 매출 가능"], warnings: ["적극적으로 제품화하지 않으면 서비스가 약한 레버리지를 숨길 수 있음"] } }
};

export function localizeRecommendationItem(item: RecommendationItem, language: Language): RecommendationItem {
  if (language === "en") return item;
  const copy = recCopy[item.id]?.ko;
  if (!copy) return item;
  return {
    ...item,
    title: copy.title ?? item.title,
    summary: copy.summary ?? item.summary,
    reasons: copy.reasons ?? item.reasons,
    warnings: copy.warnings ?? item.warnings,
    meta:
      copy.categoryLabel && item.meta
        ? { ...item.meta, categoryLabel: copy.categoryLabel }
        : item.meta
  };
}

const stageCopy: Record<string, { ko: { title: string; goal: string; whyNow: string } }> = {
  industry_selection: { ko: { title: "업종 선택", goal: "이후 로드맵 분기를 위해 업종과 창업 형태를 먼저 정합니다.", whyNow: "모든 로드맵은 이 결정에서 시작됩니다." } },
  startup_type: { ko: { title: "창업 형태 선택", goal: "독립 창업인지 프랜차이즈인지 정해 이후 가이드 분기를 분명하게 만듭니다.", whyNow: "브랜드, 계약, 준비 순서가 창업 형태에 따라 달라집니다." } },
  business_model: { ko: { title: "운영 방식 선택", goal: "점포형, 테이크아웃형, 배달형 중 어떤 운영 모델인지 정합니다.", whyNow: "예산과 상권 추천은 운영 모델에 따라 달라집니다." } },
  budget_setup: { ko: { title: "예산 설정", goal: "현실적인 자본금과 오픈 시점을 먼저 고정합니다.", whyNow: "예산 범위가 정해져야 상권과 계약 검토가 정확해집니다." } },
  location_candidates: { ko: { title: "상권 후보 비교", goal: "출처가 확인된 상권 후보 중 하나를 선택합니다.", whyNow: "상권이 정해져야 계약 검토와 인허가 준비가 이어집니다." } },
  contract_review: { ko: { title: "계약 전 검토", goal: "임대차 계약 전에 놓치면 안 되는 항목을 모두 확인합니다.", whyNow: "이 단계는 실제 손해를 막는 핵심 보호 장치입니다." } },
  permit_guide: { ko: { title: "인허가 가이드", goal: "내 업종에 맞는 등록 및 인허가 순서를 확인합니다.", whyNow: "등록 순서를 놓치면 오픈 일정이 흔들릴 수 있습니다." } },
  tax_guide: { ko: { title: "세무 가이드", goal: "오픈 전 기본 세무 세팅과 증빙 구조를 점검합니다.", whyNow: "초기 세무 구조가 흔들리면 이후 신고가 어려워집니다." } },
  loan_guide: { ko: { title: "대출 가이드", goal: "자금 조달과 정책자금 검토 포인트를 정리합니다.", whyNow: "무리한 차입을 피하고 현실적인 자금 구조를 잡아야 합니다." } },
  franchise_application: { ko: { title: "프랜차이즈 가맹 절차", goal: "선택한 브랜드의 가맹 상담, 정보공개서 검토, 계약 체결, 교육 이수를 완료하세요.", whyNow: "가맹 계약이 체결되어야 입지 선정, 인테리어, 공급업체 등 다음 단계가 의미 있습니다." } },
  biz_registration: { ko: { title: "사업자등록 & 금융 세팅", goal: "세무서 사업자등록을 확인하고 사업용 통장과 세무대리인 여부를 결정합니다.", whyNow: "개업 전에 금융 구조가 잡혀야 첫 달 세금 신고와 비용 관리가 흔들리지 않습니다." } },
  pre_launch_final: { ko: { title: "개업 최종 준비", goal: "초도 재고를 입고하고 직원 최종 교육과 SNS 오픈 예고를 마칩니다.", whyNow: "오픈 당일 준비 부족은 첫 고객 경험을 망가뜨립니다. 마지막 점검이 중요합니다." } },
  first_month_check: { ko: { title: "개업 준비 완료", goal: "일별 현금흐름 기록 방법과 비상금을 확인하고 가게를 열 마지막 준비를 마칩니다.", whyNow: "개업 첫 달이 가장 위험합니다. 일별 숫자를 추적하는 습관이 생존을 좌우합니다." } },
  // ── Startup path ──────────────────────────────────────────────────────────
  startup_foundation: { ko: { title: "창업팀·법인 기본 구조", goal: "공동창업자 역할, 지분·베스팅, 법인 설립 방향, 핵심 문제 정의를 먼저 정리합니다.", whyNow: "공동창업자 정렬과 지분 구조가 흐리면 제품보다 먼저 팀이 흔들립니다." } },
  customer_discovery: { ko: { title: "고객 발굴·문제 검증", goal: "고객 인터뷰를 통해 반복적으로 나타나는 고통과 초기 타겟 세그먼트를 좁힙니다.", whyNow: "누구의 어떤 문제를 푸는지 선명하지 않으면 이후 제품 개발이 전부 낭비될 수 있습니다." } },
  growth_engine: { ko: { title: "성장·리텐션 루프", goal: "북극성 지표와 주간 성장 리뷰를 정하고, 유지율을 함께 추적하는 체계를 만듭니다.", whyNow: "유지되지 않는 성장은 반복 투자 대비 효과가 낮고 쉽게 무너집니다." } },
  company_setup: { ko: { title: "사업자등록 · 지식재산 보호 · 세무 기초", goal: "개인사업자/법인 중 선택, 사업자등록 완료, 특허·상표 출원(공개 전 필수), 과세 유형 결정, 개인정보보호 기본 구축을 완료합니다.", whyNow: "사업자등록은 계약·세금계산서·정부지원의 전제 조건이고, 특허는 공개 전에 출원해야 영구적 권리를 확보할 수 있습니다." } },
  mvp_build: { ko: { title: "MVP 구축 · IP 보호", goal: "핵심 워크플로 하나를 해결하는 MVP를 출시하고, 공개 전에 상표·특허 출원을 완료합니다.", whyNow: "늦은 출시는 런웨이를 태우고, IP 보호 없는 공개는 특허권을 영구히 잃을 수 있습니다." } },
  launch_gtm: { ko: { title: "출시 스택 · GTM 전략", goal: "결제·분석·에러 추적을 설치하고, 시장 진입 채널을 정해 첫 고객 확보 실험을 시작합니다.", whyNow: "계측 없이는 신호와 소음을 구분할 수 없고, GTM 전략 없이는 좋은 제품도 침묵 속에 출시됩니다." } },
  fundraising_readiness: { ko: { title: "런웨이·투자 준비", goal: "번레이트와 런웨이를 모델링하고, 자금 조달 방식을 결정한 뒤, 피치덱·지표·재무 전망을 준비합니다.", whyNow: "2026년 투자자는 성장보다 자본 효율성을 봅니다. 런웨이 계획 없이 유치에 나서면 3~6개월의 시간과 협상력을 잃습니다." } },
  venture_certification: { ko: { title: "벤처인증 · 정부 지원사업", goal: "벤처기업 인증 유형을 확인하고, K-Startup 지원사업(예비창업·초기창업·TIPS 등)에 매칭하여 비희석 자금을 확보합니다.", whyNow: "벤처인증은 세금 감면·병역특례·지원사업 자격의 열쇠입니다. 정부 지원사업은 마감이 있어 타이밍을 놓치면 전액 자비 부담입니다." } },
  // ── Offline path ──────────────────────────────────────────────────────────
  permit_check: { ko: { title: "인허가 사전 확인", goal: "계약 전에 내 업종에 필요한 인허가·위생 교육·안전 요건을 확인합니다.", whyNow: "업종별 인허가 요건과 비용을 먼저 파악해야 장소 선택과 예산 계획을 올바르게 세울 수 있습니다." } },
  construction_setup: { ko: { title: "인테리어 및 공사", goal: "인테리어 업체를 선정하고 설계를 확정한 뒤 공사를 완료합니다.", whyNow: "시공 업체 3곳 이상의 견적·일정·포트폴리오를 동시에 비교해야 비용 대비 품질을 극대화할 수 있습니다." } },
  vendor_setup: { ko: { title: "공급처 및 장비 확정", goal: "주요 원자재·상품·소모품 공급처와 장비 구매·렌탈 계획을 확정합니다.", whyNow: "공급처별 원가·납기·최소주문량(MOQ)을 비교해야 초도 주문 규모와 이후 재고 회전 속도를 맞출 수 있습니다." } },
  registration_setup: { ko: { title: "사업자 등록 및 인허가 신고", goal: "세무서 사업자등록과 관할 관청 영업 신고·허가를 완료합니다.", whyNow: "등록 없이 영업하면 법적 위반이며, 매출 증빙도 불가합니다." } },
  insurance_tax_setup: { ko: { title: "보험·세무 세팅", goal: "4대보험(국민연금·건강·고용·산재) 가입, 원천세 설정, 급여 지급 방식을 확정합니다.", whyNow: "보험과 세무 초기 세팅이 첫 해 세금 신고의 정확성과 향후 정부 지원사업 자격을 결정합니다." } },
  hiring_setup: { ko: { title: "직원 채용 및 근로계약", goal: "직원·알바 필요 여부를 판단하고, 근로계약서를 작성·교부합니다.", whyNow: "필요 인원·급여 체계·계약 항목을 먼저 정해야 오픈 직전 인건비 손실과 노무 분쟁을 예방할 수 있습니다." } },
  operations_setup: { ko: { title: "운영 및 마케팅 준비", goal: "POS 점검, SNS 채널 개설, 예약·결제 시스템 등 오픈 전 운영 준비를 마칩니다. 배달 업종은 배달앱 입점도 진행합니다.", whyNow: "POS·결제·배송 시스템을 실제 테스트해야 오픈 당일 운영 장애를 예방할 수 있습니다." } },
  pre_launch: { ko: { title: "소프트 오픈", goal: "지인·초대 고객 대상으로 시범 운영하고 피드백을 반영합니다.", whyNow: "실제 고객에게 정식 오픈하기 전 운영 문제를 먼저 발견해야 합니다." } },
  // ── Online / Digital path ─────────────────────────────────────────────────
  platform_setup: { ko: { title: "판매 플랫폼 선택", goal: "스마트스토어·쿠팡·자체몰 중 주요 판매 채널을 선택하고 판매자 계정을 만듭니다.", whyNow: "플랫폼 선택이 수수료, 고객 도달, 풀필먼트 방식을 결정합니다." } },
  online_registration: { ko: { title: "사업자·통신판매 등록", goal: "세무서 사업자등록과 통신판매업 신고를 완료합니다.", whyNow: "통신판매업 신고 없이 온라인 판매를 하면 법적 위반입니다." } },
  sourcing_setup: { ko: { title: "상품 소싱 및 상세 페이지", goal: "공급사와 계약하고 상품 촬영 및 상세 페이지를 준비합니다.", whyNow: "상품이 준비되지 않으면 스토어를 열어도 판매가 불가능합니다." } },
  store_setup: { ko: { title: "스토어 및 배송 세팅", goal: "스토어 카테고리·배너·반품 정책을 구성하고 택배사를 연동합니다.", whyNow: "배송 연동과 결제 세팅이 안 되면 주문을 처리할 수 없습니다." } },
  online_marketing: { ko: { title: "마케팅 및 론칭", goal: "네이버 쇼핑 SEO 최적화, 첫 광고 캠페인, 리뷰 전략을 세팅하고 론칭합니다.", whyNow: "초기 노출과 리뷰가 없으면 플랫폼 알고리즘에서 상품이 묻힙니다." } }
};

function getStageCopyForCategory(
  stage: RoadmapStageState,
  categoryId?: string
): { title: string; goal: string; whyNow: string } | undefined {
  // ── startup-tech overrides ──
  if (categoryId === "startup-tech") {
    const startupOverrides: Record<string, { title: string; goal: string; whyNow: string }> = {
      startup_type: {
        title: "창업 형태 선택",
        goal: "독립 창업으로 진행할지, 공동 창업팀을 구성할지 방향을 정합니다.",
        whyNow: "팀 구조에 따라 지분 설계, 법인 형태, 의사결정 방식이 완전히 달라집니다."
      },
      business_model: {
        title: "비즈니스 모델 선택",
        goal: "SaaS 구독, API 과금, 프리미엄, 마켓플레이스 중 수익 모델을 정합니다.",
        whyNow: "수익 모델이 제품 설계, 가격 정책, GTM 전략의 출발점입니다."
      },
      tax_guide: {
        title: "스타트업 세무 가이드",
        goal: "법인세, R&D 세액공제, 스톡옵션 과세 등 서비스 론칭 전 세무 구조를 점검합니다.",
        whyNow: "세무 구조를 잘못 세팅하면 수천만원의 공제 혜택을 놓칩니다."
      },
      loan_guide: {
        title: "비지분 자금 확보",
        goal: "지분 희석 없이 성장을 견인할 자금을 확보합니다. 무상 지원금, R&D 과제, 정책 대출을 매칭하고 신청합니다.",
        whyNow: "정부 지원사업은 마감이 있습니다. 초기 밸류에이션이 낮을 때 지분을 내어주는 대신 비지분 자금으로 마일스톤을 달성하세요."
      },
      biz_registration: {
        title: "법인 등기 & 금융 세팅",
        goal: "법인 등기 완료를 확인하고 법인 통장 개설과 세무사 선임 여부를 결정합니다.",
        whyNow: "투자 유치와 정부 지원사업 신청에 법인 등기가 필수입니다."
      },
      pre_launch_final: {
        title: "론칭 최종 준비",
        goal: "프로덕션 배포, 모니터링 확인, 론칭 당일 역할 분담과 채널별 공유 전략을 마칩니다.",
        whyNow: "론칭 당일의 준비 수준이 첫 사용자 경험과 초기 견인력을 결정합니다."
      },
      first_month_check: {
        title: "론칭 후 생존 점검",
        goal: "핵심 지표 추적 체계를 세팅하고 런웨이를 확인하며 첫 달 생존 루틴을 시작합니다.",
        whyNow: "론칭 첫 달이 가장 위험합니다. 매일 지표를 보고 매주 실험해야 살아남습니다."
      },
    };
    return startupOverrides[stage.code];
  }

  // ── online-digital overrides ──
  if (categoryId === "online-digital") {
    const onlineOverrides: Record<string, { title: string; goal: string; whyNow: string }> = {
      location_candidates: {
        title: "운영 거점 비교",
        goal: "작업, 보관, 포장, 택배 운영에 맞는 거점 후보를 비교합니다.",
        whyNow: "온라인 판매는 오프라인 상권보다 운영 효율과 물류 동선이 더 중요합니다."
      },
      contract_review: {
        title: "운영 준비 검토",
        goal: "보관, 포장, 택배, 공급 접근성처럼 운영에 직접 영향을 주는 항목을 확인합니다.",
        whyNow: "온라인 판매는 임대차보다 작업 환경과 fulfilment 흐름을 먼저 검토해야 합니다."
      },
      pre_launch_final: {
        title: "오픈 최종 준비",
        goal: "초도 상품 소싱을 완료하고 주문·배송·CS 플로우를 점검한 뒤 오픈 알림을 게시합니다.",
        whyNow: "첫 주문 처리 실패는 리뷰 악화와 플랫폼 패널티로 이어집니다."
      },
      first_month_check: {
        title: "오픈 후 생존 점검",
        goal: "주문·매출·반품 기록 체계를 세팅하고 비상금을 확인하며 첫 달 운영 루틴을 시작합니다.",
        whyNow: "초기 리뷰와 반품률이 플랫폼 노출을 결정합니다. 첫 달이 가장 중요합니다."
      },
    };
    return onlineOverrides[stage.code];
  }

  return undefined;
}

export function localizeStage<T extends RoadmapStageState>(
  stage: T,
  language: Language,
  categoryId?: string
): T {
  if (language === "en") return stage;
  const copy = getStageCopyForCategory(stage, categoryId) ?? stageCopy[stage.code]?.ko;
  return copy ? { ...stage, ...copy } : stage;
}

const taskTitleCopy: Record<string, { ko: string }> = {
  // franchise-application
  "fc-inquiry": { ko: "본사 가맹 상담 신청 완료" },
  "fc-disclosure": { ko: "정보공개서 수령 및 검토 (14일 숙려기간)" },
  "fc-visit": { ko: "인근 가맹점 방문 — 기존 점주 경험 확인" },
  "fc-legal": { ko: "가맹 계약서 법률 검토 (변호사/가맹거래사)" },
  "fc-contract": { ko: "가맹 계약 체결 및 가맹비 납부" },
  "fc-training": { ko: "본사 교육 프로그램 이수 완료" },
  // startup-foundation
  "problem-defined": { ko: "핵심 문제를 한 문장으로 정의" },
  "founder-alignment": { ko: "팀 구성 결정 (솔로/공동) 및 역할 문서화" },
  "company-formation-path": { ko: "법인 설립 시점 결정" },
  "brand-identity-draft": { ko: "브랜드 아이덴티티 초안 — 이름·로고 방향·톤앤매너 (공개 전 정리)" },
  "nda-ip-agreement": { ko: "NDA · IP 양도계약서 준비 — 공동창업자·외주·프리랜서 대상 (아이디어 보호 필수)" },
  "brand-identity-offline": { ko: "브랜드 자산 준비 — 간판 디자인·메뉴판·인테리어 브랜딩 요소" },
  "card-merchant-registered": { ko: "카드 가맹점 등록 — VAN사(나이스·KIS·스마트로) 통해 일괄 신청, 약 1주 소요. 사업자등록 직후 즉시 신청" },
  "music-license-registered": { ko: "매장 배경음악 저작권 등록 — 50㎡(15평) 이상 매장 필수, 월 4천원~. KOMCA 또는 매장음악서비스 가입" },
  "brand-identity-online": { ko: "브랜드 자산 준비 — 스토어 로고·배너·패키지 디자인" },
  "cs-channel-ready": { ko: "고객 상담 채널 세팅 — 카카오톡 채널 또는 네이버 톡톡 개설 + 반품/교환 정책 작성" },
  "packaging-supplies-ready": { ko: "포장재 확보 — 택배 박스·완충재·테이프·송장 프린터. 실제 포장 → 발송 워크플로 테스트 필수" },
  // customer-discovery
  "customer-interviews-done": { ko: "초기 타겟 고객 인터뷰 10건 이상 완료" },
  "pain-pattern-documented": { ko: "반복 문제·현재 대안·긴급성 문서화" },
  "narrow-wedge-defined": { ko: "가장 좁고 절실한 첫 문제 정의" },
  // mvp-build + IP
  "core-workflow-defined": { ko: "핵심 사용자 워크플로와 성공 기준 정의" },
  "mvp-shipped": { ko: "가장 작은 MVP 출시" },
  "ip-protection-filed": { ko: "공개 전 상표 등록 및 특허 출원 (가출원 포함)" },
  // launch-gtm
  "analytics-live": { ko: "분석(Analytics) 연결 — 핵심 이벤트 + 퍼널 세팅" },
  "billing-or-conversion-live": { ko: "결제·전환 흐름 세팅 — 가격 정책 + 결제 연동" },
  "error-monitoring-live": { ko: "에러 모니터링 연결 — Sentry + Slack 알림" },
  "feedback-loop-live": { ko: "고객 피드백 루프 — 인앱 채널 + 주간 리뷰" },
  "app-store-submission": { ko: "Google Play / Apple App Store 앱 제출" },
  "terms-privacy-published": { ko: "이용약관 · 개인정보처리방침 게시 — 유저 가입 전 법적 필수. 개인정보보호 포털에서 자동 생성 가능" },
  "pg-payment-ready": { ko: "PG(전자결제) 가입 심사 신청 — 토스페이먼츠/KCP/이니시스 중 선택, 심사 1~2주 소요. 사이트 완성 후 즉시 신청" },
  // growth-engine
  "north-star-set": { ko: "북극성 지표 하나 선택 — 회사 전체가 추적할 핵심 숫자" },
  "weekly-review-running": { ko: "매주 월요일 30분 성장 리뷰 — 지표 확인 + 실험 1개" },
  "retention-check-defined": { ko: "리텐션 체크 — D1/D7/D30 기준 확인 후 개선 집중" },
  // company-setup (사업자등록 · 지식재산 보호 · 세무 기초)
  "business-structure-decided": { ko: "사업 형태 선택 — 개인사업자(대부분 초기) vs 법인(투자 유치 시)" },
  "startup-biz-registered": { ko: "사업자등록 완료 — 홈택스 온라인 신청 (3영업일 소요)" },
  "ip-protection-planned": { ko: "특허 출원 — 공개(데모·베타·보도자료) 전에 특허로에서 출원 필수" },
  "trademark-filed": { ko: "상표 출원 — 브랜드명·로고를 특허로(patent.go.kr)에서 출원" },
  "tax-setup-basics": { ko: "과세 유형 결정 — 간이과세(매출 1억 400만원 미만) vs 일반과세" },
  "security-basics": { ko: "개인정보보호 정책 · 이용약관 · 고객 데이터 보안 계획 수립" },
  // fundraising-readiness
  "runway-model-ready": { ko: "번레이트 계산 및 현금 런웨이 시나리오 모델링" },
  "fundraising-decision-made": { ko: "자금 조달 방식 결정 (투자 유치 / 부트스트랩 / 정부 지원)" },
  "milestone-plan-ready": { ko: "투자금 용도별 마일스톤 계획 수립 (PMF·매출 목표)" },
  "cap-table-clean": { ko: "캡테이블 정리 (지분·ESOP 풀·전환권 확인)" },
  "data-room-ready": { ko: "투자자용 데이터룸 구성 (법률·재무·KPI 자료)" },
  "investor-material-ready": { ko: "피치덱·핵심 지표·재무 전망 자료 준비" },
  // venture-certification
  "venture-cert-type-checked": { ko: "벤처인증 유형 확인 (투자·연구개발·혁신성장)" },
  "govt-program-matched": { ko: "K-Startup 지원사업 매칭 (예비·초기·TIPS·도약)" },
  "application-submitted": { ko: "벤처인증 또는 지원사업 신청서 마감 전 제출" },
  // permit-check
  "building-registry-checked": { ko: "건축물대장 용도 확인 — 업종 영업 가능 여부 사전 점검 (근린생활시설 등)" },
  "permit-type-checked": { ko: "업종별 필요 인허가·등록 종류 확인" },
  "hygiene-education-done": { ko: "식품위생교육 6시간 이수 + 수료증 발급 완료 (음식·카페)" },
  "health-exam-obtained": { ko: "보건소 건강진단결과서(보건증) 발급 완료 (음식·카페·뷰티)" },
  "professional-license-confirmed": { ko: "업종별 전문 면허/자격 확인 (미용사 면허, 학원 강사 자격+성범죄 경력 조회, 동물 취급 자격 등)" },
  "fire-safety-cert-obtained": { ko: "소방완비증명서 신청 및 발급 완료 (해당 시)" },
  "industry-specific-registration": { ko: "업종별 특수 등록 완료 (교육청 학원등록+배상책임보험, 체육시설업 신고+배상책임보험, 동물관련업 등록 등)" },
  "health-cert-checked": { ko: "위생 교육 이수 및 건강진단 조건 확인 (음식·카페·뷰티 업종)" },
  "safety-requirement-checked": { ko: "소방·시설 안전 요건 확인" },
  // contract-review
  "use-check": { ko: "건물 용도와 업종 적합성 확인" },
  "facility-check": { ko: "설비·환기·전기 상태 검토" },
  "restriction-check": { ko: "임대차 조건·권리금·갱신 조항 확인" },
  "septic-tank-checked": { ko: "정화조 용량 음식점 영업신고 가능 여부 확인 (음식·카페)" },
  "certified-date-obtained": { ko: "임대차 계약서 확정일자 받기 (보증금 보호)" },
  // construction-setup
  "contractor-selected": { ko: "인테리어 업체 선정 및 견적 2곳 이상 수령" },
  "design-approved": { ko: "최종 레이아웃 설계 및 공사 계획 확정" },
  "construction-complete": { ko: "공사 완료 및 최종 현장 점검" },
  "fire-health-parallel": { ko: "공사 중 소방필증·보건증 병행 신청 (인테리어 완료 전 미리 진행)" },
  // vendor-setup
  "supplier-identified": { ko: "주요 원자재·상품·소모품 공급처 확정" },
  "equipment-planned": { ko: "장비 구매 또는 렌탈 계획 확정" },
  "pos-selected": { ko: "POS 시스템 선택 및 운영 연동" },
  // registration-setup
  "tax-type-decided": { ko: "간이과세 / 일반과세 선택 결정 (등록 전 필수)" },
  "business-registered": { ko: "세무서에서 사업자등록 완료 (영업 시작 20일 이내)" },
  "permit-filed": { ko: "관할 관청에 영업 신고 또는 허가 신청 완료" },
  // insurance-tax-setup
  "insurance-registered": { ko: "4대보험 정보연계센터에서 4대보험 통합 신고 완료" },
  "withholding-tax-set": { ko: "홈택스 간이세액표로 원천세 설정 완료" },
  "payroll-method-decided": { ko: "급여 지급 방식 결정 (수기/세무사/급여 SaaS)" },
  // hiring-setup
  "hiring-decision-made": { ko: "직원·알바 필요 여부 및 인원 계획 확정" },
  "employment-contract-signed": { ko: "근로계약서 작성 및 교부 완료" },
  // operations-setup
  "delivery-app-registered": { ko: "배달앱 입점 등록 (음식·카페 업종 해당 시)" },
  "pos-live": { ko: "POS 설치 + 카드결제 신청 + 실거래 테스트 완료 (개업 15일 전)" },
  "sns-setup": { ko: "인스타그램·네이버 플레이스·카카오 채널 개설" },
  // pre-launch
  "soft-open-done": { ko: "손님 초대 & 행사 기획 완료" },
  "feedback-collected": { ko: "소프트 오픈 당일 운영 체크리스트 완료" },
  "final-checklist": { ko: "피드백 수집 & 본오픈 마케팅 준비 완료" },
  // platform-setup
  "platform-selected": { ko: "판매 플랫폼 선택 (스마트스토어·쿠팡·자체몰)" },
  "seller-account-created": { ko: "선택 플랫폼 판매자 계정 생성 및 인증" },
  // online-registration
  "business-registered-online": { ko: "세무서에서 사업자등록 완료" },
  "escrow-registered": { ko: "사업용 통장 개설 + 구매안전서비스(에스크로) 가입 — 통신판매업 신고 전 필수" },
  "telecom-sale-filed": { ko: "통신판매업 신고 (지자체)" },
  "kc-trademark-reviewed": { ko: "KC인증 필요 여부 확인 + 상표권 검토 (소싱 전 필수 확인)" },
  // sourcing-setup
  "supplier-contracted": { ko: "신뢰할 공급사 또는 도매상과 계약" },
  "product-photographed": { ko: "초기 상품 전체 사진 촬영 완료" },
  "detail-page-created": { ko: "상품 상세 페이지 설명 및 이미지 등록" },
  // store-setup
  "store-configured": { ko: "스토어 카테고리·배너·반품 정책 구성" },
  "shipping-setup": { ko: "택배사 연동 및 배송 옵션 설정" },
  "pg-connected": { ko: "결제 게이트웨이 연동 (자체몰 필수)" },
  // online-marketing
  "store-seo-done": { ko: "네이버 쇼핑 검색 최적화 (상품명·태그)" },
  "first-ad-set": { ko: "스마트스토어 또는 쿠팡 첫 광고 캠페인 설정" },
  "review-strategy-set": { ko: "신상품 초기 리뷰 확보 전략 수립" },
  // biz-registration
  "biz-reg-confirmed": { ko: "세무서 사업자등록 완료 여부 확인" },
  "biz-account-opened": { ko: "사업 전용 통장 개설 (개인 계좌와 분리)" },
  "cpa-decision-made": { ko: "세무대리인(세무사) 선임 여부 결정" },
  // biz-registration — startup overrides
  "biz-reg-confirmed__startup-tech": { ko: "법인 등기 + 사업자등록 완료 확인" },
  "biz-account-opened__startup-tech": { ko: "법인 통장 개설 (개인 계좌 완전 분리)" },
  "cpa-decision-made__startup-tech": { ko: "세무사 선임 여부 결정 (법인세·R&D 공제 대비)" },
  // pre-launch-final
  "inventory-first-order": { ko: "초도 재고·식재료 발주 및 입고 완료" },
  "staff-final-brief": { ko: "직원 최종 교육 및 오픈 당일 역할 배분" },
  "payment-system-tested": { ko: "결제 시스템 실제 테스트 — 카드단말기/PG 결제·취소·영수증 출력 확인" },
  "launch-day-roles-assigned": { ko: "론칭/오픈 당일 역할 분담 — 누가 무엇을 맡을지 확정 (비상 상황 포함)" },
  "sns-open-teaser": { ko: "SNS 오픈 예고 포스팅 게시" },
  "emergency-plan-ready": { ko: "비상 대응 계획 — Wi-Fi 백업, 카드 단말기 장애, 재고 소진, 고객 불만 에스컬레이션" },
  // pre-launch-final — startup overrides
  "inventory-first-order__startup-tech": { ko: "프로덕션 배포 + 도메인 연결 + 모니터링 확인" },
  "staff-final-brief__startup-tech": { ko: "론칭 당일 역할 분담 (버그 대응·고객 응대·마케팅)" },
  "sns-open-teaser__startup-tech": { ko: "Product Hunt · HN 론칭 포스트 예약 + 커뮤니티 알림" },
  "payment-system-tested__startup-tech": { ko: "결제 플로우 실제 테스트 (Stripe/토스페이먼츠 테스트 모드 결제 성공)" },
  "launch-day-roles-assigned__startup-tech": { ko: "론칭 당일 역할 분담 확정 (버그 대응·고객 응대·마케팅)" },
  "emergency-plan-ready__startup-tech": { ko: "비상 대응 계획 — 서버 다운 시 롤백, 결제 장애 시 고객 안내, 트래픽 급증 대비" },
  // pre-launch-final — online overrides
  "inventory-first-order__online-digital": { ko: "초도 상품 소싱 완료 + 상세 페이지 등록" },
  "staff-final-brief__online-digital": { ko: "주문·배송·CS 운영 플로우 최종 점검" },
  "payment-system-tested__online-digital": { ko: "주문→포장→송장출력→발송 전체 워크플로 테스트" },
  "launch-day-roles-assigned__online-digital": { ko: "첫 주문 처리 역할 분담 — 주문확인·포장·발송·CS" },
  "sns-open-teaser__online-digital": { ko: "스마트스토어/쿠팡 오픈 알림 + SNS 홍보 게시" },
  "emergency-plan-ready__online-digital": { ko: "비상 대응 — 반품·환불·재고소진·배송지연 시나리오 대비" },
  // first-month-check
  "cashflow-plan-ready": { ko: "일별 현금흐름 기록 방법 정하기 (앱·엑셀·수기)" },
  "emergency-fund-ready": { ko: "비상금 확보 확인 (최소 1개월치 고정비)" },
  "key-contacts-list": { ko: "세무사·공급처·장비 AS 연락처 저장 완료" },
  // first-month-check — startup overrides
  "cashflow-plan-ready__startup-tech": { ko: "핵심 지표 추적 체계 세팅 (Mixpanel/PostHog + 주간 리뷰)" },
  "emergency-fund-ready__startup-tech": { ko: "런웨이 확인 — 최소 6개월 운영비 확보" },
  "key-contacts-list__startup-tech": { ko: "세무사·법무사·투자자·멘토 연락처 정리" },
  // first-month-check — online overrides
  "cashflow-plan-ready__online-digital": { ko: "일별 주문·매출·반품 기록 체계 세팅" },
  "emergency-fund-ready__online-digital": { ko: "비상금 확보 (최소 1개월 광고비+물류비)" },
  "key-contacts-list__online-digital": { ko: "공급처·물류사·플랫폼 담당자 연락처 정리" }
};

export function localizeTaskTitle(taskId: string, language: Language, industryCategoryId?: string): string | undefined {
  if (language === "en") return undefined;
  // Try industry-specific override first (e.g. "inventory-first-order__startup-tech")
  if (industryCategoryId) {
    const overrideKey = `${taskId}__${industryCategoryId}`;
    if (taskTitleCopy[overrideKey]?.ko) return taskTitleCopy[overrideKey].ko;
  }
  return taskTitleCopy[taskId]?.ko;
}

const stepCardCopy: Record<string, { ko: StarterCardShape }> = {
  "Roadmap-first flow": {
    ko: {
      title: "로드맵 중심 플로우",
      summary: "사용자는 많은 대시보드 대신, 한 번에 한 단계씩만 해결합니다.",
      points: ["현재 단계 중심 UI", "규칙 기반 단계 진행", "완료하면 다음 단계 자동 해제"]
    }
  },
  "Logic before AI": {
    ko: {
      title: "AI보다 먼저 로직",
      summary: "분기, 체크, 판정은 코드와 규칙으로 처리해 신뢰성과 설명 가능성을 유지합니다.",
      points: ["워크플로우 엔진", "리스크/게이팅 규칙 엔진", "AI는 설명과 비교에만 제한 사용"]
    }
  },
  "Freshness-aware information": {
    ko: {
      title: "최신성 중심 정보",
      summary: "모든 추천과 가이드는 출처와 최신성 메타데이터를 함께 보여줍니다.",
      points: ["검증일과 재검토 시점", "출처 신뢰도 표시", "오래된 정보는 차단 가능"]
    }
  }
};

export function localizeStarterStepCard<T extends StarterCardShape>(card: T, language: Language): T {
  if (language === "en") return card;
  const copy = stepCardCopy[card.title]?.ko;
  return copy ? ({ ...card, ...copy } as T) : card;
}

const guideCopy: Record<
  string,
  { ko: { title: string; summary: string; notes?: string; payload?: Record<string, string[]> } }
> = {
  "permit-cafe-dessert-business-registration": {
    ko: {
      title: "카페 창업 사업자등록·인허가 체크리스트",
      summary: "오프라인 카페/디저트 창업자를 위한 핵심 등록 및 인허가 순서입니다.",
      notes: "구청별 요구 서류가 바뀌는 경우가 있어 오픈 직전 한 번 더 확인하는 것이 안전합니다.",
      payload: {
        steps: [
          "임대차 계약 전 업종 가능 여부와 용도부터 확인합니다.",
          "정확한 업종코드로 사업자등록 준비를 합니다.",
          "식품위생교육과 구청 신고 대상 여부를 확인합니다.",
          "오픈 전 카드가맹, 영수증, POS 구조를 함께 점검합니다."
        ],
        requiredDocuments: ["신분증", "임대차계약서", "사업장 주소 정보", "필요 시 평면도나 구청 첨부서류"]
      }
    }
  },
  "permit-food-business-registration": {
    ko: {
      title: "외식업 사업자등록·영업 인허가 체크리스트",
      summary: "주방 운영이 필요한 외식업 창업자를 위한 핵심 등록 순서입니다.",
      notes: "주방·위생 관련 조건은 관할 구청 기준을 반드시 다시 확인해야 합니다.",
      payload: {
        steps: [
          "계약 전 용도, 배기, 주방 시설 적합성을 먼저 확인합니다.",
          "식당형 업종코드로 사업자등록을 준비합니다.",
          "영업신고와 위생교육 대상 여부를 구청 기준으로 확인합니다.",
          "폐기물, 공과금, 배달 운영 관련 준수 항목을 정리합니다."
        ],
        requiredDocuments: ["신분증", "임대차계약서", "주방/시설 정보", "필요 시 구청 첨부서류"]
      }
    }
  },
  "tax-cafe-dessert-basics": {
    ko: {
      title: "카페 세무 기본 가이드",
      summary: "처음 카페를 여는 창업자가 오픈 전후에 꼭 확인해야 할 세무 기초입니다.",
      notes: "매출 규모와 운영 구조에 따라 세무 처리 방식이 달라질 수 있습니다.",
      payload: {
        checkpoints: [
          "등록 시 과세 유형을 정확하게 선택합니다.",
          "카드가맹, 현금영수증, 기본 증빙 흐름을 준비합니다.",
          "재료비, 장비비, 인테리어 비용을 분리해서 관리합니다.",
          "첫 부가세 신고 전에 일정 알림을 잡아둡니다."
        ]
      }
    }
  },
  "tax-food-basics": {
    ko: {
      title: "외식업 세무·증빙 기본 가이드",
      summary: "외식업 창업자가 초기에 놓치기 쉬운 세무 구조와 증빙 관리 포인트입니다.",
      notes: "배달 정산 처리 방식은 최신 안내 기준으로 다시 확인하는 것이 좋습니다.",
      payload: {
        checkpoints: [
          "식재료비와 주방 설비비를 분리해서 기록합니다.",
          "거래처 영수증과 매입 증빙을 꾸준히 모읍니다.",
          "오픈 직후 현금흐름이 빠듯해지기 전에 부가세 일정을 잡아둡니다.",
          "배달 플랫폼 정산 내역을 별도로 점검합니다."
        ]
      }
    }
  },
  "loan-cafe-dessert-policy-fund": {
    ko: {
      title: "카페 창업 정책자금 가이드",
      summary: "카페/디저트 창업자가 임대와 인테리어를 함께 준비할 때 참고할 수 있는 정책자금형 대출 가이드입니다.",
      notes: "실제 신청 전에는 공고 조건과 기관별 접수 기간을 다시 확인해야 합니다.",
      payload: {
        highlights: [
          "보증금과 인테리어를 함께 준비해야 할 때 유용합니다.",
          "신청 전 사업계획서의 명확성이 중요합니다.",
          "현금흐름 추정과 창업자 배경을 함께 점검받는 경우가 많습니다."
        ]
      }
    }
  },
  "loan-food-policy-fund": {
    ko: {
      title: "외식업 창업 자금 체크리스트",
      summary: "주방 설비, 점포 준비, 초기 운영비를 함께 고려해야 하는 외식업 창업자를 위한 대출 가이드입니다.",
      notes: "정책자금 공고 시기와 관할 조건은 제출 직전에 다시 확인해야 합니다.",
      payload: {
        highlights: [
          "주방과 설비 비용 때문에 필요한 자금 버퍼가 커지기 쉽습니다.",
          "대출 전 손익분기 모델을 현실적으로 점검해야 합니다.",
          "메뉴, 가격, 배달 비중에 대한 가정이 준비되어 있어야 합니다."
        ]
      }
    }
  }
};

const sourceNameCopy: Record<string, { ko: string }> = {
  "National Tax Service": { ko: "국세청" },
  "Small Enterprise and Market Service": { ko: "소상공인시장진흥공단" },
  "Seoul Open Data Plaza": { ko: "서울열린데이터광장" },
  "Mapo District Commercial Trend Bulletin": { ko: "마포구 상권 동향 자료" },
  "Gangnam District Business Statistics": { ko: "강남구 상권 통계" },
  "Government and official provider source": { ko: "정부 및 공식 기관 출처" },
  "District commercial trend source": { ko: "구 단위 상권 동향 출처" }
};

export function localizeGuideRecord<T extends GuideRecordShape>(guide: T, language: Language): T {
  if (language === "en") return guide;
  const copy = guideCopy[guide.itemKey]?.ko;
  return {
    ...guide,
    title: copy?.title ?? guide.title,
    summary: copy?.summary ?? guide.summary,
    notes: copy?.notes ?? guide.notes,
    payload: copy?.payload ? { ...guide.payload, ...copy.payload } : guide.payload,
    sources: guide.sources.map((source) => ({
      ...source,
      sourceName: sourceNameCopy[source.sourceName]?.ko ?? source.sourceName
    }))
  };
}

export function formatGuideSectionTitle(key: string, language: Language) {
  if (language === "en") {
    return key.replaceAll("_", " ");
  }

  const map: Record<string, string> = {
    steps: "진행 순서",
    checkpoints: "체크포인트",
    highlights: "핵심 포인트",
    requiredDocuments: "필요 서류"
  };

  return map[key] ?? key.replaceAll("_", " ");
}
