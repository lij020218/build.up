//
//  MarketingCampaignsList.swift — 채널별 지출 추적 (웹 1080–1202 미러)
//
//  • 추천 채널 chip 줄 (active=초록, inactive=회색) — 업종별 RECOMMENDED_CHANNELS
//  • 캠페인 리스트 (채널 아이콘 + 이름 + 지출 → 매출 (ROAS) + 삭제)
//  • 인라인 collapsible 추가 폼 (채널 picker + 지출 (만원) + 매출 (만원) + 추가 버튼)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct MarketingCampaignsList: View {
    let campaigns: [CampaignRecord]
    let industryCategoryId: String?
    let onAdd: (CampaignRecord) -> Void
    let onDelete: (String) -> Void

    @State private var formOpen: Bool = false
    @State private var formChannel: String = "instagram"
    @State private var formSpendMan: String = ""        // 만원 단위
    @State private var formRevenueMan: String = ""      // 만원 단위

    private var currentMonth: String { MarketingRepository.currentMonthKey() }
    private var monthCampaigns: [CampaignRecord] {
        campaigns.filter { $0.month == currentMonth }
            .sorted { $0.spend > $1.spend }
    }
    private var activeChannels: Set<String> {
        Set(monthCampaigns.map(\.channel))
    }
    private var recommended: [String] {
        MarketingChannelMeta.recommendedChannels(for: industryCategoryId)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            recommendedChips
            campaignsBlock
            if formOpen {
                addForm
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

    // MARK: - Sections

    private var header: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text("지출 추적")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.8)
                    .foregroundStyle(BUColor.inkMuted.opacity(0.55))
                    .textCase(.uppercase)
                Text("채널별 마케팅 지출")
                    .font(.system(size: 16, weight: .bold))
                    .tracking(-0.32)
                    .foregroundStyle(BUColor.ink)
                Text("이달 \(monthCampaigns.count)건 · \(currentMonth)")
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .padding(.top, 2)
            }
            Spacer(minLength: 6)
            Button {
                withAnimation(.easeInOut(duration: 0.18)) { formOpen.toggle() }
            } label: {
                Text(formOpen ? "닫기" : "+ 캠페인 추가")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(Color(red: 0, green: 0.478, blue: 1.0))
                    .padding(.horizontal, 10).padding(.vertical, 6)
                    .background(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.08), in: Capsule())
            }
            .buttonStyle(.plain)
        }
    }

    private var recommendedChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(recommended, id: \.self) { ch in
                    if let meta = MarketingChannelMeta.meta(for: ch) {
                        RecommendedChip(meta: meta, active: activeChannels.contains(ch))
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    @ViewBuilder
    private var campaignsBlock: some View {
        if monthCampaigns.isEmpty {
            if !formOpen {
                Button {
                    withAnimation(.easeInOut(duration: 0.18)) { formOpen = true }
                } label: {
                    Text("마케팅 지출을 기록하면 ROI를 추적할 수 있어요")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                        .padding(16)
                        .frame(maxWidth: .infinity)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .strokeBorder(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.15), style: StrokeStyle(lineWidth: 1, dash: [4]))
                        )
                }
                .buttonStyle(.plain)
            }
        } else {
            VStack(spacing: 6) {
                ForEach(monthCampaigns) { campaign in
                    CampaignRow(campaign: campaign, onDelete: { onDelete(campaign.id) })
                }
            }
        }
    }

    private var addForm: some View {
        VStack(spacing: 8) {
            ChannelDropdown(selected: $formChannel)

            HStack(spacing: 8) {
                NumberInput(label: "지출 (만원)", value: $formSpendMan)
                NumberInput(label: "매출 기여 (만원)", value: $formRevenueMan)
            }

            Button {
                submit()
            } label: {
                Text("추가")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(canSubmit ? .white : BUColor.inkMuted.opacity(0.6))
                    .padding(.vertical, 11)
                    .frame(maxWidth: .infinity)
                    .background(
                        canSubmit
                            ? LinearGradient(colors: [Color(red: 0, green: 0.478, blue: 1.0), Color(red: 0.659, green: 0.333, blue: 0.969)], startPoint: .leading, endPoint: .trailing)
                            : LinearGradient(colors: [BUColor.inkMuted.opacity(0.1), BUColor.inkMuted.opacity(0.1)], startPoint: .leading, endPoint: .trailing),
                        in: RoundedRectangle(cornerRadius: 10)
                    )
            }
            .buttonStyle(.plain)
            .disabled(!canSubmit)
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.02), in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.08), lineWidth: 1)
        )
        .transition(.opacity.combined(with: .move(edge: .top)))
    }

    // MARK: - Actions

    private var canSubmit: Bool {
        (Int(formSpendMan) ?? 0) > 0
    }

    private func submit() {
        guard canSubmit else { return }
        let spendWon = (Int(formSpendMan) ?? 0) * 10_000
        let revWon: Int? = {
            guard let v = Int(formRevenueMan), v > 0 else { return nil }
            return v * 10_000
        }()
        let record = CampaignRecord(
            channel: formChannel,
            month: currentMonth,
            spend: spendWon,
            attributedRevenue: revWon,
            note: nil
        )
        onAdd(record)
        // reset
        formSpendMan = ""
        formRevenueMan = ""
        withAnimation(.easeInOut(duration: 0.18)) { formOpen = false }
    }
}

// MARK: - Recommended chip

private struct RecommendedChip: View {
    let meta: MarketingChannelMeta
    let active: Bool

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: meta.iconSystemName)
                .font(.system(size: 10, weight: .bold))
            Text(meta.labelKo)
                .font(.system(size: 11, weight: .heavy))
        }
        .foregroundStyle(active ? BUColor.success : BUColor.inkMuted.opacity(0.55))
        .padding(.horizontal, 10).padding(.vertical, 4)
        .background(
            (active ? BUColor.success.opacity(0.08) : BUColor.inkMuted.opacity(0.04)),
            in: RoundedRectangle(cornerRadius: 8)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .strokeBorder(active ? BUColor.success.opacity(0.16) : BUColor.cardBorder.opacity(0.5), lineWidth: 1)
        )
    }
}

// MARK: - Campaign row

private struct CampaignRow: View {
    let campaign: CampaignRecord
    let onDelete: () -> Void

    private var meta: MarketingChannelMeta? {
        MarketingChannelMeta.meta(for: campaign.channel)
    }

    private var roas: Double {
        guard campaign.spend > 0 else { return 0 }
        return Double(campaign.attributedRevenue ?? 0) / Double(campaign.spend)
    }

    var body: some View {
        HStack(spacing: 10) {
            if let meta {
                Image(systemName: meta.iconSystemName)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Color(buHex: meta.colorHex))
                    .frame(width: 18)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(meta?.labelKo ?? campaign.channel)
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                HStack(spacing: 3) {
                    Text(formatWon(campaign.spend))
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                    if let rev = campaign.attributedRevenue, rev > 0 {
                        Text("→ \(formatWon(rev))")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                        Text(String(format: "(%.1fx)", roas))
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(roas >= 2 ? BUColor.success
                                            : roas >= 1 ? BUColor.warn
                                            : BUColor.danger)
                    }
                }
            }
            Spacer(minLength: 6)
            Button(action: onDelete) {
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.45))
                    .frame(width: 24, height: 24)
                    .background(BUColor.inkMuted.opacity(0.06), in: RoundedRectangle(cornerRadius: 6))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12).padding(.vertical, 9)
        .frame(maxWidth: .infinity)
        .background(BUColor.inkMuted.opacity(0.02), in: RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(BUColor.cardBorder.opacity(0.4), lineWidth: 1)
        )
    }
}

// MARK: - Form inputs

private struct ChannelDropdown: View {
    @Binding var selected: String

    var body: some View {
        Menu {
            ForEach(MarketingChannelMeta.all, id: \.key) { meta in
                Button {
                    selected = meta.key
                } label: {
                    Label(meta.labelKo, systemImage: meta.iconSystemName)
                }
            }
        } label: {
            HStack(spacing: 8) {
                if let meta = MarketingChannelMeta.meta(for: selected) {
                    Image(systemName: meta.iconSystemName)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(buHex: meta.colorHex))
                    Text(meta.labelKo)
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.up.chevron.down")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.horizontal, 12).padding(.vertical, 11)
            .frame(maxWidth: .infinity)
            .background(Color.white.opacity(0.96), in: RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
        }
    }
}

private struct NumberInput: View {
    let label: String
    @Binding var value: String

    var body: some View {
        TextField(label, text: $value)
            .keyboardType(.numberPad)
            .font(.system(size: 13, weight: .heavy))
            .foregroundStyle(BUColor.ink)
            .padding(.horizontal, 12).padding(.vertical, 11)
            .frame(maxWidth: .infinity)
            .background(Color.white.opacity(0.96), in: RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
    }
}

// MARK: - Color hex helper

fileprivate extension Color {
    init(buHex: String) {
        var s = buHex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        var rgb: UInt64 = 0
        Scanner(string: s).scanHexInt64(&rgb)
        let r = Double((rgb >> 16) & 0xFF) / 255.0
        let g = Double((rgb >>  8) & 0xFF) / 255.0
        let b = Double( rgb        & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
