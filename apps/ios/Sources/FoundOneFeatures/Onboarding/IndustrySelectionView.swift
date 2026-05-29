//
//  IndustrySelectionView.swift — 업종(카테고리) 선택 화면 (로드맵 stage 1)
//
//  웹 SSOT: starter-data.ts 의 starterIndustryCategories + stage "industry-selection"
//
//  모바일 최적화:
//   • 데스크탑 grid (auto-fit) → 모바일 2-column grid
//   • 카테고리 12개 (외식·카페·미용·소매·이커머스·피트니스·학원·펫·생활·공간·스타트업·일반)
//   • 카드 탭 → 즉시 store.setProfile(category:) + onComplete 콜백
//
//  Apple 디자인 톤:
//   • 미드나이트 단색 (색 분리 X)
//   • 선택 시 강조: 미드나이트 border + soft tint
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

public struct IndustrySelectionView: View {

    /// 사용자가 카테고리 선택 시 호출. 호출자가 store.setProfile() 처리.
    let onSelect: (IndustryCategory) -> Void
    /// 뒤로가기 (OnboardingChoiceView 로 돌아가기)
    let onBack: () -> Void

    @State private var selected: IndustryCategory? = nil

    public init(
        onSelect: @escaping (IndustryCategory) -> Void,
        onBack: @escaping () -> Void
    ) {
        self.onSelect = onSelect
        self.onBack = onBack
    }

    // 표시 순서 — offline 먼저 (사장님 다수), 그 다음 디지털·일반
    private static let categoryOrder: [IndustryCategory] = [
        .restaurant, .cafe, .beauty, .fitness,
        .education, .pet, .retail, .livingService,
        .space, .ecommerce, .startupTech, .general,
    ]

    public var body: some View {
        ZStack {
            BUBackgroundSurface()

            VStack(spacing: 0) {
                topBar
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 14) {
                        headerSection

                        // 2-column grid
                        LazyVGrid(
                            columns: [
                                GridItem(.flexible(), spacing: 10),
                                GridItem(.flexible(), spacing: 10),
                            ],
                            spacing: 10
                        ) {
                            ForEach(Self.categoryOrder, id: \.self) { category in
                                CategoryCard(
                                    category: category,
                                    selected: selected == category
                                ) {
                                    #if canImport(UIKit)
                                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                                    #endif
                                    selected = category
                                }
                            }
                        }
                        .padding(.horizontal, BUSpacing.md)

                        Color.clear.frame(height: 100) // 하단 CTA 여백
                    }
                    .padding(.top, 18)
                }

                // ── 하단 CTA ──
                if selected != nil {
                    ctaBar
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(.spring(response: 0.4, dampingFraction: 0.85), value: selected)
        }
    }

    // MARK: - Sections

    private var topBar: some View {
        HStack(spacing: 12) {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(BUColor.midnightInk)
                    .frame(width: 36, height: 36)
                    .background(BUColor.midnight.opacity(0.06), in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("뒤로")

            Text("1 / 17")
                .font(.system(size: 11.5, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .tracking(0.5)
                .padding(.horizontal, 9)
                .padding(.vertical, 4)
                .background(BUColor.midnight.opacity(0.06), in: Capsule())

            Spacer(minLength: 0)
        }
        .padding(.horizontal, BUSpacing.md)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                Image(systemName: "list.bullet")
                    .font(.system(size: 10, weight: .semibold))
                Text("STEP 1 · 업종 선택")
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(1.4)
            }
            .foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(BUColor.midnight.opacity(0.06), in: Capsule())

            Text("어떤 사업을 하실 건가요?")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
                .tracking(-0.72)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text("선택한 업종에 따라 로드맵 단계·공급처·메뉴 가이드가 자동으로 맞춰집니다.")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, BUSpacing.md)
    }

    private var ctaBar: some View {
        VStack(spacing: 0) {
            Divider().opacity(0.4)

            Button {
                guard let cat = selected else { return }
                #if canImport(UIKit)
                UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
                #endif
                onSelect(cat)
            } label: {
                HStack(spacing: 8) {
                    Text("\(selected?.labelKo ?? "") 로 계속")
                        .font(.system(size: 15, weight: .heavy))
                        .tracking(-0.3)
                    Image(systemName: "arrow.right")
                        .font(.system(size: 13, weight: .bold))
                }
                .foregroundStyle(.white)
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity)
                .background(
                    LinearGradient(
                        colors: [BUColor.primaryButtonStart, BUColor.primaryButtonEnd],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                )
                .shadow(color: BUColor.primaryButtonStart.opacity(0.25), radius: 14, x: 0, y: 6)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, 10)
            .padding(.bottom, 24)
        }
        .background(.ultraThinMaterial)
    }
}

// MARK: - CategoryCard

private struct CategoryCard: View {
    let category: IndustryCategory
    let selected: Bool
    let action: () -> Void

    private var icon: String {
        switch category {
        case .restaurant:    return "fork.knife"
        case .cafe:          return "cup.and.saucer.fill"
        case .beauty:        return "scissors"
        case .retail:        return "bag.fill"
        case .ecommerce:     return "shippingbox.fill"
        case .fitness:       return "dumbbell.fill"
        case .education:     return "graduationcap.fill"
        case .pet:           return "pawprint.fill"
        case .livingService: return "sparkles"
        case .space:         return "building.2.fill"
        case .startupTech:   return "laptopcomputer"
        case .general:       return "questionmark.circle"
        }
    }

    private var hint: String {
        switch category {
        case .restaurant:    return "음식점·도시락·배달"
        case .cafe:          return "커피·디저트·베이커리"
        case .beauty:        return "헤어·네일·에스테틱"
        case .retail:        return "편의·라이프스타일"
        case .ecommerce:     return "스마트스토어·해외판매"
        case .fitness:       return "PT·필라테스·요가"
        case .education:     return "학원·과외·온라인 클래스"
        case .pet:           return "미용·호텔·용품"
        case .livingService: return "청소·세탁·수리"
        case .space:         return "스튜디오·게스트하우스"
        case .startupTech:   return "SaaS·앱·플랫폼"
        case .general:       return "아직 정하지 않음"
        }
    }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(selected ? BUColor.midnight.opacity(0.14) : BUColor.midnight.opacity(0.06))
                        .frame(width: 36, height: 36)
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .regular))
                        .foregroundStyle(BUColor.midnight)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(category.labelKo)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineLimit(1)
                    Text(hint)
                        .font(.system(size: 10.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
            }
            .padding(EdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12))
            .frame(maxWidth: .infinity, minHeight: 96, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(
                        selected
                            ? Color.white
                            : Color.white.opacity(0.94)
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(
                        selected ? BUColor.midnight : BUColor.midnight.opacity(0.10),
                        lineWidth: selected ? 1.8 : 0.8
                    )
            )
            .shadow(
                color: BUColor.midnight.opacity(selected ? 0.12 : 0.04),
                radius: selected ? 14 : 6,
                x: 0,
                y: selected ? 6 : 2
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("IndustrySelection") {
    IndustrySelectionView(
        onSelect: { print("선택: \($0.labelKo)") },
        onBack: { print("뒤로") }
    )
}
#endif
