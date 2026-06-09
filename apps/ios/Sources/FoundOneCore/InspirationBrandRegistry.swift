//
//  InspirationBrandRegistry.swift — 창업 성공 스타트업 카드 데이터 로더.
//
//  웹 SSOT: packages/shared/src/inspiration-data.ts (BRANDS 배열, 20개).
//    Resources/inspiration-brands.json → ../../../../../packages/shared/src/inspiration-brands.json (심볼릭 링크)
//
//  웹 FloatingInspiration.tsx ↔ iOS FloatingInspirationView.swift 가 동일 데이터를 공유.
//  토스·쿠팡·배달의민족·당근·Notion·Stripe·Airbnb 등 — 각 브랜드의 시작 인사이트·차별점·교훈.
//
//  재생성: node scripts/extract-inspiration-brands.cjs (웹 BRANDS → JSON + TS 자동 추출).
//

import Foundation

// MARK: - JSON shape (웹 SSOT InspirationBrand 1:1 미러)

public struct InspirationBrand: Decodable, Sendable, Identifiable, Hashable {
    public let name: String
    public let tagline: String
    public let color: String          // hex "#0064ff"
    public let iconSlug: String?      // Simple Icons slug (글로벌 브랜드) — 없으면 glyph
    public let iconColor: String?     // 아이콘 색(hex, "#" 없음)
    public let glyph: String          // fallback 글리프 (한국 브랜드 등)
    public let textColor: String?     // 타일 글자색 override (예: 카카오 노랑 위 검정)
    public let origin: String         // 시작 인사이트
    public let keys: [String]         // 차별점 3
    public let lesson: String         // 한 줄 교훈
    public let founded: String        // 창립연도 · 본사

    public var id: String { name }
}

public enum InspirationBrandRegistry {

    /// 전체 브랜드 (웹과 동일 순서).
    public static let all: [InspirationBrand] = loadFromBundle()

    // MARK: - Bundle loader

    private static func loadFromBundle() -> [InspirationBrand] {
        guard let url = Bundle.module.url(forResource: "inspiration-brands", withExtension: "json") else {
            #if DEBUG
            print("⚠️ inspiration-brands.json 번들에 누락")
            #endif
            return []
        }
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([InspirationBrand].self, from: data)
        } catch {
            #if DEBUG
            print("⚠️ inspiration-brands.json 디코딩 실패: \(error)")
            #endif
            return []
        }
    }
}
