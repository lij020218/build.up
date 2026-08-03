//
//  MarketingMemeLane.swift — 이번 주 밈·챌린지 레인 (웹 MemeLane 1:1 미러)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/MarketingSurface.tsx (MemeLane)
//  데이터: /api/ai/marketing/meme-pack — 업자용 소스(고구마팜·캐릿 등) 주간 전역 팩.
//  원칙(2026-07-24): 원본 설명 + 원본 링크만 보여주고 적용은 사장님 몫 — AI 개사 금지.
//  팩이 없으면 뷰 자체를 렌더하지 않는다(빈 껍데기 금지).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct MarketingMemeLane: View {
    let pack: MemePackResponse?

    @Environment(\.openURL) private var openURL
    private let blue = BUColor.accent

    var body: some View {
        if let pack, !pack.items.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                header(stale: pack.stale)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: 10) {
                        ForEach(pack.items, id: \.self) { item in
                            memeCard(item)
                        }
                    }
                    .padding(.horizontal, 2)
                }
            }
            .padding(BUSpacing.cardPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .fill(Color.white.opacity(0.85))
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
        }
    }

    private func header(stale: Bool) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            HStack(spacing: 8) {
                Text("이번 주 밈·챌린지")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.8)
                    .foregroundStyle(blue.opacity(0.65))
                    .textCase(.uppercase)
                if stale {
                    Text("지난주 소재")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(BUColor.ink.opacity(0.05), in: Capsule())
                }
            }
            Text("요즘 도는 것들")
                .font(.system(size: 17, weight: .bold))
                .tracking(-0.34)
                .foregroundStyle(BUColor.ink)
            Text("마케터들이 보는 트렌드 매체에서 매일 자동 수집 — 원본만 보여드려요. 적용은 사장님 몫.")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 2)
        }
    }

    private func kindLabel(_ kind: String) -> String {
        switch kind {
        case "meme": return "밈"
        case "challenge": return "챌린지"
        default: return "포맷"
        }
    }

    /// 일간 top-up 신선 판정 — addedAt 이 48시간 내면 NEW (웹 isFreshItem 패리티)
    private func isFresh(_ item: MemeItem) -> Bool {
        guard let raw = item.addedAt else { return false }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        guard let d = f.date(from: raw) else { return false }
        return Date().timeIntervalSince(d) < 48 * 3_600
    }

    private func memeCard(_ item: MemeItem) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            // 종류 · 매체 · 발행일 (+ 일간 top-up NEW 배지)
            HStack(spacing: 6) {
                Text("\(kindLabel(item.kind)) · \(item.sourceName)\(item.publishedAt.map { " · \(String($0.dropFirst(5)).replacingOccurrences(of: "-", with: "/"))" } ?? "")")
                    .font(.system(size: 10.5, weight: .bold))
                    .tracking(0.5)
                    .foregroundStyle(BUColor.inkMuted)
                    .lineLimit(1)
                if isFresh(item) {
                    Text("NEW")
                        .font(.system(size: 9.5, weight: .black))
                        .tracking(0.6)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6).padding(.vertical, 1)
                        .background(BUColor.success, in: RoundedRectangle(cornerRadius: 5, style: .continuous))
                }
            }

            Text(item.title)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .fixedSize(horizontal: false, vertical: true)

            Text(item.originDesc)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .fixedSize(horizontal: false, vertical: true)

            if let example = item.originExample, !example.isEmpty {
                Text("원문 활용례: \(example)")
                    .font(.system(size: 11.5, weight: .medium))
                    .italic()
                    .foregroundStyle(blue)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)

            HStack {
                if let effort = item.effortLabel, !effort.isEmpty {
                    Text(effort)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(blue)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(blue.opacity(0.08), in: Capsule())
                }
                Spacer(minLength: 0)
                if let url = URL(string: item.originUrl) {
                    Button {
                        MarketingRepository.logEngagement(event: "meme_origin_click")
                        openURL(url)
                    } label: {
                        Text("원본 보기 →")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(blue)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.top, 4)

            Text(item.applyHint)
                .font(.system(size: 11.5, weight: .semibold))
                .foregroundStyle(blue)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 6)
                .frame(maxWidth: .infinity, alignment: .leading)
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(BUColor.cardBorder)
                        .frame(height: 1)
                }
        }
        .padding(14)
        .frame(width: 218, alignment: .leading)
        .background(Color.white.opacity(0.96), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }
}
