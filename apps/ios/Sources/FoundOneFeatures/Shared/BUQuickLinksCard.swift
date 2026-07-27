//
//  BUQuickLinksCard.swift — 외부 공식 사이트 바로가기 카드 (2026-07-24 사장님 지시)
//
//  웹 SSOT: apps/web/app/lib/components/ui/ExternalQuickLinks.tsx 완전 미러.
//  세금(홈택스)·직원(구인구직) 등 "다음 행동"이 외부 공식 사이트일 때 일관 pill 링크.
//  URL 정책: 공식 자사 도메인만. primary 1개=미드나잇 채움, 나머지=아웃라인.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents

public struct BUQuickLink: Identifiable {
    public var id: String { url }
    public let label: String
    public let url: String
    public var isPrimary: Bool = false
    public var badge: String? = nil

    public init(label: String, url: String, isPrimary: Bool = false, badge: String? = nil) {
        self.label = label; self.url = url; self.isPrimary = isPrimary; self.badge = badge
    }
}

public struct BUQuickLinksCard: View {
    let title: String
    let caption: String?
    let links: [BUQuickLink]
    /// 우측 상단 보조 액션 (예: "당근으로 구하는 법 →" 가이드 시트 트리거) — 웹 ExternalQuickLinks.action 미러 (2026-07-25)
    let actionLabel: String?
    let onAction: (() -> Void)?

    public init(title: String, caption: String? = nil, links: [BUQuickLink], actionLabel: String? = nil, onAction: (() -> Void)? = nil) {
        self.title = title; self.caption = caption; self.links = links
        self.actionLabel = actionLabel; self.onAction = onAction
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top, spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                            .textCase(.uppercase)
                            .kerning(0.8)
                        if let caption {
                            Text(caption)
                                .font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    if let actionLabel, let onAction {
                        Spacer(minLength: 0)
                        Button(action: onAction) {
                            Text(actionLabel)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(BUColor.midnight)
                        }
                        .buttonStyle(.plain)
                    }
                }
                // pill wrap — 짧은 목록이라 수동 flow (4개/줄 내외)
                FlowChips(links: links)
            }
        }
    }
}

/// 링크 pill 줄바꿈 배치 — 자연 폭 + 한 줄 고정 (2026-07-27 사장님 피드백:
/// LazyVGrid 균등 폭이 라벨·배지를 여러 줄로 꺾던 문제 → BUWrapLayout, 웹 flex-wrap 정합).
private struct FlowChips: View {
    let links: [BUQuickLink]
    var body: some View {
        BUWrapLayout(spacing: 8) {
            ForEach(links) { l in
                if let url = URL(string: l.url) {
                    Link(destination: url) { chip(l) }
                }
            }
        }
    }

    @ViewBuilder
    private func chip(_ l: BUQuickLink) -> some View {
        HStack(spacing: 6) {
            Text(l.label)
                .font(.system(size: l.isPrimary ? 13.5 : 13, weight: l.isPrimary ? .bold : .semibold))
                .lineLimit(1)
            if let badge = l.badge {
                Text(badge)
                    .font(.system(size: 9.5, weight: .heavy))
                    .lineLimit(1)
                    .padding(.horizontal, 6).padding(.vertical, 1.5)
                    .background(
                        (l.isPrimary ? Color.white.opacity(0.18) : BUColor.midnight.opacity(0.08)),
                        in: Capsule()
                    )
            }
            Image(systemName: "arrow.up.right")
                .font(.system(size: 10, weight: .semibold)).opacity(0.75)
        }
        .foregroundStyle(l.isPrimary ? Color.white : BUColor.ink)
        .padding(.horizontal, l.isPrimary ? 15 : 13).padding(.vertical, 9)
        .fixedSize()
        .background(
            l.isPrimary ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.midnight.opacity(0.04)),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(l.isPrimary ? Color.clear : BUColor.midnight.opacity(0.16), lineWidth: 1)
        )
    }
}
