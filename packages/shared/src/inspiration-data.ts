// ⚠️ AUTO-GENERATED — 손으로 편집 금지.
//  소스(SSOT): apps/web/app/lib/components/FloatingInspiration.tsx 의 BRANDS 배열.
//  재생성: node /tmp/extract_brands.cjs (스크립트는 scripts/extract-inspiration-brands.cjs 로도 보관).
//
//  창업 성공 스타트업 카드 데이터 — 웹 FloatingInspiration + iOS FloatingInspirationView 공유.
//  iOS 는 동일 데이터를 packages/shared/src/inspiration-brands.json(심볼릭 링크)로 번들.

export type InspirationBrand = {
  name: string;
  tagline: string;
  color: string;
  iconSlug?: string;
  iconColor?: string;
  glyph: string;
  textColor?: string;
  /** 창업 시작 — "어떤 인사이트로 시작했는가" (모달 헤드) */
  origin: string;
  /** 핵심 차별점 — bullet 3개 */
  keys: string[];
  /** 사장님에게 주는 한 줄 교훈 */
  lesson: string;
  /** 창립 연도 + 본사 */
  founded: string;
};

export const inspirationBrands: InspirationBrand[] = [
  {
    "name": "토스",
    "tagline": "핀테크",
    "color": "#0064ff",
    "iconSlug": "toss",
    "iconColor": "ffffff",
    "glyph": "토",
    "founded": "2013 출시 · 비바리퍼블리카 (2011년 설립)",
    "origin": "이승건 — 서울대 치과 출신, 공중보건의 시절 사업 구상. 비바리퍼블리카 설립 후 '울라불라' '다보트' 등 8번 실패. 9번째 시도가 토스 (2013년 12월 실험 페이지).",
    "keys": [
      "공인인증서 시대에 '간편 송금' 단 하나에 집중 — 한 가지를 압도적으로 잘함",
      "출시 당시 시장 반응은 차가웠음 — '은행이 독점하는 일을 왜 스타트업이?'",
      "송금 → 인증·증권·은행·보험으로 슈퍼앱 확장 (수직 통합)"
    ],
    "lesson": "한 가지 명확한 불편을 극단적으로 잘 해결하면, 거기서 인접 시장으로 자연스럽게 확장된다."
  },
  {
    "name": "Notion",
    "tagline": "Productivity",
    "color": "#000000",
    "iconSlug": "notion",
    "iconColor": "ffffff",
    "glyph": "N",
    "founded": "2013, 샌프란시스코",
    "origin": "Ivan Zhao + Simon Last 공동 창업. 4년간 제품 못 내고 가족에게 돈 빌려가며 버팀. 2015년 직원 다 정리하고 둘이 일본 교토의 종이벽 무난방 집에서 매일 18시간씩 처음부터 다시 작성.",
    "keys": [
      "교토에서의 깨달음 — '대부분의 사람은 자기 앱을 만들고 싶지 않다, 빨리 문제를 해결할 도구만 원한다'",
      "문서 + 위키 + 데이터베이스를 'block' 모델로 통합",
      "2018년 WSJ 의 'The Only App You Need' 리뷰로 입소문 폭발"
    ],
    "lesson": "사용자가 도구를 '조립' 하길 원할 거란 가정을 버리고 '바로 쓸 수 있는 답'을 주는 게 더 강하다."
  },
  {
    "name": "쿠팡",
    "tagline": "이커머스",
    "color": "#cc0000",
    "iconSlug": "coupang",
    "iconColor": "ffffff",
    "glyph": "쿠",
    "founded": "2010, 서울 (창업자 김범석)",
    "origin": "김범석 — 7살 때 미국 이주, 하버드 → BCG → 하버드 비즈니스 스쿨 자퇴. 2010년 8월 그루폰 따라한 소셜커머스로 출발.",
    "keys": [
      "2014년 자체 배송망 '로켓배송' 으로 피벗 — 24시간 배송 표준화",
      "물류 인프라에 수십조 적자 베팅 — 단기 손실 vs 장기 해자",
      "2021년 NYSE 상장으로 글로벌 자본 조달"
    ],
    "lesson": "남들이 따라할 수 없는 인프라에 일찍 베팅하면, 그게 끝까지 해자가 된다."
  },
  {
    "name": "Linear",
    "tagline": "Engineering",
    "color": "#5e6ad2",
    "iconSlug": "linear",
    "iconColor": "ffffff",
    "glyph": "L",
    "founded": "2019, 샌프란시스코",
    "origin": "핀란드 출신 3명 — Karri Saarinen (전 Airbnb 디자이너), Jori Lallo (전 Coinbase), Tuomas Artman (전 Uber). '모든 이슈 트래커가 끔찍하다' 는 공통 불만에서 시작.",
    "keys": [
      "키보드 단축키 + Cmd-K 우선 설계 — 마우스 거의 안 써도 됨",
      "10,000명 웨이트리스트 → 빠른 응답으로 사랑받음",
      "Sequoia $4.2M 시드 (2019.11) → $400M valuation 까지 성장"
    ],
    "lesson": "기존 도구가 너무 복잡해서 사용자가 짜증날 때, '단순함' 자체가 차별화가 된다."
  },
  {
    "name": "Airbnb",
    "tagline": "Stays",
    "color": "#ff385c",
    "iconSlug": "airbnb",
    "iconColor": "ffffff",
    "glyph": "A",
    "founded": "2008, 샌프란시스코",
    "origin": "Brian Chesky + Joe Gebbia (RISD 동기, 디자이너) — 2007년 월세 막막하던 시기, 디자인 컨퍼런스 동안 호텔 부족하자 '에어매트리스 3개 + 아침 = $80/박' 광고. 3개 다 예약됨. 이후 Nathan Blecharczyk (개발자) 합류.",
    "keys": [
      "초창기엔 사장이 직접 모든 호스트 집 사진 찍어줌 — Do things that don't scale",
      "2008년 오바마/맥케인 시리얼로 $30K 모은 뒤 Y Combinator 진입",
      "신뢰 시스템 (양방향 리뷰·신원확인) 이 진짜 제품"
    ],
    "lesson": "초기엔 한 명 한 명을 직접 만나서 도와줘야 한다. 자동화는 그 다음 단계."
  },
  {
    "name": "Stripe",
    "tagline": "Payments",
    "color": "#635bff",
    "iconSlug": "stripe",
    "iconColor": "ffffff",
    "glyph": "S",
    "founded": "2010, 샌프란시스코",
    "origin": "아일랜드 인구 100명 마을 출신 Patrick (전 MIT) + John (전 Harvard) Collison 형제. '인터넷에서 돈 받기가 충격적으로 어렵다' 는 한 가지 문제에 집중.",
    "keys": [
      "7줄 코드로 결제 통합 — API 자체가 제품",
      "개발자 경험 (DX) 이 마케팅 — 문서 디자인에 디자이너 투입",
      "2011년 Elon Musk·Peter Thiel·Sequoia 등 $2M 투자"
    ],
    "lesson": "고객이 개발자라면, 가장 좋은 마케팅은 좋은 문서다."
  },
  {
    "name": "OpenAI",
    "tagline": "AI",
    "color": "#10a37f",
    "iconSlug": "openai",
    "iconColor": "ffffff",
    "glyph": "O",
    "founded": "2015.12, 샌프란시스코 (비영리로 시작)",
    "origin": "Sam Altman, Elon Musk, Ilya Sutskever, Greg Brockman 등 11명 공동 창업. 'AGI 가 인류에 안전하게 이익이 되도록' 미션. 약속된 $1B 중 실제 $133M 만 모금.",
    "keys": [
      "초기엔 GPT-2 도 위험하다고 발표 보류 — 안전성을 마케팅으로",
      "ChatGPT 출시 (2022.11) 5일만에 100만 사용자 — AI 대중화의 시작",
      "비영리 → 하이브리드 → 2025년 public benefit corporation 로 진화"
    ],
    "lesson": "기술 자체보다 '대중이 만질 수 있는 형태' 로 만드는 사람이 시장을 만든다."
  },
  {
    "name": "카카오",
    "tagline": "메신저·O2O",
    "color": "#fee500",
    "iconSlug": "kakao",
    "iconColor": "3c1e1e",
    "glyph": "K",
    "textColor": "#3c1e1e",
    "founded": "2010.3 카카오톡 출시 (모회사 2006 설립)",
    "origin": "김범수 (전 NHN/한게임) — 2006년 아이위랩 설립. 2009년 한국 아이폰 출시 직후, 2010년 3월 카카오톡 발표. 그룹채팅이 차별점이 되어 폭발적 성장.",
    "keys": [
      "한국 모바일 메신저 시장 90% 점유 (2015년 기준)",
      "2014년 다음과 합병 → 2015년 카카오로 통합 — 포털 인프라 확보",
      "택시·뱅크·페이·모빌리티로 슈퍼앱 확장"
    ],
    "lesson": "사람들이 매일 여는 앱을 갖고 있으면, 거기서 모든 인접 산업으로 확장할 수 있다."
  },
  {
    "name": "Figma",
    "tagline": "Design",
    "color": "#1e1e1e",
    "iconSlug": "figma",
    "iconColor": "ffffff",
    "glyph": "F",
    "founded": "2012.8, 샌프란시스코",
    "origin": "Dylan Field + Evan Wallace (Brown CS 동기). Wallace 의 WebGL 'Water' 데모에서 영감. Field 가 Thiel Fellowship $100K 받고 학교 자퇴, 4년간 비공개 개발 후 2016년 출시.",
    "keys": [
      "브라우저에서 동작하는 디자인 도구 — 다운로드 X",
      "Real-time multi-cursor — 디자이너끼리 동시 편집 (Google Docs 영감)",
      "Free for individuals — 디자이너 입소문이 회사 도입을 유도"
    ],
    "lesson": "데스크톱 앱이 표준인 시장에서 '브라우저 + 실시간 협업' 이 카테고리를 다시 정의한다."
  },
  {
    "name": "Vercel",
    "tagline": "Hosting",
    "color": "#000000",
    "iconSlug": "vercel",
    "iconColor": "ffffff",
    "glyph": "▲",
    "founded": "2015.11 ZEIT → 2020.4 Vercel",
    "origin": "Guillermo Rauch (Socket.io 창시자) — 'git push 만으로 배포' 라는 단순 명제. 2016년 Next.js 프레임워크 + 호스팅 함께 출시.",
    "keys": [
      "오픈소스 프레임워크 (Next.js) + 호스팅 인프라 결합 — 락인 자연스러움",
      "Preview deployment 자동화 — PR 마다 URL 생성, 리뷰 혁명",
      "개발자 친화 가격 — 시작 무료, 트래픽 늘면 자연스럽게 결제"
    ],
    "lesson": "오픈소스로 표준을 만들고, 그 위에 유료 인프라를 얹는 모델이 강력하다."
  },
  {
    "name": "Discord",
    "tagline": "Community",
    "color": "#5865f2",
    "iconSlug": "discord",
    "iconColor": "ffffff",
    "glyph": "D",
    "founded": "2015.5, 샌프란시스코",
    "origin": "Jason Citron — OpenFeint 를 GREE 에 $104M 매각 (2011) → Hammer & Chisel 게임 스튜디오 → 모바일 MOBA 'Fates Forever' 실패. 그 과정에서 만든 내부 음성 채팅을 Discord 로 피벗.",
    "keys": [
      "Final Fantasy XIV 서브레딧에서 입소문 — 게이머 niche 시작",
      "낮은 지연·서버 모델 — 사용자가 자체 community 운영",
      "광고 없음, Nitro 구독 모델 — 신뢰 우선"
    ],
    "lesson": "Niche 에서 시작해 사랑받으면, 그 사랑이 인접 커뮤니티로 자연스럽게 번진다."
  },
  {
    "name": "GitHub",
    "tagline": "Code",
    "color": "#181717",
    "iconSlug": "github",
    "iconColor": "ffffff",
    "glyph": "G",
    "founded": "2008.4, 샌프란시스코",
    "origin": "Chris Wanstrath, Tom Preston-Werner, P.J. Hyett, Scott Chacon 4명. 2007년 Ruby on Rails 미팅에서 'Git 은 좋은데 호스팅이 어렵다' 는 불편 — 'Git 의 SNS' 로 해결.",
    "keys": [
      "Public repository = 개발자 이력서 — 채용 시장이 GitHub 중심으로 재편",
      "Open source 무료 / 기업 유료 — 오픈소스 표준",
      "MS 인수 (2018) 후에도 중립성 유지 — 신뢰 자산"
    ],
    "lesson": "도구가 정체성이 되면 (= 누구나 쓰는 표준), 그 자체로 네트워크 효과가 된다."
  },
  {
    "name": "Anthropic",
    "tagline": "Claude",
    "color": "#cc785c",
    "iconSlug": "anthropic",
    "iconColor": "ffffff",
    "glyph": "A",
    "founded": "2021, 샌프란시스코",
    "origin": "Dario Amodei (전 OpenAI VP of Research) + Daniela Amodei (전 OpenAI VP of Safety) 등 OpenAI 출신 7명. 'AI 안전성·정렬을 진짜 진지하게' 라는 방향성 차이로 분사.",
    "keys": [
      "Constitutional AI — 모델이 스스로 윤리 기준에 맞춰 학습",
      "2021.5 Series A $124M 으로 안전성 연구 본격화",
      "Claude 로 코딩·분석 분야에서 GPT 와 동등 또는 우위"
    ],
    "lesson": "기존 강자가 있어도, 명확한 가치 (안전성·신뢰) 로 차별화하면 짧은 시간에 따라잡을 수 있다."
  },
  {
    "name": "Spotify",
    "tagline": "Music",
    "color": "#1ed760",
    "iconSlug": "spotify",
    "iconColor": "ffffff",
    "glyph": "♫",
    "founded": "2006.4, 스톡홀름 (출시 2008.10)",
    "origin": "Daniel Ek (전 Stardoll CTO) + Martin Lorentzon (Tradedoubler 공동창업자). Napster 차단 후 Kazaa 등 불법 다운로드 만연 시기, '법으로 막을 수 없다 — 불법보다 더 편한 합법을 만들어야' 는 인사이트.",
    "keys": [
      "음반사 18% 지분 협상 = 진짜 제품 (기술은 부차)",
      "Freemium — 무료 광고 vs Premium 구독",
      "Discover Weekly 로 알고리즘이 곧 큐레이션"
    ],
    "lesson": "기술 문제가 아니라 비즈니스 협상 문제일 때, 그 협상이 진짜 moat 다."
  },
  {
    "name": "Slack",
    "tagline": "Work chat",
    "color": "#4a154b",
    "iconSlug": "slack",
    "iconColor": "ffffff",
    "glyph": "S",
    "founded": "2014.2 출시, 밴쿠버",
    "origin": "Stewart Butterfield — Flickr 공동창업자 (Yahoo 매각). Tiny Speck 에서 게임 'Glitch' (2011~2012) 만들다 실패. 게임 망하던 와중 사내 채팅 도구만 살아남아 그걸 제품화.",
    "keys": [
      "이름 'Slack' = Searchable Log of All Conversation and Knowledge",
      "이메일 대체 — 채널 기반 협업 모델로 회사 대화 구조 변경",
      "Bottom-up 도입 — 한 팀이 쓰면 회사 전체가 따라옴"
    ],
    "lesson": "원래 만들려던 것 (게임) 의 부산물이 진짜 제품일 수도 있다. 데이터를 따라가라."
  },
  {
    "name": "배달의민족",
    "tagline": "음식 배달",
    "color": "#2ac1bc",
    "glyph": "배",
    "founded": "2010.6, 우아한형제들",
    "origin": "김봉진 (디자이너 출신, 전 NHN/네이버) — 2009년 한국 아이폰 출시 직후 '거리에 어지럽혀진 음식점 전단지를 모바일로' 라는 발상. 본인이 직접 길거리·재활용센터·아파트에서 5만 장 전단지 수집.",
    "keys": [
      "Brand voice — '오늘 우리는 무엇을 먹을까?' 같은 따뜻한 카피로 차별화",
      "디자이너 출신 사장 — 명함에 '경영하는 디자이너' 라고 표기",
      "B마트·배민라이더스로 인접 인프라 통합"
    ],
    "lesson": "기능보다 정서·언어가 한국 시장에서 강력한 차별화가 된다."
  },
  {
    "name": "당근",
    "tagline": "동네 거래",
    "color": "#ff7e36",
    "glyph": "당",
    "founded": "2015.7, 판교",
    "origin": "김용현 (전 카카오) + 김재현 (전 네이버) + 정창훈 CTO — 카카오 사내 중고거래 게시판에서 영감. 자본금 5억으로 '판교마켓' 시작, 2015년 10월 '당근마켓' 으로 개명.",
    "keys": [
      "GPS 기반 지역 한정 — 직접 만나서 거래하는 신뢰 체계",
      "수수료 0원 — 중고나라와 차별화, 사기 줄임",
      "2018년 1월 전국 서비스 → 동네생활·당근알바 등 지역 슈퍼앱"
    ],
    "lesson": "온라인이 글로벌화될수록 '하이퍼로컬 (동네)' 의 가치가 역설적으로 커진다."
  },
  {
    "name": "야놀자",
    "tagline": "여행·숙박",
    "color": "#ff5e1f",
    "glyph": "야",
    "founded": "2005, 한국",
    "origin": "이수진 — 무일푼 시기 모텔에서 4년 6개월 청소·관리하며 종잣돈 마련. 2004년 온라인 커뮤니티 '모텔 이야기' 개설 → 1년 만에 회원 1만. 2005년 자본금 5천만원으로 '모텔투어' (회원 20만) 인수해 야놀자로 법인화.",
    "keys": [
      "한국 비즈니스 모텔 디지털화 (예약·결제) — 인프라 부재 시장 선점",
      "글로벌 호텔 솔루션 (PMS) 으로 B2B 확장",
      "현재 기업가치 약 10조원 트래블 슈퍼앱"
    ],
    "lesson": "남들이 무시하는 시장 (모텔) 에서 시작해 그 인프라로 인접 시장 점령."
  },
  {
    "name": "마켓컬리",
    "tagline": "신선식품",
    "color": "#5f0080",
    "glyph": "컬",
    "founded": "2014.12 The Farmers → 2015.5 Market Kurly",
    "origin": "김슬아 — Wellesley College → Goldman Sachs (2007~) → McKinsey HK → Temasek → Bain Korea. '한국 슈퍼마켓이 매장 위치만 신경 쓰고 소비자 경험은 뒷전' 이라는 강한 비판에서 출발.",
    "keys": [
      "샛별배송 — 밤 11시 주문 → 아침 7시 도착 (가족이 집에 있는 시간)",
      "프리미엄 큐레이션 — 모든 상품 MD 가 직접 시식·검수",
      "이커머스 + 콜드체인 물류 인프라 동시 구축 (모방 어려움)"
    ],
    "lesson": "본인이 직접 겪은 불편이 가장 큰 시장 신호다."
  },
  {
    "name": "무신사",
    "tagline": "패션",
    "color": "#000000",
    "glyph": "M",
    "founded": "2003, 무신사닷컴",
    "origin": "조만호 — 고3 (2001년) 시절 프리챌에 '무진장 신발 사진이 많은 곳' 커뮤니티 운영. 2002년 프리챌 유료화 정책으로 2003년 독립 '무신사닷컴' 개설 → 2009년 무신사 스토어 (커머스).",
    "keys": [
      "패션 커뮤니티 → 매거진 → 커머스 단계적 진화 (10년 빌드업)",
      "스트릿 / 디자이너 브랜드 큐레이션 — 백화점이 안 다루는 영역",
      "무신사 스탠다드 PB 로 마진 확보"
    ],
    "lesson": "콘텐츠·커뮤니티가 먼저, 커머스는 마지막 단계. 신뢰 자산이 있어야 결제 일어남."
  }
];
