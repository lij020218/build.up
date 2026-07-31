/**
 * 인플루언서 협업 플레이 SSOT — 업종 × 강점 → 협업 방식 매칭 (2026-07-31 사장님 지시)
 *
 *  "미용실이면 이쁜 인플루언서한테 공짜로 머리 해주고 릴스에 나오게 하고,
 *   횟집이면 먹방 유튜버, 카페면 바리스타 인플루언서나 비주얼 인플루언서,
 *   가성비가 강점이면 가성비 찾아다니는 유튜버 — 이런 것들을 파악해야 해."
 *
 *  ── 근거 관행 (2026-07-31 조사 확인) ──
 *   · 미용실 시술 모델: 무료 시술 ↔ 릴스/피드 출연. 확립된 관행 (한국경제 2025-01
 *     "공짜로 예뻐지는데…2030 우르르", 모델나라·미장원 전용 모집 게시판 실재).
 *     ⚠️ 양방향 — 가게가 모집 공고를 올려도 되고, #머리모델·#시술모델 해시태그에
 *     지원자가 이미 모여 있다.
 *   · 먹방 유튜버 방문 협찬: "유튜버 맛집" 상당수가 협찬 집행 결과물 (업계 통설,
 *     협찬 표기 영상 다수). 식사 무료 + 소정 원고료가 기본형.
 *   · 가성비 니치: "3만원 가성비 횟집" 등 가성비 전문 콘텐츠 시장 실재.
 *
 *  ── 발굴 함정 (2026-07-31 실측) ──
 *   업종명 단독 검색("부산 미용실")은 **경쟁 업장들**이 나온다 — 인플루언서가 아니라.
 *   그래서 모든 검색 쿼리는 역할·콘텐츠 어휘(리뷰·크리에이터·먹방·모델·맛집…)를
 *   반드시 포함해야 하며, 가드 테스트가 이를 강제한다.
 *
 *  ── 정직성 경계 ──
 *   · 비용은 "협찬형(제품·서비스 제공) vs 원고료형(현금)" 2축 범위로만 — 두 시장의
 *     시세가 다르다 (나노: 협찬 1~10만 vs 피드 원고료 10~30만). 단일 숫자 단정 금지.
 *   · "광고 효과 보장" 같은 단정 문구 금지 — DM 템플릿 가드로 강제.
 *   · B2B SaaS 등 인스타 인플루언서 마케팅이 안 맞는 업종은 숨기지 말고
 *     "왜 아닌지 + 대신 뭘 할지"를 말한다 (비표시가 아니라 맞게 표시).
 */

/** 가게 강점 — 사장이 버튼으로 고른다 (앱이 추정하지 않는다) */
export type StoreStrength =
  | "value"       // 가성비
  | "visual"      // 비주얼·인테리어·플레이팅
  | "expertise"   // 전문성 (바리스타·요리사·시술 실력)
  | "new";        // 신메뉴·신상품·새 서비스

export const STORE_STRENGTH_LABEL: Record<StoreStrength, { ko: string; desc: string }> = {
  value: { ko: "가성비", desc: "가격 대비 양·질이 강점" },
  visual: { ko: "비주얼", desc: "사진·영상이 잘 나오는 공간·상품" },
  expertise: { ko: "전문성", desc: "실력·경력·전문 지식이 강점" },
  new: { ko: "신메뉴·신상", desc: "새로 나온 것을 알리고 싶을 때" },
};

/** 협업 방식 — 비용 구조가 다른 세 갈래 */
export type CollabType =
  | "barter"        // 협찬형: 서비스·제품 무료 제공이 대가의 전부 (나노·시술모델)
  | "barter-fee"    // 협찬 + 소정 원고료 (마이크로·먹방 방문)
  | "fee";          // 원고료형: 현금 지급 (큐레이션 계정 광고 게시물 등)

export const COLLAB_TYPE_LABEL: Record<CollabType, { ko: string; costKo: string }> = {
  barter: { ko: "협찬형", costKo: "서비스·제품 제공 (현금 0원~)" },
  "barter-fee": { ko: "협찬+원고료", costKo: "제공 + 건당 5~30만원대 협의" },
  fee: { ko: "원고료형", costKo: "건당 현금 — 팔로워 규모별 시세 참고" },
};

/**
 * 원고료형 시세 범위 (등급별) — 출처 2계열 병기.
 *  ⚠️ 연 1회 갱신 (세액공제 SSOT와 같은 관례). 값은 "범위"다 — 단일 숫자로 표시 금지.
 *  출처: 단가로 dangaro.com/ad-price/instagram (2026-07 표) · 태그바이 협찬 가이드
 */
export const INFLUENCER_FEE_RANGES: Array<{
  tier: string;
  followersKo: string;
  /** 협찬형 기준 (제품·서비스 제공 중심) */
  barterKo: string;
  /** 원고료형 피드 1건 기준 */
  feedFeeKo: string;
  /** 원고료형 릴스 1건 기준 */
  reelsFeeKo: string;
}> = [
  { tier: "nano", followersKo: "1만 미만", barterKo: "제공만으로 가능한 경우 다수 (원고료 시 1~10만)", feedFeeKo: "10~30만", reelsFeeKo: "15~40만" },
  { tier: "micro", followersKo: "1~5만", barterKo: "제공 + 5~30만 협의", feedFeeKo: "50~150만", reelsFeeKo: "75~200만" },
  { tier: "mid", followersKo: "5~10만", barterKo: "원고료 협의 필수", feedFeeKo: "100~300만", reelsFeeKo: "150~400만" },
  { tier: "macro", followersKo: "10~50만", barterKo: "원고료 협의 필수", feedFeeKo: "500~1,500만", reelsFeeKo: "750~2,000만" },
];

export const FEE_SOURCES_KO =
  "출처: 단가로(dangaro.com) 2026-07 단가표 · 태그바이 협찬 가이드. 실제 금액은 협의에 따라 크게 다릅니다.";

/** 팔로워 수 → 등급 키 (INFLUENCER_FEE_RANGES.tier) */
export function tierForFollowers(followers: number): string {
  if (followers < 10_000) return "nano";
  if (followers < 50_000) return "micro";
  if (followers < 100_000) return "mid";
  return "macro";
}

export type InfluencerPlay = {
  id: string;
  /** 사장님 눈에 보이는 이름 — 행동이 보이게 */
  titleKo: string;
  /** 이 플레이가 맞는 업종군 (industry-card-matrix 그룹 어휘) */
  industryGroups: string[];
  /** 이 강점일 때 특히 추천 (비면 해당 업종 공통) */
  strengths?: StoreStrength[];
  collabType: CollabType;
  /** 누구를 찾는가 — 사장님 언어로 */
  targetKo: string;
  /** 어떻게 돌아가는 관행인가 — 한 줄 근거 */
  practiceKo: string;
  /** 인스타 발굴 쿼리 (Google CSE, site:instagram.com 한정) — {region} 치환.
   *  ⚠️ 업종명 단독 금지 — 역할·콘텐츠 어휘 필수 (경쟁업체 함정, 가드 테스트가 강제) */
  instagramQueries: string[];
  /** 유튜브 발굴 쿼리 (YouTube Data API search) — {region} 치환 */
  youtubeQueries: string[];
  /** DM·메일 첫 제안 문안 — {가게명}·{지역} 치환. 단정·과장 금지 (가드) */
  dmTemplateKo: string;
};

/**
 * 협업 플레이 레지스트리.
 *  업종군 어휘 = industry-card-matrix / offering-kinds 와 동일 계열:
 *  food · cafe-dessert · beauty · fitness · pet · retail · ecommerce ·
 *  education · space · living-service
 */
export const INFLUENCER_PLAYS: InfluencerPlay[] = [
  // ── 외식 (food) ─────────────────────────────────────────────
  {
    id: "food-mukbang-visit",
    titleKo: "먹방·맛집 유튜버 방문 초대",
    industryGroups: ["food"],
    collabType: "barter-fee",
    targetKo: "먹방 유튜버, 지역 맛집 리뷰 크리에이터 (요리사 출신이면 신뢰도 가산)",
    practiceKo: "\"유튜버 맛집\" 상당수가 방문 협찬으로 만들어진다 — 식사 무료 + 소정 원고료가 기본형.",
    instagramQueries: ["{region} 맛집 리뷰 크리에이터", "{region} 먹방 인플루언서"],
    youtubeQueries: ["{region} 맛집 먹방", "{region} 맛집 브이로그"],
    dmTemplateKo:
      "안녕하세요, {지역}에서 {가게명}을 운영하는 사장입니다. 콘텐츠 잘 보고 있습니다. 저희 대표 메뉴를 대접하고 싶어 연락드렸어요. 편하신 날 오시면 식사는 저희가 준비하고, 소정의 원고료도 협의 가능합니다. 부담 없이 답장 주세요.",
  },
  {
    id: "food-value-creator",
    titleKo: "가성비 전문 크리에이터 공략",
    industryGroups: ["food", "cafe-dessert", "retail"],
    strengths: ["value"],
    collabType: "barter-fee",
    targetKo: "\"만원의 행복\"류 가성비 전문 유튜버·인스타 크리에이터",
    practiceKo: "\"3만원 가성비 횟집\" 같은 가성비 니치 콘텐츠 시장이 따로 있다 — 가격이 강점이면 이쪽이 적중률이 높다.",
    instagramQueries: ["{region} 가성비 맛집 리뷰", "가성비 맛집 크리에이터"],
    youtubeQueries: ["{region} 가성비 맛집", "가성비 먹방"],
    dmTemplateKo:
      "안녕하세요, {지역} {가게명} 사장입니다. 저희는 가격 대비 구성에 자신 있어 가성비 콘텐츠를 하시는 분께 꼭 보여드리고 싶습니다. 방문해 주시면 식사를 준비하겠습니다. 조건은 편하게 협의 주세요.",
  },
  {
    id: "food-local-curation",
    titleKo: "지역 맛집 계정에 소개 문의",
    industryGroups: ["food", "cafe-dessert"],
    collabType: "fee",
    targetKo: "지역 핫플·맛집 큐레이션 계정 (팔로워 수만~수십만, 프로필에 '협업 문의' 명시가 다수)",
    practiceKo: "지역 큐레이션 계정은 소개 게시물을 유료로 받는 것이 공공연한 운영 방식이다 — DM으로 단가표를 받는 구조.",
    instagramQueries: ["{region} 맛집", "{region} 핫플"],
    youtubeQueries: [],
    dmTemplateKo:
      "안녕하세요, {지역}에서 {가게명}을 운영하고 있습니다. 계정에서 소개 게시물 진행 시 비용과 조건이 궁금해 문의드립니다. 사진·정보는 저희가 준비해 드릴 수 있습니다.",
  },

  // ── 카페·디저트 (cafe-dessert) ──────────────────────────────
  {
    id: "cafe-visual-invite",
    titleKo: "비주얼 크리에이터 신메뉴 초대",
    industryGroups: ["cafe-dessert"],
    strengths: ["visual", "new"],
    collabType: "barter",
    targetKo: "카페 투어·감성 사진 크리에이터 (나노~마이크로가 참여율이 가장 높다)",
    practiceKo: "신메뉴·시그니처 무료 제공 ↔ 릴스·피드 1건. 나노는 제공만으로 성사되는 경우가 많다.",
    instagramQueries: ["{region} 카페 투어 크리에이터", "{region} 카페 리뷰 계정"],
    youtubeQueries: ["{region} 카페 브이로그"],
    dmTemplateKo:
      "안녕하세요, {지역} {가게명}입니다. 사진 톤이 저희 공간과 잘 어울려서 연락드렸어요. 신메뉴 나온 김에 초대하고 싶습니다 — 음료·디저트는 저희가 준비할게요. 편한 시간에 들러주시면 감사하겠습니다.",
  },
  {
    id: "cafe-barista-expert",
    titleKo: "바리스타·홈카페 전문 크리에이터 협업",
    industryGroups: ["cafe-dessert"],
    strengths: ["expertise"],
    collabType: "barter-fee",
    targetKo: "바리스타 출신·홈카페·원두 리뷰 크리에이터 — 커피 자체가 강점일 때",
    practiceKo: "전문 크리에이터의 방문 리뷰는 \"맛집\"이 아니라 \"실력\"으로 소개돼 단골 유입 질이 다르다.",
    instagramQueries: ["바리스타 크리에이터", "원두 리뷰 홈카페"],
    youtubeQueries: ["카페 원두 리뷰", "바리스타 브이로그"],
    dmTemplateKo:
      "안녕하세요, {지역} {가게명}입니다. 저희가 직접 로스팅/추출에 공을 들이고 있어, 커피를 아는 분께 평가받고 싶어 연락드렸습니다. 방문해 주시면 준비된 원두들 편하게 드셔보실 수 있게 하겠습니다.",
  },

  // ── 뷰티 (beauty) ───────────────────────────────────────────
  {
    id: "beauty-model-play",
    titleKo: "시술 모델 플레이 — 무료 시술 ↔ 릴스 출연",
    industryGroups: ["beauty"],
    collabType: "barter",
    targetKo: "머리 모델을 찾는 인플루언서·지망생 (양방향: 우리가 공고를 올려도 되고, #머리모델 해시태그에 지원자가 이미 있다)",
    practiceKo: "무료 시술 ↔ 콘텐츠 출연은 확립된 관행 (한국경제 2025-01 보도). 커트 무료 + 시술은 약값만 받는 식의 변형도 흔하다.",
    instagramQueries: ["머리모델 {region}", "시술모델 모집", "{region} 뷰티 크리에이터"],
    youtubeQueries: [],
    dmTemplateKo:
      "안녕하세요, {지역} {가게명} 디자이너입니다. 피드 분위기가 좋아서 연락드렸어요. 원하시는 스타일로 시술을 무료로 해드리고, 결과가 마음에 드시면 릴스나 피드에 자연스럽게 남겨주시는 협업을 제안드립니다. 스타일 상담부터 편하게 해봐요.",
  },
  {
    id: "beauty-local-hotple",
    titleKo: "지역 핫플 계정에 소개 문의",
    industryGroups: ["beauty", "fitness", "space"],
    collabType: "fee",
    targetKo: "지역 핫플·정보 큐레이션 계정 — 맛집만 다루지 않고 미용실·운동·공간도 유료 소개를 받는다",
    practiceKo: "지역 계정의 소개 게시물은 업종을 가리지 않는 유료 상품이다 — 문의 DM으로 단가를 받는 구조.",
    instagramQueries: ["{region} 핫플", "{region} 추천 계정"],
    youtubeQueries: [],
    dmTemplateKo:
      "안녕하세요, {지역}에서 {가게명}을 운영하고 있습니다. 소개 게시물 진행 비용과 조건 문의드립니다. 시술/이용 장면 촬영 협조도 가능합니다.",
  },

  // ── 피트니스 (fitness) ──────────────────────────────────────
  {
    id: "fitness-creator-pass",
    titleKo: "운동 크리에이터 무료 이용권 협찬",
    industryGroups: ["fitness"],
    collabType: "barter",
    targetKo: "오운완·바디프로필·홈트 크리에이터 (지역 활동 여부는 프로필에서 확인)",
    practiceKo: "무료 이용권·PT 체험 ↔ 운동 브이로그·릴스. 시설 비주얼이 좋으면 촬영 장소로도 선호된다.",
    instagramQueries: ["{region} 운동 크리에이터", "오운완 인플루언서 {region}"],
    youtubeQueries: ["{region} 헬스장 브이로그", "운동 루틴 브이로그"],
    dmTemplateKo:
      "안녕하세요, {지역} {가게명}입니다. 운동 콘텐츠 잘 보고 있습니다. 저희 시설 자유이용권을 드리고 싶어요 — 촬영도 환영합니다. 부담 없이 이용해 보시고, 콘텐츠는 자연스럽게 결정해 주셔도 됩니다.",
  },

  // ── 펫 (pet) ────────────────────────────────────────────────
  {
    id: "pet-petfluencer",
    titleKo: "펫플루언서(반려동물 계정) 서비스 협찬",
    industryGroups: ["pet"],
    collabType: "barter",
    targetKo: "팔로워 있는 반려견·반려묘 계정 — 사람 인플루언서가 아니라 '동물 계정'이 핵심",
    practiceKo: "미용·호텔·용품 무료 제공 ↔ 반려동물 계정 피드 출연. 보호자 커뮤니티 파급력이 크다.",
    instagramQueries: ["반려견 인플루언서", "강아지 계정 {region}", "펫 용품 리뷰 계정"],
    youtubeQueries: ["강아지 브이로그", "펫 용품 리뷰"],
    dmTemplateKo:
      "안녕하세요, {지역} {가게명}입니다. 아이가 너무 귀여워서 팔로우하고 있었어요. 저희 서비스(미용/호텔)를 무료로 한번 경험시켜 드리고 싶습니다. 아이 컨디션에 맞춰 편한 날로 잡아요.",
  },

  // ── 소매·이커머스 (retail / ecommerce) ─────────────────────
  {
    id: "retail-seeding",
    titleKo: "제품 시딩 — 하울·언박싱 크리에이터에 제품 보내기",
    industryGroups: ["retail", "ecommerce"],
    collabType: "barter",
    targetKo: "하울·언박싱·카테고리 전문 리뷰 크리에이터 (내 상품 카테고리와 일치가 최우선)",
    practiceKo: "나노·마이크로에게 제품만 보내는 시딩은 이커머스 표준 전술 — 회수율을 높이려면 카테고리 일치가 팔로워 수보다 중요하다.",
    instagramQueries: ["하울 리뷰 크리에이터", "언박싱 인플루언서"],
    youtubeQueries: ["하울 언박싱", "제품 리뷰"],
    dmTemplateKo:
      "안녕하세요, {가게명}입니다. 올려주시는 리뷰 결이 저희 제품과 잘 맞아 보여 연락드렸어요. 부담 없이 써보시라고 제품을 보내드리고 싶습니다. 주소만 알려주시면 됩니다 — 리뷰 여부는 받아보신 뒤 편하게 정해주세요.",
  },
  {
    id: "ecommerce-groupbuy",
    titleKo: "공동구매(공구) 인플루언서 제휴",
    industryGroups: ["ecommerce"],
    strengths: ["value"],
    collabType: "fee",
    targetKo: "공구 진행 이력이 있는 인플루언서 — 팔로워 수보다 공구 이력·후기 확인이 우선",
    practiceKo: "공구는 판매 수수료(마진 셰어) 구조라 원고료보다 성과 연동에 가깝다 — 단가 협상 대신 수수료율 협의.",
    instagramQueries: ["공구 인플루언서", "공동구매 진행 계정"],
    youtubeQueries: [],
    dmTemplateKo:
      "안녕하세요, {가게명}입니다. 진행하신 공구들 잘 봤습니다. 저희 제품으로 공구 제휴가 가능할지 문의드려요 — 샘플 먼저 보내드리고, 조건(수수료율·최소수량)은 제안 주시는 기준으로 맞춰보겠습니다.",
  },

  // ── 공간 (space) ────────────────────────────────────────────
  {
    id: "space-shoot-location",
    titleKo: "촬영 장소 무료 제공 — 콘텐츠 배경 되기",
    industryGroups: ["space"],
    strengths: ["visual"],
    collabType: "barter",
    targetKo: "브이로그·화보·모임 콘텐츠 크리에이터 — 공간이 예쁘면 '장소 협찬' 수요가 이미 있다",
    practiceKo: "파티룸·스튜디오는 비수기 시간대 무료 제공 ↔ 위치 태그·소개가 정석 — 빈 시간의 기회비용이 0에 가깝다.",
    instagramQueries: ["{region} 촬영 장소 추천 계정", "파티룸 브이로그 크리에이터"],
    youtubeQueries: ["{region} 파티룸 브이로그", "모임 브이로그"],
    dmTemplateKo:
      "안녕하세요, {지역} 공간 {가게명}입니다. 콘텐츠 촬영 장소로 저희 공간을 무료로 열어드리고 싶어요 (평일 비는 시간대). 위치 태그만 남겨주시면 됩니다. 공간 사진 보내드릴게요.",
  },

  // ── 생활서비스 (living-service) ────────────────────────────
  {
    id: "living-before-after",
    titleKo: "비포·애프터 체험 콘텐츠 협업",
    industryGroups: ["living-service"],
    collabType: "barter",
    targetKo: "자취·리빙·살림 크리에이터 — 청소·정리·수리의 전후 변화가 콘텐츠 소재가 된다",
    practiceKo: "서비스 무료 제공 ↔ 전후 비교 릴스. 생활서비스는 '결과가 눈에 보이는' 업종이라 전환이 직관적이다.",
    instagramQueries: ["자취 브이로그 크리에이터", "리빙 살림 인플루언서"],
    youtubeQueries: ["자취방 청소 브이로그", "정리 수납 브이로그"],
    dmTemplateKo:
      "안녕하세요, {지역} {가게명}입니다. 콘텐츠 잘 보고 있어요. 저희 서비스를 무료로 한번 받아보시고, 전후 변화가 콘텐츠로 쓸 만하시면 자연스럽게 담아주시는 협업을 제안드립니다.",
  },

  // ── 교육 (education) ────────────────────────────────────────
  {
    id: "education-momfluencer",
    titleKo: "지역 학부모 인플루언서 체험 초대",
    industryGroups: ["education"],
    collabType: "barter",
    targetKo: "지역 육아·교육 콘텐츠 계정 (맘플루언서) — 학원 결정권자는 학부모다",
    practiceKo: "시범 수업·레벨테스트 무료 체험 ↔ 후기. 교육은 신뢰 기반이라 과장 없는 실후기가 오히려 강하다.",
    instagramQueries: ["{region} 육아 인플루언서", "{region} 초등맘 계정"],
    youtubeQueries: ["{region} 학원 후기 브이로그"],
    dmTemplateKo:
      "안녕하세요, {지역} {가게명}입니다. 아이 교육 콘텐츠 잘 보고 있습니다. 저희 시범 수업을 무료로 한번 경험해 보시고, 느끼신 그대로만 공유해 주시면 됩니다 — 좋은 말만 써달라는 조건은 없습니다.",
  },
];

/**
 * 인스타 인플루언서 마케팅이 맞지 않는 업종 — 숨기지 말고 이유+대안을 말한다.
 *  (offering-kinds "비표시가 아니라 맞게 표시" 원칙)
 */
export const INFLUENCER_NOT_FIT: Record<string, { reasonKo: string; insteadKo: string }> = {
  "online-digital": {
    reasonKo: "구매 결정이 인스타 감성이 아니라 기능·후기 검색으로 일어나는 업종이에요.",
    insteadKo: "유튜브 사용기·비교 리뷰 채널, 카테고리 커뮤니티가 더 맞습니다. (B2C 앱이라면 숏폼 데모는 유효)",
  },
  "startup-tech": {
    reasonKo: "B2B·테크 고객은 인스타 인플루언서로 움직이지 않아요.",
    insteadKo: "콘텐츠 마케팅·SEO·창업가 커뮤니티, B2C 앱이면 테크 리뷰 유튜버가 대안입니다.",
  },
};

/** 업종군에 맞는 플레이 — 강점 선택 시 해당 플레이를 앞으로 정렬 (제외가 아니라 정렬: 다른 플레이도 유효) */
export function playsForIndustry(group: string, strength?: StoreStrength | null): InfluencerPlay[] {
  const matched = INFLUENCER_PLAYS.filter((p) => p.industryGroups.includes(group));
  if (!strength) return matched;
  return [...matched].sort((a, b) => {
    const aHit = a.strengths?.includes(strength) ? 1 : 0;
    const bHit = b.strengths?.includes(strength) ? 1 : 0;
    return bHit - aHit;
  });
}

/** DM 문안 치환 */
export function fillDmTemplate(template: string, storeName: string, region: string): string {
  return template.replaceAll("{가게명}", storeName || "저희 가게").replaceAll("{지역}", region || "동네");
}

/** 검색 쿼리 치환 — region 없으면 지역 토큰 제거 후 정리 */
export function fillQuery(q: string, region: string): string {
  const filled = q.replaceAll("{region}", region ?? "").replace(/\s+/g, " ").trim();
  return filled;
}
