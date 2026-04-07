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
    applicableTo: ["all"],
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
    applicableTo: ["startup-tech", "all"],
  },
  {
    id: "hyundai-warranty",
    company: "현대차",
    situation: "revenue-decline",
    oneLiner: "미국에서 품질 불신 시절 '10년 10만마일 보증'을 업계 최초로 도입해 판매량이 급증했습니다",
    lesson: "약점을 역으로 파격 보증하면 신뢰로 전환됩니다",
    applicableTo: ["all"],
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
    applicableTo: ["cafe-dessert", "food", "all"],
  },
  {
    id: "lego-2003",
    company: "레고",
    situation: "revenue-decline",
    oneLiner: "2003년 파산 직전, 부품을 7,000→3,000개로 축소하고 핵심에 집중해 2008년 불황에도 수익 4배를 달성했습니다",
    lesson: "잘하는 것만 남기고 나머지는 버리세요",
    applicableTo: ["retail", "all"],
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
    applicableTo: ["all"],
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
    applicableTo: ["startup-tech", "all"],
  },
  {
    id: "danaher-dbs",
    company: "다나허",
    situation: "scaling-decision",
    oneLiner: "산업용 도구 회사가 DBS(다나허 경영 시스템)를 만들어 80+ 기업을 인수·개선했습니다",
    lesson: "시스템을 만들면 어떤 사업이든 개선할 수 있습니다",
    applicableTo: ["all"],
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
    applicableTo: ["all"],
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
    applicableTo: ["food", "cafe-dessert", "beauty", "retail"],
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
    applicableTo: ["food", "cafe-dessert", "beauty", "retail", "online-digital"],
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
    applicableTo: ["food"],
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
    applicableTo: ["all"],
  },

  // ═══ 신규: expansion-ready (3) ═══
  {
    id: "kyochon-2nd-store",
    company: "교촌치킨",
    situation: "expansion-ready",
    oneLiner: "1호점의 운영 매뉴얼을 완벽히 만든 후에야 2호점을 열었고, 지금 1,377개 매장으로 성장했습니다",
    lesson: "2호점 전에 1호점이 사장 없이 돌아가는지 확인하세요",
    applicableTo: ["food", "cafe-dessert", "retail"],
  },
  {
    id: "starbucks-overexpansion",
    company: "스타벅스",
    situation: "expansion-ready",
    oneLiner: "2008년 과잉 확장으로 품질이 하락하자 900개 매장을 폐점하고 기본기를 다시 잡았습니다",
    lesson: "수익성 없는 확장은 전체를 위험에 빠뜨립니다",
    applicableTo: ["all"],
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
    applicableTo: ["retail", "food", "cafe-dessert"],
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
    applicableTo: ["food", "cafe-dessert", "retail"],
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
    applicableTo: ["all"],
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
