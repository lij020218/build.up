/**
 * Interview Templates Library — 검증된 방법론 기반 사전 작성 인터뷰 질문 세트.
 *
 * 사장님이 AI 호출 없이 즉시 사용 가능 → AI 비용 절감 + 응답 속도 즉시.
 * AI 질문지 생성과 병행 운영 (사장님이 둘 중 선택).
 *
 * 출처 방법론:
 *   - Mom Test (Rob Fitzpatrick) — 의견 X, 과거 행동 ✓
 *   - Sean Ellis 40% Test (PMF) — "이 가게 없어지면 어떨 것 같으세요?"
 *   - Jobs-to-Be-Done (JTBD, Christensen) — 손님이 우리 제품을 "고용"하는 이유
 *   - Net Promoter Score (NPS) — 추천 의향 0~10점
 *   - Customer Satisfaction (CSAT)
 *   - YC Startup School Interview Guide
 *   - 한국 자영업자 페인 포인트 기반 자체 큐레이션
 */

export type InterviewTargetType = "regular" | "lapsed" | "new" | "potential";

export type InterviewTemplate = {
  /** 안정 ID (변경 금지) */
  id: string;
  /** 한글 라벨 — UI 노출 */
  labelKo: string;
  /** 영어 라벨 */
  labelEn: string;
  /** 어떤 대상 (단골/이탈/신규/잠재) 에 적합한지 — UI 필터링용 */
  target: InterviewTargetType;
  /** 한 줄 설명 — UI 카드 부제 */
  descriptionKo: string;
  descriptionEn: string;
  /** 출처 방법론 — UI 작은 배지 */
  source: "Mom Test" | "Sean Ellis (PMF)" | "JTBD" | "NPS" | "CSAT" | "YC" | "Found.One";
  /** 어떤 상황에 쓰면 좋은지 — UI tooltip / hint */
  whenToUseKo: string;
  whenToUseEn: string;
  /** 한국어 질문 (5~7개) */
  questionsKo: string[];
  /** 영어 질문 */
  questionsEn: string[];
};

export const INTERVIEW_TEMPLATES: InterviewTemplate[] = [
  // ─────────────────────────────────────────────────────────────────
  //  단골 (Regular) — 충성도·재방문 동기·NPS·확장
  // ─────────────────────────────────────────────────────────────────
  {
    id: "regular-loyalty-momtest",
    labelKo: "단골 충성도 진단 (Mom Test)",
    labelEn: "Regular Loyalty Diagnosis (Mom Test)",
    target: "regular",
    descriptionKo: "왜 우리 가게에 계속 오는지, 과거 행동으로 캐내기",
    descriptionEn: "Why they keep coming — through past behavior",
    source: "Mom Test",
    whenToUseKo: "단골 패턴 파악·메뉴 정리 결정·매장 운영 방향 점검 시.",
    whenToUseEn: "Understand regular patterns, menu rationalization, ops direction.",
    questionsKo: [
      "마지막으로 우리 가게 오신 게 언제예요?",
      "그 날 우리 가게 말고 어디 가실까 고민하셨어요?",
      "오늘 오기 전에 누구한테 우리 가게 얘기해 보신 적 있으세요?",
      "지난번에 오셨을 때 가장 기억에 남는 게 뭐였어요?",
      "혹시 우리 메뉴 중에 '아 이건 좀…' 했던 거 있어요?",
      "주변에 우리 가게 추천한 적 있어요? 어떤 분에게 했어요?",
    ],
    questionsEn: [
      "When was the last time you came here?",
      "That day, did you consider any other places before coming here?",
      "Have you mentioned our shop to anyone recently?",
      "What's the most memorable thing from your last visit?",
      "Was there anything on our menu where you thought 'hmm, this is…'?",
      "Have you ever recommended us to someone? Who?",
    ],
  },
  {
    id: "regular-nps",
    labelKo: "단골 NPS 추천 의향",
    labelEn: "Regular NPS Recommendation",
    target: "regular",
    descriptionKo: "0~10점 추천 점수 + 그 이유",
    descriptionEn: "0-10 recommendation score + why",
    source: "NPS",
    whenToUseKo: "월 1회 정기 측정·캠페인 효과 비교·서비스 개선 우선순위 결정.",
    whenToUseEn: "Monthly tracking, campaign comparison, prioritizing improvements.",
    questionsKo: [
      "우리 가게를 친구나 가족에게 추천하실 의향이 0~10점 중 몇 점인가요?",
      "그 점수를 주신 가장 큰 이유 한 가지를 알려주세요.",
      "1점이라도 더 받으려면 우리가 무엇을 바꿔야 할까요?",
      "최근 다른 곳에서 받았던 가장 좋은 서비스는 무엇이었나요?",
      "한 가지만 마법처럼 바꿀 수 있다면 무엇을 바꾸시겠어요?",
    ],
    questionsEn: [
      "On a scale of 0-10, how likely are you to recommend us to a friend?",
      "What's the main reason for that score?",
      "What would we need to change to earn one more point?",
      "What's the best service you've received from another place recently?",
      "If you could magically change one thing, what would it be?",
    ],
  },
  {
    id: "regular-jtbd",
    labelKo: "단골 JTBD (왜 우리를 '고용'하나)",
    labelEn: "Regular JTBD (Why they 'hire' us)",
    target: "regular",
    descriptionKo: "어떤 상황·목적·감정으로 우리를 선택하는지",
    descriptionEn: "Situation, purpose, emotion that drives the choice",
    source: "JTBD",
    whenToUseKo: "신메뉴 기획·가격 정책 변경·페르소나 명확화 시.",
    whenToUseEn: "New menu planning, pricing changes, persona clarification.",
    questionsKo: [
      "우리 가게에 오시는 날은 보통 어떤 날인가요? (예: 점심·퇴근·약속·혼자)",
      "그 시점에 우리 가게를 떠올리시는 결정적 이유는 무엇인가요?",
      "우리 대신 다른 어떤 옵션을 고려하셨나요? (다른 가게·집에서 만들기·배달)",
      "우리 가게에 오시면서 해결하고 싶은 게 무엇이었나요? (배고픔·기분전환·약속·당 충전)",
      "다녀가신 후에 어떤 기분이 들면 '잘 왔다' 싶으세요?",
    ],
    questionsEn: [
      "What kind of day do you usually visit us? (lunch, after-work, with friends, solo)",
      "At that moment, what makes you think of us specifically?",
      "What other options did you consider instead? (other shops, cooking, delivery)",
      "What were you trying to solve by coming here? (hunger, mood, meeting, sugar fix)",
      "What feeling after the visit makes you say 'I'm glad I came'?",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  이탈 단골 (Lapsed) — 왜 안 왔는지·복귀 가능성
  // ─────────────────────────────────────────────────────────────────
  {
    id: "lapsed-churn-diagnosis",
    labelKo: "이탈 단골 — 왜 발길을 끊었나",
    labelEn: "Lapsed Customer — Why they stopped coming",
    target: "lapsed",
    descriptionKo: "마지막 방문 ~ 이탈 원인 ~ 복귀 가능성",
    descriptionEn: "Last visit, churn cause, comeback potential",
    source: "Mom Test",
    whenToUseKo: "단골 재방문율 하락·매출 정체 원인 파악·이탈 패턴 발견 시.",
    whenToUseEn: "Retention drop, sales stagnation, churn pattern discovery.",
    questionsKo: [
      "마지막으로 우리 가게 오신 게 언제쯤이세요?",
      "그 이후로 우리 대신 어디를 가셨나요?",
      "그곳을 선택하신 가장 큰 이유는 무엇인가요?",
      "혹시 마지막 방문 때 불편하거나 실망스러운 게 있었나요?",
      "어떤 변화가 있다면 다시 와 보고 싶으실까요?",
      "지금 가장 자주 가시는 비슷한 가게는 어디예요?",
    ],
    questionsEn: [
      "When was your last visit to our shop?",
      "Since then, where have you been going instead?",
      "What's the main reason you chose that place?",
      "Was there anything inconvenient or disappointing on your last visit?",
      "What change would make you want to come back?",
      "What similar shop do you visit most often these days?",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  신규 (New) — 인지 채널·첫인상·재방문 의향
  // ─────────────────────────────────────────────────────────────────
  {
    id: "new-acquisition",
    labelKo: "신규 손님 — 어떻게 알고 오셨나",
    labelEn: "New Customer — How did you find us",
    target: "new",
    descriptionKo: "인지 채널 + 첫인상 + 재방문 결정 요인",
    descriptionEn: "Discovery channel, first impression, return likelihood",
    source: "Found.One",
    whenToUseKo: "광고 채널 ROI 검증·신규 유입 분석·온보딩 경험 점검 시.",
    whenToUseEn: "Ad channel ROI, new customer analysis, onboarding check.",
    questionsKo: [
      "우리 가게는 어떻게 알게 되셨어요? (지나가다·추천·SNS·검색·배달앱)",
      "구체적으로 어떤 글·사진·영상·말이 결정적이었나요?",
      "오늘 오기 전에 다른 어디를 더 살펴보셨어요?",
      "들어오시면서 '오 좋다' 또는 '음 별로네' 한 게 있었어요?",
      "오늘 경험 중에 다음에 다시 오게 만들 수 있는 게 있다면 무엇인가요?",
      "처음 오신 분께 한 가지만 추천한다면 어떤 메뉴/서비스가 좋을까요?",
    ],
    questionsEn: [
      "How did you find us? (walked by, recommendation, SNS, search, delivery app)",
      "Specifically, what post/photo/video/word convinced you?",
      "Did you check anywhere else before coming today?",
      "Walking in, was there anything that made you think 'oh nice' or 'hmm'?",
      "Out of today's experience, what could bring you back?",
      "If you'd recommend one menu/service to a first-timer, what would it be?",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  잠재 (Potential) — 길거리·SNS 인터뷰
  // ─────────────────────────────────────────────────────────────────
  {
    id: "potential-discovery",
    labelKo: "잠재 손님 — 왜 우리를 안 오시나",
    labelEn: "Potential Customer — Why you haven't visited",
    target: "potential",
    descriptionKo: "근처 거주·근무 + 비방문 사유 + 진입 장벽",
    descriptionEn: "Lives/works nearby + non-visit reason + barriers",
    source: "Mom Test",
    whenToUseKo: "신규 유입 채널 발굴·간판/입구 개선·메뉴/가격 진입 장벽 점검 시.",
    whenToUseEn: "Finding new acquisition channels, signage/entrance improvements, pricing barriers.",
    questionsKo: [
      "이 동네에 거주/근무하신 지 얼마나 되셨어요?",
      "혹시 우리 가게(상호)를 보거나 들어보신 적 있으세요?",
      "있으시다면 어떤 인상이었어요? 없으시다면 왜 그런 것 같으세요?",
      "이 근처에서 비슷한 곳에 가실 때 보통 어디로 가세요?",
      "우리가 어떤 모습이라면 한 번 와보고 싶으세요?",
      "이 동네에서 부족하다고 느끼는 가게/서비스가 있나요?",
    ],
    questionsEn: [
      "How long have you lived/worked in this area?",
      "Have you seen or heard of our shop?",
      "If yes, what was your impression? If no, why do you think?",
      "When you go to similar places nearby, where do you usually go?",
      "What would make you want to try us at least once?",
      "Is there any shop/service you feel is missing in this neighborhood?",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  PMF (Product-Market Fit) — Sean Ellis 40% Test
  // ─────────────────────────────────────────────────────────────────
  {
    id: "pmf-sean-ellis",
    labelKo: "Sean Ellis PMF 테스트 (40% 룰)",
    labelEn: "Sean Ellis PMF Test (40% Rule)",
    target: "regular",
    descriptionKo: "\"이 가게 없어지면 어떨 것 같으세요?\" + 핵심 가치 발견",
    descriptionEn: "\"How would you feel if this shop disappeared?\" + core value",
    source: "Sean Ellis (PMF)",
    whenToUseKo: "사업 모델·메뉴 적합성 검증·페르소나 정확도 측정 시. 40%+ 가 'very disappointed' 면 PMF 도달.",
    whenToUseEn: "Validate business model fit, persona accuracy. 40%+ \"very disappointed\" = PMF reached.",
    questionsKo: [
      "내일부터 이 가게가 없어진다면 어떤 기분이 드실까요? (① 매우 아쉽다 ② 약간 아쉽다 ③ 별로 안 아쉽다 ④ 안 가도 됨)",
      "왜 그렇게 느끼세요? 한 문장으로 설명해 주세요.",
      "이 가게를 가장 잘 활용할 사람은 어떤 사람일까요?",
      "이 가게 없으면 대신 어디로 가실 것 같으세요?",
      "이 가게의 어떤 점이 가장 큰 가치라고 느끼세요?",
      "친구한테 이 가게를 한 줄로 설명한다면 어떻게 말씀하시겠어요?",
    ],
    questionsEn: [
      "How would you feel if this shop disappeared tomorrow? (1) Very disappointed (2) Somewhat (3) Not disappointed (4) N/A",
      "Why do you feel that way? One sentence please.",
      "Who do you think would benefit most from this shop?",
      "If we disappeared, where would you go instead?",
      "What feels like the greatest value of this shop?",
      "If you described this shop to a friend in one line, how would you say it?",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  신메뉴 검증 — 도입 전 시장 반응
  // ─────────────────────────────────────────────────────────────────
  {
    id: "new-menu-validation",
    labelKo: "신메뉴 검증",
    labelEn: "New Menu Validation",
    target: "regular",
    descriptionKo: "도입 전 구매 의향·가격 적정선·이름·페어링",
    descriptionEn: "Pre-launch interest, price, name, pairing",
    source: "Found.One",
    whenToUseKo: "신메뉴 출시 1~2주 전 단골에게 사전 검증.",
    whenToUseEn: "1-2 weeks before launching a new menu — validate with regulars.",
    questionsKo: [
      "최근에 다른 곳에서 비슷한 메뉴를 드셔본 적 있으세요? 어디서요?",
      "이 메뉴(설명/사진) 보시면 어떤 첫인상이세요?",
      "오시면 시켜드실 것 같으세요? 시키신다면 어떤 상황에서요?",
      "얼마면 망설임 없이 시키실 것 같으세요? 얼마면 비싸다고 느끼세요?",
      "메뉴 이름 후보 [A/B/C] 중 어떤 게 끌리세요? 그 이유는요?",
      "이 메뉴랑 같이 시키면 좋을 것 같은 메뉴가 있나요?",
    ],
    questionsEn: [
      "Have you tried something similar elsewhere recently? Where?",
      "Looking at this menu (description/photo), what's your first impression?",
      "Would you order it when you visit? In what situation?",
      "What price would you order without hesitation? What price feels expensive?",
      "Among name options [A/B/C], which appeals most? Why?",
      "What other menu item would pair well with this one?",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  가격 인상 검증
  // ─────────────────────────────────────────────────────────────────
  {
    id: "price-increase-validation",
    labelKo: "가격 인상 영향 검증",
    labelEn: "Price Increase Impact",
    target: "regular",
    descriptionKo: "인상 폭별 수용도 + 이탈 위험 + 가치 인식",
    descriptionEn: "Acceptance by hike level, churn risk, value perception",
    source: "Found.One",
    whenToUseKo: "재료비 상승·임대료 인상 → 가격 조정 결정 전 단골 의향 확인.",
    whenToUseEn: "Before pricing decisions due to cost pressures.",
    questionsKo: [
      "최근에 다른 가게에서 가격이 오른 걸 경험하셨어요? 어떻게 느끼셨나요?",
      "우리 메뉴 [X] 가 [현재 가격] 인데 [+500원/+1,000원/+2,000원] 오른다면 어떻게 하실 것 같으세요?",
      "어느 가격까지는 그냥 시키실 것 같고, 어느 가격부터는 망설이실 것 같아요?",
      "가격이 올라도 이 가게를 계속 오게 하는 결정적 이유는 무엇인가요?",
      "혹시 가격이 오르면 다른 어떤 메뉴/가게로 옮기실 것 같아요?",
    ],
    questionsEn: [
      "Have you experienced a price hike at another shop recently? How did you feel?",
      "Our [X] is currently [price]. If it goes up by [+500/+1k/+2k won], what would you do?",
      "Up to what price would you order without hesitation? When does it become 'too much'?",
      "What's the decisive reason you keep coming even if prices rise?",
      "If we raised prices, what other menu/shop might you switch to?",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  CSAT — 짧은 만족도 (응답 부담 최소)
  // ─────────────────────────────────────────────────────────────────
  {
    id: "csat-quick",
    labelKo: "빠른 만족도 (CSAT 5문항)",
    labelEn: "Quick Satisfaction (CSAT 5q)",
    target: "regular",
    descriptionKo: "30초 응답 — 핵심 만족도 5점 척도",
    descriptionEn: "30-sec answer — 5-point CSAT essentials",
    source: "CSAT",
    whenToUseKo: "운영 KPI 정기 트래킹·캠페인 후 효과 측정·일관 점수 비교 필요 시.",
    whenToUseEn: "Regular KPI tracking, post-campaign measurement, consistent scoring.",
    questionsKo: [
      "오늘 전반적인 만족도는? (1점 매우 불만족 ~ 5점 매우 만족)",
      "음식/서비스 품질은 어떠셨나요? (1~5)",
      "가격 대비 만족도는 어떠셨나요? (1~5)",
      "다음에도 다시 오실 의향이 있으세요? (1~5)",
      "한 가지만 개선해야 한다면 무엇이 좋을까요? (자유 응답)",
    ],
    questionsEn: [
      "Overall satisfaction today? (1 very dissatisfied ~ 5 very satisfied)",
      "Food/service quality? (1-5)",
      "Value for the price? (1-5)",
      "Likelihood to come back? (1-5)",
      "If you could improve one thing, what would it be? (open)",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  YC Style — 빠른 5문항 발견 인터뷰
  // ─────────────────────────────────────────────────────────────────
  {
    id: "yc-discovery",
    labelKo: "YC 스타일 발견 인터뷰 (5문항)",
    labelEn: "YC-Style Discovery (5q)",
    target: "potential",
    descriptionKo: "스타트업 인터뷰 클래식 5질문 — 사장님 버전",
    descriptionEn: "Classic YC discovery 5 questions — owner version",
    source: "YC",
    whenToUseKo: "신규 사업 검증·확장 결정 전·새 페르소나 발견 시.",
    whenToUseEn: "Validating new biz, before expansion, discovering new persona.",
    questionsKo: [
      "마지막으로 [우리 카테고리: 카페·식사·미용·세탁 등] 에서 가장 좋았던 경험을 말씀해 주세요.",
      "그때 어떤 부분이 가장 마음에 드셨어요?",
      "반대로 같은 카테고리에서 가장 짜증났던 경험은 무엇인가요?",
      "그 짜증을 해결하기 위해 지금 어떻게 하고 계세요?",
      "마법처럼 한 가지를 바꿀 수 있다면 무엇을 바꾸시겠어요?",
    ],
    questionsEn: [
      "Tell me about your best recent experience in [category: cafe, meal, beauty, laundry…]",
      "What part did you love most?",
      "Conversely, what was your worst experience in the same category?",
      "How do you work around that frustration today?",
      "If you could magically change one thing, what would it be?",
    ],
  },
];

/** ID → 템플릿 lookup */
export const INTERVIEW_TEMPLATES_BY_ID: Record<string, InterviewTemplate> =
  Object.fromEntries(INTERVIEW_TEMPLATES.map((t) => [t.id, t]));

/** 대상별 템플릿 필터 (UI 토글에 사용) */
export function getTemplatesByTarget(target: InterviewTargetType): InterviewTemplate[] {
  return INTERVIEW_TEMPLATES.filter((t) => t.target === target);
}
