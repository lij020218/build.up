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
import BuildUpDesignSystem
import BuildUpComponents

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

private func computeInsight(clusterKey: String, userBudgetWon: Int) -> BudgetInsight? {
    guard let bench = clusterBenchmarks[clusterKey] else { return nil }
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

    public init(userBudgetWon: Int) {
        self.userBudgetWon = userBudgetWon
    }

    public var body: some View {
        if let insight = computeInsight(clusterKey: clusterRaw, userBudgetWon: userBudgetWon) {
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
        } else {
            EmptyView()
        }
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

        return VStack(alignment: .leading, spacing: 0) {
            // 평균 라벨 (위)
            GeometryReader { geo in
                Text("평균 \(bench.avgWan.formatted())만")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                    .position(x: geo.size.width * avgPct, y: 8)
            }
            .frame(height: 16)

            // 트랙
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // 베이스 트랙
                    Capsule()
                        .fill(BUColor.midnight.opacity(0.06))
                        .frame(height: 8)

                    // p25-p75 분위 밴드
                    Capsule()
                        .fill(BUColor.midnight.opacity(0.16))
                        .frame(width: geo.size.width * (p75Pct - p25Pct), height: 8)
                        .offset(x: geo.size.width * p25Pct)

                    // 평균 마커 (세로선)
                    Rectangle()
                        .fill(BUColor.midnight.opacity(0.5))
                        .frame(width: 2, height: 16)
                        .offset(x: geo.size.width * avgPct - 1, y: -4)

                    // 사용자 입력 마커 (원)
                    if insight.userWan > 0 {
                        Circle()
                            .fill(BUColor.midnight)
                            .frame(width: 16, height: 16)
                            .overlay(Circle().stroke(.white, lineWidth: 3))
                            .shadow(color: BUColor.midnight.opacity(0.35), radius: 4, y: 2)
                            .offset(x: geo.size.width * userPct - 8, y: -4)
                    }
                }
                .frame(height: 8)
            }
            .frame(height: 16)

            // 사용자 값 라벨 (아래)
            if insight.userWan > 0 {
                GeometryReader { geo in
                    Text("내 예산 \(insight.userWan.formatted())만")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                        .position(x: geo.size.width * userPct, y: 10)
                }
                .frame(height: 20)
            } else {
                Color.clear.frame(height: 4)
            }
        }
        .frame(height: 56)
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
