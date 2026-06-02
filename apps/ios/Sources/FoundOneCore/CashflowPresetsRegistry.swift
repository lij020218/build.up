//
//  CashflowPresetsRegistry.swift — 현금흐름 채널 프리셋 + 업종 기본 믹스 공유 SSOT 로더.
//
//  웹 SSOT: packages/shared/src/cashflow-presets.json (cashflow-presets.ts)
//  데이터: Resources/cashflow-presets.json — 위 파일의 심볼릭 링크.
//  웹 cashflow-store 와 동일한 수수료·정산주기·업종 기본 믹스를 제공한다.
//

import Foundation

public struct BUCashflowChannelPreset: Decodable, Sendable, Hashable, Identifiable {
    public let id: String
    public let labelKo: String
    public let labelEn: String
    public let settlementDays: Int
    public let commissionRate: Double
    public let paymentFeeRate: Double
    public let rateNoteKo: String?
    public let rateNoteEn: String?
}

/// 업종 기본 믹스의 한 원소 (프리셋 + 비율).
public struct BUCashflowDefaultChannel: Sendable, Hashable, Identifiable {
    public let preset: BUCashflowChannelPreset
    public let salesRatio: Int
    public var id: String { preset.id }
}

public enum CashflowPresetsRegistry {

    private struct Root: Decodable {
        let channelPresets: [String: BUCashflowChannelPreset]
        let industryDefaultMix: [String: [MixEntry]]
    }
    private struct MixEntry: Decodable { let id: String; let salesRatio: Int }

    private static let root: Root? = {
        guard let url = Bundle.module.url(forResource: "cashflow-presets", withExtension: "json") else {
            #if DEBUG
            print("⚠️ cashflow-presets.json 번들 누락")
            #endif
            return nil
        }
        do {
            return try JSONDecoder().decode(Root.self, from: try Data(contentsOf: url))
        } catch {
            #if DEBUG
            print("⚠️ cashflow-presets.json 디코딩 실패: \(error)")
            #endif
            return nil
        }
    }()

    /// 채널 id → 프리셋.
    public static func preset(_ id: String) -> BUCashflowChannelPreset? {
        root?.channelPresets[id]
    }

    public static var allPresets: [BUCashflowChannelPreset] {
        guard let root else { return [] }
        return Array(root.channelPresets.values).sorted { $0.id < $1.id }
    }

    /// 업종 카테고리 키 → 기본 채널 믹스. 미식별 시 일반 오프라인(현금10/카드90).
    public static func defaultMix(forCategoryKey key: String) -> [BUCashflowDefaultChannel] {
        guard let root else { return [] }
        let mix = root.industryDefaultMix[key.lowercased()] ?? root.industryDefaultMix["_fallback"] ?? []
        return mix.compactMap { entry in
            guard let p = root.channelPresets[entry.id] else { return nil }
            return BUCashflowDefaultChannel(preset: p, salesRatio: entry.salesRatio)
        }
    }
}
