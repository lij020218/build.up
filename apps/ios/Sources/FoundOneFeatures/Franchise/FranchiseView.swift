//
//  FranchiseView.swift — "프랜차이즈" iOS 네이티브 surface
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/FranchiseView.tsx (254 lines)
//
//  모바일 최적화 — 1-column 카드 stack, compact 4-cell metric grid, 5 score bars.
//
//  ⚠️ 샘플 데이터 — 실제 브랜드명 미사용 (상표권 회피).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore

// MARK: - Data model
//
// 웹 SSOT (packages/shared/src/franchise-data.ts) 의 120개 실재 한국 프랜차이즈 (BBQ·BHC·교촌·도미노·본죽·이디야·CU·다이소 등) 를
// FranchiseBrandRegistry 에서 직접 로드해 표시. 가짜 가명 데이터 X.

private struct FranchiseCategory: Identifiable, Equatable {
    let id: String
    let label: String
}

/// FranchiseView 표시용 어댑터 — FoundOneCore.FranchiseBrand 를 file-local 뷰 구조로 매핑.
/// 100% registry 기반, 가공 데이터 없음.
private struct FranchiseBrandView: Identifiable, Equatable {
    let id: String
    let name: String
    let category: String           // 카테고리 라벨 (사람용)
    let categoryId: String
    let tagline: String

    let franchiseFeeManwon: Int
    let totalInitialManwon: Int

    // 5-bar score (registry scores 직접 매핑)
    let scoreProfitability: Int
    let scoreStability: Int
    let scoreAccessibility: Int
    let scoreBrandPower: Int
    let scoreSupport: Int

    let infoDisclosureURL: String

    let pros: [String]
    let cons: [String]
    let avgRevenueOku: Double?
    let closureRatePct: Double?
    let storeCount: Int?

    // 정직성 메타 (웹 FranchiseDetailModal 1:1 — 출처·연도·검증·신뢰도)
    let costVerified: Bool
    let costSource: String?
    let dataYear: String?
    let confidence: String?

    init(_ b: FranchiseBrand) {
        self.id = b.id
        self.name = b.name.ko
        self.categoryId = b.categoryId
        self.category = Self.categoryLabel(b.categoryId)
        self.tagline = b.tagline.ko
        self.franchiseFeeManwon = b.franchiseFee
        self.totalInitialManwon = b.startupCostWon
        self.scoreProfitability = b.scores.profitability
        self.scoreStability     = b.scores.stability
        self.scoreAccessibility = b.scores.accessibility
        self.scoreBrandPower    = b.scores.brandPower
        self.scoreSupport       = b.scores.support
        self.infoDisclosureURL  = b.franchiseUrl ?? "https://franchise.ftc.go.kr/"
        self.pros = b.pros?.ko ?? []
        self.cons = b.cons?.ko ?? []
        // avgAnnualRevenueWon 단위: 만원 → 억원
        self.avgRevenueOku = b.avgAnnualRevenueWon > 0 ? Double(b.avgAnnualRevenueWon) / 10_000.0 : nil
        self.closureRatePct = b.closureRate
        self.storeCount = b.storeCount > 0 ? b.storeCount : nil
        self.costVerified = b.costVerified
        self.costSource = b.costSource
        self.dataYear = b.dataYear
        self.confidence = b.confidence
    }

    private static func categoryLabel(_ id: String) -> String {
        switch id {
        case "food":           return "음식"
        case "cafe-dessert":   return "카페·디저트"
        case "retail":         return "소매"
        case "beauty":         return "뷰티"
        case "fitness":        return "피트니스"
        case "education":      return "교육"
        case "pet":            return "반려동물"
        case "living-service": return "생활서비스"
        case "space":          return "공간"
        default:               return id
        }
    }
}

// MARK: - Sample data (fictional brand names — 상표권 회피)

// 웹 SSOT 와 일치 (9 categories + all)
private let franchiseCategories: [FranchiseCategory] = [
    .init(id: "all",            label: "전체"),
    .init(id: "cafe-dessert",   label: "카페·디저트"),
    .init(id: "food",           label: "음식"),
    .init(id: "retail",         label: "소매"),
    .init(id: "beauty",         label: "뷰티"),
    .init(id: "fitness",        label: "피트니스"),
    .init(id: "education",      label: "교육"),
    .init(id: "pet",            label: "반려동물"),
    .init(id: "living-service", label: "생활서비스"),
    .init(id: "space",          label: "공간"),
]

private let franchiseSampleBrands: [FranchiseBrandView] = FranchiseBrandRegistry.all.map { FranchiseBrandView($0) }

// MARK: - FranchiseView

public struct FranchiseView: View {

    @State private var selectedCategoryId: String = "all"
    @State private var selectedBrand: FranchiseBrandView?
    /// BudgetSetup 단계에서 프랜차이즈 비용 패널을 표시하기 위해 선택한 브랜드를 영속.
    @AppStorage("stage.franchise.selectedBrandId") private var selectedBrandIdStorage: String = ""

    public init() {}

    private var filteredBrands: [FranchiseBrandView] {
        let base = selectedCategoryId == "all"
            ? franchiseSampleBrands
            : franchiseSampleBrands.filter { $0.categoryId == selectedCategoryId }
        // overall score 내림차순 정렬 (웹과 동일)
        return base.sorted { overallScore($0) > overallScore($1) }
    }

    private func categoryCount(_ id: String) -> Int {
        id == "all"
            ? franchiseSampleBrands.count
            : franchiseSampleBrands.filter { $0.categoryId == id }.count
    }

    public var body: some View {
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 풀스크린 Aurora 사용.
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    header
                    categoryChips
                    brandCards
                    disclaimerCard
                    Color.clear.frame(height: 110)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
                .padding(.top, BUSpacing.md)
            }
            .scrollIndicators(.hidden)
        }
        .navigationTitle("프랜차이즈")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
        .sheet(item: $selectedBrand) { brand in
            FranchiseDetailSheet(brand: brand)
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("프랜차이즈 · BRAND ANALYSIS")
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.32)
                .foregroundStyle(BUColor.midnight.opacity(0.65))
                .textCase(.uppercase)

            Text("검증된 브랜드 비교")
                .font(.system(size: 26, weight: .bold))
                .tracking(-0.65)
                .foregroundStyle(BUColor.ink)

            Text("초기 비용 · 운영 난이도 · 폐점률 — 본사가 안 알려주는 진짜 데이터")
                .font(.system(size: 13.5, weight: .regular))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Category chips (horizontal scroll)

    private var categoryChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(franchiseCategories) { cat in
                    let active = selectedCategoryId == cat.id
                    let count = categoryCount(cat.id)
                    Button {
                        withAnimation(.easeOut(duration: 0.18)) {
                            selectedCategoryId = cat.id
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(cat.label)
                                .font(.system(size: 12.5, weight: active ? .heavy : .heavy))
                                .foregroundStyle(active ? Color.white : BUColor.ink)
                            Text("\(count)")
                                .font(.system(size: 10.5, weight: .heavy))
                                .foregroundStyle(active ? Color.white.opacity(0.75) : BUColor.inkMuted.opacity(0.55))
                        }
                        .padding(.horizontal, 13)
                        .padding(.vertical, 9)
                        .frame(minHeight: 36)
                        .background(
                            Capsule(style: .continuous)
                                .fill(active ? BUColor.midnight : Color.white)
                        )
                        .overlay(
                            Capsule(style: .continuous)
                                .strokeBorder(active ? BUColor.midnight : BUColor.ink.opacity(0.10), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .contentShape(Capsule())
                }
            }
            .padding(.vertical, 2)
        }
    }

    // MARK: - Brand cards (vertical stack — mobile 1-col)

    private var brandCards: some View {
        VStack(spacing: 12) {
            ForEach(filteredBrands) { brand in
                FranchiseBrandCard(brand: brand) {
                    selectedBrand = brand
                    selectedBrandIdStorage = brand.id
                }
            }

            if filteredBrands.isEmpty {
                Text("이 카테고리에 등록된 프랜차이즈가 없습니다.")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            }
        }
    }

    // MARK: - Disclaimer card

    private var disclaimerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BUColor.warn)
                Text("프랜차이즈 진입 전 필수")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(0.4)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.warn)
            }

            VStack(alignment: .leading, spacing: 5) {
                disclaimerRow("공정위 정보공개서(franchise.ftc.go.kr) 본사명·점포수·매출 직접 확인")
                disclaimerRow("폐점률 20% 이상 → 위험 신호")
                disclaimerRow("점주 평균 운영기간 5년 미만 → 재계약 단절 의심")
                disclaimerRow("본 화면 데이터는 비교 예시 — 실제 계약 전 정보공개서 기반 검증 필수")
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(BUColor.warn.opacity(0.06))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.warn.opacity(0.20), lineWidth: 1)
        )
    }

    private func disclaimerRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("·")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(BUColor.warn.opacity(0.7))
            Text(text)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.ink.opacity(0.78))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - URL identifiable (for sheet binding)

extension URL: @retroactive Identifiable {
    public var id: String { absoluteString }
}

// MARK: - Overall score (5-bar 평균 — 웹 computeOverallScore 미러)

private func overallScore(_ b: FranchiseBrandView) -> Double {
    let sum = b.scoreAccessibility + b.scoreProfitability + b.scoreProfitability + b.scoreBrandPower + b.scoreStability
    return Double(sum) / 5.0
}

// MARK: - Brand card

private struct FranchiseBrandCard: View {
    let brand: FranchiseBrandView
    let onTapInfoDisclosure: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Row 1: Name + category chip
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(brand.name)
                        .font(.system(size: 18, weight: .bold))
                        .tracking(-0.36)
                        .foregroundStyle(BUColor.ink)
                        .lineLimit(1)
                    Text(brand.tagline)
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                Text(brand.category)
                    .font(.system(size: 10.5, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(BUColor.midnight.opacity(0.06), in: Capsule())
            }

            // Row 2: 2x2 metric grid
            metricGrid

            // Row 3: 5-bar score row
            scoreRow

            // Row 4: 공정위 link
            Button(action: onTapInfoDisclosure) {
                HStack(spacing: 4) {
                    Text("공정위 정보공개서")
                        .font(.system(size: 11.5, weight: .semibold))
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 10, weight: .bold))
                }
                .foregroundStyle(BUColor.midnight)
                .padding(.vertical, 6)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .frame(minHeight: 44, alignment: .trailing)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    // MARK: - Metric grid (2x2)

    private var metricGrid: some View {
        let cells: [(label: String, value: String)] = [
            ("가맹비",      "\(brand.franchiseFeeManwon.formatted())만원"),
            ("초기 총비용", formatTotalCost(brand.totalInitialManwon)),
            ("연 매출",     brand.avgRevenueOku.map { String(format: "%.1f억", $0) } ?? "-"),
            ("폐점률",      brand.closureRatePct.map { String(format: "%.1f%%", $0) } ?? "-"),
        ]
        return LazyVGrid(
            columns: [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)],
            spacing: 6
        ) {
            ForEach(cells, id: \.label) { cell in
                VStack(alignment: .leading, spacing: 2) {
                    Text(cell.label)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                    Text(cell.value)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .monospacedDigit()
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(BUColor.ink.opacity(0.03))
                )
            }
        }
    }

    private func formatTotalCost(_ manwon: Int) -> String {
        if manwon >= 10000 {
            let eok = Double(manwon) / 10000.0
            return String(format: "%.1f억", eok)
        } else {
            return "\(manwon.formatted())만원"
        }
    }

    // MARK: - 5 score bars

    private var scoreRow: some View {
        let scores: [(label: String, value: Int)] = [
            ("수익성",   brand.scoreAccessibility),
            ("안정성",     brand.scoreProfitability),
            ("접근성",     brand.scoreProfitability),
            ("브랜드", brand.scoreBrandPower),
            ("지원", brand.scoreStability),
        ]
        return HStack(spacing: 6) {
            ForEach(scores, id: \.label) { s in
                VStack(spacing: 4) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(BUColor.ink.opacity(0.05))
                            Capsule()
                                .fill(scoreColor(s.value))
                                .frame(width: geo.size.width * CGFloat(s.value) / 100)
                        }
                    }
                    .frame(height: 3)

                    Text("\(s.value)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(scoreColor(s.value))
                        .monospacedDigit()
                    Text(s.label)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private func scoreColor(_ value: Int) -> Color {
        switch value {
        case 75...:  return BUColor.success
        case 55..<75: return BUColor.midnight
        case 35..<55: return BUColor.warn
        default:     return BUColor.danger
        }
    }
}

// MARK: - 상세 정보 시트 (웹 FranchiseDetailModal iOS 대응)

private struct FranchiseDetailSheet: View {
    let brand: FranchiseBrandView
    @Environment(\.dismiss) private var dismiss

    private var overall: Double { overallScore(brand) }

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        // 헤더
                        headerBlock

                        // 종합 점수 + 5 score breakdown
                        scoresBlock

                        // 핵심 지표 4 (공정위 정보공개서 기반)
                        if brand.avgRevenueOku != nil || brand.closureRatePct != nil || brand.storeCount != nil {
                            officialStatsBlock
                        }

                        // 초기 비용 분석
                        initialCostBlock

                        // 장점 / 단점
                        if !brand.pros.isEmpty {
                            prosConsBlock(title: "장점", color: BUColor.success, icon: "checkmark.circle.fill", items: brand.pros)
                        }
                        if !brand.cons.isEmpty {
                            prosConsBlock(title: "단점", color: BUColor.danger, icon: "exclamationmark.circle.fill", items: brand.cons)
                        }

                        // 정보공개서 링크
                        Link(destination: URL(string: brand.infoDisclosureURL) ?? URL(string: "https://www.ftc.go.kr")!) {
                            HStack(spacing: 6) {
                                Image(systemName: "safari")
                                    .font(.system(size: 13, weight: .heavy))
                                Text("공정위 정보공개서 열기")
                                    .font(.system(size: 14, weight: .heavy))
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 11, weight: .heavy))
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }

                        Color.clear.frame(height: 32)
                    }
                    .padding(BUSpacing.md)
                }
            }
            .navigationTitle("브랜드 상세")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } }
                #endif
            }
        }
    }

    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(brand.category)
                .font(.system(size: 10.5, weight: .heavy))
                .tracking(0.5)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(BUColor.midnight.opacity(0.08), in: Capsule())
            Text(brand.name)
                .font(.system(size: 24, weight: .bold))
                .tracking(-0.5)
                .foregroundStyle(BUColor.ink)
            Text(brand.tagline)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var scoresBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("종합 점수")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                Spacer(minLength: 0)
                Text(String(format: "%.0f / 100", overall))
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(scoreColor(Int(overall)))
            }
            VStack(spacing: 8) {
                scoreBar(label: "수익성",   value: brand.scoreAccessibility)
                scoreBar(label: "안정성",     value: brand.scoreProfitability)
                scoreBar(label: "접근성",     value: brand.scoreProfitability)
                scoreBar(label: "브랜드", value: brand.scoreBrandPower)
                scoreBar(label: "지원", value: brand.scoreStability)
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white.opacity(0.85)))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    private func scoreBar(label: String, value: Int) -> some View {
        HStack(spacing: 8) {
            Text(label)
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .frame(width: 56, alignment: .leading)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(BUColor.ink.opacity(0.06))
                    Capsule().fill(scoreColor(value))
                        .frame(width: geo.size.width * CGFloat(value) / 100)
                }
            }
            .frame(height: 6)
            Text("\(value)")
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(scoreColor(value))
                .monospacedDigit()
                .frame(width: 30, alignment: .trailing)
        }
    }

    private var officialStatsBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("공정위 정보공개서 (참고)")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.5)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            HStack(spacing: 8) {
                if let v = brand.avgRevenueOku {
                    statTile(label: "가맹점 평균 연매출", value: String(format: "%.1f억", v))
                }
                if let v = brand.closureRatePct {
                    statTile(label: "최근 1년 폐점률",
                             value: String(format: "%.1f%%", v),
                             tint: v >= 20 ? BUColor.danger
                                   : v >= 10 ? BUColor.warn
                                   : BUColor.success)
                }
                if let v = brand.storeCount {
                    statTile(label: "전체 가맹점", value: "\(v.formatted())개")
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white.opacity(0.85)))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    private func statTile(label: String, value: String, tint: Color = BUColor.ink) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                .lineLimit(1)
            Text(value)
                .font(.system(size: 14, weight: .heavy))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding(.horizontal, 10).padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.inkMuted.opacity(0.03), in: RoundedRectangle(cornerRadius: 10))
    }

    private var initialCostBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("초기 비용 분석")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.5)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            VStack(spacing: 8) {
                costRow(label: "가맹비",         value: "\(brand.franchiseFeeManwon.formatted())만원")
                if let store = brand.storeCount {
                    costRow(label: "매장 수",       value: "\(store.formatted())개")
                }
                Rectangle().fill(BUColor.inkMuted.opacity(0.08)).frame(height: 1)
                costRow(label: "초기 총비용", value: formatTotalCost(brand.totalInitialManwon), emphasize: true)
                if let rev = brand.avgRevenueOku {
                    costRow(label: "가맹점 평균 연매출", value: String(format: "%.1f억원", rev))
                }
                if let cr = brand.closureRatePct {
                    costRow(label: "폐점률 (최근 1년)",  value: String(format: "%.1f%%", cr))
                }
            }
            provenanceFooter
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white.opacity(0.85)))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    /// 정직성 푸터 — 검증/추정 칩 + 기준연도 + 출처 + 신뢰도 (웹 FranchiseDetailModal 1:1).
    @ViewBuilder
    private var provenanceFooter: some View {
        Rectangle().fill(BUColor.inkMuted.opacity(0.08)).frame(height: 1)
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 6) {
                // 검증 vs 추정 칩
                Text(brand.costVerified ? "비용 검증" : "비용 추정")
                    .font(.system(size: 9.5, weight: .heavy))
                    .foregroundStyle(brand.costVerified ? BUColor.success : BUColor.warn)
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background((brand.costVerified ? BUColor.success : BUColor.warn).opacity(0.12),
                               in: Capsule())
                if let yr = brand.dataYear, !yr.isEmpty {
                    Text("데이터 기준 \(yr)")
                        .font(.system(size: 9.5, weight: .bold))
                        .foregroundStyle(BUColor.inkSubtle)
                }
                if let conf = brand.confidence, !conf.isEmpty {
                    Text("신뢰도 \(confidenceLabel(conf))")
                        .font(.system(size: 9.5, weight: .bold))
                        .foregroundStyle(BUColor.inkSubtle)
                }
                Spacer(minLength: 0)
            }
            if let src = brand.costSource, !src.isEmpty {
                Text("출처: \(src)")
                    .font(.system(size: 9.5, weight: .medium))
                    .foregroundStyle(BUColor.inkSubtle)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func confidenceLabel(_ c: String) -> String {
        switch c.lowercased() {
        case "high":   return "높음"
        case "medium": return "보통"
        case "low":    return "낮음"
        default:       return c
        }
    }

    private func costRow(label: String, value: String, emphasize: Bool = false) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 12, weight: emphasize ? .heavy : .semibold))
                .foregroundStyle(BUColor.inkMuted)
            Spacer(minLength: 0)
            Text(value)
                .font(.system(size: emphasize ? 15 : 13, weight: .heavy))
                .foregroundStyle(BUColor.ink)
        }
    }

    private func formatTotalCost(_ manwon: Int) -> String {
        if manwon >= 10000 {
            return String(format: "%.1f억", Double(manwon) / 10000.0)
        }
        return "\(manwon.formatted())만원"
    }

    private func prosConsBlock(title: String, color: Color, icon: String, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(color)
                Text(title)
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.inkMuted)
            }
            VStack(alignment: .leading, spacing: 6) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("·")
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(color.opacity(0.7))
                        Text(item)
                            .font(.system(size: 12.5, weight: .medium))
                            .foregroundStyle(BUColor.ink.opacity(0.88))
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.04), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(color.opacity(0.16), lineWidth: 1))
    }

    private func scoreColor(_ value: Int) -> Color {
        switch value {
        case 75...:  return BUColor.success
        case 55..<75: return BUColor.midnight
        case 35..<55: return BUColor.warn
        default:     return BUColor.danger
        }
    }
}

// 기존 placeholder — 호환성 유지용. 이제 직접 사용 안 함.
private struct FranchiseInfoSheet: View {
    let url: URL
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("공정위 정보공개서")
                            .font(.system(size: 22, weight: .bold))
                            .tracking(-0.44)
                            .foregroundStyle(BUColor.ink)
                        Text("공정거래위원회 가맹사업거래 사이트에서 본사명·점포수·매출·폐점률 등 공식 정보공개서를 확인할 수 있습니다.")
                            .font(.system(size: 13, weight: .regular))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(3)
                    }

                    Link(destination: url) {
                        HStack(spacing: 6) {
                            Image(systemName: "safari")
                                .font(.system(size: 13, weight: .semibold))
                            Text("franchise.ftc.go.kr 열기")
                                .font(.system(size: 14, weight: .semibold))
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }

                    Spacer()
                }
                .padding(BUSpacing.md)
            }
            .navigationTitle("정보공개서")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
                #endif
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Franchise — 전체") {
    NavigationStack {
        FranchiseView()
    }
}
#endif
