/* ─────────────────────────────────────────────
 *  franchise-data.ts
 *  Sub-industry-level franchise brand database
 *  Scores: 0–100 per axis
 *  Data sources: KFTC 정보공개서, 마이프차, 각 브랜드 공식 자료 (2024–2025)
 * ───────────────────────────────────────────── */

export type FranchiseScores = {
  profitability: number;
  stability: number;
  accessibility: number;
  brandPower: number;
  support: number;
};

export type FranchiseCostItem = {
  label: { ko: string; en: string };
  amountWon: number; // 만원 단위
};

export type FranchiseBrand = {
  id: string;
  subIndustryIds: string[];
  categoryId: string;
  name: { ko: string; en: string };
  tagline: { ko: string; en: string };
  startupCostWon: number;
  franchiseFee: number;
  monthlyRoyalty: number;
  avgAnnualRevenueWon: number;
  storeCount: number;
  closureRate: number;
  scores: FranchiseScores;
  roadmapNotes: { ko: string[]; en: string[] };
  /** 검증된 비용 내역 — 없으면 미검증 */
  costBreakdown?: FranchiseCostItem[];
  /** 비용 데이터 검증 여부 */
  costVerified: boolean;
  /** 비용 출처 */
  costSource?: string;
  /** 권장 최소 평수 */
  minPyeong?: number;
  /** 기준 평수 (비용 산정 기준) */
  basePyeong?: number;
  storeLocatorUrl?: string;
  /** 가맹 문의/창업 안내 페이지 */
  franchiseUrl?: string;
  dataYear: string;
};

export type FranchiseCostBreakdown = {
  franchiseFee: number;
  education: number;
  deposit: number;
  interior: number;
  equipment: number;
  signage: number;
  initialStock: number;
  other: number;
  total: number;
  monthlyRoyalty: number;
};

function b(brand: FranchiseBrand): FranchiseBrand { return brand; }
/** Shorthand cost item */
function c(ko: string, en: string, amount: number): FranchiseCostItem {
  return { label: { ko, en }, amountWon: amount };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  chicken-burger (치킨/버거/피자)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const bbq = b({ id: "bbq", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "BBQ", en: "BBQ Chicken" }, tagline: { ko: "가맹점 수 1위, 올리브 치킨 대표 브랜드", en: "#1 by store count, olive chicken pioneer" }, startupCostWon: 9079, franchiseFee: 500, monthlyRoyalty: 25, avgAnnualRevenueWon: 49684, storeCount: 2238, closureRate: 3.2, scores: { profitability: 82, stability: 72, accessibility: 75, brandPower: 92, support: 80 }, roadmapNotes: { ko: ["가맹점 수 전국 1위 (2,238개)", "배달 비중 높은 구조 — 배달 플랫폼 연동 필수", "본사 물류 직배송 시스템", "치킨대학 교육 2주 필수"], en: ["#1 franchise count nationwide (2,238)", "High delivery ratio — platform integration essential", "HQ direct logistics system", "2-week Chicken University training mandatory"] }, storeLocatorUrl: "https://www.bbq.co.kr/store", franchiseUrl: "https://bbqstart.co.kr/", costVerified: true, costSource: "정보공개서 2024", basePyeong: 15, costBreakdown: [c("가맹비","Franchise fee",1100),c("교육비","Training",410),c("보증금","Deposit",500),c("인테리어·장비","Interior+equip",7060)], dataYear: "2024" });

const bhc = b({ id: "bhc", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "BHC", en: "BHC Chicken" }, tagline: { ko: "매출 1위 치킨 프랜차이즈, 뿌링클 브랜드", en: "#1 chicken revenue, Ppurinkle brand" }, startupCostWon: 8543, franchiseFee: 500, monthlyRoyalty: 25, avgAnnualRevenueWon: 54672, storeCount: 2291, closureRate: 6.6, scores: { profitability: 88, stability: 55, accessibility: 78, brandPower: 90, support: 78 }, roadmapNotes: { ko: ["점당 매출 5.47억으로 치킨 2위", "폐점률 6.6% — 상권 분석 특히 중요", "뿌링클 등 시그니처 메뉴 강점", "인테리어 본사 시공 필수"], en: ["5.47B per-store — #2 in chicken", "6.6% closure rate — location analysis critical", "Ppurinkle signature menu advantage", "HQ interior mandatory"] }, storeLocatorUrl: "https://www.bhc.co.kr/store", franchiseUrl: "https://www.bhc.co.kr/aboutUs", costVerified: true, costSource: "정보공개서 2024", basePyeong: 15, costBreakdown: [c("가맹비","Franchise fee",1100),c("교육비","Training",240),c("보증금","Deposit",1000),c("인테리어·장비","Interior+equip",6200)], dataYear: "2024" });

const kyochon = b({ id: "kyochon-chicken", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "교촌치킨", en: "Kyochon Chicken" }, tagline: { ko: "점당매출 1위, 프리미엄 치킨 브랜드", en: "#1 per-store revenue, premium chicken" }, startupCostWon: 24015, franchiseFee: 676, monthlyRoyalty: 33, avgAnnualRevenueWon: 69430, storeCount: 1377, closureRate: 2.1, scores: { profitability: 95, stability: 80, accessibility: 38, brandPower: 95, support: 88 }, roadmapNotes: { ko: ["점당 매출 6.94억 — 치킨 업계 최고", "창업비용 2.4억+ — 높은 초기 투자", "폐점률 2.1% — 업계 최저 수준", "본사 교육 4주 필수"], en: ["6.94B per-store — highest in chicken", "2.4B+ startup — high initial investment", "2.1% closure — lowest in industry", "4-week HQ training mandatory"] }, storeLocatorUrl: "https://www.kyochonfnb.com", franchiseUrl: "https://www.kyochonfnb.com/business/domestic.do", costVerified: true, costSource: "교촌 공식사이트 2025", basePyeong: 20, costBreakdown: [c("가맹비","Franchise fee",660),c("교육비","Training",355),c("보증금","Deposit",1000),c("인테리어·POS·주방","Interior+POS+kitchen",11909)], dataYear: "2024" });

const goobne = b({ id: "goobne", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "굽네치킨", en: "Goobne Chicken" }, tagline: { ko: "오븐 구이 치킨 대표, 건강한 이미지", en: "Oven-roasted chicken leader, health image" }, startupCostWon: 9200, franchiseFee: 500, monthlyRoyalty: 25, avgAnnualRevenueWon: 49264, storeCount: 1154, closureRate: 3.5, scores: { profitability: 82, stability: 72, accessibility: 75, brandPower: 82, support: 78 }, roadmapNotes: { ko: ["오븐 구이 — 튀기지 않는 건강 콘셉트", "점당 매출 4.93억", "호프집 형태 20평 이상 모델 가능", "주방기물 장기렌탈 지원"], en: ["Oven-roasted — healthy non-fried concept", "4.93B per-store revenue", "Pub-style 20+ pyeong model available", "Kitchen equipment long-term rental support"] }, franchiseUrl: "https://www.goobne.co.kr/brd/const/franchise", costVerified: true, costSource: "정보공개서 2024", basePyeong: 15, costBreakdown: [c("가맹비","Franchise fee",550),c("교육비","Training",220),c("보증금","Deposit",0),c("인테리어·장비","Interior+equip",8340)], dataYear: "2024" });

const momsTouch = b({ id: "moms-touch", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "맘스터치", en: "Mom's Touch" }, tagline: { ko: "버거+치킨 하이브리드, 가성비 1위", en: "Burger+chicken hybrid, best value" }, startupCostWon: 11000, franchiseFee: 550, monthlyRoyalty: 25, avgAnnualRevenueWon: 45000, storeCount: 1450, closureRate: 1.8, scores: { profitability: 90, stability: 82, accessibility: 70, brandPower: 92, support: 85 }, roadmapNotes: { ko: ["버거+치킨 복합 — 피크 시간대 분산", "가맹비 550만 + 교육비 0원", "배달 비중 40%+", "10평대 소형 매장 가능"], en: ["Burger+chicken combo — peak time diversification", "550K fee + zero training fee", "40%+ delivery ratio", "Small stores (10+ pyeong) viable"] }, storeLocatorUrl: "https://www.momstouch.co.kr/store", franchiseUrl: "https://www.momstouch.co.kr/franchise", costVerified: true, costSource: "정보공개서 2024", basePyeong: 20, costBreakdown: [c("가맹비","Franchise fee",500),c("기획관리비","Planning",200),c("보증금","Deposit",100),c("인테리어","Interior",5056),c("간판","Signage",750),c("가구","Furniture",1000),c("장비","Equipment",2300),c("전산장비","IT+POS",696)], dataYear: "2024" });

const sixtyChicken = b({ id: "60gye-chicken", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "60계치킨", en: "60gye Chicken" }, tagline: { ko: "저가 치킨 대표, 가성비 전략", en: "Budget chicken leader, value strategy" }, startupCostWon: 6500, franchiseFee: 300, monthlyRoyalty: 16.5, avgAnnualRevenueWon: 37424, storeCount: 800, closureRate: 4.0, scores: { profitability: 75, stability: 68, accessibility: 88, brandPower: 70, support: 72 }, roadmapNotes: { ko: ["창업비용 6,500만원 — 업계 최저 수준", "저가 전략으로 빠른 회전율", "소규모 배달 전문 매장 가능", "점당 매출 3.74억"], en: ["6,500만 startup — lowest in industry", "Budget pricing for fast turnover", "Small delivery-only stores viable", "3.74B per-store revenue"] }, franchiseUrl: "http://60chicken.co.kr/bbs/content.php?co_id=fran01", costVerified: true, costSource: "정보공개서 2024", basePyeong: 12, costBreakdown: [c("총 창업비용","Total startup cost",8550)], dataYear: "2024" });

const dominos = b({ id: "dominos", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "도미노피자", en: "Domino's Pizza" }, tagline: { ko: "피자 배달 1위, 점당매출 8억+", en: "#1 pizza delivery, 8B+ per-store" }, startupCostWon: 25250, franchiseFee: 1500, monthlyRoyalty: 0, avgAnnualRevenueWon: 80000, storeCount: 520, closureRate: 2.0, scores: { profitability: 92, stability: 82, accessibility: 35, brandPower: 95, support: 90 }, roadmapNotes: { ko: ["로열티 0원 — 매출의 6% 수수료 구조", "점당 매출 8억+ — 피자 업계 최고", "창업비용 2.5억+ — 높은 진입장벽", "30분 배달 보장 시스템"], en: ["Zero royalty — 6% revenue share", "8B+ per-store — highest in pizza", "2.5B+ startup — high barrier", "30-min delivery guarantee system"] }, franchiseUrl: "https://web.dominos.co.kr/company/contents/chainstore1", costVerified: true, costSource: "정보공개서 2024", basePyeong: 20, costBreakdown: [c("가맹비","Franchise fee",1500),c("인테리어·장비·기타","Interior+equip+other",23750)], dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  korean-casual (한식/백반)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const hongkongBanjum = b({ id: "hongkong-banjum", subIndustryIds: ["korean-casual", "ramen-noodle"], categoryId: "food", name: { ko: "홍콩반점", en: "Hong Kong Banjum" }, tagline: { ko: "중화요리 1위, 백종원 브랜드, 점당매출 6.3억", en: "#1 Chinese food, Paik brand, 6.3B per-store" }, startupCostWon: 10400, franchiseFee: 330, monthlyRoyalty: 25, avgAnnualRevenueWon: 63000, storeCount: 290, closureRate: 2.5, scores: { profitability: 92, stability: 76, accessibility: 70, brandPower: 80, support: 78 }, roadmapNotes: { ko: ["더본코리아 계열 — 백종원 브랜드", "점당 매출 6.3억 — 외식 상위권", "중화 웍 조리 교육 필수", "배달+홀 병행 권장"], en: ["The Born Korea brand", "6.3B per-store — top-tier food", "Wok cooking training mandatory", "Dine-in + delivery dual operation"] }, franchiseUrl: "https://start.theborn.co.kr/prebrand_detail.php?bc=26", costVerified: true, costSource: "정보공개서 2024", basePyeong: 30, costBreakdown: [c("가맹비","Franchise fee",330),c("교육비","Training",550),c("보증금","Deposit",300),c("인테리어·시설","Interior+facility",9220)], dataYear: "2024" });

const newMaeul = b({ id: "new-maeul", subIndustryIds: ["korean-casual"], categoryId: "food", name: { ko: "새마을식당", en: "Saemaeul Sikdang" }, tagline: { ko: "백종원 한식 대표, 열탄불고기 시그니처", en: "Paik's Korean flagship, bulgogi signature" }, startupCostWon: 15000, franchiseFee: 330, monthlyRoyalty: 25, avgAnnualRevenueWon: 72000, storeCount: 200, closureRate: 2.0, scores: { profitability: 95, stability: 82, accessibility: 52, brandPower: 88, support: 82 }, roadmapNotes: { ko: ["점당 매출 7.2억 — 한식 최고 수준", "더본코리아 통합 물류", "25평 이상 홀 매장 필수", "주류 매출 비중 높음"], en: ["7.2B per-store — top Korean food", "The Born Korea logistics", "25+ pyeong dine-in required", "High alcohol sales ratio"] }, franchiseUrl: "https://start.theborn.co.kr/prebrand_detail.php?bc=23", costVerified: true, costSource: "더본코리아 정보공개서 2024", basePyeong: 30, costBreakdown: [c("가맹비","Franchise fee",330),c("교육비","Training",550),c("보증금","Deposit",300),c("인테리어·시설·기타","Interior+facility+other",13820)], dataYear: "2024" });

const kimbapCheonguk = b({ id: "kimbap-cheonguk", subIndustryIds: ["korean-casual", "delivery-meals"], categoryId: "food", name: { ko: "김밥천국", en: "Kimbap Cheonguk" }, tagline: { ko: "가장 많은 매장, 저가 한식 대표", en: "Most stores, budget Korean food leader" }, startupCostWon: 5000, franchiseFee: 200, monthlyRoyalty: 0, avgAnnualRevenueWon: 22000, storeCount: 3200, closureRate: 5.5, scores: { profitability: 62, stability: 58, accessibility: 92, brandPower: 85, support: 55 }, roadmapNotes: { ko: ["로열티 0원 — 가맹비만 200만원", "창업비용 5,000만원 — 진입장벽 최저", "폐점률 5.5% — 경쟁 치열", "독립 운영 자율성 높음 (본사 지원 적음)"], en: ["Zero royalty — only 2M fee", "50M startup — lowest barrier", "5.5% closure — intense competition", "High autonomy (less HQ support)"] }, franchiseUrl: "http://www.kimbabcheongug.co.kr/franchise/info.php", costVerified: true, costSource: "정보공개서 2024", basePyeong: 12, costBreakdown: [c("가맹비","Franchise fee",200),c("인테리어·장비·기타","Interior+equip+other",4800)], dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ramen-noodle (면류/국밥)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const yeokjeonUdon = b({ id: "yeokjeon-udon", subIndustryIds: ["ramen-noodle"], categoryId: "food", name: { ko: "역전우동", en: "Yeokjeon Udon" }, tagline: { ko: "백종원 우동 전문, 가성비 면류 대표", en: "Paik's udon, value noodle leader" }, startupCostWon: 11000, franchiseFee: 300, monthlyRoyalty: 22, avgAnnualRevenueWon: 30000, storeCount: 550, closureRate: 3.0, scores: { profitability: 78, stability: 72, accessibility: 70, brandPower: 72, support: 75 }, roadmapNotes: { ko: ["더본코리아 계열", "주방기물 3천만원 장기 렌탈 가능", "최대 5천만원 창업 대출 지원", "간단한 조리 — 인력 부담 낮음"], en: ["The Born Korea brand", "Kitchen equipment 30M rental", "Up to 50M startup loan", "Simple cooking — low labor"] }, franchiseUrl: "https://start.theborn.co.kr/prebrand_detail.php?bc=28", costVerified: true, costSource: "더본코리아 정보공개서 2024", basePyeong: 15, costBreakdown: [c("가맹비","Franchise fee",300),c("교육비","Training",330),c("보증금","Deposit",300),c("인테리어·시설·기타","Interior+facility+other",10070)], dataYear: "2024" });

const bonjuk = b({ id: "bonjuk", subIndustryIds: ["korean-casual", "delivery-meals"], categoryId: "food", name: { ko: "본죽", en: "Bonjuk" }, tagline: { ko: "죽 전문 1위, 5년 연속 폐점률 1%대", en: "#1 porridge, 5yr consecutive ~1% closure" }, startupCostWon: 8000, franchiseFee: 330, monthlyRoyalty: 25, avgAnnualRevenueWon: 28000, storeCount: 1300, closureRate: 1.2, scores: { profitability: 75, stability: 88, accessibility: 82, brandPower: 88, support: 82 }, roadmapNotes: { ko: ["본죽&비빔밥 복합 모델 가능", "소형 매장 (8~12평) 운영", "5년 연속 폐점률 1%대", "조리 교육 3주 필수"], en: ["Combo model available", "Small store (8–12 pyeong)", "5yr ~1% closure rate", "3-week cooking training"] }, franchiseUrl: "https://www.bonif.co.kr/founding/info", costVerified: true, costSource: "정보공개서 2024", basePyeong: 10, costBreakdown: [c("가맹비","Franchise fee",1100),c("교육비","Training",600),c("보증금","Deposit",300),c("인테리어·장비·기타","Interior+equip+other",8000)], dataYear: "2024" });

const hansot = b({ id: "hansot-lunchbox", subIndustryIds: ["korean-casual", "delivery-meals"], categoryId: "food", name: { ko: "한솥도시락", en: "Hansot Lunchbox" }, tagline: { ko: "도시락 1위, 32년 무분쟁, 로열티 0원", en: "#1 lunchbox, 32yr zero-dispute, no royalty" }, startupCostWon: 8619, franchiseFee: 330, monthlyRoyalty: 0, avgAnnualRevenueWon: 32000, storeCount: 800, closureRate: 2.5, scores: { profitability: 82, stability: 76, accessibility: 80, brandPower: 85, support: 80 }, roadmapNotes: { ko: ["로열티 0원 — 원재료 마진 구조", "오피스 상권 매출 +50%", "본사와 분쟁 0건 (32년)", "13평 표준 매장"], en: ["Zero royalty", "Office district +50% revenue", "Zero disputes 32yr", "Standard 13-pyeong store"] }, franchiseUrl: "https://franchise.hsd.co.kr/", costVerified: true, costSource: "한솥 공식 2025", basePyeong: 13, costBreakdown: [c("총 창업비용 (가맹비+교육+인테리어+장비 포함)","Total (fee+training+interior+equip)",8619)], dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  delivery-meals (배달/분식)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const yupdduk = b({ id: "yupdduk", subIndustryIds: ["delivery-meals", "ramen-noodle"], categoryId: "food", name: { ko: "엽기떡볶이", en: "Yupdduk" }, tagline: { ko: "분식 매출 1위, 점당 8.8억 — 치킨 넘어선 떡볶이", en: "#1 street food revenue, 8.8B beats chicken" }, startupCostWon: 10000, franchiseFee: 1100, monthlyRoyalty: 25, avgAnnualRevenueWon: 87966, storeCount: 700, closureRate: 1.5, scores: { profitability: 96, stability: 85, accessibility: 72, brandPower: 88, support: 82 }, roadmapNotes: { ko: ["점당 매출 8.8억 — 치킨 1위 교촌보다 높음", "배달 비중 극히 높음", "폐점률 1.5% — 매우 안정적", "매운맛 특화 — 명확한 포지셔닝"], en: ["8.8B per-store — beats #1 chicken", "Extremely high delivery ratio", "1.5% closure — very stable", "Spicy specialty — clear positioning"] }, franchiseUrl: "https://www.yupdduk.com/", costVerified: true, costSource: "정보공개서 2024", basePyeong: 18, costBreakdown: [c("가맹비","Franchise fee",1100),c("교육비","Training",330),c("인테리어·시설(평당220만)","Interior(220/py)",3960),c("초도물품","Initial stock",800)], dataYear: "2024" });

const sinJeon = b({ id: "sinjeon", subIndustryIds: ["delivery-meals"], categoryId: "food", name: { ko: "신전떡볶이", en: "Sinjeon Tteokbokki" }, tagline: { ko: "떡볶이 매장 수 1위 (818개), 분식 대표", en: "#1 by count (818), street food staple" }, startupCostWon: 7000, franchiseFee: 500, monthlyRoyalty: 16.5, avgAnnualRevenueWon: 25000, storeCount: 818, closureRate: 3.5, scores: { profitability: 72, stability: 72, accessibility: 85, brandPower: 80, support: 75 }, roadmapNotes: { ko: ["매장 수 818개 — 떡볶이 1위", "창업비용 7,000만원 — 합리적", "분식 복합 메뉴 (떡볶이+순대+튀김)", "1인 운영 가능 구조"], en: ["818 stores — #1 tteokbokki", "70M startup — reasonable", "Combo menu (tteokbokki+sundae+fried)", "Solo operation viable"] }, franchiseUrl: "https://www.sinjeon.co.kr/", costVerified: true, costSource: "정보공개서 2024", basePyeong: 10, costBreakdown: [c("가맹비","Franchise fee",500),c("보증금","Deposit",1000),c("시설투자","Facility",7000)], dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  salad-healthy (샐러드/건강식)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const saladit = b({ id: "saladit", subIndustryIds: ["salad-healthy"], categoryId: "food", name: { ko: "샐러디", en: "Salady" }, tagline: { ko: "샐러드 프랜차이즈 1위, 건강식 대표", en: "#1 salad franchise, health food leader" }, startupCostWon: 8000, franchiseFee: 500, monthlyRoyalty: 22, avgAnnualRevenueWon: 24000, storeCount: 120, closureRate: 3.0, scores: { profitability: 68, stability: 72, accessibility: 80, brandPower: 72, support: 75 }, roadmapNotes: { ko: ["건강식 트렌드 수혜", "오피스 상권 필수", "식재료 신선도 관리 핵심", "소형 매장 (10평~) 가능"], en: ["Health food trend beneficiary", "Office district essential", "Ingredient freshness critical", "Small stores (10+ pyeong) viable"] }, franchiseUrl: "https://www.salady.co.kr/", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  western-pasta-brunch (양식/파스타/브런치)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const vips = b({ id: "vips", subIndustryIds: ["western-pasta-brunch"], categoryId: "food", name: { ko: "빕스", en: "VIPS" }, tagline: { ko: "CJ 프리미엄 레스토랑, 샐러드바 강점", en: "CJ premium restaurant, salad bar strength" }, startupCostWon: 50000, franchiseFee: 2000, monthlyRoyalty: 55, avgAnnualRevenueWon: 120000, storeCount: 70, closureRate: 1.5, scores: { profitability: 85, stability: 88, accessibility: 20, brandPower: 90, support: 90 }, roadmapNotes: { ko: ["CJ푸드빌 계열 — 안정적 공급망", "창업비용 5억+ — 대형 투자", "점당 매출 12억 — 최상위", "100평 이상 대형 매장 필수"], en: ["CJ Foodville — stable supply", "5B+ startup — large investment", "12B per-store — top-tier", "100+ pyeong large store required"] }, franchiseUrl: "https://www.ivips.co.kr/", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  CAFE & DESSERT
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const megaCoffee = b({ id: "mega-coffee", subIndustryIds: ["takeout-coffee", "specialty-coffee"], categoryId: "cafe-dessert", name: { ko: "메가커피", en: "Mega Coffee" }, tagline: { ko: "저가커피 1위, 3,500개 매장, 폐점률 0.4%", en: "#1 budget coffee, 3,500+ stores, 0.4% closure" }, startupCostWon: 7093, franchiseFee: 500, monthlyRoyalty: 16.5, avgAnnualRevenueWon: 34902, storeCount: 3500, closureRate: 0.4, scores: { profitability: 92, stability: 96, accessibility: 88, brandPower: 95, support: 78 }, roadmapNotes: { ko: ["인테리어 본사 시공 (평당 140만원)", "메뉴 개발 불필요 — 본사 레시피 100%", "원두·부자재 본사 독점 공급", "광고 모델료 50% 점주 분담"], en: ["HQ interior (~1.4M/pyeong)", "No menu dev — 100% HQ recipes", "HQ exclusive supply", "Ad model fee 50% share"] }, storeLocatorUrl: "https://www.mega-mgccoffee.com/store/find.php", franchiseUrl: "https://www.mega-mgccoffee.com/startup/cost/", costVerified: true, costSource: "메가커피 공식사이트 2025", basePyeong: 10, costBreakdown: [c("가맹비","Franchise fee",1000),c("교육비","Training",500),c("주방기기·기물","Kitchen equip",3255),c("인테리어","Interior",1500),c("설계·도면","Design",250),c("간판·사인물","Signage",511),c("홍보물·비품","Promo+supplies",87),c("DID메뉴보드","DID menu board",321)], dataYear: "2024" });

const composeCoffee = b({ id: "compose-coffee", subIndustryIds: ["takeout-coffee"], categoryId: "cafe-dessert", name: { ko: "컴포즈커피", en: "Compose Coffee" }, tagline: { ko: "감각적 디자인, 폐점률 0.5%, 빠른 성장", en: "Stylish design, 0.5% closure, rapid growth" }, startupCostWon: 10430, franchiseFee: 300, monthlyRoyalty: 22, avgAnnualRevenueWon: 26501, storeCount: 2800, closureRate: 0.5, scores: { profitability: 80, stability: 95, accessibility: 72, brandPower: 88, support: 82 }, roadmapNotes: { ko: ["인테리어 본사 디자인 시공 필수", "광고 모델료 20% — 업계 최저", "포장 용기 본사 통일", "신규 출점 상권 보호 정책"], en: ["HQ-designed interior mandatory", "Ad fee 20% — lowest", "Packaging unified by HQ", "Territory protection policy"] }, franchiseUrl: "https://composecoffee.com/startupcost", costVerified: true, costSource: "컴포즈커피 공식사이트 2025", basePyeong: 10, costBreakdown: [c("가맹비","Franchise fee",500),c("교육비","Training",200),c("인테리어","Interior",1500),c("주방설비","Kitchen",1270),c("기계장비","Equipment",2788),c("홍보물","Promo",150),c("DID메뉴보드","DID menu board",300)], dataYear: "2024" });

const paiksDabang = b({ id: "paiks-dabang", subIndustryIds: ["takeout-coffee"], categoryId: "cafe-dessert", name: { ko: "빽다방", en: "Paik's Coffee" }, tagline: { ko: "백종원 브랜드, 커피+간식 콤보, 점당 3.2억", en: "Paik brand, coffee+snack combo, 3.2B per-store" }, startupCostWon: 7987, franchiseFee: 300, monthlyRoyalty: 27.5, avgAnnualRevenueWon: 31908, storeCount: 1600, closureRate: 1.7, scores: { profitability: 88, stability: 82, accessibility: 82, brandPower: 85, support: 75 }, roadmapNotes: { ko: ["더본코리아 통합 물류", "간식 메뉴로 객단가 상승", "본사 슈퍼바이저 정기 방문", "10평 소규모 매장 가능"], en: ["The Born logistics", "Snack menu raises ticket", "HQ supervisor visits", "Small 10-pyeong stores"] }, franchiseUrl: "https://paikdabang.com/franchise/franchise/", costVerified: true, costSource: "정보공개서 2024", basePyeong: 10, costBreakdown: [c("가맹비","Franchise fee",330),c("교육비","Training",330),c("보증금","Deposit",500),c("인테리어·장비·기타","Interior+equip+other",8920)], dataYear: "2024" });

const ediya = b({ id: "ediya-coffee", subIndustryIds: ["takeout-coffee", "specialty-coffee"], categoryId: "cafe-dessert", name: { ko: "이디야커피", en: "Ediya Coffee" }, tagline: { ko: "가맹점 수 1위, 전국 최다 매장", en: "#1 store count, nationwide presence" }, startupCostWon: 12913, franchiseFee: 500, monthlyRoyalty: 27.5, avgAnnualRevenueWon: 18986, storeCount: 3200, closureRate: 6.5, scores: { profitability: 62, stability: 55, accessibility: 58, brandPower: 90, support: 70 }, roadmapNotes: { ko: ["매장 유형 다양 (카페형/테이크아웃형)", "창업비용 업계 평균 대비 높은 편", "폐점률 6.5% — 상권 분석 필수", "배달 앱 연동 본사 지원"], en: ["Multiple formats (cafe/takeout)", "Above-average costs", "6.5% closure — careful analysis needed", "Delivery app integration by HQ"] }, franchiseUrl: "https://www.ediya.com/franchise", costVerified: true, costSource: "정보공개서 2024", basePyeong: 15, costBreakdown: [c("가맹비","Franchise fee",1200),c("보증금","Deposit",500),c("초도물품","Initial stock",800),c("인테리어","Interior",4300),c("의탁자","Furniture",700),c("외부사인","Signage",480),c("기기설비","Equipment",3300),c("홍보비","Promo",200)], dataYear: "2024" });

const theventi = b({ id: "the-venti", subIndustryIds: ["takeout-coffee"], categoryId: "cafe-dessert", name: { ko: "더벤티", en: "The Venti" }, tagline: { ko: "대용량 특화, 로열티 업계 최저", en: "Large-size specialist, lowest royalty" }, startupCostWon: 7781, franchiseFee: 300, monthlyRoyalty: 16.5, avgAnnualRevenueWon: 22807, storeCount: 1700, closureRate: 2.9, scores: { profitability: 72, stability: 72, accessibility: 84, brandPower: 75, support: 72 }, roadmapNotes: { ko: ["대용량 음료 차별화", "로열티 16.5만/월 — 최저", "광고 모델료 50% 점주 분담", "본사 인테리어 표준 시공"], en: ["Large-size differentiation", "16.5K/mo royalty — lowest", "Ad fee 50% share", "HQ standard interior"] }, franchiseUrl: "https://www.theventi.co.kr/new2022/fran/about/cost.html", costVerified: true, costSource: "더벤티 공식사이트 2025", basePyeong: 10, costBreakdown: [c("가맹비","Franchise fee",500),c("교육비","Training",300),c("보증금","Deposit",500),c("간판","Signage",900),c("인테리어","Interior",3400),c("기기·장비","Equipment",3070),c("가구","Furniture",200)], dataYear: "2024" });

const twosomePlace = b({ id: "twosome-place", subIndustryIds: ["specialty-coffee", "dessert-cafe"], categoryId: "cafe-dessert", name: { ko: "투썸플레이스", en: "A Twosome Place" }, tagline: { ko: "프리미엄 디저트 카페, CJ계열 안정성", en: "Premium dessert cafe, CJ stability" }, startupCostWon: 15000, franchiseFee: 500, monthlyRoyalty: 33, avgAnnualRevenueWon: 42000, storeCount: 1800, closureRate: 2.8, scores: { profitability: 85, stability: 73, accessibility: 48, brandPower: 92, support: 80 }, roadmapNotes: { ko: ["CJ푸드빌 계열", "디저트 쇼케이스 필수", "최소 20평 이상 권장", "프리미엄 인테리어 (평당 200만+)"], en: ["CJ Foodville subsidiary", "Dessert showcase required", "Min 20+ pyeong", "Premium interior (2M+/pyeong)"] }, franchiseUrl: "https://www.twosome.co.kr/so/storeStartupInfo.do", costVerified: true, costSource: "투썸 공식사이트 2025", basePyeong: 45, costBreakdown: [c("가맹금","Franchise fee",2000),c("보증금","Deposit",1000),c("교육비","Training",150),c("인테리어+장비+기타","Interior+equip+other",22000)], dataYear: "2024" });

const baskinRobbins = b({ id: "baskin-robbins", subIndustryIds: ["icecream-bingsu", "dessert-cafe"], categoryId: "cafe-dessert", name: { ko: "배스킨라빈스", en: "Baskin-Robbins" }, tagline: { ko: "아이스크림 1위, SPC계열 브랜드력", en: "#1 ice cream, SPC brand power" }, startupCostWon: 18000, franchiseFee: 1500, monthlyRoyalty: 44, avgAnnualRevenueWon: 45000, storeCount: 1700, closureRate: 2.5, scores: { profitability: 82, stability: 78, accessibility: 45, brandPower: 95, support: 85 }, roadmapNotes: { ko: ["SPC그룹 계열 — 안정적 공급", "시즌별 신메뉴 본사 자동 공급", "케이크 매출 비중 높음 (30%+)", "최소 15평 이상 권장"], en: ["SPC Group — stable supply", "Seasonal new items auto-supplied", "Cake revenue 30%+", "Min 15+ pyeong"] }, franchiseUrl: "https://www.baskinrobbins.co.kr/information-center/consulting/condition.php", costVerified: true, costSource: "정보공개서 2024", basePyeong: 15, costBreakdown: [c("가맹비","Franchise fee",500),c("교육비","Training",150),c("기획관리비","Planning",300),c("보증금","Deposit",800),c("가구","Furniture",1200),c("내외부사인","Signage",850),c("인테리어","Interior",5900),c("의탁자","Furniture",600),c("판매장비","Sales equip",7000),c("초도상품","Initial stock",1090),c("냉난방·CCTV","HVAC+CCTV",950)], dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  RETAIL
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const cu = b({ id: "cu", subIndustryIds: ["convenience-small"], categoryId: "retail", name: { ko: "CU", en: "CU" }, tagline: { ko: "가맹점 수 1위 편의점, BGF리테일", en: "#1 convenience by count, BGF Retail" }, startupCostWon: 7270, franchiseFee: 770, monthlyRoyalty: 0, avgAnnualRevenueWon: 62979, storeCount: 17600, closureRate: 5.8, scores: { profitability: 82, stability: 58, accessibility: 85, brandPower: 95, support: 82 }, roadmapNotes: { ko: ["로열티 없음 — 마진 30% 수수료", "24시간 운영 필수", "상품 준비금 1,400만 + 보증금 5,000만", "PB상품 매출 비중 증가"], en: ["No royalty — 30% margin share", "24h operation required", "Product 14M + deposit 50M", "Growing PB product share"] }, franchiseUrl: "https://cu.bgfretail.com/franchise/overview.do", costVerified: true, costSource: "정보공개서 2025", costBreakdown: [c("가맹비","Franchise fee",770),c("상품준비금","Product deposit",1400),c("보증금","Deposit",5000),c("소모품비","Supplies",100)], dataYear: "2024" });

const gs25 = b({ id: "gs25", subIndustryIds: ["convenience-small"], categoryId: "retail", name: { ko: "GS25", en: "GS25" }, tagline: { ko: "점당 매출 1위 편의점, GS리테일", en: "#1 per-store revenue convenience" }, startupCostWon: 7270, franchiseFee: 770, monthlyRoyalty: 0, avgAnnualRevenueWon: 64146, storeCount: 17200, closureRate: 6.2, scores: { profitability: 84, stability: 55, accessibility: 85, brandPower: 95, support: 85 }, roadmapNotes: { ko: ["점당 매출 6.41억 — 편의점 1위", "20대 창업 지원 (비용 54% 절감)", "최대 1,500만원 무이자 대출", "디지털 발주 시스템 우수"], en: ["6.41B per-store — #1", "Youth promo (54% savings)", "15M interest-free loan", "Best digital ordering"] }, franchiseUrl: "http://gs25.gsretail.com/gscvs/ko/franchise-info/guide/process", costVerified: true, costSource: "GS25 공식 2025", costBreakdown: [c("가맹비","Franchise fee",770),c("상품준비금","Product deposit",1400),c("소모품비","Supplies",100),c("전대보증금","Sub-lease deposit",2000)], dataYear: "2024" });

const sevenEleven = b({ id: "seven-eleven", subIndustryIds: ["convenience-small"], categoryId: "retail", name: { ko: "세븐일레븐", en: "7-Eleven" }, tagline: { ko: "글로벌 브랜드, 구조조정 진행 중", en: "Global brand, restructuring ongoing" }, startupCostWon: 7270, franchiseFee: 770, monthlyRoyalty: 0, avgAnnualRevenueWon: 53247, storeCount: 12152, closureRate: 7.5, scores: { profitability: 70, stability: 48, accessibility: 85, brandPower: 80, support: 72 }, roadmapNotes: { ko: ["2024년 점포 978개 순감소", "저효율 점포 정리 중", "글로벌 브랜드 인지도", "상권 분석 특히 중요"], en: ["978 net closures in 2024", "Low-efficiency cleanup", "Global brand awareness", "Location analysis critical"] }, franchiseUrl: "https://www.7-eleven.co.kr/franchise/info.asp", costVerified: true, costSource: "정보공개서 2024", costBreakdown: [c("가맹비","Franchise fee",770),c("상품준비금","Product deposit",1400),c("보증금","Deposit",5000),c("소모품비","Supplies",100)], dataYear: "2024" });

const emart24 = b({ id: "emart24", subIndustryIds: ["convenience-small"], categoryId: "retail", name: { ko: "이마트24", en: "emart24" }, tagline: { ko: "정액 회원비 모델, 자율성 높음", en: "Flat fee model, high autonomy" }, startupCostWon: 7200, franchiseFee: 770, monthlyRoyalty: 15, avgAnnualRevenueWon: 43969, storeCount: 5747, closureRate: 7.6, scores: { profitability: 58, stability: 46, accessibility: 86, brandPower: 72, support: 68 }, roadmapNotes: { ko: ["정액 회원비 (15~60만/월)", "3분기 386개 점포 순감소", "SSG 계열 PB상품", "신규 출점 매우 신중"], en: ["Flat fee (150K–600K/mo)", "386 net closures Q3", "SSG PB products", "Very cautious new openings"] }, franchiseUrl: "https://www.emart24.co.kr/franchise/intro", costVerified: true, costSource: "정보공개서 2024", costBreakdown: [c("브랜드사용료","Brand fee",2370),c("보증금","Deposit",5000),c("기타초기비용","Other initial",7197)], dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  BEAUTY
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const junoHair = b({ id: "juno-hair", subIndustryIds: ["hair-salon"], categoryId: "beauty", name: { ko: "준오헤어", en: "Juno Hair" }, tagline: { ko: "연매출 10.7억, 블랙스톤 인수 프리미엄", en: "10.7B annual, Blackstone-acquired premium" }, startupCostWon: 36000, franchiseFee: 1000, monthlyRoyalty: 55, avgAnnualRevenueWon: 107017, storeCount: 130, closureRate: 1.2, scores: { profitability: 95, stability: 90, accessibility: 28, brandPower: 95, support: 90 }, roadmapNotes: { ko: ["블랙스톤 인수 — 글로벌 확장", "점당 매출 10.7억 — 업계 압도적 1위", "창업비용 3.6억+ — 고급 인테리어", "디자이너 채용 본사 지원"], en: ["Blackstone acquisition", "10.7B per-store — #1", "3.6B+ startup — premium interior", "HQ designer recruitment"] }, franchiseUrl: "https://www.junohair.com/junohair/about/story", costVerified: false, dataYear: "2024" });

const lianHair = b({ id: "lian-hair", subIndustryIds: ["hair-salon"], categoryId: "beauty", name: { ko: "리안헤어", en: "Lian Hair" }, tagline: { ko: "가맹점 수 1위 헤어 브랜드, 합리적 비용", en: "#1 hair by count, reasonable cost" }, startupCostWon: 9845, franchiseFee: 500, monthlyRoyalty: 33, avgAnnualRevenueWon: 27288, storeCount: 470, closureRate: 4.5, scores: { profitability: 65, stability: 72, accessibility: 75, brandPower: 80, support: 72 }, roadmapNotes: { ko: ["창업비용 약 9,800만원", "전국 최다 가맹점", "15평~ 소규모 매장 가능", "점당 매출은 낮은 편"], en: ["~98M startup", "Largest network", "15+ pyeong small stores", "Lower per-store revenue"] }, franchiseUrl: "http://riahn.co.kr/", costVerified: false, dataYear: "2024" });

const blueClub = b({ id: "blue-club", subIndustryIds: ["hair-salon"], categoryId: "beauty", name: { ko: "블루클럽", en: "Blue Club" }, tagline: { ko: "남성 전문 헤어, 최저 창업비용", en: "Men's specialist, lowest startup" }, startupCostWon: 5000, franchiseFee: 300, monthlyRoyalty: 22, avgAnnualRevenueWon: 18000, storeCount: 500, closureRate: 5.2, scores: { profitability: 55, stability: 68, accessibility: 88, brandPower: 70, support: 65 }, roadmapNotes: { ko: ["남성 전문 — 커트 위주", "창업비용 5,000만원 이하", "1인 운영 가능", "객단가 낮아 회전율 핵심"], en: ["Men-only — cut-focused", "Under 50M startup", "Solo operation viable", "Low ticket — turnover key"] }, franchiseUrl: "https://www.blueclub.co.kr/", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  FITNESS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const anytimeFitness = b({ id: "anytime-fitness", subIndustryIds: ["unmanned-fitness", "pt-gym"], categoryId: "fitness", name: { ko: "에니타임피트니스", en: "Anytime Fitness" }, tagline: { ko: "글로벌 1위 피트니스, 24시간 무인", en: "World's #1 fitness, 24h unmanned" }, startupCostWon: 25000, franchiseFee: 3000, monthlyRoyalty: 110, avgAnnualRevenueWon: 36000, storeCount: 50, closureRate: 3.0, scores: { profitability: 78, stability: 75, accessibility: 42, brandPower: 88, support: 82 }, roadmapNotes: { ko: ["24시간 무인 운영", "글로벌 회원 상호 이용", "최소 100평 이상", "기구 본사 표준 사양"], en: ["24h unmanned", "Global reciprocal access", "Min 100+ pyeong", "HQ standard equipment"] }, franchiseUrl: "https://www.anytimefitness.kr/own-a-gym/", costVerified: false, dataYear: "2024" });

const curves = b({ id: "curves", subIndustryIds: ["pt-gym", "pilates-studio"], categoryId: "fitness", name: { ko: "커브스", en: "Curves" }, tagline: { ko: "여성 전용, 30분 순환운동, 380개 매장", en: "Women-only, 30-min circuit, 380 stores" }, startupCostWon: 12000, franchiseFee: 1500, monthlyRoyalty: 55, avgAnnualRevenueWon: 24000, storeCount: 380, closureRate: 3.5, scores: { profitability: 72, stability: 80, accessibility: 65, brandPower: 78, support: 85 }, roadmapNotes: { ko: ["여성 전용 — 명확한 타겟", "유압식 기구 — 부상 위험 낮음", "30평 소규모 매장 가능", "본사 운영 매뉴얼 체계적"], en: ["Women-only — clear target", "Hydraulic — low injury risk", "Small 30-pyeong viable", "Systematic HQ manual"] }, franchiseUrl: "https://www.curves.co.kr/", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  EDUCATION
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const noonnoppi = b({ id: "noonnoppi", subIndustryIds: ["kids-academy", "adult-class"], categoryId: "education", name: { ko: "눈높이", en: "Noonnoppi" }, tagline: { ko: "대교 그룹, 방문학습 1위, 초저 비용", en: "Daekyo, #1 home tutoring, ultra-low cost" }, startupCostWon: 3000, franchiseFee: 100, monthlyRoyalty: 0, avgAnnualRevenueWon: 6000, storeCount: 8000, closureRate: 2.0, scores: { profitability: 65, stability: 85, accessibility: 92, brandPower: 90, support: 88 }, roadmapNotes: { ko: ["방문학습 — 매장 불필요", "초기 비용 3,000만원 이하", "1인 운영 (학습지 교사)", "교재·커리큘럼 100% 본사"], en: ["Home-visit — no store needed", "Under 30M startup", "Solo (tutor-style)", "100% HQ curriculum"] }, franchiseUrl: "https://www.daekyo.com/", costVerified: false, dataYear: "2024" });

const kumon = b({ id: "kumon", subIndustryIds: ["kids-academy"], categoryId: "education", name: { ko: "구몬", en: "Kumon" }, tagline: { ko: "글로벌 자기주도학습, 50개국 진출", en: "Global self-learning, 50 countries" }, startupCostWon: 2500, franchiseFee: 100, monthlyRoyalty: 0, avgAnnualRevenueWon: 5500, storeCount: 5000, closureRate: 2.5, scores: { profitability: 62, stability: 82, accessibility: 94, brandPower: 85, support: 85 }, roadmapNotes: { ko: ["자기주도학습 프린트 기반", "초기 비용 2,500만원 이하", "10평~ 소규모 교실 가능", "글로벌 브랜드 인지도"], en: ["Self-paced worksheet based", "Under 25M startup", "Small 10+ pyeong", "Global brand"] }, franchiseUrl: "https://www.kumon.co.kr/inquiry/inquiry", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  PET
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const polypark = b({ id: "polypark", subIndustryIds: ["pet-supply", "pet-shop"], categoryId: "pet", name: { ko: "폴리파크", en: "Polypark" }, tagline: { ko: "반려동물 용품점 1위 프랜차이즈", en: "#1 pet supply franchise" }, startupCostWon: 9592, franchiseFee: 440, monthlyRoyalty: 22, avgAnnualRevenueWon: 24000, storeCount: 60, closureRate: 4.0, scores: { profitability: 68, stability: 70, accessibility: 72, brandPower: 65, support: 68 }, roadmapNotes: { ko: ["표준 창업비용 약 9,600만원", "반려동물 시장 연 15% 성장", "용품+간식+미용 복합", "보증금 1,000만원 포함"], en: ["~96M standard startup", "Pet market ~15% annual growth", "Supplies+treats+grooming combo", "Includes 10M deposit"] }, franchiseUrl: "https://www.polypark.co.kr/", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  LIVING SERVICE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const cleantopia = b({ id: "cleantopia", subIndustryIds: ["laundry-cleaning", "unmanned-service"], categoryId: "living-service", name: { ko: "크린토피아", en: "Cleantopia" }, tagline: { ko: "세탁편의점 1위, 최저 창업비용 1,900만", en: "#1 laundry, lowest 19M startup" }, startupCostWon: 1900, franchiseFee: 440, monthlyRoyalty: 0, avgAnnualRevenueWon: 12000, storeCount: 3500, closureRate: 2.0, scores: { profitability: 68, stability: 88, accessibility: 95, brandPower: 92, support: 85 }, roadmapNotes: { ko: ["6평 기준 1,900만원", "로열티 0원 — 세탁물량 수수료", "무인/반무인 운영 가능", "투잡·노후 대비 인기"], en: ["19M for 6-pyeong", "Zero royalty — volume fee", "Unmanned operation", "Popular side job"] }, franchiseUrl: "https://www.cleantopia.com/", costVerified: true, costSource: "정보공개서 2024", basePyeong: 6, costBreakdown: [c("가맹비","Franchise fee",440),c("보증금(반환)","Deposit(refund)",300),c("인테리어(6평)","Interior(6py)",770),c("기타","Other",390)], dataYear: "2024" });

const washnjoy = b({ id: "washnjoy", subIndustryIds: ["laundry-cleaning", "unmanned-service"], categoryId: "living-service", name: { ko: "워시엔조이", en: "Wash & Joy" }, tagline: { ko: "코인세탁 전문, 가맹비·로열티 0원", en: "Coin laundry, zero fee & royalty" }, startupCostWon: 5000, franchiseFee: 0, monthlyRoyalty: 0, avgAnnualRevenueWon: 15000, storeCount: 600, closureRate: 4.5, scores: { profitability: 62, stability: 72, accessibility: 88, brandPower: 70, support: 78 }, roadmapNotes: { ko: ["가맹비·로열티 0원", "완전 무인 운영", "코인세탁기 장비 비용 핵심", "주거 밀집 입지 필수"], en: ["Zero fees & royalty", "Fully unmanned", "Equipment cost is key", "Residential area required"] }, franchiseUrl: "https://washenjoy.co.kr/", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SPACE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const zaksim = b({ id: "zaksim-study", subIndustryIds: ["study-room"], categoryId: "space", name: { ko: "작심스터디카페", en: "Zaksim Study Cafe" }, tagline: { ko: "스터디카페 1위, 338개 매장, 무인 운영", en: "#1 study cafe, 338 stores, unmanned" }, startupCostWon: 19910, franchiseFee: 550, monthlyRoyalty: 33, avgAnnualRevenueWon: 10400, storeCount: 338, closureRate: 3.0, scores: { profitability: 72, stability: 78, accessibility: 48, brandPower: 88, support: 82 }, roadmapNotes: { ko: ["무인 운영 — 중앙 관제", "성인 이용 80%", "월 매출 평균 866만원", "60평 이상 표준 매장"], en: ["Unmanned — central control", "80% adult users", "~8.66M monthly avg", "60+ pyeong standard"] }, franchiseUrl: "https://www.zaksim.co.kr/", costVerified: false, dataYear: "2024" });

const tozStudy = b({ id: "toz-study", subIndustryIds: ["study-room"], categoryId: "space", name: { ko: "토즈", en: "Toz Study Center" }, tagline: { ko: "스터디룸+카페 복합, 프리미엄 공간", en: "Study room + cafe combo, premium" }, startupCostWon: 25000, franchiseFee: 770, monthlyRoyalty: 44, avgAnnualRevenueWon: 14000, storeCount: 80, closureRate: 4.0, scores: { profitability: 68, stability: 72, accessibility: 38, brandPower: 80, support: 75 }, roadmapNotes: { ko: ["스터디룸+카페 복합", "창업비용 2.5~3억", "대학가·오피스 최적", "그룹룸 임대 수익 추가"], en: ["Study room + cafe hybrid", "2.5–3B startup", "University/office optimal", "Group room rental revenue"] }, franchiseUrl: "https://tozstudy.kr/franchise/charmTsf", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ADDITIONAL BRANDS (확장)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// chicken-burger 추가
const nene = b({ id: "nene-chicken", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "네네치킨", en: "NeNe Chicken" }, tagline: { ko: "스노윙 치킨 원조, 가맹점 1,100개+", en: "Snowing chicken pioneer, 1,100+ stores" }, startupCostWon: 7500, franchiseFee: 500, monthlyRoyalty: 22, avgAnnualRevenueWon: 35000, storeCount: 1100, closureRate: 4.0, scores: { profitability: 75, stability: 68, accessibility: 82, brandPower: 78, support: 75 }, roadmapNotes: { ko: ["스노윙/반반 치킨 시그니처", "창업비용 7,500만원 — 합리적", "배달+홀 병행", "치킨 대학 교육 2주"], en: ["Snowing/half-half signature", "75M startup — reasonable", "Delivery+dine-in dual", "2-week chicken university"] }, franchiseUrl: "https://nenechicken.com/", costVerified: true, costSource: "정보공개서 2024", basePyeong: 12, costBreakdown: [c("가맹비","Franchise fee",0),c("교육비","Training",330),c("인테리어·장비","Interior+equip",5781)], dataYear: "2024" });

const hosik = b({ id: "hosik-chicken", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "호식이두마리", en: "Hosik's Two Chickens" }, tagline: { ko: "두마리 치킨 원조, 최저가 전략", en: "Two-chicken pioneer, lowest price" }, startupCostWon: 5500, franchiseFee: 300, monthlyRoyalty: 11, avgAnnualRevenueWon: 28000, storeCount: 900, closureRate: 5.5, scores: { profitability: 65, stability: 58, accessibility: 90, brandPower: 72, support: 62 }, roadmapNotes: { ko: ["두마리 콘셉트 — 가격 경쟁력", "창업비용 5,500만원 — 매우 낮음", "소형 배달 전문 가능", "폐점률 높음 — 상권 검증 필수"], en: ["Two-chicken concept — price edge", "55M startup — very low", "Small delivery-only viable", "High closure — location critical"] }, franchiseUrl: "http://www.9922.co.kr/", costVerified: true, costSource: "정보공개서 2024", basePyeong: 10, costBreakdown: [c("가맹비","Franchise fee",270),c("교육비","Training",160),c("보증금","Deposit",300),c("인테리어·장비","Interior+equip",1530)], dataYear: "2024" });

const norangTongdak = b({ id: "norang-tongdak", subIndustryIds: ["chicken-burger"], categoryId: "food", name: { ko: "노랑통닭", en: "Norang Tongdak" }, tagline: { ko: "옛날 통닭 콘셉트, 1,000개+ 매장", en: "Classic whole chicken, 1,000+ stores" }, startupCostWon: 6800, franchiseFee: 300, monthlyRoyalty: 16.5, avgAnnualRevenueWon: 32000, storeCount: 1067, closureRate: 4.2, scores: { profitability: 72, stability: 68, accessibility: 85, brandPower: 72, support: 70 }, roadmapNotes: { ko: ["옛날 통닭 + 양념 콤보", "창업비용 6,800만원", "소형 매장 (8~12평) 가능", "주류 판매 가능 모델"], en: ["Classic whole + seasoned combo", "68M startup", "Small 8–12 pyeong stores", "Alcohol sales model available"] }, franchiseUrl: "https://www.norangtongdak.co.kr/store/center.html", costVerified: true, costSource: "정보공개서 2024", basePyeong: 15, costBreakdown: [c("가맹비","Franchise fee",400),c("교육비","Training",200),c("보증금","Deposit",100),c("인테리어","Interior",3000),c("간판","Signage",350),c("주방기기","Kitchen equip",950),c("가마솥튀김기","Fryer",750)], dataYear: "2024" });

// ramen-noodle 추가
const misoya = b({ id: "misoya", subIndustryIds: ["ramen-noodle"], categoryId: "food", name: { ko: "미소야", en: "Misoya" }, tagline: { ko: "일식 프랜차이즈 1위, 190개 매장, 점당 3.6억", en: "#1 Japanese food franchise, 190 stores" }, startupCostWon: 9584, franchiseFee: 500, monthlyRoyalty: 25, avgAnnualRevenueWon: 36174, storeCount: 190, closureRate: 3.0, scores: { profitability: 78, stability: 72, accessibility: 72, brandPower: 75, support: 78 }, roadmapNotes: { ko: ["돈까스·우동·소바 복합 일식", "점당 매출 3.6억", "본사 소스·육수 공급", "간단 조리 — 주방 인력 최소화"], en: ["Tonkatsu/udon/soba combo", "3.6B per-store", "HQ sauce/broth supply", "Simple cooking — min labor"] }, franchiseUrl: "https://www.misoya.co.kr/", costVerified: false, dataYear: "2024" });

const halmaeSundae = b({ id: "keunmal-halmae", subIndustryIds: ["ramen-noodle", "korean-casual"], categoryId: "food", name: { ko: "큰말할매순대국", en: "Keunmal Halmae Sundae" }, tagline: { ko: "순대국밥 가맹점 수 1위, 안정적 한식", en: "#1 sundae soup by count, stable Korean" }, startupCostWon: 7000, franchiseFee: 300, monthlyRoyalty: 22, avgAnnualRevenueWon: 26000, storeCount: 350, closureRate: 3.5, scores: { profitability: 72, stability: 72, accessibility: 82, brandPower: 72, support: 72 }, roadmapNotes: { ko: ["순대국밥 전문 — 뚜렷한 포지셔닝", "본사 육수 팩 공급", "소형 매장 (10평~) 가능", "배달+홀 병행 운영"], en: ["Sundae soup specialist", "HQ broth pack supply", "Small 10+ pyeong stores", "Delivery+dine-in dual"] }, franchiseUrl: "http://www.halmae.co.kr/", costVerified: false, dataYear: "2024" });

const hyundaeok = b({ id: "hyundaeok", subIndustryIds: ["ramen-noodle", "korean-casual"], categoryId: "food", name: { ko: "현대옥", en: "Hyundae Ok" }, tagline: { ko: "전주 콩나물국밥 35년 전통, 본가", en: "35yr Jeonju bean sprout soup tradition" }, startupCostWon: 8500, franchiseFee: 500, monthlyRoyalty: 25, avgAnnualRevenueWon: 30000, storeCount: 100, closureRate: 2.5, scores: { profitability: 75, stability: 78, accessibility: 78, brandPower: 70, support: 75 }, roadmapNotes: { ko: ["전주 콩나물국밥 원조", "35년 브랜드 역사", "본사 육수·소스 직배송", "관광지·출장 상권 최적"], en: ["Original Jeonju bean sprout soup", "35-year brand history", "HQ direct broth delivery", "Tourist/business districts optimal"] }, franchiseUrl: "http://www.hyundaiok.com/franchise/04", costVerified: false, dataYear: "2024" });

// delivery-meals 추가
const dookki = b({ id: "dookki", subIndustryIds: ["delivery-meals"], categoryId: "food", name: { ko: "두끼떡볶이", en: "Dookki" }, tagline: { ko: "떡볶이 뷔페 원조, 체험형 매장", en: "Tteokbokki buffet pioneer, experience store" }, startupCostWon: 12000, franchiseFee: 700, monthlyRoyalty: 33, avgAnnualRevenueWon: 35000, storeCount: 350, closureRate: 4.0, scores: { profitability: 78, stability: 68, accessibility: 65, brandPower: 75, support: 72 }, roadmapNotes: { ko: ["떡볶이 무한리필 뷔페 콘셉트", "체험형 매장 — 홀 필수 (20평+)", "젊은 층 타겟 명확", "인건비 비중 높음"], en: ["Unlimited tteokbokki buffet", "Experience store — dine-in required 20+", "Clear youth target", "High labor cost ratio"] }, franchiseUrl: "https://www.dookki.co.kr/", costVerified: false, dataYear: "2024" });

// dessert-cafe 추가
const sulbing = b({ id: "sulbing", subIndustryIds: ["icecream-bingsu", "dessert-cafe"], categoryId: "cafe-dessert", name: { ko: "설빙", en: "Sulbing" }, tagline: { ko: "빙수 디저트 1위, K-디저트 글로벌 브랜드", en: "#1 bingsu dessert, global K-dessert" }, startupCostWon: 12000, franchiseFee: 700, monthlyRoyalty: 33, avgAnnualRevenueWon: 28000, storeCount: 500, closureRate: 5.0, scores: { profitability: 72, stability: 62, accessibility: 65, brandPower: 85, support: 72 }, roadmapNotes: { ko: ["인절미설빙 시그니처", "시즌별 메뉴 업데이트 본사 제공", "여름 매출 편중 — 겨울 토스트 등 보완", "최소 15평 이상 권장"], en: ["Injeolmi sulbing signature", "Seasonal menu updates by HQ", "Summer-skewed — winter toast supplement", "Min 15+ pyeong recommended"] }, franchiseUrl: "https://sulbing.com/startup/", costVerified: false, dataYear: "2024" });

// bakery-studio 추가
const paris = b({ id: "paris-baguette", subIndustryIds: ["bakery-studio", "dessert-cafe"], categoryId: "cafe-dessert", name: { ko: "파리바게뜨", en: "Paris Baguette" }, tagline: { ko: "베이커리 1위, 3,400개 매장, SPC그룹", en: "#1 bakery, 3,400 stores, SPC Group" }, startupCostWon: 45000, franchiseFee: 1500, monthlyRoyalty: 0, avgAnnualRevenueWon: 66696, storeCount: 3400, closureRate: 3.5, scores: { profitability: 82, stability: 72, accessibility: 22, brandPower: 98, support: 88 }, roadmapNotes: { ko: ["SPC그룹 계열 — 국내 최대 베이커리", "창업비용 4.5억+ — 매우 높은 진입장벽", "월 매출 평균 5,558만원", "30평 이상 필수 + 오븐 설비"], en: ["SPC Group — Korea's largest bakery", "4.5B+ startup — very high barrier", "55.58M monthly avg revenue", "30+ pyeong + oven equipment required"] }, franchiseUrl: "https://www.paris.co.kr/franchise/opening-costs/", costVerified: true, costSource: "파리바게뜨 공식사이트 2025", basePyeong: 30, costBreakdown: [c("가맹비","Franchise fee",1500),c("교육비","Training",3500),c("디자인매뉴얼비","Design manual",3000),c("최초공급","First supply",1350),c("개점비","Opening",1000),c("인테리어","Interior",7800),c("장비·설비","Equipment",27000)], dataYear: "2024" });

const tlj = b({ id: "tous-les-jours", subIndustryIds: ["bakery-studio", "dessert-cafe"], categoryId: "cafe-dessert", name: { ko: "뚜레쥬르", en: "Tous Les Jours" }, tagline: { ko: "CJ 베이커리, 월 매출 3,856만, 합리적 대안", en: "CJ bakery, 38.56M monthly, reasonable alternative" }, startupCostWon: 35000, franchiseFee: 1000, monthlyRoyalty: 0, avgAnnualRevenueWon: 46272, storeCount: 1300, closureRate: 4.0, scores: { profitability: 75, stability: 68, accessibility: 28, brandPower: 88, support: 82 }, roadmapNotes: { ko: ["CJ푸드빌 계열", "파리바게뜨 대비 10% 낮은 창업비용", "월 매출 평균 3,856만원", "샌드위치·케이크 비중 높음"], en: ["CJ Foodville subsidiary", "10% lower startup than Paris", "38.56M monthly avg", "High sandwich/cake ratio"] }, franchiseUrl: "https://www.tlj.co.kr/franchise/intro", costVerified: false, dataYear: "2024" });

// hair-salon 추가
const parkSeungChul = b({ id: "park-seungchul", subIndustryIds: ["hair-salon"], categoryId: "beauty", name: { ko: "박승철헤어스투디오", en: "Park Seung-chul Hair" }, tagline: { ko: "업계 2위 매출, 점당 4.16억", en: "#2 industry revenue, 4.16B per-store" }, startupCostWon: 18000, franchiseFee: 700, monthlyRoyalty: 44, avgAnnualRevenueWon: 41610, storeCount: 180, closureRate: 5.0, scores: { profitability: 80, stability: 62, accessibility: 48, brandPower: 85, support: 75 }, roadmapNotes: { ko: ["점당 매출 4.16억 — 업계 2위", "창업비용 1.8억", "디자이너 확보 중요", "30평 이상 권장"], en: ["4.16B per-store — #2", "1.8B startup", "Designer recruitment key", "30+ pyeong recommended"] }, franchiseUrl: "http://www.parksc.co.kr/", costVerified: false, dataYear: "2024" });

// nail-studio 추가
const goldenNail = b({ id: "golden-nail", subIndustryIds: ["nail-studio"], categoryId: "beauty", name: { ko: "골든네일", en: "Golden Nail" }, tagline: { ko: "네일 프랜차이즈, 창업비용 3,300만", en: "Nail franchise, 33M startup" }, startupCostWon: 3300, franchiseFee: 300, monthlyRoyalty: 11, avgAnnualRevenueWon: 14000, storeCount: 80, closureRate: 5.0, scores: { profitability: 58, stability: 65, accessibility: 92, brandPower: 55, support: 60 }, roadmapNotes: { ko: ["창업비용 3,300만원 — 매우 낮음", "인테리어 1,600만원 포함", "소형 매장 (5평~) 가능", "네일 자격증 필수"], en: ["33M startup — very low", "Interior 16M included", "Small 5+ pyeong stores", "Nail certification required"] }, franchiseUrl: "https://www.goldennail.co.kr/", costVerified: false, dataYear: "2024" });

const yuhuNail = b({ id: "yuhu-nail", subIndustryIds: ["nail-studio"], categoryId: "beauty", name: { ko: "유휴네일", en: "Yuhu Nail" }, tagline: { ko: "프리미엄 네일케어, 체계적 교육", en: "Premium nail care, systematic training" }, startupCostWon: 5000, franchiseFee: 500, monthlyRoyalty: 16.5, avgAnnualRevenueWon: 18000, storeCount: 50, closureRate: 4.0, scores: { profitability: 62, stability: 70, accessibility: 88, brandPower: 60, support: 72 }, roadmapNotes: { ko: ["프리미엄 네일 서비스", "본사 교육 프로그램 체계적", "예약제 운영 — 안정적 매출", "8평~ 소규모 가능"], en: ["Premium nail service", "Systematic HQ training", "Reservation-based — stable revenue", "8+ pyeong small stores"] }, franchiseUrl: "https://www.yuhunail.com/", costVerified: false, dataYear: "2024" });

// pet 추가
const petmart = b({ id: "petmart", subIndustryIds: ["pet-supply", "pet-shop"], categoryId: "pet", name: { ko: "펫마트", en: "PetMart" }, tagline: { ko: "반려동물 대형 매장, 150개 점포, 점당 5.25억", en: "Large pet store, 150 stores, 5.25B per-store" }, startupCostWon: 17850, franchiseFee: 880, monthlyRoyalty: 33, avgAnnualRevenueWon: 52500, storeCount: 150, closureRate: 3.0, scores: { profitability: 82, stability: 75, accessibility: 45, brandPower: 78, support: 78 }, roadmapNotes: { ko: ["대형 매장 (100평 기준) — 높은 투자", "점당 매출 5.25억 — 펫 업계 최고", "용품+식품+미용+호텔 복합", "반려동물 시장 연 15% 성장"], en: ["Large store (100 pyeong) — high investment", "5.25B per-store — highest in pet", "Supplies+food+grooming+hotel combo", "Pet market ~15% annual growth"] }, franchiseUrl: "https://www.withpetmart.com/", costVerified: false, dataYear: "2024" });

// space 추가
const seldog24 = b({ id: "seldog24-study", subIndustryIds: ["study-room"], categoryId: "space", name: { ko: "셀독24", en: "Seldog24 Study Cafe" }, tagline: { ko: "24시간 무인 스터디, 합리적 비용", en: "24h unmanned study, reasonable cost" }, startupCostWon: 14454, franchiseFee: 440, monthlyRoyalty: 22, avgAnnualRevenueWon: 9600, storeCount: 70, closureRate: 3.5, scores: { profitability: 70, stability: 75, accessibility: 55, brandPower: 65, support: 70 }, roadmapNotes: { ko: ["24시간 완전 무인", "창업비용 약 1.45억", "IoT 좌석 관리", "40평~ 소규모 가능"], en: ["24h fully unmanned", "~1.45B startup", "IoT seat management", "40+ pyeong viable"] }, franchiseUrl: "https://www.seldog24.com/", costVerified: false, dataYear: "2024" });

const sevenStar = b({ id: "seven-star-coin", subIndustryIds: ["study-room"], categoryId: "space", name: { ko: "세븐스타코인노래방", en: "Seven Star Coin Noraebang" }, tagline: { ko: "코인노래방 1위, 320개 매장, 무인 운영", en: "#1 coin noraebang, 320 stores, unmanned" }, startupCostWon: 8500, franchiseFee: 500, monthlyRoyalty: 16.5, avgAnnualRevenueWon: 12000, storeCount: 320, closureRate: 6.0, scores: { profitability: 62, stability: 55, accessibility: 78, brandPower: 72, support: 68 }, roadmapNotes: { ko: ["코인노래방 가맹점 수 1위", "24시간 무인 운영 가능", "1곡 500~1,000원 — 회전율 핵심", "MZ세대 타겟 명확"], en: ["#1 coin noraebang by count", "24h unmanned operation", "500~1,000 KRW per song — turnover key", "Clear MZ generation target"] }, franchiseUrl: "https://www.7star.co.kr/", costVerified: false, dataYear: "2024" });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  EXPORTS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export const franchiseBrands: FranchiseBrand[] = [
  // chicken-burger (10)
  bbq, bhc, kyochon, goobne, momsTouch, sixtyChicken, dominos, nene, hosik, norangTongdak,
  // korean-casual (5)
  hongkongBanjum, newMaeul, kimbapCheonguk, bonjuk, hansot,
  // ramen-noodle (6) — includes cross-listed
  yeokjeonUdon, misoya, halmaeSundae, hyundaeok, yupdduk, sinJeon,
  // delivery-meals (3) — yupdduk/sinJeon cross-listed above
  dookki,
  // salad-healthy (1)
  saladit,
  // western (1)
  vips,
  // cafe-dessert (9)
  megaCoffee, composeCoffee, paiksDabang, ediya, theventi, twosomePlace, baskinRobbins, sulbing, paris, tlj,
  // retail (4)
  cu, gs25, sevenEleven, emart24,
  // beauty (6)
  junoHair, lianHair, blueClub, parkSeungChul, goldenNail, yuhuNail,
  // fitness (2)
  anytimeFitness, curves,
  // education (2)
  noonnoppi, kumon,
  // pet (2)
  polypark, petmart,
  // living-service (2)
  cleantopia, washnjoy,
  // space (4)
  zaksim, tozStudy, seldog24, sevenStar
];

/** Get franchise brands matching a sub-industry ID */
export function getFranchiseBrandsForSubIndustry(subIndustryId: string): FranchiseBrand[] {
  return franchiseBrands.filter((fb) => fb.subIndustryIds.includes(subIndustryId));
}

/** Get franchise brands for a category (fallback) */
export function getFranchiseBrandsForCategory(categoryId: string): FranchiseBrand[] {
  return franchiseBrands.filter((fb) => fb.categoryId === categoryId);
}

/** Get a single franchise brand by ID */
export function getFranchiseBrandById(brandId: string): FranchiseBrand | undefined {
  return franchiseBrands.find((fb) => fb.id === brandId);
}

/** Compute overall score (weighted average) */
export function computeOverallScore(scores: FranchiseScores): number {
  const w = { profitability: 0.3, stability: 0.25, accessibility: 0.15, brandPower: 0.15, support: 0.15 };
  return Math.round(
    scores.profitability * w.profitability +
    scores.stability * w.stability +
    scores.accessibility * w.accessibility +
    scores.brandPower * w.brandPower +
    scores.support * w.support
  );
}

/** Format KRW in 만원 / 억원 */
export function formatFranchiseCost(won10k: number): string {
  if (won10k >= 10000) return `${(won10k / 10000).toFixed(1)}억`;
  return `${won10k.toLocaleString()}만`;
}

/** Score label */
export function getScoreLabel(score: number, lang: "ko" | "en"): string {
  if (score >= 90) return lang === "ko" ? "최우수" : "Excellent";
  if (score >= 80) return lang === "ko" ? "우수" : "Very Good";
  if (score >= 70) return lang === "ko" ? "양호" : "Good";
  if (score >= 60) return lang === "ko" ? "보통" : "Average";
  return lang === "ko" ? "주의" : "Caution";
}

/**
 * Estimate cost breakdown for a franchise brand.
 * Uses startupCostWon + franchiseFee + industry norms to produce realistic estimates.
 */
export function estimateFranchiseCost(brand: FranchiseBrand, pyeong?: number): FranchiseCostBreakdown {
  const p = pyeong ?? brand.minPyeong ?? (brand.categoryId === "retail" ? 20 : brand.categoryId === "beauty" ? 15 : brand.categoryId === "fitness" ? 60 : 15);
  const total = brand.startupCostWon;
  const fee = brand.franchiseFee;

  // Education: typically 5-10% of total, min 100만
  const education = Math.max(100, Math.round(total * 0.06));

  // Deposit: typically 300-5000만 depending on industry
  const deposit = brand.categoryId === "retail" ? 5000
    : total >= 20000 ? Math.round(total * 0.12)
    : total >= 10000 ? Math.round(total * 0.08)
    : Math.max(200, Math.round(total * 0.06));

  // Signage: typically 300-600만
  const signage = Math.max(200, Math.round(total * 0.05));

  // Initial stock: food 10-15%, retail 20%, others 5-8%
  const stockRate = brand.categoryId === "food" || brand.categoryId === "cafe-dessert" ? 0.12
    : brand.categoryId === "retail" ? 0.20
    : 0.06;
  const initialStock = Math.round(total * stockRate);

  // Other: design, marketing, etc. ~3-5%
  const other = Math.round(total * 0.04);

  // Equipment: from remaining after known costs
  const knownCosts = fee + education + deposit + signage + initialStock + other;
  const remainForInteriorAndEquip = Math.max(0, total - knownCosts);

  // Interior: ~55% of remainder, Equipment: ~45%
  const interior = Math.round(remainForInteriorAndEquip * 0.55);
  const equipment = remainForInteriorAndEquip - interior;

  return {
    franchiseFee: fee,
    education,
    deposit,
    interior,
    equipment,
    signage,
    initialStock,
    other,
    total,
    monthlyRoyalty: brand.monthlyRoyalty
  };
}

/** Format cost breakdown as localized label array */
export function formatCostBreakdownItems(
  bd: FranchiseCostBreakdown,
  lang: "ko" | "en"
): Array<{ label: string; value: string; highlight?: boolean }> {
  const f = (won: number) => formatFranchiseCost(won);
  const ko = lang === "ko";
  return [
    { label: ko ? "가맹비" : "Franchise Fee", value: `${f(bd.franchiseFee)}원` },
    { label: ko ? "교육비" : "Training", value: `${f(bd.education)}원` },
    { label: ko ? "보증금" : "Deposit", value: `${f(bd.deposit)}원` },
    { label: ko ? "인테리어" : "Interior", value: `${f(bd.interior)}원` },
    { label: ko ? "주방장비·집기" : "Equipment", value: `${f(bd.equipment)}원` },
    { label: ko ? "간판·외부" : "Signage", value: `${f(bd.signage)}원` },
    { label: ko ? "초도물품" : "Initial Stock", value: `${f(bd.initialStock)}원` },
    { label: ko ? "기타" : "Other", value: `${f(bd.other)}원` },
    { label: ko ? "예상 총 비용" : "Estimated Total", value: `${f(bd.total)}원`, highlight: true },
    { label: ko ? "월 로열티" : "Monthly Royalty", value: bd.monthlyRoyalty > 0 ? `${bd.monthlyRoyalty}만원/월` : (ko ? "없음" : "None") }
  ];
}

/** Score color */
export function getScoreColor(score: number): string {
  if (score >= 90) return "#34c759";
  if (score >= 80) return "#30d158";
  if (score >= 70) return "#007aff";
  if (score >= 60) return "#ff9f0a";
  return "#ff3b30";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  FRANCHISE SUPPLY STRUCTURE
 *  프랜차이즈 공급 구조
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export type SupplyType = "hq-exclusive" | "hq-designated" | "free-purchase";

export type FranchiseSupplyItem = {
  category: { ko: string; en: string };
  type: SupplyType;
  items: { ko: string; en: string }[];
  note?: { ko: string; en: string };
};

/** 업종별 공통 프랜차이즈 공급 구조 */
const categorySupplyPatterns: Record<string, FranchiseSupplyItem[]> = {
  "cafe-dessert": [
    { category: { ko: "원두·시럽·파우더", en: "Beans, syrup, powder" }, type: "hq-exclusive", items: [{ ko: "본사 자체 로스팅 원두", en: "HQ-roasted beans" }, { ko: "시럽·파우더·소스류", en: "Syrups, powders, sauces" }], note: { ko: "브랜드 맛 일관성 유지를 위해 본사 독점 공급", en: "HQ exclusive for taste consistency" } },
    { category: { ko: "기계·장비", en: "Machines & equipment" }, type: "hq-designated", items: [{ ko: "에스프레소 머신", en: "Espresso machine" }, { ko: "제빙기·블렌더", en: "Ice maker, blender" }, { ko: "DID 메뉴보드", en: "DID menu board" }], note: { ko: "본사 지정 모델 사용 필수", en: "HQ-specified models required" } },
    { category: { ko: "컵·포장재", en: "Cups & packaging" }, type: "hq-designated", items: [{ ko: "브랜드 로고 컵·슬리브", en: "Branded cups & sleeves" }, { ko: "테이크아웃 봉투·캐리어", en: "Takeout bags & carriers" }], note: { ko: "브랜드 디자인 통일을 위해 지정 업체 구매 (일부 자유 구매 가능)", en: "Designated for brand consistency (some free purchase possible)" } },
    { category: { ko: "인테리어·간판", en: "Interior & signage" }, type: "hq-designated", items: [{ ko: "본사 시공팀 또는 지정 업체", en: "HQ construction or designated contractor" }, { ko: "외부 간판·내부 사인물", en: "Exterior signage, interior signs" }] },
    { category: { ko: "소모품·위생용품", en: "Consumables & hygiene" }, type: "free-purchase", items: [{ ko: "냅킨·빨대·물티슈", en: "Napkins, straws, wet wipes" }, { ko: "세제·청소용품", en: "Detergent, cleaning supplies" }, { ko: "직원 유니폼 (일부 본사 지급)", en: "Staff uniform (some provided by HQ)" }] },
    { category: { ko: "POS·키오스크", en: "POS & kiosk" }, type: "hq-designated", items: [{ ko: "본사 지정 POS 시스템", en: "HQ-designated POS" }, { ko: "키오스크 (본사 연동 필수)", en: "Kiosk (HQ integration required)" }] },
  ],
  "food": [
    { category: { ko: "핵심 식재료·소스", en: "Core ingredients & sauce" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 소스·양념", en: "HQ recipe sauce & seasoning" }, { ko: "메인 식재료 (치킨·패티·면 등)", en: "Main ingredients (chicken, patty, noodle, etc.)" }], note: { ko: "브랜드 맛 보장을 위해 본사 물류센터에서 직배송", en: "Direct delivery from HQ logistics center for taste guarantee" } },
    { category: { ko: "주방 장비", en: "Kitchen equipment" }, type: "hq-designated", items: [{ ko: "튀김기·오븐·그릴 (본사 사양)", en: "Fryer, oven, grill (HQ spec)" }, { ko: "냉장·냉동고", en: "Refrigerator, freezer" }] },
    { category: { ko: "포장재·배달용품", en: "Packaging & delivery" }, type: "hq-designated", items: [{ ko: "브랜드 박스·봉투", en: "Branded boxes & bags" }, { ko: "배달 보온팩", en: "Delivery insulated packs" }] },
    { category: { ko: "인테리어·간판", en: "Interior & signage" }, type: "hq-designated", items: [{ ko: "본사 시공 또는 지정 업체", en: "HQ construction or designated" }, { ko: "간판·메뉴보드", en: "Signage, menu board" }] },
    { category: { ko: "부재료·소모품", en: "Sub-ingredients & consumables" }, type: "free-purchase", items: [{ ko: "야채·쌀 등 일반 식재료", en: "Vegetables, rice, etc." }, { ko: "세제·위생용품", en: "Detergent, hygiene supplies" }, { ko: "일회용 장갑·앞치마", en: "Disposable gloves, aprons" }] },
    { category: { ko: "POS·키오스크", en: "POS & kiosk" }, type: "hq-designated", items: [{ ko: "본사 연동 POS", en: "HQ-linked POS" }, { ko: "배달앱 태블릿", en: "Delivery app tablet" }] },
  ],
  "retail": [
    { category: { ko: "상품 공급", en: "Product supply" }, type: "hq-exclusive", items: [{ ko: "본사 물류센터 자동 발주", en: "Auto-order from HQ logistics" }, { ko: "PB 상품", en: "Private brand products" }], note: { ko: "편의점은 본사 ERP로 자동 발주 — 가맹점이 직접 선택하는 폭이 제한적", en: "Convenience stores use HQ ERP auto-order — limited franchisee selection" } },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·온장고", en: "Refrigerated displays, warmers" }, { ko: "POS·CCTV", en: "POS, CCTV" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품·봉투", en: "Cleaning supplies, bags" }] },
  ],
  "beauty": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "hq-designated", items: [{ ko: "염색제·펌제·트리트먼트", en: "Hair color, perm, treatment" }, { ko: "네일 젤·아트 재료", en: "Nail gel, art materials" }], note: { ko: "브랜드 품질 유지를 위해 본사 지정 제품 사용 권장 (일부 자유)", en: "HQ-designated products recommended for quality (some flexible)" } },
    { category: { ko: "장비·가구", en: "Equipment & furniture" }, type: "hq-designated", items: [{ ko: "시술 의자·샴푸대", en: "Styling chair, shampoo unit" }, { ko: "인테리어 (본사 시공)", en: "Interior (HQ construction)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·케이프·장갑", en: "Towels, capes, gloves" }, { ko: "세제·위생용품", en: "Detergent, hygiene" }] },
  ],
};

/** Brand-specific supply overrides (실제 조사 기반) */
const brandSupplyOverrides: Record<string, FranchiseSupplyItem[]> = {
  "mega-coffee": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "100% 아라비카 프리미엄 원두", en: "100% Arabica premium beans" }], note: { ko: "CK코페레이션 위탁 로스팅 → 본사 독점 공급, 상품매출 4,672억원(2024)", en: "CK Corporation contract roasting → HQ exclusive, 4,672B product revenue (2024)" } },
    { category: { ko: "시럽·파우더·소스", en: "Syrup, powder, sauce" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 전용 시럽·파우더", en: "HQ-recipe exclusive syrup/powder" }] },
    { category: { ko: "컵·포장재", en: "Cups & packaging" }, type: "hq-designated", items: [{ ko: "브랜드 로고 컵·슬리브", en: "Branded cups & sleeves" }], note: { ko: "가맹사업법상 '권장 품목' — 일부 점주 협의회 자체 조달 사례 있음", en: "Legally 'recommended' item — some franchisee associations self-source" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·제빙기·블렌더·DID", en: "Espresso machine, ice maker, blender, DID" }], note: { ko: "본사 지정 모델 필수, DID 메뉴보드 321만원", en: "HQ-specified models required, DID menu board 3.21M" } },
    { category: { ko: "소모품·위생용품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "냅킨·빨대·세제·청소용품", en: "Napkins, straws, detergent, cleaning" }] },
    { category: { ko: "POS·키오스크", en: "POS & kiosk" }, type: "hq-designated", items: [{ ko: "본사 연동 POS + 키오스크", en: "HQ-linked POS + kiosk" }] },
  ],
  "compose-coffee": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "자체 스마트팩토리 로스팅 (월 500톤)", en: "In-house smart factory roasting (500t/mo)" }], note: { ko: "생두 수입→로스팅→포장→물류 원스톱 (충북 증평), 독일 프로밧·이탈리아 페트론치니 대형로스터", en: "Bean import→roast→pack→logistics one-stop, Probat/Petroncini roasters" } },
    { category: { ko: "시럽·파우더", en: "Syrup & powder" }, type: "hq-exclusive", items: [{ ko: "본사 자체 생산 파우더·시럽", en: "HQ in-house powder/syrup" }] },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "컴포즈 디자인 통일 컵·캐리어", en: "Compose-design unified cups/carriers" }] },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "본사 디자인 시공 필수", en: "HQ-designed build mandatory" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "냅킨·빨대·세제", en: "Napkins, straws, detergent" }] },
  ],
  "paiks-dabang": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "콜롬비아 수프리모 베이스 자체 로스팅", en: "Colombia Supremo base, in-house roast" }], note: { ko: "더본코리아 자체 로스팅, 로스팅 2일 내 배송 → 2주 내 사용 의무. 2025년 원두 교체 진행", en: "The Born Korea roasting, 2-day delivery → 2-week use mandate. 2025 bean change" } },
    { category: { ko: "간식 메뉴 식재료", en: "Snack ingredients" }, type: "hq-exclusive", items: [{ ko: "에그토스트·샌드위치 등 간식 재료", en: "Egg toast, sandwich etc. snack materials" }] },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "더본코리아 통합 물류", en: "The Born Korea unified logistics" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "냅킨·빨대·세제·청소용품", en: "Napkins, straws, detergent, cleaning" }] },
  ],
  "bbq": [
    { category: { ko: "닭고기·올리브유", en: "Chicken & olive oil" }, type: "hq-exclusive", items: [{ ko: "본사 물류센터 직배송", en: "HQ logistics direct delivery" }], note: { ko: "올리브유: HY인터내셔널 독점 공급, 원부자재 39개 품목 본사 공급", en: "Olive oil: HY International exclusive, 39 items HQ-supplied" } },
    { category: { ko: "소스·파우더·패키지", en: "Sauce, powder, packaging" }, type: "hq-exclusive", items: [{ ko: "양념 소스류·치킨 파우더·브랜드 박스", en: "Seasoning sauce, chicken powder, branded boxes" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기·여과기 (본사 사양)", en: "Fryer, filter (HQ spec)" }] },
    { category: { ko: "부재료·소모품", en: "Sub-materials" }, type: "free-purchase", items: [{ ko: "세제·장갑·앞치마·청소용품", en: "Detergent, gloves, aprons, cleaning" }] },
  ],
  "kyochon-chicken": [
    { category: { ko: "원육·소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "주 6일 배송 (업계 최초)", en: "6-day delivery (industry first)" }], note: { ko: "WMS/TMS 도입, 원육 신선도 극대화. 3PL 사업 확대 중", en: "WMS/TMS deployed, max freshness. Expanding 3PL" } },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "모던 빈티지 인테리어 (본사 시공)", en: "Modern vintage interior (HQ build)" }] },
    { category: { ko: "수제 맥주", en: "Craft beer" }, type: "hq-exclusive", items: [{ ko: "교촌 자체 수제 맥주 라인", en: "Kyochon in-house craft beer" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·위생용품·일회용품", en: "Detergent, hygiene, disposables" }] },
  ],
  "moms-touch": [
    { category: { ko: "버거 번·패티·치킨", en: "Burger bun, patty, chicken" }, type: "hq-exclusive", items: [{ ko: "빔보큐에스알코리아(번), 패티·치킨 본사 공급", en: "BimboQSR Korea (bun), patty/chicken HQ supply" }], note: { ko: "중앙화 구매·물류·위생 시스템 (맥도날드 출신 대표 구축)", en: "Centralized purchase/logistics/hygiene (ex-McDonald's CEO built)" } },
    { category: { ko: "소스·양념", en: "Sauce & seasoning" }, type: "hq-exclusive", items: [{ ko: "싸이버거 전용 소스 등 본사 레시피", en: "Cyburger sauce etc. HQ recipe" }] },
    { category: { ko: "장비·POS", en: "Equipment & POS" }, type: "hq-designated", items: [{ ko: "튀김기·그릴·POS·키오스크", en: "Fryer, grill, POS, kiosk" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·위생용품", en: "Detergent, gloves, hygiene" }] },
  ],
  "cu": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "본사 ERP 자동발주 시스템", en: "HQ ERP auto-order system" }], note: { ko: "BGF리테일 물류센터 직배송, 2026년 부산 대형 물류센터 가동 예정 (2,200억 투자)", en: "BGF Retail logistics center, 2026 Busan mega-center planned (220B investment)" } },
    { category: { ko: "PB상품", en: "Private brand" }, type: "hq-exclusive", items: [{ ko: "CU 자체 브랜드 상품", en: "CU private brand products" }] },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·온장고·POS·CCTV", en: "Refrigerated displays, warmers, POS, CCTV" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품·봉투", en: "Cleaning supplies, bags" }] },
  ],
  "gs25": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "GS리테일 ERP·데이터 기반 자동발주", en: "GS Retail ERP/data-driven auto-order" }], note: { ko: "업계 최고 수준 디지털 발주 시스템, PB상품 데이터 기반 MD 기획", en: "Best-in-class digital ordering, data-driven PB product planning" } },
    { category: { ko: "PB상품", en: "Private brand" }, type: "hq-exclusive", items: [{ ko: "유어스(YOU US) 등 자체 브랜드", en: "YOU US and other private brands" }] },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·커피머신·POS", en: "Refrigerated displays, coffee machine, POS" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품", en: "Cleaning supplies" }] },
  ],
  // ── Group A: Remaining cafe/dessert/bakery ──
  "ediya-coffee": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "드림팩토리 자체 로스팅 (평택, 연 6,000톤)", en: "Dream Factory in-house roasting (Pyeongtaek, 6,000t/yr)" }], note: { ko: "스위스 뷸러·독일 프로밧 설비, 4단계 이물 선별 → 전자동 로스팅·포장. 물류는 이천 드림물류센터", en: "Swiss Bühler/German Probat equipment, 4-stage sorting → auto roast/pack. Icheon logistics center" } },
    { category: { ko: "파우더·스틱커피", en: "Powder & stick coffee" }, type: "hq-exclusive", items: [{ ko: "드림팩토리 자체 생산", en: "Dream Factory in-house production" }] },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·POS·인테리어 본사 사양", en: "Espresso machine, POS, interior HQ spec" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "냅킨·빨대·세제", en: "Napkins, straws, detergent" }] },
  ],
  "the-venti": [
    { category: { ko: "원두·파우더·액상", en: "Beans, powder, liquid" }, type: "hq-exclusive", items: [{ ko: "퍼플랜드 자체 생산 (충북 증평, 원두 5,000t·파우더 10,000t·액상 5,000t/년)", en: "Purpleland in-house (Jeungpyeong, 5,000t beans·10,000t powder·5,000t liquid/yr)" }], note: { ko: "생두 직접 수입, 8단계 선별, 로스팅 후 블랜딩 방식. 매년 원두+부자재 가격 인하 실현", en: "Direct green bean import, 8-stage sorting, post-roast blending. Annual price reductions" } },
    { category: { ko: "포장재·간판", en: "Packaging & signage" }, type: "hq-designated", items: [{ ko: "더벤티 디자인 통일 컵·간판", en: "The Venti unified design cups/signage" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·제빙기·DID (무이자 할부 지원)", en: "Espresso machine, ice maker, DID (interest-free installment)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "냅킨·빨대·세제", en: "Napkins, straws, detergent" }] },
  ],
  "twosome-place": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "큐그레이더 선별 3종 블랜드 (블랙그라운드·아로마노트·디카페인)", en: "Q-Grader curated 3 blends" }], note: { ko: "칼라일 그룹 인수 후에도 원두·레시피 변경 없음 (자체 로스팅)", en: "No bean/recipe changes after Carlyle acquisition (in-house roasting)" } },
    { category: { ko: "디저트·케이크", en: "Dessert & cake" }, type: "hq-exclusive", items: [{ ko: "충북 음성 '어썸 페어링 플랜트' 자체 생산 (스초생·피치생 등)", en: "Eumseong 'Awesome Pairing Plant' in-house (Strawberry/Peach Choux etc.)" }] },
    { category: { ko: "인테리어·장비", en: "Interior & equipment" }, type: "hq-designated", items: [{ ko: "디저트 쇼케이스 필수, 본사 인테리어 설계", en: "Dessert showcase required, HQ interior design" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "냅킨·세제·청소용품", en: "Napkins, detergent, cleaning" }] },
  ],
  "baskin-robbins": [
    { category: { ko: "아이스크림·원료", en: "Ice cream & ingredients" }, type: "hq-exclusive", items: [{ ko: "비알코리아 충북 음성 HACCP 인증 공장 생산", en: "BR Korea Eumseong HACCP-certified factory" }], note: { ko: "SPC그룹 계열, 시즌별 신메뉴 자동 공급. 케이크·음료도 본사 레시피", en: "SPC Group, seasonal new items auto-supplied. Cake/drinks also HQ recipe" } },
    { category: { ko: "커피원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "비알코리아 자체 로스팅 센터", en: "BR Korea in-house roasting center" }] },
    { category: { ko: "판매장비·인테리어", en: "Sales equipment & interior" }, type: "hq-designated", items: [{ ko: "아이스크림 냉동 쇼케이스·인테리어 본사 시공", en: "Ice cream freezer showcase, HQ interior build" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "냅킨·스푼·위생용품", en: "Napkins, spoons, hygiene" }] },
  ],
  "sulbing": [
    { category: { ko: "빙수 재료·토핑", en: "Bingsu ingredients & topping" }, type: "hq-exclusive", items: [{ ko: "인절미·팥·우유 아이스 등 핵심 재료 본사 공급", en: "Injeolmi, red bean, milk ice — HQ supplied" }], note: { ko: "다수 메뉴 OEM 생산, 시즌별 신메뉴 본사 자동 공급", en: "Many items OEM-produced, seasonal new menus auto-supplied" } },
    { category: { ko: "토스트·음료 재료", en: "Toast & drink ingredients" }, type: "hq-exclusive", items: [{ ko: "토스트 식빵·잼·음료 파우더", en: "Toast bread, jam, drink powder" }] },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "빙삭기·냉동고·인테리어 본사 사양", en: "Ice shaver, freezer, HQ interior spec" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "냅킨·스푼·일회용기", en: "Napkins, spoons, disposable containers" }] },
  ],
  "paris-baguette": [
    { category: { ko: "냉동생지·빵 재료", en: "Frozen dough & bread" }, type: "hq-exclusive", items: [{ ko: "SPL(구 SPC로지스틱스) 냉동생지·소스 생산", en: "SPL (fmr SPC Logistics) frozen dough/sauce" }], note: { ko: "SPC그룹 계열 SPL이 전국 파리바게뜨용 냉동생지·샌드위치 소스 등 생산. 미국 텍사스 공장 2027년 가동 예정", en: "SPC Group's SPL produces frozen dough/sandwich sauce. Texas factory planned 2027" } },
    { category: { ko: "케이크·디저트", en: "Cake & dessert" }, type: "hq-exclusive", items: [{ ko: "SPC그룹 통합 생산·물류", en: "SPC Group integrated production/logistics" }] },
    { category: { ko: "제빵 장비·오븐", en: "Baking equipment & oven" }, type: "hq-designated", items: [{ ko: "본사 지정 오븐·발효기·쇼케이스", en: "HQ-designated oven, proofer, showcase" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "포장지·비닐백 (일부 본사 디자인)", en: "Wrapping, bags (some HQ design)" }] },
  ],
  "tous-les-jours": [
    { category: { ko: "냉동생지·빵 재료", en: "Frozen dough & bread" }, type: "hq-exclusive", items: [{ ko: "CJ푸드빌 자체 생산 (한국 공장 + 베트남 롱안 공장)", en: "CJ Foodville in-house (Korea + Vietnam Long An factory)" }], note: { ko: "미국 조지아 게인스빌에 신규 공장 건설 중 (연 1억개 생산, 2025년 12월 가동 목표)", en: "New Georgia Gainesville factory under construction (100M/yr, Dec 2025 target)" } },
    { category: { ko: "케이크·디저트", en: "Cake & dessert" }, type: "hq-exclusive", items: [{ ko: "CJ푸드빌 통합 생산", en: "CJ Foodville integrated production" }] },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "본사 지정 오븐·발효기·인테리어", en: "HQ-designated oven, proofer, interior" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "포장재·위생용품", en: "Packaging, hygiene" }] },
  ],
  // ── Group B: Remaining food brands ──
  "bhc": [
    { category: { ko: "닭고기·소스·파우더", en: "Chicken, sauce, powder" }, type: "hq-exclusive", items: [{ ko: "다이닝브랜드그룹 물류 직배송 (국내산 닭)", en: "Dining Brands Group logistics direct (domestic chicken)" }], note: { ko: "뿌링클 파우더·소스 등 시그니처 메뉴 재료 본사 독점. 포장재도 본사 공급", en: "Ppurinkle powder/sauce HQ exclusive. Packaging also HQ-supplied" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기·인테리어 본사 시공", en: "Fryer, HQ interior build" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·위생용품", en: "Detergent, gloves, hygiene" }] },
  ],
  "goobne": [
    { category: { ko: "닭고기·소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "오븐구이용 염지 닭 + 전용 소스 본사 공급", en: "Oven-roast marinated chicken + exclusive sauce HQ supply" }], note: { ko: "굽네 시그니처 오븐 조리 — 전용 오븐 사양 필수", en: "Goobne signature oven cooking — dedicated oven spec required" } },
    { category: { ko: "오븐·장비", en: "Oven & equipment" }, type: "hq-designated", items: [{ ko: "굽네 전용 오븐·인테리어", en: "Goobne dedicated oven, interior" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·위생용품", en: "Detergent, gloves, hygiene" }] },
  ],
  "60gye-chicken": [
    { category: { ko: "닭고기·소스·파우더", en: "Chicken, sauce, powder" }, type: "hq-exclusive", items: [{ ko: "장스푸드 본사 물류 공급 (9호 닭 사용)", en: "Jangs Food HQ logistics (size 9 chicken)" }] },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 박스·봉투", en: "Branded boxes/bags" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑", en: "Detergent, gloves" }] },
  ],
  "dominos": [
    { category: { ko: "도우·토핑·치즈", en: "Dough, topping, cheese" }, type: "hq-exclusive", items: [{ ko: "도미노 전용 도우·소스·치즈 본사 물류", en: "Domino's exclusive dough/sauce/cheese HQ logistics" }], note: { ko: "글로벌 표준 레시피, 30분 배달 보장 시스템", en: "Global standard recipe, 30-min delivery guarantee" } },
    { category: { ko: "오븐·장비", en: "Oven & equipment" }, type: "hq-designated", items: [{ ko: "컨베이어 오븐·POS·배달 시스템", en: "Conveyor oven, POS, delivery system" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·위생용품", en: "Detergent, hygiene" }] },
  ],
  "nene-chicken": [
    { category: { ko: "닭고기·소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "스노윙 파우더·반반 소스 등 본사 공급 (10호 닭)", en: "Snowing powder, half-half sauce HQ supply (size 10)" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기·인테리어", en: "Fryer, interior" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·위생용품", en: "Detergent, gloves, hygiene" }] },
  ],
  "hosik-chicken": [
    { category: { ko: "닭고기·소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "두마리 전용 9호 닭 + 양념 소스 본사 공급", en: "Two-chicken size 9 + seasoning sauce HQ supply" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기", en: "Fryer" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·포장지", en: "Detergent, gloves, wrapping" }] },
  ],
  "norang-tongdak": [
    { category: { ko: "닭고기·기름", en: "Chicken & oil" }, type: "hq-exclusive", items: [{ ko: "가마솥 튀김용 12호 닭 + 전용 기름 본사 공급", en: "Iron pot frying size 12 chicken + exclusive oil HQ supply" }], note: { ko: "노랑통닭은 12호 닭 사용 — 업계 최대 크기", en: "Norang uses size 12 — largest in industry" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "가마솥 튀김기 3대 (본사 사양)", en: "3 iron pot fryers (HQ spec)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑", en: "Detergent, gloves" }] },
  ],
  "hongkong-banjum": [
    { category: { ko: "핵심 소스·식재료", en: "Core sauce & ingredients" }, type: "hq-exclusive", items: [{ ko: "더본코리아 통합 물류 (짬뽕 육수·짜장 소스 등)", en: "The Born Korea logistics (jjamppong broth, jjajang sauce)" }], note: { ko: "웍 자동 로봇 도입으로 주방 운영 간소화, 메뉴 집중화로 품질 극대화", en: "Wok auto-robot for simplified kitchen, menu focus for max quality" } },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "웍 로봇·주방설비·인테리어 본사 시공", en: "Wok robot, kitchen, HQ interior" }] },
    { category: { ko: "야채·부재료", en: "Vegetables & sub-materials" }, type: "free-purchase", items: [{ ko: "현지 구매 가능 신선 식재료", en: "Locally purchasable fresh ingredients" }] },
  ],
  "new-maeul": [
    { category: { ko: "핵심 소스·양념", en: "Core sauce & seasoning" }, type: "hq-exclusive", items: [{ ko: "더본코리아 통합 물류 (열탄불고기 소스·7분 돼지김치 양념 등)", en: "The Born Korea logistics (bulgogi sauce, pork kimchi seasoning)" }] },
    { category: { ko: "인테리어", en: "Interior" }, type: "hq-designated", items: [{ ko: "새마을식당 콘셉트 인테리어 본사 시공", en: "Saemaeul concept interior HQ build" }] },
    { category: { ko: "식재료·주류", en: "Ingredients & alcohol" }, type: "free-purchase", items: [{ ko: "쌀·야채·주류 등 현지 구매", en: "Rice, vegetables, alcohol — local purchase" }] },
  ],
  "yeokjeon-udon": [
    { category: { ko: "육수·면·소스", en: "Broth, noodle, sauce" }, type: "hq-exclusive", items: [{ ko: "더본코리아 통합 물류 (특제 육수팩·우동면)", en: "The Born Korea logistics (special broth pack, udon noodle)" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "주방기물 (3천만원 장기렌탈 가능)", en: "Kitchen equipment (30M long-term rental available)" }] },
    { category: { ko: "부재료", en: "Sub-materials" }, type: "free-purchase", items: [{ ko: "야채·계란 등 현지 구매", en: "Vegetables, eggs — local purchase" }] },
  ],
  "yupdduk": [
    { category: { ko: "떡·소스·분말", en: "Rice cake, sauce, powder" }, type: "hq-exclusive", items: [{ ko: "엽기 전용 고추장 소스·떡·분말 본사 공급", en: "Yupdduk exclusive gochujang sauce/rice cake/powder HQ supply" }], note: { ko: "로열티 44만원/월, 초도 식자재 약 800만원 별도", en: "Royalty 440K/mo, initial ingredients ~8M separate" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "인덕션·POS·키오스크", en: "Induction, POS, kiosk" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "야채·계란·세제", en: "Vegetables, eggs, detergent" }] },
  ],
  "sinjeon": [
    { category: { ko: "떡·소스", en: "Rice cake & sauce" }, type: "hq-exclusive", items: [{ ko: "신전 전용 떡볶이 소스·떡 본사 공급", en: "Sinjeon exclusive tteokbokki sauce/rice cake HQ supply" }], note: { ko: "로열티 없음 — 식재료 납품 마진 구조", en: "No royalty — ingredient supply margin structure" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "조리 설비·POS", en: "Cooking equipment, POS" }] },
    { category: { ko: "소모품·부재료", en: "Consumables & sub-materials" }, type: "free-purchase", items: [{ ko: "야채·어묵·튀김·세제", en: "Vegetables, fish cake, fried, detergent" }] },
  ],
  // ── Group C+D: Remaining brands (beauty, fitness, education, pet, living, space) ──
  "juno-hair": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "hq-designated", items: [{ ko: "본사 지정 염색제·펌제·트리트먼트", en: "HQ-designated color, perm, treatment" }], note: { ko: "블랙스톤 인수 후 글로벌 공급망 확대 중, 디자이너 채용·교육 본사 지원", en: "Expanding global supply after Blackstone acquisition, HQ designer support" } },
    { category: { ko: "장비·가구", en: "Equipment & furniture" }, type: "hq-designated", items: [{ ko: "시술 의자·샴푸대·인테리어 (프리미엄 사양)", en: "Styling chair, shampoo unit, interior (premium spec)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·케이프·장갑·세제", en: "Towels, capes, gloves, detergent" }] },
  ],
  "cleantopia": [
    { category: { ko: "세탁기·건조기", en: "Washer & dryer" }, type: "hq-designated", items: [{ ko: "세탁기·건조기 각 3대 (본사 사양, 7,348만원)", en: "3 washers + 3 dryers (HQ spec, 73.48M)" }], note: { ko: "로열티 0원 — 세탁 물량 수수료 구조. POS 무상대여, 초도물품 무상대여", en: "Zero royalty — laundry volume fee. Free POS/initial supplies rental" } },
    { category: { ko: "부대 설비", en: "Auxiliary equipment" }, type: "hq-designated", items: [{ ko: "스마트락커·키오스크·세제자동투입기", en: "Smart locker, kiosk, auto detergent dispenser" }] },
    { category: { ko: "세제·소모품", en: "Detergent & consumables" }, type: "free-purchase", items: [{ ko: "세제 (자동투입기 호환 제품)", en: "Detergent (auto-dispenser compatible)" }] },
  ],
  "washnjoy": [
    { category: { ko: "코인세탁기·건조기", en: "Coin washer & dryer" }, type: "hq-designated", items: [{ ko: "워시엔조이 지정 세탁·건조 장비", en: "WashEnJoy designated wash/dry equipment" }], note: { ko: "가맹비·로열티 0원 — 장비 구매 수익 구조. 완전 무인 운영", en: "Zero fee/royalty — equipment purchase model. Fully unmanned" } },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·섬유유연제 (자판기용)", en: "Detergent, fabric softener (for vending)" }] },
  ],
  // ── Remaining 25 brands ──
  "kimbap-cheonguk": [
    { category: { ko: "식재료 전체", en: "All ingredients" }, type: "free-purchase", items: [{ ko: "점포별 자율 구매 (인근 식자재마트·도매시장)", en: "Store-level free purchase (nearby wholesale/market)" }], note: { ko: "단일 본사 강제력 없음 — 점포별 식재료 품질·원산지 상이. 자율성이 높은 대신 본사 물류 지원 없음", en: "No single HQ enforcement — quality varies by store. High autonomy but no HQ logistics" } },
    { category: { ko: "간판", en: "Signage" }, type: "hq-designated", items: [{ ko: "김밥천국 간판 (상표 사용)", en: "Kimbap Cheonguk signage (trademark use)" }] },
  ],
  "bonjuk": [
    { category: { ko: "죽 재료·소스", en: "Porridge ingredients & sauce" }, type: "hq-exclusive", items: [{ ko: "본아이에프 본사 공급 (전용 죽 베이스·양념)", en: "Bonif HQ supply (exclusive porridge base/seasoning)" }], note: { ko: "조리 교육 3주 필수 이수, 본죽&비빔밥 복합 모델 가능", en: "3-week cooking training mandatory, Bonjuk & Bibimbap combo available" } },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 용기·포장", en: "Brand containers/packaging" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·쌀·해산물 등", en: "Vegetables, rice, seafood" }] },
  ],
  "hansot-lunchbox": [
    { category: { ko: "핵심 식재료", en: "Core ingredients" }, type: "hq-exclusive", items: [{ ko: "한솥 본사 식자재 공급 (김치: 해남·평창산 배추, 불고기: 호주산 S급 목심)", en: "Hansot HQ supply (kimchi: Korean cabbage, bulgogi: Australian S-grade)" }], note: { ko: "로열티 0원 — 원재료 납품 마진 구조. HACCP 인증 가공장 생산, 이력추적 가능", en: "Zero royalty — ingredient margin model. HACCP-certified, traceable" } },
    { category: { ko: "장비·POS", en: "Equipment & POS" }, type: "hq-designated", items: [{ ko: "주방장비·POS 본사 사양", en: "Kitchen equipment, POS HQ spec" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·위생용품", en: "Detergent, hygiene" }] },
  ],
  "saladit": [
    { category: { ko: "샐러드 재료·드레싱", en: "Salad ingredients & dressing" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 드레싱·토핑 공급", en: "HQ recipe dressing/topping supply" }] },
    { category: { ko: "신선 채소", en: "Fresh vegetables" }, type: "free-purchase", items: [{ ko: "채소·과일 현지 구매 (신선도 관리 핵심)", en: "Vegetables/fruit local purchase (freshness critical)" }], note: { ko: "식재료 신선도 관리가 핵심 — 오피스 상권 필수", en: "Freshness management is key — office district essential" } },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 용기·봉투", en: "Brand containers/bags" }] },
  ],
  "vips": [
    { category: { ko: "식재료 전체", en: "All ingredients" }, type: "hq-exclusive", items: [{ ko: "CJ푸드빌 통합 식자재 공급 (CJ프레시웨이 물류)", en: "CJ Foodville integrated supply (CJ Freshway logistics)" }], note: { ko: "CJ그룹 계열 — 안정적 공급망. 샐러드바·스테이크·파스타 전 메뉴 본사 레시피", en: "CJ Group — stable supply chain. All menus HQ recipe" } },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "대형 주방설비·샐러드바·인테리어 (100평+ 필수)", en: "Large kitchen, salad bar, interior (100+ pyeong)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·위생용품", en: "Detergent, hygiene" }] },
  ],
  "seven-eleven": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "코리아세븐 물류센터 자동발주", en: "Korea Seven logistics auto-order" }], note: { ko: "글로벌 표준 발주 시스템, 저효율 점포 구조조정 진행 중 (2024년 978개 순감)", en: "Global standard ordering, low-efficiency store cleanup ongoing (978 net closures 2024)" } },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·POS·CCTV", en: "Refrigerated displays, POS, CCTV" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품", en: "Cleaning supplies" }] },
  ],
  "emart24": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "신세계그룹 SSG 물류센터 자동발주", en: "Shinsegae SSG logistics auto-order" }], note: { ko: "정액 회원비(15~60만/월) → 정률제 전환 중. SSG PB상품 접근 가능", en: "Flat fee (150K-600K/mo) transitioning to percentage. SSG PB access" } },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·POS", en: "Refrigerated displays, POS" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품", en: "Cleaning supplies" }] },
  ],
  "lian-hair": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "hq-designated", items: [{ ko: "본사 권장 염색제·펌제 (일부 자율)", en: "HQ-recommended color/perm (some flexible)" }], note: { ko: "전국 최다 가맹점(470개), 서울형 상생프랜차이즈 선정", en: "Largest network (470), Seoul-type coexistence franchise" } },
    { category: { ko: "장비·가구", en: "Equipment & furniture" }, type: "hq-designated", items: [{ ko: "시술 의자·샴푸대·인테리어", en: "Styling chair, shampoo unit, interior" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·케이프·세제", en: "Towels, capes, detergent" }] },
  ],
  "blue-club": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "free-purchase", items: [{ ko: "이발 용품 자유 구매 (남성 커트 전문)", en: "Barber supplies free purchase (men's cut specialist)" }], note: { ko: "남성 전문 — 커트 위주 단순 운영, 1인 운영 가능", en: "Men-only — simple cut-focused, solo operation viable" } },
    { category: { ko: "인테리어", en: "Interior" }, type: "hq-designated", items: [{ ko: "블루클럽 표준 인테리어", en: "Blue Club standard interior" }] },
  ],
  "anytime-fitness": [
    { category: { ko: "운동 기구", en: "Fitness equipment" }, type: "hq-designated", items: [{ ko: "본사 글로벌 표준 사양 (Life Fitness·Precor 등)", en: "HQ global standard spec (Life Fitness, Precor, etc.)" }], note: { ko: "글로벌 회원 상호 이용 — 전 세계 동일 장비 사양 필수. 최소 100평 이상", en: "Global member reciprocal use — worldwide identical equipment required. Min 100+ pyeong" } },
    { category: { ko: "출입·보안 시스템", en: "Access & security" }, type: "hq-designated", items: [{ ko: "24시간 무인 출입 시스템·CCTV", en: "24h unmanned access system, CCTV" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·세제·음료자판기", en: "Towels, detergent, beverage vending" }] },
  ],
  "curves": [
    { category: { ko: "유압식 운동기구", en: "Hydraulic equipment" }, type: "hq-designated", items: [{ ko: "커브스 전용 유압식 순환운동 기구 세트", en: "Curves exclusive hydraulic circuit training set" }], note: { ko: "여성 전용 — 유압식으로 부상 위험 낮음. 30분 순환운동 전용 기구", en: "Women-only — hydraulic for low injury risk. 30-min circuit dedicated equipment" } },
    { category: { ko: "운영 매뉴얼", en: "Operations manual" }, type: "hq-exclusive", items: [{ ko: "본사 체계적 운영 매뉴얼·프로그램", en: "HQ systematic operations manual/program" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·세제·음료", en: "Towels, detergent, beverages" }] },
  ],
  "noonnoppi": [
    { category: { ko: "교재·학습지", en: "Textbooks & worksheets" }, type: "hq-exclusive", items: [{ ko: "대교 본사 100% 자체 제작 교재 공급", en: "Daekyo HQ 100% in-house textbook supply" }], note: { ko: "방문학습 — 별도 매장 불필요. 대교그룹 1976년 설립, 20년 연속 교육브랜드 대상", en: "Home-visit — no store needed. Daekyo Group est. 1976, 20-year consecutive education brand award" } },
    { category: { ko: "디지털 학습 도구", en: "Digital learning tools" }, type: "hq-exclusive", items: [{ ko: "눈높이 러닝센터 태블릿·앱", en: "Noonnoppi Learning Center tablet/app" }] },
  ],
  "kumon": [
    { category: { ko: "교재·프린트", en: "Textbooks & worksheets" }, type: "hq-exclusive", items: [{ ko: "교원구몬 본사 100% 자체 제작 학습지 공급", en: "Kyowon Kumon HQ 100% in-house worksheet supply" }], note: { ko: "글로벌 자기주도학습 프로그램, 50개국 진출. 교실형 소규모 운영 가능", en: "Global self-paced learning, 50 countries. Small classroom operation viable" } },
  ],
  "polypark": [
    { category: { ko: "반려동물 용품·간식", en: "Pet supplies & treats" }, type: "hq-designated", items: [{ ko: "본사 지정 용품·간식 브랜드 (일부 자유)", en: "HQ-designated supplies/treat brands (some free)" }], note: { ko: "반려동물 시장 연 15% 성장, 용품+간식+미용 복합 모델", en: "Pet market ~15% annual growth, supplies+treats+grooming combo" } },
    { category: { ko: "미용 장비", en: "Grooming equipment" }, type: "hq-designated", items: [{ ko: "미용 테이블·드라이어·클리퍼", en: "Grooming table, dryer, clipper" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "위생용품·청소도구", en: "Hygiene, cleaning tools" }] },
  ],
  "petmart": [
    { category: { ko: "반려동물 용품·사료", en: "Pet supplies & food" }, type: "hq-exclusive", items: [{ ko: "펫마트 본사 물류 일괄 공급 (100평 대형 매장)", en: "PetMart HQ logistics bulk supply (100-pyeong large store)" }], note: { ko: "점당 매출 5.25억으로 펫 업계 최고, 용품+식품+미용+호텔 복합 모델", en: "5.25B per-store — highest in pet, supplies+food+grooming+hotel combo" } },
    { category: { ko: "미용·호텔 설비", en: "Grooming & hotel facilities" }, type: "hq-designated", items: [{ ko: "미용실·호텔 설비 본사 사양", en: "Grooming/hotel facilities HQ spec" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "위생용품", en: "Hygiene supplies" }] },
  ],
  "toz-study": [
    { category: { ko: "스터디룸 시스템", en: "Study room system" }, type: "hq-designated", items: [{ ko: "토즈 예약·결제 시스템 + 좌석 관리", en: "Toz reservation/payment system + seat management" }] },
    { category: { ko: "인테리어·가구", en: "Interior & furniture" }, type: "hq-designated", items: [{ ko: "스터디룸+카페 복합 인테리어 (대학가·오피스 최적)", en: "Study room + cafe hybrid interior (university/office optimal)" }] },
    { category: { ko: "커피·음료", en: "Coffee & beverages" }, type: "free-purchase", items: [{ ko: "카페 메뉴 자율 구성 가능", en: "Cafe menu freely configurable" }] },
  ],
  "misoya": [
    { category: { ko: "소스·육수·면", en: "Sauce, broth, noodle" }, type: "hq-exclusive", items: [{ ko: "미소야 전용 돈까스 소스·우동 육수·소바 면 본사 공급", en: "Misoya exclusive tonkatsu sauce, udon broth, soba noodle HQ supply" }], note: { ko: "190개 가맹점, 점당 매출 3.6억. 간단 조리 — 주방 인력 최소화", en: "190 stores, 3.6B per-store. Simple cooking — min labor" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기·면 삶는 기계 본사 사양", en: "Fryer, noodle cooker HQ spec" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·쌀·세제", en: "Vegetables, rice, detergent" }] },
  ],
  "keunmal-halmae": [
    { category: { ko: "육수·순대", en: "Broth & sundae" }, type: "hq-exclusive", items: [{ ko: "본사 육수 팩·순대 직배송", en: "HQ broth pack/sundae direct delivery" }], note: { ko: "순대국밥 전문 — 본사 육수 팩으로 맛 일관성 유지", en: "Sundae soup specialist — HQ broth pack for taste consistency" } },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·양념·쌀", en: "Vegetables, seasoning, rice" }] },
  ],
  "hyundaeok": [
    { category: { ko: "국밥 육수·소스", en: "Soup broth & sauce" }, type: "hq-exclusive", items: [{ ko: "현대옥 전용 콩나물국밥 육수 본사 직배송", en: "Hyundae Ok exclusive bean sprout soup broth HQ delivery" }], note: { ko: "전주 콩나물국밥 원조 35년 전통. 관광지·출장 상권 최적", en: "35-year Jeonju tradition. Tourist/business districts optimal" } },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "콩나물·쌀·반찬 재료", en: "Bean sprouts, rice, side dish ingredients" }] },
  ],
  "dookki": [
    { category: { ko: "떡볶이 소스·재료", en: "Tteokbokki sauce & ingredients" }, type: "hq-exclusive", items: [{ ko: "두끼 전용 떡볶이 소스·떡·라면 본사 공급", en: "Dookki exclusive sauce/rice cake/ramen HQ supply" }], note: { ko: "무한리필 뷔페 콘셉트 — 홀 필수 (20평+). 젊은 층 타겟", en: "Unlimited buffet concept — dine-in required (20+pyeong). Youth target" } },
    { category: { ko: "뷔페 설비", en: "Buffet equipment" }, type: "hq-designated", items: [{ ko: "뷔페 진열대·인덕션·인테리어", en: "Buffet display, induction, interior" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·김밥 재료·음료", en: "Vegetables, kimbap ingredients, beverages" }] },
  ],
  "park-seungchul": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "hq-designated", items: [{ ko: "본사 지정 염색제·펌제·트리트먼트", en: "HQ-designated color, perm, treatment" }] },
    { category: { ko: "장비·가구", en: "Equipment & furniture" }, type: "hq-designated", items: [{ ko: "시술 의자·샴푸대·인테리어 (30평+ 권장)", en: "Styling chair, shampoo unit, interior (30+ pyeong)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·케이프·장갑·세제", en: "Towels, capes, gloves, detergent" }] },
  ],
  "golden-nail": [
    { category: { ko: "네일 젤·재료", en: "Nail gel & materials" }, type: "hq-designated", items: [{ ko: "본사 지정 젤·아트 재료", en: "HQ-designated gel/art materials" }] },
    { category: { ko: "인테리어", en: "Interior" }, type: "hq-designated", items: [{ ko: "골든네일 표준 인테리어 (5평~ 소규모)", en: "Golden Nail standard interior (5+ pyeong small)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "리무버·코튼·위생용품", en: "Remover, cotton, hygiene" }] },
  ],
  "yuhu-nail": [
    { category: { ko: "네일 제품", en: "Nail products" }, type: "hq-designated", items: [{ ko: "본사 교육 프로그램 연계 지정 제품", en: "HQ training-linked designated products" }], note: { ko: "프리미엄 네일 서비스, 예약제 운영 — 안정적 매출", en: "Premium nail, reservation-based — stable revenue" } },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "리무버·코튼·위생용품", en: "Remover, cotton, hygiene" }] },
  ],
  "seldog24-study": [
    { category: { ko: "좌석 관리 시스템", en: "Seat management system" }, type: "hq-designated", items: [{ ko: "셀독24 IoT 좌석 관리 + 무인 결제", en: "Seldog24 IoT seat management + unmanned payment" }] },
    { category: { ko: "인테리어", en: "Interior" }, type: "hq-designated", items: [{ ko: "본사 표준 인테리어 (40평~)", en: "HQ standard interior (40+ pyeong)" }] },
    { category: { ko: "커피머신", en: "Coffee machine" }, type: "free-purchase", items: [{ ko: "무인 커피머신·자판기", en: "Unmanned coffee machine, vending" }] },
  ],
  "seven-star-coin": [
    { category: { ko: "노래방 기기", en: "Noraebang equipment" }, type: "hq-designated", items: [{ ko: "노래방 기기 (금영·TJ) + 코인 결제 시스템", en: "Noraebang machine (Kumyoung/TJ) + coin payment system" }], note: { ko: "코인노래방 가맹점 수 1위 (320개). 24시간 무인 운영, MZ세대 타겟", en: "#1 coin noraebang by count (320). 24h unmanned, MZ generation target" } },
    { category: { ko: "인테리어·방음", en: "Interior & soundproofing" }, type: "hq-designated", items: [{ ko: "방음 시공·인테리어 본사 사양", en: "Soundproofing, interior HQ spec" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "마이크 커버·청소용품", en: "Mic covers, cleaning supplies" }] },
  ],
  "zaksim-study": [
    { category: { ko: "좌석 관리 시스템", en: "Seat management system" }, type: "hq-designated", items: [{ ko: "작심 중앙관제 + IoT 좌석 시스템", en: "Zaksim central control + IoT seat system" }], note: { ko: "무인 운영 — 중앙관제 시스템으로 고객 문의·결제 오류 원격 대응", en: "Unmanned — central control for remote customer/payment support" } },
    { category: { ko: "인테리어·가구", en: "Interior & furniture" }, type: "hq-designated", items: [{ ko: "본사 표준 인테리어 (60평+ 권장)", en: "HQ standard interior (60+ pyeong recommended)" }] },
    { category: { ko: "커피머신·자판기", en: "Coffee machine & vending" }, type: "free-purchase", items: [{ ko: "무인 커피머신·자판기 (작심커피 연동 가능)", en: "Unmanned coffee machine, vending (Zaksim Coffee linkable)" }] },
  ],
};

/** Get supply structure for a franchise brand — brand-specific first, then category fallback */
export function getFranchiseSupplyInfo(brand: FranchiseBrand): FranchiseSupplyItem[] {
  return brandSupplyOverrides[brand.id] ?? categorySupplyPatterns[brand.categoryId] ?? categorySupplyPatterns["food"] ?? [];
}

/** Supply type label */
export function getSupplyTypeLabel(type: SupplyType, lang: "ko" | "en"): string {
  if (type === "hq-exclusive") return lang === "ko" ? "본사 독점 공급" : "HQ Exclusive";
  if (type === "hq-designated") return lang === "ko" ? "본사 지정 업체" : "HQ Designated";
  return lang === "ko" ? "자유 구매 가능" : "Free Purchase";
}

/** Supply type color */
export function getSupplyTypeColor(type: SupplyType): string {
  if (type === "hq-exclusive") return "#ff3b30";
  if (type === "hq-designated") return "#ff9f0a";
  return "#34c759";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  FRANCHISE APPLICATION GUIDE
 *  가맹 절차 안내 데이터
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export type FranchiseChecklistItem = {
  id: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  estimatedDays?: number;
};

export const franchiseApplicationChecklist: FranchiseChecklistItem[] = [
  {
    id: "inquiry",
    title: { ko: "본사 가맹 상담 신청", en: "Request HQ franchise consultation" },
    description: {
      ko: "브랜드 공식 홈페이지 또는 전화로 가맹 상담을 신청하세요. 창업 설명회가 있다면 참석을 권장합니다.",
      en: "Apply for consultation via the brand's official website or phone. Attend startup seminars if available."
    },
    estimatedDays: 3
  },
  {
    id: "disclosure",
    title: { ko: "정보공개서 수령 및 검토", en: "Receive & review disclosure document" },
    description: {
      ko: "가맹사업법에 따라 본사는 계약 체결 14일 전에 정보공개서를 제공해야 합니다. 가맹비, 영업지역, 계약 해지 조건 등을 꼼꼼히 확인하세요.",
      en: "By law, HQ must provide the disclosure document 14 days before signing. Carefully review franchise fees, territory protection, and termination terms."
    },
    estimatedDays: 14
  },
  {
    id: "visit-stores",
    title: { ko: "인근 가맹점 방문 확인", en: "Visit nearby franchise stores" },
    description: {
      ko: "본사가 제공한 인근 가맹점 10곳의 목록을 활용하여 실제 점주들의 경험을 직접 확인하세요. 매출, 본사 지원, 불만사항 등을 솔직하게 물어보세요.",
      en: "Use the list of 10 nearby stores provided by HQ to hear real experiences from existing owners about revenue, support, and complaints."
    },
    estimatedDays: 7
  },
  {
    id: "legal-review",
    title: { ko: "계약서 법률 검토", en: "Legal review of contract" },
    description: {
      ko: "변호사 또는 가맹거래사에게 계약서 검토를 의뢰하세요. 14일 숙려기간이 7일로 단축됩니다. 독소조항, 위약금, 필수물품 강제 등을 확인하세요.",
      en: "Have a lawyer or franchise consultant review the contract. This reduces the cooling period to 7 days. Check for unfair terms, penalties, and mandatory purchases."
    },
    estimatedDays: 5
  },
  {
    id: "sign-contract",
    title: { ko: "가맹 계약 체결", en: "Sign franchise agreement" },
    description: {
      ko: "정보공개서 수령 14일(변호사 검토 시 7일) 이후에만 계약이 가능합니다. 가맹비를 납부하고 본사와 정식 계약을 체결하세요.",
      en: "Contract signing is only allowed 14 days (7 with legal review) after receiving disclosure. Pay the franchise fee and sign officially."
    },
    estimatedDays: 1
  },
  {
    id: "training",
    title: { ko: "본사 교육 이수", en: "Complete HQ training" },
    description: {
      ko: "브랜드별로 1~4주의 교육 과정이 있습니다. 조리, 위생, POS 운영, 고객 응대 등을 배우게 됩니다.",
      en: "Brands require 1-4 weeks of training covering cooking, hygiene, POS, and customer service."
    },
    estimatedDays: 14
  }
];

export type ContractCheckpoint = {
  id: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  riskLevel: "critical" | "important" | "info";
};

export const contractCheckpoints: ContractCheckpoint[] = [
  {
    id: "contract-period",
    title: { ko: "계약 기간 및 갱신 조건", en: "Contract period & renewal" },
    description: {
      ko: "계약 기간이 초기 투자금 회수에 충분한지 확인하세요. 보통 3~5년이며, 갱신 조건(추가 비용, 인테리어 리뉴얼 등)을 반드시 확인하세요.",
      en: "Ensure contract length covers your investment recovery. Usually 3-5 years. Check renewal conditions (additional costs, interior renewal, etc.)."
    },
    riskLevel: "critical"
  },
  {
    id: "fee-refund",
    title: { ko: "가맹비 반환 조건", en: "Franchise fee refund policy" },
    description: {
      ko: "계약 해지 시 가맹비 반환 여부와 조건을 확인하세요. 정보공개서 미제공 또는 허위정보 제공 시 전액 반환 가능합니다.",
      en: "Check refund conditions upon termination. Full refund is possible if disclosure was not provided or contained false information."
    },
    riskLevel: "critical"
  },
  {
    id: "territory",
    title: { ko: "영업지역 보호 범위", en: "Territory protection scope" },
    description: {
      ko: "본사가 보장하는 영업지역 범위와 동일 브랜드 출점 제한을 명확히 확인하세요. 모호한 표현은 분쟁의 원인이 됩니다.",
      en: "Verify the protected territory range and same-brand opening restrictions. Vague wording causes disputes."
    },
    riskLevel: "critical"
  },
  {
    id: "royalty-structure",
    title: { ko: "로열티 구조", en: "Royalty structure" },
    description: {
      ko: "월 정액인지, 매출 비율인지, 별도 광고 분담금이 있는지 확인하세요. 광고 모델료 점주 분담 여부도 중요합니다.",
      en: "Determine if royalty is flat fee or revenue percentage. Check for separate ad contributions and model fee sharing."
    },
    riskLevel: "important"
  },
  {
    id: "mandatory-purchase",
    title: { ko: "필수 물품 구매 의무", en: "Mandatory purchase requirements" },
    description: {
      ko: "본사에서 반드시 구매해야 하는 물품(원재료, 포장재 등)의 범위와 가격 적정성을 확인하세요. 시중 대비 과도하게 높지 않은지 비교하세요.",
      en: "Review mandatory purchases (ingredients, packaging) and verify price fairness vs. market alternatives."
    },
    riskLevel: "important"
  },
  {
    id: "interior-mandate",
    title: { ko: "인테리어·시설 강제 여부", en: "Interior/facility mandates" },
    description: {
      ko: "본사 지정 업체 시공 의무, 리뉴얼 주기, 비용 부담 주체를 확인하세요. 계약 갱신 시 인테리어 재시공 조건도 중요합니다.",
      en: "Check HQ-designated contractor requirements, renewal cycles, and who bears the cost. Interior redo terms at renewal matter."
    },
    riskLevel: "important"
  },
  {
    id: "ad-cost-share",
    title: { ko: "광고·홍보 분담금", en: "Advertising cost sharing" },
    description: {
      ko: "전국 광고비, 지역 광고비, 오프닝 광고비가 별도로 부과되는지 확인하세요. 광고비가 매출 대비 과도하지 않은지 검토하세요.",
      en: "Verify national, regional, and opening ad costs charged separately. Ensure ad spend is proportional to expected revenue."
    },
    riskLevel: "important"
  },
  {
    id: "termination",
    title: { ko: "계약 해지 조건 및 위약금", en: "Termination terms & penalties" },
    description: {
      ko: "본사의 일방적 해지 사유, 가맹점의 해지 가능 조건, 위약금 규모를 반드시 확인하세요. 부당한 해지 조항은 분쟁조정 대상입니다.",
      en: "Must check HQ's unilateral termination grounds, franchisee's termination rights, and penalty amounts."
    },
    riskLevel: "critical"
  },
  {
    id: "transfer-restrict",
    title: { ko: "사업 양도 제한", en: "Business transfer restrictions" },
    description: {
      ko: "제3자에게 양도 시 본사 승인 절차와 제한 조건을 확인하세요. 양도 시 추가 비용이 발생하는지도 확인하세요.",
      en: "Check HQ approval process and restrictions for third-party transfer. Verify additional transfer costs."
    },
    riskLevel: "info"
  },
  {
    id: "dispute-resolution",
    title: { ko: "분쟁 해결 방식", en: "Dispute resolution method" },
    description: {
      ko: "분쟁 발생 시 중재/소송 절차와 비용 부담을 확인하세요. 한국프랜차이즈산업협회 분쟁조정협의회를 활용할 수 있습니다.",
      en: "Check arbitration/litigation procedures and cost allocation. The Korean Franchise Association mediation committee is available."
    },
    riskLevel: "info"
  }
];
