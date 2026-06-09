//
//  FloatingInspirationView.swift — AI 로드맵 입력 화면 뒤로 떠다니는 창업 성공 스타트업 카드.
//
//  웹 SSOT: apps/web/app/lib/components/FloatingInspiration.tsx
//  데이터 SSOT: packages/shared/src/inspiration-data.ts → InspirationBrandRegistry (20개).
//
//  인터랙션(웹 미러):
//   · 카드들이 화면을 가로질러 천천히 드리프트(부유) + 은은한 명멸
//   · 카드 탭 → 창업 시작 인사이트·차별점·교훈 시트
//   · 카드 버튼에서만 hit-test → 빈 영역 탭은 아래 입력 화면으로 통과(입력 정상 동작)
//
//  로고: Simple Icons CDN(글로벌 브랜드) + glyph fallback(한국 브랜드).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

// MARK: - hex("#0064ff") → Color (문자열 파서 — 디자인시스템 Color.hex(UInt32) 보완)

private func brandColor(_ hex: String, opacity: Double = 1.0) -> Color {
    var s = hex.trimmingCharacters(in: .whitespaces)
    if s.hasPrefix("#") { s.removeFirst() }
    guard s.count == 6, let v = UInt32(s, radix: 16) else { return BUColor.midnight.opacity(opacity) }
    let r = Double((v >> 16) & 0xFF) / 255.0
    let g = Double((v >> 8) & 0xFF) / 255.0
    let b = Double(v & 0xFF) / 255.0
    return Color(red: r, green: g, blue: b).opacity(opacity)
}

// MARK: - Floating layer

public struct FloatingInspirationView: View {
    @State private var selected: InspirationBrand?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let brands = InspirationBrandRegistry.all

    // 모바일 배치 — 카드 레이어가 입력 위에 떠 있으므로(탭 통과), 중앙 입력 영역
    //  (텍스트에디터·"다음" 버튼)과 좌상단 "뒤로" 버튼을 피해 *에디터 위 top 밴드* +
    //  *버튼 아래 bottom 밴드* 두 곳에만 분산. 헤더 텍스트(비-인터랙티브) 위 겹침은 허용.
    private static let positions: [(CGFloat, CGFloat)] = [
        // top band (헤더 주변, 좌상단 뒤로버튼 코너 회피: x<24 && y<13 제외)
        (34, 10), (52, 8), (70, 9), (86, 13), (92, 22), (64, 20), (44, 23), (26, 16), (80, 25),
        // bottom band ("다음" 버튼 아래 빈 영역)
        (10, 82), (26, 92), (42, 85), (58, 93), (74, 86), (90, 81), (18, 75), (64, 78), (36, 95), (82, 95), (50, 88),
    ]

    public init() {}

    public var body: some View {
        GeometryReader { geo in
            ZStack {
                ForEach(Array(brands.enumerated()), id: \.element.id) { idx, b in
                    let pos = Self.positions[idx % Self.positions.count]
                    FloatingCard(brand: b, index: idx, xPct: pos.0, reduceMotion: reduceMotion) {
                        selected = b
                    }
                    .position(x: geo.size.width * pos.0 / 100, y: geo.size.height * pos.1 / 100)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        // ZStack 빈 영역은 hit-test 안 됨 → 입력 화면으로 탭 통과. 카드 버튼만 반응.
        .sheet(item: $selected) { b in
            BrandStorySheet(brand: b)
        }
    }
}

// MARK: - Drifting card

private struct FloatingCard: View {
    let brand: InspirationBrand
    let index: Int
    let xPct: CGFloat
    let reduceMotion: Bool
    let onTap: () -> Void

    @State private var drift = false

    // 웹 placementFor 의 seed 기반 파라미터 미러.
    private var seed: Int { (index * 31) % 100 }
    private var dx: CGFloat { CGFloat(18 + seed % 22) }
    private var dy: CGFloat { CGFloat(14 + (seed * 3) % 18) }
    private var duration: Double { Double(16 + (seed * 7) % 14) }
    private var delay: Double { Double(seed % 12) }
    private var baseOpacity: Double { 0.52 + Double(seed % 10) / 50.0 } // 0.52–0.70 (배경 느낌)
    private var rotate: Double { Double((seed % 7) - 3) * 0.6 }
    // x<50 → 오른쪽으로, else 왼쪽으로 드리프트(웹 driftX).
    private var driftX: CGFloat { xPct < 50 ? dx : -dx }

    var body: some View {
        Button(action: onTap) {
            CardBody(brand: brand)
        }
        .buttonStyle(.plain)
        .rotationEffect(.degrees(reduceMotion ? 0 : (drift ? rotate + 0.8 : rotate - 0.8)))
        .offset(
            x: reduceMotion ? 0 : (drift ? driftX : 0),
            y: reduceMotion ? 0 : (drift ? -dy : 0)
        )
        .opacity(reduceMotion ? baseOpacity : (drift ? baseOpacity : baseOpacity * 0.6))
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: duration).repeatForever(autoreverses: true).delay(delay * 0.05)) {
                drift = true
            }
        }
    }
}

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
        .shadow(color: BUColor.midnight.opacity(0.14), radius: 12, x: 0, y: 6)
        .fixedSize()
    }

    private var logoTile: some View {
        let tileColor = brandColor(brand.color)
        let fg = brand.textColor.map { brandColor($0) } ?? Color.white
        return ZStack {
            RoundedRectangle(cornerRadius: 9, style: .continuous).fill(tileColor)
            if let slug = brand.iconSlug,
               let url = URL(string: "https://cdn.simpleicons.org/\(slug)/\(brand.iconColor ?? "ffffff")") {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable().scaledToFit().frame(width: 20, height: 20)
                    default:
                        Text(brand.glyph).font(.system(size: 15, weight: .heavy)).foregroundStyle(fg)
                    }
                }
            } else {
                Text(brand.glyph).font(.system(size: 15, weight: .heavy)).foregroundStyle(fg)
            }
        }
        .frame(width: 36, height: 36)
    }
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
                if let slug = brand.iconSlug,
                   let url = URL(string: "https://cdn.simpleicons.org/\(slug)/\(brand.iconColor ?? "ffffff")") {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let img): img.resizable().scaledToFit().frame(width: 40, height: 40)
                        default: glyphText
                        }
                    }
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
