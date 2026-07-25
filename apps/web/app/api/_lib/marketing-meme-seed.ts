import type { MemeItem, MemePack } from "./marketing-memes";

/**
 * 밈 팩 시드 — 2026년 7월 4주(2026-W30) 기준 수동 큐레이션.
 *
 * 용도: ① 콜드 스타트(크론이 아직 못 돈 배포 직후) ② 수집 실패 주의 최종 폴백.
 * 서빙 폴백 체인: 이번 주 DB → 지난 주 DB(stale) → 이 시드(stale).
 *
 * ⚠️ 전 항목이 2026-07-24 세션에서 **원문을 직접 열어 검증**한 것만이다.
 *    (고구마팜 6월 밈 모음 / 6월 릴스 포맷 4가지 / 위픽레터 밈 아카이브 /
 *     캐릿 릴스 밈 모음 / maily 바이럴믹스 릴스 공식)
 *    항목을 갱신할 땐 같은 기준: 원문 확인 없이 추가 금지, 개사 금지.
 */

const GOGUMA_MEME_JUNE =
  "https://gogumafarm.kr/%EB%82%98-%EA%B3%A0%EA%B5%AC%EB%A7%88%ED%8C%9C%EC%9D%B8%EB%8D%B0-%EC%9A%94%EC%A6%98-%EB%9C%A8%EB%8A%94-%EB%B0%88-%EA%B0%80%EC%A0%B8%EC%99%94%EB%8B%A4-2026%EB%85%84-6%EC%9B%94-%EC%B5%9C%EC%8B%A0/";
const GOGUMA_MEME_LATEST =
  "https://gogumafarm.kr/%EB%94%94%EC%98%A4-%EC%A3%BC%EA%B0%84-%EB%8B%88%EA%B0%80-%EC%A2%8B%EC%95%84-%EC%A7%80%EA%B8%88-%EB%8B%B9%EC%9E%A5-%EC%8D%A8%EC%95%BC%ED%95%98%EB%8A%94-%EC%B5%9C%EC%8B%A0-%EC%9C%A0%ED%96%89-%EB%B0%88/";
const GOGUMA_REELS_FORMATS =
  "https://gogumafarm.kr/%EC%97%B0%EA%B8%B0-%EC%B1%8C%EB%A6%B0%EC%A7%80-%EC%A3%BC%EC%88%A0-%ED%9A%8C%EC%A0%84%EC%83%B7-%ED%94%BC%EB%93%9C%EB%A5%BC-%EC%A0%90%EB%A0%B9%ED%95%9C/";
const WEPICK_MEME_ARCHIVE = "https://letter.wepick.kr/post/23942";
const CAREET_REELS_MEMES = "https://www.careet.net/1929";
const VIRALMIX_REELS_FORMULA = "https://maily.so/viralmix/posts/2nznljgeop5";

export const MEME_SEED_WEEK_KEY = "2026-W30";

export const MEME_SEED_ITEMS: MemeItem[] = [
  {
    kind: "meme",
    title: "천연 위고비",
    originDesc:
      "의사 우창윤의 포만감 식단(계란·올리브오일)에서 시작해, 지금은 '맛있어서 과식을 막아주는 음식'에 붙이는 유행어로 확장된 밈.",
    originExample: "중식당 니뽕내뽕이 삶은 계란을 넣은 짬뽕에 '천연 위고비' 키워드를 적용",
    originUrl: GOGUMA_MEME_LATEST,
    sourceName: "고구마팜",
    publishedAt: "2026-06-23",
    industryFit: ["food", "cafe-dessert", "retail"],
    effortLabel: "문구 1개",
    applyHint: "사장님 메뉴 소개 문구에 적용해보세요",
  },
  {
    kind: "challenge",
    title: "'니가 좋아' 립싱크 챌린지",
    originDesc:
      "배우 오정세의 <와일드 씽> OST 솔로곡 뮤직비디오(조회수 251만)에서 나온 중독성 멜로디 립싱크 챌린지.",
    originExample: "이디야는 수박주스, 투썸플레이스는 아보카도 음료 홍보에 제품명을 가사에 자연스럽게 적용",
    originUrl: GOGUMA_MEME_LATEST,
    sourceName: "고구마팜",
    publishedAt: "2026-06-23",
    industryFit: ["food", "cafe-dessert", "beauty", "retail"],
    effortLabel: "15초",
    applyHint: "사장님 신메뉴·이벤트 알릴 때 적용해보세요",
  },
  {
    kind: "meme",
    title: "파라파라 춤 / 오이데~",
    originDesc:
      "리센느 미나미가 유튜브에서 무심한 표정으로 춘 파라파라 춤과 '오이데~' 외치기가 릴스·틱톡으로 확산된 밈.",
    originExample: "알바생이 '손님~ 오이데~' 텍스트와 함께 파라파라 춤 릴스를 올려 친근한 이미지 전달",
    originUrl: GOGUMA_MEME_LATEST,
    sourceName: "고구마팜",
    publishedAt: "2026-06-23",
    industryFit: ["food", "cafe-dessert", "beauty", "fitness", "retail"],
    effortLabel: "15초",
    applyHint: "사장님·직원이 등장하는 짧은 릴스로 적용해보세요",
  },
  {
    kind: "format",
    title: "오타쿠샷 (시그니처 소환)",
    originDesc:
      "애니메이션 장면 포즈를 따라 하면 물건이 마법처럼 나타나는 편집 포맷 — 시그니처 제품을 임팩트 있게 각인시키는 데 쓰인다.",
    originUrl: GOGUMA_REELS_FORMATS,
    sourceName: "고구마팜",
    publishedAt: "2026-06-02",
    industryFit: ["all"],
    effortLabel: "30초",
    applyHint: "사장님 가게의 시그니처 메뉴·상품 소환으로 적용해보세요",
  },
  {
    kind: "format",
    title: "연기 챌린지",
    originDesc:
      "'몇 살이야?' 같은 일상 문장을 화남·유혹 등 여러 감정으로 번갈아 연기하는 포맷. 예상 밖 연기가 터지는 게 포인트.",
    originExample: "브랜드명을 문장에 녹여 여러 감정으로 반복 표현하는 브랜드 계정 활용 사례",
    originUrl: GOGUMA_REELS_FORMATS,
    sourceName: "고구마팜",
    publishedAt: "2026-06-02",
    industryFit: ["all"],
    effortLabel: "30초",
    applyHint: "사장님 가게에서 자주 듣는 한 문장으로 적용해보세요",
  },
  {
    kind: "challenge",
    title: "간바레 챌린지",
    originDesc:
      "일본 음악가 @odamayonaise 의 '頑張りたい人へ' 음원에 맞춰 3분할 화면 여기저기에 등장하며 포즈를 취하는 챌린지. 아이돌 참여로 전 플랫폼 확산.",
    originUrl: WEPICK_MEME_ARCHIVE,
    sourceName: "위픽레터",
    // publishedAt 없음 — 아카이브형 글이라 발행일 미확인 (추정치 표시 금지)
    industryFit: ["all"],
    effortLabel: "30초",
    applyHint: "사장님 가게의 하루 일과 3장면으로 적용해보세요",
  },
  {
    kind: "meme",
    title: "백룸코어",
    originDesc:
      "익숙하면서 묘하게 오싹한 빈 공간(빈 복도·낡은 사무실) 감성의 비주얼 밈. 맥도날드가 프로모션 이미지에 활용.",
    originUrl: CAREET_REELS_MEMES,
    sourceName: "캐릿",
    publishedAt: "2026-06-17",
    industryFit: ["space", "retail", "cafe-dessert"],
    effortLabel: "사진 1장",
    applyHint: "영업 전·마감 후 매장 공간 사진으로 적용해보세요",
  },
  {
    kind: "meme",
    title: "챗GPT 어화둥둥체",
    originDesc:
      "'GPT 말투 너무 열받는다'는 글이 1.4만 리포스트되며 퍼진 AI 말투 패러디 밈. IT·스타트업 판에서 특히 확산.",
    originUrl: WEPICK_MEME_ARCHIVE,
    sourceName: "위픽레터",
    // publishedAt 없음 — 발행일 미확인 (추정치 표시 금지)
    industryFit: ["startup-tech", "online-digital"],
    effortLabel: "글 1개",
    applyHint: "회사 계정 공지·채용 글 톤으로 적용해보세요",
  },
  {
    kind: "format",
    title: "명물 한 컷 3초 + 유행 음원",
    originDesc:
      "가게 명물 하나만 0.3초 안에 보여주는 3초 릴스 공식. 부산 전포 카페 릴스가 좋아요 96만·공유 38만 실측 — 릴스의 전환은 공유 버튼에서 나온다.",
    originUrl: VIRALMIX_REELS_FORMULA,
    sourceName: "바이럴 믹스",
    // publishedAt 없음 — 발행일 미확인 (추정치 표시 금지)
    industryFit: ["food", "cafe-dessert", "retail", "space"],
    effortLabel: "3초",
    applyHint: "사장님 가게의 '명물 한 컷'은 무엇인가요?",
  },
  {
    kind: "meme",
    title: "'나 ○○인데' 춤 밈",
    originDesc:
      "출생연도·직업을 소개한 뒤 반전 한 줄이 이어지는 춤 밈. 사장·직원이 직접 등장해 소비자와 가깝게 소통하는 포맷.",
    originExample: "'나 카페 알바생인데~ 팔 아프니까 신메뉴 먹지 마' 같은 가게 활용례가 원문에 소개됨",
    originUrl: GOGUMA_MEME_JUNE,
    sourceName: "고구마팜",
    publishedAt: "2026-06-10",
    industryFit: ["all"],
    effortLabel: "15초",
    applyHint: "사장님 가게 이야기로 적용해보세요",
  },
];

export const MEME_SEED_PACK: MemePack = {
  weekKey: MEME_SEED_WEEK_KEY,
  items: MEME_SEED_ITEMS,
  sources: [
    { name: "고구마팜 — 최신 유행 밈 모음 (2026-06-23)", url: GOGUMA_MEME_LATEST },
    { name: "고구마팜 — 피드를 점령한 릴스 포맷 4가지", url: GOGUMA_REELS_FORMATS },
    { name: "위픽레터 — 2026 트렌디한 밈 아카이브", url: WEPICK_MEME_ARCHIVE },
    { name: "캐릿 — 릴스에 써먹기 좋은 밈 모음", url: CAREET_REELS_MEMES },
    { name: "바이럴 믹스 — 터지는 가게 릴스의 공통점", url: VIRALMIX_REELS_FORMULA },
  ],
  generatedAt: "2026-07-24T00:00:00.000Z",
};
