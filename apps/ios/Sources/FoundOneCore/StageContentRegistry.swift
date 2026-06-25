//
//  StageContentRegistry.swift — 로드맵 단계 "내용" SSOT(JSON) 디코드 + 조회.
//
//  웹 SSOT: packages/shared/src/stages (schema.ts + content/*.ts)
//  생성:    scripts/gen-stage-content-json.mts → stage-content.json
//  리소스:  Resources/stage-content.json (packages/shared/src/stages/stage-content.json 심볼릭 링크)
//
//  iOS는 이 데이터를 BUStageContentRenderer(SwiftUI)로 렌더 → 웹 StageContentRenderer 와
//  같은 내용을 그린다(무드리프트 불가). 이 파일은 순수 데이터(Decodable) — SwiftUI 비의존.
//
//  ⚠️ 자동 생성 데이터(JSON)를 읽는 모델. 콘텐츠 수정은 웹 SSOT 한 곳에서만 하고
//     `npx tsx scripts/gen-stage-content-json.mts` 로 재생성.
//

import Foundation

// MARK: - 모델 (schema.ts 미러)

public struct BUStageContent: Decodable, Sendable, Hashable {
    public let stageId: String
    public let shell: Shell
    public let keyAction: KeyAction?
    public let pages: [Page]
    public let byCategory: [String: CategoryContent]
    public let wrapup: Wrapup
    public let wrapupMode: String?

    public struct Shell: Decodable, Sendable, Hashable {
        public let title: String
        public let stageEyebrow: String
        public let helperText: String
    }

    public struct MiniCard: Decodable, Sendable, Hashable {
        public let icon: String
        public let label: String
        public let detail: String
    }

    public struct Pillar: Decodable, Sendable, Hashable {
        public let icon: String
        public let label: String
        public let meta: String
    }

    public struct KeyAction: Decodable, Sendable, Hashable {
        public let eyebrow: String
        public let title: String
        public let subtitle: String
        public let miniCards: [MiniCard]?
        public let pillars: [Pillar]?
    }

    public struct WhyItem: Decodable, Sendable, Hashable {
        public let accent: String
        public let title: String
        public let body: String
    }

    public struct Step: Decodable, Sendable, Hashable {
        public let title: String
        public let detail: String
        public let detailFromCategory: String?
    }

    public struct Meta: Decodable, Sendable, Hashable {
        public let label: String
        public let value: String
        public let sublabel: String?
    }

    public struct LinkRef: Decodable, Sendable, Hashable {
        public let label: String
        public let url: String
    }

    public struct PathCard: Decodable, Sendable, Hashable {
        public let condition: String
        public let recommendation: String
        public let reason: String
    }

    public struct PermitInfo: Decodable, Sendable, Hashable {
        public let kind: String
        public let name: String
        public let whereLabel: String   // JSON "where" (Swift 예약어 회피)
        public let cost: String
        public let duration: String
        public let documents: [String]
        public let requirements: [String]
        public let externalUrl: String?
        public let description: String

        private enum CodingKeys: String, CodingKey {
            case kind, name, cost, duration, documents, requirements, externalUrl, description
            case whereLabel = "where"
        }
    }

    public struct PermitRequirement: Decodable, Sendable, Hashable {
        public let label: String
        public let agency: String
        public let detail: String
        public let estimatedDays: Int
    }

    public struct PageKeyAction: Decodable, Sendable, Hashable {
        public let title: String
        public let detail: String
    }

    public struct ScheduleRow: Decodable, Sendable, Hashable {
        public let date: String
        public let title: String
        public let detail: String
    }

    public struct IconCard: Decodable, Sendable, Hashable {
        public let icon: String
        public let label: String
        public let detail: String
    }

    public struct TrapItem: Decodable, Sendable, Hashable {
        public let label: String
        public let text: String
    }

    public struct CpaNeed: Decodable, Sendable, Hashable {
        public let condition: String
        public let reason: String
        public let recommend: Bool?
    }

    public struct ComparisonCard: Decodable, Sendable, Hashable {
        public let title: String
        public let criteria: String?
        public let desc: String
    }

    public struct LinkCard: Decodable, Sendable, Hashable {
        public let name: String
        public let desc: String
        public let url: String
        public let badge: String
    }

    public struct ChecklistItem: Decodable, Sendable, Hashable {
        public let id: String
        public let label: String
        public let detail: String
        public let required: Bool?
    }

    // ── permit-check 식 stageOverview / workStep / axisChecklist ──

    public struct Stat: Decodable, Sendable, Hashable {
        public let value: String
        public let label: String
    }

    public struct OutlineItem: Decodable, Sendable, Hashable {
        public let title: String
        public let detail: String
        public let time: String?
    }

    public struct WorkStepTask: Decodable, Sendable, Hashable {
        public let id: String
        public let title: String
        public let detail: String
    }

    public struct WorkStepData: Decodable, Sendable, Hashable {
        public let why: String
        public let tasks: [WorkStepTask]
        public let watchouts: [TrapItem]
    }

    public struct Favorable: Decodable, Sendable, Hashable {
        public let context: String
        public let recommendation: String
        public let rationale: String
    }

    public struct AxisRef: Decodable, Sendable, Hashable {
        public let axis: String
        public let icon: String
        public let title: String
    }

    public struct GateItem: Decodable, Sendable, Hashable {
        public let id: String
        public let label: String
        public let detail: String?
    }

    public struct CategoryContent: Decodable, Sendable, Hashable {
        public let label: String
        // registration-setup 인허가 데이터(optional)
        public let industryCodeHint: String?
        public let permit: PermitInfo?
        public let requiredPermits: [PermitRequirement]?
        public let pitfalls: [String]?
        public let weeklyChecklist: [String]?
        public let extraPath: PathCard?
        // tax-guide 등 페이지·업종 종속 데이터(optional)
        public let pageKeyActions: [String: PageKeyAction]?
        public let schedule: [ScheduleRow]?
        public let taxTips: [IconCard]?
        public let trapsByPage: [String: [TrapItem]]?
        public let cpaNeeded: [CpaNeed]?
        public let taxChecklist: [ChecklistItem]?
        // permit-check 등 축(axis)별 데이터(optional)
        public let workSteps: [String: WorkStepData]?
        public let favorable: Favorable?
    }

    public struct WrapItem: Decodable, Sendable, Hashable {
        public let label: String
        public let detail: String
    }

    public struct Wrapup: Decodable, Sendable, Hashable {
        public let nextStageLabel: String
        public let doneItems: [WrapItem]
        public let verifyItems: [String]
        public let nextSummary: String
    }

    public struct Page: Decodable, Sendable, Hashable {
        public let id: String
        public let label: String
        public let sections: [Section]
    }

    public struct TaxOption: Decodable, Sendable, Hashable {
        public let value: String
        public let title: String
        public let subtitle: String
        // cpaDecision 옵션에서 추가로 쓰는 필드(optional)
        public let desc: String?
        public let pros: [String]?
        public let cost: String?
    }

    /// 인터랙티브 위젯 설정(ref 별 임의값을 평탄화해 디코드).
    public struct InteractiveConfig: Decodable, Sendable, Hashable {
        public let helperText: String?
        public let label: String?
        public let labelSuffix: String?
        public let eyebrow: String?
        public let note: String?
        public let title: String?
        public let options: [TaxOption]?
    }

    /// 섹션 — "kind" 로 분기되는 discriminated union.
    public enum Section: Decodable, Sendable, Hashable {
        case whyList(eyebrow: String?, subtitle: String?, items: [WhyItem])
        case stepList(icon: String?, eyebrow: String, subtitle: String?, steps: [Step], meta: [Meta]?, links: [LinkRef]?)
        case permit(icon: String?)
        case pitfalls(title: String)
        case pathCards(icon: String?, eyebrow: String, subtitle: String?, cards: [PathCard], includeCategoryPath: Bool)
        case checklist(eyebrow: String)
        case infoCard(icon: String?, accent: String?, title: String, body: String)
        case pageKeyAction(icon: String?)
        case scheduleList(eyebrow: String)
        case iconCardList(eyebrow: String, subtitle: String?)
        case calloutWarning(severity: String?, title: String?)
        case comparisonCards(eyebrow: String, cards: [ComparisonCard])
        case cpaCriteria(eyebrow: String, subtitle: String?)
        case linkCards(eyebrow: String, links: [LinkCard])
        case wrapup
        case interactive(ref: String, platforms: [String]?, config: InteractiveConfig?)
        case stageOverview(headline: String, intro: String, stat: Stat, outlineEyebrow: String, workOutline: [OutlineItem], outcomeTitle: String, outcome: String)
        case workStep(axis: String, stepLabel: String, time: String?, headline: String, why: String?, tasks: [WorkStepTask]?, watchouts: [TrapItem]?, showFavorable: Bool)
        case axisChecklist(eyebrow: String, subtitle: String?, axes: [AxisRef])
        case gateChecklist(eyebrow: String, subtitle: String?, items: [GateItem], doneNote: String?)
        case noteList(severity: String?, title: String, items: [String])
        /// 미지원 kind(스키마 확장 시 그레이스풀 스킵).
        case unsupported(String)

        private enum K: String, CodingKey {
            case kind, eyebrow, subtitle, items, icon, steps, meta, links
            case title, cards, includeCategoryPath, accent, body, ref, platforms, config
            case severity
            // stageOverview / workStep / axisChecklist / gateChecklist
            case headline, intro, stat, outlineEyebrow, workOutline, outcomeTitle, outcome
            case axis, stepLabel, time, why, tasks, watchouts, showFavorable, axes
            case doneNote
        }

        public init(from decoder: any Decoder) throws {
            let c = try decoder.container(keyedBy: K.self)
            let kind = try c.decode(String.self, forKey: .kind)
            switch kind {
            case "whyList":
                self = .whyList(
                    eyebrow: try c.decodeIfPresent(String.self, forKey: .eyebrow),
                    subtitle: try c.decodeIfPresent(String.self, forKey: .subtitle),
                    items: try c.decode([WhyItem].self, forKey: .items))
            case "stepList":
                self = .stepList(
                    icon: try c.decodeIfPresent(String.self, forKey: .icon),
                    eyebrow: try c.decode(String.self, forKey: .eyebrow),
                    subtitle: try c.decodeIfPresent(String.self, forKey: .subtitle),
                    steps: try c.decode([Step].self, forKey: .steps),
                    meta: try c.decodeIfPresent([Meta].self, forKey: .meta),
                    links: try c.decodeIfPresent([LinkRef].self, forKey: .links))
            case "permit":
                self = .permit(icon: try c.decodeIfPresent(String.self, forKey: .icon))
            case "pitfalls":
                self = .pitfalls(title: try c.decode(String.self, forKey: .title))
            case "pathCards":
                self = .pathCards(
                    icon: try c.decodeIfPresent(String.self, forKey: .icon),
                    eyebrow: try c.decode(String.self, forKey: .eyebrow),
                    subtitle: try c.decodeIfPresent(String.self, forKey: .subtitle),
                    cards: try c.decode([PathCard].self, forKey: .cards),
                    includeCategoryPath: try c.decodeIfPresent(Bool.self, forKey: .includeCategoryPath) ?? false)
            case "checklist":
                self = .checklist(eyebrow: try c.decode(String.self, forKey: .eyebrow))
            case "infoCard":
                self = .infoCard(
                    icon: try c.decodeIfPresent(String.self, forKey: .icon),
                    accent: try c.decodeIfPresent(String.self, forKey: .accent),
                    title: try c.decode(String.self, forKey: .title),
                    body: try c.decode(String.self, forKey: .body))
            case "pageKeyAction":
                self = .pageKeyAction(icon: try c.decodeIfPresent(String.self, forKey: .icon))
            case "scheduleList":
                self = .scheduleList(eyebrow: try c.decode(String.self, forKey: .eyebrow))
            case "iconCardList":
                self = .iconCardList(
                    eyebrow: try c.decode(String.self, forKey: .eyebrow),
                    subtitle: try c.decodeIfPresent(String.self, forKey: .subtitle))
            case "calloutWarning":
                self = .calloutWarning(
                    severity: try c.decodeIfPresent(String.self, forKey: .severity),
                    title: try c.decodeIfPresent(String.self, forKey: .title))
            case "comparisonCards":
                self = .comparisonCards(
                    eyebrow: try c.decode(String.self, forKey: .eyebrow),
                    cards: try c.decode([ComparisonCard].self, forKey: .cards))
            case "cpaCriteria":
                self = .cpaCriteria(
                    eyebrow: try c.decode(String.self, forKey: .eyebrow),
                    subtitle: try c.decodeIfPresent(String.self, forKey: .subtitle))
            case "linkCards":
                self = .linkCards(
                    eyebrow: try c.decode(String.self, forKey: .eyebrow),
                    links: try c.decode([LinkCard].self, forKey: .links))
            case "wrapup":
                self = .wrapup
            case "interactive":
                self = .interactive(
                    ref: try c.decode(String.self, forKey: .ref),
                    platforms: try c.decodeIfPresent([String].self, forKey: .platforms),
                    config: try c.decodeIfPresent(InteractiveConfig.self, forKey: .config))
            case "stageOverview":
                self = .stageOverview(
                    headline: try c.decode(String.self, forKey: .headline),
                    intro: try c.decode(String.self, forKey: .intro),
                    stat: try c.decode(Stat.self, forKey: .stat),
                    outlineEyebrow: try c.decode(String.self, forKey: .outlineEyebrow),
                    workOutline: try c.decode([OutlineItem].self, forKey: .workOutline),
                    outcomeTitle: try c.decode(String.self, forKey: .outcomeTitle),
                    outcome: try c.decode(String.self, forKey: .outcome))
            case "workStep":
                self = .workStep(
                    axis: try c.decode(String.self, forKey: .axis),
                    stepLabel: try c.decode(String.self, forKey: .stepLabel),
                    time: try c.decodeIfPresent(String.self, forKey: .time),
                    headline: try c.decode(String.self, forKey: .headline),
                    why: try c.decodeIfPresent(String.self, forKey: .why),
                    tasks: try c.decodeIfPresent([WorkStepTask].self, forKey: .tasks),
                    watchouts: try c.decodeIfPresent([TrapItem].self, forKey: .watchouts),
                    showFavorable: try c.decodeIfPresent(Bool.self, forKey: .showFavorable) ?? false)
            case "axisChecklist":
                self = .axisChecklist(
                    eyebrow: try c.decode(String.self, forKey: .eyebrow),
                    subtitle: try c.decodeIfPresent(String.self, forKey: .subtitle),
                    axes: try c.decode([AxisRef].self, forKey: .axes))
            case "gateChecklist":
                self = .gateChecklist(
                    eyebrow: try c.decode(String.self, forKey: .eyebrow),
                    subtitle: try c.decodeIfPresent(String.self, forKey: .subtitle),
                    items: try c.decode([GateItem].self, forKey: .items),
                    doneNote: try c.decodeIfPresent(String.self, forKey: .doneNote))
            case "noteList":
                self = .noteList(
                    severity: try c.decodeIfPresent(String.self, forKey: .severity),
                    title: try c.decode(String.self, forKey: .title),
                    items: try c.decode([String].self, forKey: .items))
            default:
                self = .unsupported(kind)
            }
        }
    }
}

// MARK: - 로더 / 조회

public enum StageContentRegistry {

    private static let all: [String: BUStageContent]? = loadJSON("stage-content")

    /// stageId 로 단계 콘텐츠 조회(없으면 nil).
    public static func content(for stageId: String) -> BUStageContent? {
        all?[stageId]
    }

    private static func loadJSON(_ resource: String) -> [String: BUStageContent]? {
        guard let url = Bundle.module.url(forResource: resource, withExtension: "json") else {
            print("⚠️ \(resource).json 번들 누락")
            return nil
        }
        do {
            return try JSONDecoder().decode([String: BUStageContent].self, from: try Data(contentsOf: url))
        } catch {
            print("⚠️ \(resource).json 디코딩 실패: \(error)")
            return nil
        }
    }
}
