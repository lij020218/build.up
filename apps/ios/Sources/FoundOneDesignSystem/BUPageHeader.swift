//
//  BUPageHeader.swift — 메인 탭/화면 공통 페이지 헤더 (2026-08-19)
//
//  사장님 지시: 탭마다 제각각이던 상단(웹식 eyebrow · 센터 내비 타이틀 · 히어로 혼재)을
//  하나의 애플 스타일 헤더로 통일. 미니멀 · 여백 · 타이포만.
//
//   ┌ title (30 / bold / -0.6)                       [trailing 34pt 원형 버튼] ┐
//   │ subtitle (13.5 / medium / inkMuted, 2줄)                                 │
//   │ accessory (세그먼트 · 칩 · 검색 등, 12pt 아래)                            │
//   └ padding: H 20 · top 8 · bottom 14 · 배경 투명(Aurora 비침) · 구분선 없음 ┘
//
//  ⚠️ 페이지 최상단 전용. 카드 내부 섹션 라벨(BUCard eyebrow)·푸시된 stage 셸(BUStageShell)은
//     이 컴포넌트를 쓰지 않는다.
//

import SwiftUI

// MARK: - BUPageHeader

public struct BUPageHeader<Trailing: View, Accessory: View>: View {
    private let title: String
    private let subtitle: String?
    private let trailing: Trailing
    private let accessory: Accessory

    public init(
        title: String,
        subtitle: String? = nil,
        @ViewBuilder trailing: () -> Trailing = { EmptyView() },
        @ViewBuilder accessory: () -> Accessory = { EmptyView() }
    ) {
        self.title = title
        self.subtitle = subtitle
        self.trailing = trailing()
        self.accessory = accessory()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline, spacing: 12) {
                Text(title)
                    .font(.system(size: 30, weight: .bold))
                    .tracking(-0.6)
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Spacer(minLength: 0)
                trailing
            }

            if let subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(.system(size: 13.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineLimit(1)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 4)
            }

            accessory
                .padding(.top, 12)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 14)
    }
}

// MARK: - BUHeaderIconButton (trailing 슬롯용 — 벨 · 그리드 · 플러스 · 사람)

public struct BUHeaderIconButton: View {
    private let systemName: String
    private let badge: Int
    private let accessibilityLabel: String?
    private let action: () -> Void

    /// - Parameters:
    ///   - badge: 0보다 크면 우상단 네이비 카운트 배지 (알림 벨 등). 기본 0 = 없음.
    public init(
        systemName: String,
        badge: Int = 0,
        accessibilityLabel: String? = nil,
        action: @escaping () -> Void
    ) {
        self.systemName = systemName
        self.badge = badge
        self.accessibilityLabel = accessibilityLabel
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: systemName)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                    .frame(width: 34, height: 34)
                    .background(BUColor.surfaceElevated, in: Circle())
                    .overlay(Circle().strokeBorder(BUColor.cardBorder, lineWidth: 1))
                if badge > 0 {
                    Text(badge > 9 ? "9+" : "\(badge)")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 4)
                        .frame(minWidth: 15, minHeight: 15)
                        .background(BUColor.midnight, in: Capsule())
                        .overlay(Capsule().strokeBorder(BUColor.surfaceElevated, lineWidth: 1.5))
                        .offset(x: 4, y: -3)
                }
            }
            .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabel ?? systemName)
    }
}

// MARK: - BUSegmentedControl (헤더 accessory 표준 세그먼트 — 보고서 일/주/월/분기 · 마케팅 탭 등)

public struct BUSegmentItem<ID: Hashable>: Identifiable {
    public let id: ID
    public let label: String
    /// 우측 작은 경고 점 (예: 장부 저지출) — 신호등 색이 아닌 danger 토큰 1종만.
    public let showsDot: Bool

    public init(id: ID, label: String, showsDot: Bool = false) {
        self.id = id
        self.label = label
        self.showsDot = showsDot
    }
}

/// 트랙형 세그먼트 — 선택 = 미드나잇 네이비 채움(2026-08-03 사장님 결정, 웹 pill 세그먼트 패리티),
/// 비선택 = 투명, 각 세그먼트 등폭. 헤더 accessory 슬롯 폭에 맞춰 늘어난다.
public struct BUSegmentedControl<ID: Hashable>: View {
    private let items: [BUSegmentItem<ID>]
    @Binding private var selection: ID

    public init(items: [BUSegmentItem<ID>], selection: Binding<ID>) {
        self.items = items
        self._selection = selection
    }

    public var body: some View {
        HStack(spacing: 4) {
            ForEach(items) { item in
                let selected = selection == item.id
                Button {
                    withAnimation(.easeInOut(duration: 0.15)) { selection = item.id }
                } label: {
                    HStack(spacing: 5) {
                        Text(item.label)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(selected ? Color.white : BUColor.inkMuted)
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                        if item.showsDot {
                            Circle().fill(BUColor.danger).frame(width: 6, height: 6)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 34)
                    .background(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(selected ? BUColor.midnight : Color.clear)
                    )
                    .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected ? [.isSelected] : [])
            }
        }
        .padding(4)
        .background(BUColor.ink.opacity(0.045), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
