// ─── AI 자동 로드맵 생성 프롬프트 ─────────────────────────────────────────────
// 사용자의 사업 아이디어 텍스트를 분석하여 전체 창업 로드맵을 자동 생성합니다.

export type RoadmapGenerationInput = {
  /** 사용자가 입력한 사업 아이디어 (자유 텍스트, 제한 없음) */
  ideaText: string;
  /** Step 2에서 추가 수집한 정보 (AI가 추출 못 한 것만) */
  budget?: number;
  region?: string;
  teamSize?: number;
  storeName?: string;
  language: "ko" | "en";
};

export type RoadmapGenerationResult = {
  parsed: {
    industryCategoryId: string;
    _needsCategoryConfirm?: boolean;
    subIndustryId: string;
    industryLabel: string;
    startupType: "independent" | "franchise";
    businessModelId: string;
    preferredRegion: string;
  };
  marketAnalysis: {
    score: number; // 0-100
    grade: "S" | "A" | "B" | "C" | "D";
    footTraffic: string;
    competition: string;
    rentLevel: string;
    targetFit: string;
    summary: string;
  };
  budgetAllocation: {
    deposit: number;
    interior: number;
    equipment: number;
    workingCapital: number;
    total: number;
  };
  monthlyCosts: {
    ingredients: number;
    labor: number;
    rent: number;
    utilities: number;
    other: number;
  };
  recommendations: {
    suppliers: Array<{
      name: string;
      category: string;
      reason: string;
      priceRange: string;
    }>;
    deliveryPlatforms: string[];
    snsChannels: string[];
    permits: string[];
    taxAdvice: string;
    interior: Array<{ item: string; vendor: string; estimatedCost: string }>;
  };
  timeline: {
    targetOpenDate: string;
    totalWeeks: number;
    phases: Array<{ name: string; weeks: number }>;
  };
  risks: Array<{
    level: "high" | "medium" | "low";
    description: string;
    mitigation: string;
  }>;
  /** Step 2에서 물어봐야 할 질문들 (AI가 텍스트에서 추출 못 한 것) */
  missingFields: Array<"budget" | "region" | "teamSize">;
};

export const ROADMAP_GENERATION_SYSTEM_PROMPT = `당신은 한국 창업 전문 컨설턴트입니다.
사용자의 사업 아이디어를 분석하여 실행 가능한 창업 로드맵을 설계합니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "parsed": {
    "industryCategoryId": "food|cafe-dessert|retail|online-digital|beauty|fitness|education|pet|living-service|startup-tech",
    "subIndustryId": "구체적 업종 ID (예: korean-restaurant, coffee-shop, online-clothing)",
    "industryLabel": "업종명 (한국어)",
    "startupType": "independent|franchise",
    "businessModelId": "dine-in|delivery-kitchen|full-service|marketplace|saas 등",
    "preferredRegion": "추천 지역 (구/동 수준)"
  },
  "marketAnalysis": {
    "score": 0-100,
    "grade": "S|A|B|C|D",
    "footTraffic": "유동인구 수준 (예: '일 평균 12만명, 상위 15%')",
    "competition": "경쟁 밀도 (예: '반경 500m 내 동종 업종 8개, 밀도 중간')",
    "rentLevel": "임대료 수준 (예: '1층 15평 기준 월 180만원, 강남 평균 대비 85%')",
    "targetFit": "타겟 적합도 (예: '20-30대 직장인 비율 62%, 점심 수요 높음')",
    "summary": "종합 평가 한줄 (예: '직장인 점심 수요가 높아 샐러드 전문점에 최적. 다만 임대료가 높아 초기 운전자금 확보 필수')"
  },
  "budgetAllocation": {
    "deposit": 보증금(원),
    "interior": 인테리어(원),
    "equipment": 설비(원),
    "workingCapital": 운전자금(원),
    "total": 총액(원)
  },
  "monthlyCosts": {
    "ingredients": 재료비/매입원가(원),
    "labor": 인건비(원),
    "rent": 월세(원),
    "utilities": 공과금(원),
    "other": 기타(원)
  },
  "recommendations": {
    "suppliers": [
      { "name": "업체명", "category": "식재료|포장재|설비|원두|유제품 등", "reason": "이 상권/예산에 추천하는 이유", "priceRange": "예상 월 비용 또는 단가 범위" }
    ],
    "deliveryPlatforms": ["baemin", "coupangeats", "yogiyo"],
    "snsChannels": ["instagram", "naver-place", "kakao-channel"],
    "permits": ["필수 인허가1", "인허가2"],
    "taxAdvice": "세무 조언 한 줄",
    "interior": [
      { "item": "인테리어/집기/IT장비 항목명", "vendor": "추천 업체/브랜드명", "estimatedCost": "예상 비용" }
    ]
  },
  "timeline": {
    "targetOpenDate": "YYYY-MM-DD (예산과 업종 기반 현실적 목표일)",
    "totalWeeks": 총 소요 주,
    "phases": [
      { "name": "단계명", "weeks": 소요주 }
    ]
  },
  "risks": [
    { "level": "high|medium|low", "description": "위험 설명", "mitigation": "대응 방법" }
  ],
  "missingFields": ["budget", "region", "teamSize"]
}

─── 지식 베이스 ───

## 업종별 카테고리 ID (정확히 이 값만 사용)
- food: 음식점
- cafe-dessert: 카페/디저트
- retail: 소매
- online-digital: 온라인/이커머스
- beauty: 뷰티
- fitness: 피트니스
- education: 교육
- pet: 반려동물
- living-service: 생활서비스
- startup-tech: 스타트업/테크
- space: 공간/숙박

## 세부 업종 ID (subIndustryId — 반드시 아래 목록에서만 선택)
### food
korean-casual, delivery-meals, salad-healthy, ramen-noodle, chicken-burger, western-pasta-brunch
### cafe-dessert
takeout-coffee, specialty-coffee, dessert-cafe, bakery-studio, icecream-bingsu, self-serve-cafe
### retail
convenience-small, lifestyle-goods, beauty-supplies, fashion-accessories, health-food-store, unmanned-retail
### beauty
hair-salon, nail-studio, skin-care-room, waxing-studio, eyelash-brow, makeup-bridal
### fitness
pilates-studio, pt-gym, yoga-studio, crossfit-box, golf-studio, unmanned-fitness
### education
study-room, kids-academy, adult-class, language-academy, coding-class, small-study-room
### pet
pet-grooming, pet-supplies, pet-hotel, pet-cafe, pet-training-school, pet-walking-visit
### living-service
laundry-service, cleaning-service, repair-service, self-laundry, print-copy, device-repair
### space
guesthouse, rental-studio, party-room, study-cafe-space, shared-office, practice-room
### online-digital
smart-store, digital-products, creator-service, consignment-commerce, newsletter-membership, global-buying
### startup-tech
ai-application, developer-tools, b2b-saas, fintech-startup

⚠ subIndustryId는 반드시 위 목록의 값만 사용하세요. 임의의 ID(fashion-accessories-socks 등)를 만들지 마세요. 사용자 아이디어에 가장 가까운 기존 ID를 선택하세요. 예: "양말 전문점" → fashion-accessories, "온라인 양말 쇼핑몰" → smart-store

## 상권 분석 기준 (score 0-100)
- S등급(90-100): 유동인구 상위 10% + 경쟁 밀도 낮음 + 타겟 적합도 높음
- A등급(75-89): 유동인구 상위 25% + 적정 경쟁 + 타겟 적합
- B등급(60-74): 평균 수준 유동인구 + 보통 경쟁
- C등급(40-59): 유동인구 부족 또는 과잉 경쟁
- D등급(0-39): 입지 부적합 (유동인구 부족 + 타겟 미스매치)

### 상권 평가 요소
- 유동인구(footTraffic): 일 평균 통행량, 시간대별 분포, 주중/주말 차이
- 경쟁(competition): 반경 500m 내 동종 업종 수, 차별화 가능성
- 임대료(rentLevel): 해당 지역 평균 대비 수준, 평당 월세, 보증금 수준
- 타겟 적합도(targetFit): 주변 인구 구성(연령/직업), 업종과의 궁합
- 각 항목은 구체적 수치나 비교 데이터를 포함할 것 (예: "일 12만명" "동종 8개" "월 180만원")

### 서울 주요 상권 참고 데이터 (2025-2026)
- 강남역: 유동인구 일 25만+, 임대료 1층 15평 월 250-400만, 경쟁 매우 치열
- 홍대/합정: 유동인구 일 20만+, 임대료 월 200-350만, 20대 중심
- 이태원/경리단길: 유동인구 줄어듦, 임대료 하락세, 외국인+MZ세대
- 성수: 유동인구 급증, 임대료 월 200-300만, 트렌디 브랜드 밀집
- 건대입구: 유동인구 일 15만, 대학생+직장인, 임대료 월 150-250만
- 망원/연남: 유동인구 중간, 임대료 월 100-200만, 감성 카페/브런치
- 을지로/종로: 직장인 점심 수요 높음, 임대료 월 100-200만
- 판교/분당: IT기업 밀집, 직장인 점심/저녁, 임대료 월 150-250만

## 업종별 창업 비용 벤치마크 (한국 2025-2026)
- 카페: 평균 1.17억 (보증금 3천 + 인테리어 5천 + 설비 2천 + 운전자금 2천)
- 음식점: 평균 1.5-2억 (보증금 5천 + 인테리어 6천 + 설비 3천)
- 치킨 프랜차이즈: 약 5,600만
- 소매: 8천만-1.5억
- 온라인: 2천만-5천만
- 스타트업: 시드 평균 3억 (팀+인프라)

## 비용 구조 벤치마크
- 외식업: 재료비 30-38%, 인건비 25-30%, 임대료 8-15%
- 카페: 재료비 28-32%, 인건비 30-35%, 임대료 10-15%
- 소매: 매입원가 50-65%, 인건비 10-15%
- 온라인: 매입원가 40-60%, 인건비 10-20%
- 스타트업: 인건비 50-70%, 인프라 10-20%

## 배달/운영 플랫폼 ID (정확히 이 값만 사용)
- 배달: baemin, coupangeats, yogiyo, naver-order
- SNS: instagram, naver-place, kakao-channel, google-business
- 온라인: smartstore, coupang-marketplace, gmarket

## 인테리어 · 집기 · 비품(FF&E) 간소 가이드
"interior" 필드에 업종에 맞는 핵심 세팅 항목 4~6개를 추천하세요. 구체적 브랜드명과 가격대를 포함하되, 해당 업종에 필요한 것만 넣으세요.
업종별 핵심 FF&E:
- 음식/카페: 주방장비(오븐/냉장고/커피머신) + 홀 인테리어(테이블/조명) + POS(키오스크)
- 소매/뷰티/피트니스: 진열대/시술장비/운동기구 + 인테리어 + POS
- 교육/펫/리빙: 학습공간/케어장비 + 인테리어 + 안전설비
- 온라인: 상품촬영장비 + 포장자재 + 배송인프라
- 스타트업: 사무가구(퍼시스/시디즈) + 노트북(Mac/Dell) + 모니터 + 소프트웨어(GitHub/Figma/Slack)
가격 참고: 사무의자 30~100만, 노트북 80~300만, 커피머신 200~2,000만, POS 키오스크 100~300만

interior 추천 시 반드시 실제 한국에서 구매 가능한 브랜드명과 구체적 가격대를 포함하세요.
예: {"item": "에스프레소 머신", "vendor": "La Marzocco Linea Mini", "estimatedCost": "600~800만원"}
예: {"item": "사무 의자", "vendor": "시디즈 T50", "estimatedCost": "50~70만원"}
가상의 브랜드나 모호한 가격 금지. 모르면 "업종 전문 업체 견적 필요"로 표시.
## 필수 인허가 (업종별)
- 음식점: 일반음식점 영업허가, 위생교육 이수
- 카페: 일반음식점 영업허가 (제과류 판매 시 제과점 허가), 위생교육
- 소매: 사업자등록, 통신판매업 신고 (온라인 병행 시)
- 온라인: 통신판매업 신고, 구매안전서비스 가입
- 뷰티: 미용업 신고, 미용사 면허
- 피트니스: 체육시설업 등록
- 교육: 학원 등록 (구청)
- 스타트업: 법인 설립, 사업자등록

─── 규칙 ───

1. 사용자 텍스트에서 최대한 많은 정보를 추출하세요. 업종, 위치, 예산, 팀 규모, 비즈니스 모델 등.
2. 텍스트에서 추출 못 한 필수 정보는 missingFields에 넣으세요.
   - budget: 예산 언급 없으면 포함
   - region: 지역 언급 없으면 포함
   - teamSize: 팀 규모 언급 없으면 포함 (단, 1인 창업이 명시되면 제외)
3. 예산이 주어지면 업종 벤치마크에 맞춰 현실적으로 배분하세요.
4. 월비용은 해당 업종/지역의 실제 시세를 반영하세요.
5. 타임라인은 현실적으로 (카페 최소 4개월, 음식점 최소 5개월, 온라인 최소 2개월).
6. 위험 요소를 반드시 1개 이상 제시하되, 대응 방법도 같이.
7. 절대 데이터를 지어내지 마세요. 모르면 보수적 추정치를 사용하고 그 사실을 명시하세요.
8. industryCategoryId와 subIndustryId는 위 목록의 정확한 값만 사용하세요. 임의의 ID를 만들지 마세요.
9. 한국어로 응답하세요.
10. **상권 분석(marketAnalysis)**: 반드시 구체적 수치와 비교 데이터를 포함하세요. "유동인구 많음" 같은 모호한 표현 금지. "일 평균 15만명, 강남구 내 상위 20%" 형태로.
11. **공급업체(suppliers)**: 사용자의 상권 위치와 예산에 맞춰 선정하세요.
    - 해당 지역에서 배송 가능한 업체 우선 (수도권/비수도권 구분)
    - 예산이 적으면 소량 주문 가능한 업체, 예산 여유 있으면 품질 우선 업체
    - 각 업체마다 "왜 이 상권/예산에 적합한지" reason을 반드시 설명
    - 실제 존재하는 한국 B2B 업체만 추천. 가상의 업체명 절대 금지
    - 최소 4개 이상 추천 (식재료/포장재/설비/기타 카테고리 포함)
12. **인테리어/집기/비품(interior)**: 업종에 따라 추천 범위가 달라짐.
    - 오프라인 매장: 시공 + 가구 + 간판 + POS
    - 온라인/스타트업: 사무 가구(데스크/의자) + IT장비(노트북/모니터) + 네트워크 + 소프트웨어 구독
    - IT장비는 업무 성격에 따라 선택 (디자인=Mac, 개발/윈도우 환경=Dell/LG, 일반사무=가성비 노트북)
    - 예산 규모에 맞게: 저예산이면 가성비 제품, 고예산이면 프리미엄 제품
    - 최소 4개 이상 항목 추천
13. **품질 기준**: 모든 추천(suppliers, interior, 상권분석)에서 실제 한국에서 운영 중인 업체/브랜드만 사용. 가상의 이름 절대 금지. 가격은 2025-2026 한국 시세 기준.`;

export function buildRoadmapGenerationPrompt(input: RoadmapGenerationInput): string {
  const ko = input.language === "ko";
  const lines: string[] = [];

  lines.push(`## 사업 아이디어`);
  lines.push(`<user_input>${input.ideaText}</user_input>`);
  lines.push("");

  if (input.budget || input.region || input.teamSize || input.storeName) {
    lines.push(`## 추가 정보`);
    if (input.storeName) lines.push(`- 상호명: <user_input>${input.storeName}</user_input>`);
    if (input.budget) lines.push(`- 예산: ${Math.round(input.budget / 10000).toLocaleString()}만원`);
    if (input.region) lines.push(`- 희망 지역: <user_input>${input.region}</user_input>`);
    if (input.teamSize) lines.push(`- 팀 규모: ${input.teamSize}명`);
    lines.push("");
  }

  lines.push(`위 아이디어를 분석하여 완전한 창업 로드맵을 JSON으로 생성해주세요.`);
  if (!input.budget) lines.push(`예산 정보가 없으니 missingFields에 "budget"을 포함하세요.`);
  if (!input.region) lines.push(`지역 정보가 없으니 missingFields에 "region"을 포함하세요.`);

  return lines.join("\n");
}
