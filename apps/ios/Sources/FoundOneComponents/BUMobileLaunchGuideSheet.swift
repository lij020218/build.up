//
//  BUMobileLaunchGuideSheet.swift — 모바일 앱 출시 상세 가이드 팝업 (웹 SSOT 미러)
//
//  Apple Developer 가입 → Xcode/SDK → TestFlight → 메타데이터 → 심사 → 출시,
//  Google Play 전체 절차, 한국 특화·2026 공통 필수까지 단계별로 보여주는 시트.
//  go-live 단계에서 "📖 앱 출시 상세 가이드" 버튼으로 호출.
//
//  디자인: Found.One 시스템 — 라벤더-미스트 표면 + 미드나잇 네이비 액센트 + Apple 미니멀.
//  세그먼트는 시스템 기본 Picker 대신 matchedGeometryEffect 미드나잇 pill (웹 BuildMethodDialog 톤 일치).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

public struct BUMobileLaunchGuideSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var tab = 0

    public init() {}

    private var guide: BUMobileLaunchGuide? { StartupToolingRegistry.mobileLaunchGuide }

    private let tabTitles = ["App Store", "Google Play", "한국·공통"]

    public var body: some View {
        NavigationStack {
            ZStack {
                // 라벤더-미스트 표면 (heroGradient 135deg) — 시스템 흰 배경 대신.
                LinearGradient(
                    stops: [
                        .init(color: BUColor.heroGradientStart, location: 0.0),
                        .init(color: BUColor.heroGradientMid,   location: 0.5),
                        .init(color: BUColor.heroGradientEnd,   location: 1.0),
                    ],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        BULaunchGuideTabs(selection: $tab, titles: tabTitles)
                            .padding(.top, 2)

                        if let guide {
                            switch tab {
                            case 0:
                                sectionIntro("Apple App Store — 가입부터 출시까지", "$99/년 · 신규 심사 2~5일 · iOS 26 SDK 의무(2026-04-28~)")
                                ForEach(guide.apple) { stepCard($0) }
                            case 1:
                                sectionIntro("Google Play — 가입부터 출시까지", "$25 일회성 · 개인계정 12명×14일 테스트 · 2026-09 신원확인 의무")
                                ForEach(guide.google) { stepCard($0) }
                            default:
                                sectionIntro("한국 특화 · 양 스토어 공통 2026", "사업자·게임등급·결제 + DSA·연령등급·신원확인")
                                ForEach(guide.crossCutting) { noteCard($0) }
                                ForEach(guide.korea) { noteCard($0) }
                            }
                        } else {
                            Text("가이드를 불러오지 못했어요.")
                                .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                        }

                        footerNote
                    }
                    .padding(BUSpacing.md)
                    .animation(.easeInOut(duration: 0.22), value: tab)
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("앱 출시 상세 가이드")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.midnight)
                }
            }
        }
    }

    // 출처·시점 주의 — 옅은 미드나잇 박스 (신호등 색 미사용)
    private var footerNote: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.circle")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .padding(.top, 1)
            Text("정책은 수시로 바뀝니다. 출시 직전 각 스토어 공식 페이지에서 최신 요건을 재확인하세요.")
                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
                .fill(BUColor.midnight08)
        )
        .padding(.top, 4)
    }

    private func sectionIntro(_ title: String, _ sub: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
            Text(sub).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
        }
        .padding(.top, 2)
    }

    private func stepCard(_ s: BULaunchStep) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                HStack(alignment: .top, spacing: 8) {
                    ZStack {
                        Circle().fill(BUColor.midnight).frame(width: 24, height: 24)
                        Text("\(s.step)").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                        Text(s.time).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    }
                }
                Text(s.detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(s.todo, id: \.self) { t in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "checkmark.circle").font(.system(size: 11)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                            Text(t).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
                if !s.links.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(s.links, id: \.url) { link in
                            if let url = URL(string: link.url) {
                                Link(destination: url) {
                                    HStack(spacing: 4) {
                                        Text(link.name).font(.system(size: 11, weight: .semibold))
                                        Image(systemName: "arrow.up.right").font(.system(size: 9))
                                    }.foregroundStyle(BUColor.midnight)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private func noteCard(_ n: BULaunchNote) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 5) {
                Text(n.title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                Text(n.body).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                if let link = n.link, let url = URL(string: link.url) {
                    Link(destination: url) {
                        HStack(spacing: 4) {
                            Text(link.name).font(.system(size: 11, weight: .semibold))
                            Image(systemName: "arrow.up.right").font(.system(size: 9))
                        }.foregroundStyle(BUColor.midnight)
                    }
                }
            }
        }
    }
}

// MARK: - 커스텀 세그먼트 — 미드나잇 pill (matchedGeometryEffect 슬라이드)

private struct BULaunchGuideTabs: View {
    @Binding var selection: Int
    let titles: [String]
    @Namespace private var ns

    var body: some View {
        HStack(spacing: 4) {
            ForEach(titles.indices, id: \.self) { i in
                let active = selection == i
                Button {
                    withAnimation(.spring(response: 0.32, dampingFraction: 0.86)) { selection = i }
                } label: {
                    Text(titles[i])
                        .font(.system(size: 13, weight: active ? .bold : .medium))
                        .foregroundStyle(active ? Color.white : BUColor.inkSecondary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 9)
                        .background {
                            if active {
                                Capsule(style: .continuous)
                                    .fill(BUColor.midnight)
                                    .matchedGeometryEffect(id: "launchTabPill", in: ns)
                            }
                        }
                        .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(titles[i])
                .accessibilityAddTraits(active ? [.isButton, .isSelected] : .isButton)
            }
        }
        .padding(4)
        .background(
            Capsule(style: .continuous).fill(BUColor.surfaceElevated.opacity(0.7))
        )
        .overlay(
            Capsule(style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }
}
