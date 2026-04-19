/**
 * 첫 100명 고객 확보 플레이북 — 업종별 단계별 전술.
 * 오픈 직후 "사람이 올까?" 공백을 메우는 실행 가이드.
 */

export type PlaybookPhaseId = "pre-open" | "launch" | "grow";

export type PlaybookTactic = {
  id: string;                            // 체크리스트 상태 키
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  channel?: string;                       // 관련 채널 (선택)
  targetCount?: number;                    // 이 전술로 확보 목표 고객 수
};

export type PlaybookPhase = {
  id: PlaybookPhaseId;
  name: { ko: string; en: string };
  customerRange: { from: number; to: number };   // "0~20명"
  description: { ko: string; en: string };
  tactics: PlaybookTactic[];
};

export type Playbook = {
  industryId: string;
  targetDays: number;                     // 100명까지 목표 일수
  phases: PlaybookPhase[];
};

// 공통 전술 빌더
const t = (id: string, titleKo: string, titleEn: string, descKo: string, descEn: string, extras: Partial<PlaybookTactic> = {}): PlaybookTactic => ({
  id,
  title: { ko: titleKo, en: titleEn },
  description: { ko: descKo, en: descEn },
  ...extras,
});

// ── 음식점 (food) ──
const foodPlaybook: Playbook = {
  industryId: "food",
  targetDays: 60,
  phases: [
    {
      id: "pre-open",
      name: { ko: "오픈 1~2주 전 · 씨앗 심기", en: "Pre-open · Planting seeds" },
      customerRange: { from: 0, to: 20 },
      description: { ko: "지인 + 동네 + 검색 기반 존재 알리기", en: "Friends + neighborhood + search discoverability" },
      tactics: [
        t("food-pre-1", "네이버 플레이스 등록 (7일 전 필수)", "Register Naver Place 7 days before open",
          "노출까지 최대 7일. 사진 10장+, 메뉴, 영업시간, 가격 정확히 입력",
          "Up to 7 days until visible. 10+ photos, menu, hours, prices required",
          { channel: "naver-place", targetCount: 5 }),
        t("food-pre-2", "인스타그램 계정 생성 + 피드 9장 채우기", "Create Instagram + 9 starter posts",
          "프로필 통일 + 대표 메뉴 9장 + 첫 릴스 1개. 오픈 2주 전부터 매일 1포스트",
          "Unified profile + 9 hero photos + 1 reel. Daily posts from 2 weeks before open",
          { channel: "instagram", targetCount: 3 }),
        t("food-pre-3", "당근마켓 동네생활 소개글 1회", "Daangn neighborhood intro post",
          "오픈 5일 전 '새로 생긴 가게예요' + 오픈 기념 쿠폰 1장 첨부",
          "5 days before: 'New in the hood' + one launch coupon",
          { channel: "daangn", targetCount: 10 }),
        t("food-pre-4", "지인 100명 초대 DM 발송", "DM 100 friends to invite",
          "카톡 이모티콘 없이 진심 문구 + 오픈일 + 주소. 30% 방문 예상",
          "Sincere text, no emojis. Open date + address. Expect ~30% to visit",
          { targetCount: 30 }),
      ],
    },
    {
      id: "launch",
      name: { ko: "오픈 첫 주 · 폭발 만들기", en: "Launch week · Create the spark" },
      customerRange: { from: 20, to: 60 },
      description: { ko: "첫 방문 고객이 두 번째를 오게 + SNS에 올리게", en: "Turn first visits into return visits + UGC" },
      tactics: [
        t("food-launch-1", "오픈 기념 쿠폰 (30% 할인 x 100장)", "Launch 30%-off coupon × 100",
          "쿠폰 코드 'OPEN30' 발행. 당근·인스타·매장 QR로 배포",
          "Issue code 'OPEN30' via Daangn, Instagram, and in-store QR",
          { targetCount: 50 }),
        t("food-launch-2", "리뷰 이벤트 (사진 + 해시태그 = 음료 증정)", "Review event (photo + hashtag = free drink)",
          "인스타 해시태그 + 매장 태그 스토리 = 음료 서비스. 스토리 리그램",
          "Instagram hashtag + store tag = free drink. Regram the stories",
          { channel: "instagram", targetCount: 20 }),
        t("food-launch-3", "배달앱 입점 + 신규 할인 5000원", "Launch on delivery apps + ₩5000 first-order discount",
          "배민·쿠팡이츠 동시 오픈. 첫 주문 5000원 할인 + 별점 요청",
          "Baedal Minjok + Coupang Eats. ₩5000 off first order, ask for rating",
          { channel: "delivery-ads", targetCount: 30 }),
        t("food-launch-4", "첫 주 단골 쿠폰 (다음 방문 10% off)", "Return-visit 10%-off stamp",
          "영수증에 인쇄 or 스탬프. 7일 내 재방문 시만 유효",
          "Print on receipt or stamp. Valid only for 7-day return",
          { targetCount: 15 }),
      ],
    },
    {
      id: "grow",
      name: { ko: "오픈 2~6주차 · 증식", en: "Week 2-6 · Multiplication" },
      customerRange: { from: 60, to: 100 },
      description: { ko: "단골 10명 = 리뷰 + 재방문 + 지인 데려오기", en: "10 regulars = reviews + return + referrals" },
      tactics: [
        t("food-grow-1", "블로그 체험단 3명 초청 (무료 제공 + 리뷰)", "Invite 3 blog reviewers (comp meal)",
          "팔로워 1000+ 음식 블로거 직접 DM. 주말 오후 방문 요청",
          "DM food bloggers with 1000+ followers. Ask for weekend visit",
          { channel: "blog-review", targetCount: 5 }),
        t("food-grow-2", "추천 코드 시스템 (친구 추천 시 양쪽 20% off)", "Referral code (both get 20% off)",
          "코드 발급. 친구 방문 시 양쪽 모두 20% 할인. 기존 고객 3명 → 9명",
          "Issue codes. Both get 20% off. Existing 3 → 9 customers",
          { targetCount: 15 }),
        t("food-grow-3", "네이버 예약 or 카카오톡 채널 연동", "Naver Booking or KakaoTalk Channel",
          "예약 고객 = 재방문율 2.5배. 채널 추가 시 쿠폰 1장 자동 발송",
          "Reservations = 2.5x return. Auto-coupon on channel add",
          { channel: "kakao", targetCount: 10 }),
        t("food-grow-4", "인플루언서 협업 1건 (팔로워 5000+)", "1 influencer collab (5000+ followers)",
          "지역 맛집 인플루언서 1명 초대. 콘텐츠 1개 + 스토리 3개",
          "Invite 1 local food influencer. 1 post + 3 stories",
          { channel: "instagram", targetCount: 20 }),
      ],
    },
  ],
};

// ── 카페/디저트 ──
const cafePlaybook: Playbook = {
  ...foodPlaybook,
  industryId: "cafe-dessert",
  targetDays: 45,
  phases: foodPlaybook.phases.map((p) => ({
    ...p,
    tactics: p.tactics.map((tac) => ({ ...tac, id: tac.id.replace("food-", "cafe-") })),
  })),
};

// ── 리테일 (오프라인 소매) ──
const retailPlaybook: Playbook = {
  industryId: "retail",
  targetDays: 75,
  phases: [
    {
      id: "pre-open",
      name: { ko: "오픈 전 · 인지 만들기", en: "Pre-open · Build awareness" },
      customerRange: { from: 0, to: 15 },
      description: { ko: "동네 유동인구 + 타깃 커뮤니티", en: "Local foot traffic + target community" },
      tactics: [
        t("retail-pre-1", "당근마켓 동네생활 노출", "Daangn neighborhood post",
          "상품 카테고리 + 오픈일 + 쿠폰. 주 3회 반복",
          "Category + open date + coupon. 3x per week",
          { channel: "daangn", targetCount: 10 }),
        t("retail-pre-2", "인스타 브랜드 무드 피드 9장", "Instagram mood board (9 posts)",
          "상품 단독이 아닌 라이프스타일 무드. 감성 중심",
          "Not just product shots—lifestyle mood. Aesthetic-first",
          { channel: "instagram", targetCount: 5 }),
        t("retail-pre-3", "네이버 키워드 검색 유입 (상품명 SEO)", "Naver keyword SEO for product names",
          "블로그 포스트 3개 + 상품 상세 설명. 장기 유입용",
          "3 blog posts + detailed listings. Long-term traffic",
          { channel: "naver-keyword" }),
      ],
    },
    {
      id: "launch",
      name: { ko: "오픈 2주 · 샘플링 + 할인", en: "Launch · Samples + discounts" },
      customerRange: { from: 15, to: 50 },
      description: { ko: "첫 구매 장벽을 낮추고 리뷰 확보", en: "Lower first-purchase barrier, collect reviews" },
      tactics: [
        t("retail-launch-1", "첫 구매 20% 할인 + 무료 배송", "First-order 20% off + free shipping",
          "쿠폰 코드 'FIRST20' 발행. 오픈 첫 14일만",
          "Code 'FIRST20'. First 14 days only",
          { targetCount: 25 }),
        t("retail-launch-2", "리뷰 작성 시 적립 5000원", "₩5000 reward for review",
          "사진 리뷰 필수. 네이버 스마트스토어 + 인스타 태그",
          "Photo review required. Naver Smart Store + Instagram tag",
          { targetCount: 15 }),
        t("retail-launch-3", "체험단 10명 모집 (무료 제공)", "Recruit 10 sampling testers (free)",
          "모집 조건: 팔로워 500+ / 리뷰 1개 + 스토리 3개 의무",
          "Requirement: 500+ followers, 1 review + 3 stories",
          { channel: "blog-review", targetCount: 10 }),
      ],
    },
    {
      id: "grow",
      name: { ko: "오픈 3~10주차 · 재구매", en: "Week 3-10 · Repeat buyers" },
      customerRange: { from: 50, to: 100 },
      description: { ko: "단골 구매자 10명 = 다음 신상품 자동 구매", en: "10 repeat buyers = automatic next-product sales" },
      tactics: [
        t("retail-grow-1", "카카오톡 채널 + 신상품 알림", "KakaoTalk Channel + new product alerts",
          "채널 추가 시 쿠폰 5000원. 신상품 출시 시 푸시",
          "₩5000 coupon on add. Push on new product launch",
          { channel: "kakao", targetCount: 20 }),
        t("retail-grow-2", "재구매 고객 추천 코드 시스템", "Repeat customer referral codes",
          "2회 구매 고객에게 고유 코드 발급. 친구 구매 시 양쪽 쿠폰",
          "Issue code to 2x buyers. Friend buys = both get coupon",
          { targetCount: 20 }),
        t("retail-grow-3", "인스타 유료 광고 소액 테스트 (5만원)", "Meta Ads small-budget test (₩50k)",
          "타깃: 지역 + 관심사. 3개 크리에이티브 A/B 테스트",
          "Target: region + interest. A/B test 3 creatives",
          { channel: "meta-ads", targetCount: 15 }),
      ],
    },
  ],
};

// ── 뷰티 ──
const beautyPlaybook: Playbook = {
  industryId: "beauty",
  targetDays: 60,
  phases: [
    {
      id: "pre-open",
      name: { ko: "오픈 전 · 예약 시스템 + 포트폴리오", en: "Pre-open · Booking + portfolio" },
      customerRange: { from: 0, to: 15 },
      description: { ko: "사진 중심 업종 — 비포/애프터 포트폴리오가 전부", en: "Photo-first — before/after portfolio is everything" },
      tactics: [
        t("beauty-pre-1", "네이버 예약 연동 (필수)", "Set up Naver Booking (must)",
          "예약 안 받으면 고객 이탈. 네이버 플레이스 + 예약 동시 설정",
          "No booking = customer loss. Naver Place + Booking together",
          { channel: "naver-place", targetCount: 5 }),
        t("beauty-pre-2", "인스타 비포/애프터 9개", "9 Instagram before/after posts",
          "모델 섭외 어려우면 지인 무료 시술 + 동의 후 게시",
          "No model? Free service on friends with consent before posting",
          { channel: "instagram", targetCount: 8 }),
        t("beauty-pre-3", "블로그 체험단 3명 사전 섭외", "Pre-recruit 3 blog reviewers",
          "오픈 일주일 내 후기 업로드 조건. 네이버 블로그 우선",
          "Must post within a week of open. Prefer Naver Blog",
          { channel: "blog-review", targetCount: 5 }),
      ],
    },
    {
      id: "launch",
      name: { ko: "오픈 2~3주 · 첫 시술 할인", en: "Launch · First-session discount" },
      customerRange: { from: 15, to: 50 },
      description: { ko: "첫 시술 장벽을 낮추고 재방문 유도", en: "Lower first-session barrier, drive rebookings" },
      tactics: [
        t("beauty-launch-1", "첫 방문 50% 할인 (대표 시술)", "First-visit 50% off (signature)",
          "대표 시술 1종만 할인. 다른 추가 시술은 정가",
          "Signature only. Other add-ons full price",
          { targetCount: 30 }),
        t("beauty-launch-2", "5회 쿠폰제 선결제 (10% 할인)", "5-visit prepaid pass (10% off)",
          "첫 방문 만족 시 즉시 권유. 현금 흐름 + 충성도",
          "Offer at end of first visit. Cashflow + loyalty",
          { targetCount: 10 }),
        t("beauty-launch-3", "리뷰 + 사진 동의 시 다음 방문 무료 추가 서비스", "Review + photo consent = free add-on next visit",
          "아이브로우 / 마사지 5분 등 저비용 추가. 사진 DB 증식",
          "Cheap add-on (brows, 5-min massage). Grow photo DB",
          { targetCount: 15 }),
      ],
    },
    {
      id: "grow",
      name: { ko: "오픈 4~8주차 · 단골 시스템", en: "Week 4-8 · Loyalty system" },
      customerRange: { from: 50, to: 100 },
      description: { ko: "한 번 온 고객의 60%를 단골로", en: "60% of first visits become regulars" },
      tactics: [
        t("beauty-grow-1", "카톡 채널 + 다음 예약 리마인드", "KakaoTalk + rebooking reminder",
          "시술 후 4~6주 뒤 자동 리마인드. 재방문율 2배",
          "Auto-remind 4-6 weeks after. 2x rebooking rate",
          { channel: "kakao", targetCount: 30 }),
        t("beauty-grow-2", "지인 추천 시 양쪽 30% 할인", "Referral: 30% off both sides",
          "시술 마치며 직접 제안. 명함 카드 1장 제공",
          "Offer at end of session. Give 1 business card",
          { targetCount: 20 }),
      ],
    },
  ],
};

// ── 스타트업/테크 ──
const startupPlaybook: Playbook = {
  industryId: "startup-tech",
  targetDays: 30,
  phases: [
    {
      id: "pre-open",
      name: { ko: "출시 전 · 대기자 명단", en: "Pre-launch · Waitlist" },
      customerRange: { from: 0, to: 30 },
      description: { ko: "론칭 = 이벤트. 론칭일 전에 30명 대기자 확보", en: "Launch = event. 30 waitlist signups before day 0" },
      tactics: [
        t("startup-pre-1", "랜딩 페이지 + 이메일 대기자", "Landing page + email waitlist",
          "Notion / Framer / Typeform 중 택 1. 3일 내 배포",
          "Pick one: Notion / Framer / Typeform. Ship in 3 days",
          { targetCount: 20 }),
        t("startup-pre-2", "디스콰이엇 + 블라인드 소개글", "Post on Disquiet / Blind",
          "문제 정의 + 솔루션 + 대기자 링크. 댓글 DM 응답 필수",
          "Problem + solution + waitlist link. Reply to every DM",
          { targetCount: 15 }),
        t("startup-pre-3", "LinkedIn 1:1 DM 50명", "1:1 LinkedIn DM to 50 targets",
          "이상적 고객 페르소나 50명 직접 DM. 15% 응답 예상",
          "50 ICP candidates. ~15% reply rate",
          { targetCount: 8 }),
      ],
    },
    {
      id: "launch",
      name: { ko: "출시일 · Product Hunt + HN", en: "Launch day · Product Hunt + HN" },
      customerRange: { from: 30, to: 70 },
      description: { ko: "PH #1 목표 아니면 재출시 불가. 한 방에 몰빵", en: "Aim for PH #1 or no relaunch. All-in, one shot" },
      tactics: [
        t("startup-launch-1", "Product Hunt 출시 (화~목 00:01 PST)", "Product Hunt launch (Tue-Thu 00:01 PST)",
          "헌터 섭외 + 대기자 전원 알림 + 인플루언서 사전 세팅",
          "Arrange hunter + notify full waitlist + pre-brief influencers",
          { targetCount: 40 }),
        t("startup-launch-2", "Hacker News Show HN 글", "Show HN post",
          "기술 내용 중심. 설립 스토리 + 솔루션 + 댓글 적극 응답",
          "Technical content. Founder story + solution + engage comments",
          { targetCount: 20 }),
        t("startup-launch-3", "트위터/X 스레드 + 대기자 이메일", "Twitter/X thread + waitlist email",
          "3~5 트윗 스레드. 대기자에겐 24시간 얼리 액세스 링크",
          "3-5 tweet thread. Waitlist gets 24h early access link",
          { targetCount: 30 }),
      ],
    },
    {
      id: "grow",
      name: { ko: "출시 후 2~4주 · 첫 100명", en: "Week 2-4 · First 100" },
      customerRange: { from: 70, to: 100 },
      description: { ko: "Do things that don't scale — 한 명씩 온보딩", en: "Do things that don't scale — onboard one by one" },
      tactics: [
        t("startup-grow-1", "신규 가입자 전원 15분 1:1 콜", "15-min 1:1 call for every signup",
          "첫 100명 필수. 피드백 + 사용 사례 + 리텐션 시그널",
          "First 100 must. Feedback + use cases + retention signal",
          { targetCount: 30 }),
        t("startup-grow-2", "초대 코드 시스템 (친구 초대 시 양쪽 혜택)", "Referral codes (both sides benefit)",
          "Dropbox 방식. 1명 초대 = 1개월 무료 / 양쪽",
          "Dropbox-style. 1 referral = 1 month free / both sides",
          { targetCount: 20 }),
      ],
    },
  ],
};

// ── 온라인 ──
const onlinePlaybook: Playbook = {
  industryId: "online-digital",
  targetDays: 60,
  phases: [
    {
      id: "pre-open",
      name: { ko: "오픈 전 · SEO + 상세페이지", en: "Pre-open · SEO + listings" },
      customerRange: { from: 0, to: 10 },
      description: { ko: "검색 유입이 70%. 상품 상세 + 키워드가 전부", en: "70% search-driven. Listings + keywords = everything" },
      tactics: [
        t("online-pre-1", "네이버 스마트스토어 + 쿠팡 동시 등록", "Register Naver SmartStore + Coupang",
          "같은 상품 양쪽. 가격 동일 or 네이버 1% 할인",
          "Same SKU on both. Same price or 1% Naver discount",
          { channel: "naver-keyword", targetCount: 5 }),
        t("online-pre-2", "상품 키워드 SEO 3개 블로그 포스트", "3 keyword SEO blog posts",
          "타깃 키워드 3개 × 포스트 3개 = 9개. 월 1500단어+",
          "3 keywords × 3 posts = 9. 1500+ words/month",
          { channel: "naver-keyword" }),
      ],
    },
    {
      id: "launch",
      name: { ko: "오픈 첫 달 · 유료 광고 + 리뷰", en: "Launch · Paid ads + reviews" },
      customerRange: { from: 10, to: 40 },
      description: { ko: "리뷰 10개 확보 = 전환율 3배", en: "10 reviews = 3x conversion" },
      tactics: [
        t("online-launch-1", "쿠팡 파워업 광고 일 5천원 테스트", "Coupang PowerUp ads, ₩5k/day test",
          "상품 상위 노출. 7일 데이터 → 효율 확인 → 2배 증액",
          "Top listing ads. 7 days → check ROAS → 2x increase",
          { channel: "delivery-ads" }),
        t("online-launch-2", "체험단 20명 (무료 제공 + 리뷰 의무)", "20 free samples for reviews",
          "팔로워 500+ 또는 구매 이력 있는 고객만. 리뷰 7일 내 필수",
          "500+ followers or prior buyers only. Review within 7 days",
          { targetCount: 20 }),
      ],
    },
    {
      id: "grow",
      name: { ko: "2~8주차 · ROAS 최적화", en: "Week 2-8 · ROAS optimization" },
      customerRange: { from: 40, to: 100 },
      description: { ko: "광고 효율 잡으면 무한 확장 가능", en: "Nail ROAS and scale is unlimited" },
      tactics: [
        t("online-grow-1", "구매자 카카오 채널 추가 쿠폰", "Post-purchase Kakao coupon",
          "구매 완료 시 10% 쿠폰 자동 발송. 재구매율 2배",
          "Auto-send 10% coupon after purchase. 2x repeat rate",
          { channel: "kakao", targetCount: 30 }),
        t("online-grow-2", "Meta/구글 리타게팅 광고", "Meta + Google retargeting",
          "페이지 방문 / 장바구니 이탈자. CPC 저렴 + 전환율 높음",
          "Page visitors / cart abandoners. Low CPC + high CVR",
          { channel: "meta-ads", targetCount: 30 }),
      ],
    },
  ],
};

// ── 피트니스 ──
const fitnessPlaybook: Playbook = {
  industryId: "fitness",
  targetDays: 45,
  phases: [
    {
      id: "pre-open",
      name: { ko: "오픈 전 · 사전 예약", en: "Pre-open · Pre-registrations" },
      customerRange: { from: 0, to: 20 },
      description: { ko: "회원권 선결제 = 현금흐름 + 초기 멤버", en: "Prepaid passes = cashflow + initial members" },
      tactics: [
        t("fitness-pre-1", "오픈 기념 평생 요금 회원권 20매 한정", "Lifetime lock-in pass × 20 limited",
          "정가 대비 30% 할인. 오픈 후 가격 인상 확약",
          "30% off regular. Commit to price hike post-launch",
          { targetCount: 15 }),
        t("fitness-pre-2", "당근마켓 동네생활 사전 모집", "Daangn pre-recruit neighborhood",
          "30일 무료 체험 + 대기자 등록. 링크 없이 DM 요청",
          "30-day free trial + waitlist. Request DM, no link",
          { channel: "daangn", targetCount: 10 }),
        t("fitness-pre-3", "인스타 트레이너 프로필 강화", "Strong trainer profile on Instagram",
          "트레이너 스토리 + 전문성 + 결과 사진. 사람이 브랜드",
          "Trainer story + expertise + result photos. Person = brand",
          { channel: "instagram" }),
      ],
    },
    {
      id: "launch",
      name: { ko: "오픈 1~2주 · 체험권 폭격", en: "Launch · Free trial blitz" },
      customerRange: { from: 20, to: 60 },
      description: { ko: "7일 무료 → 회원 전환율 40%", en: "7-day free → 40% conversion to member" },
      tactics: [
        t("fitness-launch-1", "7일 무료 체험권 (100장)", "7-day free trial × 100",
          "조건: 신규 등록 + 카톡 채널 추가. 체험 후 3일 내 할인 제안",
          "New + Kakao channel add. Discount offer within 3 days",
          { targetCount: 40 }),
        t("fitness-launch-2", "친구 동반 시 양쪽 첫 달 30%", "Bring-a-friend: 30% off first month",
          "기존 1명 → 2명. 3달 진행 시 150% 효과",
          "1 → 2 members. 150% lift if run 3 months",
          { targetCount: 20 }),
      ],
    },
    {
      id: "grow",
      name: { ko: "3~6주차 · 커뮤니티", en: "Week 3-6 · Community" },
      customerRange: { from: 60, to: 100 },
      description: { ko: "챌린지 = 멤버 유지율 2.5배", en: "Challenges = 2.5x retention" },
      tactics: [
        t("fitness-grow-1", "4주 챌린지 이벤트 (10만원 상품)", "4-week challenge (₩100k prize)",
          "체중 감량 or 벤치 PR. SNS 참여자 전원 스토리 공유 의무",
          "Weight loss or bench PR. All participants post stories",
          { targetCount: 30 }),
      ],
    },
  ],
};

// 마스터 맵
const PLAYBOOKS: Record<string, Playbook> = {
  "food": foodPlaybook,
  "cafe-dessert": cafePlaybook,
  "retail": retailPlaybook,
  "beauty": beautyPlaybook,
  "pet": beautyPlaybook,                // 뷰티 형태 복제
  "fitness": fitnessPlaybook,
  "education": fitnessPlaybook,          // 멤버십 형태 복제
  "space": retailPlaybook,
  "online-digital": onlinePlaybook,
  "startup-tech": startupPlaybook,
  "living-service": retailPlaybook,
};

export function getPlaybook(industryId: string): Playbook {
  return PLAYBOOKS[industryId] ?? foodPlaybook;
}
