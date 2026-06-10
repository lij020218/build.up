/* ─────────────────────────────────────────────
 *  app-store-guide.ts
 *  Google Play + Apple App Store 출시 가이드
 *  스타트업-모바일 앱 창업자를 위한 실전 체크리스트
 *  출처: Google Play Console 공식 문서, Apple Developer 공식 문서, 실전 경험
 *  데이터 기준: 2026-04
 * ───────────────────────────────────────────── */

export type AppStoreStep = {
  id: string;
  order: number;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  estimatedTime: { ko: string; en: string };
  cost?: { ko: string; en: string };
  url?: string;
  tips?: Array<{ ko: string; en: string }>;
  warnings?: Array<{ ko: string; en: string }>;
};

export type AppStoreGuide = {
  platform: "google-play" | "apple-app-store";
  label: { ko: string; en: string };
  totalEstimatedDays: { ko: string; en: string };
  steps: AppStoreStep[];
  commonRejectionReasons: Array<{
    reason: { ko: string; en: string };
    fix: { ko: string; en: string };
  }>;
};

// ── Google Play Store ─────────────────────────────────────────────────────

export const googlePlayGuide: AppStoreGuide = {
  platform: "google-play",
  label: { ko: "Google Play 스토어", en: "Google Play Store" },
  totalEstimatedDays: { ko: "7~14일 (계정 생성 ~ 앱 게시)", en: "7-14 days (account creation to publishing)" },
  steps: [
    {
      id: "gp-account",
      order: 1,
      title: { ko: "Google Play 개발자 계정 생성", en: "Create Google Play Developer Account" },
      description: {
        ko: "Google 계정으로 Play Console에 가입합니다. 개인 계정과 조직 계정 중 선택합니다. 법인이면 조직 계정을 선택하세요.",
        en: "Sign up for Play Console with your Google account. Choose between personal and organization account. Choose organization if you have a company.",
      },
      estimatedTime: { ko: "30분~1시간", en: "30min-1hr" },
      cost: { ko: "미화 $25 (1회, 약 33,000원)", en: "$25 one-time fee" },
      url: "https://play.google.com/console/signup",
      tips: [
        { ko: "2023년 11월 이후 생성된 개인 계정은 20명의 테스터에게 14일간 테스트를 완료해야 앱 게시 가능", en: "Personal accounts created after Nov 2023 require 20 testers for 14 days before publishing" },
        { ko: "법인이면 사업자등록증 영문본 준비", en: "Prepare English business registration if using organization account" },
      ],
    },
    {
      id: "gp-app-create",
      order: 2,
      title: { ko: "앱 만들기 + 스토어 등록정보 작성", en: "Create App + Store Listing" },
      description: {
        ko: "Play Console에서 '앱 만들기'를 클릭하고 기본 정보를 입력합니다: 앱 이름, 기본 언어, 앱/게임 구분, 유료/무료 여부.",
        en: "Click 'Create app' in Play Console and fill in basics: app name, default language, app/game type, free/paid.",
      },
      estimatedTime: { ko: "1~2시간", en: "1-2 hours" },
      tips: [
        { ko: "앱 이름은 30자 이내. '최고', '1위' 등 과장 표현 사용 금지", en: "App name max 30 chars. Avoid superlatives like 'best' or '#1'" },
        { ko: "짧은 설명(80자)과 자세한 설명(4000자)을 미리 작성해두세요", en: "Prepare short description (80 chars) and full description (4000 chars) in advance" },
      ],
    },
    {
      id: "gp-screenshots",
      order: 3,
      title: { ko: "스크린샷 · 그래픽 에셋 준비", en: "Prepare Screenshots & Graphic Assets" },
      description: {
        ko: "스마트폰 스크린샷 최소 2장(최대 8장), 고해상도 아이콘(512×512), 그래픽 이미지(1024×500)를 준비합니다. 태블릿 스크린샷도 권장.",
        en: "Prepare min 2 (max 8) phone screenshots, hi-res icon (512×512), feature graphic (1024×500). Tablet screenshots recommended.",
      },
      estimatedTime: { ko: "2~4시간", en: "2-4 hours" },
      tips: [
        { ko: "스크린샷에 앱의 핵심 기능을 보여주는 캡션을 추가하면 전환율 상승", en: "Adding captions highlighting key features to screenshots increases conversion" },
        { ko: "Figma/Canva로 프레임 + 캡션이 포함된 마케팅용 스크린샷 제작", en: "Use Figma/Canva to create marketing screenshots with device frames + captions" },
      ],
    },
    {
      id: "gp-content-rating",
      order: 4,
      title: { ko: "콘텐츠 등급 설문 작성", en: "Complete Content Rating Questionnaire" },
      description: {
        ko: "IARC 콘텐츠 등급 설문을 작성합니다. 앱에 폭력, 성인 콘텐츠, 도박 요소가 없다면 '전체이용가'를 받을 수 있습니다.",
        en: "Complete the IARC content rating questionnaire. If your app has no violence, adult content, or gambling, you'll get an 'Everyone' rating.",
      },
      estimatedTime: { ko: "15분", en: "15 min" },
    },
    {
      id: "gp-privacy",
      order: 5,
      title: { ko: "개인정보처리방침 + 데이터 안전 섹션", en: "Privacy Policy + Data Safety Section" },
      description: {
        ko: "개인정보처리방침 URL을 등록하고, 데이터 안전(Data Safety) 섹션을 작성합니다. 어떤 데이터를 수집하고 어떻게 사용하는지 명시.",
        en: "Register privacy policy URL and complete Data Safety section. Specify what data you collect and how you use it.",
      },
      estimatedTime: { ko: "1~2시간", en: "1-2 hours" },
      url: "https://www.privacy.go.kr",
      warnings: [
        { ko: "개인정보처리방침 URL은 반드시 HTTPS여야 하며, 정상 작동하는 페이지여야 함", en: "Privacy policy URL must be HTTPS and the page must be live" },
        { ko: "로그인이 없어도 개인정보처리방침은 필수", en: "Privacy policy is required even without login/signup" },
      ],
    },
    {
      id: "gp-aab-upload",
      order: 6,
      title: { ko: "AAB(Android App Bundle) 업로드", en: "Upload AAB (Android App Bundle)" },
      description: {
        ko: "빌드한 .aab 파일을 프로덕션 트랙에 업로드합니다. APK가 아닌 AAB 형식이 필수입니다. 앱 서명 키는 Google이 관리합니다.",
        en: "Upload your .aab file to the production track. AAB format is required (not APK). Google manages app signing keys.",
      },
      estimatedTime: { ko: "30분", en: "30 min" },
      tips: [
        { ko: "React Native: npx react-native build-android --mode=release", en: "React Native: npx react-native build-android --mode=release" },
        { ko: "Flutter: flutter build appbundle --release", en: "Flutter: flutter build appbundle --release" },
        { ko: "앱 크기가 150MB를 초과하면 Play Asset Delivery 사용", en: "Use Play Asset Delivery if app exceeds 150MB" },
      ],
    },
    {
      id: "gp-testing",
      order: 7,
      title: { ko: "비공개/공개 테스트 (필수)", en: "Closed/Open Testing (Required)" },
      description: {
        ko: "2023년 11월 이후 생성된 개인 계정은 비공개 테스트에서 20명의 옵트인 테스터가 14일간 테스트를 완료해야 프로덕션 출시가 가능합니다.",
        en: "Personal accounts created after Nov 2023 must have 20 opt-in testers complete 14 days of closed testing before production release.",
      },
      estimatedTime: { ko: "최소 14일", en: "Minimum 14 days" },
      warnings: [
        { ko: "테스터는 반드시 Google 계정으로 옵트인해야 하며, 실제로 앱을 설치·사용해야 함", en: "Testers must opt in with Google account and actually install/use the app" },
        { ko: "조직 계정은 이 요구사항이 없음 — 법인이면 조직 계정 추천", en: "Organization accounts are exempt — use organization account if you have a company" },
      ],
    },
    {
      id: "gp-review",
      order: 8,
      title: { ko: "프로덕션 출시 + Google 심사", en: "Production Release + Google Review" },
      description: {
        ko: "모든 설정이 완료되면 '프로덕션 검토 제출'을 클릭합니다. Google에서 3~7일간 심사 후 승인되면 Play 스토어에 게시됩니다.",
        en: "Once everything is set, click 'Submit for production review'. Google reviews for 3-7 days, then publishes to Play Store.",
      },
      estimatedTime: { ko: "3~7일 (심사)", en: "3-7 days (review)" },
      tips: [
        { ko: "첫 앱은 심사가 더 오래 걸릴 수 있음 (최대 14일)", en: "First app may take longer (up to 14 days)" },
        { ko: "심사 거절 시 메일로 사유가 전달됨 — 수정 후 재제출", en: "Rejection reasons sent via email — fix and resubmit" },
      ],
    },
  ],
  commonRejectionReasons: [
    { reason: { ko: "개인정보처리방침 누락 또는 접근 불가", en: "Missing or inaccessible privacy policy" }, fix: { ko: "HTTPS URL로 개인정보처리방침 페이지를 만들고 앱 내 + 스토어 등록정보에 모두 링크", en: "Create privacy policy page on HTTPS URL, link in both app and store listing" } },
    { reason: { ko: "메타데이터에 과장/허위 표현 ('최고', '1위', '보장')", en: "Misleading metadata (superlatives like 'best', '#1', 'guaranteed')" }, fix: { ko: "객관적인 설명으로 교체. 수상 이력이 있다면 출처 명시", en: "Replace with objective descriptions. Cite sources for any awards" } },
    { reason: { ko: "백그라운드 위치 권한 남용", en: "Background location permission abuse" }, fix: { ko: "백그라운드 위치가 꼭 필요한 경우에만 요청하고, 앱 내에서 사유를 명확히 설명", en: "Only request if essential, clearly explain why in-app" } },
    { reason: { ko: "UGC(사용자 생성 콘텐츠) 신고/차단 기능 미구현", en: "Missing report/block for user-generated content" }, fix: { ko: "게시판/댓글이 있으면 반드시 신고 + 차단 기능 구현", en: "Implement report + block if you have comments/boards" } },
    { reason: { ko: "앱 충돌(크래시) 또는 심각한 버그", en: "App crashes or severe bugs" }, fix: { ko: "출시 전 다양한 기기에서 철저히 테스트. Crashlytics/Sentry 연동 권장", en: "Test thoroughly on various devices before submission. Use Crashlytics/Sentry" } },
    { reason: { ko: "콘텐츠 등급 미완료", en: "Incomplete content rating" }, fix: { ko: "IARC 설문을 정직하게 작성. 미완료 시 앱이 게시되지 않음", en: "Complete IARC questionnaire honestly. App won't publish without it" } },
  ],
};

// ── Apple App Store ──────────────────────────────────────────────────────

export const appleAppStoreGuide: AppStoreGuide = {
  platform: "apple-app-store",
  label: { ko: "Apple App Store", en: "Apple App Store" },
  totalEstimatedDays: { ko: "14~30일 (D-U-N-S + 계정 승인 + 심사)", en: "14-30 days (D-U-N-S + account approval + review)" },
  steps: [
    {
      id: "apple-duns",
      order: 1,
      title: { ko: "D-U-N-S 번호 발급 (법인만)", en: "Get D-U-N-S Number (Organizations only)" },
      description: {
        ko: "법인/조직으로 등록하려면 D-U-N-S 번호(국제 사업자 식별번호)가 필요합니다. Dun & Bradstreet 사이트에서 무료로 신청합니다. 개인 개발자는 이 단계를 건너뛸 수 있습니다.",
        en: "Organizations need a D-U-N-S number (international business ID). Apply free at Dun & Bradstreet. Individual developers can skip this step.",
      },
      estimatedTime: { ko: "신청 후 2~5일 소요", en: "2-5 days after application" },
      cost: { ko: "무료", en: "Free" },
      url: "https://developer.apple.com/enroll/duns-lookup/",
      tips: [
        { ko: "영문 사업자등록증 필요 — 세무서에서 발급 가능", en: "English business registration needed — available from tax office" },
        { ko: "D-U-N-S 번호, Apple 계정, 사업자등록증의 법인명이 모두 일치해야 함", en: "Company name must match across D-U-N-S, Apple account, and business registration" },
      ],
      warnings: [
        { ko: "D-U-N-S 번호 발급 후 Apple 시스템에 반영되기까지 추가 2~3일 소요", en: "After D-U-N-S issuance, 2-3 more days for Apple system sync" },
      ],
    },
    {
      id: "apple-account",
      order: 2,
      title: { ko: "Apple Developer Program 가입", en: "Enroll in Apple Developer Program" },
      description: {
        ko: "developer.apple.com에서 Apple Developer Program에 가입합니다. 개인 또는 조직(법인) 중 선택. 가입 승인까지 짧으면 1주일, 길면 3주 소요됩니다.",
        en: "Enroll at developer.apple.com. Choose Individual or Organization. Approval takes 1-3 weeks.",
      },
      estimatedTime: { ko: "가입 신청 30분 + 승인 대기 1~3주", en: "30min to apply + 1-3 weeks for approval" },
      cost: { ko: "연 129,000원 (매년 갱신 필수 — 미갱신 시 앱 삭제)", en: "$99/year (renewal required — apps removed if lapsed)" },
      url: "https://developer.apple.com/programs/enroll/",
      warnings: [
        { ko: "멤버십 만료 시 앱이 App Store에서 즉시 내려감", en: "Apps are removed from App Store immediately when membership expires" },
        { ko: "2단계 인증이 활성화된 Apple ID 필요", en: "Apple ID with two-factor authentication required" },
      ],
    },
    {
      id: "apple-app-connect",
      order: 3,
      title: { ko: "App Store Connect에 앱 등록", en: "Register App in App Store Connect" },
      description: {
        ko: "App Store Connect에서 '새로운 앱'을 생성합니다. 번들 ID, 앱 이름, 기본 언어, SKU를 설정합니다.",
        en: "Create a 'New App' in App Store Connect. Set Bundle ID, app name, primary language, and SKU.",
      },
      estimatedTime: { ko: "30분~1시간", en: "30min-1hr" },
      tips: [
        { ko: "번들 ID는 com.회사명.앱이름 형식 (예: com.foundone.app)", en: "Bundle ID format: com.companyname.appname (e.g., com.foundone.app)" },
        { ko: "앱 이름은 30자 이내. 키워드 필드(100자)도 미리 준비", en: "App name max 30 chars. Prepare keyword field (100 chars) in advance" },
      ],
    },
    {
      id: "apple-screenshots",
      order: 4,
      title: { ko: "스크린샷 · 앱 미리보기 준비", en: "Prepare Screenshots & App Preview" },
      description: {
        ko: "iPhone 6.7인치(필수), 6.5인치, 5.5인치 스크린샷을 준비합니다. iPad도 지원하면 iPad 스크린샷 필요. 앱 미리보기 동영상(30초 이내)은 선택사항이지만 전환율에 큰 영향.",
        en: "Prepare 6.7\" (required), 6.5\", 5.5\" iPhone screenshots. iPad screenshots if supported. App preview video (≤30s) is optional but greatly improves conversion.",
      },
      estimatedTime: { ko: "2~4시간", en: "2-4 hours" },
      tips: [
        { ko: "스크린샷은 기기별 최소 3장, 최대 10장", en: "Min 3, max 10 screenshots per device" },
        { ko: "앱 미리보기 동영상은 전환율을 35% 이상 높일 수 있음", en: "App preview video can increase conversion by 35%+" },
      ],
    },
    {
      id: "apple-privacy",
      order: 5,
      title: { ko: "개인정보 보호 세부사항 + 정책 URL", en: "Privacy Details + Policy URL" },
      description: {
        ko: "앱이 수집하는 데이터 유형을 App Store Connect의 '앱 개인정보 보호' 섹션에서 상세히 작성합니다. 개인정보처리방침 URL도 필수.",
        en: "Detail all data types your app collects in App Store Connect's 'App Privacy' section. Privacy policy URL is also required.",
      },
      estimatedTime: { ko: "1시간", en: "1 hour" },
      warnings: [
        { ko: "계정 생성 기능이 있으면 반드시 앱 내에서 계정 삭제 기능도 제공해야 함", en: "If your app supports account creation, you MUST also provide in-app account deletion" },
      ],
    },
    {
      id: "apple-build-upload",
      order: 6,
      title: { ko: "빌드 업로드 (Xcode / Transporter)", en: "Upload Build (Xcode / Transporter)" },
      description: {
        ko: "Xcode에서 Archive → Distribute App → App Store Connect 순서로 업로드합니다. 또는 Transporter 앱을 사용할 수도 있습니다.",
        en: "In Xcode: Archive → Distribute App → App Store Connect. Alternatively use the Transporter app.",
      },
      estimatedTime: { ko: "30분~1시간", en: "30min-1hr" },
      tips: [
        { ko: "React Native: Xcode에서 .xcworkspace 열기 → Product → Archive", en: "React Native: Open .xcworkspace in Xcode → Product → Archive" },
        { ko: "Flutter: flutter build ipa --release → Xcode에서 업로드", en: "Flutter: flutter build ipa --release → upload via Xcode" },
        { ko: "빌드 처리에 10~30분 소요 — App Store Connect에서 '빌드 처리 중' 확인", en: "Build processing takes 10-30 min — check 'Processing' status in App Store Connect" },
      ],
    },
    {
      id: "apple-review",
      order: 7,
      title: { ko: "심사 제출 + Apple 리뷰", en: "Submit for Review + Apple Review" },
      description: {
        ko: "모든 메타데이터와 빌드가 준비되면 '심사를 위해 제출'을 클릭합니다. Apple의 심사는 보통 24~48시간이지만, 첫 앱이나 복잡한 앱은 최대 7일 걸릴 수 있습니다.",
        en: "Once all metadata and build are ready, click 'Submit for Review'. Apple review typically takes 24-48 hours, but first apps or complex apps may take up to 7 days.",
      },
      estimatedTime: { ko: "24시간~7일 (심사)", en: "24hrs-7 days (review)" },
      tips: [
        { ko: "심사 노트에 테스트 계정 정보를 반드시 제공 (로그인이 필요한 앱)", en: "Always provide test account credentials in review notes (for apps requiring login)" },
        { ko: "리젝 시 Resolution Center에서 사유 확인 → 수정 → 재제출", en: "If rejected, check Resolution Center → fix → resubmit" },
      ],
    },
  ],
  commonRejectionReasons: [
    { reason: { ko: "개인정보처리방침 누락 또는 URL 접근 불가", en: "Missing or inaccessible privacy policy" }, fix: { ko: "HTTPS URL로 개인정보처리방침 페이지 생성, 앱 내 설정에서도 접근 가능하게", en: "Create privacy policy on HTTPS, make accessible from app settings" } },
    { reason: { ko: "앱 충돌(크래시) 또는 심각한 버그", en: "Crashes or critical bugs during review" }, fix: { ko: "TestFlight로 충분히 테스트 후 제출. Sentry/Crashlytics로 크래시 모니터링", en: "Test thoroughly via TestFlight. Monitor crashes with Sentry/Crashlytics" } },
    { reason: { ko: "메타데이터 불일치 (스크린샷 ≠ 실제 앱)", en: "Metadata mismatch (screenshots ≠ actual app)" }, fix: { ko: "실제 앱 화면을 정확히 반영하는 스크린샷 사용", en: "Use screenshots that accurately reflect actual app screens" } },
    { reason: { ko: "인앱 결제 미사용 (디지털 상품에 외부 결제 사용)", en: "Not using IAP for digital goods (external payment)" }, fix: { ko: "디지털 콘텐츠/구독은 반드시 Apple IAP 사용. 물리적 상품/서비스는 외부 결제 가능", en: "Use Apple IAP for digital content/subscriptions. Physical goods can use external payment" } },
    { reason: { ko: "계정 삭제 기능 미구현", en: "Missing account deletion feature" }, fix: { ko: "회원가입이 있으면 앱 내에서 계정 삭제(탈퇴) 기능 필수 구현", en: "If app has signup, implement in-app account deletion" } },
    { reason: { ko: "웹 래퍼 앱 (WebView만 있는 앱)", en: "Web wrapper app (WebView-only)" }, fix: { ko: "네이티브 기능(푸시 알림, 카메라 등) 최소 1개 이상 구현. WebView만으로는 리젝", en: "Implement at least 1 native feature (push notifications, camera, etc.)" } },
    { reason: { ko: "앱 완성도 부족 (베타/테스트 표시)", en: "Incomplete app (beta/test labels)" }, fix: { ko: "'베타', '테스트', 'Coming Soon' 문구 제거. 모든 기능이 완전히 동작해야 함", en: "Remove 'beta', 'test', 'coming soon' labels. All features must be fully functional" } },
    { reason: { ko: "지적재산권 침해 (로고/브랜드 무단 사용)", en: "IP violation (unauthorized logos/brands)" }, fix: { ko: "타 브랜드 로고/이름 무단 사용 금지. 공식 제휴가 있으면 증빙 첨부", en: "Don't use other brands' logos/names. Attach proof if you have official partnership" } },
  ],
};

// ── 앱 출시 전 공통 체크리스트 ──────────────────────────────────────────────

export type PreLaunchCheckItem = {
  id: string;
  category: "legal" | "technical" | "marketing" | "content";
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  required: boolean;
};

export const appPreLaunchChecklist: PreLaunchCheckItem[] = [
  // Legal
  { id: "privacy-policy", category: "legal", title: { ko: "개인정보처리방침 페이지", en: "Privacy Policy Page" }, description: { ko: "HTTPS URL, 수집 항목·보관 기간·활용 목적·삭제 방법 명시", en: "HTTPS URL specifying data collected, retention, purpose, deletion method" }, required: true },
  { id: "terms-of-service", category: "legal", title: { ko: "서비스 이용약관", en: "Terms of Service" }, description: { ko: "서비스 이용 조건, 면책 사항, 분쟁 해결 절차 명시", en: "Service conditions, disclaimers, dispute resolution" }, required: true },
  { id: "account-deletion", category: "legal", title: { ko: "계정 삭제(탈퇴) 기능", en: "Account Deletion Feature" }, description: { ko: "회원가입이 있으면 앱 내에서 계정 삭제 기능 필수 (Apple 필수 요구사항)", en: "If signup exists, in-app account deletion is mandatory (Apple requirement)" }, required: true },
  { id: "age-rating", category: "legal", title: { ko: "콘텐츠 연령 등급 작성", en: "Content Age Rating" }, description: { ko: "IARC 설문(Google) + App Store 콘텐츠 등급(Apple) 모두 작성", en: "Complete both IARC questionnaire (Google) and App Store content rating (Apple)" }, required: true },

  // Technical
  { id: "crash-test", category: "technical", title: { ko: "크래시 테스트 완료", en: "Crash Testing Complete" }, description: { ko: "최소 5개 이상 다양한 기기에서 테스트. 에러 추적 도구(Sentry/Crashlytics) 연동", en: "Test on 5+ different devices. Integrate error tracking (Sentry/Crashlytics)" }, required: true },
  { id: "performance", category: "technical", title: { ko: "성능 최적화", en: "Performance Optimization" }, description: { ko: "앱 시작 시간 3초 이내. 주요 화면 전환 1초 이내. 메모리 누수 없음", en: "App launch under 3s. Screen transitions under 1s. No memory leaks" }, required: true },
  { id: "offline-handling", category: "technical", title: { ko: "오프라인/네트워크 오류 처리", en: "Offline/Network Error Handling" }, description: { ko: "인터넷 없을 때 앱이 크래시하지 않고 적절한 안내 표시", en: "App should show proper message when offline, not crash" }, required: true },
  { id: "deep-links", category: "technical", title: { ko: "딥링크 테스트", en: "Deep Link Testing" }, description: { ko: "공유 링크/알림 클릭 시 올바른 화면으로 이동하는지 확인", en: "Verify shared links and notification taps navigate to correct screens" }, required: false },

  // Marketing
  { id: "aso-keywords", category: "marketing", title: { ko: "ASO(앱 스토어 최적화) 키워드", en: "ASO Keywords" }, description: { ko: "앱 이름, 부제목, 키워드 필드에 검색될 핵심 키워드 포함", en: "Include target keywords in app name, subtitle, and keyword field" }, required: true },
  { id: "screenshots-marketing", category: "marketing", title: { ko: "마케팅용 스크린샷", en: "Marketing Screenshots" }, description: { ko: "캡션+디바이스 프레임이 포함된 전문적인 스크린샷. A/B 테스트 권장", en: "Professional screenshots with captions and device frames. A/B testing recommended" }, required: true },
  { id: "launch-announce", category: "marketing", title: { ko: "런칭 사전 알림", en: "Pre-launch Announcement" }, description: { ko: "SNS, 이메일 리스트, 커뮤니티에 출시 일정 사전 공유", en: "Share launch date on SNS, email lists, and communities in advance" }, required: false },

  // Content
  { id: "localization", category: "content", title: { ko: "다국어 지원 확인", en: "Localization Check" }, description: { ko: "한국어/영어 번역 완성도 확인. UI가 긴 텍스트에서 깨지지 않는지 테스트", en: "Verify Korean/English translation completeness. Test UI with long text strings" }, required: false },
  { id: "support-contact", category: "content", title: { ko: "고객 지원 연락처", en: "Support Contact" }, description: { ko: "이메일 또는 고객센터 URL 준비 (스토어 등록 시 필수)", en: "Prepare email or help center URL (required for store listing)" }, required: true },
];

// ── Export all ──────────────────────────────────────────────────────────────

export const appStoreGuides = [googlePlayGuide, appleAppStoreGuide] as const;
