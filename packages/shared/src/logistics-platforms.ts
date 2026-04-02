/**
 * 소상공인 판매/배달/예약/결제 플랫폼 종합 데이터
 * 2025-2026년 최신 수수료 및 시장 데이터 반영
 *
 * 카테고리:
 *   delivery          – 배달 플랫폼 (음식 배달앱)
 *   courier           – 택배사
 *   online-marketplace – 온라인 마켓플레이스
 *   social-commerce   – 소셜/SNS 판매
 *   reservation       – 예약/서비스 플랫폼
 *   pos-payment       – POS/결제 시스템
 *   delivery-agency   – 배달대행사
 */

export type PlatformType =
  | "delivery"
  | "courier"
  | "online-marketplace"
  | "social-commerce"
  | "reservation"
  | "pos-payment"
  | "delivery-agency";

export type SalesPlatform = {
  id: string;
  name: { ko: string; en: string };
  type: PlatformType;
  /** 중개/판매 수수료 (%) — 대표값. 0이면 해당 없음 */
  commissionRate: number;
  /** 수수료 상세 설명 */
  commissionNote: { ko: string; en: string };
  /** 배달비/배송비 건당 (원) — 0이면 없거나 별도 */
  deliveryFeePerOrder: number;
  /** 월 고정비 (원) — 0이면 없음 */
  monthlyFixed: number;
  /** 특징 요약 */
  features: { ko: string; en: string };
  /** 정산 주기 */
  settlement: { ko: string; en: string };
  /** 공식 사이트 URL */
  url: string;
  /** 적용 업종 카테고리 */
  applicableCategories: string[];
  /** 대상 업종 설명 */
  targetBusiness: { ko: string; en: string };
  /** MAU 또는 시장점유율 정보 */
  marketData: { ko: string; en: string };
  /** 장점 */
  pros: { ko: string[]; en: string[] };
  /** 단점 */
  cons: { ko: string[]; en: string[] };
  /** 데이터 기준 연도 */
  dataYear: string;
};

// ── 하위 호환을 위한 기존 타입 별칭 ──
export type LogisticsPlatform = SalesPlatform;

// ═══════════════════════════════════════════════════════════════════════════
// 1. 배달 플랫폼 (Delivery)
// ═══════════════════════════════════════════════════════════════════════════

const deliveryApps: SalesPlatform[] = [
  {
    id: "baemin",
    name: { ko: "배달의민족", en: "Baemin" },
    type: "delivery",
    commissionRate: 6.8,
    commissionNote: {
      ko: "차등제: 매출 하위 20% → 2.0%, 중위 → 6.8%, 상위 35% → 7.8%. 포장(픽업) 6.8% (2025.4월~). 소액주문(1만원 이하) 수수료 면제 (2025.6월~)",
      en: "Tiered: bottom 20% → 2.0%, mid → 6.8%, top 35% → 7.8%. Pickup 6.8% (from Apr 2025). Orders under ₩10K commission-free (from Jun 2025)",
    },
    deliveryFeePerOrder: 2400,
    monthlyFixed: 0,
    features: {
      ko: "국내 배달앱 점유율 1위. 배민배달(자체배달)+가게배달 선택 가능. 광고상품(울트라콜, 오픈리스트) 별도. D+1 영업일 정산. 2025년 상생 요금제 시행으로 수수료 인하",
      en: "Korea's #1 delivery app. Baemin delivery + store delivery options. Separate ad products (UltraCall, OpenList). D+1 settlement. 2025 shared-growth pricing reduced commissions",
    },
    settlement: { ko: "D+1 정산 (영업일 기준)", en: "D+1 settlement (business days)" },
    url: "https://ceo.baemin.com",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "음식점, 카페, 디저트, 베이커리 등 F&B 업종",
      en: "Restaurants, cafes, desserts, bakeries and other F&B businesses",
    },
    marketData: {
      ko: "MAU 약 2,170만명 (2025.10 기준). 전국 배달앱 1위. 서울 지역에서는 쿠팡이츠와 경쟁 심화",
      en: "MAU ~21.7M (Oct 2025). #1 nationwide delivery app. Intense competition with Coupang Eats in Seoul",
    },
    pros: {
      ko: [
        "압도적 사용자 수 — 가장 많은 주문 유입",
        "차등 수수료로 소규모 매장 부담 완화 (최저 2%)",
        "D+1 빠른 정산",
        "배민배달/가게배달 유연한 선택",
        "소액주문 수수료 면제 혜택",
      ],
      en: [
        "Dominant user base — highest order volume",
        "Tiered commission eases burden on small stores (min 2%)",
        "Fast D+1 settlement",
        "Flexible Baemin/store delivery options",
        "Commission waiver for small orders",
      ],
    },
    cons: {
      ko: [
        "상위 매출 업장 수수료 7.8%로 높은 편",
        "광고비(울트라콜 등) 별도 부담 큼",
        "포장 주문 수수료 6.8% 신설 (2025.4월~)",
        "광고 없이는 노출 어려움",
      ],
      en: [
        "7.8% for top earners is relatively high",
        "Additional ad costs (UltraCall) can be significant",
        "New 6.8% pickup order fee (from Apr 2025)",
        "Difficult to get exposure without advertising",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "coupangeats",
    name: { ko: "쿠팡이츠", en: "Coupang Eats" },
    type: "delivery",
    commissionRate: 6.8,
    commissionNote: {
      ko: "차등제 (2025.4월~): 매출 하위 20% → 2.0%, 중위 → 6.8%, 상위 35% → 7.8%. 포장(픽업) 수수료 0% (무료 연장 중)",
      en: "Tiered (from Apr 2025): bottom 20% → 2.0%, mid → 6.8%, top 35% → 7.8%. Pickup commission 0% (free extension ongoing)",
    },
    deliveryFeePerOrder: 2600,
    monthlyFixed: 0,
    features: {
      ko: "와우 멤버십 무료배달로 객단가 높은 주문 유리. 단건배달 기본. 서울 지역 점유율 1위 탈환(2025.12). 포장 수수료 무료 유지 중",
      en: "Wow membership free delivery attracts high-ticket orders. Single delivery default. #1 in Seoul (Dec 2025). Pickup commission remains free",
    },
    settlement: { ko: "D+1 정산", en: "D+1 settlement" },
    url: "https://store.coupangeats.com",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "음식점, 카페 등 F&B 업종. 특히 객단가 높은 매장에 유리",
      en: "Restaurants, cafes and F&B. Especially advantageous for high-ticket stores",
    },
    marketData: {
      ko: "MAU 약 1,230만명 (2025.10 기준). 전년 대비 32% 성장, 역대 최대. 2025.12 서울 결제금액 배민 추월 (1,792억원 vs 1,778억원)",
      en: "MAU ~12.3M (Oct 2025). 32% YoY growth, all-time high. Dec 2025: surpassed Baemin in Seoul transaction volume (₩179.2B vs ₩177.8B)",
    },
    pros: {
      ko: [
        "와우 멤버십(3,000만+) 연계 — 높은 객단가 주문 유입",
        "단건배달로 빠른 배달 품질",
        "포장 주문 수수료 0% (배민 대비 강점)",
        "빠른 성장세 — 특히 서울에서 강세",
        "차등 수수료로 소규모 매장 부담 완화",
      ],
      en: [
        "Wow membership (30M+) — high-ticket order inflow",
        "Single delivery ensures fast delivery quality",
        "0% pickup commission (advantage over Baemin)",
        "Rapid growth — especially strong in Seoul",
        "Tiered commission eases small store burden",
      ],
    },
    cons: {
      ko: [
        "배민 대비 전국 커버리지 아직 부족",
        "라이더 수급 불안정 시 배달 지연",
        "쿠팡 생태계 의존도 높음",
        "별도 마케팅 도구가 배민 대비 제한적",
      ],
      en: [
        "Nationwide coverage still behind Baemin",
        "Delivery delays when rider supply is unstable",
        "High dependency on Coupang ecosystem",
        "Marketing tools more limited compared to Baemin",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "yogiyo",
    name: { ko: "요기요", en: "Yogiyo" },
    type: "delivery",
    commissionRate: 9.7,
    commissionNote: {
      ko: "기본 9.7% (기존 12.5%에서 인하). 차등제: 주문 건수별 4.7%~9.7%. 포장 7.7%. 하위 40% 매출 가게 수수료 20% 포인트 환급",
      en: "Base 9.7% (reduced from 12.5%). Tiered: 4.7%~9.7% by order volume. Pickup 7.7%. Bottom 40% stores get 20% commission cashback",
    },
    deliveryFeePerOrder: 2200,
    monthlyFixed: 0,
    features: {
      ko: "광고비 부담 적음. 요금제 간단. 주문 건수 기반 차등 수수료 (多주문 → 할인). 하위 매출 가게 환급 혜택. 창업 초기·중소규모 업장 적합",
      en: "Lower ad costs. Simple pricing. Order-volume based tiered discount. Bottom-tier store cashback. Good for early-stage and small stores",
    },
    settlement: { ko: "D+2 정산", en: "D+2 settlement" },
    url: "https://ceo.yogiyo.co.kr",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "음식점, 카페 등 F&B 업종. 특히 창업 초기·중소규모 매장",
      en: "Restaurants, cafes. Especially early-stage and small-scale stores",
    },
    marketData: {
      ko: "MAU 약 440만명 (2025.10 기준). 3위 배달앱. 전년 대비 이용자 감소 추세",
      en: "MAU ~4.4M (Oct 2025). 3rd place delivery app. User decline year-over-year",
    },
    pros: {
      ko: [
        "광고비 부담이 배민 대비 적음",
        "주문 건수 많으면 수수료 4.7%까지 인하",
        "매출 하위 가게 환급 혜택",
        "요금 체계 비교적 단순",
      ],
      en: [
        "Lower advertising costs vs Baemin",
        "Commission as low as 4.7% for high-volume stores",
        "Cashback for low-revenue stores",
        "Relatively simple fee structure",
      ],
    },
    cons: {
      ko: [
        "MAU 감소세 — 주문 유입 줄어드는 추세",
        "기본 수수료 9.7%는 배민·쿠팡이츠 대비 높음",
        "포장 수수료 7.7% 부과",
        "배민·쿠팡이츠 양강 구도에 밀리는 상황",
      ],
      en: [
        "Declining MAU — fewer incoming orders",
        "Base 9.7% higher than Baemin/Coupang Eats",
        "7.7% pickup commission charged",
        "Being squeezed in Baemin-Coupang Eats duopoly",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "naver-order",
    name: { ko: "네이버 주문", en: "Naver Order" },
    type: "delivery",
    commissionRate: 1.1,
    commissionNote: {
      ko: "네이버페이 결제수수료만 부과. 영세업체(매출 3억 미만) 약 0.80%, 중소업체 0.80%~2.90%. 네이버 공제 약 1.1% (카드수수료 0.8% 대납 포함). 중개수수료 없음",
      en: "NaverPay processing fee only. Micro-businesses (under ₩300M) ~0.80%, SMEs 0.80%~2.90%. Naver deducts ~1.1% (incl. 0.8% card fee). No intermediary commission",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "배달앱 대비 초저수수료 (1% 내외). 네이버지도/검색 연동 주문. 포장·배달 모두 지원. 배달대행 연동 가능. 배민 포장수수료 도입 이후 전환 급증",
      en: "Ultra-low commission (~1%) vs delivery apps. Naver Map/Search integrated ordering. Supports both pickup and delivery. Delivery agency integration available. Surging adoption after Baemin pickup fee introduction",
    },
    settlement: { ko: "D+1 정산 (네이버페이)", en: "D+1 settlement (NaverPay)" },
    url: "https://new-order.biz.naver.com",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "음식점, 카페, 베이커리 등 모든 F&B 업종. 수수료 부담 줄이려는 소상공인에 최적",
      en: "All F&B businesses. Optimal for small businesses seeking to reduce commission burden",
    },
    marketData: {
      ko: "네이버 검색/지도 MAU 4,000만+ 기반. 별도 주문 MAU 비공개이나 2025년 배민 포장수수료 이슈 이후 급성장",
      en: "Based on Naver Search/Maps 40M+ MAU. Separate order MAU undisclosed but surging after 2025 Baemin pickup fee controversy",
    },
    pros: {
      ko: [
        "수수료 약 1% — 배달앱 대비 압도적 저렴",
        "네이버 검색/지도 노출 연계",
        "포장 주문 수수료 부담 거의 없음",
        "네이버 플레이스 리뷰 연동으로 홍보 효과",
        "D+1 빠른 정산",
      ],
      en: [
        "~1% commission — overwhelmingly cheaper than delivery apps",
        "Naver Search/Maps exposure integration",
        "Near-zero pickup order commission burden",
        "Naver Place review integration for publicity",
        "Fast D+1 settlement",
      ],
    },
    cons: {
      ko: [
        "배달앱처럼 전용 배달 인프라 없음 — 별도 배달대행 필요",
        "자체 앱 주문 유입은 배달앱 대비 적음",
        "사용자 인지도/습관이 배달앱 대비 아직 낮음",
        "음식 주문 특화 UI가 배달앱 대비 부족",
      ],
      en: [
        "No dedicated delivery infrastructure — separate delivery agency needed",
        "App-based order inflow lower than delivery apps",
        "User awareness/habits still behind delivery apps",
        "Food ordering UI less specialized than delivery apps",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "ddangyo",
    name: { ko: "땡겨요", en: "Ddangyo" },
    type: "delivery",
    commissionRate: 2.0,
    commissionNote: {
      ko: "중개수수료 2% 고정. 신한은행 운영 공공배달앱. 서울배달+ 운영사. 배달대행료 별도 (최대 5,000원)",
      en: "Fixed 2% commission. Public delivery app by Shinhan Bank. Seoul Delivery+ operator. Delivery agency fee separate (up to ₩5,000)",
    },
    deliveryFeePerOrder: 3000,
    monthlyFixed: 0,
    features: {
      ko: "수수료 2%로 민간 배달앱 대비 최저. 서울·경기 중심 커버리지. 공공배달앱 성격. 결제 시 신한은행 할인 혜택. 빠르게 성장 중",
      en: "Lowest at 2% vs private delivery apps. Seoul/Gyeonggi focus. Public delivery app nature. Shinhan Bank payment discounts. Rapid growth",
    },
    settlement: { ko: "D+1 정산", en: "D+1 settlement" },
    url: "https://www.ddangyo.com",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "음식점, 카페 등 F&B 업종. 수수료 부담 줄이고 싶은 서울·경기 지역 소상공인",
      en: "F&B businesses. Small business owners in Seoul/Gyeonggi seeking lower commissions",
    },
    marketData: {
      ko: "MAU 약 345만명 (2025.10 기준). 빠른 성장세. 공공배달앱 중 1위",
      en: "MAU ~3.45M (Oct 2025). Rapid growth. #1 among public delivery apps",
    },
    pros: {
      ko: [
        "중개수수료 2% 고정 — 압도적 저렴",
        "공공 성격으로 정부 지원 연계",
        "MAU 빠른 성장세",
        "신한은행 할인 혜택 연동",
      ],
      en: [
        "Fixed 2% commission — overwhelmingly cheap",
        "Government support as public app",
        "Rapidly growing MAU",
        "Shinhan Bank discount integration",
      ],
    },
    cons: {
      ko: [
        "서울·경기 외 지역 커버리지 부족",
        "배달대행료 별도 (최대 5,000원)로 실질 비용↑",
        "MAU가 배민·쿠팡이츠 대비 아직 적음",
        "마케팅/광고 도구 부족",
      ],
      en: [
        "Limited coverage outside Seoul/Gyeonggi",
        "Separate delivery agency fee (up to ₩5,000) adds cost",
        "MAU still far behind Baemin/Coupang Eats",
        "Lack of marketing/advertising tools",
      ],
    },
    dataYear: "2026",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. 택배사 (Courier)
// ═══════════════════════════════════════════════════════════════════════════

const couriers: SalesPlatform[] = [
  {
    id: "cj",
    name: { ko: "CJ대한통운", en: "CJ Logistics" },
    type: "courier",
    commissionRate: 0,
    commissionNote: {
      ko: "수수료 없음. 건당 배송료만 발생. 계약택배 소형 1,850원~",
      en: "No commission. Per-parcel shipping fee only. Contract rate from ₩1,850",
    },
    deliveryFeePerOrder: 3500,
    monthlyFixed: 0,
    features: {
      ko: "국내 점유율 1위. 계약택배 소형 1,850원~. D+1 배송. 전국 커버리지 최대",
      en: "Market leader. Contract rate from ₩1,850. D+1 delivery. Best nationwide coverage",
    },
    settlement: { ko: "월 2회 정산", en: "Bi-monthly settlement" },
    url: "https://www.cjlogistics.com",
    applicableCategories: ["online-digital", "retail", "pet", "living-service"],
    targetBusiness: {
      ko: "온라인 쇼핑몰, 소매, 반려동물용품 등 배송 필요 업종",
      en: "Online shops, retail, pet supplies and other shipping-required businesses",
    },
    marketData: {
      ko: "국내 택배 시장 점유율 약 50%. 일 처리량 1,000만건+",
      en: "~50% domestic parcel market share. 10M+ daily parcels",
    },
    pros: {
      ko: ["전국 최대 커버리지", "대량 계약 시 저렴한 단가", "D+1 빠른 배송", "안정적 물류 인프라"],
      en: ["Best nationwide coverage", "Low unit cost for bulk contracts", "D+1 fast delivery", "Stable logistics infrastructure"],
    },
    cons: {
      ko: ["소량 발송 시 단가 높음", "분실·파손 시 보상 절차 복잡", "성수기 배송 지연 가능"],
      en: ["Higher unit cost for small volumes", "Complex compensation for loss/damage", "Possible delays during peak seasons"],
    },
    dataYear: "2025",
  },
  {
    id: "hanjin",
    name: { ko: "한진택배", en: "Hanjin Express" },
    type: "courier",
    commissionRate: 0,
    commissionNote: {
      ko: "수수료 없음. 건당 배송료만 발생",
      en: "No commission. Per-parcel shipping fee only",
    },
    deliveryFeePerOrder: 3500,
    monthlyFixed: 0,
    features: {
      ko: "중대형 화물 경쟁력. 초소형(3kg) 5,000원부터. 제주 8,000원~",
      en: "Competitive for mid-large parcels. From ₩5,000 for small. Jeju ₩8,000+",
    },
    settlement: { ko: "월 2회 정산", en: "Bi-monthly settlement" },
    url: "https://www.hanjin.co.kr",
    applicableCategories: ["online-digital", "retail", "pet", "living-service"],
    targetBusiness: {
      ko: "온라인 쇼핑몰, 소매 등 중대형 화물 배송 필요 업종",
      en: "Online shops, retail with mid-large parcel shipping needs",
    },
    marketData: {
      ko: "국내 택배 시장 점유율 약 15%",
      en: "~15% domestic parcel market share",
    },
    pros: {
      ko: ["중대형 화물 경쟁력", "전국 안정적 커버리지"],
      en: ["Competitive for mid-large parcels", "Stable nationwide coverage"],
    },
    cons: {
      ko: ["소형 화물은 CJ 대비 비싼 편", "제주 추가 요금 높음"],
      en: ["Pricier than CJ for small parcels", "Higher Jeju surcharge"],
    },
    dataYear: "2025",
  },
  {
    id: "lotte",
    name: { ko: "롯데택배", en: "Lotte Global Logistics" },
    type: "courier",
    commissionRate: 0,
    commissionNote: {
      ko: "수수료 없음. 소형~중형 경쟁력 있는 요금",
      en: "No commission. Competitive rates for small-medium parcels",
    },
    deliveryFeePerOrder: 3300,
    monthlyFixed: 0,
    features: {
      ko: "소형(5kg) 5,000원부터. 수도권 동일권 배송 경쟁력. L-point 연계",
      en: "From ₩5,000 for small. Competitive in metro area. L-point integration",
    },
    settlement: { ko: "월 2회 정산", en: "Bi-monthly settlement" },
    url: "https://www.lotteglogis.com",
    applicableCategories: ["online-digital", "retail", "pet", "living-service"],
    targetBusiness: {
      ko: "온라인 쇼핑몰, 소매 등 수도권 중심 배송 업종",
      en: "Online shops, retail focused on metropolitan delivery",
    },
    marketData: {
      ko: "국내 택배 시장 점유율 약 10%",
      en: "~10% domestic parcel market share",
    },
    pros: {
      ko: ["수도권 배송 경쟁력", "L-point 연계 마케팅 가능"],
      en: ["Competitive metro area delivery", "L-point marketing integration"],
    },
    cons: {
      ko: ["CJ 대비 전국 커버리지 약함", "대량 계약 할인폭 제한적"],
      en: ["Weaker nationwide coverage vs CJ", "Limited bulk contract discounts"],
    },
    dataYear: "2025",
  },
  {
    id: "epost",
    name: { ko: "우체국택배", en: "Korea Post" },
    type: "courier",
    commissionRate: 0,
    commissionNote: {
      ko: "수수료 없음. 가장 저렴한 기본 요금. D+3일 배송",
      en: "No commission. Cheapest base rate. D+3 delivery",
    },
    deliveryFeePerOrder: 2700,
    monthlyFixed: 0,
    features: {
      ko: "최저가(3kg 이하 2,700원). D+3 배송. 전국 우체국 접수 가능. 도서산간 추가 없음",
      en: "Cheapest (₩2,700 for under 3kg). D+3 delivery. No island surcharge. Post office drop-off",
    },
    settlement: { ko: "즉시 정산", en: "Immediate settlement" },
    url: "https://parcel.epost.go.kr",
    applicableCategories: ["online-digital", "retail", "pet", "living-service"],
    targetBusiness: {
      ko: "소량 발송, 도서산간 배송이 필요한 소규모 사업자",
      en: "Small-volume shippers, businesses needing island/remote area delivery",
    },
    marketData: {
      ko: "전국 우체국 네트워크 (약 3,400곳). 도서산간 유일한 추가요금 없는 택배사",
      en: "Nationwide post office network (~3,400 locations). Only courier with no island surcharge",
    },
    pros: {
      ko: ["최저가 배송료", "도서산간 추가요금 없음", "전국 우체국 접수 가능"],
      en: ["Lowest shipping rate", "No island/remote surcharge", "Drop-off at any post office"],
    },
    cons: {
      ko: ["배송 속도 느림 (D+3)", "계약택배 할인폭 작음", "픽업 서비스 제한적"],
      en: ["Slow delivery (D+3)", "Limited contract discounts", "Limited pickup service"],
    },
    dataYear: "2025",
  },
  {
    id: "logen",
    name: { ko: "로젠택배", en: "Logen Logistics" },
    type: "courier",
    commissionRate: 0,
    commissionNote: {
      ko: "수수료 없음. 중소 온라인셀러 대상 합리적 요금",
      en: "No commission. Reasonable rates for small online sellers",
    },
    deliveryFeePerOrder: 3500,
    monthlyFixed: 0,
    features: {
      ko: "소형(5kg) 6,000원. 온라인 접수 편의성 좋음. 계약택배 할인폭 큰 편",
      en: "₩6,000 for small. Easy online booking. Good contract discounts",
    },
    settlement: { ko: "월 2회 정산", en: "Bi-monthly settlement" },
    url: "https://www.ilogen.com",
    applicableCategories: ["online-digital", "retail", "pet", "living-service"],
    targetBusiness: {
      ko: "중소 온라인 셀러, 소매업 등",
      en: "SME online sellers, retail businesses",
    },
    marketData: {
      ko: "국내 택배 시장 점유율 약 8%",
      en: "~8% domestic parcel market share",
    },
    pros: {
      ko: ["계약택배 할인폭 큰 편", "온라인 접수 편리"],
      en: ["Good contract discounts", "Convenient online booking"],
    },
    cons: {
      ko: ["CJ·한진 대비 인지도 낮음", "일부 지역 서비스 품질 편차"],
      en: ["Lower brand recognition vs CJ/Hanjin", "Service quality varies by region"],
    },
    dataYear: "2025",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. 온라인 마켓플레이스 (Online Marketplace)
// ═══════════════════════════════════════════════════════════════════════════

const onlineMarketplaces: SalesPlatform[] = [
  {
    id: "smartstore",
    name: { ko: "네이버 스마트스토어", en: "Naver Smart Store" },
    type: "online-marketplace",
    commissionRate: 3.74,
    commissionNote: {
      ko: "주문관리수수료: 영세 1.98%, 중소 2.58~3.74% (2025.10 인하). 판매수수료: 네이버쇼핑 유입 2.73%, 외부 마케팅 유입(판매자 마케팅) 0.91%. 월 고정비 0원. 스타트 제로수수료(신규 셀러) 페이백 환급 지원",
      en: "Order mgmt fee: micro 1.98%, SME 2.58~3.74% (reduced Oct 2025). Sales fee: Naver Shopping 2.73%, external marketing 0.91%. ₩0 monthly fee. Start Zero Fee (new seller) cashback support",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "국내 검색 점유율 1위 연계. 월 고정비 0원. 네이버 톡톡 상담. 라이브커머스 가능. 2025년 수수료 체계 대폭 개편 — 유입수수료 폐지, 판매수수료로 통합. 외부 마케팅 유입 시 0.91% 초저율",
      en: "Linked to #1 search engine. No monthly fee. Naver TalkTalk chat. Live commerce. Major 2025 fee restructuring — referral fee abolished, unified sales fee. 0.91% ultra-low for external marketing",
    },
    settlement: { ko: "D+1 정산 (네이버페이)", en: "D+1 settlement (NaverPay)" },
    url: "https://sell.smartstore.naver.com",
    applicableCategories: ["online-digital", "retail", "pet", "food", "cafe-dessert"],
    targetBusiness: {
      ko: "모든 업종. 특히 온라인 판매, 식품, 패션, 생활용품 등. 초보 셀러부터 대형 브랜드까지",
      en: "All business types. Especially online sales, food, fashion, lifestyle. From beginner sellers to large brands",
    },
    marketData: {
      ko: "네이버플러스 스토어 MAU 536만 (2025.4). 연매출 1억 이상 판매자 4.5만명+. 국내 이커머스 2위 플랫폼",
      en: "Naver Plus Store MAU 5.36M (Apr 2025). 45K+ sellers with ₩100M+ annual revenue. #2 domestic e-commerce platform",
    },
    pros: {
      ko: [
        "월 고정비 0원 — 진입장벽 최저",
        "네이버 검색 연동으로 자연 유입 강력",
        "외부 마케팅 유입 시 수수료 0.91% 초저율",
        "D+1 빠른 정산",
        "라이브커머스·톡톡 상담 등 부가 기능 풍부",
        "신규 셀러 스타트 제로수수료 지원",
      ],
      en: [
        "₩0 monthly fee — lowest entry barrier",
        "Powerful organic traffic via Naver Search",
        "Ultra-low 0.91% for external marketing traffic",
        "Fast D+1 settlement",
        "Rich add-ons: live commerce, TalkTalk chat",
        "Start Zero Fee support for new sellers",
      ],
    },
    cons: {
      ko: [
        "네이버쇼핑 유입 시 실질 수수료 약 5~6% (주문관리+판매수수료)",
        "검색 알고리즘 의존 — 상위 노출 경쟁 치열",
        "카테고리에 따라 추가 수수료 발생 가능",
        "쿠팡 대비 물류 인프라 부족",
      ],
      en: [
        "Effective ~5~6% commission for Naver Shopping referrals (order mgmt + sales fee)",
        "Search algorithm dependent — fierce competition for top exposure",
        "Additional fees possible by category",
        "Weaker logistics infrastructure vs Coupang",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "coupang-marketplace",
    name: { ko: "쿠팡 마켓플레이스", en: "Coupang Marketplace" },
    type: "online-marketplace",
    commissionRate: 10.8,
    commissionNote: {
      ko: "카테고리별 4~10.8%. 식품 10.8%, 패션 10.8%, 전자 6~8%, 주얼리 4%, 컴퓨터 5%. 배송비 수수료 3.3% 별도. 월 서비스이용료 55,000원 (월매출 100만 이상 시). 로켓그로스: 입고비 100~800원, 출고비 600~3,500원, 보관비 일 10~50원",
      en: "4~10.8% by category. Food/fashion 10.8%, electronics 6~8%, jewelry 4%, computers 5%. 3.3% shipping fee commission. ₩55K/mo service fee if monthly sales > ₩1M. Rocket Growth: inbound ₩100~800, outbound ₩600~3,500, storage ₩10~50/day",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 55000,
    features: {
      ko: "로켓배송·로켓그로스 입점 가능. 와우 멤버십 3,000만+ 회원 유입. 높은 전환율. 국내 이커머스 거래액 1위 (27% 시장점유율). 2025년 물류수수료 6단계 세분화",
      en: "Rocket delivery options. 30M+ Wow members. High conversion rate. #1 domestic e-commerce by GMV (27% market share). 2025 logistics fee restructured to 6 tiers",
    },
    settlement: { ko: "D+1~D+2 정산", en: "D+1~D+2 settlement" },
    url: "https://marketplace.coupang.com",
    applicableCategories: ["online-digital", "retail", "pet", "food"],
    targetBusiness: {
      ko: "모든 업종. 특히 식품, 생활용품, 전자, 패션 등. 로켓배송 활용 시 대량 판매 유리",
      en: "All business types. Especially food, lifestyle, electronics, fashion. Rocket delivery advantageous for volume sales",
    },
    marketData: {
      ko: "MAU 약 3,339만명 (이커머스 앱 1위). 판매자 약 30만명+. 거래액 약 35.3조원 (2024). 시장점유율 약 27%",
      en: "MAU ~33.39M (#1 e-commerce app). 300K+ sellers. GMV ~₩35.3T (2024). ~27% market share",
    },
    pros: {
      ko: [
        "MAU 3,300만+ — 국내 최대 고객 풀",
        "로켓배송/그로스로 빠른 배송 경쟁력",
        "높은 전환율 — 구매 의향 높은 사용자층",
        "와우 멤버십 연계 무료배송 혜택",
      ],
      en: [
        "33M+ MAU — Korea's largest customer pool",
        "Rocket delivery/growth for fast shipping competitiveness",
        "High conversion rate — purchase-intent user base",
        "Wow membership free shipping benefit",
      ],
    },
    cons: {
      ko: [
        "수수료 최대 10.8% + 월 55,000원 이용료 — 비용 부담 큼",
        "로켓그로스 물류비 별도 (입출고+보관 비용)",
        "가격 경쟁 치열 — 마진 압박",
        "쿠팡 정책 변경에 종속적",
      ],
      en: [
        "Up to 10.8% commission + ₩55K monthly fee — significant cost",
        "Rocket Growth logistics fees add up (inbound/outbound/storage)",
        "Intense price competition — margin pressure",
        "Subject to Coupang policy changes",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "kakao-shopping",
    name: { ko: "카카오톡 스토어 / 카카오쇼핑", en: "KakaoTalk Store / Kakao Shopping" },
    type: "online-marketplace",
    commissionRate: 3.3,
    commissionNote: {
      ko: "기본수수료(외부유입) 3.3%, 톡딜 노출 6.6%, 톡딜 할인 10%. 카카오 선물하기: 약 15% (MD 협의). 선물하기 배송비 포함 수수료 논란 후 자체 시정 진행 중",
      en: "Basic fee (external) 3.3%, TokDeal exposure 6.6%, TokDeal discount 10%. Kakao Gift: ~15% (MD negotiation). Self-correction ongoing after shipping-inclusive commission controversy",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "카카오톡 4,700만 사용자 연계. 선물하기 연동. 카카오 채널 메시지 마케팅. 톡딜(공동구매). 소상공인 채널 메시지 30만원 지원. 챗봇 무료 제공",
      en: "47M KakaoTalk users. Gift feature integration. Channel message marketing. TokDeal (group buy). ₩300K channel message support for SMEs. Free chatbot",
    },
    settlement: { ko: "D+3 정산", en: "D+3 settlement" },
    url: "https://shopping-seller.kakao.com",
    applicableCategories: ["online-digital", "retail", "pet", "food", "cafe-dessert"],
    targetBusiness: {
      ko: "모든 업종. 특히 선물용 상품, 식품, 뷰티, 생활. 카카오톡 채널 보유 사업자에 최적",
      en: "All business types. Especially gifts, food, beauty, lifestyle. Optimal for KakaoTalk channel holders",
    },
    marketData: {
      ko: "카카오톡 MAU 4,700만명 (국민 메신저). 카카오 선물하기 거래액 연 수조원 규모",
      en: "KakaoTalk MAU 47M (national messenger). Kakao Gift GMV in trillions of won annually",
    },
    pros: {
      ko: [
        "카카오톡 4,700만 사용자 — 최대 리치",
        "선물하기 시장 독점적 위치",
        "외부 유입 시 기본수수료 3.3%로 저렴",
        "채널 메시지로 기존 고객 마케팅 용이",
        "소상공인 메시지 지원금 30만원 혜택",
      ],
      en: [
        "47M KakaoTalk users — maximum reach",
        "Dominant position in gift market",
        "Low 3.3% basic fee for external traffic",
        "Easy existing customer marketing via channel messages",
        "₩300K message support for SMEs",
      ],
    },
    cons: {
      ko: [
        "선물하기 수수료 약 15% — 높은 편",
        "톡딜 이용 시 수수료 6.6~10%로 상승",
        "자체 쇼핑 트래픽은 네이버·쿠팡 대비 적음",
        "선물하기 입점 심사 까다로움",
      ],
      en: [
        "Gift feature ~15% commission — high",
        "TokDeal raises commission to 6.6~10%",
        "Own shopping traffic less than Naver/Coupang",
        "Strict entry screening for Gift feature",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "11st",
    name: { ko: "11번가", en: "11st" },
    type: "online-marketplace",
    commissionRate: 9.0,
    commissionNote: {
      ko: "카테고리별 7~13%. 평균 약 9%. 선결제 배송비 수수료 3.3% (VAT 포함). 외부 유입(네이버·다음) 제휴 수수료 2% (VAT 포함). 서버 이용료 77,000원/월 (전월 구매확정 500만원 이상 셀러). 신규 셀러 12개월간 전 카테고리 수수료 6% 할인",
      en: "7~13% by category. Avg ~9%. 3.3% prepaid shipping fee (VAT incl). 2% affiliate fee for external traffic (VAT incl). ₩77K/mo server fee (sellers with ₩5M+ confirmed). New sellers: 6% discount for 12 months across all categories",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "SK텔레콤 계열. 신규 셀러 수수료 6% 할인(12개월). 아마존 글로벌 셀링 연계. 정산 구매확정 후 D+1. 다양한 프로모션 운영",
      en: "SK Telecom affiliate. New seller 6% discount (12 months). Amazon Global Selling integration. D+1 after purchase confirmation. Various promotions",
    },
    settlement: { ko: "구매확정 D+1 정산", en: "D+1 after purchase confirmation" },
    url: "https://seller.11st.co.kr",
    applicableCategories: ["online-digital", "retail", "pet"],
    targetBusiness: {
      ko: "모든 업종. 특히 전자, 패션, 생활용품. 신규 셀러에게 유리한 수수료 혜택",
      en: "All business types. Especially electronics, fashion, lifestyle. Favorable fee benefits for new sellers",
    },
    marketData: {
      ko: "MAU 약 893만명 (이커머스 앱 2위). SK 계열 멤버십 연계",
      en: "MAU ~8.93M (#2 e-commerce app). SK group membership integration",
    },
    pros: {
      ko: [
        "신규 셀러 12개월 수수료 6% — 초기 부담 적음",
        "MAU 893만명으로 높은 트래픽",
        "SK 멤버십 연계 혜택",
        "아마존 글로벌 셀링 연계",
      ],
      en: [
        "6% fee for 12 months for new sellers — low initial burden",
        "High traffic with 8.93M MAU",
        "SK membership integration",
        "Amazon Global Selling partnership",
      ],
    },
    cons: {
      ko: [
        "기본 수수료 7~13%로 비싼 편",
        "월매출 500만원 이상 시 서버이용료 77,000원 추가",
        "외부 유입 제휴 수수료 2% 추가",
        "쿠팡·네이버 대비 성장세 둔화",
      ],
      en: [
        "Base 7~13% relatively expensive",
        "₩77K server fee if monthly sales > ₩5M",
        "Additional 2% affiliate fee for external traffic",
        "Growth slowing vs Coupang/Naver",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "gmarket",
    name: { ko: "G마켓/옥션", en: "Gmarket/Auction" },
    type: "online-marketplace",
    commissionRate: 9.0,
    commissionNote: {
      ko: "카테고리별 4~15%. 평균 약 9%. 식품 7%, 패션 12%, 가전 6%, 의료용품 11%. 선결제 배송비 수수료 3.3%. 구매확정 D+1 정산",
      en: "4~15% by category. Average ~9%. Food 7%, fashion 12%, electronics 6%, medical 11%. 3.3% prepaid shipping. D+1 after purchase confirmation",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "이베이코리아(신세계 인수) 운영. 스마일배송 연동. 할인쿠폰 프로모션 강점. 스타배송(풀필먼트) 서비스. G마켓/옥션 통합 ESM Plus 관리",
      en: "eBay Korea (acquired by Shinsegae). SmilePay integration. Strong coupon promotions. Star delivery (fulfillment). Unified ESM Plus management",
    },
    settlement: { ko: "구매확정 D+1 정산", en: "D+1 after purchase confirmation" },
    url: "https://www.gmarket.co.kr",
    applicableCategories: ["online-digital", "retail"],
    targetBusiness: {
      ko: "전 업종. 특히 전자, 패션, 생활용품. 쿠폰 프로모션 활용 가능한 사업자",
      en: "All businesses. Especially electronics, fashion, lifestyle. Businesses that can leverage coupon promotions",
    },
    marketData: {
      ko: "G마켓 MAU 약 706만명, 옥션 MAU 약 296만명. 오픈마켓 시장에서 점유율 하락세",
      en: "Gmarket MAU ~7.06M, Auction MAU ~2.96M. Declining open market share",
    },
    pros: {
      ko: [
        "G마켓+옥션 통합 관리 (ESM Plus)",
        "할인쿠폰 프로모션 효과적",
        "스타배송(풀필먼트) 서비스 연동",
        "카테고리별 수수료 4%부터 가능",
      ],
      en: [
        "Unified Gmarket+Auction management (ESM Plus)",
        "Effective coupon promotions",
        "Star delivery (fulfillment) integration",
        "Category commissions from 4%",
      ],
    },
    cons: {
      ko: [
        "MAU 하락 추세 — 이커머스 경쟁에서 밀림",
        "패션 카테고리 수수료 12~15%로 높음",
        "쿠팡·네이버 대비 트래픽 열세",
        "플랫폼 UI/UX 상대적으로 올드한 인상",
      ],
      en: [
        "Declining MAU — losing in e-commerce competition",
        "High 12~15% for fashion categories",
        "Traffic disadvantage vs Coupang/Naver",
        "Platform UI/UX feels relatively outdated",
      ],
    },
    dataYear: "2026",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4. 소셜/SNS 판매 (Social Commerce)
// ═══════════════════════════════════════════════════════════════════════════

const socialCommerce: SalesPlatform[] = [
  {
    id: "instagram-shopping",
    name: { ko: "인스타그램 쇼핑", en: "Instagram Shopping" },
    type: "social-commerce",
    commissionRate: 0,
    commissionNote: {
      ko: "인스타그램 자체 수수료 없음 (한국은 인앱 결제 미지원). 별도 결제 수단(네이버페이, 토스페이먼츠 등) 연동 필요 — 해당 PG 수수료(3~4%) 별도. 사업자등록 필수 (통신판매업 SNS마켓 525104)",
      en: "No Instagram fee (in-app checkout not available in Korea). Separate payment integration needed (NaverPay, TossPayments etc) — PG fees (3~4%) apply. Business registration required (telecoms sales: SNS market 525104)",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "비주얼 중심 마케팅. 쇼핑 태그로 제품 태깅 가능. 릴스·스토리 활용 바이럴. 한국에서는 외부 결제 연동 필수. DM 주문 방식도 활용. 팔로워 기반 충성 고객 확보 유리",
      en: "Visual-first marketing. Product tagging via shopping tags. Reels/Stories viral potential. External payment integration required in Korea. DM ordering also used. Follower-based loyal customer acquisition",
    },
    settlement: { ko: "연동 PG사에 따라 상이", en: "Varies by integrated PG provider" },
    url: "https://business.instagram.com",
    applicableCategories: ["online-digital", "retail", "cafe-dessert", "food", "pet"],
    targetBusiness: {
      ko: "패션, 뷰티, 핸드메이드, 카페, 베이커리, F&B 등 비주얼 중심 업종",
      en: "Fashion, beauty, handmade, cafe, bakery, F&B and other visual-first businesses",
    },
    marketData: {
      ko: "한국 인스타그램 MAU 약 2,000만명+. MZ세대 핵심 플랫폼. 인스타마켓 시장 규모 지속 성장",
      en: "Korea Instagram MAU ~20M+. Key MZ generation platform. Instagram market size continues growing",
    },
    pros: {
      ko: [
        "플랫폼 수수료 0% — 결제 PG만 부담",
        "비주얼 마케팅에 최적 — 릴스/스토리 활용",
        "MZ세대 집중 타겟 가능",
        "브랜딩과 판매 동시 가능",
        "팔로워 기반 재구매 유도 용이",
      ],
      en: [
        "0% platform fee — only PG payment costs",
        "Optimal for visual marketing — Reels/Stories",
        "Concentrated MZ generation targeting",
        "Branding and sales simultaneously",
        "Easy repeat purchase via follower base",
      ],
    },
    cons: {
      ko: [
        "인앱 결제 미지원 — 결제 전환 불편",
        "별도 주문/결제/배송 관리 시스템 구축 필요",
        "콘텐츠 제작 노동 부담 큼",
        "알고리즘 변경에 노출도 종속",
        "CS(고객서비스) 체계 직접 구축해야 함",
      ],
      en: [
        "No in-app checkout — payment friction",
        "Need to build separate order/payment/shipping systems",
        "High content creation labor burden",
        "Exposure dependent on algorithm changes",
        "Must build CS (customer service) system yourself",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "naver-blog-cafe",
    name: { ko: "네이버 블로그/카페 판매", en: "Naver Blog/Cafe Sales" },
    type: "social-commerce",
    commissionRate: 0.91,
    commissionNote: {
      ko: "네이버 스마트스토어 연동 시: 외부 마케팅(블로그/카페) 유입 → 판매자마케팅 수수료 0.91% + 주문관리 수수료 (영세 1.98%~). 직접 계좌이체 시 수수료 0원 (단, 소비자 보호 미흡)",
      en: "With Smartstore integration: external marketing (blog/cafe) traffic → 0.91% seller marketing fee + order mgmt fee (micro 1.98%~). Direct bank transfer: 0% fee (but lacks consumer protection)",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "블로그/카페 콘텐츠로 검색 유입 확보 후 스마트스토어 연동 판매. 마케팅 링크 활용 시 최저 수수료. SEO 기반 장기 트래픽. 네이버 카페 공동구매 문화 활성화",
      en: "Blog/cafe content drives search traffic, linked to Smartstore sales. Lowest commission via marketing links. SEO-based long-term traffic. Naver Cafe group-buy culture active",
    },
    settlement: { ko: "스마트스토어 연동 시 D+1 정산", en: "D+1 settlement when linked with Smartstore" },
    url: "https://section.blog.naver.com",
    applicableCategories: ["online-digital", "retail", "food", "cafe-dessert", "pet"],
    targetBusiness: {
      ko: "전 업종. 특히 리뷰 콘텐츠가 중요한 식품, 뷰티, 유아, 반려동물 분야",
      en: "All businesses. Especially review-driven sectors: food, beauty, baby, pet",
    },
    marketData: {
      ko: "네이버 검색 MAU 4,000만+. 블로그 일 방문 수천만 PV. 네이버 카페 월간 방문 수 억 PV",
      en: "Naver Search MAU 40M+. Blog daily visits tens of millions PV. Naver Cafe monthly visits hundreds of millions PV",
    },
    pros: {
      ko: [
        "스마트스토어 연동 시 판매수수료 0.91% 최저",
        "네이버 검색 SEO로 장기 유입 가능",
        "콘텐츠 마케팅과 판매 시너지",
        "네이버 카페 공동구매 채널 활용",
        "플랫폼 수수료 부담 최소화",
      ],
      en: [
        "0.91% minimum sales fee via Smartstore integration",
        "Long-term traffic via Naver Search SEO",
        "Content marketing and sales synergy",
        "Naver Cafe group-buy channel utilization",
        "Minimized platform fee burden",
      ],
    },
    cons: {
      ko: [
        "블로그/카페 콘텐츠 작성 노력 필요",
        "검색 상위 노출까지 시간 소요",
        "직접 계좌이체 시 분쟁/환불 리스크",
        "카페 운영 시 관리 인력 필요",
      ],
      en: [
        "Blog/cafe content creation effort required",
        "Time needed to achieve top search rankings",
        "Dispute/refund risk with direct bank transfer",
        "Cafe management requires dedicated personnel",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "kakao-channel",
    name: { ko: "카카오 채널", en: "Kakao Channel" },
    type: "social-commerce",
    commissionRate: 0,
    commissionNote: {
      ko: "카카오 채널 자체 운영 무료. 메시지 발송 비용: 친구톡 15원/건, 알림톡 6~10원/건. 톡스토어 연동 판매 시 3.3~10% 수수료. 소상공인 채널 메시지 지원금 30만원. 챗봇 무료",
      en: "Kakao Channel operation free. Message costs: FriendTalk ₩15/msg, NotifyTalk ₩6~10/msg. TalkStore sales 3.3~10% commission. ₩300K message support for SMEs. Free chatbot",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "카카오톡 기반 고객 관리 채널. 친구 추가 기반 CRM. 메시지 마케팅(알림톡/친구톡). 챗봇 무료 제공. 톡스토어 연동 가능. 쿠폰 발급·적립 기능",
      en: "KakaoTalk-based customer management channel. Friend-add based CRM. Message marketing (NotifyTalk/FriendTalk). Free chatbot. TalkStore integration. Coupon issuance and loyalty",
    },
    settlement: { ko: "톡스토어 연동 시 D+3 정산", en: "D+3 settlement when linked with TalkStore" },
    url: "https://center-pf.kakao.com",
    applicableCategories: ["food", "cafe-dessert", "retail", "online-digital", "pet", "living-service"],
    targetBusiness: {
      ko: "전 업종. 단골 고객 관리, 재방문 마케팅이 중요한 업종. 오프라인 매장 + 온라인 판매 병행 사업자",
      en: "All businesses. Businesses where regular customer management and revisit marketing matter. Offline + online hybrid businesses",
    },
    marketData: {
      ko: "카카오톡 MAU 4,700만명. 국내 최대 메신저. 기업 채널 200만+ 개설",
      en: "KakaoTalk MAU 47M. Korea's #1 messenger. 2M+ business channels created",
    },
    pros: {
      ko: [
        "카카오톡 4,700만 사용자 리치",
        "채널 운영 자체 무료",
        "알림톡 6원~로 저비용 알림 발송",
        "챗봇 무료 — 자동 응대 가능",
        "소상공인 메시지 지원금 30만원",
        "기존 고객 CRM/재방문 마케팅에 최적",
      ],
      en: [
        "47M KakaoTalk user reach",
        "Channel operation itself is free",
        "NotifyTalk from ₩6 — low-cost notifications",
        "Free chatbot — automated responses",
        "₩300K message support for SMEs",
        "Optimal for existing customer CRM/revisit marketing",
      ],
    },
    cons: {
      ko: [
        "메시지 발송 비용 누적되면 부담",
        "신규 고객 확보 기능 약함 (풀(pull)형 아님)",
        "톡스토어 연동 시 수수료 3.3~10%",
        "메시지 피로도 — 차단율 관리 필요",
      ],
      en: [
        "Message costs accumulate over time",
        "Weak for new customer acquisition (not pull-type)",
        "TalkStore integration: 3.3~10% commission",
        "Message fatigue — need to manage block rates",
      ],
    },
    dataYear: "2026",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5. 예약/서비스 플랫폼 (Reservation/Service)
// ═══════════════════════════════════════════════════════════════════════════

const reservationPlatforms: SalesPlatform[] = [
  {
    id: "naver-booking",
    name: { ko: "네이버 예약", en: "Naver Booking" },
    type: "reservation",
    commissionRate: 0,
    commissionNote: {
      ko: "예약 기능 자체 무료. 네이버페이 온라인 결제 시 주문관리 수수료만 부과: 영세 1.98%, 중소 2.58~3.74%. 현장 결제 선택 시 수수료 0원",
      en: "Reservation feature free. NaverPay online payment: order mgmt fee only — micro 1.98%, SME 2.58~3.74%. On-site payment: ₩0 fee",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "네이버 검색/지도에서 바로 예약. 10년간 누적 5억건 예약. 이용자 2,767만명 경험. 네이버 플레이스 리뷰 연동. 현장 결제 시 수수료 0원. 업종 불문 입점 가능",
      en: "Book directly from Naver Search/Maps. 500M cumulative reservations over 10 years. 27.67M users experienced. Naver Place review integration. ₩0 fee for on-site payment. Open to all business types",
    },
    settlement: { ko: "네이버페이 결제 시 D+1 정산. 현장 결제 시 즉시", en: "NaverPay: D+1 settlement. On-site payment: immediate" },
    url: "https://new-booking.biz.naver.com",
    applicableCategories: ["food", "cafe-dessert", "living-service", "retail"],
    targetBusiness: {
      ko: "음식점, 카페, 미용실, 네일샵, 숙박, 레저, 병원 등 예약이 필요한 모든 서비스업",
      en: "Restaurants, cafes, hair salons, nail shops, lodging, leisure, clinics — all service businesses needing reservations",
    },
    marketData: {
      ko: "누적 이용자 2,767만명 (국민 2명 중 1명 사용 경험). 누적 예약 5억건+. 네이버지도 MAU 2,000만명+",
      en: "27.67M cumulative users (1 in 2 Koreans). 500M+ total reservations. Naver Maps MAU 20M+",
    },
    pros: {
      ko: [
        "현장 결제 시 수수료 0원 — 완전 무료 운영 가능",
        "네이버 검색/지도 최상위 노출 연계",
        "리뷰 연동으로 마케팅 효과",
        "국민 2명 중 1명 사용 경험 — 높은 인지도",
        "업종 제한 없이 입점 가능",
      ],
      en: [
        "₩0 fee for on-site payment — completely free operation possible",
        "Top exposure via Naver Search/Maps",
        "Marketing effect through review integration",
        "1 in 2 Koreans have used it — high awareness",
        "Open to all business types without restriction",
      ],
    },
    cons: {
      ko: [
        "네이버페이 결제 시 수수료 2~4% 발생",
        "예약 관리 기능이 전문 예약앱 대비 제한적",
        "노쇼 방지 기능 약함",
        "세부 테이블/시간 관리 기능 미흡",
      ],
      en: [
        "2~4% fee when NaverPay is used",
        "Reservation management less advanced than specialized apps",
        "Weak no-show prevention",
        "Limited detailed table/time management",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "kakaomap-booking",
    name: { ko: "카카오맵 예약 (카카오톡 예약하기)", en: "KakaoMap Booking" },
    type: "reservation",
    commissionRate: 0,
    commissionNote: {
      ko: "기본 예약 기능 무료. 카카오페이 결제 연동 시 PG 수수료 약 2~3%. 카카오헤어샵 등 버티컬 서비스는 별도 수수료(최대 25%+카드수수료 2~3%). 업종별 수수료 상이",
      en: "Basic booking free. KakaoPay integration: PG fee ~2~3%. Vertical services like Kakao HairShop have separate fees (up to 25% + card 2~3%). Fees vary by business type",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "카카오맵 검색리스트/장소 상세에서 예약 버튼 노출. 업종 불문 입점 가능. 카카오톡 알림 연동. 카카오 비즈니스 파트너센터 통합 관리. 카카오헤어샵·카카오키즈 등 버티컬 서비스 존재",
      en: "Booking button in KakaoMap search/place details. Open to all business types. KakaoTalk notification integration. Kakao Business Partner Center unified management. Vertical services: Kakao HairShop, KakaoKids, etc.",
    },
    settlement: { ko: "카카오페이 결제 시 D+3 정산", en: "D+3 settlement with KakaoPay" },
    url: "https://kakaobusiness.gitbook.io/main/tool/booking",
    applicableCategories: ["food", "cafe-dessert", "living-service"],
    targetBusiness: {
      ko: "음식점, 카페, 미용실, 네일샵, 숙박 등 예약 필요 업종. 카카오 생태계 활용 사업자",
      en: "Restaurants, cafes, hair salons, nail shops, lodging. Businesses in Kakao ecosystem",
    },
    marketData: {
      ko: "카카오맵 MAU 약 1,700만명. 카카오톡 4,700만명 연계 노출",
      en: "KakaoMap MAU ~17M. 47M KakaoTalk exposure integration",
    },
    pros: {
      ko: [
        "카카오맵/카카오톡 연동 — 높은 접근성",
        "기본 예약 기능 무료",
        "카카오톡 알림으로 노쇼 방지",
        "카카오 비즈니스 통합 관리",
      ],
      en: [
        "KakaoMap/KakaoTalk integration — high accessibility",
        "Basic booking feature free",
        "No-show prevention via KakaoTalk notifications",
        "Unified Kakao Business management",
      ],
    },
    cons: {
      ko: [
        "버티컬 서비스(헤어샵 등) 수수료 매우 높음 (최대 25%+)",
        "예약 관리 고급 기능 제한적",
        "네이버 대비 예약 인지도 낮음",
        "업종별 수수료 편차 큼",
      ],
      en: [
        "Vertical service (hair shop etc) fees very high (up to 25%+)",
        "Limited advanced reservation management features",
        "Lower booking awareness vs Naver",
        "Significant fee variation by business type",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "tabling",
    name: { ko: "테이블링", en: "Tabling" },
    type: "reservation",
    commissionRate: 0,
    commissionNote: {
      ko: "월 이용료 99,000원 (유료 전환). 기기값(태블릿) 약 44만원 별도 (초기 1회). 소비자 무료. 테이블링페이 결제 연동 가능",
      en: "Monthly fee ₩99,000 (converted to paid). Device (tablet) ~₩440K separate (one-time). Free for consumers. Tabling Pay integration available",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 99000,
    features: {
      ko: "원격 줄서기(웨이팅) 전문 앱 1위. 태블릿 기반 매장 웨이팅 관리. 테이블링페이 연동 결제. 타임세일·포장할인 기능. 원격 줄서기·순서 미루기 등 소비자 편의 기능",
      en: "#1 remote queueing (waiting) app. Tablet-based store waiting management. Tabling Pay integration. Time-sale/takeout discount features. Remote queueing, order deferring consumer conveniences",
    },
    settlement: { ko: "테이블링페이 결제 시 D+3 정산", en: "D+3 settlement with Tabling Pay" },
    url: "https://www.tabling.co.kr",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "웨이팅이 많은 인기 음식점, 카페, 베이커리. 줄서기 관리가 필요한 매장",
      en: "Popular restaurants, cafes, bakeries with queues. Stores needing queue management",
    },
    marketData: {
      ko: "웨이팅 앱 1위 (사용자 기준). MAU 약 300만명+. 전국 수만 개 매장 입점",
      en: "#1 waiting app (by users). MAU ~3M+. Tens of thousands of stores nationwide",
    },
    pros: {
      ko: [
        "웨이팅 관리 전문 — 기능 풍부",
        "원격 줄서기로 고객 편의 향상 → 매출↑",
        "타임세일·포장할인 기능으로 비수기 대응",
        "사용자 수 1위 — 높은 인지도",
      ],
      en: [
        "Specialized waiting management — feature-rich",
        "Remote queueing improves customer convenience → sales up",
        "Time-sale/takeout discount for off-peak",
        "#1 users — high brand awareness",
      ],
    },
    cons: {
      ko: [
        "월 99,000원 고정비 — 소규모 매장 부담",
        "초기 기기값 약 44만원 별도",
        "웨이팅이 없는 매장에는 불필요",
        "유료 전환 이후 가맹점 이탈 사례 있음",
      ],
      en: [
        "₩99,000/mo fixed cost — burden for small stores",
        "Initial device cost ~₩440K",
        "Unnecessary for stores without queues",
        "Some store churn after paid conversion",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "catchtable",
    name: { ko: "캐치테이블", en: "CatchTable" },
    type: "reservation",
    commissionRate: 0,
    commissionNote: {
      ko: "월 예약건수 기반 차등 이용료: 150건 미만 33,000원, 150~300건 55,000원, 300~450건 77,000원, 450건+ 99,000원. 소비자 무료. 예약금 0원 결제 시범 운영 중",
      en: "Tiered monthly fee by reservations: <150: ₩33K, 150~300: ₩55K, 300~450: ₩77K, 450+: ₩99K. Free for consumers. Zero-deposit booking pilot ongoing",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 33000,
    features: {
      ko: "국내 레스토랑 예약 앱 1위. 1만+ 가맹점 입점. 파인다이닝/미쉐린 등 프리미엄 매장 강세. 예약관리·고객관리·노쇼방지 통합 솔루션. 캐치페이 결제. 2025년 '예약금 0원 결제' 도입",
      en: "#1 Korean restaurant reservation app. 10K+ partner stores. Strong in fine dining/Michelin. Integrated reservation/CRM/no-show prevention. CatchPay. 2025 zero-deposit booking launched",
    },
    settlement: { ko: "캐치페이 결제 시 D+3 정산", en: "D+3 settlement with CatchPay" },
    url: "https://app.catchtable.co.kr",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "레스토랑, 파인다이닝, 오마카세, 프리미엄 카페 등 예약 중심 F&B. 특히 객단가 높은 매장에 적합",
      en: "Restaurants, fine dining, omakase, premium cafes. Especially suited for high-ticket venues",
    },
    marketData: {
      ko: "국내 식당 예약 앱 1위. 입점 가맹점 1만개+. 흑백요리사 나비효과로 이용률 급증 (2024). MAU 수백만명",
      en: "#1 restaurant reservation app in Korea. 10K+ partner stores. Usage surged after 'Black and White Chef' effect (2024). MAU in millions",
    },
    pros: {
      ko: [
        "레스토랑 예약 특화 — 국내 1위",
        "예약건수 기반 요금으로 저건수 매장 부담 적음 (월 33,000원~)",
        "프리미엄 고객층 유입 효과",
        "노쇼 방지 시스템 내장",
        "예약금 0원 결제로 소비자 진입장벽 ↓",
      ],
      en: [
        "Restaurant reservation specialized — Korea's #1",
        "Reservation-based pricing: low for low-volume stores (from ₩33K)",
        "Premium customer inflow effect",
        "Built-in no-show prevention",
        "Zero-deposit booking lowers consumer entry barrier",
      ],
    },
    cons: {
      ko: [
        "예약 450건 이상 시 월 99,000원",
        "파인다이닝 편중 — 일반 음식점에는 효과 제한적",
        "네이버 예약 대비 이용자 수 적음",
        "입점 심사 존재 (모든 매장 가능하지 않음)",
      ],
      en: [
        "₩99,000/mo for 450+ reservations",
        "Fine dining bias — limited effect for casual restaurants",
        "Fewer users than Naver Booking",
        "Entry screening exists (not all stores qualify)",
      ],
    },
    dataYear: "2026",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 6. POS/결제 시스템 (POS/Payment)
// ═══════════════════════════════════════════════════════════════════════════

const posPayment: SalesPlatform[] = [
  {
    id: "toss-pos",
    name: { ko: "토스 POS (토스플레이스)", en: "Toss POS (Toss Place)" },
    type: "pos-payment",
    commissionRate: 0.8,
    commissionNote: {
      ko: "카드 결제 수수료: 영세가맹점(매출 3억 이하) 신용카드 0.40%, 체크카드 0.15%. 중소가맹점(3~5억) 신용 1.00%, 체크 0.75%. 중소(5~10억) 신용 1.15%, 체크 0.90%. POS 프로그램 무료. 단말기 약 3만원대. 월 이용료 0원 또는 태블릿 세트 9,900원/월",
      en: "Card fee: micro-merchants (under ₩300M) credit 0.40%, debit 0.15%. SME (300~500M) credit 1.00%, debit 0.75%. SME (500M~1B) credit 1.15%, debit 0.90%. POS software free. Terminal ~₩30K. Monthly ₩0 or tablet set ₩9,900/mo",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "설치비 0원, 월 사용료 0원, 위약금 0원. 기존 기기(태블릿·폰·노트북)에 앱 설치로 바로 사용. 토스오더(QR 주문) 무료. 포인트 적립·쿠폰 발송 무료. 가맹점 20만+ 돌파. 네이버 플레이스 예약 연동",
      en: "₩0 setup, ₩0 monthly, ₩0 penalty. Install on existing devices (tablet/phone/laptop). Toss Order (QR) free. Free loyalty/coupon. 200K+ merchants. Naver Place reservation integration",
    },
    settlement: { ko: "D+1 정산", en: "D+1 settlement" },
    url: "https://tossplace.com",
    applicableCategories: ["food", "cafe-dessert", "retail", "living-service", "pet"],
    targetBusiness: {
      ko: "모든 오프라인 매장. 특히 음식점, 카페, 소매점. POS 비용 부담 줄이고 싶은 소상공인",
      en: "All offline stores. Especially restaurants, cafes, retail. SMEs seeking to reduce POS costs",
    },
    marketData: {
      ko: "가맹점 20만+ 돌파 (2025). 최고 밀집 상권 홍대. 토스 MAU 2,000만+",
      en: "200K+ merchants (2025). Highest density in Hongdae. Toss MAU 20M+",
    },
    pros: {
      ko: [
        "설치비·월이용료·위약금 모두 0원",
        "기존 기기에 앱 설치로 바로 사용 가능",
        "영세가맹점 카드수수료 최저 0.40%",
        "토스오더(QR 주문) 무료 제공",
        "포인트 적립·쿠폰 무료",
        "네이버 플레이스 예약 연동",
        "D+1 빠른 정산",
      ],
      en: [
        "₩0 setup, monthly, and penalty fees",
        "Instant use on existing devices",
        "Micro-merchant card fee as low as 0.40%",
        "Free Toss Order (QR ordering)",
        "Free loyalty points and coupons",
        "Naver Place reservation integration",
        "Fast D+1 settlement",
      ],
    },
    cons: {
      ko: [
        "유선 전원 필수 — 무선 배터리 단말기 아님",
        "태블릿 세트 선택 시 월 9,900원",
        "신규 사업자는 '일반' 등급으로 시작 — 우대수수료 자동 반영까지 시간 소요",
        "전용 하드웨어가 아니라 안정성 우려 일부 존재",
      ],
      en: [
        "Wired power required — not wireless battery terminal",
        "₩9,900/mo if choosing tablet set",
        "New businesses start as 'general' tier — time for preferred rates",
        "Some stability concerns as not dedicated hardware",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "payhere",
    name: { ko: "페이히어", en: "PayHere" },
    type: "pos-payment",
    commissionRate: 0.8,
    commissionNote: {
      ko: "POS 앱 자체 무료 (가입비·월회비·약정 없음). 카드 결제 수수료: 영세(3억 이하) 신용 0.40%, 체크 0.15%. 마케팅 분석 등 유료 부가 기능 별도. 단말기(카드결제기) 3만원대~20만원대",
      en: "POS app free (no signup/monthly/contract fee). Card fee: micro (under ₩300M) credit 0.40%, debit 0.15%. Paid add-on for marketing analytics. Terminal ₩30K~200K",
    },
    deliveryFeePerOrder: 0,
    monthlyFixed: 0,
    features: {
      ko: "국내 최초 클라우드 POS. 안드로이드/아이패드/휴대전화 앱 설치 즉시 사용. 예약·배달·주문·결제·고객관리 통합 솔루션. 택스리펀(외국인 부가세 환급) 기능. 업계 최다 매장 사용. 포브스 아시아 100대 유망기업 선정. 누적 투자 500억원",
      en: "Korea's first cloud POS. Instant use on Android/iPad/phone. Integrated reservation/delivery/order/payment/CRM. Tax refund feature (foreigner VAT). Most stores in industry. Forbes Asia 100 to Watch. ₩50B cumulative investment",
    },
    settlement: { ko: "D+1~D+2 정산 (카드사별 상이)", en: "D+1~D+2 settlement (varies by card company)" },
    url: "https://www.payhere.in",
    applicableCategories: ["food", "cafe-dessert", "retail", "living-service", "pet"],
    targetBusiness: {
      ko: "모든 오프라인 매장. 특히 트렌디한 카페·레스토랑·소매. 외국인 관광객 많은 매장 (택스리펀 기능)",
      en: "All offline stores. Especially trendy cafes/restaurants/retail. Stores with foreign tourists (tax refund feature)",
    },
    marketData: {
      ko: "업계 최다 매장 사용 (누적 수십만 매장). 2024년 150억원 시리즈 B2 유치, 누적 투자 500억원. 포브스 아시아 100대 유망기업",
      en: "Most stores in industry (hundreds of thousands cumulative). ₩15B Series B2 in 2024, ₩50B total. Forbes Asia 100 to Watch",
    },
    pros: {
      ko: [
        "POS 앱 완전 무료 — 가입비·월회비·약정 없음",
        "다양한 기기 호환 (안드로이드/아이패드/폰)",
        "예약·배달·주문·결제·CRM 통합",
        "택스리펀 기능 — 관광객 매장에 강점",
        "클라우드 기반 — 언제 어디서든 매출 확인",
        "디자인 세련됨 — 힙한 매장 선호",
      ],
      en: [
        "POS app completely free — no signup/monthly/contract fee",
        "Multi-device compatible (Android/iPad/phone)",
        "Integrated reservation/delivery/order/payment/CRM",
        "Tax refund feature — advantage for tourist-area stores",
        "Cloud-based — check sales from anywhere",
        "Sleek design — preferred by trendy stores",
      ],
    },
    cons: {
      ko: [
        "마케팅 분석 등 고급 기능은 유료",
        "카드 단말기 별도 구매 필요 (3만~20만원대)",
        "토스 대비 브랜드 인지도 낮음",
        "일부 결제 안정성 이슈 사례 보고",
      ],
      en: [
        "Marketing analytics and advanced features are paid",
        "Card terminal separate purchase (₩30K~200K)",
        "Lower brand awareness vs Toss",
        "Some payment stability issues reported",
      ],
    },
    dataYear: "2026",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 7. 배달대행사 (Delivery Agency)
// ═══════════════════════════════════════════════════════════════════════════

const deliveryAgencies: SalesPlatform[] = [
  {
    id: "barogo",
    name: { ko: "바로고", en: "Barogo" },
    type: "delivery-agency",
    commissionRate: 0,
    commissionNote: {
      ko: "중개 수수료 없음. 건당 배달비 방식. 지역배달대행사가 식당과 직접 계약. 기본 배달비 약 3,000~3,500원 (지역·거리 따라 변동). 월 프로그램 이용료(가맹비) 약 50,000원. 라이더 중개 수수료 약 80원/건",
      en: "No intermediary commission. Per-delivery fee structure. Regional agencies contract directly with restaurants. Base delivery fee ~₩3,000~3,500 (varies by region/distance). Monthly program fee ~₩50,000. Rider intermediary fee ~₩80/delivery",
    },
    deliveryFeePerOrder: 3500,
    monthlyFixed: 50000,
    features: {
      ko: "국내 최대 배달대행 플랫폼. 전국 지역배달대행사 네트워크. AI 기반 배차 시스템. 실시간 배달 추적. 배민·요기요·쿠팡이츠 등 배달앱 연동. 바로가페이(배달비 카드결제) 3.6%",
      en: "Korea's largest delivery agency platform. Nationwide regional agency network. AI-based dispatch. Real-time tracking. Integration with Baemin/Yogiyo/Coupang Eats. BarogaPay (delivery fee card payment) 3.6%",
    },
    settlement: { ko: "월 정산 (지역대행사별 상이)", en: "Monthly settlement (varies by regional agency)" },
    url: "https://www.barogo.com",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "음식점, 카페 등 배달이 필요한 F&B 업종. 가게배달 선택 시 배달대행 필요",
      en: "F&B businesses needing delivery. Required when choosing store delivery option",
    },
    marketData: {
      ko: "국내 배달대행 1위 플랫폼. 전국 수만 개 가맹점 연결. 현금 226억 보유 (2025 기준)",
      en: "#1 delivery agency platform in Korea. Tens of thousands of partner stores. ₩22.6B cash reserves (2025)",
    },
    pros: {
      ko: [
        "전국 최대 라이더 네트워크 — 배달 수급 안정",
        "AI 배차로 효율적 매칭",
        "배달앱 연동 (배민·요기요 등)",
        "실시간 추적 가능",
      ],
      en: [
        "Largest rider network — stable delivery supply",
        "AI dispatch for efficient matching",
        "Delivery app integration (Baemin/Yogiyo etc)",
        "Real-time tracking available",
      ],
    },
    cons: {
      ko: [
        "건당 3,000~3,500원 + 가맹비 5만원/월 — 비용 누적",
        "지역·시간대별 배달비 편차 큼",
        "성수기/날씨 영향으로 배달비 급등 가능",
        "배달 품질은 지역대행사·라이더에 의존",
      ],
      en: [
        "₩3,000~3,500/delivery + ₩50K/mo fee — costs accumulate",
        "Significant fee variation by region/time",
        "Delivery fee spikes during peak/bad weather",
        "Delivery quality depends on regional agency/rider",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "vroong",
    name: { ko: "부릉", en: "Vroong (MeshKorea)" },
    type: "delivery-agency",
    commissionRate: 0,
    commissionNote: {
      ko: "중개 수수료 없음. 건당 배달비 방식. 메쉬코리아 본사가 식당과 직접 계약 후 부릉 지사에 배달 위탁. 건당 약 3,000~4,000원 (지역·거리에 따라 변동). 인상 계획 없다고 발표",
      en: "No intermediary commission. Per-delivery fee. MeshKorea contracts directly with restaurants, outsources to Vroong branches. ~₩3,000~4,000/delivery (varies by region/distance). No rate increase planned",
    },
    deliveryFeePerOrder: 3500,
    monthlyFixed: 0,
    features: {
      ko: "프리미엄 배달대행 표방. 메쉬코리아 운영. 라이더 직접 관리(직고용). 배달 품질 균일화 노력. POS 연동 가이드 제공. 배민·요기요 등 배달앱 연동",
      en: "Premium delivery agency positioning. Operated by MeshKorea. Direct rider management (direct employment). Delivery quality standardization. POS integration guide. Delivery app integration",
    },
    settlement: { ko: "월 정산", en: "Monthly settlement" },
    url: "https://home.vroong.com",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "음식점, 카페 등 배달이 필요한 F&B 업종. 배달 품질을 중시하는 매장",
      en: "F&B businesses needing delivery. Stores prioritizing delivery quality",
    },
    marketData: {
      ko: "배달대행 2위 플랫폼. 프리미엄 서비스로 차별화. 메쉬코리아 누적 투자 수백억원",
      en: "#2 delivery agency platform. Differentiated as premium service. MeshKorea hundreds of billions won invested",
    },
    pros: {
      ko: [
        "프리미엄 배달 — 품질 안정적",
        "라이더 직접 관리로 서비스 균일",
        "배달비 인상 계획 없다고 선언",
        "POS 연동 가이드 제공",
      ],
      en: [
        "Premium delivery — stable quality",
        "Direct rider management for uniform service",
        "Declared no delivery fee increase planned",
        "POS integration guide provided",
      ],
    },
    cons: {
      ko: [
        "바로고 대비 커버리지 좁음",
        "건당 배달비 바로고 대비 소폭 높을 수 있음",
        "일부 지역 서비스 미제공",
        "적자 경영 이슈 (산업 전반)",
      ],
      en: [
        "Narrower coverage than Barogo",
        "Per-delivery fee may be slightly higher than Barogo",
        "Service unavailable in some regions",
        "Industry-wide profitability challenges",
      ],
    },
    dataYear: "2026",
  },
  {
    id: "saenggakdaero",
    name: { ko: "생각대로", en: "Saenggakdaero" },
    type: "delivery-agency",
    commissionRate: 0,
    commissionNote: {
      ko: "중개 수수료 없음. 건당 배달비 방식. 바로고와 유사한 지역대행사 연결 모델. 지역대행사가 식당과 직접 계약. 기본 배달비 약 3,000~3,500원. 본사는 배달수수료에 관여 안 함",
      en: "No intermediary commission. Per-delivery fee. Regional agency connection model similar to Barogo. Agencies contract directly with restaurants. Base delivery ~₩3,000~3,500. Headquarters not involved in delivery fee setting",
    },
    deliveryFeePerOrder: 3300,
    monthlyFixed: 0,
    features: {
      ko: "지역배달대행사 연결 프로그램. 바로고와 함께 배달대행 양대 산맥. 전국 지역 네트워크. 배달앱 연동. 배달수수료는 지역·거리·시세에 따라 지역대행사가 결정",
      en: "Regional delivery agency connection program. One of the two major delivery agency platforms alongside Barogo. Nationwide network. Delivery app integration. Fees set by regional agencies based on area/distance/market rate",
    },
    settlement: { ko: "월 정산 (지역대행사별 상이)", en: "Monthly settlement (varies by regional agency)" },
    url: "https://www.sgdr.co.kr",
    applicableCategories: ["food", "cafe-dessert"],
    targetBusiness: {
      ko: "음식점, 카페 등 배달이 필요한 F&B 업종",
      en: "F&B businesses needing delivery",
    },
    marketData: {
      ko: "바로고와 함께 배달대행 양대 산맥. 전국 수천 개 지역대행사 네트워크",
      en: "One of two major platforms alongside Barogo. Thousands of regional agency networks nationwide",
    },
    pros: {
      ko: [
        "전국 광범위한 지역 네트워크",
        "바로고와 함께 가장 많은 라이더 풀",
        "배달앱 POS 연동",
        "지역 친밀도 높은 서비스",
      ],
      en: [
        "Extensive nationwide regional network",
        "Largest rider pool alongside Barogo",
        "Delivery app POS integration",
        "Locally familiar service",
      ],
    },
    cons: {
      ko: [
        "배달비·서비스 품질이 지역대행사에 따라 편차 큼",
        "본사 차원의 가격 통제 불가",
        "피크 시간대·악천후 시 배달비 급등",
        "바로고 대비 기술 인프라 열세라는 평가",
      ],
      en: [
        "Fee/service quality varies significantly by regional agency",
        "No price control at headquarters level",
        "Delivery fee spikes during peak/bad weather",
        "Perceived weaker tech infrastructure vs Barogo",
      ],
    },
    dataYear: "2026",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 공개 API
// ═══════════════════════════════════════════════════════════════════════════

export const allSalesPlatforms: SalesPlatform[] = [
  ...deliveryApps,
  ...couriers,
  ...onlineMarketplaces,
  ...socialCommerce,
  ...reservationPlatforms,
  ...posPayment,
  ...deliveryAgencies,
];

/** 하위 호환: 기존 이름 유지 */
export const allLogisticsPlatforms = allSalesPlatforms;

// ─── 타입별 필터링 ──────────────────────────────────────────────────────

/** 업종 카테고리에 맞는 플랫폼 목록 반환 */
export function getPlatformsForCategory(categoryId: string): SalesPlatform[] {
  return allSalesPlatforms.filter((p) =>
    p.applicableCategories.includes(categoryId)
  );
}

/** 하위 호환 */
export const getLogisticsPlatformsForCategory = getPlatformsForCategory;

/** 타입별 필터 */
export function getPlatformsByType(type: PlatformType): SalesPlatform[] {
  return allSalesPlatforms.filter((p) => p.type === type);
}

/** 배달 플랫폼 */
export function getDeliveryApps(categoryId?: string): SalesPlatform[] {
  const platforms = getPlatformsByType("delivery");
  return categoryId ? platforms.filter((p) => p.applicableCategories.includes(categoryId)) : platforms;
}

/** 택배사 */
export function getCouriers(categoryId?: string): SalesPlatform[] {
  const platforms = getPlatformsByType("courier");
  return categoryId ? platforms.filter((p) => p.applicableCategories.includes(categoryId)) : platforms;
}

/** 온라인 마켓플레이스 */
export function getOnlineMarketplaces(categoryId?: string): SalesPlatform[] {
  const platforms = getPlatformsByType("online-marketplace");
  return categoryId ? platforms.filter((p) => p.applicableCategories.includes(categoryId)) : platforms;
}

/** 소셜/SNS 판매 */
export function getSocialCommerce(categoryId?: string): SalesPlatform[] {
  const platforms = getPlatformsByType("social-commerce");
  return categoryId ? platforms.filter((p) => p.applicableCategories.includes(categoryId)) : platforms;
}

/** 예약/서비스 플랫폼 */
export function getReservationPlatforms(categoryId?: string): SalesPlatform[] {
  const platforms = getPlatformsByType("reservation");
  return categoryId ? platforms.filter((p) => p.applicableCategories.includes(categoryId)) : platforms;
}

/** POS/결제 시스템 */
export function getPosPayment(categoryId?: string): SalesPlatform[] {
  const platforms = getPlatformsByType("pos-payment");
  return categoryId ? platforms.filter((p) => p.applicableCategories.includes(categoryId)) : platforms;
}

/** 배달대행사 */
export function getDeliveryAgencies(categoryId?: string): SalesPlatform[] {
  const platforms = getPlatformsByType("delivery-agency");
  return categoryId ? platforms.filter((p) => p.applicableCategories.includes(categoryId)) : platforms;
}

// ─── 업종 판별 유틸 ──────────────────────────────────────────────────────

/** 배달 업종인지 (배달앱 표시) */
export function isDeliveryCategory(categoryId: string): boolean {
  return categoryId === "food" || categoryId === "cafe-dessert";
}

/** 배송 업종인지 (택배사 표시) */
export function isShippingCategory(categoryId: string): boolean {
  return ["online-digital", "retail", "pet", "living-service"].includes(categoryId);
}

// ─── 라벨 유틸 ───────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PlatformType, { ko: string; en: string }> = {
  delivery: { ko: "배달 플랫폼", en: "Delivery Platform" },
  courier: { ko: "택배사", en: "Courier Service" },
  "online-marketplace": { ko: "온라인 마켓플레이스", en: "Online Marketplace" },
  "social-commerce": { ko: "소셜/SNS 판매", en: "Social Commerce" },
  reservation: { ko: "예약/서비스 플랫폼", en: "Reservation/Service Platform" },
  "pos-payment": { ko: "POS/결제 시스템", en: "POS/Payment System" },
  "delivery-agency": { ko: "배달대행사", en: "Delivery Agency" },
};

/** 플랫폼 타입 라벨 */
export function getLogisticsTypeLabel(type: PlatformType, language: "ko" | "en"): string {
  return TYPE_LABELS[type]?.[language] ?? type;
}

/** 플랫폼 ID로 검색 */
export function getPlatformById(id: string): SalesPlatform | undefined {
  return allSalesPlatforms.find((p) => p.id === id);
}

/** 수수료 비교: 특정 카테고리·타입의 플랫폼을 수수료 낮은 순 정렬 */
export function comparePlatformsByCommission(
  type: PlatformType,
  categoryId?: string
): SalesPlatform[] {
  let platforms = getPlatformsByType(type);
  if (categoryId) {
    platforms = platforms.filter((p) => p.applicableCategories.includes(categoryId));
  }
  return [...platforms].sort((a, b) => a.commissionRate - b.commissionRate);
}
