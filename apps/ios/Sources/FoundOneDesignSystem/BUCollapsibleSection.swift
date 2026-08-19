//
//  BUCollapsibleSection.swift — 접이식 섹션 (웹 CollapsibleSection.tsx 미러)
//
//  2026-08-19 사장님 지시: 한 화면에 요소가 꽉 차는 현상 배제 → 세그먼트 + 접기.
//  헤더 한 줄(제목 + 요약 + chevron), 기본 접힘. 펼치면 content 가 아래에 붙는다.
//  카드 안에 카드가 들어가는 구조이므로 자체 배경은 outer 카드 톤 1장만.
//

import SwiftUI

public struct BUCollapsibleSection<Content: View>: View {

    let title: String
    let summary: String?
    let content: Content
    @State private var isExpanded: Bool

    public init(
        title: String,
        summary: String? = nil,
        isExpanded: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.summary = summary
        self._isExpanded = State(initialValue: isExpanded)
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.32, dampingFraction: 0.86)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack(spacing: 8) {
                    Text(title)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    if let summary, !summary.isEmpty {
                        Text(summary)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 4)
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }
                .padding(.horizontal, BUSpacing.cardPadding)
                .padding(.vertical, 14)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityAddTraits(.isButton)
            .accessibilityValue(isExpanded ? "펼침" : "접힘")

            if isExpanded {
                VStack(alignment: .leading, spacing: BUSpacing.shellGap) {
                    content
                }
                .padding(.horizontal, BUSpacing.cardPadding)
                .padding(.bottom, BUSpacing.cardPadding)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }
}
