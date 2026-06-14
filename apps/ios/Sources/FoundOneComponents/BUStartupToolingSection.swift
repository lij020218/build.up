//
//  BUStartupToolingSection.swift — 스타트업 단계 추천 도구·공급사·기술스택 섹션 (웹 SSOT 미러)
//
//  BUStageShell 이 content 다음에 stageId 로 자동 주입. 데이터 없는 단계는 아무것도 렌더 안 함.
//    • 소프트웨어 단계 → STARTUP_STAGE_TOOLS 도구 키트 (+ launch-gtm 추천 기술 스택)
//    • 하드웨어/딥테크 단계 → cluster-stage-vendors 추천 공급사·도구
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

public struct BUStartupToolingSection: View {
    private let stageId: String
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""

    public init(stageId: String) { self.stageId = stageId }

    private var sid: String? { industryId.isEmpty ? nil : industryId }

    public var body: some View {
        let vendors = StartupToolingRegistry.clusterVendors(stageId: stageId, subIndustryId: sid)
        let toolkit = StartupToolingRegistry.toolkit(stageId: stageId, subIndustryId: sid)
        let stack = stageId == "launch-gtm" ? StartupToolingRegistry.recommendedStack(subIndustryId: industryId) : nil

        if vendors.isEmpty && toolkit == nil && stack == nil {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                if !vendors.isEmpty { vendorCard(vendors) }
                if let toolkit { toolkitCard(toolkit) }
                if let stack { stackCard(stack) }
            }
        }
    }

    // MARK: 하드웨어/딥테크 공급사·도구

    private func vendorCard(_ vendors: [BUClusterVendor]) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("추천 공급사 · 도구")
                Text("💡 광고가 아닌 참고용입니다. 가격·사양은 시점에 따라 변하니 발주·계약·인증 전 직접 검증하세요.")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.warn).lineSpacing(2)
                ForEach(vendors) { v in
                    vendorRow(v)
                    if v.id != vendors.last?.id { Divider() }
                }
            }
        }
    }

    @ViewBuilder
    private func vendorRow(_ v: BUClusterVendor) -> some View {
        let inner =
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(v.name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    tierBadge(v.tier)
                    Text(v.category).font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)
                    Spacer(minLength: 0)
                    if v.href != nil {
                        Image(systemName: "arrow.up.right").font(.system(size: 10)).foregroundStyle(BUColor.inkMuted)
                    }
                }
                Text(v.descKo).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                if let p = v.pricing {
                    Text(p).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        if let href = v.href, let url = URL(string: href) {
            Link(destination: url) { inner }.buttonStyle(.plain)
        } else {
            inner
        }
    }

    @ViewBuilder
    private func tierBadge(_ tier: String) -> some View {
        let (label, color): (String, Color) = {
            switch tier {
            case "essential":   return ("필수", BUColor.midnight)
            case "recommended": return ("권장", Color(red: 0.04, green: 0.45, blue: 0.52))
            default:            return ("선택", Color(red: 0.30, green: 0.34, blue: 0.42))
            }
        }()
        Text(label)
            .font(.system(size: 10, weight: .bold)).foregroundStyle(color)
            .padding(.horizontal, 6).padding(.vertical, 1)
            .background(color.opacity(0.12), in: Capsule())
    }

    // MARK: 소프트웨어 도구 키트

    private func toolkitCard(_ kit: BUResolvedToolkit) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack {
                    BUEyebrow("추천 도구 · AI")
                    Spacer()
                    Text("월 \(kit.monthlyCost)").font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)
                }
                ForEach(kit.essential) { tool in
                    toolRow(tool)
                    if tool.id != kit.essential.last?.id { Divider() }
                }
                if !kit.aiTipKo.isEmpty {
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "sparkles").font(.system(size: 11)).foregroundStyle(BUColor.midnight)
                        Text(kit.aiTipKo).font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight).lineSpacing(2)
                    }
                    .padding(10).frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
        }
    }

    @ViewBuilder
    private func toolRow(_ tool: BUStartupTool) -> some View {
        let inner =
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 5) {
                    Text(tool.name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    if tool.aiPowered { miniTag("AI") }
                    if tool.koreanSupport { miniTag("KR") }
                    Spacer(minLength: 0)
                    Image(systemName: "arrow.up.right").font(.system(size: 10)).foregroundStyle(BUColor.inkMuted)
                }
                Text(tool.description.ko).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                Text(tool.pricing).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        if let url = URL(string: tool.url) {
            Link(destination: url) { inner }.buttonStyle(.plain)
        } else {
            inner
        }
    }

    private func miniTag(_ s: String) -> some View {
        Text(s).font(.system(size: 9, weight: .bold)).foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 4).padding(.vertical, 1)
            .background(BUColor.midnight.opacity(0.1), in: RoundedRectangle(cornerRadius: 4, style: .continuous))
    }

    // MARK: 추천 기술 스택 (launch-gtm)

    private func stackCard(_ stack: BURecommendedStack) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack {
                    BUEyebrow("추천 기술 스택")
                    Spacer()
                    Text(stack.totalMonthlyCost).font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)
                }
                Text(stack.name.ko).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                ForEach(stack.layers) { layer in
                    layerRow(layer)
                    if layer.id != stack.layers.last?.id { Divider() }
                }
                Text("💳 \(stack.startupCredits.ko)")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    .padding(10).frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
    }

    @ViewBuilder
    private func layerRow(_ layer: BUStackLayer) -> some View {
        let inner =
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(layer.role).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                    Spacer(minLength: 0)
                    Text(layer.pricing).font(.system(size: 10)).foregroundStyle(BUColor.inkMuted)
                }
                HStack(spacing: 5) {
                    Text(layer.tool).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    Spacer(minLength: 0)
                    Image(systemName: "arrow.up.right").font(.system(size: 10)).foregroundStyle(BUColor.inkMuted)
                }
                Text(layer.why.ko).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        if let url = URL(string: layer.url) {
            Link(destination: url) { inner }.buttonStyle(.plain)
        } else {
            inner
        }
    }
}
