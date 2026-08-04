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

export type CuratedInfluencerCategory = "food" | "cafe-dessert" | "beauty" | "fitness" | "space";

export type CuratedInfluencer = {
  platform: "instagram";
  name: string;
  /** @ 없이 저장 — 프로필 URL 은 influencerProfileUrl() 로 */
  handle: string;
  /** 사장님 제공 2026-08 기준 */
  followers: number;
  /** 활동 지역·영역 — 지역 연관 표시용 */
  regionKo: string;
  categoryId: CuratedInfluencerCategory;
  /** 공개 통계 페이지에서 확인된 참여율(%) — 출처 없으면 null */
  engagementRatePct: number | null;
  /** 참여율·팔로워 수치의 출처 — engagementRatePct 가 있으면 필수 */
  statsSourceUrl: string | null;
};

export function influencerProfileUrl(i: Pick<CuratedInfluencer, "handle">): string {
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
];

/** 업종별 큐레이션 — 없으면 빈 배열 (억지 매칭 금지, 발굴 도구가 담당) */
export function influencersForCategory(categoryId: string | null | undefined): CuratedInfluencer[] {
  if (!categoryId) return [];
  return INFLUENCER_DIRECTORY.filter((i) => i.categoryId === categoryId);
}
