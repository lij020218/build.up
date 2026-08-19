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
    let monthlyRoyaltyManwon: Double
    let royaltyPercent: Double?

    /// 로열티 표시 — 정률(%) 우선, 없으면 정액(만원/월), 둘 다 0/nil 이면 "없음".
    var royaltyLabel: String {
        if let p = royaltyPercent, p > 0 { return "매출 \(p.formatted())%" }
        if monthlyRoyaltyManwon > 0 { return "\(monthlyRoyaltyManwon.formatted())만원/월" }
        return "없음"
    }

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

    // 공정위 공식 통계 (data.go.kr 15110241) — 미매칭이면 nil
    let officialStats: FranchiseBrandOfficialStats?

    // 공정위 공개데이터 자동 수록 브랜드 (tier "kftc") — 배지·정렬용
    let isKftc: Bool

    /// 검색용 소문자 haystack (name + tagline + category) — 브랜드당 1회 계산 (성능 2026-08-19).
    let searchHaystack: String
    /// overall score — 정렬용, 1회 계산.
    let overall: Double

    init(_ b: FranchiseBrand) {
        self.id = b.id
        self.name = b.name.ko
        self.categoryId = b.categoryId
        self.category = Self.categoryLabel(b.categoryId)
        self.tagline = b.tagline.ko
        self.franchiseFeeManwon = b.franchiseFee
        self.totalInitialManwon = b.startupCostWon
        self.monthlyRoyaltyManwon = b.monthlyRoyalty
        self.royaltyPercent = b.royaltyPercent
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
        self.officialStats = b.officialStats
        self.isKftc = b.tier == "kftc"
        self.searchHaystack = "\(b.name.ko) \(b.tagline.ko) \(Self.categoryLabel(b.categoryId))".lowercased()
        // 웹 overallScore 미러 (profitability 2회 가중 포함 — 기존 overallScore(_:) 와 동일식)
        let sum = b.scores.accessibility + b.scores.profitability + b.scores.profitability + b.scores.brandPower + b.scores.stability
        self.overall = Double(sum) / 5.0
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

/// 정렬 1회 — 큐레이션(편집 검증) 우선 → overall score 내림차순 (웹 franchiseBrandsAll 과 동일).
///   필터는 순서를 보존하므로 검색·카테고리 변경 시 재정렬 불필요 (성능 2026-08-19).
private let franchiseSortedBrands: [FranchiseBrandView] = franchiseSampleBrands.sorted { a, b in
    if a.isKftc != b.isKftc { return !a.isKftc }
    return a.overall > b.overall
}

/// 카테고리별 개수 — 1회 집계.
private let franchiseCategoryCounts: [String: Int] = {
    var counts: [String: Int] = ["all": franchiseSampleBrands.count]
    for b in franchiseSampleBrands { counts[b.categoryId, default: 0] += 1 }
    return counts
}()

/// 필터 계산 (순수 함수) — 정렬된 원본에서 카테고리·검색어만 적용.
private func filterFranchiseBrands(categoryId: String, query: String) -> [FranchiseBrandView] {
    let q = query.trimmingCharacters(in: .whitespaces).lowercased()
    return franchiseSortedBrands.filter { b in
        if categoryId != "all" && b.categoryId != categoryId { return false }
        if !q.isEmpty && !b.searchHaystack.contains(q) { return false }
        return true
    }
}

// MARK: - FranchiseView

public struct FranchiseView: View {

    @State private var selectedCategoryId: String = "all"
    @State private var searchQuery: String = ""
    @State private var selectedBrand: FranchiseBrandView?
    /// BudgetSetup 단계에서 프랜차이즈 비용 패널을 표시하기 위해 선택한 브랜드를 영속.
    @AppStorage("stage.franchise.selectedBrandId") private var selectedBrandIdStorage: String = ""

    /// 필터 결과 메모 — body 마다 재계산하지 않고 검색어(150ms 디바운스)·카테고리 변경 시에만 갱신.
    @State private var filteredBrands: [FranchiseBrandView] = franchiseSortedBrands
    /// 페이지네이션 — 20행씩 "더 보기" (2026-08-19 밀도 정리, 웹 FranchiseView 동일). 필터 변경 시 리셋.
    @State private var visibleCount: Int = franchisePageSize

    public init() {}

    private func categoryCount(_ id: String) -> Int { franchiseCategoryCounts[id] ?? 0 }

    private func recomputeFiltered() {
        filteredBrands = filterFranchiseBrands(categoryId: selectedCategoryId, query: searchQuery)
        visibleCount = franchisePageSize
    }

    public var body: some View {
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 풀스크린 Aurora 사용.
        ZStack {
            ScrollView {
                VStack(spacing: 0) {
                    // 공통 페이지 헤더 (2026-08-19 통일) — 검색 + 카테고리 칩은 accessory
                    BUPageHeader(
                        title: "프랜차이즈",
                        subtitle: "초기 비용 · 운영 난이도 · 폐점률",
                        accessory: {
                            VStack(alignment: .leading, spacing: 10) {
                                searchBar
                                categoryChips
                            }
                        }
                    )
                    VStack(alignment: .leading, spacing: 16) {
                        brandCards
                        disclaimerFootnote
                        Color.clear.frame(height: 110)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                }
            }
            .scrollIndicators(.hidden)
        }
        .sheet(item: $selectedBrand) { brand in
            FranchiseDetailSheet(brand: brand)
        }
        .onChange(of: selectedCategoryId) { _, _ in recomputeFiltered() }
        // 검색어 디바운스 150ms — 타이핑마다 1,600개 필터 방지 (id 변경 시 이전 task 자동 취소).
        .task(id: searchQuery) {
            let trimmed = searchQuery.trimmingCharacters(in: .whitespaces)
            if !trimmed.isEmpty {
                try? await Task.sleep(nanoseconds: 150_000_000)
                guard !Task.isCancelled else { return }
            }
            recomputeFiltered()
        }
    }

    // MARK: - Search (웹 SSOT FranchiseView 검색과 톤 통일 — 흰 배경·라운드·미드나잇 보더)

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.inkSubtle)
            TextField("브랜드 검색 (예: 교촌, BBQ, 메가커피)", text: $searchQuery)
                .font(.system(size: 14, weight: .regular))
                .foregroundStyle(BUColor.ink)
                .autocorrectionDisabled()
                #if os(iOS)
                .textInputAutocapitalization(.never)
                #endif
                .submitLabel(.search)
            if !searchQuery.isEmpty {
                Button {
                    searchQuery = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(BUColor.inkSubtle)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
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
        // 헤더 accessory 안에서 화면 가장자리까지 스크롤 (헤더 H 패딩 20 상쇄 + 콘텐츠 마진 복원)
        .padding(.horizontal, -20)
        .contentMargins(.horizontal, 20, for: .scrollContent)
    }

    // MARK: - Brand cards (vertical stack — mobile 1-col)

    private var brandCards: some View {
        // 공정위 자동 브랜드 합류로 최대 ~1,600개 → LazyVStack + 20행 페이지네이션.
        let shown = filteredBrands.prefix(visibleCount)
        return LazyVStack(spacing: 8) {
            ForEach(shown) { brand in
                FranchiseBrandCard(brand: brand) {
                    selectedBrand = brand
                    selectedBrandIdStorage = brand.id
                }
            }

            if filteredBrands.count > shown.count {
                Button {
                    withAnimation { visibleCount += franchisePageSize }
                } label: {
                    HStack(spacing: 5) {
                        Text("더 보기 \(min(franchisePageSize, filteredBrands.count - shown.count))개 (\(shown.count)/\(filteredBrands.count))")
                            .font(.system(size: 13, weight: .heavy))
                        Image(systemName: "chevron.down")
                            .font(.system(size: 11, weight: .heavy))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .frame(maxWidth: .infinity, minHeight: BUSpacing.minTapTarget)
                    .background(Color.white.opacity(0.72), in: Capsule())
                    .overlay(Capsule().strokeBorder(BUColor.cardBorder, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .padding(.top, 4)
            }

            if filteredBrands.isEmpty {
                Text(searchQuery.trimmingCharacters(in: .whitespaces).isEmpty
                     ? "이 카테고리에 등록된 프랜차이즈가 없습니다."
                     : "'\(searchQuery.trimmingCharacters(in: .whitespaces))' 검색 결과가 없습니다.")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            }
        }
    }

    // MARK: - Disclaimer footnote (한 줄 — 2026-08-19 밀도 정리; 상세 검증 항목은 상세 시트 정직성 푸터)

    private var disclaimerFootnote: some View {
        HStack(alignment: .top, spacing: 6) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.warn.opacity(0.8))
                .padding(.top, 2)
            Text("비교 예시 데이터 — 계약 전 공정위 정보공개서(franchise.ftc.go.kr)로 본사명·점포수·매출·폐점률(20%+ 위험) 직접 확인")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.75))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.top, 4)
    }
}

// MARK: - URL identifiable (for sheet binding)

extension URL: @retroactive Identifiable {
    public var id: String { absoluteString }
}

/// 목록 페이지 크기 — 20행씩 "더 보기" (웹 FranchiseView PAGE_SIZE 동일)
private let franchisePageSize = 20

// MARK: - Overall score (5-bar 평균 — 웹 computeOverallScore 미러)

private func overallScore(_ b: FranchiseBrandView) -> Double { b.overall }

// MARK: - Brand card

private struct FranchiseBrandCard: View {
    let brand: FranchiseBrandView
    let onTapInfoDisclosure: () -> Void

    // 2026-08-19 밀도 정리: 컴팩트 한 줄 행(브랜드 · 카테고리 · 종합 · 초기비용 · 폐점률 + chevron).
    //   2×2 지표 그리드 + 5 점수 바는 상세 시트(FranchiseDetailSheet)에 이미 존재 → 카드에서 제거.
    var body: some View {
        Button(action: onTapInfoDisclosure) {
            HStack(alignment: .center, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 5) {
                        Text(brand.name)
                            .font(.system(size: 15, weight: .bold))
                            .tracking(-0.3)
                            .foregroundStyle(BUColor.ink)
                            .lineLimit(1)
                        Text(brand.category)
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(BUColor.midnight.opacity(0.06), in: Capsule())
                        if brand.isKftc {
                            Text("공정위")
                                .font(.system(size: 9.5, weight: .heavy))
                                .foregroundStyle(BUColor.midnight.opacity(0.7))
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.06), in: Capsule())
                        }
                    }
                    HStack(spacing: 8) {
                        metric("초기", formatTotalCost(brand.totalInitialManwon))
                        metric("폐점률", brand.closureRatePct.map { String(format: "%.1f%%", $0) } ?? "-",
                               tint: brand.closureRatePct.map { $0 >= 20 ? BUColor.danger : $0 >= 10 ? BUColor.warn : BUColor.ink } ?? BUColor.ink)
                    }
                }
                Spacer(minLength: 6)
                VStack(alignment: .trailing, spacing: 1) {
                    Text(String(format: "%.0f", brand.overall))
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(scoreColor(Int(brand.overall)))
                        .monospacedDigit()
                    Text("종합")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                }
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.6))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(minHeight: BUSpacing.minTapTarget)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color.white.opacity(0.72))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
            .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func metric(_ label: String, _ value: String, tint: Color = BUColor.ink) -> some View {
        HStack(spacing: 3) {
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
            Text(value)
                .font(.system(size: 11.5, weight: .bold))
                .foregroundStyle(tint)
                .monospacedDigit()
                .lineLimit(1)
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

                        // 핵심 지표 4 (손큐레이션 — 참고)
                        if brand.avgRevenueOku != nil || brand.closureRatePct != nil || brand.storeCount != nil {
                            officialStatsBlock
                        }

                        // 공정위 공식 통계 (data.go.kr 15110241) — 매칭된 브랜드만
                        if brand.officialStats != nil {
                            kftcOfficialBlock
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

    @ViewBuilder
    private var kftcOfficialBlock: some View {
        if let os = brand.officialStats {
            let net = os.newOpenings - os.terminations - os.cancellations
            VStack(alignment: .leading, spacing: 10) {
                Text("공정위 공식 통계 · \(os.year)년")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.midnight.opacity(0.8))
                HStack(spacing: 8) {
                    statTile(label: "가맹점수 (전국)", value: "\(os.storeCount.formatted())개", tint: BUColor.midnight)
                    statTile(label: "그해 신규개점", value: "+\(os.newOpenings.formatted())")
                    statTile(label: "순증감",
                             value: "\(net > 0 ? "+" : "")\(net.formatted())",
                             tint: net > 0 ? BUColor.success : net < 0 ? BUColor.danger : BUColor.ink)
                }
                if os.avgSalesWon != nil || os.avgSalesPerAreaWon != nil {
                    HStack(spacing: 8) {
                        if let s = os.avgSalesWon {
                            statTile(label: "점당 연매출", value: String(format: "%.1f억", Double(s) / 10_000.0), tint: BUColor.midnight)
                        }
                        if let a = os.avgSalesPerAreaWon {
                            statTile(label: "3.3㎡당 매출", value: "\(a.formatted())만")
                        }
                        statTile(label: "그해 계약종료", value: "\(os.terminations.formatted())개")
                    }
                }
                Text("공정거래위원회 정보공개서 기준 실데이터. 위 참고 수치와 연도·집계 기준이 다를 수 있습니다.")
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(BUSpacing.cardPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(BUColor.midnight.opacity(0.04)))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.15), lineWidth: 1))
        }
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
                costRow(label: "로열티",         value: brand.royaltyLabel)
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
