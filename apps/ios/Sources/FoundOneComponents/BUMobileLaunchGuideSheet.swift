//
//  BUMobileLaunchGuideSheet.swift — 모바일 앱 출시 상세 가이드 팝업 (웹 SSOT 미러)
//
//  Apple Developer 가입 → Xcode/SDK → TestFlight → 메타데이터 → 심사 → 출시,
//  Google Play 전체 절차, 한국 특화·2026 공통 필수까지 단계별로 보여주는 시트.
//  go-live 단계에서 "📖 앱 출시 상세 가이드" 버튼으로 호출.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

public struct BUMobileLaunchGuideSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var tab = 0

    public init() {}

    private var guide: BUMobileLaunchGuide? { StartupToolingRegistry.mobileLaunchGuide }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    Picker("", selection: $tab) {
                        Text("🍎 App Store").tag(0)
                        Text("🤖 Google Play").tag(1)
                        Text("🇰🇷 한국·공통").tag(2)
                    }
                    .pickerStyle(.segmented)

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

                    Text("⚠️ 정책은 수시로 바뀝니다. 출시 직전 각 스토어 공식 페이지에서 최신 요건을 재확인하세요.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                        .padding(.top, 4)
                }
                .padding(BUSpacing.md)
            }
            .navigationTitle("앱 출시 상세 가이드")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                }
            }
        }
    }

    private func sectionIntro(_ title: String, _ sub: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
            Text(sub).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
        }
    }

    private func stepCard(_ s: BULaunchStep) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                HStack(alignment: .top, spacing: 8) {
                    ZStack {
                        Circle().fill(BUColor.midnight.opacity(0.1)).frame(width: 24, height: 24)
                        Text("\(s.step)").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.midnight)
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
