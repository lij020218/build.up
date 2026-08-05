//
//  StartupToolkitPanelView.swift — 단계별 추천 도구 패널 (웹 StartupToolkitPanel 1:1 미러, 2026-08-05)
//
//  ⚠️ 종전 iOS 는 StartupToolingRegistry 를 로드만 하고 어느 화면도 렌더하지 않았다(패리티 위반).
//  UX: 미리보기 5 + aiTip 상시 노출(특허 시한 경고 등) + 더보기(나머지+선택 도구) + 배지(AI·KR·비개발자).
//  ⚠️ 웹과 예외 없이 1:1 — 구성 변경 시 양쪽 동시.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

struct StartupToolkitPanelView: View {
    let stageId: String

    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var open = false
    @Environment(\.openURL) private var openURL

    var body: some View {
        if let kit = StartupToolingRegistry.toolkit(stageId: stageId, subIndustryId: industryId.isEmpty ? nil : industryId),
           !kit.essential.isEmpty {
            let preview = Array(kit.essential.prefix(5))
            let rest = Array(kit.essential.dropFirst(5))
            let moreCount = rest.count + kit.optional.count

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "shippingbox")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    Text("추천 도구 · AI")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                    Text("월 \(kit.monthlyCost)")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkSubtle)
                    Spacer(minLength: 0)
                }
                ForEach(preview, id: \.name) { toolRow($0) }
                if !kit.aiTipKo.isEmpty {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                            .padding(.top, 2)
                        Text(kit.aiTipKo)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(BUColor.midnight)
                            .lineSpacing(2)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                if moreCount > 0 {
                    Button {
                        withAnimation(.easeInOut(duration: 0.15)) { open.toggle() }
                    } label: {
                        HStack(spacing: 4) {
                            Text(open ? "접기" : "+\(moreCount)개 더보기")
                                .font(.system(size: 12, weight: .bold))
                            Image(systemName: "chevron.down")
                                .font(.system(size: 10, weight: .bold))
                                .rotationEffect(.degrees(open ? 180 : 0))
                        }
                        .foregroundStyle(BUColor.midnight)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 7)
                        .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    if open {
                        ForEach(rest, id: \.name) { toolRow($0) }
                        if !kit.optional.isEmpty {
                            Text("선택 도구 — 상황에 따라")
                                .font(.system(size: 10.5, weight: .heavy))
                                .tracking(0.5)
                                .foregroundStyle(BUColor.inkSubtle)
                                .padding(.top, 4)
                            ForEach(kit.optional, id: \.name) { toolRow($0) }
                        }
                    }
                }
            }
            .padding(BUSpacing.cardPadding)
            .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
        }
    }

    private func toolRow(_ tool: BUStartupTool) -> some View {
        Button {
            if let url = URL(string: tool.url) { openURL(url) }
        } label: {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 5) {
                    Text(tool.name)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                    if tool.aiPowered { badge("AI") }
                    if tool.koreanSupport { badge("KR") }
                    if tool.tags.contains("비개발자") { badge("코딩 몰라도 OK") }
                    Spacer(minLength: 0)
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(BUColor.inkSubtle)
                }
                Text(tool.description.ko)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(1.5)
                    .multilineTextAlignment(.leading)
                Text(tool.pricing)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                (tool.recommended ? BUColor.midnight08 : BUColor.ink.opacity(0.015)),
                in: RoundedRectangle(cornerRadius: 11, style: .continuous)
            )
        }
        .buttonStyle(.plain)
    }

    private func badge(_ label: String) -> some View {
        Text(label)
            .font(.system(size: 9, weight: .bold))
            .foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 5).padding(.vertical, 1)
            .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 4, style: .continuous))
    }
}
