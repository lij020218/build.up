//
//  ExistingStoreRegistrationView.swift — 이미 운영 중인 가게 빠른 등록
//
//  웹의 "이미 운영 중" 경로 대응. 모바일에선 최소 입력 3 필드 → 즉시 dashboard:
//    • 상호명 (필수)
//    • 업종 (필수, 11 카테고리)
//    • 개업일 (선택, daysSinceLaunch 계산용)
//
//  추가 데이터 (매출·비용)는 운영 대시보드 진입 후 점진적으로 입력.
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore

public struct ExistingStoreRegistrationView: View {

    let onComplete: (StoreRegistration) -> Void
    let onBack: () -> Void

    @State private var storeName: String = ""
    @State private var selectedCategory: IndustryCategory? = nil
    @State private var launchedDaysAgoText: String = ""
    @FocusState private var nameFocused: Bool

    public init(
        onComplete: @escaping (StoreRegistration) -> Void,
        onBack: @escaping () -> Void
    ) {
        self.onComplete = onComplete
        self.onBack = onBack
    }

    private var canSave: Bool {
        !storeName.trimmingCharacters(in: .whitespaces).isEmpty && selectedCategory != nil
    }

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
                    VStack(alignment: .leading, spacing: 18) {
                        headerSection

                        // 상호명
                        VStack(alignment: .leading, spacing: 8) {
                            label("상호명")
                            TextField("예: 사랑의 도시락", text: $storeName)
                                .focused($nameFocused)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled(true)
                                .font(.system(size: 15, weight: .semibold))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 13)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .strokeBorder(nameFocused ? BUColor.midnight : BUColor.midnight.opacity(0.12), lineWidth: nameFocused ? 1.5 : 0.8)
                                )
                        }

                        // 업종
                        VStack(alignment: .leading, spacing: 8) {
                            label("업종")
                            LazyVGrid(
                                columns: [
                                    GridItem(.flexible(), spacing: 8),
                                    GridItem(.flexible(), spacing: 8),
                                    GridItem(.flexible(), spacing: 8),
                                ],
                                spacing: 8
                            ) {
                                ForEach(Self.categoryOrder, id: \.self) { cat in
                                    categoryChip(cat)
                                }
                            }
                        }

                        // 개업일 (선택)
                        VStack(alignment: .leading, spacing: 8) {
                            label("개업한 지 며칠 됐어요? (선택)")
                            HStack(spacing: 8) {
                                TextField("예: 180", text: $launchedDaysAgoText)
                                    .keyboardType(.numberPad)
                                    .font(.system(size: 15, weight: .semibold))
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 13)
                                    .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 0.8)
                                    )
                                Text("일")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(BUColor.inkMuted)
                            }
                            Text("비워두면 0일 (오늘 개업)으로 설정됩니다.")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                        }

                        Color.clear.frame(height: 100)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, 12)
                }

                ctaBar
            }
        }
        .onAppear { nameFocused = true }
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
            Spacer(minLength: 0)
        }
        .padding(.horizontal, BUSpacing.md)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                Image(systemName: "storefront")
                    .font(.system(size: 10, weight: .semibold))
                Text("이미 운영 중 · 빠른 등록")
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(1.0)
            }
            .foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(BUColor.midnight.opacity(0.06), in: Capsule())

            Text("가게 정보만 알려주세요")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
                .tracking(-0.72)

            Text("매출·비용은 운영 대시보드에서 점진적으로 입력하면 됩니다.")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
        }
    }

    private func label(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.system(size: 10.5, weight: .heavy))
            .foregroundStyle(BUColor.midnight.opacity(0.7))
            .tracking(1.0)
    }

    private func categoryChip(_ cat: IndustryCategory) -> some View {
        let isSelected = selectedCategory == cat
        return Button {
            #if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            #endif
            selectedCategory = cat
        } label: {
            Text(cat.labelKo)
                .font(.system(size: 12.5, weight: isSelected ? .heavy : .semibold))
                .foregroundStyle(isSelected ? .white : BUColor.midnightInk)
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .frame(maxWidth: .infinity)
                .background(
                    isSelected ? BUColor.midnight : Color.white,
                    in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(
                            isSelected ? Color.clear : BUColor.midnight.opacity(0.10),
                            lineWidth: 0.8
                        )
                )
        }
        .buttonStyle(.plain)
    }

    private var ctaBar: some View {
        VStack(spacing: 0) {
            Divider().opacity(0.4)
            Button {
                guard canSave, let cat = selectedCategory else { return }
                #if canImport(UIKit)
                UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
                #endif
                onComplete(StoreRegistration(
                    storeName: storeName.trimmingCharacters(in: .whitespaces),
                    category: cat,
                    daysSinceLaunch: Int(launchedDaysAgoText) ?? 0
                ))
            } label: {
                Text("등록하고 운영 대시보드로")
                    .font(.system(size: 15, weight: .heavy))
                    .tracking(-0.3)
                    .foregroundStyle(.white)
                    .padding(.vertical, 14)
                    .frame(maxWidth: .infinity)
                    .background(
                        canSave
                            ? AnyShapeStyle(LinearGradient(
                                colors: [BUColor.primaryButtonStart, BUColor.primaryButtonEnd],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            : AnyShapeStyle(BUColor.midnight.opacity(0.18)),
                        in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                    )
                    .shadow(color: canSave ? BUColor.primaryButtonStart.opacity(0.25) : .clear, radius: 14, x: 0, y: 6)
            }
            .buttonStyle(.plain)
            .disabled(!canSave)
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, 10)
            .padding(.bottom, 24)
        }
        .background(.ultraThinMaterial)
    }
}

// MARK: - StoreRegistration payload

public struct StoreRegistration: Sendable, Hashable {
    public let storeName: String
    public let category: IndustryCategory
    public let daysSinceLaunch: Int

    public init(storeName: String, category: IndustryCategory, daysSinceLaunch: Int) {
        self.storeName = storeName
        self.category = category
        self.daysSinceLaunch = daysSinceLaunch
    }
}

// MARK: - Preview

#if DEBUG
#Preview("ExistingStoreRegistration") {
    ExistingStoreRegistrationView(
        onComplete: { reg in print("등록: \(reg)") },
        onBack: { print("뒤로") }
    )
}
#endif
