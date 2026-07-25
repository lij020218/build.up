//
//  MarketingCasesCard.swift — 마케팅 작업하기 (업종 최신 성공사례·트렌드 → 내 사업 적용)
//
//  웹 SSOT: MarketingSurface.tsx 의 MarketingFocus (히어로 1 + 채널 진행도 + 더 보기).
//  /api/ai/marketing/cases 가 OpenAI web_search 로 조사한 plays.
//   - plays[0] = "이번 주 핵심 1가지" 히어로 (항상 표시)
//   - plays[1...] = "이번 주 추가 플레이 N개 더 보기" 접힘 (탭하면 펼침)
//  각 play = 종류(사례/트렌드) + 왜 통했나 + 내 사업 적용(단계·효과·도구).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData
#if canImport(UIKit)
import UIKit
#endif

struct MarketingCasesCard: View {
    let loading: Bool
    let error: String?
    let plays: [MarketingPlay]
    let sources: [CasesSourceItem]
    let activeChannels: [String]
    let categoryId: String?
    let doneTitles: Set<String>
    /// 재생성 허용 여부 — 웹 canRegenerateCases 패리티(에러/빈 결과일 때만 true).
    let canRefresh: Bool
    let onToggleDone: (String) -> Void
    let onRefresh: () -> Void

    @Environment(\.openURL) private var openURL
    @State private var showMore: Bool = false
    // 채널 우선순위 — 기본 접힘 (2026-07-24 개편: 요약 한 줄만, 웹 ChannelProgress 패리티)
    @State private var channelOpen: Bool = false

    private let blue = Color(red: 0, green: 0.478, blue: 1.0)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            if loading && plays.isEmpty {
                loadingBlock
            } else if let err = error, plays.isEmpty {
                errorBlock(err)
            } else if plays.isEmpty {
                emptyBlock
            } else {
                channelProgress
                heroAndMore
                if !sources.isEmpty {
                    sourcesRow
                }
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
                Text("마케팅 작업하기")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.8)
                    .foregroundStyle(blue.opacity(0.65))
                    .textCase(.uppercase)
                Text("딱 이거 하나만 하세요")
                    .font(.system(size: 16, weight: .bold))
                    .tracking(-0.32)
                    .foregroundStyle(BUColor.ink)
                Text("내 업종 최신 성공사례로 고른 가장 중요한 1가지부터. 한 번에 한 채널씩.")
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 2)
            }
            Spacer(minLength: 6)
            // 웹 패리티(MarketingSurface.tsx:559-573): 정상 표시 중이면 disabled.
            //   재생성은 에러/빈 결과(canRefresh)일 때만 — 비용·중복 LLM 호출 차단.
            Button(action: { if canRefresh && !loading { onRefresh() } }) {
                HStack(spacing: 4) {
                    Image(systemName: loading ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                        .font(.system(size: 11, weight: .heavy))
                    Text(loading ? "조사 중" : (canRefresh ? "다시 찾기" : "최신"))
                        .font(.system(size: 11, weight: .heavy))
                }
                .foregroundStyle(Color(red: 0.122, green: 0.275, blue: 0.659))
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background(blue.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(blue.opacity(0.2), lineWidth: 1))
                .opacity(canRefresh && !loading ? 1 : 0.45)
            }
            .buttonStyle(.plain)
            .disabled(!canRefresh || loading)
        }
    }

    // 히어로 1순위 + "더 보기" 접힘 — 웹 MarketingFocus(plays[0] 히어로 + rest 접힘) 패리티.
    @ViewBuilder private var heroAndMore: some View {
        let hero = plays[0]
        let rest = Array(plays.dropFirst())
        Text("이번 주 핵심 1가지")
            .font(.system(size: 11, weight: .heavy))
            .tracking(0.5).textCase(.uppercase)
            .foregroundStyle(blue)
        PlayFullCard(
            play: hero,
            done: doneTitles.contains(hero.title),
            onToggleDone: { onToggleDone(hero.title) },
            openURL: openURL,
            hero: true
        )
        if !rest.isEmpty {
            Button {
                withAnimation(.easeInOut(duration: 0.18)) { showMore.toggle() }
            } label: {
                HStack(spacing: 6) {
                    Text(showMore ? "접기" : "이번 주 추가 플레이 \(rest.count)개 더 보기")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted)
                        .rotationEffect(.degrees(showMore ? 90 : 0))
                }
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 14).padding(.vertical, 11)
                .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(BUColor.cardBorder, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
            if showMore {
                VStack(spacing: 12) {
                    ForEach(rest) { play in
                        PlayFullCard(
                            play: play,
                            done: doneTitles.contains(play.title),
                            onToggleDone: { onToggleDone(play.title) },
                            openURL: openURL
                        )
                    }
                }
                .padding(.top, 4)
            }
        }
    }

    private var loadingBlock: some View {
        Text("내 업종 성공사례를 조사하고 있어요… (최대 20초)")
            .font(.system(size: 12.5, weight: .medium))
            .foregroundStyle(BUColor.inkMuted)
            .multilineTextAlignment(.center)
            .padding(24)
            .frame(maxWidth: .infinity)
            .background(blue.opacity(0.03), in: RoundedRectangle(cornerRadius: 14))
    }

    private func errorBlock(_ msg: String) -> some View {
        Text(msg)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(BUColor.danger)
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(BUColor.danger.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(BUColor.danger.opacity(0.16), lineWidth: 1))
    }

    private var emptyBlock: some View {
        Text("가게 정보를 입력하면 업종 맞춤 성공사례를 찾아드려요.")
            .font(.system(size: 12.5, weight: .medium))
            .foregroundStyle(BUColor.inkMuted)
            .multilineTextAlignment(.center)
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(BUColor.inkMuted.opacity(0.03), in: RoundedRectangle(cornerRadius: 14))
    }

    private var sourcesRow: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("출처")
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.5)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted)
            FlowChips(items: Array(sources.prefix(5))) { s in
                Button { if let u = URL(string: s.url) { openURL(u) } } label: {
                    Text(s.name)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(blue)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(blue.opacity(0.06), in: RoundedRectangle(cornerRadius: 6))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.top, 4)
    }

    // 채널 진행도 — 네이버 플레이스 → 인스타 → 업종 추천. "다음 한 채널" 안내 (웹 ChannelProgress 패리티)
    // 2026-07-24 개편: 기본 접힘 — 요약 한 줄("지금은 X")만 보이고, 탭하면 칩·설명.
    @ViewBuilder private var channelProgress: some View {
        let priority = channelPriority(categoryId)
        let activeSet = Set(activeChannels)
        let next = priority.first(where: { !activeSet.contains($0) })
        VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.easeInOut(duration: 0.15)) { channelOpen.toggle() }
            } label: {
                HStack(spacing: 8) {
                    Text("채널 우선순위")
                        .font(.system(size: 10.5, weight: .heavy)).tracking(0.5).textCase(.uppercase)
                        .foregroundStyle(BUColor.inkMuted)
                    Text(next.map { "지금은 \(channelLabel($0)) — 한 번에 하나씩" } ?? "상위 채널 모두 활성")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted)
                        .rotationEffect(.degrees(channelOpen ? 90 : 0))
                }
            }
            .buttonStyle(.plain)
            if channelOpen {
            FlowChips(items: priority) { ch in
                let done = activeSet.contains(ch)
                let isNext = ch == next
                let color: Color = done ? BUColor.success : (isNext ? blue : BUColor.inkMuted)
                HStack(spacing: 4) {
                    if done { Text("✓").font(.system(size: 10, weight: .heavy)) }
                    else if isNext { Text("→").font(.system(size: 10, weight: .heavy)) }
                    Text(channelLabel(ch)).font(.system(size: 11.5, weight: .semibold))
                }
                .foregroundStyle(color)
                .padding(.horizontal, 9).padding(.vertical, 4)
                .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(color.opacity(0.18), lineWidth: 1))
            }
            if let n = next {
                (Text("다음: ").font(.system(size: 12, weight: .heavy)).foregroundColor(blue)
                 + Text("\(channelLabel(n))부터 집중해보세요. 모든 채널 동시에 X.").font(.system(size: 12, weight: .medium)).foregroundColor(BUColor.ink))
                    .fixedSize(horizontal: false, vertical: true)
            }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(blue.opacity(0.03), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(blue.opacity(0.08), lineWidth: 1))
    }

    // 채널 우선순위·라벨은 정식 소스(MarketingChannelMeta) 재사용 — 중복/드리프트 제거.
    //  네이버 플레이스 → 인스타 를 앞에 고정한 뒤 업종 추천 채널을 이어붙임.
    private func channelPriority(_ cat: String?) -> [String] {
        var out = ["naver-place", "instagram"]
        for c in MarketingChannelMeta.recommendedChannels(for: cat) where !out.contains(c) { out.append(c) }
        return Array(out.prefix(4))
    }

    private func channelLabel(_ key: String) -> String {
        MarketingChannelMeta.meta(for: key)?.labelKo ?? key
    }
}

// MARK: - Play full card (2026-07-24 v2 — 웹 PlayBlock 미러)
//   보이는 것 = 미션 한 문장 + 시간 배지 + 복사 실행물 + "했어요".
//   사례 근거·단계·효과·도구는 "왜 이걸 하래요?" 접기 뒤로. 구캐시(v1)는 steps 폴백.

private struct PlayFullCard: View {
    let play: MarketingPlay
    let done: Bool
    let onToggleDone: () -> Void
    let openURL: OpenURLAction
    var hero: Bool = false

    @State private var whyOpen = false

    private var isCase: Bool { play.kind == "case" }
    private var accent: Color {
        isCase ? Color(red: 0.114, green: 0.208, blue: 0.341) : Color(red: 0, green: 0.478, blue: 1.0)
    }
    private var kindLabel: String { isCase ? "검증된 사례" : "지금 뜨는 트렌드" }
    private var mission: String { play.mission?.isEmpty == false ? play.mission! : play.title }
    private var deliverables: [PlayDeliverable] { play.deliverables ?? [] }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 8) {
                // 배지 줄 — 시간이 제일 앞
                HStack(spacing: 6) {
                    if let t = play.timeLabel, !t.isEmpty {
                        Text("⏱ \(t)")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10).padding(.vertical, 3)
                            .background(Color(red: 0.114, green: 0.208, blue: 0.341), in: Capsule())
                    }
                    Text(kindLabel)
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundStyle(accent)
                        .padding(.horizontal, 8).padding(.vertical, 2)
                        .background(accent.opacity(0.12), in: Capsule())
                    if isCase, let brand = play.source.brand, !brand.isEmpty {
                        Text(brand)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                }

                // 미션 한 문장 — 첫 화면의 주인공
                Text(mission)
                    .font(.system(size: hero ? 19 : 15, weight: .bold))
                    .tracking(-0.3)
                    .foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)

                // 실행물 — 복사 버튼 (v2) / 구캐시는 단계 폴백
                if !deliverables.isEmpty {
                    VStack(spacing: 8) {
                        ForEach(Array(deliverables.enumerated()), id: \.offset) { _, dv in
                            DeliverableCopyRow(deliverable: dv)
                        }
                    }
                } else {
                    stepsList(size: 12.5)
                }

                // "왜 이걸 하래요?" — 근거는 지우지 않고 접는다
                Button {
                    withAnimation(.easeInOut(duration: 0.15)) { whyOpen.toggle() }
                } label: {
                    HStack {
                        Text("왜 이걸 하래요?")
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                            .rotationEffect(.degrees(whyOpen ? 90 : 0))
                    }
                    .padding(.top, 8)
                    .overlay(Rectangle().fill(BUColor.cardBorder).frame(height: 1), alignment: .top)
                }
                .buttonStyle(.plain)

                if whyOpen { whyBlock }

                Button(action: onToggleDone) {
                    HStack(spacing: 6) {
                        Image(systemName: done ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 13, weight: .bold))
                        Text(done ? "이번 주에 했어요" : "이거 했어요 — 다음 주 추천에 반영")
                            .font(.system(size: 13, weight: .heavy))
                    }
                    .foregroundStyle(done ? Color(red: 0.114, green: 0.478, blue: 0.243) : BUColor.ink)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background((done ? BUColor.success.opacity(0.10) : Color(red: 0.97, green: 0.97, blue: 0.98)), in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(done ? BUColor.success.opacity(0.4) : BUColor.cardBorder, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 14).padding(.vertical, 13)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color.white.opacity(0.96)))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    private func stepsList(size: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(play.application.steps.enumerated()), id: \.offset) { idx, step in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("\(idx + 1)")
                        .font(.system(size: 10.5, weight: .heavy))
                        .foregroundStyle(.white)
                        .frame(width: 18, height: 18)
                        .background(BUColor.success, in: RoundedRectangle(cornerRadius: 5))
                    Text(step)
                        .font(.system(size: size, weight: .medium))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
            }
        }
    }

    // 접기 내부 — 사례 근거 + (실행물이 있으면) 자세한 순서 + 기대효과 + 도구
    private var whyBlock: some View {
        VStack(alignment: .leading, spacing: 9) {
            VStack(alignment: .leading, spacing: 5) {
                Text(isCase ? "이렇게 했어요" : "지금 이게 통해요")
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(0.5).textCase(.uppercase)
                    .foregroundStyle(accent)
                Text(play.source.whatHappened)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                if !play.source.whyItWorked.isEmpty {
                    (Text("왜 통했나 ").font(.system(size: 12.5, weight: .heavy)).foregroundColor(accent)
                     + Text(play.source.whyItWorked).font(.system(size: 12.5, weight: .medium)).foregroundColor(BUColor.inkMuted))
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if play.source.metric != nil || play.source.url != nil {
                    HStack(spacing: 10) {
                        if let m = play.source.metric, !m.isEmpty {
                            Text(m)
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(accent)
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(accent.opacity(0.10), in: RoundedRectangle(cornerRadius: 6))
                        }
                        if let urlStr = play.source.url, let url = URL(string: urlStr) {
                            Button { openURL(url) } label: {
                                Text("출처 보기 →").font(.system(size: 11, weight: .semibold)).foregroundStyle(accent)
                            }.buttonStyle(.plain)
                        }
                        Spacer(minLength: 0)
                    }
                }
            }
            if !deliverables.isEmpty && !play.application.steps.isEmpty {
                VStack(alignment: .leading, spacing: 5) {
                    Text("자세한 순서")
                        .font(.system(size: 10.5, weight: .heavy))
                        .tracking(0.5).textCase(.uppercase)
                        .foregroundStyle(BUColor.success)
                    stepsList(size: 12)
                }
            }
            if !play.application.expectedEffect.isEmpty {
                (Text("기대 효과 ").font(.system(size: 12, weight: .heavy)).foregroundColor(Color(red: 0.114, green: 0.208, blue: 0.341))
                 + Text(play.application.expectedEffect).font(.system(size: 12, weight: .semibold)).foregroundColor(BUColor.ink))
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 10).padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.success.opacity(0.05), in: RoundedRectangle(cornerRadius: 10))
            }
            if !play.tools.isEmpty {
                FlowChips(items: play.tools) { tool in
                    PlayToolPill(tool: tool, openURL: openURL)
                }
            }
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(accent.opacity(0.04), in: RoundedRectangle(cornerRadius: 12))
    }
}

// 복사 실행물 한 줄 — 탭 → 클립보드 + 1.6초 확인 표시 (웹 CopyRow 미러)
private struct DeliverableCopyRow: View {
    let deliverable: PlayDeliverable
    @State private var copied = false

    private let blue = Color(red: 0, green: 0.478, blue: 1.0)

    var body: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(deliverable.label)
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                Text(deliverable.content)
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            Button {
                #if canImport(UIKit)
                UIPasteboard.general.string = deliverable.content
                #endif
                MarketingRepository.logEngagement(event: "copy_click") // "쓸 재료였는가"의 직접 신호
                copied = true
                Task {
                    try? await Task.sleep(nanoseconds: 1_600_000_000)
                    copied = false
                }
            } label: {
                Text(copied ? "✓ 복사됨" : "복사")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(copied ? Color(red: 0.114, green: 0.208, blue: 0.341) : blue)
                    .padding(.horizontal, 13).padding(.vertical, 7)
                    .background(copied ? BUColor.success.opacity(0.08) : Color.white, in: RoundedRectangle(cornerRadius: 9))
                    .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(copied ? BUColor.success.opacity(0.5) : blue.opacity(0.3), lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(blue.opacity(0.04), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }
}

private struct PlayToolPill: View {
    let tool: PlayTool
    let openURL: OpenURLAction

    private var tierColor: Color {
        switch tool.tier {
        case "free": return Color(red: 0.114, green: 0.208, blue: 0.341)
        case "paid": return Color(red: 0, green: 0.478, blue: 1.0)
        default:     return BUColor.warn
        }
    }
    private var tierLabel: String {
        switch tool.tier {
        case "free": return "무료"
        case "paid": return "유료"
        default:     return "부분무료"
        }
    }

    var body: some View {
        Button {
            if let s = tool.url, let u = URL(string: s) { openURL(u) }
        } label: {
            HStack(spacing: 6) {
                Text(tool.name).font(.system(size: 11.5, weight: .heavy)).foregroundStyle(BUColor.ink)
                Text(tierLabel).font(.system(size: 9.5, weight: .heavy)).foregroundStyle(tierColor)
            }
            .padding(.horizontal, 9).padding(.vertical, 4)
            .background(tierColor.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(tierColor.opacity(0.18), lineWidth: 1))
        }
        .buttonStyle(.plain)
        .disabled(tool.url == nil)
    }
}

// MARK: - Simple chip wrap (항목 ≤5 — 한 줄 3개씩 묶어 줄바꿈)

private struct FlowChips<Item: Hashable, Content: View>: View {
    let items: [Item]
    @ViewBuilder let content: (Item) -> Content

    private var rows: [[Item]] {
        stride(from: 0, to: items.count, by: 3).map { start in
            Array(items[start..<min(start + 3, items.count)])
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                HStack(spacing: 6) {
                    ForEach(row, id: \.self) { it in content(it) }
                    Spacer(minLength: 0)
                }
            }
        }
    }
}
