//
//  MarketingTrendsCard.swift — 일일 5 트렌드 (세로 리스트 + 인라인 포커스 + 출처 메타)
//
//  웹 SSOT: MarketingSurface.tsx (640–930). 시각 1:1 미러:
//   • 상단: 헤더 + 재생성 버튼
//   • 출처 메타 strip (YouTube / DataLab / Naver Blog / Tavily / Claude searches)
//   • 5 트렌드 세로 카드 (index 1~5 + title + format + brand/campaign/views + reason + lesson + idea + hashtags + ref URL)
//   • 하단: 참조 출처 리스트 (최대 6)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct MarketingTrendsCard: View {
    let loading: Bool
    let error: String?
    let trends: [TrendItem]
    let meta: TrendMeta?
    let sources: [TrendSource]
    let cached: Bool
    let focusedIndex: Int?
    let onRefresh: () -> Void
    let onFocus: (Int) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header

            // 출처 메타 strip
            if !trends.isEmpty, let meta, hasMeta(meta) {
                metaStrip(meta)
            }

            if loading && trends.isEmpty {
                skeletonBlock
            } else if let err = error, trends.isEmpty {
                errorBlock(err)
            } else if trends.isEmpty {
                emptyBlock
            } else {
                VStack(spacing: 10) {
                    ForEach(Array(trends.enumerated()), id: \.offset) { idx, t in
                        TrendRow(
                            index: idx,
                            trend: t,
                            isFocused: focusedIndex == idx,
                            onTap: { onFocus(idx) }
                        )
                    }
                }
            }

            // 참조 출처 리스트
            if !sources.isEmpty {
                sourcesFooter
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

    private var header: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text("AI 트렌드")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.8)
                    .foregroundStyle(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.65))
                    .textCase(.uppercase)
                Text("오늘의 마케팅 트렌드")
                    .font(.system(size: 16, weight: .bold))
                    .tracking(-0.32)
                    .foregroundStyle(BUColor.ink)
                Text("업종별 맞춤 콘텐츠 아이디어 \(trends.count)개")
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .padding(.top, 2)
            }
            Spacer(minLength: 6)
            VStack(alignment: .trailing, spacing: 4) {
                if cached {
                    Text("캐시")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(BUColor.inkMuted.opacity(0.1), in: Capsule())
                }
                Button(action: onRefresh) {
                    HStack(spacing: 4) {
                        Image(systemName: loading ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                            .font(.system(size: 11, weight: .heavy))
                        Text(loading ? "분석 중" : "재생성")
                            .font(.system(size: 11, weight: .heavy))
                    }
                    .foregroundStyle(Color(red: 0.122, green: 0.275, blue: 0.659))
                    .padding(.horizontal, 10).padding(.vertical, 6)
                    .background(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .strokeBorder(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.2), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
                .disabled(loading)
            }
        }
    }

    private func hasMeta(_ m: TrendMeta) -> Bool {
        (m.usedYoutube ?? false) || (m.usedDataLab ?? false) || (m.usedNaverBlog ?? false) || (m.usedTavily ?? false) || ((m.webSearches ?? 0) > 0)
    }

    private func metaStrip(_ m: TrendMeta) -> some View {
        let isLive = m.usedYoutube ?? false
        let chips = HStack(alignment: .center, spacing: 6) {
            Text(isLive ? "실시간 트렌딩" : "최근 검색·요약 기반")
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.4)
                .textCase(.uppercase)
                .foregroundStyle(Color(red: 0.204, green: 0.78, blue: 0.349).opacity(0.85))

            if isLive {
                metaChip(label: "YouTube \(m.youtubeVideos ?? 0)건", color: Color(red: 0.8, green: 0, blue: 0))
            }
            if m.usedDataLab ?? false {
                metaChip(label: "네이버 DataLab", color: Color(red: 0.204, green: 0.78, blue: 0.349))
            }
            if m.usedNaverBlog ?? false {
                metaChip(label: "네이버 블로그", color: Color(red: 0.204, green: 0.78, blue: 0.349))
            }
            if m.usedTavily ?? false {
                metaChip(label: "웹 검색 요약", color: Color(red: 0.204, green: 0.78, blue: 0.349))
            }
            if let n = m.webSearches, n > 0 {
                metaChip(label: "Claude 웹검색 \(n)회", color: Color(red: 0.204, green: 0.78, blue: 0.349))
            }
            Spacer(minLength: 0)
        }
        return ScrollView(.horizontal, showsIndicators: false) { chips }
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Color(red: 0.204, green: 0.78, blue: 0.349).opacity(0.04))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(Color(red: 0.204, green: 0.78, blue: 0.349).opacity(0.1), lineWidth: 1)
            )
    }

    private func metaChip(label: String, color: Color) -> some View {
        Text(label)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 6))
    }

    private var skeletonBlock: some View {
        VStack(spacing: 10) {
            ForEach(0..<3, id: \.self) { _ in
                VStack(alignment: .leading, spacing: 8) {
                    RoundedRectangle(cornerRadius: 4).fill(BUColor.midnight.opacity(0.08)).frame(height: 14).frame(maxWidth: 200)
                    RoundedRectangle(cornerRadius: 4).fill(BUColor.inkMuted.opacity(0.08)).frame(height: 11)
                    RoundedRectangle(cornerRadius: 4).fill(BUColor.inkMuted.opacity(0.08)).frame(height: 11).frame(maxWidth: 260)
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.inkMuted.opacity(0.02), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
        }
    }

    private func errorBlock(_ msg: String) -> some View {
        Text(msg)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Color(red: 0.624, green: 0.102, blue: 0.176))
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(Color(red: 1, green: 0.231, blue: 0.188).opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .strokeBorder(Color(red: 1, green: 0.231, blue: 0.188).opacity(0.16), lineWidth: 1)
            )
    }

    private var emptyBlock: some View {
        Text("트렌드 생성이 잠시 지연되고 있어요. 재생성으로 다시 시도해주세요.")
            .font(.system(size: 12.5, weight: .medium))
            .foregroundStyle(BUColor.inkMuted)
            .multilineTextAlignment(.center)
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(BUColor.inkMuted.opacity(0.03), in: RoundedRectangle(cornerRadius: 14))
    }

    private var sourcesFooter: some View {
        VStack(alignment: .leading, spacing: 6) {
            Rectangle()
                .fill(BUColor.inkMuted.opacity(0.08))
                .frame(height: 1)
                .padding(.top, 6)
            Text("참조 출처")
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.55))
            VStack(alignment: .leading, spacing: 3) {
                ForEach(Array(sources.prefix(6).enumerated()), id: \.offset) { _, s in
                    SourceRow(source: s)
                }
            }
        }
    }
}

// MARK: - Trend row

private struct TrendRow: View {
    let index: Int
    let trend: TrendItem
    let isFocused: Bool
    let onTap: () -> Void

    @Environment(\.openURL) private var openURL

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 6) {
                topRow
                metaLine
                Text(trend.reason)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                if let lesson = trend.lesson, !lesson.isEmpty {
                    lessonBox(lesson)
                }
                Text(trend.contentIdea)
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(2)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                bottomChips
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(isFocused ? Color(red: 0, green: 0.478, blue: 1.0).opacity(0.05) : Color.white.opacity(0.95))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(isFocused ? Color(red: 0, green: 0.478, blue: 1.0).opacity(0.3) : BUColor.cardBorder, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private var topRow: some View {
        HStack(alignment: .center, spacing: 8) {
            // index badge
            Text("\(index + 1)")
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(isFocused ? .white : BUColor.inkMuted)
                .frame(width: 18, height: 18)
                .background(
                    RoundedRectangle(cornerRadius: 6)
                        .fill(isFocused ? Color(red: 0, green: 0.478, blue: 1.0) : BUColor.ink.opacity(0.08))
                )
            Text(trend.title)
                .font(.system(size: 14.5, weight: .heavy))
                .tracking(-0.1)
                .foregroundStyle(BUColor.ink)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 6)
            formatBadge
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(isFocused ? Color(red: 0, green: 0.478, blue: 1.0) : BUColor.inkMuted.opacity(0.4))
        }
    }

    private var formatBadge: some View {
        let info = formatInfo(trend.format)
        return Text(info.label)
            .font(.system(size: 10, weight: .heavy))
            .foregroundStyle(info.color)
            .padding(.horizontal, 8).padding(.vertical, 2)
            .background(info.color.opacity(0.12), in: RoundedRectangle(cornerRadius: 6))
    }

    @ViewBuilder
    private var metaLine: some View {
        if trend.brandName != nil || trend.campaignName != nil || (trend.viewCount ?? 0) > 0 {
            HStack(spacing: 6) {
                if let brand = trend.brandName {
                    Text(brand)
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(Color(red: 0.486, green: 0.227, blue: 0.929))
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(Color(red: 0.486, green: 0.227, blue: 0.929).opacity(0.08), in: RoundedRectangle(cornerRadius: 5))
                }
                if let camp = trend.campaignName, camp != trend.title {
                    Text("캠페인: \(camp)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(1)
                }
                if let views = trend.viewCount, views > 0 {
                    Text("▶ \(formatViews(views))")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(Color(red: 0.8, green: 0, blue: 0))
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(Color(red: 1, green: 0, blue: 0).opacity(0.06), in: RoundedRectangle(cornerRadius: 5))
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func lessonBox(_ lesson: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("💡")
                .font(.system(size: 12))
            Text(lesson)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(Color(red: 0.486, green: 0.227, blue: 0.929))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .multilineTextAlignment(.leading)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10).padding(.vertical, 6)
        .background(Color(red: 0.486, green: 0.227, blue: 0.929).opacity(0.05), in: RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .strokeBorder(Color(red: 0.486, green: 0.227, blue: 0.929).opacity(0.12), lineWidth: 1)
        )
    }

    private var bottomChips: some View {
        HStack(alignment: .center, spacing: 4) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 4) {
                    ForEach(trend.hashtags, id: \.self) { tag in
                        let withHash = tag.hasPrefix("#") ? tag : "#\(tag)"
                        Text(withHash)
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundStyle(Color(red: 0, green: 0.478, blue: 1.0))
                            .padding(.horizontal, 7).padding(.vertical, 1.5)
                            .background(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.05), in: RoundedRectangle(cornerRadius: 5))
                    }
                }
            }
            if let urlStr = trend.referenceUrl, let url = URL(string: urlStr) {
                let info = videoLinkInfo(urlStr)
                Button {
                    openURL(url)
                } label: {
                    Text(info.label)
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(info.color)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(info.color.opacity(0.06), in: RoundedRectangle(cornerRadius: 6))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func formatViews(_ n: Int) -> String {
        if n >= 1_000_000 { return String(format: "%.1fM", Double(n) / 1_000_000) }
        if n >= 1_000 { return String(format: "%.1fK", Double(n) / 1_000) }
        return "\(n)"
    }

    private func videoLinkInfo(_ url: String) -> (label: String, color: Color) {
        if url.contains("youtube.com") || url.contains("youtu.be") {
            return ("▶ 유튜브 영상", Color(red: 0.8, green: 0, blue: 0))
        }
        if url.contains("instagram.com") {
            return ("▶ 인스타 영상", Color(red: 0, green: 0.478, blue: 1.0))
        }
        return ("▶ 영상 보기", Color(red: 0, green: 0.478, blue: 1.0))
    }
}

// MARK: - Format info

func formatInfo(_ format: String) -> (label: String, color: Color) {
    switch format {
    case "reel":     return ("릴스",   Color(red: 0.859, green: 0.157, blue: 0.467))
    case "story":    return ("스토리", Color(red: 0.918, green: 0.345, blue: 0.047))
    case "short":    return ("쇼츠",   Color(red: 0.847, green: 0.078, blue: 0.078))
    case "post":     return ("포스트", Color(red: 0, green: 0.478, blue: 1.0))
    case "blog":     return ("블로그", Color(red: 0.020, green: 0.588, blue: 0.412))
    case "campaign": return ("캠페인", Color(red: 0.486, green: 0.227, blue: 0.929))
    case "ad":       return ("광고",   Color(red: 0.918, green: 0.624, blue: 0.047))
    default:         return (format,   BUColor.midnight)
    }
}

// MARK: - Source row

private struct SourceRow: View {
    let source: TrendSource

    @Environment(\.openURL) private var openURL

    var body: some View {
        Button {
            if let url = URL(string: source.url) { openURL(url) }
        } label: {
            HStack(alignment: .center, spacing: 5) {
                Text("·")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.3))
                Text(source.name)
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.75))
                    .lineLimit(1)
                Spacer(minLength: 0)
                if let date = source.publishedDate, !date.isEmpty {
                    Text(date)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.5))
                }
                Image(systemName: "arrow.up.right.square")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.4))
            }
            .padding(.vertical, 3)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Inline Playbook (replaces sheet)

struct TrendInlinePlaybook: View {
    let trend: TrendItem
    let index: Int

    @Environment(\.openURL) private var openURL

    private var hasPlaybook: Bool { !(trend.howToExecute ?? []).isEmpty }
    private var hasTools: Bool { !(trend.tools ?? []).isEmpty }
    private var hasCase: Bool { trend.strategyExample != nil || trend.effectiveness != nil }

    var body: some View {
        if !hasPlaybook && !hasTools && !hasCase {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: 12) {
                headerView

                if hasPlaybook {
                    playbookBlock
                }
                if hasCase {
                    caseBlock
                }
                if hasTools {
                    toolsBlock
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

    private var headerView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("마케팅 작업하기")
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.75))
                .textCase(.uppercase)
            HStack(alignment: .center, spacing: 8) {
                Text("#\(index + 1) \(trend.title)")
                    .font(.system(size: 16, weight: .bold))
                    .tracking(-0.32)
                    .foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                let info = formatInfo(trend.format)
                Text(info.label)
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(info.color)
                    .padding(.horizontal, 7).padding(.vertical, 2)
                    .background(info.color.opacity(0.12), in: RoundedRectangle(cornerRadius: 6))
                Spacer(minLength: 0)
            }
            Text("위 트렌드를 탭하면 해당 트렌드 가이드로 전환됩니다.")
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
        }
    }

    private var playbookBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("오늘 바로 따라하기")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(Color(red: 0, green: 0.478, blue: 1.0))
                .textCase(.uppercase)
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array((trend.howToExecute ?? []).enumerated()), id: \.offset) { idx, step in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text("\(idx + 1)")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(.white)
                            .frame(width: 20, height: 20)
                            .background(Color(red: 0, green: 0.478, blue: 1.0), in: RoundedRectangle(cornerRadius: 6))
                        Text(step)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(BUColor.ink)
                            .lineSpacing(2)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.1), lineWidth: 1)
        )
    }

    private var caseBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("왜 이렇게 해야 하나 — 브랜드 사례·효과")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(Color(red: 0.204, green: 0.78, blue: 0.349))
                .textCase(.uppercase)
            if let strat = trend.strategyExample, !strat.isEmpty {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("사례")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(Color(red: 0.204, green: 0.78, blue: 0.349))
                    Text(strat)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)
                }
            }
            if let eff = trend.effectiveness, !eff.isEmpty {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("기대 효과")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(Color(red: 0.204, green: 0.78, blue: 0.349))
                    Text(eff)
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(red: 0.204, green: 0.78, blue: 0.349).opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Color(red: 0.204, green: 0.78, blue: 0.349).opacity(0.1), lineWidth: 1)
        )
    }

    private var toolsBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("추천 도구")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
            VStack(spacing: 8) {
                ForEach(trend.tools ?? [], id: \.name) { tool in
                    ToolPill(tool: tool, openURL: openURL)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.inkMuted.opacity(0.02), in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }
}

private struct ToolPill: View {
    let tool: TrendTool
    let openURL: OpenURLAction

    private var tierColor: Color {
        switch tool.tier {
        case "free":  return Color(red: 0.204, green: 0.78, blue: 0.349)
        case "paid":  return Color(red: 0, green: 0.478, blue: 1.0)
        default:      return Color(red: 0.918, green: 0.345, blue: 0.047)
        }
    }

    private var tierLabel: String {
        switch tool.tier {
        case "free":  return "무료"
        case "paid":  return "유료"
        default:      return "부분 무료"
        }
    }

    var body: some View {
        Button {
            if let urlStr = tool.url, let url = URL(string: urlStr) { openURL(url) }
        } label: {
            HStack(spacing: 8) {
                Text(tool.name)
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text(tierLabel)
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(tierColor)
                    .padding(.horizontal, 6).padding(.vertical, 1.5)
                    .background(tierColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 5))
                Text(tool.purpose)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineLimit(1)
                Spacer(minLength: 0)
                if tool.url != nil {
                    Text("→")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(tierColor)
                }
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.96), in: RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(tierColor.opacity(0.15), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(tool.url == nil)
    }
}
