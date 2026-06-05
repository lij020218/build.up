//
//  FranchiseBenchmarkCard.swift — 브랜드별 매출 벤치마크 비교 카드 (iOS)
//
//  웹 SSOT 1:1 포팅: apps/web/.../analytics/AiCoachCard.tsx 의 "프랜차이즈 벤치마크 비교바".
//  내 매장(예상 월매출) vs 같은 브랜드 평균 / 상위 추정 비교 + 상위매장 비결 + 출처.
//
//  ⚠️ 정직성:
//   - "상위 추정" = topStoreMonthlyRevenue(평균×배수 모델 추정치, 실측 아님).
//   - isEstimate=true 브랜드는 "추정" 캡션 추가.
//   - 호출부 가드: 선택 브랜드의 벤치마크 존재 + 기록 3일+ 일 때만 표시(가짜 비교 방지).
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem

public struct FranchiseBenchmarkCard: View {

    let benchmark: FranchiseBenchmark
    let brandName: String
    let entries: [DailyEntry]

    public init(benchmark: FranchiseBenchmark, brandName: String, entries: [DailyEntry]) {
        self.benchmark = benchmark
        self.brandName = brandName
        self.entries = entries
    }

    /// 월 환산 매출 추정 = 일평균 × 26 영업일 (업종 카드와 동일 가정).
    private var projectedMonthly: Double {
        guard !entries.isEmpty else { return 0 }
        let total = entries.reduce(0) { $0 + $1.sales }
        return (total / Double(entries.count)) * 26
    }

    // 만원 → 원
    private var benchAvgWon: Double { Double(benchmark.avgMonthlyRevenue) * 10_000 }
    private var benchTopWon: Double { Double(benchmark.topStoreMonthlyRevenue) * 10_000 }

    private var atLeastAvg: Bool { projectedMonthly >= benchAvgWon && benchAvgWon > 0 }
    /// 신호등 컬러 회피 — 평균 이상만 success 강조, 그 외 미드나잇.
    private var toneColor: Color { atLeastAvg ? BUColor.success : BUColor.midnight }

    private var message: String {
        if benchAvgWon <= 0 { return "" }
        if atLeastAvg {
            let gap = max(0, benchTopWon - projectedMonthly)
            if gap <= 0 { return "같은 \(brandName) 상위 추정 수준이에요. 이 페이스를 유지하세요." }
            return "같은 \(brandName) 평균 이상이에요. 상위 추정까지 월 \(fmtWon(gap)) 더 필요합니다."
        }
        let gap = max(0, benchAvgWon - projectedMonthly)
        return "같은 \(brandName) 평균보다 아래에요. 평균까지 월 \(fmtWon(gap)) 추가 필요."
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                // 헤더
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(toneColor.opacity(0.10)).frame(width: 36, height: 36)
                        Image(systemName: atLeastAvg ? "rosette" : "storefront")
                            .font(.system(size: 14, weight: .semibold)).foregroundStyle(toneColor)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("브랜드 비교").buSectionEyebrowStyle()
                        Text("같은 \(brandName) 매장과 비교")
                            .font(.system(size: 15, weight: .bold)).foregroundStyle(BUColor.ink)
                            .lineLimit(1).minimumScaleFactor(0.8)
                    }
                    Spacer(minLength: 0)
                }

                benchmarkBar

                // 인사이트 메시지
                if !message.isEmpty {
                    Text(message)
                        .font(.system(size: 12, weight: .semibold)).foregroundStyle(toneColor).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(toneColor.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
                }

                // 상위 매장 비결 (웹 AiCoachCard operationalInsights[0])
                if let insight = benchmark.operationalInsights.first {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("상위 매장 비결")
                            .font(.system(size: 10, weight: .heavy)).foregroundStyle(BUColor.midnight.opacity(0.8))
                        Text(insight)
                            .font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.ink.opacity(0.88))
                            .lineSpacing(2).fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10))
                }

                // 출처·기준연도·추정 (정직성 — 웹 AiCoachCard 푸트노트 1:1)
                Text(provenanceText)
                    .font(.system(size: 10, weight: .medium)).foregroundStyle(BUColor.inkSubtle)
                    .lineSpacing(1).fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var provenanceText: String {
        let yr = benchmark.yearReported ?? FranchiseBenchmarkProvenance.disclosureYear
        var caveat = FranchiseBenchmarkProvenance.modeledNoteKo
        if benchmark.isEstimate { caveat += " " + FranchiseBenchmarkProvenance.estimateNoteKo }
        return "※ 기준 \(yr)년 · \(FranchiseBenchmarkProvenance.source)\n\(caveat)"
    }

    private var benchmarkBar: some View {
        let barMax = max(benchTopWon, projectedMonthly * 1.1, 1)
        let userPct = min(1, projectedMonthly / barMax)
        let avgPct = min(1, benchAvgWon / barMax)
        let topPct = min(1, benchTopWon / barMax)
        return VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text("내 매장 (이번 달 예상)").font(.system(size: 11.5, weight: .semibold)).foregroundStyle(BUColor.inkSecondary)
                Spacer()
                Text(fmtWon(projectedMonthly)).font(.system(size: 14, weight: .bold)).monospacedDigit().foregroundStyle(toneColor)
            }
            GeometryReader { geo in
                let w = geo.size.width
                ZStack(alignment: .leading) {
                    Capsule().fill(BUColor.midnight.opacity(0.06))
                    Capsule().fill(toneColor.opacity(0.85)).frame(width: max(4, w * userPct))
                    // 평균 기준선
                    Rectangle().fill(BUColor.ink.opacity(0.4)).frame(width: 1.5)
                        .offset(x: w * avgPct)
                    // 상위 추정 기준선
                    Rectangle().fill(BUColor.success.opacity(0.7)).frame(width: 1.5)
                        .offset(x: w * topPct)
                }
            }
            .frame(height: 7)
            HStack {
                Text("0").font(.system(size: 10, weight: .semibold)).foregroundStyle(BUColor.inkSubtle)
                Spacer()
                Text("평균 \(fmtWon(benchAvgWon))").font(.system(size: 10, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                Spacer()
                Text("상위 추정 \(fmtWon(benchTopWon))").font(.system(size: 10, weight: .semibold)).foregroundStyle(BUColor.success.opacity(0.85))
            }
        }
    }

    /// 웹 fmt 1:1 — 억원(소수1)/만원/원.
    private func fmtWon(_ n: Double) -> String {
        let abs = Swift.abs(n.rounded())
        if abs >= 100_000_000 { return "\(String(format: "%.1f", n / 100_000_000))억원" }
        if abs >= 10_000 { return "\(Int((n / 10_000).rounded()).formatted())만원" }
        return "\(Int(abs).formatted())원"
    }
}
