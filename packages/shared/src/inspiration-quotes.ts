/**
 * inspiration-quotes.ts — "오늘의 영감" 명언 SSOT (2026-08-06)
 *
 * ── 왜 만들었나 ──────────────────────────────────────────────
 * iOS InspirationCard 가 Peter Drucker 로 표기된 문장 **하나**를 하드코딩해
 * 매일 같은 말만 보여줬다. 게다가 그 문장("가장 중요한 한 가지를 정하고…")은
 * Drucker 의 저작에서 확인되지 않는 출처 불명 인용이었다.
 *
 * ── 수록 기준 (가짜 인용 금지) ────────────────────────────────
 *  1. **1차 출처가 확인된 문장만** 넣는다 — 책(+쪽수)·공식 연설 원고·본인 에세이·
 *     공식 재단/기업 홈페이지. 인용구 모음 사이트(brainyquote 류)만 근거인 문장은 제외.
 *  2. 널리 퍼졌지만 **출처가 확인되지 않은 문장은 넣지 않는다.** 조사 중 제외한 예:
 *     · Edison "I have not failed. I've just found 10,000 ways that won't work"
 *       → Wikiquote **Disputed**. 1967년 잡지가 최초, 에디슨 본인 기록 없음.
 *     · Henry Ford "Whether you think you can or think you can't, you're right"
 *       → Ford 저작·인터뷰에 근거 없음.
 *     · Walt Disney "The way to get started is to quit talking and begin doing"
 *       → 출처 미확인.
 *     · Peter Drucker "Culture eats strategy for breakfast" → 본인 저작에 없음.
 *  3. `text` 는 한국어(번역), `original` 은 원문. 원문이 한국어면 original 생략.
 *     번역문만 보여주고 원문을 숨기면 검증이 불가능해지므로 둘 다 보관한다.
 *
 * ── 노출 범위 (웹·iOS 패리티 예외) ────────────────────────────
 * **현재는 iOS 전용이다** (2026-08-06 사장님 결정: "일단은 iOS에만 넣자").
 * 웹 대시보드에는 업종 특화 슬롯 자체가 없다 — lean-by-default 정리 때 제거됐고,
 * "카드 막추가 금지" 원칙이 있어 영감 카드를 웹에 새로 만들지 않았다.
 * → 패리티 감사에서 이 항목을 누락으로 잡지 말 것. 웹에 붙일 때는 이 SSOT 를 그대로 import 하면 된다.
 *
 * ⚠️ 수정 시 `npx tsx scripts/gen-inspiration-quotes-json.mts` 재실행
 *    (iOS 는 packages/shared/src/inspiration-quotes.json 심볼릭 링크를 읽는다).
 */

export type InspirationQuote = {
  id: string;
  /** 화면에 보여줄 한국어 문장 */
  text: string;
  /** 원문 (한국어 원문이면 생략) */
  original?: string;
  author: string;
  /** 출처 표기 (책·연설·에세이 + 연도) */
  source: string;
  /** 1차 출처 URL — 사장님이 직접 확인 가능해야 한다 */
  sourceUrl: string;
};

export const INSPIRATION_QUOTES: InspirationQuote[] = [
  // ── 시작·도전 ──────────────────────────────────────────────
  {
    id: "jobs-dots",
    text: "앞을 내다보며 점을 이을 수는 없습니다. 오직 뒤돌아볼 때만 이을 수 있습니다.",
    original: "You can't connect the dots looking forward; you can only connect them looking backwards.",
    author: "스티브 잡스",
    source: "스탠퍼드 졸업식 연설 (2005)",
    sourceUrl: "https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says",
  },
  {
    id: "jobs-work-life",
    text: "일은 인생의 큰 부분을 차지합니다. 진정으로 만족하는 유일한 방법은 스스로 훌륭하다고 믿는 일을 하는 것입니다.",
    original: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
    author: "스티브 잡스",
    source: "스탠퍼드 졸업식 연설 (2005)",
    sourceUrl: "https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says",
  },
  {
    id: "jobs-stay-hungry",
    text: "늘 갈망하고, 우직하게 나아가라.",
    original: "Stay Hungry. Stay Foolish.",
    author: "스티브 잡스",
    source: "스탠퍼드 졸업식 연설 (2005) — 본인이 «Whole Earth Catalog» 마지막 호에서 인용했다고 밝힘",
    sourceUrl: "https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says",
  },
  {
    id: "chung-tried",
    text: "이봐, 해보기나 했어?",
    author: "정주영 (현대 창업자)",
    source: "아산나눔재단이 소개하는 아산의 대표 어록",
    sourceUrl: "https://asan-nanum.org/blog/%EC%95%84%EC%82%B0%EB%82%98%EB%88%94%EC%9E%AC%EB%8B%A8/",
  },
  {
    id: "kay-invent-future",
    text: "미래를 예측하는 가장 좋은 방법은 미래를 발명하는 것이다.",
    original: "The best way to predict the future is to invent it.",
    author: "앨런 케이",
    source: "제록스 PARC 회의 (1971) — 본인이 1998년 이메일로 출처를 밝힘",
    sourceUrl: "https://quoteinvestigator.com/2012/09/27/invent-the-future/",
  },

  // ── 실패·끈기 ──────────────────────────────────────────────
  {
    id: "ford-failure-begin-again",
    text: "실패란 더 현명하게 다시 시작할 기회일 뿐이다. 정직한 실패는 부끄럽지 않다. 부끄러운 것은 실패를 두려워하는 마음이다.",
    original: "Failure is only the opportunity to more intelligently begin again. There is no disgrace in honest failure; there is disgrace in fearing to fail.",
    author: "헨리 포드",
    source: "«My Life and Work» (1922), 19–20쪽",
    sourceUrl: "https://en.wikiquote.org/wiki/Henry_Ford",
  },
  {
    id: "edison-gave-up",
    text: "인생에서 실패한 사람 중 다수는 포기할 때 자신이 성공에 얼마나 가까웠는지 몰랐던 사람들이다.",
    original: "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    author: "토머스 에디슨",
    source: "Wikiquote 수록 (Sourced)",
    sourceUrl: "https://en.wikiquote.org/wiki/Thomas_Edison",
  },
  {
    id: "edison-one-more-time",
    text: "우리의 가장 큰 약점은 포기하는 데 있다. 성공하는 가장 확실한 방법은 언제나 한 번만 더 해보는 것이다.",
    original: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.",
    author: "토머스 에디슨",
    source: "«Edison & Ford Quote Book» (2003)",
    sourceUrl: "https://en.wikiquote.org/wiki/Thomas_Edison",
  },
  {
    id: "edison-perspiration",
    text: "천재는 1퍼센트의 영감과 99퍼센트의 땀이다.",
    original: "Genius is one percent inspiration, ninety-nine percent perspiration.",
    author: "토머스 에디슨",
    source: "본인이 1927년 편지에서 자신의 말로 확인",
    sourceUrl: "https://en.wikiquote.org/wiki/Thomas_Edison",
  },
  {
    id: "edison-hustles",
    text: "기다리는 동안에도 부지런히 움직이는 사람에게 모든 것이 온다.",
    original: "Everything comes to him who hustles while he waits.",
    author: "토머스 에디슨",
    source: "«Thomas Alva Edison: Sixty Years of an Inventor's Life» (1908)",
    sourceUrl: "https://en.wikiquote.org/wiki/Thomas_Edison",
  },
  {
    id: "disney-impossible",
    text: "불가능한 일을 해내는 건 꽤 즐거운 일이다.",
    original: "It's kind of fun to do the impossible.",
    author: "월트 디즈니",
    source: "«Animated Architecture» (1982) 수록",
    sourceUrl: "https://en.wikiquote.org/wiki/Walt_Disney",
  },
  {
    id: "disney-courage",
    text: "리더십의 핵심 자질은 용기다. 어디에서 발휘되든 마찬가지다.",
    original: "Courage is the main quality of leadership, in my opinion, no matter where it is exercised.",
    author: "월트 디즈니",
    source: "«The Magic of Teamwork» (1997) 수록",
    sourceUrl: "https://en.wikiquote.org/wiki/Walt_Disney",
  },
  {
    id: "disney-curiosity",
    text: "우리는 계속 앞으로 나아가며 새 문을 열고 새로운 일을 한다. 호기심이 있기 때문이고, 그 호기심이 계속 새 길로 이끌기 때문이다.",
    original: "We keep moving forward, opening up new doors and doing new things, because we're curious… and curiosity keeps leading us down new paths.",
    author: "월트 디즈니",
    source: "«Meet the Robinsons» (2007) 엔딩 크레딧 인용",
    sourceUrl: "https://en.wikiquote.org/wiki/Walt_Disney",
  },
  {
    id: "disney-goals",
    text: "목표는 가능한 한 일찍 세우고, 거기 도달하는 데 자신의 모든 에너지와 재능을 쏟아야 한다.",
    original: "A person should set his goals as early as he can and devote all his energy and talent to getting there.",
    author: "월트 디즈니",
    source: "«Walt Disney, Magician of the Movies» (1966)",
    sourceUrl: "https://en.wikiquote.org/wiki/Walt_Disney",
  },

  // ── 고객·본질 ──────────────────────────────────────────────
  {
    id: "drucker-create-customer",
    text: "사업의 목적에 대한 타당한 정의는 오직 하나뿐이다 — 고객을 창조하는 것.",
    original: "There is only one valid definition of a business purpose: to create a customer.",
    author: "피터 드러커",
    source: "«The Practice of Management» (1954), 37쪽",
    sourceUrl: "https://en.wikiquote.org/wiki/Peter_Drucker",
  },
  {
    id: "drucker-profit-result",
    text: "이익은 원인이 아니라 결과다.",
    original: "Profit is not a cause but a result.",
    author: "피터 드러커",
    source: "«Management: Tasks, Responsibilities, Practices» (1973), 71쪽",
    sourceUrl: "https://en.wikiquote.org/wiki/Peter_Drucker",
  },
  {
    id: "drucker-defending-yesterday",
    text: "모든 경제 활동은 정의상 고위험이다. 어제를 지키는 것 — 즉 혁신하지 않는 것 — 이 내일을 만드는 것보다 훨씬 위험하다.",
    original: "All economic activity is by definition 'high risk.' And defending yesterday—that is, not innovating—is far more risky than making tomorrow.",
    author: "피터 드러커",
    source: "«Innovation and Entrepreneurship» (1985)",
    sourceUrl: "https://en.wikiquote.org/wiki/Peter_Drucker",
  },
  {
    id: "drucker-ideas-babies",
    text: "아이디어는 아기와 비슷하다. 작고, 미숙하고, 형체가 없는 채로 태어난다.",
    original: "Ideas are somewhat like babies--they are born small, immature, and shapeless.",
    author: "피터 드러커",
    source: "«The Frontiers of Management» (1986)",
    sourceUrl: "https://en.wikiquote.org/wiki/Peter_Drucker",
  },
  {
    id: "drucker-free-enterprise",
    text: "자유 기업은 기업에 이롭다는 이유로 정당화될 수 없다. 사회에 이롭다는 이유로만 정당화될 수 있다.",
    original: "Free enterprise cannot be justified as being good for business. It can be justified only as being good for society.",
    author: "피터 드러커",
    source: "«The Practice of Management» (1954), 41쪽",
    sourceUrl: "https://en.wikiquote.org/wiki/Peter_Drucker",
  },
  {
    id: "bezos-customer-first",
    text: "고객을 최우선에 두라. 발명하라. 그리고 인내하라.",
    original: "Put the customer first. Invent. And be patient.",
    author: "제프 베조스",
    source: "워싱턴포스트 인터뷰 (2013)",
    sourceUrl: "https://en.wikiquote.org/wiki/Jeff_Bezos",
  },
  {
    id: "bezos-divine-discontent",
    text: "그 거룩한 불만족은 고객을 관찰하고, 무엇이든 늘 더 나아질 수 있다는 걸 알아차리는 데서 온다.",
    original: "That kind of divine discontent comes from observing customers and noticing that things can always be better.",
    author: "제프 베조스",
    source: "인터뷰 (2013-09-17)",
    sourceUrl: "https://en.wikiquote.org/wiki/Jeff_Bezos",
  },
  {
    id: "bezos-flexible",
    text: "정말 좋은 아이디어라면 밀고 나가라. 다만 거기 도달하는 방법에는 유연해야 한다.",
    original: "If you have a really good idea, stick to it, but be flexible on how you get there.",
    author: "제프 베조스",
    source: "«The New Yorker» (2019-10-10)",
    sourceUrl: "https://en.wikiquote.org/wiki/Jeff_Bezos",
  },
  {
    id: "bezos-critics",
    text: "비판을 도무지 견딜 수 없다면, 새롭거나 흥미로운 일은 아무것도 하지 마라.",
    original: "If you absolutely can't tolerate critics, then don't do anything new or interesting.",
    author: "제프 베조스",
    source: "인터뷰 (2016-06)",
    sourceUrl: "https://en.wikiquote.org/wiki/Jeff_Bezos",
  },

  // ── 초기 고객·성장 ─────────────────────────────────────────
  {
    id: "pg-go-get-users",
    text: "사용자가 찾아오기를 기다릴 수 없다. 직접 나가서 데려와야 한다.",
    original: "You can't wait for users to come to you. You have to go out and get them.",
    author: "폴 그레이엄 (Y Combinator)",
    source: "에세이 «Do Things that Don't Scale» (2013)",
    sourceUrl: "https://paulgraham.com/ds.html",
  },
  {
    id: "pg-first-users",
    text: "첫 사용자들이 '가입하길 정말 잘했다'고 느끼게 만들어야 한다.",
    original: "Your first users should feel that signing up with you was one of the best choices they ever made.",
    author: "폴 그레이엄 (Y Combinator)",
    source: "에세이 «Do Things that Don't Scale» (2013)",
    sourceUrl: "https://paulgraham.com/ds.html",
  },
  {
    id: "pg-compound-growth",
    text: "사람들이 흔히 저지르는 실수는 복리 성장의 힘을 과소평가하는 것이다.",
    original: "The mistake they make is to underestimate the power of compound growth.",
    author: "폴 그레이엄 (Y Combinator)",
    source: "에세이 «Do Things that Don't Scale» (2013)",
    sourceUrl: "https://paulgraham.com/ds.html",
  },

  // ── 신용·사람 (한국) ───────────────────────────────────────
  {
    id: "yu-credit",
    text: "기업의 생명은 신용이다.",
    author: "유일한 (유한양행 창업자)",
    source: "유한양행 공식 홈페이지 «창업자 어록»",
    sourceUrl: "http://www.yuhan.co.kr/founder/founder_quotation.html",
  },
  {
    id: "yu-profit-sincerity",
    text: "기업의 제1목표는 이윤의 추구이다. 그러나 그것은 성실한 기업활동의 대가로 얻어야 하는 것이다.",
    author: "유일한 (유한양행 창업자)",
    source: "유한양행 공식 홈페이지 «창업자 어록»",
    sourceUrl: "http://www.yuhan.co.kr/founder/founder_quotation.html",
  },
  {
    id: "yu-people",
    text: "연마된 기술자와 훈련된 사원은 기업의 최대 자본이다.",
    author: "유일한 (유한양행 창업자)",
    source: "유한양행 공식 홈페이지 «창업자 어록»",
    sourceUrl: "http://www.yuhan.co.kr/founder/founder_quotation.html",
  },
  {
    id: "yu-not-alone",
    text: "기업은 한두 사람의 손에 의해서 발전되지 않는다. 여러 사람의 두뇌가 참여함으로써 비로소 발전되는 것이다.",
    author: "유일한 (유한양행 창업자)",
    source: "유한양행 공식 홈페이지 «창업자 어록»",
    sourceUrl: "http://www.yuhan.co.kr/founder/founder_quotation.html",
  },
  {
    id: "yu-honesty",
    text: "정직 — 이것이 유한의 영원한 전통이 되어야 한다.",
    author: "유일한 (유한양행 창업자)",
    source: "유한양행 공식 홈페이지 «창업자 어록»",
    sourceUrl: "http://www.yuhan.co.kr/founder/founder_quotation.html",
  },
  {
    id: "ford-subdivide",
    text: "작은 일로 나누면 특별히 어려운 일은 없다.",
    original: "Nothing is particularly hard if you subdivide it into small jobs.",
    author: "헨리 포드",
    source: "«Industrial Management» 인터뷰 (1927-10)",
    sourceUrl: "https://en.wikiquote.org/wiki/Henry_Ford",
  },
  {
    id: "ford-thinking",
    text: "생각하는 것은 세상에서 가장 힘든 일이다. 그래서 그 일을 하는 사람이 그토록 적은 것이리라.",
    original: "Thinking is the hardest work there is, which is the probable reason why so few engage in it.",
    author: "헨리 포드",
    source: "«The Forum» 인터뷰 (1928-04), 481쪽",
    sourceUrl: "https://en.wikiquote.org/wiki/Henry_Ford",
  },
];

/** KST 기준 날짜 → "그날의" 명언 (같은 날이면 웹·iOS 가 같은 문장). */
export function inspirationForDate(date: Date = new Date()): InspirationQuote {
  // KST(UTC+9) 자정 기준 일련번호 — 시간대에 따라 문장이 흔들리지 않게 고정.
  const kstMs = date.getTime() + 9 * 60 * 60 * 1000;
  const dayNumber = Math.floor(kstMs / 86_400_000);
  const idx = ((dayNumber % INSPIRATION_QUOTES.length) + INSPIRATION_QUOTES.length) % INSPIRATION_QUOTES.length;
  return INSPIRATION_QUOTES[idx];
}
