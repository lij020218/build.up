/* ─────────────────────────────────────────────
 *  success-case-studies.ts
 *  77개 검증된 기업 성공/위기극복 사례
 *  AI 경영 코치가 사용자 상황에 맞는 사례를 자동 매칭
 * ───────────────────────────────────────────── */

export type BusinessSituation =
  | "funding-crisis"        // 런웨이 3개월 미만, 투자 실패
  | "pmf-not-found"         // 매출 0, PMF 미검증
  | "revenue-decline"       // 매출 3주+ 연속 하락
  | "competitor-pressure"   // 경쟁 심화
  | "cost-crisis"           // 프라임코스트 65%+, 수익 구조 붕괴
  | "scaling-decision"      // 확장 vs 안정 결정
  | "small-biz-turnaround"  // 자영업 반전
  | "talent-acquisition"    // 핵심 인재 부족
  // ── 신규 7개 ──
  | "marketing-stagnant"    // 매출은 있지만 성장 없음 (SNS/유입 부족)
  | "menu-fatigue"          // 재방문율 하락, 메뉴 신선도 문제
  | "delivery-dependency"   // 배달 비중 80%+, 수수료 수익 압박
  | "seasonal-slump"        // 계절 비수기 매출 하락
  | "expansion-ready"       // 흑자 안정, 2호점/확장 고민
  | "staff-crisis"          // 직원 이탈, 채용 난
  | "rent-crisis";          // 임대료 인상, 재계약 위험

export type CaseStudy = {
  id: string;
  company: string;                // "테슬라"
  situation: BusinessSituation;
  oneLiner: string;               // ≤80자, 핵심 코칭 메시지
  lesson: string;                 // ≤50자, 실행 교훈
  applicableTo: string[];         // categoryId[] 또는 ["all"]
};

const CASE_STUDIES: CaseStudy[] = [
  // ═══ 자금 위기 / 런웨이 위기 (8) ═══
  {
    id: "tesla-2008",
    company: "테슬라",
    situation: "funding-crisis",
    oneLiner: "2008년 파산 직전, 머스크는 개인 전 재산을 투입하고 크리스마스 이브에 마지막 라운드를 마감했습니다",
    lesson: "런웨이 3개월 미만이면 모든 에너지를 자금 확보에 올인하세요",
    applicableTo: ["startup-tech"],
  },
  {
    id: "airbnb-cereal",
    company: "에어비앤비",
    situation: "funding-crisis",
    oneLiner: "2008년 투자 거절, 현금 고갈 — 시리얼 박스를 만들어 3만 달러를 벌며 버텼습니다",
    lesson: "런웨이가 짧으면 창의적 현금 확보 방법을 찾으세요",
    applicableTo: ["startup-tech", "space"],
  },
  {
    id: "toss-rejection",
    company: "토스",
    situation: "funding-crisis",
    oneLiner: "8번의 사업 실패와 수많은 VC 거절 — 포기하지 않고 미팅 수를 극대화했습니다",
    lesson: "투자 유치는 확률 게임. 거절에 좌절 말고 미팅 수를 늘리세요",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "kurly-dawn",
    company: "마켓컬리",
    situation: "funding-crisis",
    oneLiner: "'새벽배송은 불가능하다'는 업계 통념을 깨고 직접 물류를 구축, 첫 주문 100건에서 시작했습니다",
    lesson: "불가능하다는 건 아직 누구도 안 했다는 뜻입니다",
    applicableTo: ["startup-tech", "online-digital", "retail"],
  },
  {
    id: "spacex-4th",
    company: "SpaceX",
    situation: "funding-crisis",
    oneLiner: "팰컨1 로켓 3연속 실패 후 마지막 남은 자금으로 4번째 발사에 성공, NASA $16억 계약을 따냈습니다",
    lesson: "마지막 기회에서 성공하려면 이전 실패를 정확히 분석하세요",
    applicableTo: ["startup-tech"],
  },
  {
    id: "canva-100",
    company: "캔바(Canva)",
    situation: "funding-crisis",
    oneLiner: "100번 넘는 VC 거절 — 실리콘밸리로 이동해 인맥 네트워크를 집중 공략했습니다",
    lesson: "거절은 제품 문제가 아니라 타이밍일 수 있습니다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "notion-rebuild",
    company: "노션(Notion)",
    situation: "funding-crisis",
    oneLiner: "2015년 전 직원 해고 후 도쿄에서 1.5년간 제품을 완전히 재구축했습니다",
    lesson: "위기에서 제품을 처음부터 다시 만들 용기가 필요할 때도 있습니다",
    applicableTo: ["startup-tech"],
  },
  {
    id: "yanolja-start",
    company: "야놀자",
    situation: "funding-crisis",
    oneLiner: "모텔 청소부로 시작해 숙박 업계 디지털 혁신에 집중, 데카콘이 되었습니다",
    lesson: "가장 낮은 곳에서 시작해도 업계를 바꿀 수 있습니다",
    applicableTo: ["startup-tech", "space"],
  },

  // ═══ PMF 미발견 / 피봇 (9) ═══
  {
    id: "slack-pivot",
    company: "슬랙",
    situation: "pmf-not-found",
    oneLiner: "게임 Glitch가 실패한 후, 팀 내부 소통 도구가 진짜 제품이었음을 발견했습니다",
    lesson: "실패한 제품 안에 성공할 기능이 숨어있을 수 있습니다",
    applicableTo: ["startup-tech"],
  },
  {
    id: "instagram-burbn",
    company: "인스타그램",
    situation: "pmf-not-found",
    oneLiner: "Burbn이라는 복잡한 체크인 앱에서 사진 공유 기능만 떼어 냈더니 출시 2시간 만에 서버가 다운됐습니다",
    lesson: "사용자가 가장 많이 쓰는 기능 하나에 집중하세요",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "youtube-dating",
    company: "유튜브",
    situation: "pmf-not-found",
    oneLiner: "데이팅 사이트로 시작했지만 아무도 데이트 영상을 올리지 않아 영상 공유로 전환했습니다",
    lesson: "사용자가 의도와 다르게 쓰면 그게 진짜 PMF입니다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "coupang-rocket",
    company: "쿠팡",
    situation: "pmf-not-found",
    oneLiner: "소셜커머스에서 로켓배송 직매입 모델로 완전히 전환, 연매출 40조를 달성했습니다",
    lesson: "비즈니스 모델을 완전히 바꿀 용기가 성공의 전제조건",
    applicableTo: ["startup-tech", "online-digital", "retail"],
  },
  {
    id: "kakao-8fails",
    company: "카카오",
    situation: "pmf-not-found",
    oneLiner: "PC방 사업 등 여러 실패 후 아이폰 출시 타이밍에 맞춰 카카오톡을 만들었습니다",
    lesson: "실패 경험이 있어야 타이밍을 알아볼 수 있습니다",
    applicableTo: ["startup-tech"],
  },
  {
    id: "discord-fates",
    company: "디스코드",
    situation: "pmf-not-found",
    oneLiner: "Fates Forever 태블릿 게임이 실패하자 게이머 음성채팅에 특화해 MAU 2억을 달성했습니다",
    lesson: "핵심 사용자의 진짜 불편함에 집중하세요",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "twitch-justintv",
    company: "트위치",
    situation: "pmf-not-found",
    oneLiner: "Justin.tv에서 게이밍 채널만 분리해 독립시켰더니 아마존이 $9.7억에 인수했습니다",
    lesson: "전체 중 가장 잘 되는 버티컬 하나를 독립시키세요",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "pinterest-tote",
    company: "핀터레스트",
    situation: "pmf-not-found",
    oneLiner: "쇼핑 앱 Tote 사용자들이 구매 대신 북마킹만 하고 있었고, 그것이 새 제품의 실마리였습니다",
    lesson: "사용자의 예상치 못한 행동이 새 제품의 실마리",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "twitter-odeo",
    company: "트위터",
    situation: "pmf-not-found",
    oneLiner: "팟캐스트 플랫폼 Odeo가 아이튠즈에 밀리자, 사이드 프로젝트인 140자 마이크로블로깅으로 전환했습니다",
    lesson: "본업이 막히면 사이드 프로젝트를 검토하세요",
    applicableTo: ["startup-tech"],
  },

  // ═══ 매출 하락/정체 극복 (8) ═══
  {
    id: "apple-1997",
    company: "애플",
    situation: "revenue-decline",
    oneLiner: "1997년 파산 90일 전, 잡스는 제품 라인 70%를 삭감하고 4개에만 집중했습니다",
    lesson: "매출 하락 시 메뉴/상품을 줄여 핵심에 집중하세요",
    applicableTo: ["food", "cafe-dessert", "retail", "online-digital", "startup-tech"],
  },
  {
    id: "nvidia-cuda",
    company: "엔비디아",
    situation: "revenue-decline",
    oneLiner: "게이밍 GPU 시장 정체기에 CUDA 플랫폼을 만들어 AI 시대의 패권을 잡았습니다",
    lesson: "기존 역량을 새로운 시장에 적용해보세요",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "samsung-tokyo",
    company: "삼성",
    situation: "revenue-decline",
    oneLiner: "1983년 도쿄선언으로 반도체 올인, 불황기 역행 투자로 6개월 만에 64K D램을 개발했습니다",
    lesson: "불황일 때 투자하면 호황에 수확합니다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "hyundai-warranty",
    company: "현대차",
    situation: "revenue-decline",
    oneLiner: "미국에서 품질 불신 시절 '10년 10만마일 보증'을 업계 최초로 도입해 판매량이 급증했습니다",
    lesson: "약점을 역으로 파격 보증하면 신뢰로 전환됩니다",
    applicableTo: ["food", "cafe-dessert", "beauty", "fitness", "pet", "living-service", "retail", "education", "space"],
  },
  {
    id: "naver-superapp",
    company: "네이버",
    situation: "revenue-decline",
    oneLiner: "검색 광고 매출 정체기에 커머스·결제·콘텐츠 슈퍼앱으로 전환, 연매출 10조를 돌파했습니다",
    lesson: "단일 수익원에 의존하지 말고 생태계를 확장하세요",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "starbucks-2008",
    company: "스타벅스",
    situation: "revenue-decline",
    oneLiner: "2008년 과잉 확장으로 품질 하락 — 슐츠 복귀 후 7,100개 매장 동시 교육 폐쇄, 900개 폐점했습니다",
    lesson: "확장보다 기본기 회복이 먼저입니다",
    applicableTo: ["cafe-dessert", "food", "beauty", "fitness", "retail", "education", "pet"],
  },
  {
    id: "lego-2003",
    company: "레고",
    situation: "revenue-decline",
    oneLiner: "2003년 파산 직전, 부품을 7,000→3,000개로 축소하고 핵심에 집중해 2008년 불황에도 수익 4배를 달성했습니다",
    lesson: "잘하는 것만 남기고 나머지는 버리세요",
    applicableTo: ["retail", "food", "cafe-dessert", "pet", "beauty", "online-digital"],
  },
  {
    id: "adobe-saas",
    company: "어도비",
    situation: "revenue-decline",
    oneLiner: "패키지 소프트웨어에서 구독 모델로 전환 시 매출 40% 일시 하락을 감수했습니다",
    lesson: "단기 매출 하락을 감수하고 비즈니스 모델을 전환하세요",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ═══ 경쟁 압도 / David vs Goliath (6) ═══
  {
    id: "netflix-blockbuster",
    company: "넷플릭스",
    situation: "competitor-pressure",
    oneLiner: "블록버스터의 연체료라는 약점을 파고들어 구독 모델로 전환, 경쟁자를 파산시켰습니다",
    lesson: "경쟁자의 약점이 곧 당신의 기회입니다",
    applicableTo: ["startup-tech", "online-digital", "retail"],
  },
  {
    id: "zoom-simplicity",
    company: "줌",
    situation: "competitor-pressure",
    oneLiner: "Webex·Skype보다 극단적으로 단순하게 만들어 팬데믹에 일 3억 참가자를 달성했습니다",
    lesson: "기능보다 사용 편의성이 시장을 이깁니다",
    applicableTo: ["startup-tech"],
  },
  {
    id: "coupang-logistics",
    company: "쿠팡",
    situation: "competitor-pressure",
    oneLiner: "이마트/롯데와 가격 경쟁 대신 배송 속도라는 새 차원에서 승부했습니다",
    lesson: "기존 전쟁터가 아닌 새로운 차원에서 승부하세요",
    applicableTo: ["startup-tech", "online-digital", "retail"],
  },
  {
    id: "mailchimp-bootstrap",
    company: "메일침프",
    situation: "competitor-pressure",
    oneLiner: "VC 0원 부트스트랩으로 SMB에 집중해 인튜이트에 $120억에 인수되었습니다",
    lesson: "VC 없이도 고객에 집중하면 거대해질 수 있습니다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "shopify-snowboard",
    company: "쇼피파이",
    situation: "competitor-pressure",
    oneLiner: "스노보드 쇼핑몰을 만들다가 직접 느낀 불편함을 셀러 도구로 전환했습니다",
    lesson: "직접 겪은 불편함이 최고의 제품 아이디어입니다",
    applicableTo: ["startup-tech", "online-digital", "retail"],
  },
  {
    id: "whatsapp-simple",
    company: "왓츠앱",
    situation: "competitor-pressure",
    oneLiner: "극도로 심플하고 광고 없는 원칙을 고수해 페이스북이 $190억에 인수했습니다",
    lesson: "불필요한 것을 없애는 게 최고의 차별화",
    applicableTo: ["startup-tech"],
  },

  // ═══ 자기부정의 용기 / 결정적 전환 (6) ═══
  {
    id: "intel-cpu",
    company: "인텔",
    situation: "cost-crisis",
    oneLiner: "1985년 메모리 사업 적자 — '새 CEO라면 어떻게 할까?' 질문 후 CPU로 전환했습니다",
    lesson: "가장 어려운 결정은 잘하던 것을 포기하는 것",
    applicableTo: ["startup-tech"],
  },
  {
    id: "danaher-dbs",
    company: "다나허",
    situation: "scaling-decision",
    oneLiner: "산업용 도구 회사가 DBS(다나허 경영 시스템)를 만들어 80+ 기업을 인수·개선했습니다",
    lesson: "시스템을 만들면 어떤 사업이든 개선할 수 있습니다",
    applicableTo: ["startup-tech"],
  },
  {
    id: "microsoft-cloud",
    company: "마이크로소프트",
    situation: "revenue-decline",
    oneLiner: "볼머 시대 정체, 나델라 CEO 취임 후 클라우드(Azure)에 올인해 시총 $3조를 달성했습니다",
    lesson: "과거 성공에 집착하지 말고 미래 시장에 베팅하세요",
    applicableTo: ["startup-tech"],
  },
  {
    id: "amazon-aws",
    company: "아마존",
    situation: "funding-crisis",
    oneLiner: "닷컴 버블 붕괴로 주가 94% 하락 — 비용 절감 + AWS 신사업으로 세계 최대 클라우드가 되었습니다",
    lesson: "위기에서 새 수익원을 만들면 더 강해집니다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "meta-efficiency",
    company: "메타",
    situation: "cost-crisis",
    oneLiner: "2022년 메타버스 투자 실패로 시총 75% 폭락, '효율의 해' 선언 후 2.1만 명 해고·AI 피봇했습니다",
    lesson: "실패를 인정하고 빠르게 방향을 바꾸세요",
    applicableTo: ["startup-tech"],
  },
  {
    id: "google-adwords",
    company: "구글",
    situation: "revenue-decline",
    oneLiner: "좋은 검색 엔진이 있었지만 수익화 불가 — AdWords 출시로 디지털 광고를 지배했습니다",
    lesson: "좋은 제품에 좋은 수익 모델을 붙이세요",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ═══ 전환/확장 사례 (3) ═══
  {
    id: "nintendo-wii",
    company: "닌텐도",
    situation: "scaling-decision",
    oneLiner: "트럼프 카드 제조 120년 역사에서 비디오게임 진입, Wii로 비게이머를 공략해 시장을 키웠습니다",
    lesson: "기존 고객이 아닌 새 고객을 만들면 시장이 커집니다",
    applicableTo: ["startup-tech", "online-digital", "education", "fitness", "space"],
  },
  {
    id: "ridi-webtoon",
    company: "리디",
    situation: "scaling-decision",
    oneLiner: "전자책 시장의 한계를 느끼고 웹툰/웹소설로 전환해 글로벌 진출에 성공했습니다",
    lesson: "인접 시장으로의 확장이 성장 돌파구",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "spotify-us",
    company: "스포티파이",
    situation: "competitor-pressure",
    oneLiner: "미국 진출 시 2.5년 준비 + 페이스북 제휴로 4일 만에 100만 유저를 달성했습니다",
    lesson: "새 시장 진입은 현지 대형 파트너와 함께하세요",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ═══ 한국 스타트업 (5) ═══
  {
    id: "baemin-start",
    company: "배달의민족",
    situation: "small-biz-turnaround",
    oneLiner: "친형과 5명이 카페에서 시작, 전단지를 직접 스캔하며 감성 마케팅으로 DH $40억 인수를 이끌었습니다",
    lesson: "초기엔 스케일보다 직접 발로 뛰세요",
    applicableTo: ["startup-tech", "food"],
  },
  {
    id: "danggeun-1000",
    company: "당근마켓",
    situation: "pmf-not-found",
    oneLiner: "지역 한정 중고거래를 1,000명 이웃으로 검증한 후 지역별로 확장해 MAU 1,800만을 달성했습니다",
    lesson: "작은 지역에서 완벽히 검증하고 확장하세요",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "musinsa-community",
    company: "무신사",
    situation: "scaling-decision",
    oneLiner: "커뮤니티를 먼저 만들고 판매는 나중에 — 기업가치 3조, 패션 1위가 되었습니다",
    lesson: "팔기 전에 모이게 하세요. 커뮤니티가 커머스를 만듭니다",
    applicableTo: ["startup-tech", "online-digital", "retail"],
  },
  {
    id: "sendbird-global",
    company: "센드버드",
    situation: "scaling-decision",
    oneLiner: "한국 스타트업이 법인 플립으로 실리콘밸리 진출, 채팅 API 글로벌 리더가 되었습니다",
    lesson: "글로벌을 목표로 하면 처음부터 글로벌 구조로 만드세요",
    applicableTo: ["startup-tech"],
  },
  {
    id: "stripe-7lines",
    company: "스트라이프",
    situation: "competitor-pressure",
    oneLiner: "온라인 결제가 너무 복잡해 '코드 7줄로 결제 연동'을 만들어 $950억 기업이 되었습니다",
    lesson: "개발자가 고객이면 개발자 경험을 극한까지 단순화하세요",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ═══ 소상공인 성공 사례 (7) ═══
  {
    id: "delivery-cafe",
    company: "감성커피",
    situation: "small-biz-turnaround",
    oneLiner: "배달 전용 카페 모델로 매장을 배달에 최적화, 소형 매장으로 월 매출 7,000만원을 달성했습니다",
    lesson: "배달 비중이 높으면 매장 비용을 최소화하세요",
    applicableTo: ["cafe-dessert", "food"],
  },
  {
    id: "daegu-meat",
    company: "대구 고깃집",
    situation: "small-biz-turnaround",
    oneLiner: "일반 고깃집 매출 하락 후 돼지고기 특화, 메뉴 3개, 6시간 영업으로 3개점 월 2억을 달성했습니다",
    lesson: "메뉴를 줄이고 운영시간을 줄이면 효율이 오릅니다",
    applicableTo: ["food"],
  },
  {
    id: "baekjongwon-method",
    company: "백종원 컨설팅",
    situation: "small-biz-turnaround",
    oneLiner: "매출 부진 자영업 컨설팅의 핵심은 레시피가 아니라 동선·청결·원가 관리였습니다",
    lesson: "맛보다 운영 시스템이 먼저입니다",
    applicableTo: ["food", "cafe-dessert"],
  },
  {
    id: "sns-marketing-smb",
    company: "SNS 마케팅 성공 소상공인",
    situation: "small-biz-turnaround",
    oneLiner: "매출 정체 음식점이 킬러 정보성 콘텐츠를 제작, 팔로워 6배 증가로 방문객 3배를 달성했습니다",
    lesson: "SNS는 광고가 아니라 유용한 정보를 공유하세요",
    applicableTo: ["food", "cafe-dessert", "beauty", "retail", "pet", "fitness"],
  },
  {
    id: "tv-effect",
    company: "생활의달인 출연 효과",
    situation: "small-biz-turnaround",
    oneLiner: "방송 후 단기 매출 급등하지만, 품질 유지 못하면 1-2개월 후 원래대로 돌아옵니다",
    lesson: "미디어 효과는 일시적. 내실이 없으면 오히려 역효과",
    applicableTo: ["food", "cafe-dessert"],
  },
  {
    id: "instacart-timing",
    company: "인스타카트",
    situation: "scaling-decision",
    oneLiner: "1999년 Webvan의 $8억 실패를 학습, 2012년 같은 아이디어를 다른 타이밍에 재시도해 $390억을 달성했습니다",
    lesson: "같은 아이디어도 타이밍이 다르면 결과가 다릅니다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "hoffman-linkedin",
    company: "리드 호프만 (LinkedIn)",
    situation: "small-biz-turnaround",
    oneLiner: "SocialNet 1997년 실패의 교훈을 적용해 LinkedIn을 창업, MS $262억에 인수되었습니다",
    lesson: "첫 번째 실패의 교훈이 두 번째 성공의 자산입니다",
    applicableTo: ["startup-tech"],
  },

  // ═══ 신규: marketing-stagnant (4) ═══
  {
    id: "kkday-content",
    company: "KKday",
    situation: "marketing-stagnant",
    oneLiner: "매출 꼴찌 마케터가 킬러 정보성 콘텐츠 전략으로 팔로워를 6배 늘리고 매출 1위를 달성했습니다",
    lesson: "SNS는 광고가 아니라 유용한 정보를 공유하세요",
    applicableTo: ["food", "cafe-dessert", "beauty", "retail", "online-digital", "pet", "fitness"],
  },
  {
    id: "dollar-shave-club",
    company: "달러쉐이브클럽",
    situation: "marketing-stagnant",
    oneLiner: "4,500달러짜리 바이럴 영상 1개로 출시일 12,000명이 가입, 유니레버가 $10억에 인수했습니다",
    lesson: "완벽한 콘텐츠 1개가 광고비 수억을 대체합니다",
    applicableTo: ["startup-tech", "online-digital", "retail"],
  },
  {
    id: "musinsa-marketing",
    company: "무신사",
    situation: "marketing-stagnant",
    oneLiner: "패션 커뮤니티를 먼저 만들고 구매는 나중에 — 광고 없이 기업가치 3조를 달성했습니다",
    lesson: "팔기 전에 모이게 하세요. 커뮤니티가 최고의 마케팅",
    applicableTo: ["online-digital", "retail", "startup-tech"],
  },
  {
    id: "delivery-cafe-marketing",
    company: "감성커피",
    situation: "marketing-stagnant",
    oneLiner: "오프라인 매장 없이 배달앱 상위노출에 집중, 배달 전용 모델로 월 7천만원을 달성했습니다",
    lesson: "채널을 1개로 집중하면 적은 비용으로 상위노출이 가능합니다",
    applicableTo: ["food", "cafe-dessert"],
  },

  // ═══ 신규: menu-fatigue (3) ═══
  {
    id: "mcdonalds-bts",
    company: "맥도날드",
    situation: "menu-fatigue",
    oneLiner: "BTS 세트 한정판 메뉴로 글로벌 매출이 40% 증가, 컬래버레이션이 새 고객을 불러왔습니다",
    lesson: "시즌 한정 메뉴로 화제성을 만드세요",
    applicableTo: ["food", "cafe-dessert"],
  },
  {
    id: "starbucks-seasonal",
    company: "스타벅스",
    situation: "menu-fatigue",
    oneLiner: "시즌 한정 프라푸치노가 전체 매출의 25% 이상 — 계절마다 '돌아오는 메뉴'가 단골을 유지합니다",
    lesson: "계절 메뉴가 단골을 다시 오게 합니다",
    applicableTo: ["cafe-dessert", "food"],
  },
  {
    id: "baekjongwon-menu-cut",
    company: "백종원 골목식당",
    situation: "menu-fatigue",
    oneLiner: "메뉴 20개를 5개로 줄인 후 품질과 회전율이 올라 매출이 2배가 됐습니다",
    lesson: "메뉴를 줄이면 품질과 효율이 올라갑니다",
    applicableTo: ["food", "cafe-dessert"],
  },

  // ═══ 신규: delivery-dependency (3) ═══
  {
    id: "jokbal-self-order",
    company: "족발 매장 자체 주문 전환",
    situation: "delivery-dependency",
    oneLiner: "배달앱 수수료 30%에서 자체 주문 채널을 만들어 수수료를 5%로 낮추고 이익률을 2배로 높였습니다",
    lesson: "단골 100명을 자체 주문으로 전환하세요",
    applicableTo: ["food"],
  },
  {
    id: "dominos-self-app",
    company: "도미노피자",
    situation: "delivery-dependency",
    oneLiner: "자체 앱 주문 비중을 60% 이상으로 끌어올려 배달앱 수수료 의존도를 크게 낮췄습니다",
    lesson: "자체 배달 채널 확보가 수수료 절감의 핵심",
    applicableTo: ["food", "cafe-dessert"],
  },
  {
    id: "meituan-self-delivery",
    company: "중국 자체배달 전환 사례",
    situation: "delivery-dependency",
    oneLiner: "배달앱 의존도를 낮추고 자체 배달 채널을 확보한 매장이 이익률 2배를 달성했습니다",
    lesson: "배달앱은 유입 채널, 자체채널이 수익 채널",
    applicableTo: ["food"],
  },

  // ═══ 신규: seasonal-slump (3) ═══
  {
    id: "baskin-winter",
    company: "배스킨라빈스",
    situation: "seasonal-slump",
    oneLiner: "아이스크림 비수기인 겨울에 핫초코와 아이스크림 케이크를 강화해 매출 하락을 방어했습니다",
    lesson: "비수기 보완 메뉴를 성수기 때 미리 준비하세요",
    applicableTo: ["cafe-dessert", "food"],
  },
  {
    id: "bingsu-winter-pivot",
    company: "빙수 전문점 겨울 전환",
    situation: "seasonal-slump",
    oneLiner: "빙수 전문점이 겨울에 호떡·붕어빵으로 전환해 비수기 매출 공백을 메웠습니다",
    lesson: "계절 업종은 비수기 전환 메뉴가 생존 조건",
    applicableTo: ["food", "cafe-dessert"],
  },
  {
    id: "samsung-counter-invest",
    company: "삼성 반도체",
    situation: "seasonal-slump",
    oneLiner: "반도체 불황기에 오히려 설비 투자를 늘려 경쟁사가 줄일 때 생산 능력을 확보, 호황기에 시장을 석권했습니다",
    lesson: "비수기에 시설/교육 투자하면 성수기에 빛납니다",
    applicableTo: ["food", "cafe-dessert", "fitness", "space", "education", "retail", "beauty", "pet"],
  },

  // ═══ 신규: expansion-ready (3) ═══
  {
    id: "kyochon-2nd-store",
    company: "교촌치킨",
    situation: "expansion-ready",
    oneLiner: "1호점의 운영 매뉴얼을 완벽히 만든 후에야 2호점을 열었고, 지금 1,377개 매장으로 성장했습니다",
    lesson: "2호점 전에 1호점이 사장 없이 돌아가는지 확인하세요",
    applicableTo: ["food", "cafe-dessert", "retail", "beauty", "fitness", "education", "pet"],
  },
  {
    id: "starbucks-overexpansion",
    company: "스타벅스",
    situation: "expansion-ready",
    oneLiner: "2008년 과잉 확장으로 품질이 하락하자 900개 매장을 폐점하고 기본기를 다시 잡았습니다",
    lesson: "수익성 없는 확장은 전체를 위험에 빠뜨립니다",
    applicableTo: ["food", "cafe-dessert", "beauty", "fitness", "retail", "education", "pet", "space"],
  },
  {
    id: "danggeun-expansion",
    company: "당근마켓",
    situation: "expansion-ready",
    oneLiner: "1개 지역(판교)에서 1,000명의 이웃으로 완벽히 검증한 후에야 다른 지역으로 확장했습니다",
    lesson: "확장은 현재 모델이 복제 가능할 때만",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ═══ 신규: staff-crisis (3) ═══
  {
    id: "netflix-culture-deck",
    company: "넷플릭스",
    situation: "staff-crisis",
    oneLiner: "'자유와 책임' 문화 데크를 공개해 채용 기준을 투명하게 밝혔고, 최고 인재가 스스로 찾아왔습니다",
    lesson: "채용 기준을 공개하면 맞는 사람이 찾아옵니다",
    applicableTo: ["startup-tech"],
  },
  {
    id: "costco-wages",
    company: "코스트코",
    situation: "staff-crisis",
    oneLiner: "업계 평균 2배 급여를 지급해 이직률을 업계 최저로 유지, 교육 비용을 절감하고 서비스 품질을 높였습니다",
    lesson: "좋은 대우가 이직률을 낮추고 서비스를 높입니다",
    applicableTo: ["retail", "food", "cafe-dessert", "beauty", "fitness", "education", "pet", "living-service"],
  },
  {
    id: "toss-hiring",
    company: "토스",
    situation: "staff-crisis",
    oneLiner: "학력 무관, 실력 테스트 중심으로 채용해 기존 금융권이 놓친 인재를 확보했습니다",
    lesson: "이력서보다 실제 과제 결과로 평가하세요",
    applicableTo: ["startup-tech"],
  },

  // ═══ 신규: rent-crisis (3) ═══
  {
    id: "moms-touch-relocation",
    company: "맘스터치",
    situation: "rent-crisis",
    oneLiner: "임대료가 비싼 골목에서 학원가로 리로케이션, 매출이 265% 증가하고 면적당 매출 1위가 됐습니다",
    lesson: "비싼 자리가 좋은 자리는 아닙니다. 리로케이션을 검토하세요",
    applicableTo: ["food", "cafe-dessert", "retail", "beauty", "education"],
  },
  {
    id: "compose-small-store",
    company: "컴포즈커피",
    situation: "rent-crisis",
    oneLiner: "초소형 매장(5-10평)으로 임대료 비율을 8%로 유지, 면적당 효율 저가 커피 1위를 달성했습니다",
    lesson: "매장 크기를 줄이면 임대료 부담이 줄어듭니다",
    applicableTo: ["cafe-dessert", "food", "retail"],
  },
  {
    id: "wework-rent-failure",
    company: "위워크",
    situation: "rent-crisis",
    oneLiner: "장기 임대+단기 전대 모델에서 고정 임대료가 매출을 초과, 결국 파산 신청에 이르렀습니다",
    lesson: "고정 임대료가 매출의 15%를 넘으면 구조 재검토",
    applicableTo: ["food", "cafe-dessert", "retail", "beauty", "fitness", "space", "living-service", "education", "pet"],
  },

  // ═══ 신규 (2026-05-09) — 한국 SMB·스타트업·글로벌 AI 50선 ═══

  // ── 한국 동네 빵집·카페·외식 (8) ──
  {
    id: "sungsimdang",
    company: "성심당 (대전)",
    situation: "scaling-decision",
    oneLiner: "전국 진출 거부, 대전에만 머물며 'Only here' 가치로 연 매출 5,000억 달성",
    lesson: "확장보다 *지역 독점성* 으로 가격 결정권 확보 — 모든 매장 직영, 본점만 운영",
    applicableTo: ["food", "cafe-dessert", "retail"],
  },
  {
    id: "london-bagel-museum",
    company: "런던베이글뮤지엄",
    situation: "menu-fatigue",
    oneLiner: "뉴욕 정통 X, 한국식 (쪽파·단팥·크림치즈) 변형으로 줄 서는 매장 — 콘텐츠 경험 자체가 상품",
    lesson: "원조 답습 X, *우리 시장 입맛* 으로 재해석. 인스타 = 광고비 0원 PR",
    applicableTo: ["food", "cafe-dessert"],
  },
  {
    id: "noted-donut",
    company: "노티드 도넛",
    situation: "expansion-ready",
    oneLiner: "도넛 전문 신생, 시그니처 단일 메뉴 (크림 도넛) + 인스타 노출로 빠른 확장",
    lesson: "1개 시그니처에 집중 → 차별화 + 인스타 자연 PR",
    applicableTo: ["food", "cafe-dessert"],
  },
  {
    id: "saemaul-sikdang",
    company: "백종원 새마을식당",
    situation: "scaling-decision",
    oneLiner: "한식 점포당 매출 7.2억 달성 — 시그니처 (열탄불고기) + 본사 통합 물류",
    lesson: "프랜차이즈 = 시그니처 메뉴 + 통합 물류 + 25평 이상 홀 매출",
    applicableTo: ["food"],
  },
  {
    id: "kimbap-cheonguk-rebound",
    company: "김밥집 (간이음식점)",
    situation: "small-biz-turnaround",
    oneLiner: "고물가 시대 가성비 회귀 — 간이음식점 매출 4년간 70.3% 증가, 배달·포장 비중 핵심",
    lesson: "경기 위축기엔 *저가 회전형* 이 성장. 배달앱 + 포장 비중 50%↑",
    applicableTo: ["food"],
  },
  {
    id: "low-cost-cafe",
    company: "메가커피·컴포즈커피 (저가 카페)",
    situation: "small-biz-turnaround",
    oneLiner: "1,500원 커피로 비알코올 음료점 매출 4년 +47.3%, 1일1커피 일상화",
    lesson: "카페 시장 = 가격 vs 경험 양극화. 가격 선택 시 *회전율* 극대화 필수",
    applicableTo: ["cafe-dessert"],
  },
  {
    id: "myeongdong-gyoja",
    company: "명동교자",
    situation: "competitor-pressure",
    oneLiner: "단일 메뉴 (칼국수·만두) 50년 — 메뉴 다양화 X, 회전율과 품질로 줄 서는 매장",
    lesson: "메뉴 단순화 = 품질 일관성 + 회전율. *집중* 이 경쟁자 못 따라옴",
    applicableTo: ["food"],
  },
  {
    id: "letter-cake-shop",
    company: "1인 레터링케이크 매장",
    situation: "small-biz-turnaround",
    oneLiner: "1인 운영 + 고부가가치 (3-5만원/케이크) + 인스타 직접 주문 — 마진 50%+",
    lesson: "1인 매장 = 고부가가치 단가 × 인스타 DM 주문 = 인건비 0",
    applicableTo: ["cafe-dessert", "retail"],
  },

  // ── 한국 동네 미용·헬스·교육·펫 (5) ──
  {
    id: "neighborhood-hair-salon",
    company: "동네 미용실 (단골 3회 룰)",
    situation: "competitor-pressure",
    oneLiner: "편의점보다 많은 미용실 레드오션 — 단골 1명 확보까지 평균 3회 방문 필요",
    lesson: "신규 1회 < 단골 3회. 첫 3회 *고객 기록* + *맞춤 추천* 으로 단골 전환",
    applicableTo: ["beauty"],
  },
  {
    id: "pet-humanization-grooming",
    company: "펫 휴머니제이션 미용실",
    situation: "small-biz-turnaround",
    oneLiner: "펫샵·애견카페 6.8% 감소 중에도 펫 미용실은 고급화·과학화로 매출 유지",
    lesson: "양 감소 시장 = 고급화 + 차별화. '내 가족' 콘셉트 + 건강 데이터 기록",
    applicableTo: ["pet"],
  },
  {
    id: "fitness-studio-pivot",
    company: "필라테스 스튜디오 (소형 스튜디오)",
    situation: "seasonal-slump",
    oneLiner: "여름·연말 비수기 (-30%) — 회원제 + 6개월 패키지로 흐름 평탄화",
    lesson: "비수기 흐름 평탄화 = 장기 패키지 가격 할인. 한 번에 6개월 결제 유도",
    applicableTo: ["fitness"],
  },
  {
    id: "math-academy-niche",
    company: "동네 수학 학원 (1:1 소수정예)",
    situation: "competitor-pressure",
    oneLiner: "대형 학원 vs 1:1 맞춤 — 합격 사례 + 부모 상담으로 입소문 차별화",
    lesson: "대형 경쟁 시 *개별 진도* + *부모 신뢰* 가 가격 차이 정당화",
    applicableTo: ["education"],
  },
  {
    id: "pet-cafe-vacc-record",
    company: "펫카페 (백신 기록 시스템)",
    situation: "competitor-pressure",
    oneLiner: "거주 동물 백신 기록 + 환기 모니터링 공개 — 신뢰도 ↑ 재방문 60%↑",
    lesson: "투명성이 경쟁 우위. 데이터 공개 자체가 마케팅",
    applicableTo: ["pet"],
  },

  // ── 한국 스타트업 (10) ──
  {
    id: "toss-pivot",
    company: "토스 (Toss)",
    situation: "pmf-not-found",
    oneLiner: "송금 앱 1개 기능에서 시작 → 핀테크 슈퍼앱 — 첫 PMF 검증에 3년 3개월",
    lesson: "단일 기능 → PMF 검증 → 점진 확장. 처음부터 슈퍼앱 X",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "wrtn-mau",
    company: "뤼튼 (Wrtn)",
    situation: "expansion-ready",
    oneLiner: "AI 포털 1년 10개월 만에 MAU 500만 — 토스보다 2배 빠른 성장 + 누적 투자 1,000억",
    lesson: "B2C AI = 무료 + 즉시 가치 + 입소문. 진입 빠른 AI 포털이 장기 lock-in",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "upstage-unicorn",
    company: "업스테이지 (Upstage)",
    situation: "expansion-ready",
    oneLiner: "한국 첫 생성형 AI 유니콘 — Solar LLM + Document Parse 로 시리즈C $125.9M",
    lesson: "B2B AI = 도메인 특화 (문서 처리) + 전세계 frontier 모델 10대 진입",
    applicableTo: ["startup-tech"],
  },
  {
    id: "lunit-medical-ai",
    company: "Lunit (의료 AI)",
    situation: "pmf-not-found",
    oneLiner: "유방·흉부 X-ray AI 분석으로 글로벌 의료시장 진입 — '암 정복' 미션 + 데이터 우위",
    lesson: "의료 AI = 도메인 깊이 + 임상 데이터 + 규제 통과. 시간 오래 걸리지만 lock-in 강함",
    applicableTo: ["startup-tech"],
  },
  {
    id: "qanda-mathpresso",
    company: "콴다 (Mathpresso)",
    situation: "expansion-ready",
    oneLiner: "수학 문제 OCR → AI 풀이 — 미국 (Prep.Pie) 진출, 글로벌 학습앱",
    lesson: "Edu AI = OCR + 단계 풀이 + 다국가 진출. 한국 검증 후 미국",
    applicableTo: ["startup-tech", "education"],
  },
  {
    id: "coupang-loss-to-profit",
    company: "쿠팡",
    situation: "funding-crisis",
    oneLiner: "10년 적자 누적 후 2024 흑자 전환 — 로켓배송 인프라 투자 회수",
    lesson: "장기 인프라 투자 = 단기 적자 견디는 capital + 명확한 retention metric",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "yanolja-globalization",
    company: "야놀자",
    situation: "scaling-decision",
    oneLiner: "한국 모텔 예약 → 글로벌 트래블테크 (인터파크 인수, 인도 진출)",
    lesson: "단일 시장 PMF → 인접 시장 (호텔·외국 등) 확장 + M&A 성장",
    applicableTo: ["startup-tech"],
  },
  {
    id: "musinsa-community",
    company: "무신사",
    situation: "small-biz-turnaround",
    oneLiner: "패션 커뮤니티 (무신사 매거진) → 패션 거인 — 콘텐츠 → 커머스 자연 전환",
    lesson: "커뮤니티 = 데이터 + 신뢰 + 무료 트래픽. 커머스 전환은 공동체 마지막 단계",
    applicableTo: ["online-digital", "retail"],
  },
  {
    id: "kurly-ipo-pressure",
    company: "마켓컬리",
    situation: "funding-crisis",
    oneLiner: "신선식품 새벽배송 + 적자 누적 + IPO 시도 — 자본 압박 속에서도 카테고리 1위",
    lesson: "차별화 인프라 (콜드체인) + 자본 조달 + 명확한 카테고리 리더십",
    applicableTo: ["online-digital"],
  },
  {
    id: "baemin-1st",
    company: "우아한형제들 (배민)",
    situation: "competitor-pressure",
    oneLiner: "배달 시장 후발주자 → 점유율 1위 — 디자인·브랜드·B마트 다각화",
    lesson: "후발주자 = 브랜드 차별화 + 인접 카테고리 (B마트). 가격 경쟁 X",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ── 글로벌 AI 스타트업 (10) ──
  {
    id: "anthropic-spinout",
    company: "Anthropic",
    situation: "talent-acquisition",
    oneLiner: "OpenAI 출신 7명 (Dario·Daniela Amodei) 분사 → Claude 시리즈 + Constitutional AI 연구",
    lesson: "팀의 *내부 가치관 분기* 가 분사 이유 — 공동창업 시 mission alignment 사전 점검",
    applicableTo: ["startup-tech"],
  },
  {
    id: "scale-ai-meta-acquihire",
    company: "Scale AI",
    situation: "expansion-ready",
    oneLiner: "데이터 라벨링 → AI 인프라 거인 — 메타가 핵심 인재 acquihire ($14.3B)",
    lesson: "AI 시대 = 데이터 라벨링 인프라가 가장 가치 있는 자원. 인재가 곧 회사",
    applicableTo: ["startup-tech"],
  },
  {
    id: "cursor-anysphere",
    company: "Cursor (Anysphere)",
    situation: "competitor-pressure",
    oneLiner: "AI 코딩 IDE — $2B ARR, F500 60% 사용. OpenAI/Anthropic 경쟁 속 자체 모델 출시",
    lesson: "FE 영역 (IDE) 잡고 + 백엔드 모델 (자체) 점진 내재화 — 의존성 줄이기",
    applicableTo: ["startup-tech"],
  },
  {
    id: "cognition-devin-windsurf",
    company: "Cognition AI (Devin + Windsurf 인수)",
    situation: "expansion-ready",
    oneLiner: "자율 코딩 에이전트 + Windsurf 인수 ($250M) — 2025.12 가장 복잡한 M&A",
    lesson: "AI 시대 M&A = 인재 + 제품 + ARR 동시 — Google licensing 까지 끌어내",
    applicableTo: ["startup-tech"],
  },
  {
    id: "manus-ai-singapore",
    company: "Manus AI (Butterfly Effect)",
    situation: "funding-crisis",
    oneLiner: "메타 인수 무산 (중국 NDRC 차단) → Wuhan/Beijing → Singapore 본사 이전",
    lesson: "지정학적 리스크 = HQ 이전·구조조정. 중국→해외 이전 가능성 사전 검토",
    applicableTo: ["startup-tech"],
  },
  {
    id: "lovable-100m-arr",
    company: "Lovable",
    situation: "expansion-ready",
    oneLiner: "AI 앱 빌더 — 8개월 만에 $100M ARR (역대 최속). 6개월에 $6.6B 가치",
    lesson: "AI 앱 빌더 = 비개발자도 앱 만드는 새 시장. PLG 핵심",
    applicableTo: ["startup-tech"],
  },
  {
    id: "replit-agent-resurrection",
    company: "Replit",
    situation: "small-biz-turnaround",
    oneLiner: "정체기에서 Agent 출시 후 9개월 만에 $10M → $100M ARR 부활",
    lesson: "정체 = 신제품 (AI Agent) 추가로 부활 가능. 기존 사용자에 재판매",
    applicableTo: ["startup-tech"],
  },
  {
    id: "stripe-payment-rails",
    company: "Stripe",
    situation: "competitor-pressure",
    oneLiner: "PayPal·기존 결제 vs 7줄 코드로 결제 통합 — 개발자 친화 API 가 거인 됨",
    lesson: "복잡한 인프라 = 단순화 (DX) 만으로 시장 잡음. 개발자 = 첫 사용자",
    applicableTo: ["startup-tech"],
  },
  {
    id: "notion-pmf-pivot",
    company: "Notion",
    situation: "pmf-not-found",
    oneLiner: "초기 어려움 + 코드 전면 재작성 → 2016 재출시 — 개인 → 엔터프라이즈 자연 확장",
    lesson: "초기 PMF 실패 = 코드 재작성도 OK. 단순함이 핵심. 개인 → 팀 → 기업",
    applicableTo: ["startup-tech"],
  },
  {
    id: "figma-collaboration",
    company: "Figma",
    situation: "competitor-pressure",
    oneLiner: "Adobe 독점 시장 → 브라우저 기반 협업 디자인 — Adobe $20B 인수 (좌초)",
    lesson: "기존 거인 vs 협업 ON 하나로 차별화. 브라우저 = 혁신의 무기",
    applicableTo: ["startup-tech"],
  },

  // ── 글로벌 스타트업 피벗·부트스트랩 (10) ──
  {
    id: "slack-tiny-speck-pivot",
    company: "Slack (Tiny Speck → Slack)",
    situation: "pmf-not-found",
    oneLiner: "게임 Glitch 실패 (2012) → 사내 메시저로 피벗 → 2014 유니콘. Salesforce $27.7B 인수",
    lesson: "실패 제품의 *부산물* 이 진짜 사업. 사내 도구가 시장 도구로 바뀐 사례",
    applicableTo: ["startup-tech"],
  },
  {
    id: "twitter-odeo-pivot",
    company: "Twitter (Odeo → Twitter)",
    situation: "pmf-not-found",
    oneLiner: "팟캐스트 플랫폼 Odeo, 애플 iTunes 등장으로 위기 → 직원이 마이크로블로깅 제안",
    lesson: "외부 위협 = 빠른 피벗. 임직원 *내부 아이디어* 에서 다음 사업 발굴",
    applicableTo: ["startup-tech"],
  },
  {
    id: "youtube-dating-pivot",
    company: "YouTube",
    situation: "pmf-not-found",
    oneLiner: "데이팅 사이트 (영상 자기소개) → 사용자 호응 X → 모든 영상 업로드로 피벗",
    lesson: "사용자가 *원래 의도* 와 다르게 사용하면 그쪽이 PMF. 데이터 따라가기",
    applicableTo: ["startup-tech"],
  },
  {
    id: "instagram-burbn-pivot",
    company: "Instagram (Burbn → Instagram)",
    situation: "pmf-not-found",
    oneLiner: "다기능 앱 (체크인·포인트) → 사진 공유 단일 기능 집중 → 18개월에 페북 $1B 인수",
    lesson: "기능 풍부 ≠ 좋은 PMF. *1개 기능 잘되는 것* 잡으면 빠른 성장",
    applicableTo: ["startup-tech"],
  },
  {
    id: "discord-game-pivot",
    company: "Discord",
    situation: "pmf-not-found",
    oneLiner: "게임 음성채팅 → 모든 커뮤니티 채팅으로 확장 — 게이머 외 사용자 폭발",
    lesson: "사용자가 *원래 의도 외* 사용처 만들면 거기에 자원 투자",
    applicableTo: ["startup-tech"],
  },
  {
    id: "twitch-justin-pivot",
    company: "Twitch (Justin.tv → Twitch)",
    situation: "pmf-not-found",
    oneLiner: "라이프 스트리밍 Justin.tv → 게임 카테고리만 분리 → 아마존 $970M 인수",
    lesson: "전체 시장보다 *세그먼트 1개* 가 폭발하면 그것만 분리. 나머지 버려도 OK",
    applicableTo: ["startup-tech"],
  },
  {
    id: "calendly-bootstrap",
    company: "Calendly",
    situation: "expansion-ready",
    oneLiner: "부트스트랩 7년 → ARR $276M — 무료 가입 + 무한 미팅 링크 = PLG 교과서",
    lesson: "VC 자본 X 도 가능. 단일 기능 + 무료 가입 + 명확한 가치",
    applicableTo: ["startup-tech"],
  },
  {
    id: "airtable-saas",
    company: "Airtable",
    situation: "expansion-ready",
    oneLiner: "스프레드시트+DB — $11.7B 가치, $478M ARR (2025), 50만 고객. PLG + 엔터프라이즈",
    lesson: "노코드 데이터베이스 = 스프레드시트 위에 가치 추가. 사용자 → 팀 → 기업",
    applicableTo: ["startup-tech"],
  },
  {
    id: "supabase-bootstrap",
    company: "Supabase",
    situation: "competitor-pressure",
    oneLiner: "Firebase 대안 (오픈소스 PostgreSQL) — 개발자 PLG + 무료 시작",
    lesson: "거인 vs 오픈소스. 개발자 신뢰 + 자체 호스팅 옵션 = 거인 못 막는 차별화",
    applicableTo: ["startup-tech"],
  },
  {
    id: "shopify-snowdevil",
    company: "Shopify (SnowDevil → Shopify)",
    situation: "pmf-not-found",
    oneLiner: "스노보드 쇼핑몰 만들려다 → 만들 도구가 없어 직접 만든 플랫폼이 글로벌 거인",
    lesson: "내가 필요한 도구 = 다른 사람도 필요한 도구. 자기 문제 해결이 사업",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ── 글로벌 외식·소매 거인 (7) ──
  {
    id: "chipotle-single-store",
    company: "Chipotle",
    situation: "small-biz-turnaround",
    oneLiner: "1993 한 매장 (Steve Ells) → 글로벌 멕시코 체인 — 신선재료 + 단순 메뉴 + 조립식",
    lesson: "프랜차이즈 = 메뉴 단순화 + 신선 + 조립식. 인건비 줄임",
    applicableTo: ["food"],
  },
  {
    id: "shake-shack-cart",
    company: "Shake Shack",
    situation: "small-biz-turnaround",
    oneLiner: "Madison Square Park 핫도그 카트 → 글로벌 햄버거 체인 — 작게 시작, 입소문",
    lesson: "단일 위치 + 한정 메뉴 + 줄 서기 = 도시형 브랜드 자산",
    applicableTo: ["food"],
  },
  {
    id: "five-guys-family",
    company: "Five Guys",
    situation: "small-biz-turnaround",
    oneLiner: "1986 가족 사업 (5명 아들) → 미국 햄버거 체인 — 한정 메뉴 + 프리 토핑 + 무광고",
    lesson: "광고 0원 + 입소문. 한정 메뉴로 품질 일관성 + 프리 토핑으로 차별화",
    applicableTo: ["food"],
  },
  {
    id: "in-n-out-simple",
    company: "In-N-Out Burger",
    situation: "competitor-pressure",
    oneLiner: "메뉴 4개 (버거·치즈·더블·감튀) 70년 — 신선·품질·낮은 회전율로 컬트 브랜드",
    lesson: "메뉴 단순함 = 품질 + 직원 효율. 70년 가치 변하지 않음",
    applicableTo: ["food"],
  },
  {
    id: "costco-membership",
    company: "Costco",
    situation: "competitor-pressure",
    oneLiner: "회원제 + 적은 SKU (4,000개) + 14% 마진 캡 — 회원 갱신율 91%",
    lesson: "고객을 회원으로 만들면 lock-in. 적은 SKU 로 협상력 + 마진 양보",
    applicableTo: ["retail"],
  },
  {
    id: "trader-joes-private",
    company: "Trader Joe's",
    situation: "competitor-pressure",
    oneLiner: "PB 80% + 매장 작게 + 직원 제복 → 연 $13B (Walmart 대비 평당 매출 2배)",
    lesson: "PB = 마진 + 차별화. 작은 매장 = 회전율. 직원 = 브랜드 자산",
    applicableTo: ["retail", "food"],
  },
  {
    id: "starbucks-3rd-place",
    company: "Starbucks",
    situation: "scaling-decision",
    oneLiner: "이탈리아 카페 영감 → 미국 '제3의 공간' (집·직장·카페) 포지셔닝 → 글로벌",
    lesson: "공간 자체가 상품. 커피보다 *체류 시간* 으로 객단가 + 재방문",
    applicableTo: ["cafe-dessert"],
  },

  // ═══ 비용 위기 (추가) ═══
  {
    id: "chipotle-recovery",
    company: "Chipotle",
    situation: "cost-crisis",
    oneLiner: "E.coli 사태로 매출 44% 급감. 신임 CEO가 디지털 채널·2번째 조리라인 도입 후 주가 사상 최고치 회복",
    lesson: "위기는 혁신의 계기, 디지털 채널이 돌파구다",
    applicableTo: ["food"],
  },
  {
    id: "mcdonalds-simplify",
    company: "McDonald's",
    situation: "cost-crisis",
    oneLiner: "2015년 메뉴 단순화로 주문 속도 20% 개선, 종일 아침 메뉴 도입 후 동일매장 매출 +5.7% 달성",
    lesson: "메뉴를 줄이면 원가도 운영도 좋아진다",
    applicableTo: ["food"],
  },
  {
    id: "starbucks-back",
    company: "Starbucks",
    situation: "cost-crisis",
    oneLiner: "'Back to Starbucks' 전략으로 메뉴 100개 삭제·AI 노동 스케줄링 도입, 인건비 최적화에 성공",
    lesson: "선택과 집중이 원가율을 낮춘다",
    applicableTo: ["cafe-dessert"],
  },
  {
    id: "megacoffee-upsell",
    company: "메가커피",
    situation: "cost-crisis",
    oneLiner: "저가 커피 시장에서 디저트 라인·손흥민 광고로 객단가 상승, 저가 시장에서 이익률 방어 성공",
    lesson: "객단가를 올리면 원가율이 자연히 떨어진다",
    applicableTo: ["cafe-dessert"],
  },
  {
    id: "compose-roasting",
    company: "컴포즈커피",
    situation: "cost-crisis",
    oneLiner: "자체 로스팅 공장 운영으로 생두 원가 직접 통제, 20%+ 영업이익률 유지하며 4,700억 M&A 달성",
    lesson: "원재료 내재화가 원가 경쟁력의 핵심이다",
    applicableTo: ["cafe-dessert"],
  },
  {
    id: "bhc-supply",
    company: "BHC 치킨",
    situation: "cost-crisis",
    oneLiner: "물류센터·생산시설 내재화·통합구매로 원가 통제, 치킨 빅3 중 유일하게 이익률 독주",
    lesson: "공급망 내재화가 프랜차이즈 수익성의 핵심",
    applicableTo: ["food"],
  },
  {
    id: "sweetgreen-value",
    company: "Sweetgreen",
    situation: "cost-crisis",
    oneLiner: "가격 인상 대신 단백질 양 25% 증량·시즌 메뉴 강화로 객단가 방어, 원가 압박을 가치 강화로 돌파",
    lesson: "가격 대신 가치를 높여 원가 압박을 돌파하라",
    applicableTo: ["food"],
  },
  {
    id: "shakeshack-focus",
    company: "Shake Shack",
    situation: "cost-crisis",
    oneLiner: "핵심 메뉴 36개만 고집, 메뉴 집중화로 5년간 매출 57% 성장하며 패스트캐주얼 롤모델 등극",
    lesson: "메뉴 수를 줄이면 수익이 오른다",
    applicableTo: ["food"],
  },
  {
    id: "oasis-market",
    company: "오아시스마켓",
    situation: "cost-crisis",
    oneLiner: "쿠팡·컬리가 적자 감수하는 새벽배송 시장에서 직매입 최소화·회전율 극대화, 유일한 흑자 새벽배송 브랜드",
    lesson: "물류 구조 설계가 흑자와 적자를 가른다",
    applicableTo: ["online-digital", "food"],
  },
  {
    id: "daangn-ad-model",
    company: "당근마켓",
    situation: "cost-crisis",
    oneLiner: "352억 적자에서 하이퍼로컬 광고 모델로 전환, 광고가 매출의 99.6% 차지하며 첫 흑자 달성",
    lesson: "무료 플랫폼의 수익은 광고에서 나온다",
    applicableTo: ["online-digital"],
  },
  {
    id: "olive-garden-ops",
    company: "Olive Garden",
    situation: "cost-crisis",
    oneLiner: "이사회 교체 후 메뉴 단순화·식재료 재계약으로 원가 절감, 영업이익 +30% 달성",
    lesson: "비용 구조 개혁이 성장보다 먼저다",
    applicableTo: ["food"],
  },

  // ═══ 인재 확보 (추가) ═══
  {
    id: "stripe-hiring",
    company: "Stripe",
    situation: "talent-acquisition",
    oneLiner: "Collison 형제가 직접 주당 15시간 면접, '일요일 테스트'로 문화 적합성 검증 → 실리콘밸리 최강 엔지니어팀 구축",
    lesson: "창업자가 직접 뛰는 채용이 답이다",
    applicableTo: ["startup-tech"],
  },
  {
    id: "zappos-offer",
    company: "Zappos",
    situation: "talent-acquisition",
    oneLiner: "신입에게 $2,000 퇴사 제안으로 진심 검증, 98% 거절로 높은 진성 팀 구성·업계 최저 이직률 달성",
    lesson: "떠날 사람을 먼저 걸러야 팀이 강해진다",
    applicableTo: ["online-digital"],
  },
  {
    id: "quixey-puzzle",
    company: "Quixey",
    situation: "talent-acquisition",
    oneLiner: "온라인 퍼즐 챌린지로 숨은 엔지니어 발굴, 전통 채용 채널 밖의 인재 확보에 성공",
    lesson: "채용 광고보다 과제로 인재를 찾아라",
    applicableTo: ["startup-tech"],
  },
  {
    id: "kakao-mobile-first",
    company: "카카오",
    situation: "talent-acquisition",
    oneLiner: "모바일 퍼스트 전환 선언 후 스마트폰 개발자 집중 영입, 3개월 만에 카카오톡 출시·6개월 만에 100만 가입자",
    lesson: "방향이 정해지면 그 분야 인재만 집중 채용하라",
    applicableTo: ["startup-tech"],
  },
  {
    id: "toss-vision-recruit",
    company: "토스",
    situation: "talent-acquisition",
    oneLiner: "8번 실패로 팀원 이탈 반복 후 간편송금 성공, '사회를 바꾼다'는 비전으로 핵심 인재 재결집",
    lesson: "명확한 비전이 연봉보다 인재를 불러온다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "yanolja-rebuild",
    company: "야놀자",
    situation: "talent-acquisition",
    oneLiner: "경쟁사가 팀 전체를 스카우트했지만, 강한 비전으로 새 팀을 빌딩하여 숙박 앱 1위 달성",
    lesson: "비전이 팀보다 강하다",
    applicableTo: ["startup-tech", "space"],
  },

  // ═══ 마케팅 정체 (추가) ═══
  {
    id: "baemin-brand",
    company: "배달의민족",
    situation: "marketing-stagnant",
    oneLiner: "150억 적자를 감수하며 B급 유머 광고 집행, '팥빙수도 우리 민족이었어' 시리즈로 20·30대 팬덤 형성 → 업계 1위",
    lesson: "사랑받는 광고가 돈 쓰는 광고를 이긴다",
    applicableTo: ["food", "online-digital"],
  },
  {
    id: "daangn-growth",
    company: "당근마켓",
    situation: "marketing-stagnant",
    oneLiner: "수수료 포기하고 하이퍼로컬 광고에 집중, 2023년 광고 매출 전년비 2.5배 성장하며 첫 흑자 달성",
    lesson: "플랫폼의 성장은 지역 밀착 광고에서 나온다",
    applicableTo: ["online-digital"],
  },
  {
    id: "dsc-viral",
    company: "Dollar Shave Club",
    situation: "marketing-stagnant",
    oneLiner: "$4,500짜리 유머 영상이 72시간 만에 바이럴, 출시 당일 신규 고객 12,000명 확보",
    lesson: "단 한 편의 영상이 사업을 바꿀 수 있다",
    applicableTo: ["online-digital", "retail"],
  },
  {
    id: "glossier-community",
    company: "Glossier",
    situation: "marketing-stagnant",
    oneLiner: "블로그 'Into The Gloss'로 팬덤 먼저 구축, 제품 출시 전 수천 명 잠재 고객 확보·2017년 매출 600% 성장",
    lesson: "팔기 전에 커뮤니티를 먼저 만들어라",
    applicableTo: ["beauty", "online-digital"],
  },
  {
    id: "warby-parker-pr",
    company: "Warby Parker",
    situation: "marketing-stagnant",
    oneLiner: "출시와 함께 PR로 사이트 마비, 15개 스타일 4주 만에 품절·대기자 2만 명·홈 트라이온으로 전환율 극대화",
    lesson: "입소문이 광고비를 이긴다",
    applicableTo: ["retail", "online-digital"],
  },
  {
    id: "duolingo-retention",
    company: "Duolingo",
    situation: "marketing-stagnant",
    oneLiner: "신규 유입보다 기존 유저 잔존에 집중, CURR 21% 개선으로 DAU 4.5배 성장",
    lesson: "신규 고객보다 기존 고객 유지가 6배 효과적이다",
    applicableTo: ["education", "online-digital"],
  },
  {
    id: "dropbox-demo",
    company: "Dropbox",
    situation: "marketing-stagnant",
    oneLiner: "복잡한 광고 대신 단순 데모 영상 하나로 대기자 7.5만→75만 명, 광고비 없이 유저 10배 성장",
    lesson: "복잡한 광고보다 단순한 시연을 보여라",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "jikbang-trust",
    company: "직방",
    situation: "marketing-stagnant",
    oneLiner: "허위매물 보상제·부동산 광고 실명제 추진으로 신뢰 회복, 신뢰 자체가 핵심 마케팅 전략이 됨",
    lesson: "신뢰가 최고의 마케팅이다",
    applicableTo: ["online-digital"],
  },
  {
    id: "airbnb-craigslist",
    company: "에어비앤비",
    situation: "marketing-stagnant",
    oneLiner: "Craigslist 크로스포스팅 해킹으로 수백만 잠재 고객에 노출, 초기 유료 마케팅 없이 사용자 900% 성장",
    lesson: "기존 플랫폼 활용이 최고의 그로스 해킹이다",
    applicableTo: ["online-digital", "space"],
  },
  {
    id: "yelp-pivot",
    company: "Yelp",
    situation: "marketing-stagnant",
    oneLiner: "이메일 추천 서비스 실패 후 사용자가 자발적으로 쓰는 리뷰 행동 발견, 피벗해 세계 최대 로컬 리뷰 플랫폼으로 성장",
    lesson: "사용자가 만드는 콘텐츠가 최강 마케팅이다",
    applicableTo: ["online-digital"],
  },
  {
    id: "groupon-pivot",
    company: "Groupon",
    situation: "marketing-stagnant",
    oneLiner: "사회 캠페인 사이트 The Point 실패 후 집단 할인 쿠폰으로 피벗, 상장 시 기업가치 $16B 달성",
    lesson: "실패한 아이디어 안에 성공이 숨어있다",
    applicableTo: ["online-digital"],
  },
  {
    id: "kakaotalk-free",
    company: "카카오톡",
    situation: "marketing-stagnant",
    oneLiner: "무료 정책 고수로 플랫폼 선점, 2012년 '카카오게임하기' 도입으로 첫 흑자·연간 매출 1조 달성",
    lesson: "먼저 쓰게 하고 나중에 수익화하라",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ═══ 메뉴 피로 (추가) ═══
  {
    id: "sweetgreen-seasonal",
    company: "Sweetgreen",
    situation: "menu-fatigue",
    oneLiner: "계절별 메뉴 로테이션 운영, 인기 시즌 메뉴를 상설화해 단골 요청 수용·고객 이탈 방지",
    lesson: "인기 메뉴는 상설화로 단골을 잡아라",
    applicableTo: ["food"],
  },
  {
    id: "starbucks-japan-season",
    company: "Starbucks Japan",
    situation: "menu-fatigue",
    oneLiner: "봄 사쿠라·여름 프라푸치노·겨울 한정 굿즈로 사계절 이벤트 구조화, 비수기 없는 매출 스케줄 설계",
    lesson: "계절마다 새로운 이유를 주면 재방문이 따라온다",
    applicableTo: ["cafe-dessert"],
  },
  {
    id: "starbucks-kr-fomo",
    company: "스타벅스 코리아",
    situation: "menu-fatigue",
    oneLiner: "매 시즌 한정 굿즈·음료 출시, '이번 시즌 놓치면 없다'는 FOMO로 정기 방문 행동 유도",
    lesson: "희소성이 재방문을 만든다",
    applicableTo: ["cafe-dessert"],
  },
  {
    id: "lowcafe-food",
    company: "저가커피 업계",
    situation: "menu-fatigue",
    oneLiner: "떡볶이·컵치킨·라면 등 푸드 메뉴 추가로 객단가 상승, 일부 출시 직후 수십만 개 판매 달성",
    lesson: "카페도 밥집처럼 팔면 단골이 늘어난다",
    applicableTo: ["cafe-dessert"],
  },
  {
    id: "panera-quality",
    company: "Panera Bread",
    situation: "menu-fatigue",
    oneLiner: "비용 절감으로 품질 낮췄다 매출 5% 감소. 음식 품질 복구·토마토 생절단 등 원재료 복귀로 반등",
    lesson: "레시피를 타협하면 단골이 가장 먼저 떠난다",
    applicableTo: ["food"],
  },
  {
    id: "kyochon-freshness",
    company: "교촌치킨",
    situation: "menu-fatigue",
    oneLiner: "주 6일 신선 원육 배송 시스템 구축으로 품질 일관성 확보, 가맹점 폐업률 0%대·단골 재방문 유지",
    lesson: "신선도 일관성이 재방문을 만든다",
    applicableTo: ["food"],
  },
  {
    id: "restaurant-mealkit",
    company: "국내 도심 음식점",
    situation: "menu-fatigue",
    oneLiner: "인기 메뉴를 밀키트로 제작·판매, 오프라인 매장 매출 보완 및 브랜드 재인식 효과 동시 달성",
    lesson: "메뉴를 상품으로 만들면 판매 채널이 늘어난다",
    applicableTo: ["food"],
  },

  // ═══ 배달 의존 (추가) ═══
  {
    id: "kyochon-app",
    company: "교촌치킨",
    situation: "delivery-dependency",
    oneLiner: "2019년 자체 주문 앱 출시, 2020년 자체 앱으로만 650억 매출 달성·배달 플랫폼 수수료 의존 대폭 감소",
    lesson: "자체 앱이 플랫폼 수수료를 대체한다",
    applicableTo: ["food"],
  },
  {
    id: "dominos-own-channel",
    company: "Domino's",
    situation: "delivery-dependency",
    oneLiner: "자체 앱·사이트로 미국 매출의 85% 처리, 배달 플랫폼 의존 최소화하며 연매출 +6.4% 성장",
    lesson: "직접 주문 채널이 최고의 수수료 절감 전략이다",
    applicableTo: ["food"],
  },
  {
    id: "korea-franchise-app",
    company: "한국 프랜차이즈 업계",
    situation: "delivery-dependency",
    oneLiner: "코로나 이후 자체 앱 개발 붐, 가맹점 수수료 부담 절감 + 고객 데이터 직접 확보 효과 동시 달성",
    lesson: "자체 채널이 수수료와 고객 데이터를 모두 잡는다",
    applicableTo: ["food"],
  },
  {
    id: "kakao-order-direct",
    company: "한국 자영업 (카카오채널 주문)",
    situation: "delivery-dependency",
    oneLiner: "배달앱 수수료 평균 8.2% 부담에 전화·카카오채널 주문 병행, 단골 고객 직접 연결로 수수료 절감",
    lesson: "단골에게 직접 주문 채널을 안내하라",
    applicableTo: ["food"],
  },
  {
    id: "ghost-kitchen",
    company: "Ghost Kitchen (CloudKitchens)",
    situation: "delivery-dependency",
    oneLiner: "높은 임대료 식당 폐쇄 후 공유 주방 입점, 초기 투자 $20,000으로 운영·이익률 20~25% 달성",
    lesson: "공간을 포기하면 배달 수익이 살아난다",
    applicableTo: ["food"],
  },
  {
    id: "restaurant-data-direct",
    company: "미국 독립 레스토랑",
    situation: "delivery-dependency",
    oneLiner: "배달 플랫폼 수수료 15~30% 부담으로 자체 웹사이트 주문 유도, 고객 데이터 직접 확보 시작",
    lesson: "고객 데이터를 가진 자가 배달을 이긴다",
    applicableTo: ["food"],
  },

  // ═══ 계절 비수기 (추가) ═══
  {
    id: "peloton-subscription",
    company: "Peloton",
    situation: "seasonal-slump",
    oneLiner: "구독 기반 홈 피트니스로 비수기 없는 고정 매출 확보, 12개월 구독 전환률 73%로 일반 헬스장(35%) 압도",
    lesson: "구독 모델이 계절성을 이긴다",
    applicableTo: ["fitness"],
  },
  {
    id: "fitness-winter-campaign",
    company: "미국 피트니스 스튜디오",
    situation: "seasonal-slump",
    oneLiner: "'Finish Strong' 캠페인으로 11~12월 휴면 회원 재활성화, 1월 신규 고객 유입 극대화",
    lesson: "비수기 직전 선제 마케팅이 성수기를 만든다",
    applicableTo: ["fitness"],
  },
  {
    id: "plaiting-b2b",
    company: "플레이팅",
    situation: "seasonal-slump",
    oneLiner: "기업 대상 정기 구독 점심 서비스로 외식업 비수기 개념 제거, 안정적 B2B 수익 모델 확보",
    lesson: "B2B 구독이 소매 비수기를 없앤다",
    applicableTo: ["food"],
  },
  {
    id: "mychef-mealkit",
    company: "마이셰프",
    situation: "seasonal-slump",
    oneLiner: "사계절 배송 가능한 밀키트 제품군 확장, 2018~2020년 3년 연속 매출 3배 성장 달성",
    lesson: "계절 무관한 상품이 연간 매출을 안정시킨다",
    applicableTo: ["food", "online-digital"],
  },
  {
    id: "yanolja-travel",
    company: "야놀자",
    situation: "seasonal-slump",
    oneLiner: "국내 숙박 비수기 극복 위해 인터파크·트리플 인수, 계절 비수기 없는 종합 여행 사업자로 전환",
    lesson: "인접 카테고리 확장이 계절성을 제거한다",
    applicableTo: ["space", "online-digital"],
  },
  {
    id: "pet-grooming-package",
    company: "반려동물 미용 살롱",
    situation: "seasonal-slump",
    oneLiner: "월정액 그루밍 패키지 출시로 봄 성수기 집중 매출을 12개월 고정 수익으로 분산",
    lesson: "패키지 구독이 계절성을 평준화한다",
    applicableTo: ["pet"],
  },
  {
    id: "pet-online-training",
    company: "반려동물 훈련 살롱",
    situation: "seasonal-slump",
    oneLiner: "코로나 봉쇄 기간 온라인 강아지 훈련 클래스 출시, 첫 분기 500석 판매·고객 평생가치 25% 증가",
    lesson: "오프라인 비수기를 온라인이 채울 수 있다",
    applicableTo: ["pet"],
  },
  {
    id: "fitness-digital-offseason",
    company: "한국 헬스장",
    situation: "seasonal-slump",
    oneLiner: "평일 온라인 관리·주말 그룹 운동 결합, 앱 자동화로 PT 수익·온라인 강의 수익 동시 확보",
    lesson: "디지털 채널이 비수기 매출 공백을 채운다",
    applicableTo: ["fitness"],
  },

  // ═══ 인력 위기 (추가) ═══
  {
    id: "zappos-exit-offer",
    company: "Zappos",
    situation: "staff-crisis",
    oneLiner: "신규 입사자에게 $2,000 퇴사비 제안으로 진심 직원만 선별, 업계 최저 이직률·Fortune 최고 직장 수년 선정",
    lesson: "떠날 사람을 먼저 거르면 남은 팀이 강해진다",
    applicableTo: ["online-digital"],
  },
  {
    id: "restaurant-cross-train",
    company: "텍사스 레스토랑 그룹",
    situation: "staff-crisis",
    oneLiner: "전 직원 3개 역할 교차 훈련·시니어 멘토 제도 도입, 1년 내 이직률 40% 감소",
    lesson: "교차 훈련이 이직률을 낮춘다",
    applicableTo: ["food"],
  },
  {
    id: "salon-autonomy",
    company: "미국 살롱",
    situation: "staff-crisis",
    oneLiner: "구조조정 후 직원에게 일상 운영 권한을 위임, 적자에서 흑자로 전환",
    lesson: "권한 위임이 직원을 붙잡는다",
    applicableTo: ["beauty"],
  },
  {
    id: "compose-standardize",
    company: "컴포즈커피",
    situation: "staff-crisis",
    oneLiner: "자체 로스팅·표준화 공정으로 매장 직원 숙련도 의존도 최소화, 채용 문턱 낮춰 인력난 해결",
    lesson: "공정 표준화가 인력난을 해결한다",
    applicableTo: ["cafe-dessert"],
  },
  {
    id: "restaurant-turnover-cost",
    company: "미국 레스토랑 그룹",
    situation: "staff-crisis",
    oneLiner: "이직 증가 → 팀 부담 → 원가 악화 구조 발견, 이직 원인 제거 후 이익률 회복",
    lesson: "이직률과 원가율은 직결된다",
    applicableTo: ["food"],
  },
  {
    id: "gov-hiring-subsidy",
    company: "한국 중소기업",
    situation: "staff-crisis",
    oneLiner: "청년 정규직 채용 시 3년간 연 2,000만 원 정부 보조금 수혜, 임금 경쟁력 확보로 인재 유치 성공",
    lesson: "정부 인건비 지원을 적극 활용하라",
    applicableTo: ["all"],
  },

  // ═══ 임대료 위기 (추가) ═══
  {
    id: "shared-kitchen-kr",
    company: "한국 공유주방",
    situation: "rent-crisis",
    oneLiner: "전통 창업 대비 80~99% 낮은 초기 비용, 임대료·인건비 공동 절감으로 폐업률 낮추는 창업 방식 확산",
    lesson: "공유주방으로 고정비를 쪼개라",
    applicableTo: ["food"],
  },
  {
    id: "wework-renegotiate",
    company: "WeWork",
    situation: "rent-crisis",
    oneLiner: "전 세계 777개 지점 임대 재협상, 임대계약 590개 수정·종료로 미래 임대비 $127억 절감",
    lesson: "임대 재협상은 언제든 가능하다, 시작이 답이다",
    applicableTo: ["space", "startup-tech"],
  },
  {
    id: "ghost-kitchen-rent",
    company: "고스트 키친",
    situation: "rent-crisis",
    oneLiner: "높은 임대료 식당 폐쇄 후 공유 주방 입점, 초기 투자 $20,000으로 이익률 20~25% 달성",
    lesson: "공간을 포기하면 비용이 60% 줄어든다",
    applicableTo: ["food"],
  },
  {
    id: "salon-suite",
    company: "Salon Republic",
    situation: "rent-crisis",
    oneLiner: "개인 스타일리스트가 살롱 전체 임대 대신 스위트 단위 임대로 전환, 오버헤드 절감하며 독립 운영 성공",
    lesson: "공간을 쪼개면 미용실도 살아남는다",
    applicableTo: ["beauty"],
  },
  {
    id: "revenue-share-rent",
    company: "임대료 재협상 사례 (HBR)",
    situation: "rent-crisis",
    oneLiner: "임대료 감면·임시 유예·매출 비례 분담 협상으로 고정비 절감, 임대인도 공실보다 임차인 생존을 원한다",
    lesson: "매출 공유 방식으로 임대인을 설득하라",
    applicableTo: ["all"],
  },
  {
    id: "delivery-only-pivot",
    company: "한국 자영업자 (배달 전문 전환)",
    situation: "rent-crisis",
    oneLiner: "홀 운영 포기 후 주방만 남겨 배달 전문으로 전환, 임대료 50~70% 절감 사례 다수",
    lesson: "홀을 버리면 고정비가 절반으로 준다",
    applicableTo: ["food"],
  },

  // ═══ 매출 하락 (추가) ═══
  {
    id: "netflix-dvd-pivot",
    company: "넷플릭스",
    situation: "revenue-decline",
    oneLiner: "DVD 우편 임대 매출이 감소하자 스트리밍으로 전환, 2007~2010년 구독자 3배 성장·블록버스터 파산",
    lesson: "핵심 매출이 줄면 다음 모델로 빠르게 이동하라",
    applicableTo: ["online-digital", "startup-tech"],
  },
  {
    id: "lego-comeback",
    company: "레고",
    situation: "revenue-decline",
    oneLiner: "2003년 파산 위기에서 핵심 블록 제품군으로 복귀·라이선스 협업으로 매출 4년 만에 3배 반등",
    lesson: "복잡성을 줄이고 핵심으로 돌아가면 반등이 온다",
    applicableTo: ["retail", "startup-tech"],
  },
  {
    id: "apple-return",
    company: "애플",
    situation: "revenue-decline",
    oneLiner: "1997년 잡스 복귀 후 제품 라인 70% 삭제, 'Think Different' 캠페인과 iMac으로 1년 만에 흑자 전환",
    lesson: "제품을 줄이고 집중하면 브랜드가 살아난다",
    applicableTo: ["startup-tech", "retail"],
  },
  {
    id: "old-spice-rebrand",
    company: "Old Spice",
    situation: "revenue-decline",
    oneLiner: "노인 브랜드 이미지 탈피 위해 유머 바이럴 캠페인 집행, 6개월 만에 매출 125% 상승·SNS 팔로워 폭발적 증가",
    lesson: "브랜드 리프레시 하나로 매출 방향이 바뀐다",
    applicableTo: ["retail", "online-digital"],
  },
  {
    id: "dominos-honest-ad",
    company: "Domino's",
    situation: "revenue-decline",
    oneLiner: "'우리 피자는 맛없었다'는 솔직한 광고 캠페인으로 신뢰 회복, 2010년 이후 주가 5,000% 상승",
    lesson: "솔직한 자기 고백이 가장 강력한 반전 마케팅이다",
    applicableTo: ["food"],
  },

  // ═══ 인재 확보 (추가) ═══
  {
    id: "buffer-transparency",
    company: "Buffer",
    situation: "talent-acquisition",
    oneLiner: "전 직원 연봉·수익 공개 투명경영 도입, 수천 명 지원자 몰림·채용 비용 대폭 절감 및 팀 결속력 강화",
    lesson: "투명한 연봉 공개가 인재를 불러온다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "gitlab-remote",
    company: "GitLab",
    situation: "talent-acquisition",
    oneLiner: "전 세계 67개국 완전 원격 근무 도입, 지역 제한 없이 최고 인재 채용·IPO 시 기업가치 $11B 달성",
    lesson: "원격 근무가 인재 채용 반경을 무한대로 넓힌다",
    applicableTo: ["startup-tech"],
  },
  {
    id: "shopify-mission",
    company: "Shopify",
    situation: "talent-acquisition",
    oneLiner: "'기업가 정신 민주화' 미션으로 최고 인재 유치, 구글·아마존 오퍼를 거절한 엔지니어들이 자발적 지원",
    lesson: "강력한 미션이 연봉 경쟁을 이긴다",
    applicableTo: ["startup-tech", "online-digital"],
  },

  // ═══ 확장 결정 (추가) ═══
  {
    id: "coupang-logistics-bet",
    company: "쿠팡",
    situation: "scaling-decision",
    oneLiner: "2014년 로켓배송 직투자 결정으로 단기 적자 감수, 8년 뒤 NYSE 상장·시가총액 80조 달성",
    lesson: "확장 투자의 고통이 클수록 해자도 깊어진다",
    applicableTo: ["online-digital", "startup-tech"],
  },
  {
    id: "baemin-delivery",
    company: "배달의민족",
    situation: "scaling-decision",
    oneLiner: "배달대행 직접 운영 결정으로 초기 적자 감수, 배달앱·라이더·물류 수직 통합 후 Delivery Hero 40억불 매각",
    lesson: "수직 통합이 가장 강력한 확장 전략이다",
    applicableTo: ["food", "online-digital"],
  },
  {
    id: "toss-bank",
    company: "토스뱅크",
    situation: "scaling-decision",
    oneLiner: "핀테크 앱에서 인터넷 전문은행 인가 취득 결정, 2021년 출범 후 1년 만에 고객 수 800만·예수금 18조 달성",
    lesson: "검증된 고객 기반 위에서 확장하면 속도가 다르다",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "imvu-user-interviews",
    company: "IMVU",
    situation: "marketing-stagnant",
    oneLiner: "6개월간 매출 정체 후 사용자와 직접 대화 시작, 아바타 채팅 니즈 발견해 집중하여 월 매출 400만달러 달성",
    lesson: "성장이 멈추면 사용자와 직접 대화하라",
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "odeon-beauty-pivot",
    company: "에뛰드하우스",
    situation: "revenue-decline",
    oneLiner: "로드숍 매출 감소세에 헬리오시티 등 주거 근접 소형 매장·온라인 채널로 전환, 흑자 구조 회복",
    lesson: "채널 구조를 바꾸면 매출 방향도 바뀐다",
    applicableTo: ["beauty", "retail"],
  },
  {
    id: "nongshim-global",
    company: "농심",
    situation: "scaling-decision",
    oneLiner: "국내 라면 시장 포화 후 미국·중국 공장 직접 투자 결정, 넷플릭스 기생충 효과로 신라면 미국 매출 4년 만에 3배",
    lesson: "포화 시장에서의 답은 글로벌 확장이다",
    applicableTo: ["food", "retail"],
  },
];

// ─── 상황 자동 감지 ──────────────────────────────────────

export type SituationDetectionInput = {
  runway: number;           // -1 = 흑자
  monthlySales: number;
  weeklyChange: number;     // %
  primeRate: number;        // %
  daysSinceLaunch: number;
  categoryId: string;
  // 확장 시그널 (optional)
  rentRatio?: number;            // % (임대료/매출)
  deliveryRatio?: number;        // % (배달매출/전체매출)
  employeeCount?: number;
  consecutiveFlatWeeks?: number; // 매출 변동 ±3% 이내인 연속 주 수
  daysSinceLastSnsPost?: number;
};

// 직원이 필요한 업종 (1인 운영이 위험한 업종)
const NEEDS_STAFF_CATEGORIES = new Set(["food", "cafe-dessert", "fitness", "education"]);
// 계절 비수기 업종-월 매핑
const SEASONAL_SLUMP_MAP: Record<string, number[]> = {
  "cafe-dessert": [12, 1, 2],    // 카페 겨울 비수기
  "fitness": [7, 8, 12],         // 피트니스 여름/연말 이탈
  "education": [1, 2, 7, 8],     // 학원 방학 비수기
};

export function detectBusinessSituation(input: SituationDetectionInput): BusinessSituation | null {
  // ── 1순위: 생존 위협 ──
  if (input.runway >= 0 && input.runway <= 3) return "funding-crisis";
  if (input.categoryId === "startup-tech" && input.monthlySales === 0 && input.daysSinceLaunch > 60) return "pmf-not-found";
  if (input.primeRate > 65) return "cost-crisis";

  // ── 2순위: 구조적 위험 ──
  if (input.rentRatio != null && input.rentRatio > 18) return "rent-crisis";
  if (input.weeklyChange < -15) return "revenue-decline";
  if (input.employeeCount != null && input.employeeCount === 0 && input.daysSinceLaunch > 90 && NEEDS_STAFF_CATEGORIES.has(input.categoryId)) return "staff-crisis";
  if (input.deliveryRatio != null && input.deliveryRatio > 75) return "delivery-dependency";

  // ── 3순위: 성장 정체 ──
  if (input.monthlySales === 0 && input.daysSinceLaunch > 90) return "pmf-not-found";
  if (input.weeklyChange < -10) return "revenue-decline";
  if (input.daysSinceLastSnsPost != null && input.daysSinceLastSnsPost > 14 && input.monthlySales > 0) return "marketing-stagnant";
  if (input.consecutiveFlatWeeks != null && input.consecutiveFlatWeeks >= 4 && input.monthlySales > 0) return "marketing-stagnant";

  // ── 4순위: 상황별 ──
  // 매출 변동 ±3% 이내 6개월+ → 메뉴 피로
  if (input.monthlySales > 0 && Math.abs(input.weeklyChange) <= 3 && input.daysSinceLaunch > 180) return "menu-fatigue";

  // 계절 비수기 감지
  const currentMonth = new Date().getMonth() + 1;
  const slumpMonths = SEASONAL_SLUMP_MAP[input.categoryId];
  if (slumpMonths?.includes(currentMonth) && input.weeklyChange < -5) return "seasonal-slump";

  // ── 5순위: 긍정 상황 ──
  if (input.monthlySales > 0 && input.runway < 0 && input.daysSinceLaunch > 365 && input.weeklyChange >= 0) return "expansion-ready";

  return null;
}

// ─── 사례 매칭 ──────────────────────────────────────

export function matchCaseStudies(situation: BusinessSituation, categoryId: string): CaseStudy[] {
  const matched = CASE_STUDIES.filter(c => {
    if (c.situation !== situation) return false;
    if (c.applicableTo.includes("all")) return true;
    if (c.applicableTo.includes(categoryId)) return true;
    return false;
  });

  // 해당 업종에 직접 매칭되는 사례를 우선, 그 다음 "all"
  const direct = matched.filter(c => c.applicableTo.includes(categoryId));
  const general = matched.filter(c => !c.applicableTo.includes(categoryId));

  return [...direct, ...general];
}

export function getCaseStudiesForSituation(situation: BusinessSituation): CaseStudy[] {
  return CASE_STUDIES.filter(c => c.situation === situation);
}

export function getAllCaseStudies(): CaseStudy[] {
  return CASE_STUDIES;
}
