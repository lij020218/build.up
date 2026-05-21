//
//  BUWizardPageNav.swift — Stage view 안에서 페이지 단위 본문을 넘기는 nav + page wrapper (iOS).
//
//  웹 SSOT: apps/web/app/lib/components/stages/startup/StartupStageShell.tsx
//           → StartupPageNav (line 291–388)
//
//  구조 (좌→우):
//   ① 「이전 ←」 버튼 (outline)
//   ② 가운데 chip 가로 스크롤 — 선택된 label 은 midnight bg + 흰 텍스트
//   ③ 「다음 →」 버튼 (마지막 페이지 시 disabled, 외엔 midnight bg)
//
//  Apple HIG 44pt 터치 타겟 준수.
//

import SwiftUI
import BuildUpDesignSystem

public struct BUWizardPageNav: View {

    public let page: Int
    public let totalPages: Int
    public let labels: [String]
    public let onChange: (Int) -> Void

    public init(
        page: Int,
        totalPages: Int,
        labels: [String],
        onChange: @escaping (Int) -> Void
    ) {
        self.page = page
        self.totalPages = totalPages
        self.labels = labels
        self.onChange = onChange
    }

    public var body: some View {
        HStack(spacing: 8) {
            prevButton
            chipsScroll
            nextButton
        }
    }

    // MARK: - Prev

    private var prevButton: some View {
        let disabled = page == 0
        return Button {
            if !disabled { onChange(page - 1) }
        } label: {
            HStack(spacing: 3) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 10, weight: .heavy))
                Text("이전")
                    .font(.system(size: 13, weight: .heavy))
            }
            .foregroundStyle(disabled ? BUColor.ink.opacity(0.2) : BUColor.ink)
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .frame(minHeight: 44)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(disabled ? Color.black.opacity(0.02) : Color.white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }

    // MARK: - Chips (가로 스크롤)

    private var chipsScroll: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(Array(labels.enumerated()), id: \.offset) { i, label in
                    chipButton(index: i, label: label)
                }
            }
            .padding(.horizontal, 2)
        }
        .frame(maxWidth: .infinity)
    }

    private func chipButton(index: Int, label: String) -> some View {
        let selected = index == page
        return Button {
            onChange(index)
        } label: {
            Text(label)
                .font(.system(size: 11.5, weight: selected ? .heavy : .medium))
                .foregroundStyle(selected ? Color.white : BUColor.ink.opacity(0.4))
                .lineLimit(1)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .frame(minHeight: 32)
                .background(
                    selected ? BUColor.midnight : Color.clear,
                    in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Next

    private var nextButton: some View {
        let disabled = page == totalPages - 1
        return Button {
            if !disabled { onChange(page + 1) }
        } label: {
            HStack(spacing: 3) {
                Text("다음")
                    .font(.system(size: 13, weight: .heavy))
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .heavy))
            }
            .foregroundStyle(disabled ? BUColor.ink.opacity(0.2) : Color.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .frame(minHeight: 44)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(disabled ? Color.black.opacity(0.02) : BUColor.midnight)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(disabled ? BUColor.midnight.opacity(0.16) : Color.clear, lineWidth: 1)
            )
            .shadow(
                color: disabled ? .clear : BUColor.midnight.opacity(0.25),
                radius: 8, x: 0, y: 4
            )
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }
}

// MARK: - BUStagePages — 페이지 정의 + 자동 swap wrapper
//
// 사용:
//   BUStagePages(labels: ["왜", "정의", "검증"], page: $page) {
//       Group {
//           switch page {
//           case 0: whyView
//           case 1: defineView
//           default: verifyView
//           }
//       }
//   }
//

public struct BUStagePages<Content: View>: View {
    public let labels: [String]
    @Binding public var page: Int
    @ViewBuilder public let content: () -> Content

    public init(
        labels: [String],
        page: Binding<Int>,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.labels = labels
        self._page = page
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if labels.count > 1 {
                BUWizardPageNav(
                    page: page,
                    totalPages: labels.count,
                    labels: labels,
                    onChange: { newPage in
                        withAnimation(.easeInOut(duration: 0.22)) { page = newPage }
                    }
                )
            }
            content()
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

#if DEBUG
#Preview("BUWizardPageNav") {
    struct Demo: View {
        @State var page = 0
        var body: some View {
            VStack(spacing: 24) {
                BUWizardPageNav(
                    page: page,
                    totalPages: 3,
                    labels: ["왜 중요한가", "페르소나 정의", "검증"],
                    onChange: { newValue in withAnimation { page = newValue } }
                )
                Text("Page \(page)")
            }
            .padding()
        }
    }
    return Demo()
}
#endif
