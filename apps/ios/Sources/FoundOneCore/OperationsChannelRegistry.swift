//
//  OperationsChannelRegistry.swift — 운영 채널(배달/예약/마켓플레이스/런칭) 공유 SSOT 로더.
//
//  웹 SSOT: packages/shared/src/operations-channels.json (operations-channels.ts 접근자)
//  데이터: Resources/operations-channels.json — 위 파일의 심볼릭 링크.
//  웹 OperationsSetupStage 와 동일한 cluster 별 채널·라벨을 제공한다.
//  ops_selections 키는 섹션 네임스페이스 고정으로 항상 "delivery-<id>".
//

import Foundation

public struct BUOpsChannel: Decodable, Sendable, Hashable, Identifiable {
    public let id: String
    public let name: String
    public let color: String
    public let url: String
    public let tagline: String
    public let pros: [String]
    public let cons: [String]
}

public enum OperationsChannelRegistry {

    private struct Root: Decodable {
        let categoryToGroup: [String: String]
        let groupLabels: [String: String]
        let channelsByGroup: [String: [BUOpsChannel]]
    }

    private static let root: Root? = {
        guard let url = Bundle.module.url(forResource: "operations-channels", withExtension: "json") else {
            #if DEBUG
            print("⚠️ operations-channels.json 번들 누락")
            #endif
            return nil
        }
        do {
            return try JSONDecoder().decode(Root.self, from: try Data(contentsOf: url))
        } catch {
            #if DEBUG
            print("⚠️ operations-channels.json 디코딩 실패: \(error)")
            #endif
            return nil
        }
    }()

    private static func group(forCategoryKey key: String) -> String {
        root?.categoryToGroup[key] ?? "food-delivery"
    }

    /// 업종 카테고리 키(IndustryCluster.CategoryId.rawValue) → 채널 목록 (4개).
    public static func channels(forCategoryKey key: String) -> [BUOpsChannel] {
        guard let root else { return [] }
        return root.channelsByGroup[group(forCategoryKey: key)] ?? []
    }

    /// 업종 카테고리 키 → 섹션 라벨 ("배달 플랫폼"/"예약 플랫폼"/...).
    public static func label(forCategoryKey key: String) -> String {
        guard let root else { return "유입 채널" }
        return root.groupLabels[group(forCategoryKey: key)] ?? "유입 채널"
    }
}
