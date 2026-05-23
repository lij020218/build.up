//
//  StartupTypeStageView.swift — 창업 형태 선택 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/StartupTypeSelectionStage.tsx
//  stageId: "startup-type"
//
//  레이아웃 (BUStageShell 사용):
//   ① helper line
//   ② 3-card 그리드 — 독립창업 / 프랜차이즈 / 미정
//   ③ 선택 시 카테고리별 가이드 카드 (펼침)
//   ④ 하단 Continue 바
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpCore
import BuildUpData

private struct StartupTypeOption: Identifiable {
    let id: String
    let icon: String
    let color: Color
    let titleKo: String
    let subtitleKo: String
}

/// 5축 종합 점수 (수익성+안정성+접근성+브랜드+지원) / 5. 웹 computeOverallScore 패턴 미러.
private func overallScore(_ s: FranchiseBrandScores) -> Int {
    (s.profitability + s.stability + s.accessibility + s.brandPower + s.support) / 5
}

public struct StartupTypeStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @Environment(\.dismiss) private var dismiss
    @AppStorage("stage.startupType.selected") private var selected = ""
    @AppStorage("stage.franchise.selectedBrandId") private var franchiseBrandId = ""
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "startup-type"

    /// 프랜차이즈 선택 시 2-page (창업 형태 → 브랜드 선택), 그 외엔 1-page.
    private var pageLabels: [String] {
        selected == "franchise" ? ["창업 형태", "프랜차이즈 브랜드"] : ["창업 형태"]
    }

    /// onAdvance·onEditSave 공유 입력값.
    private var currentInputs: [String: String] {
        var inputs = ["startupType": selected]
        if selected == "franchise", !franchiseBrandId.isEmpty {
            inputs["franchiseBrandId"] = franchiseBrandId
        }
        return inputs
    }

    private var categoryId: String { StarterIndustryData.option(by: industryId)?.categoryId ?? "" }
    private var isStartupTech: Bool { categoryId == "startup-tech" }

    /// 사용자 업종(category 또는 sub-industry) 에 맞는 프랜차이즈 후보.
    /// 1순위: 세부업종 매칭, 2순위: 대분류 매칭 (웹 SSOT — getFranchiseBrandsForSubIndustry → forCategory 폴백).
    /// 정렬: 5축 종합 점수 내림차순 (웹의 computeOverallScore 패턴 미러).
    private var franchiseCandidates: [FranchiseBrand] {
        let base: [FranchiseBrand]
        let sub = FranchiseBrandRegistry.brands(forSubIndustry: industryId)
        if !sub.isEmpty { base = sub }
        else { base = FranchiseBrandRegistry.brands(forCategory: categoryId) }
        return base.sorted { overallScore($0.scores) > overallScore($1.scores) }
    }

    /// 옵션 — startup-tech 는 프랜차이즈 옵션 자체 숨김 (웹 SSOT 패턴).
    /// 독립창업 아이콘은 startup-tech 일 때 ⚡(bolt) 로 전환.
    private var options: [StartupTypeOption] {
        let independentIcon = isStartupTech ? "bolt.fill" : "star.fill"
        let independentSubtitle = isStartupTech
            ? "직접 제품과 회사를 만드는 기술 스타트업입니다"
            : "본인이 직접 브랜드·메뉴를 구성"
        let independent = StartupTypeOption(
            id: "independent", icon: independentIcon,
            color: Color(red: 0.149, green: 0.388, blue: 0.922),
            titleKo: "독립창업", subtitleKo: independentSubtitle
        )
        let franchise = StartupTypeOption(
            id: "franchise", icon: "building.2.fill",
            color: Color(red: 0.486, green: 0.227, blue: 0.929),
            titleKo: "프랜차이즈", subtitleKo: "검증된 브랜드로 빠르게 시작"
        )
        let undecided = StartupTypeOption(
            id: "undecided", icon: "questionmark.circle.fill",
            color: Color(red: 0.420, green: 0.451, blue: 0.502),
            titleKo: "미정", subtitleKo: "아직 결정하지 않음"
        )
        return isStartupTech ? [independent, undecided] : [independent, franchise, undecided]
    }

    public init() {}

    /// 프랜차이즈는 브랜드까지 선택해야 진행. 후보가 없는 업종은 브랜드 없이 진행 허용.
    private var canContinue: Bool {
        guard !selected.isEmpty else { return false }
        if selected == "franchise" && !franchiseCandidates.isEmpty {
            return !franchiseBrandId.isEmpty
        }
        return true
    }

    private var advanceHint: String {
        guard !selected.isEmpty else { return "창업 형태를 선택하세요" }
        switch selected {
        case "independent": return "독립창업 선택 — 다음 단계로 진행"
        case "franchise":
            if franchiseCandidates.isEmpty {
                return "이 업종에 등록된 프랜차이즈 없음 — 그대로 진행"
            }
            if franchiseBrandId.isEmpty { return "프랜차이즈 브랜드를 선택하세요" }
            let name = FranchiseBrandRegistry.brand(by: franchiseBrandId)?.name.ko ?? "선택한 브랜드"
            return "\(name)(으)로 계속"
        default:            return "미정 — 일단 진행 (나중에 변경 가능)"
        }
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "창업 형태 선택",
            stageEyebrow: "단계 2 · 창업 형태",
            helperText: "선택에 따라 이후 단계 (인테리어·메뉴·계약서 검토 등) 가 달라집니다.",
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 창업 형태 검토", detail: "독립창업·프랜차이즈·미정 3옵션 비교 (스타트업은 독립·미정만 노출)"),
                .init(label: "2. 형태별 장단점 인식", detail: "독립=자유도/리스크, 프랜차이즈=즉시런칭/로열티"),
                .init(label: "3. 본인 성향 매칭", detail: "운영 자유도·자본 여력·시장 검증 욕구로 자가 진단"),
                .init(label: "4. 형태 확정", detail: "프랜차이즈 선택 시 브랜드 후보 5개 비교 후 1개 확정"),
                ],
                verifyItems: [
                "프랜차이즈 — 공정위 정보공개서(franchise.ftc.go.kr)에서 가맹사업자 신고 여부·매출액·폐점률 직접 확인",
                "프랜차이즈 — 가맹금 vs 인테리어비 vs 로열티 3개 항목별 별도 견적 (계약서 1식 표기 시 위반)",
                "독립창업 — 메뉴·인테리어·시스템 모두 본인 부담 인식, 6개월~1년 안정화 기간 자본 별도 확보",
                "프랜차이즈 — 가맹점 폐점률 20% 이상 브랜드 회피, 점주 평균 운영기간 5년 미만이면 위험",
                "프랜차이즈 — 본사 변경 약관(인테리어 강제 교체·식자재 단가) 5년 차에 인상되는 경우 다수",
                "독립창업 — 검증된 레퍼런스(타 매장 분석·메뉴 시연·POS 시뮬) 1개 이상 확보 후 진입",
                ],
                nextStageLabel: "운영 모델",
                nextSummary: "창업 형태 확정 → 운영 모델(고정매장·홀 중심·배달 중심·하이브리드) 선택 진입"
            ),
            currentPage: page,
            totalPages: pageLabels.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                if pageLabels.count > 1 {
                    BUWizardPageNav(
                        page: page,
                        totalPages: pageLabels.count,
                        labels: pageLabels,
                        onChange: { newPage in
                            withAnimation(.easeInOut(duration: 0.22)) { page = newPage }
                        }
                    )
                }

                Group {
                    switch page {
                    case 0: typeSelectionPage
                    default: franchiseBrandPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
                .onChange(of: selected) { _, newValue in
                    // 프랜차이즈 해제하면 페이지 0 으로 복귀 (page 1 사라짐)
                    if newValue != "franchise" && page > 0 { page = 0 }
                }
                .onAppear {
                    // 이미 프랜차이즈 선택된 상태로 재진입한 경우 (편집 모드) — 브랜드 페이지로 자동 이동.
                    if selected == "franchise" && !franchiseCandidates.isEmpty && page == 0 {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                            withAnimation(.easeInOut(duration: 0.22)) { page = 1 }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Page 0 — 창업 형태 선택

    @ViewBuilder
    private var typeSelectionPage: some View {
        VStack(alignment: .leading, spacing: 16) {
            LazyVGrid(
                columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                spacing: 12
            ) {
                ForEach(options) { opt in
                    TypeCard(option: opt, isSelected: selected == opt.id) {
                        withAnimation(.snappy(duration: 0.18)) { selected = opt.id }
                        // 프랜차이즈 선택 시 브랜드 후보가 있으면 자동으로 페이지 1 진입
                        // (웹 SSOT 의 "브랜드 선택하기 →" 자동 전환 패턴 미러).
                        if opt.id == "franchise" && !franchiseCandidates.isEmpty {
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                                withAnimation(.easeInOut(duration: 0.22)) { page = 1 }
                            }
                        }
                    }
                }
            }

            if !selected.isEmpty {
                selectionGuide
            }
        }
    }

    // MARK: - Page 1 — 프랜차이즈 브랜드 선택

    @ViewBuilder
    private var franchiseBrandPage: some View {
        franchiseBrandPicker
    }

    // MARK: - Franchise brand picker

    @ViewBuilder
    private var franchiseBrandPicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "building.2.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                Text("프랜차이즈 브랜드 선택")
                    .font(.system(size: 15, weight: .heavy))
                    .tracking(-0.2)
                    .foregroundStyle(BUColor.ink)
            }
            Text("공정거래위원회 정보공개서 기반. 총 비용은 VAT·점포 구입비 별도.")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)

            if franchiseCandidates.isEmpty {
                BUCard(.card) {
                    HStack(spacing: 10) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 16))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("이 업종에는 아직 등록된 프랜차이즈가 없습니다. 그대로 다음 단계로 진행해도 됩니다.")
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(2)
                        Spacer()
                    }
                }
            } else {
                VStack(spacing: 10) {
                    ForEach(franchiseCandidates, id: \.id) { info in
                        FranchiseBrandRow(
                            info: info,
                            isSelected: franchiseBrandId == info.id,
                            action: { franchiseBrandId = (franchiseBrandId == info.id) ? "" : info.id }
                        )
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var selectionGuide: some View {
        switch selected {
        case "independent":
            guideCard(
                color: Color(red: 0.149, green: 0.388, blue: 0.922),
                icon: "lightbulb.fill",
                title: "독립창업 핵심 포인트",
                items: [
                    "브랜드·메뉴·인테리어 모두 본인 부담 — 6~12개월 안정화 자본 별도 확보",
                    "검증 레퍼런스 1개 이상 확보 후 진입 권장 (타 매장 분석·메뉴 시연)",
                    "자유도 최대 — 메뉴·가격·운영 시간 본인이 결정",
                ]
            )
        case "franchise":
            guideCard(
                color: Color(red: 0.486, green: 0.227, blue: 0.929),
                icon: "exclamationmark.triangle.fill",
                title: "프랜차이즈 — 반드시 확인",
                items: [
                    "공정위 정보공개서(franchise.ftc.go.kr) — 가맹사업자 신고 여부·폐점률 직접 확인",
                    "가맹비·인테리어비·로열티 항목별 별도 견적 (계약서 1식 표기 시 주의)",
                    "폐점률 20% 이상 브랜드 · 점주 평균 운영기간 5년 미만이면 위험 신호",
                ]
            )
        case "undecided":
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "clock")
                    .foregroundStyle(BUColor.inkMuted)
                    .font(.system(size: 14, weight: .semibold))
                    .padding(.top, 1)
                Text("이후 단계에서 언제든지 변경 가능합니다. 일단 로드맵을 진행하면서 결정해도 됩니다.")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Color.black.opacity(0.05), lineWidth: 1)
            )
        default:
            EmptyView()
        }
    }

    private func guideCard(color: Color, icon: String, title: String, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 7) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                    .font(.system(size: 13, weight: .bold))
                Text(title)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
            }
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: 8) {
                    Circle()
                        .fill(color)
                        .frame(width: 4, height: 4)
                        .padding(.top, 7)
                    Text(item)
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [color.opacity(0.05), color.opacity(0.02)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 18, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(color.opacity(0.18), lineWidth: 1)
        )
    }
}

private struct TypeCard: View {
    let option: StartupTypeOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .center, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(option.color.opacity(isSelected ? 0.18 : 0.08))
                    Image(systemName: option.icon)
                        .font(.system(size: 22, weight: .regular))
                        .foregroundStyle(option.color.opacity(isSelected ? 1.0 : 0.8))
                }
                .frame(width: 52, height: 52)

                Text(option.titleKo)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(isSelected ? option.color : BUColor.ink)
                    .multilineTextAlignment(.center)
                Text(option.subtitleKo)
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, minHeight: 160)
            .padding(.horizontal, 10)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: isSelected
                                ? [option.color.opacity(0.08), option.color.opacity(0.04)]
                                : [option.color.opacity(0.03), Color.white.opacity(0.9)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(
                        isSelected ? option.color.opacity(0.4) : option.color.opacity(0.1),
                        lineWidth: 1.5
                    )
            )
            .shadow(color: isSelected ? option.color.opacity(0.08) : .clear, radius: 4, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - FranchiseBrandRow

private struct FranchiseBrandRow: View {
    let info: FranchiseBrand
    let isSelected: Bool
    let action: () -> Void

    private func formatManwon(_ manwon: Int) -> String {
        if manwon >= 10_000 {
            let eok = Double(manwon) / 10_000.0
            return eok == Double(Int(eok)) ? "\(Int(eok))억원" : String(format: "%.1f억원", eok)
        }
        return "\(manwon.formatted())만원"
    }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(info.name.ko)
                        .font(.system(size: 15.5, weight: .heavy))
                        .tracking(-0.2)
                        .foregroundStyle(BUColor.ink)
                    if isSelected {
                        Text("선택됨")
                            .font(.system(size: 10, weight: .heavy))
                            .tracking(0.4)
                            .textCase(.uppercase)
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(BUColor.midnight.opacity(0.10), in: Capsule())
                    }
                    Spacer()
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.25))
                }

                Text(info.tagline.ko)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 12) {
                    metric(label: "창업 비용", value: formatManwon(info.startupCostWon))
                    metric(label: "연 매출", value: formatManwon(info.avgAnnualRevenueWon))
                    metric(label: "폐점률", value: String(format: "%.1f%%", info.closureRate))
                    metric(label: "매장수", value: "\(info.storeCount.formatted())")
                }

                // 5축 점수 바 — 웹 SSOT FranchiseBrand.scores (profitability/stability/accessibility/brandPower/support).
                scoreBars(info.scores, overallScore: overallScore(info.scores))

                if isSelected {
                    Divider().padding(.vertical, 2)
                    if let breakdown = info.costBreakdown, !breakdown.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("비용 항목")
                                .font(.system(size: 10.5, weight: .heavy))
                                .tracking(0.4)
                                .textCase(.uppercase)
                                .foregroundStyle(BUColor.inkMuted)
                            ForEach(breakdown, id: \.label.ko) { item in
                                HStack {
                                    Text(item.label.ko)
                                        .font(.system(size: 12.5, weight: .medium))
                                        .foregroundStyle(BUColor.inkSecondary)
                                    Spacer()
                                    Text("\(item.amountWon.formatted())만원")
                                        .font(.system(size: 12.5, weight: .semibold))
                                        .foregroundStyle(BUColor.ink)
                                        .monospacedDigit()
                                }
                            }
                            if let src = info.costSource {
                                Text("출처: \(src) · VAT 별도 · 점포 구입비 별도")
                                    .font(.system(size: 10.5))
                                    .foregroundStyle(BUColor.inkMuted)
                                    .padding(.top, 2)
                            }
                        }
                    }

                    if info.monthlyRoyalty > 0 {
                        let royaltyText = info.monthlyRoyalty.truncatingRemainder(dividingBy: 1) == 0
                            ? "\(Int(info.monthlyRoyalty))"
                            : String(format: "%.1f", info.monthlyRoyalty)
                        Text("월 로열티 \(royaltyText)만원 / 가맹비 \(info.franchiseFee.formatted())만원")
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    } else {
                        Text("로열티 없음 · 가맹비 \(info.franchiseFee.formatted())만원")
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }

                    // 웹 SSOT: 선택된 브랜드의 본사 가맹 안내 페이지 link CTA.
                    if let urlString = info.franchiseUrl, let url = URL(string: urlString) {
                        Link(destination: url) {
                            HStack(spacing: 4) {
                                Text("\(info.name.ko) 가맹 문의")
                                    .font(.system(size: 12, weight: .heavy))
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 10, weight: .heavy))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(BUColor.midnight, in: Capsule())
                        }
                    }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                (isSelected ? BUColor.midnight.opacity(0.05) : Color.white),
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.5) : BUColor.midnight.opacity(0.10), lineWidth: isSelected ? 1.5 : 1)
            )
            .shadow(color: isSelected ? BUColor.midnight.opacity(0.10) : .clear, radius: 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    private func metric(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.4)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted)
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - 5축 점수 바 (웹 FranchiseBrand.scores 미러)

    private func scoreColor(_ v: Int) -> Color {
        if v >= 80 { return Color(red: 0.020, green: 0.588, blue: 0.412) } // green
        if v >= 60 { return Color(red: 0.149, green: 0.388, blue: 0.922) } // blue
        if v >= 40 { return Color(red: 0.918, green: 0.612, blue: 0.047) } // amber
        return Color(red: 0.863, green: 0.149, blue: 0.149)                // red
    }

    @ViewBuilder
    private func scoreBars(_ scores: FranchiseBrandScores, overallScore: Int) -> some View {
        HStack(alignment: .top, spacing: 8) {
            // 종합 점수 원형 게이지
            ZStack {
                Circle()
                    .stroke(scoreColor(overallScore).opacity(0.12), lineWidth: 4)
                Circle()
                    .trim(from: 0, to: CGFloat(overallScore) / 100.0)
                    .stroke(scoreColor(overallScore), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(overallScore)")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(scoreColor(overallScore))
                        .monospacedDigit()
                    Text("종합")
                        .font(.system(size: 8, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            .frame(width: 44, height: 44)

            // 5축 바
            HStack(spacing: 6) {
                scoreBar(label: "수익성", value: scores.profitability)
                scoreBar(label: "안정성", value: scores.stability)
                scoreBar(label: "접근성", value: scores.accessibility)
                scoreBar(label: "브랜드", value: scores.brandPower)
                scoreBar(label: "지원",  value: scores.support)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func scoreBar(label: String, value: Int) -> some View {
        VStack(spacing: 3) {
            // 막대
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(scoreColor(value).opacity(0.10))
                    .frame(width: 14, height: 28)
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(scoreColor(value))
                    .frame(width: 14, height: CGFloat(value) * 28.0 / 100.0)
            }
            Text("\(value)")
                .font(.system(size: 9, weight: .heavy))
                .foregroundStyle(scoreColor(value))
                .monospacedDigit()
            Text(label)
                .font(.system(size: 8, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
    }
}

#if DEBUG
#Preview("StartupType") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["startup-type"] }
    return StartupTypeStageView().environment(store)
}
#endif
