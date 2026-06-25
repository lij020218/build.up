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
    @State private var toggles: [String: Bool] = [:]      // bizRegToggle·permitToggle·vatCalendarToggle
    @State private var selections: [String: String] = [:] // taxTypeSelect·cpaDecision (단일 선택)
    @State private var checklist: Set<String> = []        // taxChecklist 체크된 id
    @State private var axisChecks: Set<String> = []       // axisChecklist(permit-check 3축) 체크된 task id
    @State private var gateChecks: Set<String> = []       // gateChecklist(contract-review 9대 조항) 체크된 item id

    public let content: BUStageContent
    public init(content: BUStageContent) { self.content = content }

    /// 단일 선택 ref → advance inputs 의 정식 키(StageInputProjector 가 컬럼 투영).
    private static let inputKeyForRef: [String: String] = [
        "taxTypeSelect": "taxTypeChoice",
        "cpaDecision": "cpaDecision",
    ]

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
    /// 게이팅에 필요한 taxChecklist required id 목록.
    private var requiredChecklistIds: [String] {
        (cat?.taxChecklist ?? []).filter { $0.required == true }.map { $0.id }
    }

    /// axisChecklist 섹션의 전체 task id(게이팅 — 3축 모두 통과). permit-check.
    private var axisChecklistTaskIds: [String] {
        var ids: [String] = []
        for p in content.pages {
            for s in p.sections {
                if case let .axisChecklist(_, _, axes) = s {
                    for a in axes { ids.append(contentsOf: (cat?.workSteps?[a.axis]?.tasks ?? []).map(\.id)) }
                }
            }
        }
        return ids
    }
    private var hasAxisChecklist: Bool { !axisChecklistTaskIds.isEmpty }

    /// gateChecklist 섹션의 전체 item id(게이팅 — 모두 체크). contract-review 9대 조항.
    private var gateChecklistIds: [String] {
        var ids: [String] = []
        for p in content.pages {
            for s in p.sections {
                if case let .gateChecklist(_, _, items, _) = s { ids.append(contentsOf: items.map(\.id)) }
            }
        }
        return ids
    }
    private var hasGateChecklist: Bool { !gateChecklistIds.isEmpty }

    private var canComplete: Bool {
        let refs = iosRefs
        if refs.contains("bizRegToggle"), toggles["bizRegToggle"] != true { return false }
        if refs.contains("permitToggle"), toggles["permitToggle"] != true { return false }
        if refs.contains("taxTypeSelect"), (selections["taxTypeSelect"] ?? "").isEmpty { return false }
        if refs.contains("cpaDecision"), (selections["cpaDecision"] ?? "").isEmpty { return false }
        if refs.contains("taxChecklist"), !requiredChecklistIds.allSatisfy({ checklist.contains($0) }) { return false }
        if hasAxisChecklist, !axisChecklistTaskIds.allSatisfy({ axisChecks.contains($0) }) { return false }
        if hasGateChecklist, !gateChecklistIds.allSatisfy({ gateChecks.contains($0) }) { return false }
        if refs.contains("contractSign"), toggles["contractSign"] != true { return false }
        return true
    }
    private var advanceHint: String {
        let refs = iosRefs
        if refs.contains("bizRegToggle"), toggles["bizRegToggle"] != true { return "사업자등록 완료 토글을 켜세요" }
        if refs.contains("permitToggle"), toggles["permitToggle"] != true { return "영업신고증 발급 완료를 체크하세요" }
        if refs.contains("taxChecklist") {
            let done = requiredChecklistIds.filter { checklist.contains($0) }.count
            let total = requiredChecklistIds.count
            if done < total { return "기본 셋업 \(done)/\(total) — 모두 완료해야 진행" }
        }
        if hasAxisChecklist {
            let total = axisChecklistTaskIds.count
            let done = axisChecklistTaskIds.filter { axisChecks.contains($0) }.count
            if done < total { return "「체크리스트」 탭에서 내 매물 점검 (\(done)/\(total)) — 3축 모두 통과해야 진행" }
        }
        if hasGateChecklist {
            let total = gateChecklistIds.count
            let done = gateChecklistIds.filter { gateChecks.contains($0) }.count
            if done < total { return "「마무리」 탭에서 핵심 조항을 모두 체크하세요 (\(done)/\(total))" }
        }
        if refs.contains("contractSign"), toggles["contractSign"] != true { return "임대 계약서 서명 완료 토글을 켜세요" }
        if refs.contains("taxTypeSelect"), (selections["taxTypeSelect"] ?? "").isEmpty { return "과세유형을 선택하세요" }
        if refs.contains("cpaDecision"), (selections["cpaDecision"] ?? "").isEmpty { return "세무 처리 방식을 선택하세요" }
        return "완료 — 다음 단계로"
    }

    private func defaultsKey(_ s: String) -> String { "stage.\(content.stageId).\(s)" }

    private func loadInteractiveState() {
        let d = UserDefaults.standard
        let refs = iosRefs
        for t in ["bizRegToggle", "permitToggle", "vatCalendarToggle", "contractSign"] where refs.contains(t) {
            toggles[t] = d.bool(forKey: defaultsKey(t))
        }
        for s in ["taxTypeSelect", "cpaDecision"] where refs.contains(s) {
            selections[s] = d.string(forKey: defaultsKey(s)) ?? ""
        }
        if refs.contains("taxChecklist") {
            checklist = Set(d.stringArray(forKey: defaultsKey("taxChecklist")) ?? [])
        }
        if hasAxisChecklist {
            axisChecks = Set(d.stringArray(forKey: defaultsKey("axisChecks")) ?? [])
        }
        if hasGateChecklist {
            gateChecks = Set(d.stringArray(forKey: defaultsKey("gateChecks")) ?? [])
        }
    }
    private func setAxisChecks(_ ids: Set<String>) {
        axisChecks = ids
        UserDefaults.standard.set(Array(ids), forKey: defaultsKey("axisChecks"))
    }
    private func setGateChecks(_ ids: Set<String>) {
        gateChecks = ids
        UserDefaults.standard.set(Array(ids), forKey: defaultsKey("gateChecks"))
    }
    private func persistToggle(_ ref: String, _ value: Bool) {
        toggles[ref] = value
        UserDefaults.standard.set(value, forKey: defaultsKey(ref))
    }
    private func select(_ ref: String, _ value: String) {
        selections[ref] = value
        UserDefaults.standard.set(value, forKey: defaultsKey(ref))
        if ref == "taxTypeSelect" {
            // 선택 즉시 Supabase 동기화 (advance 안 해도 웹과 일치).
            StoreProfileRepository.persistVatTypeForCurrentUser(value)
        }
    }
    private func setChecklist(_ ids: Set<String>) {
        checklist = ids
        UserDefaults.standard.set(Array(ids), forKey: defaultsKey("taxChecklist"))
    }
    private func advanceInputs() -> [String: String] {
        var inputs: [String: String] = [:]
        for (ref, key) in Self.inputKeyForRef {
            if let v = selections[ref], !v.isEmpty { inputs[key] = v }
        }
        return inputs
    }

    /// 현재 페이지의 페이지별 KEY ACTION (있으면 BUStageShell hero 로 override).
    private var currentPageKeyAction: BUStageKeyAction? {
        guard let pid = content.pages[safe: page]?.id,
              let ka = cat?.pageKeyActions?[pid] else { return nil }
        return BUStageKeyAction(title: ka.title, detail: ka.detail)
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
                roadmapStore.advanceToNext(currentStageId: content.stageId, inputs: advanceInputs())
            },
            onUncomplete: { roadmapStore.uncompleteStage(content.stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: content.stageId, inputs: advanceInputs())
            },
            wrapup: wrapupData,
            currentPage: page,
            totalPages: content.pages.count,
            keyActionOverride: currentPageKeyAction
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
                            sectionView(section, pageId: p.id)
                        }
                    }
                }
            }
        }
        .onAppear { loadInteractiveState() }
    }

    // MARK: - 섹션 렌더

    @ViewBuilder
    private func sectionView(_ section: BUStageContent.Section, pageId: String) -> some View {
        switch section {
        case let .whyList(_, _, items):
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                ForEach(items, id: \.title) { whyCard($0) }
            }
        case let .stepList(icon, eyebrow, subtitle, steps, meta, links):
            stepListSection(icon: icon, eyebrow: eyebrow, subtitle: subtitle, steps: steps, meta: meta, links: links)
        case .permit:
            if let cat, let permit = cat.permit { permitSection(cat, permit: permit) }
        case let .pitfalls(title):
            if let items = cat?.pitfalls, !items.isEmpty { pitfallsSection(title: title, items: items) }
        case let .pathCards(_, eyebrow, subtitle, cards, includeCategoryPath):
            pathCardsSection(eyebrow: eyebrow, subtitle: subtitle, cards: cards, includeCategoryPath: includeCategoryPath)
        case let .checklist(eyebrow):
            if let items = cat?.weeklyChecklist, !items.isEmpty { checklistSection(eyebrow: eyebrow, items: items) }
        case let .infoCard(_, accent, title, body):
            infoCardSection(accent: accent, title: title, body: body)
        case .pageKeyAction:
            EmptyView()   // iOS 는 BUStageShell hero(keyActionOverride)로 표시
        case let .scheduleList(eyebrow):
            if let rows = cat?.schedule, !rows.isEmpty { scheduleListSection(eyebrow: eyebrow, rows: rows) }
        case let .iconCardList(eyebrow, subtitle):
            if let tips = cat?.taxTips, !tips.isEmpty { iconCardListSection(eyebrow: eyebrow, subtitle: subtitle, cards: tips) }
        case let .calloutWarning(severity, title):
            if let traps = cat?.trapsByPage?[pageId], !traps.isEmpty {
                calloutWarningSection(title: title, items: traps, severity: severity)
            }
        case let .comparisonCards(eyebrow, cards):
            comparisonCardsSection(eyebrow: eyebrow, cards: cards)
        case let .cpaCriteria(eyebrow, subtitle):
            if let needs = cat?.cpaNeeded, !needs.isEmpty { cpaCriteriaSection(eyebrow: eyebrow, subtitle: subtitle, needs: needs) }
        case let .linkCards(eyebrow, links):
            linkCardsSection(eyebrow: eyebrow, links: links)
        case .wrapup:
            EmptyView()   // BUStageShell 이 마지막 페이지에서 wrapup 표시
        case let .interactive(ref, platforms, config):
            if (platforms ?? ["web", "ios"]).contains("ios") {
                interactiveSection(ref: ref, config: config)
            }
        case let .stageOverview(headline, intro, stat, outlineEyebrow, workOutline, outcomeTitle, outcome):
            stageOverviewSection(headline: headline, intro: intro, stat: stat, outlineEyebrow: outlineEyebrow, workOutline: workOutline, outcomeTitle: outcomeTitle, outcome: outcome)
        case let .workStep(axis, stepLabel, time, headline, why, tasks, watchouts, showFavorable):
            workStepSection(axis: axis, stepLabel: stepLabel, time: time, headline: headline, why: why, tasks: tasks, watchouts: watchouts, showFavorable: showFavorable)
        case let .axisChecklist(eyebrow, subtitle, axes):
            axisChecklistSection(eyebrow: eyebrow, subtitle: subtitle, axes: axes)
        case let .gateChecklist(eyebrow, subtitle, items, doneNote):
            gateChecklistSection(eyebrow: eyebrow, subtitle: subtitle, items: items, doneNote: doneNote)
        case let .noteList(severity, title, items):
            noteListSection(severity: severity, title: title, items: items)
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

    private func permitSection(_ cat: BUStageContent.CategoryContent, permit p: BUStageContent.PermitInfo) -> some View {
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
                    ForEach(Array((cat.requiredPermits ?? []).enumerated()), id: \.offset) { idx, rp in
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

    // MARK: tax-guide 신규 섹션

    private func scheduleListSection(eyebrow: String, rows: [BUStageContent.ScheduleRow]) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(eyebrow)
                ForEach(rows, id: \.title) { row in
                    HStack(alignment: .top, spacing: BUSpacing.sm) {
                        Text(row.date)
                            .font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                            .fixedSize()
                        VStack(alignment: .leading, spacing: 2) {
                            Text(row.title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(row.detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer()
                    }
                }
            }
        }
    }

    private func iconCardListSection(eyebrow: String, subtitle: String?, cards: [BUStageContent.IconCard]) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow(eyebrow)
                    if let subtitle {
                        Text(subtitle).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    ForEach(cards, id: \.label) { c in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(BUColor.midnight.opacity(0.08)).frame(width: 32, height: 32)
                                Image(systemName: Self.sfSymbol(c.icon)).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(c.label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(c.detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    private func calloutWarningSection(title: String?, items: [BUStageContent.TrapItem], severity: String?) -> some View {
        let color = severity == "warn" ? BUColor.warn : BUColor.danger
        return BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                if let title {
                    Text(title).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(color)
                }
                ForEach(items, id: \.label) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(color).frame(width: 4, height: 4).padding(.top, 6)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(color)
                                .fixedSize(horizontal: false, vertical: true)
                            Text(item.text).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
    }

    private func comparisonCardsSection(eyebrow: String, cards: [BUStageContent.ComparisonCard]) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(eyebrow)
                ForEach(cards, id: \.title) { c in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Text(c.title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                            if let criteria = c.criteria {
                                Text(criteria).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                            }
                        }
                        Text(c.desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }

    private func cpaCriteriaSection(eyebrow: String, subtitle: String?, needs: [BUStageContent.CpaNeed]) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(eyebrow)
                if let subtitle {
                    Text(subtitle).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                ForEach(needs, id: \.condition) { n in
                    let rec = n.recommend ?? true
                    HStack(alignment: .top, spacing: BUSpacing.sm) {
                        Image(systemName: rec ? "checkmark.circle.fill" : "minus.circle")
                            .font(.system(size: 16))
                            .foregroundStyle(rec ? BUColor.success : BUColor.inkMuted)
                            .padding(.top, 1)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(n.condition).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                .fixedSize(horizontal: false, vertical: true)
                            Text(n.reason).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer()
                    }
                }
            }
        }
    }

    private func linkCardsSection(eyebrow: String, links: [BUStageContent.LinkCard]) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(eyebrow)
                ForEach(links, id: \.url) { link in
                    if let url = URL(string: link.url) {
                        Link(destination: url) {
                            HStack(spacing: BUSpacing.sm) {
                                Text(link.badge)
                                    .font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                                    .frame(width: 32, height: 32)
                                    .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(link.name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text(link.desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer()
                                Image(systemName: "arrow.up.right").font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.inkMuted)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: permit-check 신규 섹션 (stageOverview / workStep / axisChecklist)

    private func stageOverviewSection(headline: String, intro: String, stat: BUStageContent.Stat, outlineEyebrow: String, workOutline: [BUStageContent.OutlineItem], outcomeTitle: String, outcome: String) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 12) {
                    BUEyebrow("이 단계 개요")
                    Text(headline)
                        .font(.system(size: 18, weight: .heavy)).tracking(-0.3)
                        .foregroundStyle(BUColor.midnightDeep).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(intro)
                        .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                    HStack(spacing: 12) {
                        Text(stat.value).font(.system(size: 30, weight: .heavy)).foregroundStyle(BUColor.midnight)
                        Text(stat.label).font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                    .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 12) {
                    Text(outlineEyebrow)
                        .font(.system(size: 11, weight: .heavy)).tracking(0.6).textCase(.uppercase)
                        .foregroundStyle(BUColor.midnight.opacity(0.7))
                    ForEach(Array(workOutline.enumerated()), id: \.offset) { i, o in
                        outlineRow(i + 1, o.title, o.detail, o.time)
                    }
                }
            }
            HStack(alignment: .top, spacing: 9) {
                Image(systemName: "arrow.up.right.circle.fill").font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.success).padding(.top, 1)
                VStack(alignment: .leading, spacing: 3) {
                    Text(outcomeTitle).font(.system(size: 11, weight: .heavy)).tracking(0.3).foregroundStyle(BUColor.success)
                    Text(outcome).font(.system(size: 12.5)).foregroundStyle(BUColor.ink.opacity(0.78)).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.success.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.success.opacity(0.16), lineWidth: 1))
        }
    }

    private func outlineRow(_ num: Int, _ title: String, _ detail: String, _ time: String?) -> some View {
        HStack(alignment: .top, spacing: 11) {
            Text("\(num)").font(.system(size: 12, weight: .heavy)).foregroundStyle(BUColor.midnight)
                .frame(width: 22, height: 22).background(BUColor.midnight.opacity(0.10), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(title).font(.system(size: 14, weight: .semibold)).foregroundStyle(BUColor.ink)
                    if let time {
                        Text(time).font(.system(size: 10.5, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                            .padding(.horizontal, 6).padding(.vertical, 1)
                            .background(BUColor.midnight.opacity(0.06), in: Capsule())
                    }
                }
                Text(detail).font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }

    @ViewBuilder
    private func workStepSection(axis: String, stepLabel: String, time: String?, headline: String, why: String?, tasks: [BUStageContent.WorkStepTask]?, watchouts: [BUStageContent.TrapItem]?, showFavorable: Bool) -> some View {
        let ws = cat?.workSteps?[axis]
        let resolvedTasks = (tasks ?? ws?.tasks ?? []).map { BUWorkStepTask(title: $0.title, detail: $0.detail) }
        let resolvedWatch = (watchouts ?? ws?.watchouts ?? []).map { BUWorkStepWatchout(label: $0.label, text: $0.text) }
        let resolvedWhy = why ?? ws?.why
        let fav: BUWorkStepFavorable? = (showFavorable ? cat?.favorable.map { BUWorkStepFavorable(context: $0.context, recommendation: $0.recommendation, rationale: $0.rationale) } : nil)
        BUWorkStep(
            stepLabel: stepLabel,
            time: time,
            headline: headline,
            why: resolvedWhy,
            tasks: resolvedTasks,
            watchouts: resolvedWatch,
            favorable: fav
        )
    }

    private func axisChecklistSection(eyebrow: String, subtitle: String?, axes: [BUStageContent.AxisRef]) -> some View {
        let allIds = axes.flatMap { (cat?.workSteps?[$0.axis]?.tasks ?? []).map(\.id) }
        let doneCount = allIds.filter { axisChecks.contains($0) }.count
        let allPassed = !allIds.isEmpty && doneCount == allIds.count
        return VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 6) {
                    BUEyebrow(eyebrow)
                    Text("\(doneCount)/\(allIds.count) 확인 완료")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(allPassed ? BUColor.success : BUColor.midnightDeep)
                    if let subtitle {
                        Text(subtitle).font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            ForEach(axes, id: \.axis) { a in
                let rows = cat?.workSteps?[a.axis]?.tasks ?? []
                let passed = !rows.isEmpty && rows.allSatisfy { axisChecks.contains($0.id) }
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: BUSpacing.sm) {
                        Image(systemName: Self.sfSymbol(a.icon)).font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(passed ? BUColor.success : BUColor.midnight)
                        Text(a.title).font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                        Spacer()
                        if passed {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(BUColor.success).font(.system(size: 18))
                        }
                    }
                    BUCard(.card) {
                        VStack(spacing: 0) {
                            ForEach(rows, id: \.id) { row in
                                axisCheckRow(row)
                            }
                        }
                    }
                }
            }
        }
    }

    private func axisCheckRow(_ row: BUStageContent.WorkStepTask) -> some View {
        let isChecked = axisChecks.contains(row.id)
        return Button {
            var next = axisChecks
            if next.contains(row.id) { next.remove(row.id) } else { next.insert(row.id) }
            setAxisChecks(next)
        } label: {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Image(systemName: isChecked ? "checkmark.square.fill" : "square")
                    .font(.system(size: 18)).foregroundStyle(isChecked ? BUColor.success : BUColor.inkSubtle).padding(.top, 1)
                VStack(alignment: .leading, spacing: 3) {
                    Text(row.title).font(BUFont.bodySmall).foregroundStyle(isChecked ? BUColor.ink : BUColor.inkMuted)
                        .multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                    Text(row.detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
            }
            .padding(.vertical, 10).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func gateChecklistSection(eyebrow: String, subtitle: String?, items: [BUStageContent.GateItem], doneNote: String?) -> some View {
        let done = items.filter { gateChecks.contains($0.id) }.count
        let allDone = !items.isEmpty && done == items.count
        return VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack {
                        BUEyebrow(eyebrow)
                        Spacer()
                        Text("\(done)/\(items.count)")
                            .font(.system(size: 11, weight: .bold)).foregroundStyle(allDone ? .white : BUColor.inkSecondary)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(allDone ? BUColor.success : BUColor.midnight.opacity(0.08), in: Capsule())
                    }
                    if let subtitle {
                        Text(subtitle).font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    ForEach(items, id: \.id) { item in
                        gateCheckRow(item)
                    }
                    if allDone, let doneNote {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.seal.fill").foregroundStyle(BUColor.success)
                            Text(doneNote).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.success)
                        }.padding(.top, 4)
                    }
                }
            }
        }
    }

    private func gateCheckRow(_ item: BUStageContent.GateItem) -> some View {
        let isChecked = gateChecks.contains(item.id)
        return Button {
            var next = gateChecks
            if next.contains(item.id) { next.remove(item.id) } else { next.insert(item.id) }
            setGateChecks(next)
        } label: {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Image(systemName: isChecked ? "checkmark.square.fill" : "square")
                    .font(.system(size: 18)).foregroundStyle(isChecked ? BUColor.success : BUColor.inkSubtle).padding(.top, 1)
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.label).font(BUFont.bodySmall).foregroundStyle(isChecked ? BUColor.ink : BUColor.inkMuted)
                        .multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                    if let detail = item.detail, !isChecked {
                        Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer()
            }
            .padding(.vertical, 8).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func noteListSection(severity: String?, title: String, items: [String]) -> some View {
        let color = severity == "danger" ? BUColor.danger : BUColor.warn
        return BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                Text(title).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(color)
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(color).frame(width: 4, height: 4).padding(.top, 5)
                        Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
    }

    private static func sfSymbol(_ icon: String) -> String {
        switch icon {
        case "fileText":      return "doc.text.fill"
        case "banknote":      return "banknote.fill"
        case "sparkles":      return "sparkles"
        case "clipboard":     return "list.clipboard.fill"
        case "percent":       return "percent"
        case "creditCard":    return "creditcard.fill"
        case "users":         return "person.2.fill"
        case "rosette":       return "rosette"
        case "shieldCheck":   return "checkmark.shield"
        case "building":      return "building.2"
        case "receipt":       return "receipt"
        case "lightbulb":     return "lightbulb"
        case "arrowRight":    return "arrow.right"
        case "checklist":     return "checklist"
        case "calendar":      return "calendar"
        case "alertTriangle": return "exclamationmark.triangle.fill"
        default:              return "circle.fill"
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
        case "vatCalendarToggle":
            BUCard(.card) {
                Toggle(isOn: Binding(
                    get: { toggles["vatCalendarToggle"] ?? false },
                    set: { persistToggle("vatCalendarToggle", $0) }
                )) {
                    Text(config?.label ?? "세금 신고 캘린더 등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        case "taxChecklist":
            BUInteractiveChecklist(
                title: config?.title ?? "필수 세팅",
                items: (cat?.taxChecklist ?? []).map { .init(id: $0.id, label: $0.label, detail: $0.detail) },
                checked: Binding(get: { checklist }, set: { setChecklist($0) })
            )
        case "cpaDecision":
            cpaDecisionSelector(config: config)
        case "taxFaq":
            BUTaxFAQCard()
        case "contractSign":
            BUCard(.card) {
                Toggle(isOn: Binding(
                    get: { toggles["contractSign"] ?? false },
                    set: { persistToggle("contractSign", $0) }
                )) {
                    Text("임대 계약서 서명 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        case "contractAiAnalysis":
            BUContractAnalysisCard()
        default:
            // storeName·docUpload 등 현재 웹 전용 ref → iOS 미구현(후속 이식).
            EmptyView()
        }
    }

    private func cpaDecisionSelector(config: BUStageContent.InteractiveConfig?) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(config?.eyebrow ?? "세무 처리 방식 선택")
                HStack(spacing: BUSpacing.sm) {
                    ForEach(config?.options ?? [], id: \.value) { opt in
                        cpaOptionCard(opt)
                    }
                }
            }
        }
    }

    private func cpaOptionCard(_ opt: BUStageContent.TaxOption) -> some View {
        let isSelected = (selections["cpaDecision"] ?? "") == opt.value
        return Button {
            select("cpaDecision", isSelected ? "" : opt.value)
        } label: {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack {
                    Text(opt.title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Spacer()
                    if isSelected { Image(systemName: "checkmark.circle.fill").foregroundStyle(BUColor.success) }
                }
                ForEach(opt.pros ?? [], id: \.self) { pro in
                    HStack(alignment: .top, spacing: 4) {
                        Text("·").foregroundStyle(BUColor.midnight)
                        Text(pro).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(1.5)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                if let cost = opt.cost {
                    Text(cost).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight).padding(.top, 2)
                }
            }
            .padding(BUSpacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.surface, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 2))
        }
        .buttonStyle(.plain)
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
        let isSelected = (selections["taxTypeSelect"] ?? "") == value
        return Button {
            select("taxTypeSelect", value)
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
