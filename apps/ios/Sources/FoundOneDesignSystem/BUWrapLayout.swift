//
//  BUWrapLayout.swift — 자연 폭 줄바꿈 flow 레이아웃 (2026-07-27)
//
//  배경: LazyVGrid(adaptive) 는 셀을 균등 폭으로 짓눌러 pill 라벨("당근알바")과
//  배지("정부·무료")가 어색하게 여러 줄로 꺾였다(사장님 스크린샷 피드백).
//  각 자식을 고유 크기 그대로 두고, 폭이 넘치면 다음 줄로 — 웹 flex-wrap 과 동일 거동.
//  사용처: BUQuickLinksCard 등 가변 폭 칩/pill 나열.
//

import SwiftUI

public struct BUWrapLayout: Layout {
    var spacing: CGFloat

    public init(spacing: CGFloat = 8) {
        self.spacing = spacing
    }

    public func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var usedWidth: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width
            usedWidth = max(usedWidth, x)
            x += spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: proposal.width ?? usedWidth, height: y + rowHeight)
    }

    public func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let maxWidth = bounds.width
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            sub.place(
                at: CGPoint(x: bounds.minX + x, y: bounds.minY + y),
                anchor: .topLeading,
                proposal: ProposedViewSize(size)
            )
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
