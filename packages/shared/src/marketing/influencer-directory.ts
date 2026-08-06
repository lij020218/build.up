/**
 * 인플루언서 큐레이션 디렉토리 SSOT (2026-08-04, 사장님 제공 목록).
 *
 *  ▸ followers: 2026-08-05 인스타 프로필 실측(에이전트 직접 확인) — 확인 실패 계정만 사장님 제공값. engagementRatePct: 공개 통계 페이지에서
 *    확인된 것만(출처 필수) — 없으면 null → UI 는 "—". 추정·위조 금지.
 *  ▸ checkedAt 을 화면에 반드시 표기 ("2026-08 조회 기준") — 팔로워·참여율은 부패가
 *    빠른 숫자다. 분기 1회 갱신 (프랜차이즈 officialStats 관례).
 *  ▸ 목록에 없는 업종은 억지로 채우지 않는다 — 발굴 도구(influencer-plays)가 담당.
 *  ▸ 협업 제안(DM)·비용 안내는 influencer-plays.ts 의 템플릿·시세표와 결합해 쓴다.
 */

export const INFLUENCER_DIRECTORY_CHECKED_AT = "2026-08";

export type CuratedInfluencerCategory =
  | "food" | "cafe-dessert" | "beauty" | "fitness" | "space"
  | "pet" | "retail" | "education" | "travel" | "fashion";

export type CuratedInfluencer = {
  platform: "instagram" | "youtube";
  name: string;
  /** @ 없이 저장 — 프로필 URL 은 influencerProfileUrl() 로 */
  handle: string;
  /** 인스타=팔로워 · 유튜브=구독자 (조회 시점 실측) */
  followers: number;
  /** 활동 지역·영역 — 지역 연관 표시용 */
  regionKo: string;
  categoryId: CuratedInfluencerCategory;
  /** 공개 통계 페이지에서 확인된 참여율(%) — 출처 없으면 null (유튜브는 통계 페이지 부재로 대부분 null) */
  engagementRatePct: number | null;
  /** 참여율·팔로워 수치의 출처 — engagementRatePct 가 있으면 필수 */
  statsSourceUrl: string | null;
};

export function influencerProfileUrl(i: Pick<CuratedInfluencer, "handle" | "platform">): string {
  if (i.platform === "youtube") return `https://www.youtube.com/@${i.handle}`;
  return `https://instagram.com/${i.handle}`;
}

export const INFLUENCER_DIRECTORY: CuratedInfluencer[] = [
  // ── 외식 (food) ──
  { platform: "instagram", name: "라이현", handle: "ry.hyun", followers: 61_885, regionKo: "서울·경기 맛집", categoryId: "food", engagementRatePct: 0.71, statsSourceUrl: "https://hypeauditor.com/instagram/ry.hyun/" },
  { platform: "instagram", name: "하비와이프", handle: "hobby_wife", followers: 57_312, regionKo: "대구 맛집·공간", categoryId: "food", engagementRatePct: 0.69, statsSourceUrl: "https://hypeauditor.com/instagram/hobby_wife/" },
  { platform: "instagram", name: "맛집발굴", handle: "matgool_", followers: 70_600, regionKo: "서울·경기·전국 맛집", categoryId: "food", engagementRatePct: 0.74, statsSourceUrl: "https://hypeauditor.com/instagram/matgool_/" },
  { platform: "instagram", name: "먹자규", handle: "mukjakyuu_", followers: 84_200, regionKo: "서울 맛집·핫플", categoryId: "food", engagementRatePct: 0.74, statsSourceUrl: "https://hypeauditor.com/instagram/mukjakyuu_/" },
  { platform: "instagram", name: "대한식구", handle: "daehansikgu", followers: 12_200, regionKo: "대구 맛집", categoryId: "food", engagementRatePct: 0.96, statsSourceUrl: "https://hypeauditor.com/instagram/daehansikgu/" },
  { platform: "instagram", name: "먹공주", handle: "mukgongzu", followers: 78_000, regionKo: "대구 맛집·카페", categoryId: "food", engagementRatePct: 0.74, statsSourceUrl: "https://hypeauditor.com/instagram/mukgongzu/" },
  { platform: "instagram", name: "히희", handle: "hihee.e", followers: 62_500, regionKo: "서울·경기 맛집", categoryId: "food", engagementRatePct: 0.79, statsSourceUrl: "https://hypeauditor.com/instagram/hihee.e/" },
  { platform: "instagram", name: "Colin B", handle: "colin_beak", followers: 75_000, regionKo: "서울 식당·미식", categoryId: "food", engagementRatePct: 0.99, statsSourceUrl: "https://hypeauditor.com/instagram/colin_beak/" },
  { platform: "instagram", name: "하밥", handle: "ha.___.bab", followers: 42_900, regionKo: "대구·전국 맛집", categoryId: "food", engagementRatePct: 1.23, statsSourceUrl: "https://hypeauditor.com/instagram/ha.___.bab/" },
  { platform: "instagram", name: "키다리엘", handle: "tallman189_el", followers: 98_600, regionKo: "서울·전국 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },

  // ── 카페 (cafe-dessert) ──
  { platform: "instagram", name: "YUJIN", handle: "jini_coffee_", followers: 39_200, regionKo: "스페셜티 커피·디저트", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "또치", handle: "_ttochi__ct", followers: 21_881, regionKo: "대구 카페·맛집", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "카페, 어디까지 가봤니?", handle: "cafetour_insta", followers: 64_400, regionKo: "전국 카페 큐레이션", categoryId: "cafe-dessert", engagementRatePct: 0.92, statsSourceUrl: "https://hypeauditor.com/instagram/cafetour_insta/" },
  { platform: "instagram", name: "카페 투어 by Jimni", handle: "cafe___tour__", followers: 27_800, regionKo: "카페·공간·미식", categoryId: "cafe-dessert", engagementRatePct: 2.24, statsSourceUrl: "https://hypeauditor.com/instagram/cafe___tour__/" },
  { platform: "instagram", name: "이서", handle: "dear.yiseo", followers: 18_100, regionKo: "빵·디저트·카페", categoryId: "cafe-dessert", engagementRatePct: 2.02, statsSourceUrl: "https://hypeauditor.com/instagram/dear.yiseo/" },
  { platform: "instagram", name: "죠니", handle: "yamzonni", followers: 27_700, regionKo: "카페·빵·여행", categoryId: "cafe-dessert", engagementRatePct: 0.75, statsSourceUrl: "https://hypeauditor.com/instagram/yamzonni/" },
  { platform: "instagram", name: "카페탐험가 자잡토", handle: "zazabto", followers: 26_900, regionKo: "스페셜티 커피·브루잉", categoryId: "cafe-dessert", engagementRatePct: 6.84, statsSourceUrl: "https://hypeauditor.com/instagram/zazabto/" },
  { platform: "instagram", name: "이제이", handle: "ejej1215", followers: 28_100, regionKo: "대구 카페·맛집·팝업", categoryId: "cafe-dessert", engagementRatePct: 1.24, statsSourceUrl: "https://hypeauditor.com/instagram/ejej1215/" },
  { platform: "instagram", name: "임진", handle: "limszin", followers: 21_800, regionKo: "제주 카페·여행", categoryId: "cafe-dessert", engagementRatePct: 3.86, statsSourceUrl: "https://hypeauditor.com/instagram/limszin/" },
  { platform: "instagram", name: "May Yoon", handle: "yoonie_mei", followers: 43_300, regionKo: "제주·카페·라이프스타일", categoryId: "cafe-dessert", engagementRatePct: 1.62, statsSourceUrl: "https://hypeauditor.com/instagram/yoonie_mei/" },

  // ── 뷰티 (beauty) ──
  { platform: "instagram", name: "민가든", handle: "mingarden_", followers: 68_035, regionKo: "화장품·메이크업", categoryId: "beauty", engagementRatePct: 0.49, statsSourceUrl: "https://hypeauditor.com/instagram/mingarden_/" },
  { platform: "instagram", name: "채우", handle: "chaewooland", followers: 19_423, regionKo: "뷰티·스킨케어", categoryId: "beauty", engagementRatePct: 1.36, statsSourceUrl: "https://hypeauditor.com/instagram/chaewooland/" },
  { platform: "instagram", name: "Beauty Yeonny", handle: "yeonny0118", followers: 14_800, regionKo: "뷰티·자기관리", categoryId: "beauty", engagementRatePct: 2.14, statsSourceUrl: "https://hypeauditor.com/instagram/yeonny0118/" },
  { platform: "instagram", name: "카민", handle: "carmine.oi", followers: 76_400, regionKo: "메이크업·스킨케어", categoryId: "beauty", engagementRatePct: 1.45, statsSourceUrl: "https://hypeauditor.com/instagram/carmine.oi/" },
  { platform: "instagram", name: "하나보노", handle: "hanabono", followers: 34_900, regionKo: "지성 피부·화장품", categoryId: "beauty", engagementRatePct: 1.62, statsSourceUrl: "https://hypeauditor.com/instagram/hanabono/" },
  { platform: "instagram", name: "에꾸뜨 최다영", handle: "ecoute_dy", followers: 10_800, regionKo: "민감성 피부·K-뷰티", categoryId: "beauty", engagementRatePct: 4.49, statsSourceUrl: "https://hypeauditor.com/instagram/ecoute_dy/" },
  { platform: "instagram", name: "담쓰", handle: "damsluv", followers: 31_600, regionKo: "화장품·스킨케어", categoryId: "beauty", engagementRatePct: 2.14, statsSourceUrl: "https://hypeauditor.com/instagram/damsluv/" },
  { platform: "instagram", name: "콩슈니 김수진", handle: "sujin_ssu", followers: 36_200, regionKo: "메이크업·뷰티 교육", categoryId: "beauty", engagementRatePct: 1.72, statsSourceUrl: "https://hypeauditor.com/instagram/sujin_ssu/" },
  { platform: "instagram", name: "아랑", handle: "a_arang_", followers: 83_100, regionKo: "피부·화장품 리뷰", categoryId: "beauty", engagementRatePct: 0.56, statsSourceUrl: "https://hypeauditor.com/instagram/a_arang_/" },
  { platform: "instagram", name: "미백언니", handle: "jerry_ppo_", followers: 12_100, regionKo: "40대 피부·홈케어", categoryId: "beauty", engagementRatePct: 0.38, statsSourceUrl: "https://hypeauditor.com/instagram/jerry_ppo_/" },

  // ── 운동 (fitness) ──
  { platform: "instagram", name: "필라요나", handle: "_smile_whenever__", followers: 34_699, regionKo: "자세교정·홈트·필라테스", categoryId: "fitness", engagementRatePct: 0.37, statsSourceUrl: "https://instrack.app/instagram/_smile_whenever__" },
  { platform: "instagram", name: "김태희", handle: "taeheezzzzang", followers: 35_467, regionKo: "필라테스 교육", categoryId: "fitness", engagementRatePct: 0.9, statsSourceUrl: "https://instrack.app/instagram/taeheezzzzang" },
  { platform: "instagram", name: "다희", handle: "_daheeda", followers: 67_396, regionKo: "필라테스", categoryId: "fitness", engagementRatePct: 2.97, statsSourceUrl: "https://instrack.app/instagram/_daheeda" },
  { platform: "instagram", name: "한님쌤", handle: "hannim_ohh", followers: 34_255, regionKo: "필라테스", categoryId: "fitness", engagementRatePct: 0.47, statsSourceUrl: "https://instrack.app/instagram/hannim_ohh" },
  { platform: "instagram", name: "김연수", handle: "kim__ys2", followers: 10_592, regionKo: "필라테스·운동", categoryId: "fitness", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "유예주", handle: "zzu__l", followers: 28_575, regionKo: "물리치료·필라테스", categoryId: "fitness", engagementRatePct: 0.73, statsSourceUrl: "https://instrack.app/instagram/zzu__l" },
  { platform: "instagram", name: "정현주", handle: "ang_zzu", followers: 17_431, regionKo: "필라테스·라이프스타일", categoryId: "fitness", engagementRatePct: 0.93, statsSourceUrl: "https://app.notjustanalytics.com/analysis/ang_zzu" },
  { platform: "instagram", name: "헬인싸", handle: "better.song", followers: 46_000, regionKo: "헬스·트레이닝 정보", categoryId: "fitness", engagementRatePct: 0.2, statsSourceUrl: "https://thesocialcat.com/tools/instagram-engagement-rate-calculator" },
  { platform: "instagram", name: "김지영", handle: "kgym0215", followers: 15_480, regionKo: "여성 PT·피트니스", categoryId: "fitness", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "류세미", handle: "ryusemmm_", followers: 42_976, regionKo: "필라테스·바디프로필", categoryId: "fitness", engagementRatePct: 3.48, statsSourceUrl: "https://app.notjustanalytics.com/analysis/ryusemmm_" },

  // ── 숙박·여행 (space) ──
  { platform: "instagram", name: "권동우", handle: "travel_udon", followers: 23_186, regionKo: "국내외 여행", categoryId: "space", engagementRatePct: 1.74, statsSourceUrl: "https://hypeauditor.com/instagram/travel_udon/" },
  { platform: "instagram", name: "정빈", handle: "_jungkong", followers: 86_612, regionKo: "여행지·공간 큐레이션", categoryId: "space", engagementRatePct: 1.65, statsSourceUrl: "https://hypeauditor.com/instagram/_jungkong/" },
  { platform: "instagram", name: "주영이랑", handle: "juuuyomi_", followers: 14_000, regionKo: "로컬·소도시 여행", categoryId: "space", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "써니앤쎄이", handle: "binbin_bbb", followers: 52_165, regionKo: "커플 여행·숙박", categoryId: "space", engagementRatePct: 1.45, statsSourceUrl: "https://hypeauditor.com/instagram/binbin_bbb/" },
  { platform: "instagram", name: "다해", handle: "doitdhae", followers: 81_602, regionKo: "가성비 여행", categoryId: "space", engagementRatePct: 1.23, statsSourceUrl: "https://hypeauditor.com/instagram/doitdhae/" },
  { platform: "instagram", name: "밍구", handle: "min9ooram", followers: 19_200, regionKo: "국내외 여행", categoryId: "space", engagementRatePct: 1.71, statsSourceUrl: "https://hypeauditor.com/instagram/min9ooram/" },
  { platform: "instagram", name: "훈이트립", handle: "hoon2trip", followers: 83_100, regionKo: "여행 영상·숏폼", categoryId: "space", engagementRatePct: 1.46, statsSourceUrl: "https://hypeauditor.com/instagram/hoon2trip/" },
  { platform: "instagram", name: "찍길동", handle: "from___jin", followers: 72_500, regionKo: "국내 여행·꽃 명소", categoryId: "space", engagementRatePct: 1.48, statsSourceUrl: "https://hypeauditor.com/instagram/from___jin/" },
  { platform: "instagram", name: "류쁨", handle: "ryuppeum", followers: 41_600, regionKo: "국내외 여행", categoryId: "space", engagementRatePct: 0.98, statsSourceUrl: "https://hypeauditor.com/instagram/ryuppeum/" },
  { platform: "instagram", name: "Linda", handle: "mmmh_linda", followers: 20_000, regionKo: "거제 로컬·여행", categoryId: "space", engagementRatePct: null, statsSourceUrl: null },

  // ── 직접 발굴 (2026-08-05, 에이전트 실측 검증 — 실존·팔로워/구독자 확인) ──
  { platform: "instagram", name: "부산맛집여기", handle: "busan.food.here", followers: 306_200, regionKo: "부산 맛집", categoryId: "food", engagementRatePct: 0.43, statsSourceUrl: "https://hypeauditor.com/instagram/busan.food.here/" },
  { platform: "instagram", name: "햄지 맛집", handle: "hamzy_tasty", followers: 73_000, regionKo: "인천·서울 맛집", categoryId: "food", engagementRatePct: 2.24, statsSourceUrl: "https://hypeauditor.com/instagram/hamzy_tasty/" },
  { platform: "instagram", name: "대전맛집", handle: "taste.daejeon", followers: 193_600, regionKo: "대전 맛집", categoryId: "food", engagementRatePct: 2.15, statsSourceUrl: "https://hypeauditor.com/instagram/taste.daejeon/" },
  { platform: "instagram", name: "광주맛집 맛광인", handle: "matgwangin", followers: 37_600, regionKo: "광주 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "울산언니", handle: "ulsansisters", followers: 93_400, regionKo: "울산 맛집", categoryId: "food", engagementRatePct: 0.58, statsSourceUrl: "https://hypeauditor.com/instagram/ulsansisters/" },
  { platform: "instagram", name: "전주맛집 잇츠전주", handle: "eats.jeonju", followers: 24_200, regionKo: "전주 맛집", categoryId: "food", engagementRatePct: 0.74, statsSourceUrl: "https://hypeauditor.com/instagram/eats.jeonju/" },
  { platform: "instagram", name: "도민이의 제주맛집", handle: "matzip.asmr", followers: 197_600, regionKo: "제주 맛집", categoryId: "food", engagementRatePct: 0.43, statsSourceUrl: "https://hypeauditor.com/instagram/matzip.asmr/" },
  { platform: "instagram", name: "카페in부산", handle: "cafe.in.busan", followers: 11_000, regionKo: "부산 카페", categoryId: "cafe-dessert", engagementRatePct: 1.42, statsSourceUrl: "https://hypeauditor.com/instagram/cafe.in.busan/" },
  { platform: "instagram", name: "카페in인천부천", handle: "cafe.in.incheon", followers: 12_500, regionKo: "인천 카페", categoryId: "cafe-dessert", engagementRatePct: 1.2, statsSourceUrl: "https://hypeauditor.com/instagram/cafe.in.incheon/" },
  { platform: "instagram", name: "카페in대전", handle: "cafe.in.daejeon", followers: 13_900, regionKo: "대전 카페", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "카페in광주", handle: "cafe.in.gwangju", followers: 13_900, regionKo: "광주 카페", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "전주핫플", handle: "hotjeonju", followers: 36_300, regionKo: "전주 카페·맛집", categoryId: "cafe-dessert", engagementRatePct: 0.58, statsSourceUrl: "https://hypeauditor.com/instagram/hotjeonju/" },
  { platform: "instagram", name: "강릉핫플", handle: "hotgangneung", followers: 84_800, regionKo: "강릉 카페·맛집", categoryId: "cafe-dessert", engagementRatePct: 0.69, statsSourceUrl: "https://hypeauditor.com/instagram/hotgangneung/" },
  { platform: "instagram", name: "기우쌤", handle: "kiu_design_", followers: 441_000, regionKo: "헤어스타일·미용실", categoryId: "beauty", engagementRatePct: 0.95, statsSourceUrl: "https://hypeauditor.com/instagram/kiu_design_/" },
  { platform: "instagram", name: "진훤", handle: "_hwoniii", followers: 402_800, regionKo: "헤어스타일·뷰티", categoryId: "beauty", engagementRatePct: 1.9, statsSourceUrl: "https://hypeauditor.com/instagram/_hwoniii/" },
  { platform: "instagram", name: "유니스텔라 박은경", handle: "nail_unistella", followers: 694_700, regionKo: "네일아트", categoryId: "beauty", engagementRatePct: 5.81, statsSourceUrl: "https://hypeauditor.com/instagram/nail_unistella/" },
  { platform: "instagram", name: "심으뜸", handle: "euddeume_", followers: 821_400, regionKo: "헬스·피트니스", categoryId: "fitness", engagementRatePct: 0.86, statsSourceUrl: "https://hypeauditor.com/instagram/euddeume_/" },
  { platform: "instagram", name: "말왕", handle: "horseking123", followers: 525_700, regionKo: "헬스·운동", categoryId: "fitness", engagementRatePct: 1.59, statsSourceUrl: "https://hypeauditor.com/instagram/horseking123/" },
  { platform: "instagram", name: "핏블리 문석기", handle: "fitvely_moon", followers: 225_400, regionKo: "헬스·PT", categoryId: "fitness", engagementRatePct: 0.45, statsSourceUrl: "https://hypeauditor.com/instagram/fitvely_moon/" },
  { platform: "instagram", name: "고민정", handle: "go_mj_", followers: 88_800, regionKo: "크로스핏", categoryId: "fitness", engagementRatePct: 2.71, statsSourceUrl: "https://hypeauditor.com/instagram/go_mj_/" },

  // ── 유튜브 (2026-08-05 구독자 실측 — followers = 구독자) ──
  { platform: "youtube", name: "정육왕 MeatCreator", handle: "MeatCreator", followers: 814_000, regionKo: "전국 고기 맛집 방문 리뷰", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "떡볶퀸", handle: "tteokbokqueen", followers: 655_000, regionKo: "전국 떡볶이·분식 방문 리뷰", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "맛객리우", handle: "Liwoo_foodie", followers: 174_000, regionKo: "서울·수도권 가성비 맛집 리뷰", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "내복곰", handle: "nebokgom", followers: 904_000, regionKo: "디저트 카페 방문 브이로그", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "ondo온도", handle: "ondovlog", followers: 1_220_000, regionKo: "카페 운영·감성 브이로그 (협찬 문의 공개)", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "기우쌤", handle: "kiudesign", followers: 1_600_000, regionKo: "헤어 디자이너 (스타일링·복구)", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "민스코", handle: "minsco_", followers: 734_000, regionKo: "메이크업·화장품 리뷰", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "힙으뜸", handle: "euddeume", followers: 1_820_000, regionKo: "홈트·피트니스", categoryId: "fitness", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "빅씨스", handle: "BIGSIS", followers: 1_080_000, regionKo: "홈트·근력 운동", categoryId: "fitness", engagementRatePct: null, statsSourceUrl: null },
  { platform: "youtube", name: "원지의하루", handle: "im1G", followers: 930_000, regionKo: "여행 브이로그 (국내 다수)", categoryId: "space", engagementRatePct: null, statsSourceUrl: null },


  // ── 직접 발굴 2차 (2026-08-05 — 장르·확장 카테고리: 전국 외식·펫·리테일·교육·숙소·골프·요가) ──
  { platform: "instagram", name: "먹쩡 김현정", handle: "muk_jeong", followers: 212_700, regionKo: "부산·전국 맛집 리뷰", categoryId: "food", engagementRatePct: 0.69, statsSourceUrl: "https://hypeauditor.com/instagram/muk_jeong/" },
  { platform: "instagram", name: "요미", handle: "biteofyommy", followers: 148_900, regionKo: "서울·전국 맛집", categoryId: "food", engagementRatePct: 0.55, statsSourceUrl: "https://hypeauditor.com/instagram/biteofyommy/" },
  { platform: "instagram", name: "뽀 먹스타그램", handle: "bbo_muksta", followers: 211_400, regionKo: "전국 맛집", categoryId: "food", engagementRatePct: 0.94, statsSourceUrl: "https://hypeauditor.com/instagram/bbo_muksta/" },
  { platform: "instagram", name: "맛집정보특공대", handle: "bestgreedfood", followers: 98_000, regionKo: "전국 맛집 큐레이션", categoryId: "food", engagementRatePct: 17.73, statsSourceUrl: "https://hypeauditor.com/instagram/bestgreedfood/" },
  { platform: "instagram", name: "맛집탐방 먹스타그램", handle: "goodfood__________", followers: 12_000, regionKo: "전국 맛집탐방", categoryId: "food", engagementRatePct: 1.0, statsSourceUrl: "https://hypeauditor.com/instagram/goodfood__________/" },
  { platform: "instagram", name: "요리하는 남자", handle: "heon__l", followers: 13_700, regionKo: "맛집·요리 리뷰", categoryId: "food", engagementRatePct: 0.32, statsSourceUrl: "https://hypeauditor.com/instagram/heon__l/" },
  { platform: "instagram", name: "투데이 디저트", handle: "today_dessert", followers: 467_800, regionKo: "전국 디저트·카페 전문", categoryId: "cafe-dessert", engagementRatePct: 0.96, statsSourceUrl: "https://hypeauditor.com/instagram/today_dessert/" },
  { platform: "instagram", name: "카페 다녀왔습니다", handle: "go.cafe.tour", followers: 30_100, regionKo: "전국 감성 카페", categoryId: "cafe-dessert", engagementRatePct: 0.79, statsSourceUrl: "https://hypeauditor.com/instagram/go.cafe.tour/" },
  { platform: "instagram", name: "리샤", handle: "donaland.risha", followers: 15_700, regionKo: "고양이 집사 크리에이터", categoryId: "pet", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "강아지들의 공감사연", handle: "petsymphathystory", followers: 55_400, regionKo: "반려견 케어·사연", categoryId: "pet", engagementRatePct: 0.67, statsSourceUrl: "https://hypeauditor.com/instagram/petsymphathystory/" },
  { platform: "instagram", name: "하이앤헬로", handle: "hihellostagram", followers: 10_400, regionKo: "강아지 모델 (브랜드 협업 활발)", categoryId: "pet", engagementRatePct: 3.82, statsSourceUrl: "https://hypeauditor.com/instagram/hihellostagram/" },
  { platform: "instagram", name: "fly_yuna", handle: "fly_yuna", followers: 49_500, regionKo: "고양이·책 크리에이터", categoryId: "pet", engagementRatePct: 8.44, statsSourceUrl: "https://hypeauditor.com/instagram/fly_yuna/" },
  { platform: "instagram", name: "김찐빵", handle: "zzinnbbang_", followers: 63_000, regionKo: "고양이 계정", categoryId: "pet", engagementRatePct: 4.89, statsSourceUrl: "https://hypeauditor.com/instagram/zzinnbbang_/" },
  { platform: "instagram", name: "맘린", handle: "momlin_22", followers: 11_300, regionKo: "리빙 제품리뷰", categoryId: "retail", engagementRatePct: 2.49, statsSourceUrl: "https://hypeauditor.com/instagram/momlin_22/" },
  { platform: "instagram", name: "엘리사맘", handle: "elisa_mom_", followers: 47_300, regionKo: "리빙·홈스타일링·소품", categoryId: "retail", engagementRatePct: 28.2, statsSourceUrl: "https://hypeauditor.com/instagram/elisa_mom_/" },
  { platform: "instagram", name: "리빙크리에이터", handle: "livingcreat.or", followers: 73_900, regionKo: "살림·리빙템 리뷰", categoryId: "retail", engagementRatePct: 0.91, statsSourceUrl: "https://hypeauditor.com/instagram/livingcreat.or/" },
  { platform: "instagram", name: "엘리 희재맘", handle: "smy2166", followers: 75_400, regionKo: "뷰티·라이프·IT 제품 리뷰", categoryId: "retail", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "살림에 진심", handle: "salrim.100", followers: 67_900, regionKo: "살림팁·생활꿀템", categoryId: "retail", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "소을맘", handle: "zzu_ni", followers: 126_800, regionKo: "육아 인플루언서", categoryId: "education", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "배짱이", handle: "jin_dkyn", followers: 53_900, regionKo: "초등맘 교육·독서", categoryId: "education", engagementRatePct: 0.32, statsSourceUrl: "https://hypeauditor.com/instagram/jin_dkyn/" },
  { platform: "instagram", name: "메이미인", handle: "may__miin", followers: 10_800, regionKo: "육아·키즈모델", categoryId: "education", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "뚝딱이맘", handle: "ohdaeri", followers: 22_300, regionKo: "육아·여행·리빙", categoryId: "education", engagementRatePct: 2.04, statsSourceUrl: "https://hypeauditor.com/instagram/ohdaeri/" },
  { platform: "instagram", name: "사랑댁", handle: "peach0724s2", followers: 92_200, regionKo: "육아 키즈 (협찬 활발)", categoryId: "education", engagementRatePct: 1.85, statsSourceUrl: "https://hypeauditor.com/instagram/peach0724s2/" },
  { platform: "instagram", name: "민혜주", handle: "hyeju._.m", followers: 111_100, regionKo: "국내외 숙소 전문", categoryId: "space", engagementRatePct: 1.71, statsSourceUrl: "https://hypeauditor.com/instagram/hyeju._.m/" },
  { platform: "instagram", name: "감성여행", handle: "gamsungtravel", followers: 29_800, regionKo: "전국 감성숙소·여행지", categoryId: "space", engagementRatePct: 0.16, statsSourceUrl: "https://hypeauditor.com/instagram/gamsungtravel/" },
  { platform: "instagram", name: "뿜뿜", handle: "role_p1", followers: 16_100, regionKo: "피부관리·스킨케어 니치", categoryId: "beauty", engagementRatePct: 0.34, statsSourceUrl: "https://hypeauditor.com/instagram/role_p1/" },
  { platform: "instagram", name: "골쀼", handle: "golf_bbu", followers: 45_500, regionKo: "골프장·골프 라이프", categoryId: "fitness", engagementRatePct: 2.9, statsSourceUrl: "https://hypeauditor.com/instagram/golf_bbu/" },
  { platform: "instagram", name: "요가현아", handle: "yoga_hyuna", followers: 248_800, regionKo: "요가 강사·웰니스", categoryId: "fitness", engagementRatePct: 2.42, statsSourceUrl: "https://hypeauditor.com/instagram/yoga_hyuna/" },
  { platform: "instagram", name: "칼리", handle: "inno7373", followers: 33_600, regionKo: "골프·여행", categoryId: "fitness", engagementRatePct: null, statsSourceUrl: null },

  // ═══ 2026-08-07 사장님 제공 2차 목록 ═══
  //  팔로워: 목록 제공값 그대로(프로필 실측 전 — 분기 갱신 루틴에서 실측). ER: 미확보 → null (추정 금지).
  //  제외 2건: @kto9suk9suk(한국관광공사 공식 계정 — 소상공인 협찬 대상 아님) · @ireneisgood 중복행.

  // ── 외식 (food) — 2차 ──
  { platform: "instagram", name: "서울라이프", handle: "seoul_life___", followers: 212_000, regionKo: "서울 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "서울잇츠", handle: "seoul.eats_", followers: 204_000, regionKo: "서울 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "서울핫플", handle: "seoulhotple", followers: 518_000, regionKo: "서울 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "오늘뭐먹지", handle: "omuk.official", followers: 1_372_000, regionKo: "전국 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "동네부기", handle: "dongne_mukstagram", followers: 22_000, regionKo: "대구·경주·부산 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "대전맛집", handle: "daejeonfood.taste", followers: 57_000, regionKo: "대전 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "미식일기", handle: "mishik_diary", followers: 32_000, regionKo: "미식·레스토랑", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "서울푸드", handle: "seoul_foodie", followers: 76_000, regionKo: "서울 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "부산먹방", handle: "busanmukbang", followers: 29_000, regionKo: "부산 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "대전집", handle: "daejeon___food", followers: 175_000, regionKo: "대전 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "대전라이프", handle: "hungry_dj", followers: 88_000, regionKo: "대전 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "제주잇츠", handle: "jeju.eats", followers: 203_000, regionKo: "제주 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "제주에서 뭐 하지?", handle: "all.about.jeju", followers: 298_000, regionKo: "제주 맛집·여행", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "숙이네도시락", handle: "28insook", followers: 92_000, regionKo: "도시락·집밥", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Fume", handle: "fume_yamyam", followers: 441_000, regionKo: "먹방", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "쏘영", handle: "ssoyoung_mukbang", followers: 278_000, regionKo: "먹방", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "서애경 (에이스푸디)", handle: "acefoodie903", followers: 61_000, regionKo: "전국 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "키다리 아저씨", handle: "iam_gladiator", followers: 7_800, regionKo: "전국 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "재슐랭 가이드", handle: "food_writer_jw", followers: 174_000, regionKo: "서울·제주 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "먹자", handle: "mukja_muksta", followers: 103_000, regionKo: "서울·인천·경기·제주 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "미식맨", handle: "misikmann", followers: 77_000, regionKo: "맛집·카페·핫플", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "쏘아미", handle: "sso_yummy_", followers: 64_000, regionKo: "맛집·여행·핫플", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "호랑 큐레이터", handle: "horang_curator", followers: 197_000, regionKo: "맛집·팝업", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "훈남의 맛집투어", handle: "hoon_yummy", followers: 124_000, regionKo: "서울 맛집·디저트·술집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "밍푸디", handle: "ming_foodie_", followers: 131_000, regionKo: "서울 맛집·핫플", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "원잇", handle: "wanteat._eat", followers: 36_000, regionKo: "성수·서울 맛집·핫플", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "재선장", handle: "jack_foodie", followers: 145_000, regionKo: "서울·잠실·강남 맛집", categoryId: "food", engagementRatePct: null, statsSourceUrl: null },

  // ── 카페·디저트 (cafe-dessert) — 2차 ──
  { platform: "instagram", name: "카페플렉스", handle: "cafe.flex", followers: 4_100, regionKo: "카페", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "하란", handle: "for_nan2", followers: 2_300, regionKo: "신상카페", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "띵수", handle: "jin_s._.o", followers: 8_800, regionKo: "신상카페·디저트", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "미애픽", handle: "miae_pick", followers: 4_400, regionKo: "대구·경북 신상카페·맛집", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "미미", handle: "mimi_cafe.tour", followers: 8_700, regionKo: "전국 카페투어", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "디저트 교과서", handle: "dessert_entrance", followers: 80_000, regionKo: "디저트 전문", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "푸딩몽", handle: "pudding.mong", followers: 2_400, regionKo: "디저트 전문", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "은가람", handle: "eun__garam", followers: 42_000, regionKo: "카페투어·공간소개", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "빵푸디", handle: "bbang_pd00", followers: 1_900, regionKo: "빵·카페", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "진이찐", handle: "jini_zzin", followers: 51_000, regionKo: "디저트·카페", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "먹랩", handle: "muk_rap", followers: 121_000, regionKo: "디저트맛집·카페", categoryId: "cafe-dessert", engagementRatePct: null, statsSourceUrl: null },

  // ── 뷰티 (beauty) — 2차 ──
  { platform: "instagram", name: "미니", handle: "hyemin__09", followers: 67_000, regionKo: "스킨케어", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Dayun", handle: "da_yooni", followers: 44_000, regionKo: "메이크업", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Nathaniel Briner", handle: "nthanl", followers: 11_000, regionKo: "K-뷰티·스킨케어", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "유니님", handle: "yooni_mup", followers: 72_000, regionKo: "메이크업", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "롤링제이", handle: "rollingjay_onymakeup", followers: 75_000, regionKo: "메이크업", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "한솔", handle: "solmup", followers: 62_000, regionKo: "메이크업", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "로아", handle: "makeup_zeec", followers: 14_000, regionKo: "메이크업", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "정샛별", handle: "saetbyulthestar", followers: 4_300, regionKo: "뷰티 크리에이터", categoryId: "beauty", engagementRatePct: null, statsSourceUrl: null },

  // ── 여행 (travel — 신설: 숙박·공간 업종 매칭) ──
  { platform: "instagram", name: "Antje", handle: "nextstopkorea", followers: 117_000, regionKo: "국내여행·서울", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Amy Kim", handle: "korean.amykim", followers: 74_000, regionKo: "한국문화·여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Kyuho & Sarah", handle: "2hearts1seoul", followers: 42_000, regionKo: "서울·커플여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Hallie Bradley", handle: "thesoulofseoulblog", followers: 22_000, regionKo: "서울·국내여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Ploy", handle: "ployslittleatlas", followers: 17_000, regionKo: "서울·국내여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Sharen Hau", handle: "seoulfuldiaries", followers: 13_000, regionKo: "서울·여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "여행에미치다", handle: "yeomi.travel", followers: 1_504_000, regionKo: "국내·해외여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "여행톡톡", handle: "tour.toctoc", followers: 197_000, regionKo: "국내여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "여행친구", handle: "trip_friend_", followers: 1_900, regionKo: "여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "실버리", handle: "silvery_ooo", followers: 85_000, regionKo: "감성숙소·여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "캣블링", handle: "cat_veling", followers: 55_000, regionKo: "호캉스·여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "유경영", handle: "again_gangneung", followers: 32_000, regionKo: "강릉여행", categoryId: "travel", engagementRatePct: null, statsSourceUrl: null },

  // ── 패션 (fashion — 신설: 의류·잡화 소매 매칭) ──
  { platform: "instagram", name: "SUBIN", handle: "sub_b_", followers: 62_000, regionKo: "여성코디", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "윤슬", handle: "yunsle_style", followers: 37_000, regionKo: "미니멀룩", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "은비", handle: "eunbi.fit", followers: 31_000, regionKo: "캐주얼", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "나리", handle: "nari.ootd", followers: 28_000, regionKo: "데일리코디", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "서아", handle: "seoa.style", followers: 25_000, regionKo: "여성코디", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "김나영", handle: "nayoungkeem", followers: 865_000, regionKo: "여성패션·라이프스타일", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "차정원", handle: "ch_amii", followers: 2_040_000, regionKo: "여성패션·OOTD", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "기은세", handle: "kieunse", followers: 827_000, regionKo: "여성패션·럭셔리", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "한혜연", handle: "hhy6588", followers: 773_000, regionKo: "스타일링·패션", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "이사배", handle: "risabae_art", followers: 2_560_000, regionKo: "패션·뷰티", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "Irene Kim", handle: "ireneisgood", followers: 3_020_000, regionKo: "글로벌 패션", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "송해나", handle: "hena1108", followers: 1_120_000, regionKo: "여성패션", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "김진경", handle: "jinkyung3_3", followers: 447_000, regionKo: "모델·패션", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "깡스타일리스트", handle: "kkang.stylist", followers: 97_000, regionKo: "남성코디", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "빅사이즈 thisthat", handle: "thi_s_that", followers: 56_000, regionKo: "빅사이즈·데일리룩", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "바이린", handle: "by_rin_ootd", followers: 124_000, regionKo: "OOTD", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "김성길", handle: "s.geol_fashion", followers: 1_200, regionKo: "남자코디", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "데일리룩 코디추천", handle: "vividvogue_on", followers: 7_000, regionKo: "코디추천", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },
  { platform: "instagram", name: "이재훈", handle: "hoon_lo.ok", followers: 1_000, regionKo: "남친룩·미니멀룩", categoryId: "fashion", engagementRatePct: null, statsSourceUrl: null },

];

/** 업종별 큐레이션 — 없으면 빈 배열 (억지 매칭 금지, 발굴 도구가 담당) */
/**
 * 업종 → 디렉토리 카테고리 확장 매핑 (2026-08-07).
 *  travel·fashion 은 업종 id 가 아니라 *인플루언서 장르*다:
 *   · space(공간대여·숙박) 사장님에게는 공간 계정 + 여행 계정이 모두 유효
 *   · retail(소매) 사장님에게는 소매 계정 + 패션 계정이 모두 유효
 *  그 외 업종은 1:1. 억지 매칭 금지 원칙은 유지 — 매핑에 없으면 빈 배열.
 */
const CATEGORY_EXPANSION: Partial<Record<string, CuratedInfluencerCategory[]>> = {
  "space": ["space", "travel"],
  "retail": ["retail", "fashion"],
};

export function influencersForCategory(categoryId: string | null | undefined): CuratedInfluencer[] {
  if (!categoryId) return [];

  const cats = CATEGORY_EXPANSION[categoryId] ?? [categoryId as CuratedInfluencerCategory];
  return INFLUENCER_DIRECTORY.filter((i) => cats.includes(i.categoryId));
}
