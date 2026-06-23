//
//  cluster-budget-benchmarks.ts — cluster 별 평균 창업 자본 벤치마크 (만원 단위)
//
//  목적:
//   사용자의 시작 자본금 입력값을 동일 cluster 신규 창업자 평균과 비교해 표시.
//   "부족" 같은 verdict 가 아니라 "평균과의 차이"라는 descriptive frame.
//   부족분이 있으면 매칭되는 지원 프로그램을 항상 함께 표시 (action pair).
//
//  데이터는 실제 공개 자료에 기반 (각 cluster source 필드 참조).
//  추정치인 경우 isEstimate: true 로 명시 — UI 에 "추정" 라벨 표시.
//
//  자료 검증 완료: 2026-05 (한식진흥원·공정위 정보공개서·중기부·TheVC·바이오타임즈 등)
//

import type { ClusterId } from "./roadmap/clusters";

export interface ClusterBudgetBenchmark {
  /** 평균 (만원) */
  avgWan: number;
  /** 중앙값 (만원) */
  medianWan: number;
  /** 25분위 — 진입 가능 최저선 (만원) */
  p25Wan: number;
  /** 75분위 — 평균 이상 안정권 (만원) */
  p75Wan: number;
  /** 데이터 출처 표기 (실제 자료 인용) */
  source: string;
  /** 데이터 기준 연도 */
  yearReported: number;
  /** 추정치 여부 (true 면 UI 에 "추정" 라벨 표시) */
  isEstimate?: boolean;
  /** 추가 컨텍스트 (예: "시드 라운드 받은 경우 평균 17억, 부트스트랩 평균 표시 중") */
  noteKo?: string;
  /** 월 운영비 추정치 (만원) — 자본금-평균 차이를 개월수로 환산할 때 사용 */
  monthlyOpsEstimateWan: number;
}

export const CLUSTER_BUDGET_BENCHMARKS: Record<ClusterId, ClusterBudgetBenchmark> = {
  // ── 오프라인 ──
  "offline-food": {
    avgWan: 10436,
    medianWan: 9000,
    p25Wan: 5000,
    p75Wan: 15000,
    source: "농식품부·한식진흥원 한식산업 실태조사 (1,500점 표본)",
    yearReported: 2022,
    monthlyOpsEstimateWan: 1500,
    noteKo: "임대료·인건비·식자재 등 매월 1,200~1,700만원 소요. 가맹점은 평균보다 30~50% 상회 가능.",
  },
  "offline-cafe": {
    avgWan: 12394,
    medianWan: 12000,
    p25Wan: 7000,
    p75Wan: 20000,
    source: "이투데이·퍼펙트커피뉴스 카페창업 평균 (16평 기준)",
    yearReported: 2023,
    monthlyOpsEstimateWan: 1000,
    noteKo: "10평 소형 7,000~10,000만원 / 30평 중형 20,000~30,000만원. 디저트·베이커리는 +30~50%.",
  },
  "offline-retail": {
    avgWan: 17000,
    medianWan: 15000,
    p25Wan: 8000,
    p75Wan: 25000,
    source: "공정위 편의점 정보공개서 (CU·GS25·세븐일레븐) + 의류매장 추정",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 800,
    noteKo: "편의점 17,000만원 / 무인점포 3,000만원 / 의류 1,000~4,000만원. 카테고리 편차 매우 큼.",
  },
  "offline-beauty": {
    avgWan: 5000,
    medianWan: 4000,
    p25Wan: 1200,
    p75Wan: 10000,
    source: "큐플레이스 미용실 가이드 + 에스테틱 1인샵 실제 사례",
    yearReported: 2024,
    monthlyOpsEstimateWan: 600,
    noteKo: "1인 에스테틱·네일·왁싱 1,200만원대부터 / 미용실 10평 5,000~7,000만원 / 대형 30,000만원+",
  },
  "offline-fitness": {
    avgWan: 20000,
    medianWan: 15000,
    p25Wan: 5000,
    p75Wan: 50000,
    source: "ssjum·butterflyinvest 헬스장·필라테스 창업가이드",
    yearReported: 2024,
    monthlyOpsEstimateWan: 1500,
    noteKo: "PT 스튜디오 3,000~7,000만원 / 헬스장 5,000~20,000만원 / 100평+ 50,000만원+. 폐업률 매우 높음.",
  },
  "offline-education": {
    avgWan: 17000,
    medianWan: 15000,
    p25Wan: 10000,
    p75Wan: 25000,
    source: "마이스터디카페·imbeyonder 스터디카페 창업비용 (50평 기준)",
    yearReported: 2024,
    monthlyOpsEstimateWan: 800,
    noteKo: "공부방 1,000만원 미만 / 스터디카페 15,000~20,000만원 / 학원 5,000~30,000만원 편차 큼.",
  },
  "offline-pet": {
    avgWan: 12000,
    medianWan: 10000,
    p25Wan: 3000,
    p75Wan: 20000,
    source: "부자비즈 펫샵 표준비용 (폴리파크·야옹아멍멍해봐 프랜차이즈)",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 700,
    noteKo: "무인 애견샵 3,000만원 / 멀티펫샵 30평 9,500~20,000만원. 동물병원은 별도 (30,000만원+).",
  },
  "offline-living": {
    avgWan: 9000,
    medianWan: 9000,
    p25Wan: 6000,
    p75Wan: 13000,
    source: "모두코리아·imbeyonder 무인세탁(빨래방) 비교",
    yearReported: 2024,
    monthlyOpsEstimateWan: 300,
    noteKo: "무인세탁 6,000~13,000만원 / 일반 세탁소 3,000~7,000만원 / 청소·수리는 1,000~3,000만원.",
  },
  "offline-space": {
    avgWan: 5000,
    medianWan: 3000,
    p25Wan: 2000,
    p75Wan: 8000,
    source: "마이프차 파티룸 + 드림캐쳐스 공유오피스 정보공개서",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 300,
    noteKo: "파티룸 2,000~3,000만원 (가장 저렴) / 공유오피스 프랜차이즈 16,000만원 / 사진 스튜디오 3,000~10,000만원.",
  },

  // ── 온라인 ──
  "online-digital": {
    avgWan: 1500,
    medianWan: 1000,
    p25Wan: 300,
    p75Wan: 3000,
    source: "카페24·토스페이먼츠·아이보스 셀러 가이드 종합",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 250,
    noteKo: "위탁판매 모델 500만원 미만 가능 / 자체 사입+자체몰 3,000만원+. 플랫폼 수수료 3.74~10.8%.",
  },

  // ── 기술 스타트업 ──
  "tech-software": {
    avgWan: 5000,
    medianWan: 3000,
    p25Wan: 1500,
    p75Wan: 8000,
    source: "중기부 창업기업 실태조사 (소프트웨어 부트스트랩 단계)",
    yearReported: 2024,
    monthlyOpsEstimateWan: 2000,
    noteKo: "부트스트랩 평균 표시 중. 시드 라운드 받은 경우 평균 17.3억 (TheVC 2025, 전년比 2배). 3인 팀 월 burn 2,000~2,800만원.",
  },
  "tech-hardware": {
    avgWan: 15000,
    medianWan: 10000,
    p25Wan: 5000,
    p75Wan: 30000,
    source: "와디즈 펀딩 사례 + 중기부 TIPS 하드웨어 지원 평균",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 2000,
    noteKo: "EVT 500~3,000만원 / DVT 3,000~10,000만원 / PVT 10,000~30,000만원 / 금형 3,000~10,000만원 / KC인증 200~800만원.",
  },
  "tech-deeptech-lab": {
    avgWan: 100000,
    medianWan: 80000,
    p25Wan: 30000,
    p75Wan: 200000,
    source: "바이오타임즈 K-의료기기 2024 평균 라운드 + TIPS 딥테크 매칭 18~30억",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 6000,
    noteKo: "의료기기 임상 1건 평균 1.1억 (식약처) / 5인 R&D 팀 월 burn 5,000~9,000만원 / TIPS 딥테크 트랙 최대 15억 + 후속 30억.",
  },
  "tech-extreme-deeptech": {
    avgWan: 500000,
    medianWan: 300000,
    p25Wan: 100000,
    p75Wan: 1000000,
    source: "스타트업레시피·와우테일 팹리스 시드~시리즈A 실제 라운드 (2024~2025)",
    yearReported: 2025,
    isEstimate: true,
    monthlyOpsEstimateWan: 15000,
    noteKo: "팹리스 시드 10~50억 / 시리즈A 100억~900억 (보스반도체 870억·디노티시아 900억). MPW 28nm 7,000만~3.5억 / EDA 라이선스 연 수억~수십억.",
  },
};

// ── 세부 업종(specialty) 벤치마크 ──────────────────────────────────────────
//
//  cluster 평균은 "소매 17,000만" 처럼 범위가 넓어 정보 혼동을 부른다(사장님 신고 2026-06-23:
//  "편의점 골랐으면 편의점 평균이어야지"). specialty 가 있으면 *그 세부 업종 평균* 을 우선 사용하고,
//  없으면 cluster 평균으로 폴백한다. 단위 만원. 독립(비프랜차이즈) 창업 = 보증금+인테리어+장비+운전자금 3개월.
//  자료: 소진공·공정위 정보공개서·핀다 외식·마이프차·큐플레이스 등 (2024~2025 웹 조사). 추정은 isEstimate.
export const SPECIALTY_BUDGET_BENCHMARKS: Record<string, ClusterBudgetBenchmark> = {
  // ── FOOD ──
  "korean-casual": { avgWan: 9500, medianWan: 8800, p25Wan: 6000, p75Wan: 12000, monthlyOpsEstimateWan: 950, source: "식저널 한식 1억436만 · 핀다 서울 외식 7,681만", yearReported: 2024, noteKo: "권리금 포함 시 1억 초과. 보증금·평수 따라 편차 큼." },
  "delivery-meals": { avgWan: 2500, medianWan: 2000, p25Wan: 1000, p75Wan: 4500, monthlyOpsEstimateWan: 350, source: "요기요파트너·머니캣 공유주방 1~2천만 / 개인배달 ~8천만", yearReported: 2024, isEstimate: true, noteKo: "공유주방 입점 최저, 독립 점포 배달은 4~8천만으로 급증." },
  "salad-healthy": { avgWan: 7000, medianWan: 6500, p25Wan: 4000, p75Wan: 9000, monthlyOpsEstimateWan: 700, source: "버즈비즈·뷰리드 샐러드(샐러드박스 5,100·샐러디 8,400)+보증금", yearReported: 2024, isEstimate: true, noteKo: "조리 간단·소형 위주. 정보공개서값은 보증금 제외라 +2~3천 가산." },
  "ramen-noodle": { avgWan: 8500, medianWan: 8000, p25Wan: 4000, p75Wan: 11000, monthlyOpsEstimateWan: 850, source: "버즈비즈 멘지 8,900 · 핀다 국물요리 9,209", yearReported: 2024, isEstimate: true, noteKo: "주방 화구·덕트 부담 큼. 극소형은 4천대도 가능." },
  "chicken-burger": { avgWan: 7500, medianWan: 6000, p25Wan: 4000, p75Wan: 13000, monthlyOpsEstimateWan: 700, source: "핀다 치킨·닭강정 4,325 / 버거 1억5,713 · 공정위 치킨 9,394", yearReported: 2024, noteKo: "치킨은 저비용, 버거(매장형)는 1억+로 편차 매우 큼." },
  "western-pasta-brunch": { avgWan: 9500, medianWan: 9000, p25Wan: 6000, p75Wan: 14000, monthlyOpsEstimateWan: 950, source: "큐플레이스·소중함 인테리어 5~7천 + 오픈주방·홀 투자", yearReported: 2024, isEstimate: true, noteKo: "오픈주방·고급마감·넓은 홀로 인테리어 비중 높음." },
  // ── CAFE ──
  "takeout-coffee": { avgWan: 6500, medianWan: 6500, p25Wan: 4000, p75Wan: 9000, monthlyOpsEstimateWan: 500, source: "메가커피 7,424 · 컴포즈 6,708 (10평, 보증금 별도)", yearReported: 2024, noteKo: "10평 소형. 공시값은 보증금·권리금 제외, 전기증설로 +2~4천." },
  "specialty-coffee": { avgWan: 11000, medianWan: 10000, p25Wan: 7000, p75Wan: 15000, monthlyOpsEstimateWan: 900, source: "사이더랩·퍼펙트커피 개인카페 8천~1.2억 + 로스터기", yearReported: 2024, isEstimate: true, noteKo: "넓은 평수·고급 머신·자가로스팅 시 1억 초과." },
  "dessert-cafe": { avgWan: 7500, medianWan: 7000, p25Wan: 5000, p75Wan: 10000, monthlyOpsEstimateWan: 700, source: "지식채널·큐플레이스 카페 15평 5천~ / 주방기기 2~4천", yearReported: 2024, isEstimate: true, noteKo: "쇼케이스·디저트 주방 추가로 일반 커피점보다 높음." },
  "bakery-studio": { avgWan: 11000, medianWan: 10000, p25Wan: 6000, p75Wan: 16000, monthlyOpsEstimateWan: 900, source: "소중함·한성쇼케이스 5천~1.5억", yearReported: 2024, noteKo: "오븐·발효기·반죽기 등 제과 설비비 큼. 카페형은 2억+." },
  "icecream-bingsu": { avgWan: 6000, medianWan: 5500, p25Wan: 3500, p75Wan: 8500, monthlyOpsEstimateWan: 550, source: "카페창업 표준 15평 5천 + 빙수기·쇼케이스 가산", yearReported: 2024, isEstimate: true, noteKo: "계절성 강함. 빙수기·제빙·냉동 쇼케이스가 설비 핵심." },
  "self-serve-cafe": { avgWan: 4000, medianWan: 3600, p25Wan: 2500, p75Wan: 6000, monthlyOpsEstimateWan: 250, source: "스토랑트·myfounded 무인카페 평균 3,600 (비트 3,600·나우 6,270)", yearReported: 2024, noteKo: "무인이라 인건비·운영비 최저. 머신 구입 시 상단." },
  // ── RETAIL ──
  "convenience-small": { avgWan: 7270, medianWan: 7000, p25Wan: 5500, p75Wan: 9000, monthlyOpsEstimateWan: 800, source: "CU·GS25 정보공개서 (가맹비770+상품준비1,400+보증금5,000+소모품)", yearReported: 2024, noteKo: "보증금 5,000만(회수성)이 비용 대부분, 임차료 별도라 상권 변동 큼." },
  "lifestyle-goods": { avgWan: 6000, medianWan: 5500, p25Wan: 3500, p75Wan: 8500, monthlyOpsEstimateWan: 450, source: "큐플레이스·점포라인 잡화점 + 무인문구점 가이드", yearReported: 2024, isEstimate: true, noteKo: "다이소형 대형 제외, 동네 생활용품·문구잡화 10~20평 기준." },
  "beauty-supplies": { avgWan: 7000, medianWan: 6500, p25Wan: 4500, p75Wan: 9500, monthlyOpsEstimateWan: 600, source: "화장품 로드숍 정보공개서 하향 + 인테리어 평당 198만", yearReported: 2024, isEstimate: true, noteKo: "올리브영 대형 제외, 독립 화장품·뷰티편집 소규모점 기준." },
  "fashion-accessories": { avgWan: 4500, medianWan: 4000, p25Wan: 2500, p75Wan: 6500, monthlyOpsEstimateWan: 500, source: "큐플레이스 보세 옷가게 · 소중함 소자본 의류(1,000~4,000)", yearReported: 2024, isEstimate: true, noteKo: "보세·편집 의류, 동대문 사입 초도물품·권리금 포함." },
  "health-food-store": { avgWan: 6000, medianWan: 5500, p25Wan: 3800, p75Wan: 8000, monthlyOpsEstimateWan: 600, source: "소매점 일반 창업비용 가이드 (전용 통계 부재로 차용)", yearReported: 2024, isEstimate: true, noteKo: "냉장·진열집기 포함. 실데이터 확보 시 교체 권장." },
  "unmanned-retail": { avgWan: 5500, medianWan: 5000, p25Wan: 3500, p75Wan: 8000, monthlyOpsEstimateWan: 250, source: "무인 아이스크림/밀키트 창업가이드 (초기 4,000~7,000)", yearReported: 2024, noteKo: "무인 운영이라 월 운영비 낮음, ROI 약 18개월." },
  // ── BEAUTY ──
  "hair-salon": { avgWan: 5500, medianWan: 5000, p25Wan: 3000, p75Wan: 8000, monthlyOpsEstimateWan: 700, source: "소중함·구지닷 미용실 (소자본 2,000~6,000 / 중형 6,000~1억)", yearReported: 2024, noteKo: "1인 동네샵~중형. 샴푸대·미용의자·파마기 장비비 큼." },
  "nail-studio": { avgWan: 4000, medianWan: 3500, p25Wan: 1500, p75Wan: 6000, monthlyOpsEstimateWan: 400, source: "비용백과·구지닷 네일샵 (독립 500~700 최소 / 15평 4,000~7,000)", yearReported: 2024, noteKo: "공유작업실 제외 독립 점포 기준, 소자본 진입 용이." },
  "skin-care-room": { avgWan: 4000, medianWan: 3500, p25Wan: 2000, p75Wan: 6000, monthlyOpsEstimateWan: 450, source: "아주디·큐플레이스 에스테틱 + 1인샵 실사례 2,000", yearReported: 2024, isEstimate: true, noteKo: "1인 에스테틱~중형, 대형 스파 제외. 관리기기 유무로 편차." },
  "waxing-studio": { avgWan: 2800, medianWan: 2500, p25Wan: 1500, p75Wan: 4000, monthlyOpsEstimateWan: 350, source: "큐플레이스·2quater 1인 왁싱샵 (10~15평 2,000~3,000)", yearReported: 2024, noteKo: "장비 의존도 낮아 미용 중 최저 초기비용, 1인샵 위주." },
  "eyelash-brow": { avgWan: 4000, medianWan: 3500, p25Wan: 2000, p75Wan: 6000, monthlyOpsEstimateWan: 400, source: "Shopify 속눈썹샵 가이드 (서울 소규모 3,000~7,000)", yearReported: 2024, isEstimate: true, noteKo: "속눈썹 연장·반영구 결합 소규모샵, 전동베드·LED 포함." },
  "makeup-bridal": { avgWan: 4500, medianWan: 4000, p25Wan: 2500, p75Wan: 6500, monthlyOpsEstimateWan: 450, source: "큐플레이스 메이크업샵 + 미용 소규모샵 구조 차용", yearReported: 2024, isEstimate: true, noteKo: "전용 통계 부재로 미용 소규모샵 구조 차용. 거울·조명·화장대 포함." },
  // ── FITNESS ──
  "pilates-studio": { avgWan: 11000, medianWan: 10000, p25Wan: 7000, p75Wan: 15000, monthlyOpsEstimateWan: 600, source: "qplace·gongysd 필라테스 (리포머 4대 25평)", yearReported: 2024, noteKo: "리포머·기구·인테리어가 비용 핵심. 총액 약 1.1억." },
  "pt-gym": { avgWan: 13000, medianWan: 11000, p25Wan: 7000, p75Wan: 20000, monthlyOpsEstimateWan: 700, source: "ssjum·piehealthcare PT샵 + qplace (5천만~2억)", yearReported: 2025, noteKo: "규모·신품/중고 비율로 편차 큼. 중소형 PT는 1억 안팎." },
  "yoga-studio": { avgWan: 8500, medianWan: 7500, p25Wan: 5000, p75Wan: 12000, monthlyOpsEstimateWan: 500, source: "fiflfifl 요가 + qplace (소규모 50㎡)", yearReported: 2024, noteKo: "리포머 불필요로 필라테스보다 장비비 적어 총액 낮음." },
  "crossfit-box": { avgWan: 12000, medianWan: 11000, p25Wan: 8000, p75Wan: 16000, monthlyOpsEstimateWan: 700, source: "fiflfifl 크로스핏 + qplace", yearReported: 2024, isEstimate: true, noteKo: "고천장 대형 + 풀세트 장비로 PT 헬스장 유사~상회. 추정." },
  "golf-studio": { avgWan: 25000, medianWan: 22000, p25Wan: 12000, p75Wan: 35000, monthlyOpsEstimateWan: 1500, source: "goojic 스크린골프 · 골프존 (기기 대당 약 6,000)", yearReported: 2025, noteKo: "타석 장비비가 대부분, 타석 수가 총액 좌우. 대형 투자." },
  "unmanned-fitness": { avgWan: 7000, medianWan: 6000, p25Wan: 4000, p75Wan: 10000, monthlyOpsEstimateWan: 300, source: "secondsalary·godo 무인창업 (3천만대 시작)", yearReported: 2025, isEstimate: true, noteKo: "1인 무인 운영으로 인건비 낮음. 출입시스템+머신 중심. 추정." },
  // ── EDUCATION ──
  "study-room": { avgWan: 8000, medianWan: 7000, p25Wan: 4000, p75Wan: 12000, monthlyOpsEstimateWan: 500, source: "mystudycafe·keyzard 스터디카페 (30석)", yearReported: 2024, noteKo: "평수·좌석수가 핵심. 50평급은 인테리어만 1억 넘김." },
  "kids-academy": { avgWan: 6000, medianWan: 5000, p25Wan: 3500, p75Wan: 9000, monthlyOpsEstimateWan: 450, source: "srmommy·qplace 학원 (20~30평)", yearReported: 2024, noteKo: "보증금+인테리어 중심. 아동 학원은 안전시설로 가산." },
  "adult-class": { avgWan: 4000, medianWan: 3500, p25Wan: 2000, p75Wan: 6000, monthlyOpsEstimateWan: 350, source: "packative 공방 + qplace", yearReported: 2024, isEstimate: true, noteKo: "취미·자격 클래스(공방형)는 소형·저보증금. 종목별 장비비 편차 커 추정." },
  "language-academy": { avgWan: 7000, medianWan: 6000, p25Wan: 4000, p75Wan: 11000, monthlyOpsEstimateWan: 500, source: "youngbeecenter·srmommy 영어학원 (20~30평)", yearReported: 2024, noteKo: "독립은 가맹비 제외 보증금+인테리어+설비 중심. 강의실 수가 총액 좌우." },
  "coding-class": { avgWan: 8000, medianWan: 7000, p25Wan: 5000, p75Wan: 11000, monthlyOpsEstimateWan: 450, source: "buza.biz 1인 코딩학원 (30평 약 8천)", yearReported: 2024, noteKo: "PC·3D프린터·로봇 등 IT 장비비가 일반 학원보다 큼." },
  "small-study-room": { avgWan: 800, medianWan: 500, p25Wan: 200, p75Wan: 1200, monthlyOpsEstimateWan: 50, source: "prefarmers·localnaeil 가정형 공부방", yearReported: 2024, isEstimate: true, noteKo: "자택(가정형) 운영이라 임대·보증금 거의 없음. 책걸상·교구가 초기비 전부. 추정." },
  // ── PET ──
  "pet-grooming": { avgWan: 5500, medianWan: 5000, p25Wan: 3500, p75Wan: 7000, monthlyOpsEstimateWan: 350, source: "큐플레이스·ssjum 애견미용실", yearReported: 2024, noteKo: "10평 미만 보증금 2천 + 인테리어/장비 3~5천. 중고장비 시 하향." },
  "pet-supplies": { avgWan: 6500, medianWan: 6000, p25Wan: 4000, p75Wan: 9500, monthlyOpsEstimateWan: 400, source: "부자비즈·마이프차 펫샵 (30평)", yearReported: 2024, noteKo: "독립점 30평, 초기 재고매입 포함. 무인 소형은 4천 내외." },
  "pet-hotel": { avgWan: 7000, medianWan: 6500, p25Wan: 5000, p75Wan: 9000, monthlyOpsEstimateWan: 450, source: "마이프차 르하임애견호텔 + 유치원·호텔 가이드 (20~30평)", yearReported: 2024, isEstimate: true, noteKo: "동물위탁관리업 시설기준 인테리어·케이지가 비용 핵심. 추정." },
  "pet-cafe": { avgWan: 15000, medianWan: 13000, p25Wan: 10000, p75Wan: 20000, monthlyOpsEstimateWan: 700, source: "굿직·오피스꿀팁 애견카페 (1.5~2.5억)", yearReported: 2024, noteKo: "식음+놀이공간으로 넓은 평수·보증금 커 펫 업종 최고가." },
  "pet-training-school": { avgWan: 6000, medianWan: 5500, p25Wan: 3000, p75Wan: 9000, monthlyOpsEstimateWan: 400, source: "다모이·이삭애견훈련소 + 숨고 시세", yearReported: 2024, isEstimate: true, noteKo: "교외 저가 부지+훈련장·켄넬. 입지·규모 편차 커 추정." },
  "pet-walking-visit": { avgWan: 300, medianWan: 200, p25Wan: 100, p75Wan: 500, monthlyOpsEstimateWan: 50, source: "와요·서울시50플러스 펫시터 (무점포)", yearReported: 2024, isEstimate: true, noteKo: "무점포—보증금/인테리어 0. 자격교육·보험·마케팅·이동비만. 추정." },
  // ── LIVING ──
  "laundry-service": { avgWan: 4500, medianWan: 4000, p25Wan: 2500, p75Wan: 6000, monthlyOpsEstimateWan: 350, source: "easylaw 세탁소 + 크린토피아 비용분석", yearReported: 2024, isEstimate: true, noteKo: "유인 일반세탁(취급소형)은 무인보다 설비 적음. 추정." },
  "cleaning-service": { avgWan: 800, medianWan: 700, p25Wan: 500, p75Wan: 1200, monthlyOpsEstimateWan: 200, source: "비즈바이킹·청소의광장 청소업체 (장비 500~1,000, 무점포)", yearReported: 2024, noteKo: "무점포 자택사업자—장비·세제·차량·교육비 중심, 보증금 거의 0." },
  "repair-service": { avgWan: 2500, medianWan: 2000, p25Wan: 1200, p75Wan: 3500, monthlyOpsEstimateWan: 250, source: "의류수선리폼협회 + 중고미싱 시세", yearReported: 2024, isEstimate: true, noteKo: "소형 점포 보증금+공업용미싱 수대. 협회 통계 기반 추정." },
  "self-laundry": { avgWan: 11000, medianWan: 10000, p25Wan: 7000, p75Wan: 15000, monthlyOpsEstimateWan: 300, source: "모두코리아·imbeyonder 무인빨래방 + moneycat", yearReported: 2024, noteKo: "세탁·건조기 6+6 표준형 15평. 장비가 창업비 60% 이상." },
  "print-copy": { avgWan: 4000, medianWan: 3500, p25Wan: 2000, p75Wan: 6000, monthlyOpsEstimateWan: 300, source: "passionatewebsite 인쇄소 (디지털인쇄·후가공)", yearReported: 2024, isEstimate: true, noteKo: "동네 복사/출력 소형. 디지털인쇄·복합기 중심, 오프셋 제외. 추정." },
  "device-repair": { avgWan: 2500, medianWan: 2000, p25Wan: 1200, p75Wan: 3500, monthlyOpsEstimateWan: 250, source: "에이엠스쿨·천직 폰수리 + 점포라인 시세", yearReported: 2024, isEstimate: true, noteKo: "소형 점포·수리장비·부품재고 중심 소자본. 추정." },
  // ── SPACE ──
  "guesthouse": { avgWan: 15000, medianWan: 12000, p25Wan: 8000, p75Wan: 20000, monthlyOpsEstimateWan: 500, source: "smartbloggerthree·tax25 게스트하우스 가이드", yearReported: 2024, isEstimate: true, noteKo: "중소형 1~3억, 보증금+인테리어 비중 큼. 핫플은 보증금만 2억+." },
  "rental-studio": { avgWan: 5000, medianWan: 4500, p25Wan: 3000, p75Wan: 7000, monthlyOpsEstimateWan: 250, source: "qplace·jyedream·hourplace 공간대여", yearReported: 2024, isEstimate: true, noteKo: "보증금+호리존·방음+촬영장비. 무인 렌탈형은 3천대도 가능." },
  "party-room": { avgWan: 3500, medianWan: 3000, p25Wan: 2000, p75Wan: 5000, monthlyOpsEstimateWan: 250, source: "마이프차 파티룸 매거진 (3천만) · qplace", yearReported: 2024, noteKo: "보증금 제외 현실비 2~5천. 인테리어·가구·AV장비 중심." },
  "study-cafe-space": { avgWan: 18000, medianWan: 16000, p25Wan: 12000, p75Wan: 25000, monthlyOpsEstimateWan: 400, source: "policyhelpers·secondsalary 스터디카페", yearReported: 2024, noteKo: "점포 제외 1억 중후반, 임차 포함 2~3.5억. 무인시스템만 2~4천." },
  "shared-office": { avgWan: 12000, medianWan: 10000, p25Wan: 5000, p75Wan: 16700, monthlyOpsEstimateWan: 500, source: "마이프차 드림캐쳐스 정보공개서 (1억6,730만)", yearReported: 2024, noteKo: "전체 5천만~2억. 보증금·임대·구획 인테리어 중심." },
  "practice-room": { avgWan: 5000, medianWan: 4500, p25Wan: 3000, p75Wan: 7000, monthlyOpsEstimateWan: 200, source: "studionol·glorypine 연습실", yearReported: 2024, isEstimate: true, noteKo: "방음시공이 최대 비중(실당 1,500~1,800). 보증금+3~5실 방음+악기. 추정." },
  // ── ONLINE ──
  "smart-store": { avgWan: 500, medianWan: 400, p25Wan: 200, p75Wan: 800, monthlyOpsEstimateWan: 50, source: "KB의생각·TILNOTE·tosspayments 스마트스토어", yearReported: 2024, isEstimate: true, noteKo: "플랫폼 무료. 사입형은 초기 재고+상세페이지+마케팅 100만원 현금." },
  "digital-products": { avgWan: 30, medianWan: 20, p25Wan: 5, p75Wan: 50, monthlyOpsEstimateWan: 5, source: "ebook4989·apure·imweb 지식창업", yearReported: 2024, isEstimate: true, noteKo: "재고·물류 없음. 도구비+광고 수준. 사실상 무자본, 시간투입형." },
  "creator-service": { avgWan: 100, medianWan: 80, p25Wan: 50, p75Wan: 200, monthlyOpsEstimateWan: 20, source: "cyberlink·a-ha 유튜버 초기비용", yearReported: 2024, isEstimate: true, noteKo: "최소 50~100만(스마트폰+무료편집), 고급 장비 200만+." },
  "consignment-commerce": { avgWan: 50, medianWan: 30, p25Wan: 10, p75Wan: 100, monthlyOpsEstimateWan: 10, source: "windly·tosspayments 위탁판매", yearReported: 2024, isEstimate: true, noteKo: "재고·물류 없음(도매매/오너클랜). 면허세+소싱툴, 무자본 근접." },
  "newsletter-membership": { avgWan: 20, medianWan: 10, p25Wan: 0, p75Wan: 50, monthlyOpsEstimateWan: 5, source: "스티비 유료 뉴스레터 (무료 500명/월 2회)", yearReported: 2024, isEstimate: true, noteKo: "초기 무자본. 구독자 500명까지 무료, 결제 수수료 3.2%." },
  "global-buying": { avgWan: 50, medianWan: 40, p25Wan: 10, p75Wan: 100, monthlyOpsEstimateWan: 10, source: "windly·국세청 해외직구대행 (업종 525105)", yearReported: 2024, isEstimate: true, noteKo: "주문 후 구매라 무재고. 면허세+주문수집 프로그램. 40~100만." },
};

/** specialty 가 있으면 세부 업종 벤치마크, 없으면 cluster 벤치마크. */
export function resolveBudgetBenchmark(
  cluster: ClusterId,
  specialtyId?: string,
): ClusterBudgetBenchmark {
  if (specialtyId && SPECIALTY_BUDGET_BENCHMARKS[specialtyId]) {
    return SPECIALTY_BUDGET_BENCHMARKS[specialtyId];
  }
  return CLUSTER_BUDGET_BENCHMARKS[cluster];
}

// MARK: - 인사이트 계산

export type BudgetInsightTone = "shortage" | "near-average" | "surplus" | "no-input";

export interface BudgetInsight {
  tone: BudgetInsightTone;
  /** 사용자 입력 (만원). 0 이면 미입력. */
  userWan: number;
  /** 업종 평균 (만원) */
  avgWan: number;
  /** delta = userWan - avgWan (음수면 부족) */
  deltaWan: number;
  /** delta 의 절대값을 (월 운영비 기준) 개월수로 환산 */
  deltaMonths: number;
  /** 사람이 읽는 한 줄 요약 (verdict 가 아니라 descriptive) */
  headlineKo: string;
  /** 부연 설명 */
  subtitleKo: string;
  /** 매칭 프로그램 추천 사유 */
  programIntroKo: string;
  /** 원본 벤치마크 */
  benchmark: ClusterBudgetBenchmark;
}

/**
 * 사용자 입력 자본금과 cluster 평균을 비교해 인사이트를 생성한다.
 * @param cluster — 사용자의 cluster
 * @param userBudgetWon — 사용자가 입력한 시작 자본금 (원 단위, 0 이면 미입력)
 * @param monthlyEstimateWan — 선택적 override. 미지정 시 benchmark.monthlyOpsEstimateWan 사용.
 * @param franchiseRecommendedWon — 선택. 프랜차이즈 권장 창업 비용 (원 단위). 제공되면 *그 권장값* 과
 *   비교한 결과가 1차 baseline 이 됨. 사용자가 시스템이 알려준 권장값 그대로 입력했으면 "이 브랜드에
 *   적합한 자본금" 으로 표시 (업종 평균과의 모순 메시지 회피).
 */
export function computeBudgetInsight(
  cluster: ClusterId,
  userBudgetWon: number,
  monthlyEstimateWan?: number,
  franchiseRecommendedWon?: number,
  specialtyId?: string,
): BudgetInsight {
  // specialty 가 있으면 *세부 업종 평균* 우선(예: 편의점), 없으면 cluster 평균(예: 소매) 폴백.
  const benchmark = resolveBudgetBenchmark(cluster, specialtyId);
  const userWan = Math.round(userBudgetWon / 10_000);
  const deltaWan = userWan - benchmark.avgWan;
  const monthlyEst = monthlyEstimateWan ?? benchmark.monthlyOpsEstimateWan;
  const deltaMonths = monthlyEst > 0 ? Math.abs(deltaWan) / monthlyEst : 0;

  // ⚠️ 2026-05-18: 프랜차이즈 권장값 매칭 — 사장님이 시스템이 알려준 프랜차이즈 권장값으로 자본금
  //   설정한 케이스. 업종 평균과의 모순 ("권장 7,000만원으로 설정" → "업종 평균보다 3,436만 부족")
  //   을 차단하고 "이 브랜드에는 적합" + "업종 평균과의 차이는 부가 정보" 톤으로 변경.
  if (franchiseRecommendedWon && franchiseRecommendedWon > 0 && userBudgetWon > 0) {
    const franchiseWan = Math.round(franchiseRecommendedWon / 10_000);
    const franchiseRatio = userBudgetWon / franchiseRecommendedWon;
    const franchiseDelta = userWan - franchiseWan;
    // ±10% 이내면 권장값에 적합한 것으로 판정
    if (franchiseRatio >= 0.9 && franchiseRatio <= 1.1) {
      return {
        tone: "near-average",
        userWan,
        avgWan: benchmark.avgWan,
        deltaWan,
        deltaMonths,
        headlineKo: "이 프랜차이즈에 적합한 자본금이에요",
        subtitleKo:
          `프랜차이즈 권장 ${franchiseWan.toLocaleString()}만원과 ${
            franchiseDelta === 0 ? "동일" : `${franchiseDelta > 0 ? "+" : ""}${franchiseDelta.toLocaleString()}만원 차이`
          } · 같은 업종 평균은 ${benchmark.avgWan.toLocaleString()}만원 (참고)`,
        programIntroKo: "이 프랜차이즈와 함께 받을 수 있는 추가 지원이에요",
        benchmark,
      };
    }
    // 권장값보다 명백히 적으면 (90% 미만) — 그래도 *업종 평균* 단정 메시지는 피하고 *프랜차이즈 권장* 기준
    if (franchiseRatio < 0.9) {
      return {
        tone: "shortage",
        userWan,
        avgWan: benchmark.avgWan,
        deltaWan,
        deltaMonths,
        headlineKo: `이 프랜차이즈 권장 ${franchiseWan.toLocaleString()}만원보다 ${Math.abs(franchiseDelta).toLocaleString()}만원 적습니다`,
        subtitleKo: `같은 업종 평균은 ${benchmark.avgWan.toLocaleString()}만원 (참고)`,
        programIntroKo: "이 차이를 보완할 수 있는 지원 프로그램이에요",
        benchmark,
      };
    }
    // 권장값보다 명백히 많으면 (110% 초과)
    return {
      tone: "surplus",
      userWan,
      avgWan: benchmark.avgWan,
      deltaWan,
      deltaMonths,
      headlineKo: `이 프랜차이즈 권장 ${franchiseWan.toLocaleString()}만원보다 ${franchiseDelta.toLocaleString()}만원 여유 있어요`,
      subtitleKo: `초기 운영자금에 활용 가능 · 같은 업종 평균 ${benchmark.avgWan.toLocaleString()}만원 (참고)`,
      programIntroKo: "이 단계에서 활용해보면 좋은 보너스 프로그램이에요",
      benchmark,
    };
  }

  if (userWan <= 0) {
    return {
      tone: "no-input",
      userWan: 0,
      avgWan: benchmark.avgWan,
      deltaWan: 0,
      deltaMonths: 0,
      headlineKo: `같은 업종 평균 ${benchmark.avgWan.toLocaleString()}만원`,
      subtitleKo: `25~75 분위는 ${benchmark.p25Wan.toLocaleString()}~${benchmark.p75Wan.toLocaleString()}만원입니다`,
      programIntroKo: "자본금을 입력하면 맞춤 프로그램을 보여드려요",
      benchmark,
    };
  }

  // ±15% 안쪽이면 near-average
  const ratio = userWan / benchmark.avgWan;
  if (ratio >= 0.85 && ratio <= 1.15) {
    return {
      tone: "near-average",
      userWan,
      avgWan: benchmark.avgWan,
      deltaWan,
      deltaMonths,
      headlineKo: `업종 평균과 거의 같은 수준이에요`,
      subtitleKo: `같은 업종 평균 ${benchmark.avgWan.toLocaleString()}만원과 ${deltaWan >= 0 ? "+" : ""}${deltaWan.toLocaleString()}만원 차이`,
      programIntroKo: "이 단계에서 받을 수 있는 추가 지원 프로그램이에요",
      benchmark,
    };
  }

  if (ratio < 0.85) {
    return {
      tone: "shortage",
      userWan,
      avgWan: benchmark.avgWan,
      deltaWan,
      deltaMonths,
      headlineKo: `업종 평균보다 ${Math.abs(deltaWan).toLocaleString()}만원 적습니다`,
      subtitleKo: deltaMonths >= 1
        ? `운영자금 약 ${deltaMonths.toFixed(1)}개월치 분량입니다`
        : `같은 업종 평균 ${benchmark.avgWan.toLocaleString()}만원 기준`,
      programIntroKo: "이 차이를 보완할 수 있는 지원 프로그램이에요",
      benchmark,
    };
  }

  return {
    tone: "surplus",
    userWan,
    avgWan: benchmark.avgWan,
    deltaWan,
    deltaMonths,
    headlineKo: `업종 평균보다 ${deltaWan.toLocaleString()}만원 여유 있어요`,
    subtitleKo: `25~75 분위 ${benchmark.p25Wan.toLocaleString()}~${benchmark.p75Wan.toLocaleString()}만원 기준 상위권`,
    programIntroKo: "이 단계에서 활용해보면 좋은 보너스 프로그램이에요",
    benchmark,
  };
}
