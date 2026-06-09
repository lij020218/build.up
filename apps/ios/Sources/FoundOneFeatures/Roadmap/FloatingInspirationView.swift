//
//  FloatingInspirationView.swift — AI 로드맵 입력 화면 위·아래로 흐르는 창업 성공 스타트업 카드.
//
//  웹 SSOT: apps/web/app/lib/components/FloatingInspiration.tsx
//  데이터 SSOT: packages/shared/src/inspiration-data.ts → InspirationBrandRegistry (20개).
//
//  레이아웃: 입력 콘텐츠는 화면 중앙(IdeaStepView 센터링). 카드는 겹치지 않는 일렬 마퀴 2줄 —
//   · 상단 줄: 왼쪽으로 무한 순환
//   · 하단 줄: 오른쪽으로 무한 순환
//  카드 탭 → 창업 스토리 시트. 카드(버튼)에서만 hit-test → 빈 영역 탭은 입력으로 통과.
//
//  로고: Simple Icons CDN(글로벌 브랜드) + glyph fallback(한국 브랜드).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
#if canImport(UIKit)
import UIKit
#endif

// MARK: - hex("#0064ff") → Color (문자열 파서)

private func brandColor(_ hex: String, opacity: Double = 1.0) -> Color {
    var s = hex.trimmingCharacters(in: .whitespaces)
    if s.hasPrefix("#") { s.removeFirst() }
    guard s.count == 6, let v = UInt32(s, radix: 16) else { return BUColor.midnight.opacity(opacity) }
    let r = Double((v >> 16) & 0xFF) / 255.0
    let g = Double((v >> 8) & 0xFF) / 255.0
    let b = Double(v & 0xFF) / 255.0
    return Color(red: r, green: g, blue: b).opacity(opacity)
}

// MARK: - Floating layer (마퀴 2줄)

public struct FloatingInspirationView: View {
    @State private var selected: InspirationBrand?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let brands = InspirationBrandRegistry.all

    public init() {}

    public var body: some View {
        GeometryReader { geo in
            let half = max(1, brands.count / 2)
            let top = Array(brands.prefix(half))
            let bottom = Array(brands.suffix(from: half))
            ZStack {
                MarqueeRow(brands: top, toLeft: true, reduceMotion: reduceMotion) { selected = $0 }
                    .frame(width: geo.size.width, height: 110, alignment: .leading)
                    .position(x: geo.size.width / 2, y: geo.size.height * 0.12)

                MarqueeRow(brands: bottom, toLeft: false, reduceMotion: reduceMotion) { selected = $0 }
                    .frame(width: geo.size.width, height: 110, alignment: .leading)
                    .position(x: geo.size.width / 2, y: geo.size.height * 0.87)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        // 빈 영역 hit-test 통과 → 입력 화면 정상 동작. 카드 버튼만 반응.
        .sheet(item: $selected) { b in
            BrandStorySheet(brand: b)
        }
    }
}

// MARK: - 무한 순환 마퀴 한 줄

private struct WidthKey: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

private struct MarqueeRow: View {
    let brands: [InspirationBrand]
    let toLeft: Bool
    let reduceMotion: Bool
    let onTap: (InspirationBrand) -> Void

    @State private var period: CGFloat = 0   // 한 세트 폭(+간격) — 이만큼 흐르면 seamless 반복
    @State private var offset: CGFloat = 0

    private let spacing: CGFloat = 14
    private let speed: CGFloat = 26          // pt/sec (천천히)

    // 흩뿌림(jitter) — 일직선 "기차" 느낌 제거. offset/rotation/scale 은 레이아웃에 영향 없어
    //  HStack 폭이 유지 → seamless 루프 보존. 두 세트가 같은 인덱스로 동일 적용돼 이음새 없음.
    private static let jitterY: [CGFloat] = [-16, 11, -6, 19, -12, 4, -20, 14, -3, 8]
    private static let jitterR: [Double]  = [-2.5, 2, -1.5, 3, -2, 1.5, -3, 2, -1, 2.5]
    private static let jitterS: [CGFloat] = [0.96, 1.05, 0.93, 1.0, 1.04, 0.95, 1.0, 0.98, 1.03, 0.94]

    private func strip() -> some View {
        HStack(spacing: spacing) {
            ForEach(Array(brands.enumerated()), id: \.element.id) { idx, b in
                Button { onTap(b) } label: { CardBody(brand: b) }
                    .buttonStyle(.plain)
                    .scaleEffect(Self.jitterS[idx % Self.jitterS.count])
                    .rotationEffect(.degrees(Self.jitterR[idx % Self.jitterR.count]))
                    .offset(y: Self.jitterY[idx % Self.jitterY.count])
            }
        }
    }

    var body: some View {
        // 동일 세트 2개 → offset 이 한 세트 폭만큼 흐르면 두 번째 세트가 첫 세트 자리에 와 seamless loop.
        HStack(spacing: spacing) {
            strip()
                .background(
                    GeometryReader { g in
                        Color.clear.preference(key: WidthKey.self, value: g.size.width)
                    }
                )
            strip()
        }
        .offset(x: offset)
        .onPreferenceChange(WidthKey.self) { w in
            guard w > 0, period == 0 else { return }
            period = w + spacing
            startScroll()
        }
    }

    private func startScroll() {
        guard !reduceMotion, period > 0 else { return }
        offset = toLeft ? 0 : -period
        withAnimation(.linear(duration: Double(period / speed)).repeatForever(autoreverses: false)) {
            offset = toLeft ? -period : 0
        }
    }
}

// MARK: - Card visual

private struct CardBody: View {
    let brand: InspirationBrand

    var body: some View {
        HStack(spacing: 9) {
            logoTile
            VStack(alignment: .leading, spacing: 1) {
                Text(brand.name)
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                Text(brand.tagline)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 13, style: .continuous)
                .fill(Color.white.opacity(0.92))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 13, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
        )
        .shadow(color: BUColor.midnight.opacity(0.12), radius: 10, x: 0, y: 5)
        .fixedSize()
    }

    private var logoTile: some View {
        let tileColor = brandColor(brand.color)
        let fg = brand.textColor.map { brandColor($0) } ?? Color.white
        return ZStack {
            RoundedRectangle(cornerRadius: 9, style: .continuous).fill(tileColor)
            if let img = brandLogoImage(brand.iconSlug) {
                img.resizable().scaledToFit().frame(width: 21, height: 21)
            } else {
                Text(brand.glyph).font(.system(size: 15, weight: .heavy)).foregroundStyle(fg)
            }
        }
        .frame(width: 36, height: 36)
    }
}

/// 번들된 실제 로고 PNG(Simple Icons CC0 → 빌드타임 래스터화). 없으면 nil → 글리프 fallback.
private func brandLogoImage(_ slug: String?) -> Image? {
    guard let url = InspirationBrandRegistry.logoURL(forSlug: slug),
          let ui = UIImage(contentsOfFile: url.path) else { return nil }
    return Image(uiImage: ui)
}

// MARK: - 성공 스토리 시트 (웹 BrandStoryModal iOS 대응)

private struct BrandStorySheet: View {
    let brand: InspirationBrand
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        header
                        divider
                        section(label: "시작") {
                            Text(brand.origin)
                                .font(.system(size: 14.5, weight: .medium))
                                .foregroundStyle(BUColor.ink)
                                .lineSpacing(5)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        divider
                        section(label: "차별점") {
                            VStack(alignment: .leading, spacing: 14) {
                                ForEach(Array(brand.keys.enumerated()), id: \.offset) { i, k in
                                    HStack(alignment: .top, spacing: 12) {
                                        Text(String(format: "%02d", i + 1))
                                            .font(.system(size: 12, weight: .heavy))
                                            .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                                            .monospacedDigit()
                                        Text(k)
                                            .font(.system(size: 14, weight: .medium))
                                            .foregroundStyle(BUColor.ink)
                                            .lineSpacing(4)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                            }
                        }
                        divider
                        section(label: "한 줄 교훈") {
                            HStack(alignment: .top, spacing: 4) {
                                Text("“")
                                    .font(.custom("Georgia", size: 32))
                                    .foregroundStyle(BUColor.inkMuted.opacity(0.5))
                                Text(brand.lesson)
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundStyle(BUColor.ink)
                                    .lineSpacing(4)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        Color.clear.frame(height: 24)
                    }
                    .padding(BUSpacing.md)
                }
            }
            .navigationTitle("창업 스토리")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } }
                #endif
            }
        }
    }

    private var header: some View {
        VStack(alignment: .center, spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 18, style: .continuous).fill(brandColor(brand.color))
                if let img = brandLogoImage(brand.iconSlug) {
                    img.resizable().scaledToFit().frame(width: 42, height: 42)
                } else { glyphText }
            }
            .frame(width: 72, height: 72)
            .shadow(color: Color.black.opacity(0.14), radius: 10, x: 0, y: 6)

            VStack(spacing: 4) {
                Text(brand.name)
                    .font(.system(size: 26, weight: .bold))
                    .tracking(-0.6)
                    .foregroundStyle(BUColor.ink)
                Text("\(brand.tagline) · \(brand.founded)")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    private var glyphText: some View {
        Text(brand.glyph)
            .font(.system(size: 30, weight: .heavy))
            .foregroundStyle(brand.textColor.map { brandColor($0) } ?? Color.white)
    }

    private var divider: some View {
        Rectangle().fill(BUColor.ink.opacity(0.06)).frame(height: 1)
    }

    private func section<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(label)
                .font(.system(size: 11, weight: .heavy))
                .tracking(1.2)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
