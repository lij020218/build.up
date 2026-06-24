//
//  BUStageContentRenderer.swift — 단계 "내용" SSOT(@foundone/shared stages)를 iOS에서 렌더.
//
//  같은 BUStageContent(JSON, 웹 SSOT codegen) 를 웹 StageContentRenderer 와 같은 내용으로 렌더 →
//  web↔iOS 무드리프트(제목·내용 차이) 구조적 불가.
//
//  정적 섹션(whyList·stepList·permit·pitfalls·pathCards·checklist·infoCard·wrapup)은 데이터로,
//  인터랙티브 위젯(kind="interactive")은 ref→네이티브 위젯(토글·과세칩·홈택스)으로 매핑.
//  업종별 분기(인허가·함정·체크리스트·업종코드)는 byCategory[categoryId] 에서 읽음.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct BUStageContentRenderer: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    @State private var toggles: [String: Bool] = [:]
    @State private var taxType: String = ""

    public let content: BUStageContent
    public init(content: BUStageContent) { self.content = content }

    // MARK: - 카테고리 해석 (CategoryId.rawValue == 웹 industryCategoryId == byCategory 키)

    private var categoryId: String {
        let raw = IndustryCluster.from(industryId: industryId).category.rawValue
        return content.byCategory[raw] != nil ? raw : (content.byCategory["food"] != nil ? "food" : (content.byCategory.keys.sorted().first ?? ""))
    }
    private var cat: BUStageContent.CategoryContent? { content.byCategory[categoryId] }
    private var pageLabels: [String] { content.pages.map(\.label) }

    // MARK: - 인터랙티브 게이팅 (iOS 가 렌더하는 ref 중 완료 필요한 것)

    private var iosRefs: Set<String> {
        var refs = Set<String>()
        for p in content.pages {
            for s in p.sections {
                if case let .interactive(ref, platforms, _) = s {
                    if (platforms ?? ["web", "ios"]).contains("ios") { refs.insert(ref) }
                }
            }
        }
        return refs
    }
    private var requiresBizReg: Bool { iosRefs.contains("bizRegToggle") }
    private var requiresPermit: Bool { iosRefs.contains("permitToggle") }
    private var requiresTax: Bool { iosRefs.contains("taxTypeSelect") }

    private var canComplete: Bool {
        (!requiresBizReg || toggles["bizRegToggle"] == true) &&
        (!requiresPermit || toggles["permitToggle"] == true) &&
        (!requiresTax || !taxType.isEmpty)
    }
    private var advanceHint: String {
        if requiresBizReg && toggles["bizRegToggle"] != true { return "사업자등록 완료 토글을 켜세요" }
        if requiresPermit && toggles["permitToggle"] != true { return "영업신고증 발급 완료를 체크하세요" }
        if requiresTax && taxType.isEmpty { return "과세유형을 선택하세요" }
        return "등록·인허가 완료 — 다음 단계로"
    }

    private func defaultsKey(_ ref: String) -> String { "stage.\(content.stageId).\(ref)" }

    private func loadInteractiveState() {
        let d = UserDefaults.standard
        if requiresBizReg { toggles["bizRegToggle"] = d.bool(forKey: defaultsKey("bizRegToggle")) }
        if requiresPermit { toggles["permitToggle"] = d.bool(forKey: defaultsKey("permitToggle")) }
        if requiresTax { taxType = d.string(forKey: defaultsKey("taxTypeSelect")) ?? "" }
    }
    private func persistToggle(_ ref: String, _ value: Bool) {
        toggles[ref] = value
        UserDefaults.standard.set(value, forKey: defaultsKey(ref))
    }
    private func selectTaxType(_ value: String) {
        taxType = value
        UserDefaults.standard.set(value, forKey: defaultsKey("taxTypeSelect"))
        // 선택 즉시 Supabase 동기화 (advance 안 해도 웹과 일치).
        StoreProfileRepository.persistVatTypeForCurrentUser(value)
    }

    private var wrapupData: BUStageWrapupData {
        BUStageWrapupData(
            doneItems: content.wrapup.doneItems.map { .init(label: $0.label, detail: $0.detail) },
            verifyItems: content.wrapup.verifyItems,
            nextStageLabel: content.wrapup.nextStageLabel,
            nextSummary: content.wrapup.nextSummary
        )
    }

    public var body: some View {
        BUStageShell(
            stageId: content.stageId,
            title: content.shell.title,
            stageEyebrow: content.shell.stageEyebrow,
            helperText: content.shell.helperText,
            canAdvance: canComplete,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(content.stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: content.stageId, inputs: ["taxTypeChoice": taxType])
            },
            onUncomplete: { roadmapStore.uncompleteStage(content.stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: content.stageId, inputs: ["taxTypeChoice": taxType])
            },
            wrapup: wrapupData,
            currentPage: page,
            totalPages: content.pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: content.pages.count,
                    labels: pageLabels,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )
                if let p = content.pages[safe: page] {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        ForEach(Array(p.sections.enumerated()), id: \.offset) { _, section in
                            sectionView(section)
                        }
                    }
                }
            }
        }
        .onAppear { loadInteractiveState() }
    }

    // MARK: - 섹션 렌더

    @ViewBuilder
    private func sectionView(_ section: BUStageContent.Section) -> some View {
        switch section {
        case let .whyList(_, _, items):
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                ForEach(items, id: \.title) { whyCard($0) }
            }
        case let .stepList(icon, eyebrow, subtitle, steps, meta, links):
            stepListSection(icon: icon, eyebrow: eyebrow, subtitle: subtitle, steps: steps, meta: meta, links: links)
        case .permit:
            if let cat { permitSection(cat) }
        case let .pitfalls(title):
            if let cat { pitfallsSection(title: title, items: cat.pitfalls) }
        case let .pathCards(_, eyebrow, subtitle, cards, includeCategoryPath):
            pathCardsSection(eyebrow: eyebrow, subtitle: subtitle, cards: cards, includeCategoryPath: includeCategoryPath)
        case let .checklist(eyebrow):
            if let cat { checklistSection(eyebrow: eyebrow, items: cat.weeklyChecklist) }
        case let .infoCard(_, accent, title, body):
            infoCardSection(accent: accent, title: title, body: body)
        case .wrapup:
            EmptyView()   // BUStageShell 이 마지막 페이지에서 wrapup 표시
        case let .interactive(ref, platforms, config):
            if (platforms ?? ["web", "ios"]).contains("ios") {
                interactiveSection(ref: ref, config: config)
            }
        case .unsupported:
            EmptyView()
        }
    }

    // MARK: 정적 섹션 뷰

    private func whyCard(_ item: BUStageContent.WhyItem) -> some View {
        BUCard(.card) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Circle().fill(accentColor(item.accent)).frame(width: 8, height: 8).padding(.top, 6)
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(item.body).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private func stepListSection(icon: String?, eyebrow: String, subtitle: String?, steps: [BUStageContent.Step], meta: [BUStageContent.Meta]?, links: [BUStageContent.LinkRef]?) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow(eyebrow)
                    if let subtitle { Text(subtitle).font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary) }
                }
            }
            BUCard(.card) {
                VStack(spacing: 0) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                        let extra = step.detailFromCategory.flatMap { categoryFieldValue($0) }.map { " \($0)" } ?? ""
                        stepRow(num: i + 1, title: step.title, detail: step.detail + extra, isLast: i == steps.count - 1)
                    }
                }
            }
            if let meta, !meta.isEmpty {
                HStack(spacing: 8) {
                    ForEach(meta, id: \.label) { metaBox(label: $0.label, value: $0.value, sublabel: $0.sublabel) }
                }
            }
            if let links, !links.isEmpty {
                FlowLinks(links: links)
            }
        }
    }

    private func permitSection(_ cat: BUStageContent.CategoryContent) -> some View {
        let p = cat.permit
        return VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow("2단계 · \(p.name)")
                    Text("\(cat.label) 업종 — \(p.description)")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            // 신청 장소 + 바로가기
            BUCard(.card) {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        BUEyebrow("신청 장소")
                        Text(p.whereLabel).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer()
                    if let urlStr = p.externalUrl, let url = URL(string: urlStr) {
                        Link(destination: url) {
                            HStack(spacing: 4) {
                                Text("바로가기").font(.system(size: 12, weight: .bold))
                                Image(systemName: "arrow.up.right").font(.system(size: 10, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                    }
                }
            }
            // 필요 서류
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 8) {
                    BUEyebrow("필요 서류 (\(p.documents.count)종)")
                    FlowChips(items: p.documents)
                }
            }
            // 핵심 요건
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 8) {
                    BUEyebrow("핵심 요건")
                    ForEach(p.requirements, id: \.self) { req in
                        HStack(alignment: .top, spacing: 6) {
                            Text("•").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            Text(req).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
            // 필수 인허가 리스트(발급기관·처리일)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("필수 인허가 — \(cat.label)")
                    ForEach(Array(cat.requiredPermits.enumerated()), id: \.offset) { idx, rp in
                        if idx > 0 { Divider() }
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(alignment: .firstTextBaseline, spacing: 6) {
                                Text(rp.label).font(BUFont.bodySmall.weight(.heavy)).foregroundStyle(BUColor.ink)
                                Spacer()
                                Text(rp.estimatedDays == 0 ? "즉시" : "\(rp.estimatedDays)일")
                                    .font(.system(size: 10, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                    .padding(.horizontal, 6).padding(.vertical, 2)
                                    .background(BUColor.midnight.opacity(0.10), in: Capsule())
                            }
                            Text(rp.agency).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight)
                            Text(rp.detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            // 비용 / 소요 / 유형 meta
            HStack(spacing: 8) {
                metaBox(label: "비용", value: metaValue(p.cost), sublabel: metaSub(p.cost))
                metaBox(label: "소요", value: metaValue(p.duration), sublabel: metaSub(p.duration))
                metaBox(label: "유형", value: p.kind, sublabel: kindSub(p.kind))
            }
        }
    }

    private func pitfallsSection(title: String, items: [String]) -> some View {
        BUCard(.card) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(BUColor.danger).font(.system(size: 16))
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.danger)
                    ForEach(items, id: \.self) { p in
                        HStack(alignment: .top, spacing: 6) {
                            Text("⚠").font(.system(size: 10)).padding(.top, 2)
                            Text(p).font(BUFont.bodyCaption).foregroundStyle(BUColor.danger).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
    }

    private func pathCardsSection(eyebrow: String, subtitle: String?, cards: [BUStageContent.PathCard], includeCategoryPath: Bool) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow(eyebrow)
                    if let subtitle { Text(subtitle).font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary) }
                }
            }
            ForEach(cards, id: \.condition) { pathCard($0) }
            if includeCategoryPath, let extra = cat?.extraPath { pathCard(extra) }
        }
    }

    private func pathCard(_ c: BUStageContent.PathCard) -> some View {
        BUCard(.card) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Text(c.condition)
                    .font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                    .fixedSize(horizontal: false, vertical: true)
                VStack(alignment: .leading, spacing: 3) {
                    Text("→ " + c.recommendation).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(c.reason).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private func checklistSection(eyebrow: String, items: [String]) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(eyebrow)
                ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                    HStack(alignment: .top, spacing: 8) {
                        Text("\(i+1).").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                            .frame(width: 18, alignment: .leading)
                        Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
    }

    private func infoCardSection(accent: String?, title: String, body: String) -> some View {
        BUCard(.card) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Image(systemName: "arrow.right")
                    .foregroundStyle(BUColor.midnight).font(.system(size: 15, weight: .semibold))
                    .frame(width: 26, height: 26)
                    .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(body).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    // MARK: 인터랙티브 섹션 (ref → 네이티브 위젯)

    @ViewBuilder
    private func interactiveSection(ref: String, config: BUStageContent.InteractiveConfig?) -> some View {
        switch ref {
        case "hometaxLink":
            BUHometaxLink()
        case "bizRegToggle":
            BUCard(.card) {
                Toggle(isOn: Binding(
                    get: { toggles["bizRegToggle"] ?? false },
                    set: { persistToggle("bizRegToggle", $0) }
                )) {
                    Text(config?.label ?? "사업자등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        case "permitToggle":
            BUCard(.card) {
                Toggle(isOn: Binding(
                    get: { toggles["permitToggle"] ?? false },
                    set: { persistToggle("permitToggle", $0) }
                )) {
                    Text("\(cat?.label ?? "") \(config?.labelSuffix ?? "인허가 발급 완료")").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        case "taxTypeSelect":
            taxTypeSelector(config: config)
        default:
            // storeName·docUpload 등 현재 웹 전용 ref → iOS 미구현(후속 이식).
            EmptyView()
        }
    }

    private func taxTypeSelector(config: BUStageContent.InteractiveConfig?) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(config?.eyebrow ?? "내 과세유형 선택")
                HStack(spacing: 10) {
                    ForEach(config?.options ?? [], id: \.value) { opt in
                        taxTypeChip(value: opt.value, title: opt.title, subtitle: opt.subtitle)
                    }
                }
                if let note = config?.note {
                    Text(note).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private func taxTypeChip(value: String, title: String, subtitle: String) -> some View {
        let isSelected = taxType == value
        return Button {
            selectTaxType(value)
        } label: {
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(isSelected ? BUColor.midnightInk : BUColor.ink)
                Text(subtitle).font(.system(size: 10.5, weight: .medium)).foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 12).padding(.vertical, 11)
            .background((isSelected ? BUColor.midnight.opacity(0.10) : BUColor.midnight.opacity(0.04)), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(isSelected ? BUColor.midnight.opacity(0.45) : Color.clear, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }

    // MARK: 공용 작은 뷰 / 헬퍼

    private func stepRow(num: Int, title: String, detail: String, isLast: Bool) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                ZStack {
                    Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                    Text("\(num)").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
            }
            .padding(.horizontal, BUSpacing.md).padding(.vertical, 12)
            if !isLast { Divider().padding(.leading, 52) }
        }
    }

    private func metaBox(label: String, value: String, sublabel: String?) -> some View {
        VStack(spacing: 3) {
            Text(label).font(.system(size: 10, weight: .heavy)).foregroundStyle(BUColor.midnight.opacity(0.55))
                .textCase(.uppercase)
            Text(value).font(.system(size: 15, weight: .bold)).foregroundStyle(BUColor.midnight)
                .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            if let sub = sublabel {
                Text(sub).font(.system(size: 10)).foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 10).padding(.vertical, 12)
        .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func accentColor(_ accent: String) -> Color {
        switch accent {
        case "blue": return .blue
        case "danger": return BUColor.danger
        default: return BUColor.midnight
        }
    }

    private func categoryFieldValue(_ key: String) -> String? {
        guard let cat else { return nil }
        switch key {
        case "industryCodeHint": return cat.industryCodeHint
        case "label": return cat.label
        default: return nil
        }
    }

    private func metaValue(_ s: String) -> String {
        (s.components(separatedBy: "(").first ?? s).trimmingCharacters(in: .whitespaces)
    }
    private func metaSub(_ s: String) -> String? {
        guard let range = s.range(of: "(") else { return nil }
        let rest = String(s[range.upperBound...])
        return rest.replacingOccurrences(of: ")", with: "").trimmingCharacters(in: .whitespaces)
    }
    private func kindSub(_ kind: String) -> String {
        switch kind {
        case "신고": return "알림"
        case "허가": return "금지 해제"
        case "등록": return "기록 등재"
        default: return "자격 부여"
        }
    }
}

// MARK: - 링크·칩 플로우 레이아웃

private struct FlowLinks: View {
    let links: [BUStageContent.LinkRef]
    var body: some View {
        FlowLayout(spacing: 6) {
            ForEach(links, id: \.url) { link in
                if let url = URL(string: link.url) {
                    Link(destination: url) {
                        HStack(spacing: 5) {
                            Text(link.label).font(.system(size: 12, weight: .semibold))
                            Image(systemName: "arrow.up.right").font(.system(size: 10, weight: .bold))
                        }
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
                    }
                }
            }
        }
    }
}

private struct FlowChips: View {
    let items: [String]
    var body: some View {
        FlowLayout(spacing: 6) {
            ForEach(items, id: \.self) { item in
                Text(item)
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.ink)
                    .padding(.horizontal, 10).padding(.vertical, 6)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
            }
        }
    }
}

/// 간단한 좌측정렬 wrap 레이아웃 (칩·링크용).
private struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0; y += rowHeight + spacing; rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let maxWidth = bounds.width
        var x: CGFloat = bounds.minX, y: CGFloat = bounds.minY, rowHeight: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x + size.width > bounds.minX + maxWidth, x > bounds.minX {
                x = bounds.minX; y += rowHeight + spacing; rowHeight = 0
            }
            sub.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
