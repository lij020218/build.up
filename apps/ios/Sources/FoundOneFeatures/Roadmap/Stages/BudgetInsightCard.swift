//
//  BudgetInsightCard.swift — 예산 인사이트 + 매칭 지원 프로그램 카드 (iOS)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/BudgetInsightCard.tsx
//
//  cluster 별 평균 창업 자본과 사용자 입력을 비교해 표시한다.
//  verdict("부족") 가 아니라 descriptive("평균보다 X만원 적어요") + always-action
//  (매칭 지원 프로그램 제시).
//
//  데이터:
//   - ClusterBudgetBenchmark: cluster-budget-benchmarks.ts 의 iOS 미러
//   - SupportProgram: 자주 활용되는 5-7 핵심 프로그램의 hardcoded snapshot
//
//  디자인:
//   - 미드나잇 네이비 한 톤 (신호등 컬러 금지 — 메모리 design tokens)
//   - 여백 + 타이포 중심
//   - Apple-style 미니멀
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents

// MARK: - 데이터 모델

public struct ClusterBudgetBenchmark: Sendable {
    public let avgWan: Int
    public let medianWan: Int
    public let p25Wan: Int
    public let p75Wan: Int
    public let source: String
    public let yearReported: Int
    public let isEstimate: Bool
    public let monthlyOpsEstimateWan: Int   // 운영자금 환산용
    public let noteKo: String               // 자료 한계·범위 안내
}

public struct SupportProgram: Identifiable, Sendable {
    public let id: String
    public let category: String        // "government" | "private" | "local"
    public let nameKo: String
    public let organizerKo: String
    public let benefitKo: String
    public let amountKo: String
    public let targetKo: String
    public let url: String
    /// 추천 적용 cluster 목록 (빈 배열이면 전체에 적용)
    public let clusters: [String]
}

// MARK: - 벤치마크 데이터 (cluster.rawValue 키)

// 실제 자료 기반 — packages/shared/src/cluster-budget-benchmarks.ts 와 동일.
// iOS 의 BusinessCluster 8개에 맞춰 web 의 14 cluster 중 매칭하는 값 사용.
private let clusterBenchmarks: [String: ClusterBudgetBenchmark] = [
    "offline-food": ClusterBudgetBenchmark(
        avgWan: 10436, medianWan: 9000, p25Wan: 5000, p75Wan: 15000,
        source: "농식품부·한식진흥원 한식산업 실태조사 (1,500점 표본)",
        yearReported: 2022, isEstimate: false, monthlyOpsEstimateWan: 1500,
        noteKo: "임대료·인건비·식자재 등 매월 1,200~1,700만원 소요. 가맹점은 평균보다 30~50% 상회 가능."
    ),
    "online-digital": ClusterBudgetBenchmark(
        avgWan: 1500, medianWan: 1000, p25Wan: 300, p75Wan: 3000,
        source: "카페24·토스페이먼츠·아이보스 셀러 가이드 종합",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 250,
        noteKo: "위탁판매 500만원 미만 가능 / 자체 사입+자체몰 3,000만원+. 플랫폼 수수료 3.74~10.8%."
    ),
    "startup-tech": ClusterBudgetBenchmark(
        avgWan: 5000, medianWan: 3000, p25Wan: 1500, p75Wan: 8000,
        source: "중기부 창업기업 실태조사 (소프트웨어 부트스트랩 단계)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 2000,
        noteKo: "부트스트랩 평균. 시드 라운드 받은 경우 평균 17.3억 (TheVC 2025). 3인 팀 월 burn 2,000~2,800만원."
    ),
    "hardware-iot": ClusterBudgetBenchmark(
        avgWan: 15000, medianWan: 10000, p25Wan: 5000, p75Wan: 30000,
        source: "와디즈 펀딩 사례 + 중기부 TIPS 하드웨어 지원 평균",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 2000,
        noteKo: "EVT 500~3,000만 / DVT 3,000~10,000만 / PVT 10,000~30,000만 / 금형 3,000~10,000만 / KC인증 200~800만."
    ),
    "robotics-physical-ai": ClusterBudgetBenchmark(
        avgWan: 100000, medianWan: 80000, p25Wan: 30000, p75Wan: 200000,
        source: "바이오타임즈 K-의료기기 2024 평균 라운드 + TIPS 딥테크 매칭 18~30억",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 6000,
        noteKo: "5인 R&D 팀 월 burn 5,000~9,000만 / TIPS 딥테크 트랙 최대 15억 + 후속 30억."
    ),
    "biotech-medtech": ClusterBudgetBenchmark(
        avgWan: 100000, medianWan: 80000, p25Wan: 30000, p75Wan: 200000,
        source: "바이오타임즈 K-의료기기 2024 평균 라운드 + 식약처 임상 데이터",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 6000,
        noteKo: "의료기기 임상 1건 평균 1.1억 (식약처) / 신약 임상2상 평균 119억 / TIPS 딥테크 최대 15억."
    ),
    "semiconductor": ClusterBudgetBenchmark(
        avgWan: 500000, medianWan: 300000, p25Wan: 100000, p75Wan: 1000000,
        source: "스타트업레시피·와우테일 팹리스 시드~시리즈A 실제 라운드 (2024-2025)",
        yearReported: 2025, isEstimate: true, monthlyOpsEstimateWan: 15000,
        noteKo: "팹리스 시드 10~50억 / 시리즈A 100~900억 (보스반도체 870억 등) / MPW 28nm 0.7~3.5억 / EDA 연 수억~수십억."
    ),
    "climate-energy": ClusterBudgetBenchmark(
        avgWan: 500000, medianWan: 300000, p25Wan: 100000, p75Wan: 1000000,
        source: "스타트업레시피 클린테크·에너지 실제 라운드 + 산업부 R&D",
        yearReported: 2025, isEstimate: true, monthlyOpsEstimateWan: 15000,
        noteKo: "파일럿 플랜트 수십억~수백억 / 배터리·수소 분야 대형 라운드 多 / 정부·전략적 투자자 매칭 필수."
    ),
]

// MARK: - 지원 프로그램 데이터 (핵심만 hardcoded)

private let supportPrograms: [SupportProgram] = [
    SupportProgram(
        id: "youth-startup-fund",
        category: "government",
        nameKo: "청년전용 창업자금",
        organizerKo: "중소벤처기업진흥공단",
        benefitKo: "저금리 융자 (연 2.5% 고정금리)",
        amountKo: "최대 1억원 (제조업 2억)",
        targetKo: "만 39세 이하, 업력 3년 미만",
        url: "https://start.kosmes.or.kr",
        clusters: []   // 전체 적용
    ),
    SupportProgram(
        id: "semas-direct-loan",
        category: "government",
        nameKo: "소상공인 정책자금",
        organizerKo: "소상공인시장진흥공단 (SEMAS)",
        benefitKo: "직접 대출, 연 2.96% (비수도권 -0.2%p)",
        amountKo: "최대 5천만원",
        targetKo: "소상공인 (직원 5인 미만)",
        url: "https://ols.semas.or.kr",
        clusters: ["offline-food", "online-digital"]
    ),
    SupportProgram(
        id: "kodit-guarantee",
        category: "government",
        nameKo: "신용보증기금 보증서 대출",
        organizerKo: "신용보증기금 (KODIT)",
        benefitKo: "보증서 발급 → 시중은행 정책금리 적용",
        amountKo: "5천만~2억원",
        targetKo: "신용 부족한 소상공인",
        url: "https://www.kodit.co.kr",
        clusters: ["offline-food", "online-digital"]
    ),
    SupportProgram(
        id: "tips-recommend",
        category: "government",
        nameKo: "TIPS 프로그램",
        organizerKo: "중소벤처기업부",
        benefitKo: "민간투자 연계 + 최대 5억 R&D 지원",
        amountKo: "최대 5억원",
        targetKo: "기술 스타트업, 추천기관 통해 신청",
        url: "https://www.jointips.or.kr",
        clusters: ["startup-tech", "hardware-iot", "robotics-physical-ai", "biotech-medtech", "semiconductor", "climate-energy"]
    ),
    SupportProgram(
        id: "kosme-youth-academy",
        category: "government",
        nameKo: "청년창업사관학교",
        organizerKo: "중소벤처기업진흥공단",
        benefitKo: "공간·자금·멘토링 일괄 지원",
        amountKo: "최대 1억원 + R&D 포함",
        targetKo: "만 39세 이하, 연 1000명 선정",
        url: "https://start.kosmes.or.kr",
        clusters: []   // 전체 적용
    ),
    SupportProgram(
        id: "k-startup-package",
        category: "government",
        nameKo: "K-스타트업 창업패키지",
        organizerKo: "창업진흥원",
        benefitKo: "사업화 자금 지원",
        amountKo: "최대 1억원",
        targetKo: "3년 미만 법인",
        url: "https://www.k-startup.go.kr",
        clusters: ["startup-tech", "hardware-iot"]
    ),
    SupportProgram(
        id: "industry-rd",
        category: "government",
        nameKo: "산업부 R&D 과제",
        organizerKo: "산업통상자원부",
        benefitKo: "딥테크 R&D 비용 지원",
        amountKo: "수억~수십억",
        targetKo: "딥테크·반도체·클린테크 스타트업",
        url: "https://www.motie.go.kr",
        clusters: ["robotics-physical-ai", "biotech-medtech", "semiconductor", "climate-energy"]
    ),
]

private func matchPrograms(for clusterKey: String, limit: Int = 4) -> [SupportProgram] {
    supportPrograms.filter { p in
        p.clusters.isEmpty || p.clusters.contains(clusterKey)
    }.prefix(limit).map { $0 }
}

// MARK: - 인사이트 계산

private enum BudgetTone {
    case noInput, shortage, nearAverage, surplus
}

private struct BudgetInsight {
    let tone: BudgetTone
    let userWan: Int
    let avgWan: Int
    let deltaWan: Int           // user - avg (음수면 부족)
    let deltaMonths: Double     // |delta| / monthlyOpsEstimateWan
    let headlineKo: String
    let subtitleKo: String
    let programIntroKo: String
    let benchmark: ClusterBudgetBenchmark
}

// MARK: - 세부 업종(specialty) 벤치마크 (web SPECIALTY_BUDGET_BENCHMARKS 코드젠 미러)
//   cluster 평균은 범위가 넓어 혼동(편의점≠소매 전체). specialty 있으면 그 평균 우선, 없으면 cluster 폴백.
private let specialtyBenchmarks: [String: ClusterBudgetBenchmark] = [
    "korean-casual": ClusterBudgetBenchmark(
        avgWan: 9500, medianWan: 8800, p25Wan: 6000, p75Wan: 12000,
        source: "식저널 한식 1억436만 · 핀다 서울 외식 7,681만",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 950,
        noteKo: "권리금 포함 시 1억 초과. 보증금·평수 따라 편차 큼."),
    "delivery-meals": ClusterBudgetBenchmark(
        avgWan: 2500, medianWan: 2000, p25Wan: 1000, p75Wan: 4500,
        source: "요기요파트너·머니캣 공유주방 1~2천만 / 개인배달 ~8천만",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 350,
        noteKo: "공유주방 입점 최저, 독립 점포 배달은 4~8천만으로 급증."),
    "salad-healthy": ClusterBudgetBenchmark(
        avgWan: 7000, medianWan: 6500, p25Wan: 4000, p75Wan: 9000,
        source: "버즈비즈·뷰리드 샐러드(샐러드박스 5,100·샐러디 8,400)+보증금",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 700,
        noteKo: "조리 간단·소형 위주. 정보공개서값은 보증금 제외라 +2~3천 가산."),
    "ramen-noodle": ClusterBudgetBenchmark(
        avgWan: 8500, medianWan: 8000, p25Wan: 4000, p75Wan: 11000,
        source: "버즈비즈 멘지 8,900 · 핀다 국물요리 9,209",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 850,
        noteKo: "주방 화구·덕트 부담 큼. 극소형은 4천대도 가능."),
    "chicken-burger": ClusterBudgetBenchmark(
        avgWan: 7500, medianWan: 6000, p25Wan: 4000, p75Wan: 13000,
        source: "핀다 치킨·닭강정 4,325 / 버거 1억5,713 · 공정위 치킨 9,394",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 700,
        noteKo: "치킨은 저비용, 버거(매장형)는 1억+로 편차 매우 큼."),
    "western-pasta-brunch": ClusterBudgetBenchmark(
        avgWan: 9500, medianWan: 9000, p25Wan: 6000, p75Wan: 14000,
        source: "큐플레이스·소중함 인테리어 5~7천 + 오픈주방·홀 투자",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 950,
        noteKo: "오픈주방·고급마감·넓은 홀로 인테리어 비중 높음."),
    "takeout-coffee": ClusterBudgetBenchmark(
        avgWan: 6500, medianWan: 6500, p25Wan: 4000, p75Wan: 9000,
        source: "메가커피 7,424 · 컴포즈 6,708 (10평, 보증금 별도)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 500,
        noteKo: "10평 소형. 공시값은 보증금·권리금 제외, 전기증설로 +2~4천."),
    "specialty-coffee": ClusterBudgetBenchmark(
        avgWan: 11000, medianWan: 10000, p25Wan: 7000, p75Wan: 15000,
        source: "사이더랩·퍼펙트커피 개인카페 8천~1.2억 + 로스터기",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 900,
        noteKo: "넓은 평수·고급 머신·자가로스팅 시 1억 초과."),
    "dessert-cafe": ClusterBudgetBenchmark(
        avgWan: 7500, medianWan: 7000, p25Wan: 5000, p75Wan: 10000,
        source: "지식채널·큐플레이스 카페 15평 5천~ / 주방기기 2~4천",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 700,
        noteKo: "쇼케이스·디저트 주방 추가로 일반 커피점보다 높음."),
    "bakery-studio": ClusterBudgetBenchmark(
        avgWan: 11000, medianWan: 10000, p25Wan: 6000, p75Wan: 16000,
        source: "소중함·한성쇼케이스 5천~1.5억",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 900,
        noteKo: "오븐·발효기·반죽기 등 제과 설비비 큼. 카페형은 2억+."),
    "icecream-bingsu": ClusterBudgetBenchmark(
        avgWan: 6000, medianWan: 5500, p25Wan: 3500, p75Wan: 8500,
        source: "카페창업 표준 15평 5천 + 빙수기·쇼케이스 가산",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 550,
        noteKo: "계절성 강함. 빙수기·제빙·냉동 쇼케이스가 설비 핵심."),
    "self-serve-cafe": ClusterBudgetBenchmark(
        avgWan: 4000, medianWan: 3600, p25Wan: 2500, p75Wan: 6000,
        source: "스토랑트·myfounded 무인카페 평균 3,600 (비트 3,600·나우 6,270)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 250,
        noteKo: "무인이라 인건비·운영비 최저. 머신 구입 시 상단."),
    "convenience-small": ClusterBudgetBenchmark(
        avgWan: 7270, medianWan: 7000, p25Wan: 5500, p75Wan: 9000,
        source: "CU·GS25 정보공개서 (가맹비770+상품준비1,400+보증금5,000+소모품)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 800,
        noteKo: "보증금 5,000만(회수성)이 비용 대부분, 임차료 별도라 상권 변동 큼."),
    "lifestyle-goods": ClusterBudgetBenchmark(
        avgWan: 6000, medianWan: 5500, p25Wan: 3500, p75Wan: 8500,
        source: "큐플레이스·점포라인 잡화점 + 무인문구점 가이드",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 450,
        noteKo: "다이소형 대형 제외, 동네 생활용품·문구잡화 10~20평 기준."),
    "beauty-supplies": ClusterBudgetBenchmark(
        avgWan: 7000, medianWan: 6500, p25Wan: 4500, p75Wan: 9500,
        source: "화장품 로드숍 정보공개서 하향 + 인테리어 평당 198만",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 600,
        noteKo: "올리브영 대형 제외, 독립 화장품·뷰티편집 소규모점 기준."),
    "fashion-accessories": ClusterBudgetBenchmark(
        avgWan: 4500, medianWan: 4000, p25Wan: 2500, p75Wan: 6500,
        source: "큐플레이스 보세 옷가게 · 소중함 소자본 의류(1,000~4,000)",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 500,
        noteKo: "보세·편집 의류, 동대문 사입 초도물품·권리금 포함."),
    "health-food-store": ClusterBudgetBenchmark(
        avgWan: 6000, medianWan: 5500, p25Wan: 3800, p75Wan: 8000,
        source: "소매점 일반 창업비용 가이드 (전용 통계 부재로 차용)",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 600,
        noteKo: "냉장·진열집기 포함. 실데이터 확보 시 교체 권장."),
    "unmanned-retail": ClusterBudgetBenchmark(
        avgWan: 5500, medianWan: 5000, p25Wan: 3500, p75Wan: 8000,
        source: "무인 아이스크림/밀키트 창업가이드 (초기 4,000~7,000)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 250,
        noteKo: "무인 운영이라 월 운영비 낮음, ROI 약 18개월."),
    "hair-salon": ClusterBudgetBenchmark(
        avgWan: 5500, medianWan: 5000, p25Wan: 3000, p75Wan: 8000,
        source: "소중함·구지닷 미용실 (소자본 2,000~6,000 / 중형 6,000~1억)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 700,
        noteKo: "1인 동네샵~중형. 샴푸대·미용의자·파마기 장비비 큼."),
    "nail-studio": ClusterBudgetBenchmark(
        avgWan: 4000, medianWan: 3500, p25Wan: 1500, p75Wan: 6000,
        source: "비용백과·구지닷 네일샵 (독립 500~700 최소 / 15평 4,000~7,000)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 400,
        noteKo: "공유작업실 제외 독립 점포 기준, 소자본 진입 용이."),
    "skin-care-room": ClusterBudgetBenchmark(
        avgWan: 4000, medianWan: 3500, p25Wan: 2000, p75Wan: 6000,
        source: "아주디·큐플레이스 에스테틱 + 1인샵 실사례 2,000",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 450,
        noteKo: "1인 에스테틱~중형, 대형 스파 제외. 관리기기 유무로 편차."),
    "waxing-studio": ClusterBudgetBenchmark(
        avgWan: 2800, medianWan: 2500, p25Wan: 1500, p75Wan: 4000,
        source: "큐플레이스·2quater 1인 왁싱샵 (10~15평 2,000~3,000)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 350,
        noteKo: "장비 의존도 낮아 미용 중 최저 초기비용, 1인샵 위주."),
    "eyelash-brow": ClusterBudgetBenchmark(
        avgWan: 4000, medianWan: 3500, p25Wan: 2000, p75Wan: 6000,
        source: "Shopify 속눈썹샵 가이드 (서울 소규모 3,000~7,000)",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 400,
        noteKo: "속눈썹 연장·반영구 결합 소규모샵, 전동베드·LED 포함."),
    "makeup-bridal": ClusterBudgetBenchmark(
        avgWan: 4500, medianWan: 4000, p25Wan: 2500, p75Wan: 6500,
        source: "큐플레이스 메이크업샵 + 미용 소규모샵 구조 차용",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 450,
        noteKo: "전용 통계 부재로 미용 소규모샵 구조 차용. 거울·조명·화장대 포함."),
    "pilates-studio": ClusterBudgetBenchmark(
        avgWan: 11000, medianWan: 10000, p25Wan: 7000, p75Wan: 15000,
        source: "qplace·gongysd 필라테스 (리포머 4대 25평)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 600,
        noteKo: "리포머·기구·인테리어가 비용 핵심. 총액 약 1.1억."),
    "pt-gym": ClusterBudgetBenchmark(
        avgWan: 13000, medianWan: 11000, p25Wan: 7000, p75Wan: 20000,
        source: "ssjum·piehealthcare PT샵 + qplace (5천만~2억)",
        yearReported: 2025, isEstimate: false, monthlyOpsEstimateWan: 700,
        noteKo: "규모·신품/중고 비율로 편차 큼. 중소형 PT는 1억 안팎."),
    "yoga-studio": ClusterBudgetBenchmark(
        avgWan: 8500, medianWan: 7500, p25Wan: 5000, p75Wan: 12000,
        source: "fiflfifl 요가 + qplace (소규모 50㎡)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 500,
        noteKo: "리포머 불필요로 필라테스보다 장비비 적어 총액 낮음."),
    "crossfit-box": ClusterBudgetBenchmark(
        avgWan: 12000, medianWan: 11000, p25Wan: 8000, p75Wan: 16000,
        source: "fiflfifl 크로스핏 + qplace",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 700,
        noteKo: "고천장 대형 + 풀세트 장비로 PT 헬스장 유사~상회. 추정."),
    "golf-studio": ClusterBudgetBenchmark(
        avgWan: 25000, medianWan: 22000, p25Wan: 12000, p75Wan: 35000,
        source: "goojic 스크린골프 · 골프존 (기기 대당 약 6,000)",
        yearReported: 2025, isEstimate: false, monthlyOpsEstimateWan: 1500,
        noteKo: "타석 장비비가 대부분, 타석 수가 총액 좌우. 대형 투자."),
    "unmanned-fitness": ClusterBudgetBenchmark(
        avgWan: 7000, medianWan: 6000, p25Wan: 4000, p75Wan: 10000,
        source: "secondsalary·godo 무인창업 (3천만대 시작)",
        yearReported: 2025, isEstimate: true, monthlyOpsEstimateWan: 300,
        noteKo: "1인 무인 운영으로 인건비 낮음. 출입시스템+머신 중심. 추정."),
    "study-room": ClusterBudgetBenchmark(
        avgWan: 8000, medianWan: 7000, p25Wan: 4000, p75Wan: 12000,
        source: "mystudycafe·keyzard 스터디카페 (30석)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 500,
        noteKo: "평수·좌석수가 핵심. 50평급은 인테리어만 1억 넘김."),
    "kids-academy": ClusterBudgetBenchmark(
        avgWan: 6000, medianWan: 5000, p25Wan: 3500, p75Wan: 9000,
        source: "srmommy·qplace 학원 (20~30평)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 450,
        noteKo: "보증금+인테리어 중심. 아동 학원은 안전시설로 가산."),
    "adult-class": ClusterBudgetBenchmark(
        avgWan: 4000, medianWan: 3500, p25Wan: 2000, p75Wan: 6000,
        source: "packative 공방 + qplace",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 350,
        noteKo: "취미·자격 클래스(공방형)는 소형·저보증금. 종목별 장비비 편차 커 추정."),
    "language-academy": ClusterBudgetBenchmark(
        avgWan: 7000, medianWan: 6000, p25Wan: 4000, p75Wan: 11000,
        source: "youngbeecenter·srmommy 영어학원 (20~30평)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 500,
        noteKo: "독립은 가맹비 제외 보증금+인테리어+설비 중심. 강의실 수가 총액 좌우."),
    "coding-class": ClusterBudgetBenchmark(
        avgWan: 8000, medianWan: 7000, p25Wan: 5000, p75Wan: 11000,
        source: "buza.biz 1인 코딩학원 (30평 약 8천)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 450,
        noteKo: "PC·3D프린터·로봇 등 IT 장비비가 일반 학원보다 큼."),
    "small-study-room": ClusterBudgetBenchmark(
        avgWan: 800, medianWan: 500, p25Wan: 200, p75Wan: 1200,
        source: "prefarmers·localnaeil 가정형 공부방",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 50,
        noteKo: "자택(가정형) 운영이라 임대·보증금 거의 없음. 책걸상·교구가 초기비 전부. 추정."),
    "pet-grooming": ClusterBudgetBenchmark(
        avgWan: 5500, medianWan: 5000, p25Wan: 3500, p75Wan: 7000,
        source: "큐플레이스·ssjum 애견미용실",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 350,
        noteKo: "10평 미만 보증금 2천 + 인테리어/장비 3~5천. 중고장비 시 하향."),
    "pet-supplies": ClusterBudgetBenchmark(
        avgWan: 6500, medianWan: 6000, p25Wan: 4000, p75Wan: 9500,
        source: "부자비즈·마이프차 펫샵 (30평)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 400,
        noteKo: "독립점 30평, 초기 재고매입 포함. 무인 소형은 4천 내외."),
    "pet-hotel": ClusterBudgetBenchmark(
        avgWan: 7000, medianWan: 6500, p25Wan: 5000, p75Wan: 9000,
        source: "마이프차 르하임애견호텔 + 유치원·호텔 가이드 (20~30평)",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 450,
        noteKo: "동물위탁관리업 시설기준 인테리어·케이지가 비용 핵심. 추정."),
    "pet-cafe": ClusterBudgetBenchmark(
        avgWan: 15000, medianWan: 13000, p25Wan: 10000, p75Wan: 20000,
        source: "굿직·오피스꿀팁 애견카페 (1.5~2.5억)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 700,
        noteKo: "식음+놀이공간으로 넓은 평수·보증금 커 펫 업종 최고가."),
    "pet-training-school": ClusterBudgetBenchmark(
        avgWan: 6000, medianWan: 5500, p25Wan: 3000, p75Wan: 9000,
        source: "다모이·이삭애견훈련소 + 숨고 시세",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 400,
        noteKo: "교외 저가 부지+훈련장·켄넬. 입지·규모 편차 커 추정."),
    "pet-walking-visit": ClusterBudgetBenchmark(
        avgWan: 300, medianWan: 200, p25Wan: 100, p75Wan: 500,
        source: "와요·서울시50플러스 펫시터 (무점포)",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 50,
        noteKo: "무점포—보증금/인테리어 0. 자격교육·보험·마케팅·이동비만. 추정."),
    "laundry-service": ClusterBudgetBenchmark(
        avgWan: 4500, medianWan: 4000, p25Wan: 2500, p75Wan: 6000,
        source: "easylaw 세탁소 + 크린토피아 비용분석",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 350,
        noteKo: "유인 일반세탁(취급소형)은 무인보다 설비 적음. 추정."),
    "cleaning-service": ClusterBudgetBenchmark(
        avgWan: 800, medianWan: 700, p25Wan: 500, p75Wan: 1200,
        source: "비즈바이킹·청소의광장 청소업체 (장비 500~1,000, 무점포)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 200,
        noteKo: "무점포 자택사업자—장비·세제·차량·교육비 중심, 보증금 거의 0."),
    "repair-service": ClusterBudgetBenchmark(
        avgWan: 2500, medianWan: 2000, p25Wan: 1200, p75Wan: 3500,
        source: "의류수선리폼협회 + 중고미싱 시세",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 250,
        noteKo: "소형 점포 보증금+공업용미싱 수대. 협회 통계 기반 추정."),
    "self-laundry": ClusterBudgetBenchmark(
        avgWan: 11000, medianWan: 10000, p25Wan: 7000, p75Wan: 15000,
        source: "모두코리아·imbeyonder 무인빨래방 + moneycat",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 300,
        noteKo: "세탁·건조기 6+6 표준형 15평. 장비가 창업비 60% 이상."),
    "print-copy": ClusterBudgetBenchmark(
        avgWan: 4000, medianWan: 3500, p25Wan: 2000, p75Wan: 6000,
        source: "passionatewebsite 인쇄소 (디지털인쇄·후가공)",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 300,
        noteKo: "동네 복사/출력 소형. 디지털인쇄·복합기 중심, 오프셋 제외. 추정."),
    "device-repair": ClusterBudgetBenchmark(
        avgWan: 2500, medianWan: 2000, p25Wan: 1200, p75Wan: 3500,
        source: "에이엠스쿨·천직 폰수리 + 점포라인 시세",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 250,
        noteKo: "소형 점포·수리장비·부품재고 중심 소자본. 추정."),
    "guesthouse": ClusterBudgetBenchmark(
        avgWan: 15000, medianWan: 12000, p25Wan: 8000, p75Wan: 20000,
        source: "smartbloggerthree·tax25 게스트하우스 가이드",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 500,
        noteKo: "중소형 1~3억, 보증금+인테리어 비중 큼. 핫플은 보증금만 2억+."),
    "rental-studio": ClusterBudgetBenchmark(
        avgWan: 5000, medianWan: 4500, p25Wan: 3000, p75Wan: 7000,
        source: "qplace·jyedream·hourplace 공간대여",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 250,
        noteKo: "보증금+호리존·방음+촬영장비. 무인 렌탈형은 3천대도 가능."),
    "party-room": ClusterBudgetBenchmark(
        avgWan: 3500, medianWan: 3000, p25Wan: 2000, p75Wan: 5000,
        source: "마이프차 파티룸 매거진 (3천만) · qplace",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 250,
        noteKo: "보증금 제외 현실비 2~5천. 인테리어·가구·AV장비 중심."),
    "study-cafe-space": ClusterBudgetBenchmark(
        avgWan: 18000, medianWan: 16000, p25Wan: 12000, p75Wan: 25000,
        source: "policyhelpers·secondsalary 스터디카페",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 400,
        noteKo: "점포 제외 1억 중후반, 임차 포함 2~3.5억. 무인시스템만 2~4천."),
    "shared-office": ClusterBudgetBenchmark(
        avgWan: 12000, medianWan: 10000, p25Wan: 5000, p75Wan: 16700,
        source: "마이프차 드림캐쳐스 정보공개서 (1억6,730만)",
        yearReported: 2024, isEstimate: false, monthlyOpsEstimateWan: 500,
        noteKo: "전체 5천만~2억. 보증금·임대·구획 인테리어 중심."),
    "practice-room": ClusterBudgetBenchmark(
        avgWan: 5000, medianWan: 4500, p25Wan: 3000, p75Wan: 7000,
        source: "studionol·glorypine 연습실",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 200,
        noteKo: "방음시공이 최대 비중(실당 1,500~1,800). 보증금+3~5실 방음+악기. 추정."),
    "smart-store": ClusterBudgetBenchmark(
        avgWan: 500, medianWan: 400, p25Wan: 200, p75Wan: 800,
        source: "KB의생각·TILNOTE·tosspayments 스마트스토어",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 50,
        noteKo: "플랫폼 무료. 사입형은 초기 재고+상세페이지+마케팅 100만원 현금."),
    "digital-products": ClusterBudgetBenchmark(
        avgWan: 30, medianWan: 20, p25Wan: 5, p75Wan: 50,
        source: "ebook4989·apure·imweb 지식창업",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 5,
        noteKo: "재고·물류 없음. 도구비+광고 수준. 사실상 무자본, 시간투입형."),
    "creator-service": ClusterBudgetBenchmark(
        avgWan: 100, medianWan: 80, p25Wan: 50, p75Wan: 200,
        source: "cyberlink·a-ha 유튜버 초기비용",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 20,
        noteKo: "최소 50~100만(스마트폰+무료편집), 고급 장비 200만+."),
    "consignment-commerce": ClusterBudgetBenchmark(
        avgWan: 50, medianWan: 30, p25Wan: 10, p75Wan: 100,
        source: "windly·tosspayments 위탁판매",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 10,
        noteKo: "재고·물류 없음(도매매/오너클랜). 면허세+소싱툴, 무자본 근접."),
    "newsletter-membership": ClusterBudgetBenchmark(
        avgWan: 20, medianWan: 10, p25Wan: 0, p75Wan: 50,
        source: "스티비 유료 뉴스레터 (무료 500명/월 2회)",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 5,
        noteKo: "초기 무자본. 구독자 500명까지 무료, 결제 수수료 3.2%."),
    "global-buying": ClusterBudgetBenchmark(
        avgWan: 50, medianWan: 40, p25Wan: 10, p75Wan: 100,
        source: "windly·국세청 해외직구대행 (업종 525105)",
        yearReported: 2024, isEstimate: true, monthlyOpsEstimateWan: 10,
        noteKo: "주문 후 구매라 무재고. 면허세+주문수집 프로그램. 40~100만."),
]

private func computeInsight(clusterKey: String, specialtyId: String, userBudgetWon: Int) -> BudgetInsight? {
    // specialty(세부 업종) 평균 우선 — 편의점 등. 없으면 cluster 평균 폴백.
    guard let bench = specialtyBenchmarks[specialtyId] ?? clusterBenchmarks[clusterKey] else { return nil }
    let userWan = userBudgetWon / 10_000
    let deltaWan = userWan - bench.avgWan
    let deltaMonths = bench.monthlyOpsEstimateWan > 0
        ? Double(abs(deltaWan)) / Double(bench.monthlyOpsEstimateWan)
        : 0

    if userWan <= 0 {
        return BudgetInsight(
            tone: .noInput,
            userWan: 0, avgWan: bench.avgWan, deltaWan: 0, deltaMonths: 0,
            headlineKo: "같은 업종 평균 \(bench.avgWan.formatted())만원",
            subtitleKo: "25~75 분위 \(bench.p25Wan.formatted())~\(bench.p75Wan.formatted())만원",
            programIntroKo: "자본금을 입력하면 맞춤 프로그램을 보여드려요",
            benchmark: bench
        )
    }

    let ratio = Double(userWan) / Double(bench.avgWan)
    if ratio >= 0.85, ratio <= 1.15 {
        return BudgetInsight(
            tone: .nearAverage,
            userWan: userWan, avgWan: bench.avgWan, deltaWan: deltaWan, deltaMonths: deltaMonths,
            headlineKo: "업종 평균과 거의 같은 수준이에요",
            subtitleKo: "같은 업종 평균 \(bench.avgWan.formatted())만원과 \(deltaWan >= 0 ? "+" : "")\(deltaWan.formatted())만원 차이",
            programIntroKo: "이 단계에서 받을 수 있는 추가 지원 프로그램이에요",
            benchmark: bench
        )
    }

    if ratio < 0.85 {
        return BudgetInsight(
            tone: .shortage,
            userWan: userWan, avgWan: bench.avgWan, deltaWan: deltaWan, deltaMonths: deltaMonths,
            headlineKo: "업종 평균보다 \(abs(deltaWan).formatted())만원 적습니다",
            subtitleKo: deltaMonths >= 1
                ? "운영자금 약 \(String(format: "%.1f", deltaMonths))개월치 분량입니다"
                : "같은 업종 평균 \(bench.avgWan.formatted())만원 기준",
            programIntroKo: "이 차이를 보완할 수 있는 지원 프로그램이에요",
            benchmark: bench
        )
    }

    return BudgetInsight(
        tone: .surplus,
        userWan: userWan, avgWan: bench.avgWan, deltaWan: deltaWan, deltaMonths: deltaMonths,
        headlineKo: "업종 평균보다 \(deltaWan.formatted())만원 여유 있어요",
        subtitleKo: "25~75 분위 \(bench.p25Wan.formatted())~\(bench.p75Wan.formatted())만원 기준 상위권",
        programIntroKo: "이 단계에서 활용해보면 좋은 보너스 프로그램이에요",
        benchmark: bench
    )
}

// MARK: - View

public struct BudgetInsightCard: View {

    public let userBudgetWon: Int

    @AppStorage("roadmap.cluster") private var clusterRaw = "offline-food"
    @AppStorage("roadmap.selectedIndustryId") private var specialtyId = ""
    // 사용자가 "확인" 을 눌러야 분석이 보임. 같은 sheet 안에서만 유효 (sheet 닫으면 리셋).
    @State private var confirmed = false

    public init(userBudgetWon: Int) {
        self.userBudgetWon = userBudgetWon
    }

    public var body: some View {
        if let insight = computeInsight(clusterKey: clusterRaw, specialtyId: specialtyId, userBudgetWon: userBudgetWon) {
            if confirmed {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        headerSection(insight)
                        comparisonBar(insight)
                        if !matchPrograms(for: clusterRaw).isEmpty {
                            programsSection(insight)
                        }
                        if !insight.benchmark.noteKo.isEmpty {
                            contextNote(insight)
                        }
                        footerSection(insight)
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            } else {
                confirmGate
            }
        } else {
            EmptyView()
        }
    }

    // MARK: 확인 게이트 (분석 전)

    private var confirmGate: some View {
        let hasBudget = userBudgetWon > 0
        return VStack(spacing: BUSpacing.sm) {
            // 아이콘
            ZStack {
                Circle()
                    .fill(BUColor.midnight.opacity(0.07))
                    .frame(width: 44, height: 44)
                Image(systemName: "sparkles")
                    .font(.system(size: 18))
                    .foregroundStyle(BUColor.midnight.opacity(0.7))
            }

            Text("예산 분석을 받아보세요")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(BUColor.midnightDeep)
                .tracking(-0.2)

            Text("입력한 자본금이 같은 업종 평균과 어떻게 비교되는지, 부족하면 어떤 지원 프로그램을 받을 수 있는지 분석해드려요.")
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
                .frame(maxWidth: 320)
                .padding(.bottom, 4)

            Button {
                withAnimation(.easeOut(duration: 0.32)) {
                    confirmed = true
                }
            } label: {
                HStack(spacing: 6) {
                    Text("예산 확인하기")
                        .font(.system(size: 13, weight: .semibold))
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                }
                .foregroundStyle(hasBudget ? .white : BUColor.inkMuted)
                .padding(.horizontal, 22)
                .padding(.vertical, 11)
                .background(
                    hasBudget ? BUColor.midnight : BUColor.midnight.opacity(0.12),
                    in: Capsule()
                )
            }
            .buttonStyle(.plain)
            .disabled(!hasBudget)

            if !hasBudget {
                Text("먼저 시작 자본금을 입력해주세요")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
        .padding(.vertical, 22)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [
                    Color.white.opacity(0.7),
                    BUColor.midnight.opacity(0.02),
                ],
                startPoint: .top,
                endPoint: .bottom
            ),
            in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                .strokeBorder(
                    BUColor.midnight.opacity(0.18),
                    style: StrokeStyle(lineWidth: 1, dash: [4, 4])
                )
        )
    }

    // MARK: 헤더

    private func headerSection(_ insight: BudgetInsight) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            BUEyebrow("예산 인사이트")
            Text(insight.headlineKo)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(BUColor.midnightDeep)
                .tracking(-0.2)
                .lineSpacing(3)
            Text(insight.subtitleKo)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
        }
    }

    // MARK: 비교 막대

    private func comparisonBar(_ insight: BudgetInsight) -> some View {
        let bench = insight.benchmark
        let maxWan = max(Double(insight.userWan), Double(bench.p75Wan) * 1.15, Double(bench.avgWan) * 1.4)
        let avgPct = maxWan > 0 ? Double(bench.avgWan) / maxWan : 0
        let p25Pct = maxWan > 0 ? Double(bench.p25Wan) / maxWan : 0
        let p75Pct = maxWan > 0 ? Double(bench.p75Wan) / maxWan : 0
        let userPct = maxWan > 0 ? min(1.0, Double(insight.userWan) / maxWan) : 0

        // 웹 SSOT(BudgetInsightCard.tsx) 와 동일한 세로 간격 구조:
        //   평균 라벨(위) — 충분한 gap — 트랙+마커 — 충분한 gap — 내 예산 라벨(아래).
        //   마커(원·세로선)는 트랙 행 안에서 수직 중앙 정렬만 하고 위 라벨 영역을 침범하지 않음.
        return VStack(alignment: .leading, spacing: 0) {
            // 평균 라벨 (위)
            GeometryReader { geo in
                Text("평균 \(bench.avgWan.formatted())만")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize()
                    // 라벨이 카드 밖으로 잘리지 않도록 중심 x clamp (마커는 실제 위치 유지)
                    .position(x: min(max(geo.size.width * avgPct, 42), geo.size.width - 42), y: 9)
            }
            .frame(height: 18)

            // 트랙 (모든 마커 수직 중앙 정렬 — y offset 없음 → 위 라벨과 겹치지 않음)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // 베이스 트랙
                    Capsule()
                        .fill(BUColor.midnight.opacity(0.06))
                        .frame(height: 8)

                    // p25-p75 분위 밴드
                    Capsule()
                        .fill(BUColor.midnight.opacity(0.16))
                        .frame(width: max(0, geo.size.width * (p75Pct - p25Pct)), height: 8)
                        .offset(x: geo.size.width * p25Pct)

                    // 평균 마커 (세로선)
                    Rectangle()
                        .fill(BUColor.midnight.opacity(0.5))
                        .frame(width: 2, height: 16)
                        .offset(x: geo.size.width * avgPct - 1)

                    // 사용자 입력 마커 (원)
                    if insight.userWan > 0 {
                        Circle()
                            .fill(BUColor.midnight)
                            .frame(width: 16, height: 16)
                            .overlay(Circle().stroke(.white, lineWidth: 3))
                            .shadow(color: BUColor.midnight.opacity(0.35), radius: 4, y: 2)
                            .offset(x: geo.size.width * userPct - 8)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .frame(height: 24)

            // 사용자 값 라벨 (아래)
            if insight.userWan > 0 {
                GeometryReader { geo in
                    Text("내 예산 \(insight.userWan.formatted())만")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                        .fixedSize()
                        // 라벨이 카드 밖으로 잘리지 않도록 중심 x clamp (마커는 실제 위치 유지)
                        .position(x: min(max(geo.size.width * userPct, 48), geo.size.width - 48), y: 11)
                }
                .frame(height: 22)
            } else {
                Color.clear.frame(height: 6)
            }
        }
        .frame(height: 64)
    }

    // MARK: 프로그램 섹션

    private func programsSection(_ insight: BudgetInsight) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            Divider().background(BUColor.midnight.opacity(0.08))

            VStack(alignment: .leading, spacing: 4) {
                BUEyebrow("지원 프로그램")
                Text(insight.programIntroKo)
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkMuted)
            }

            VStack(spacing: 8) {
                ForEach(matchPrograms(for: clusterRaw)) { program in
                    programRow(program)
                }
            }
        }
    }

    private func programRow(_ p: SupportProgram) -> some View {
        Link(destination: URL(string: p.url) ?? URL(string: "https://www.k-startup.go.kr")!) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .center, spacing: 6) {
                    Text(p.nameKo)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                        .tracking(-0.1)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.midnight.opacity(0.6))
                }
                HStack(spacing: 6) {
                    Text(p.organizerKo)
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                    Text("·")
                        .foregroundStyle(BUColor.inkSubtle)
                    Text(p.amountKo)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Text(p.benefitKo)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                Text("자격: \(p.targetKo)")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: 부연 컨텍스트 (자료 한계·범위 안내)

    private func contextNote(_ insight: BudgetInsight) -> some View {
        Text(insight.benchmark.noteKo)
            .font(.system(size: 11))
            .foregroundStyle(BUColor.inkSecondary)
            .lineSpacing(2)
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    // MARK: 푸터

    private func footerSection(_ insight: BudgetInsight) -> some View {
        HStack(alignment: .center, spacing: 6) {
            Text("출처: \(insight.benchmark.source)")
                .font(.system(size: 10))
                .foregroundStyle(BUColor.inkMuted)
                .lineLimit(2)
            if insight.benchmark.isEstimate {
                Text("추정치")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 1)
                    .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 4))
            }
            Spacer()
            Text(String(insight.benchmark.yearReported))
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(.top, 4)
    }
}

#if DEBUG
#Preview("BudgetInsight — shortage") {
    BudgetInsightCard(userBudgetWon: 50_000_000)
        .padding()
        .background(BUColor.surface)
        .onAppear { UserDefaults.standard.set("offline-food", forKey: "roadmap.cluster") }
}

#Preview("BudgetInsight — near average") {
    BudgetInsightCard(userBudgetWon: 70_000_000)
        .padding()
        .background(BUColor.surface)
        .onAppear { UserDefaults.standard.set("offline-food", forKey: "roadmap.cluster") }
}

#Preview("BudgetInsight — surplus") {
    BudgetInsightCard(userBudgetWon: 120_000_000)
        .padding()
        .background(BUColor.surface)
        .onAppear { UserDefaults.standard.set("offline-food", forKey: "roadmap.cluster") }
}

#Preview("BudgetInsight — startup-tech") {
    BudgetInsightCard(userBudgetWon: 30_000_000)
        .padding()
        .background(BUColor.surface)
        .onAppear { UserDefaults.standard.set("startup-tech", forKey: "roadmap.cluster") }
}
#endif
