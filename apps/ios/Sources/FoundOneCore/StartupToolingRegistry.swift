//
//  StartupToolingRegistry.swift — 스타트업 단계별 도구·추천 스택·공급사 로더 (웹 SSOT 미러)
//
//  웹 SSOT:
//    • packages/shared/src/startup-tools.ts (STARTUP_STAGE_TOOLS·RECOMMENDED_STACKS·SUB_CATEGORY_TOOL_OVERRIDES)
//    • apps/web/.../startup/cluster-stage-vendors.ts (getClusterStageVendors)
//  데이터: Resources/startup-tools.json · cluster-stage-vendors.json (packages/shared/src 심볼릭 링크)
//  생성: npx tsx scripts/gen-startup-tools-json.mts · gen-cluster-vendors-json.mts (수동 편집 금지)
//

import Foundation

public struct BULocalizedText: Decodable, Sendable, Hashable {
    public let ko: String
    public let en: String
}

public struct BUStartupTool: Decodable, Sendable, Hashable, Identifiable {
    public let name: String
    public let category: String
    public let description: BULocalizedText
    public let url: String
    public let pricing: String
    public let monthlyEstimate: String?
    public let koreanSupport: Bool
    public let aiPowered: Bool
    public let recommended: Bool
    public let tags: [String]
    public var id: String { name }
}

public struct BUStageToolKit: Decodable, Sendable {
    public let stageId: String
    public let title: BULocalizedText
    public let description: BULocalizedText
    public let essentialTools: [BUStartupTool]
    public let optionalTools: [BUStartupTool]
    public let aiTip: BULocalizedText
    public let estimatedMonthlyCost: String
}

public struct BUSubCategoryOverride: Decodable, Sendable {
    public let subIndustryId: String
    public let additionalTools: [BUStartupTool]
    public let specificTip: BULocalizedText
}

public struct BUStackLayer: Decodable, Sendable, Hashable, Identifiable {
    public let role: String
    public let roleEn: String
    public let tool: String
    public let why: BULocalizedText
    public let url: String
    public let pricing: String
    public let icon: String
    public let color: String
    public var id: String { role + tool }
}

public struct BURecommendedStack: Decodable, Sendable {
    public let id: String
    public let name: BULocalizedText
    public let description: BULocalizedText
    public let targetSubIndustries: [String]
    public let layers: [BUStackLayer]
    public let totalMonthlyCost: String
    public let startupCredits: BULocalizedText
}

public struct BUClusterVendor: Decodable, Sendable, Hashable, Identifiable {
    public let name: String
    public let category: String
    public let descKo: String
    public let href: String?
    public let pricing: String?
    public let tier: String   // essential | recommended | optional
    public let tags: [String]?
    public var id: String { name }
}

// ── 모바일 앱 출시 상세 가이드 (Apple Developer → 실제 출시) ──
public struct BULaunchLink: Decodable, Sendable, Hashable {
    public let name: String
    public let url: String
}

public struct BULaunchStep: Decodable, Sendable, Hashable, Identifiable {
    public let step: Int
    public let title: String
    public let time: String
    public let detail: String
    public let todo: [String]
    public let links: [BULaunchLink]
    public var id: Int { step }
}

public struct BULaunchNote: Decodable, Sendable, Hashable, Identifiable {
    public let title: String
    public let body: String
    public let link: BULaunchLink?
    public var id: String { title }
}

public struct BUMobileLaunchGuide: Decodable, Sendable {
    public let apple: [BULaunchStep]
    public let google: [BULaunchStep]
    public let korea: [BULaunchNote]
    public let crossCutting: [BULaunchNote]
}

/// 스테이지 도구 키트 (서브카테고리 오버라이드 병합 결과).
public struct BUResolvedToolkit: Sendable {
    public let titleKo: String
    public let essential: [BUStartupTool]
    public let optional: [BUStartupTool]
    public let aiTipKo: String
    public let monthlyCost: String
}

public enum StartupToolingRegistry {

    private struct ToolsRoot: Decodable {
        let stages: [String: BUStageToolKit]
        let stacks: [BURecommendedStack]
        let overrides: [String: BUSubCategoryOverride]
    }

    private static func loadJSON<T: Decodable>(_ resource: String, as type: T.Type) -> T? {
        guard let url = Bundle.module.url(forResource: resource, withExtension: "json") else {
            #if DEBUG
            print("⚠️ \(resource).json 번들 누락")
            #endif
            return nil
        }
        do { return try JSONDecoder().decode(T.self, from: try Data(contentsOf: url)) }
        catch {
            #if DEBUG
            print("⚠️ \(resource).json 디코딩 실패: \(error)")
            #endif
            return nil
        }
    }

    private static let toolsRoot: ToolsRoot? = loadJSON("startup-tools", as: ToolsRoot.self)
    private static let clusterRoot: [String: [BUClusterVendor]]? = loadJSON("cluster-stage-vendors", as: [String: [BUClusterVendor]].self)

    /// 모바일 앱 출시 상세 가이드 (Apple Developer 가입 → 실제 출시).
    public static let mobileLaunchGuide: BUMobileLaunchGuide? = loadJSON("mobile-launch-guide", as: BUMobileLaunchGuide.self)

    private static let verticalBySub: [String: String] = [
        "robotics-physical-ai": "robotics",
        "biotech-medtech": "biotech",
        "semiconductor": "semiconductor",
        "climate-energy": "climate",
    ]

    /// 소프트웨어 단계 도구 키트 (세부업종 오버라이드 병합). 데이터 없으면 nil.
    public static func toolkit(stageId: String, subIndustryId: String?) -> BUResolvedToolkit? {
        guard let base = toolsRoot?.stages[stageId] else { return nil }
        var essential = base.essentialTools
        var tip = base.aiTip.ko
        if let sid = subIndustryId, !sid.isEmpty, let ov = toolsRoot?.overrides[sid] {
            essential += ov.additionalTools
            tip = ov.specificTip.ko
        }
        return BUResolvedToolkit(
            titleKo: base.title.ko, essential: essential, optional: base.optionalTools,
            aiTipKo: tip, monthlyCost: base.estimatedMonthlyCost
        )
    }

    /// 세부업종에 맞는 추천 기술 스택. 없으면 nil.
    public static func recommendedStack(subIndustryId: String?) -> BURecommendedStack? {
        guard let sid = subIndustryId, !sid.isEmpty else { return nil }
        return toolsRoot?.stacks.first { $0.targetSubIndustries.contains(sid) }
    }

    /// 하드웨어·딥테크 단계 추천 공급사·도구. hardware-iot=단계별 단일, 딥테크=vertical 분기.
    public static func clusterVendors(stageId: String, subIndustryId: String?) -> [BUClusterVendor] {
        guard let root = clusterRoot else { return [] }
        if let flat = root[stageId] { return flat }
        guard let sid = subIndustryId, let v = verticalBySub[sid] else { return [] }
        return root["\(stageId)::\(v)"] ?? []
    }
}
