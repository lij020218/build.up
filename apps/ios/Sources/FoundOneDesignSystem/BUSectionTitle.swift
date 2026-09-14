//
//  BUSectionTitle.swift — 섹션 제목과 행 구분선 (2026-09-12).
//
//  사장님이 고른 미리보기 화면의 두 가지 뼈대를 공용으로 올린 것:
//
//   1) 섹션 제목은 **카드 밖**에 둔다.
//      종전에는 제목이 카드 안 작은 회색 eyebrow 였다(`ACCOUNT · 계정` 같은 영문 병기 포함).
//      제목을 밖으로 빼면 카드는 "내용"만 담고, 훑을 때 제목만 읽어도 화면 구조가 잡힌다.
//
//   2) 카드 안에서 항목을 나눌 때는 **회색 블록이 아니라 헤어라인**을 쓴다.
//      옅은 회색 면을 카드 안에 또 깔면 그게 "카드 안의 카드"로 읽힌다.
//      0.5pt 선 하나면 충분하고, 흰 면이 이어져 훨씬 가볍다.
//

import SwiftUI

/// 섹션 제목 — 한국어 한 줄. 영문 eyebrow 병기 없음.
///  오른쪽 `action` 은 그 섹션에 대한 동작 하나만(예: "기록", "전체 보기").
public struct BUSectionTitle: View {

    private let text: String
    private let actionLabel: String?
    private let action: (() -> Void)?

    public init(_ text: String, actionLabel: String? = nil, action: (() -> Void)? = nil) {
        self.text = text
        self.actionLabel = actionLabel
        self.action = action
    }

    public var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(text)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(BUColor.ink)
            Spacer(minLength: 8)
            if let actionLabel {
                actionView(actionLabel)
            }
        }
        .padding(.horizontal, 4)
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isHeader)
    }

    @ViewBuilder
    private func actionView(_ label: String) -> some View {
        if let action {
            Button(action: action) { actionText(label) }
                .buttonStyle(.plain)
        } else {
            actionText(label)
        }
    }

    private func actionText(_ label: String) -> some View {
        Text(label)
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(BUColor.midnightInk)
    }
}

/// 카드 안 행 구분선 — 0.5pt.
///  `inset` 은 왼쪽에 아이콘·타일이 있을 때 그 폭만큼 들여쓰기 위한 값(애플 리스트와 같은 규칙).
public struct BUHairline: View {

    private let inset: CGFloat

    public init(inset: CGFloat = 0) {
        self.inset = inset
    }

    public var body: some View {
        Rectangle()
            .fill(BUColor.ink.opacity(0.08))
            .frame(height: 0.5)
            .padding(.leading, inset)
            .accessibilityHidden(true)
    }
}
