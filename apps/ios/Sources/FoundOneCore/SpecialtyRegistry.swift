//
//  SpecialtyRegistry.swift — sub-industry → specialty (세부 분류) 매핑.
//
//  웹 SSOT:
//    apps/web/app/lib/components/stages/selection/specialty-data.ts
//      → SPECIALTY_BY_INDUSTRY, getSpecialtyOptions
//
//  사용:
//    let options = SpecialtyRegistry.options(for: "korean-casual")
//    // → [국밥·해장국 / 한정식 / 백반 / 분식 / 비빔밥 / 고깃집] 6개
//
//  사용자 피드백 (2026-05-04): "한식/캐주얼을 골라도 국밥집인지 한정식인지 알아야 한다."
//  → industry 선택 후 specialty 단계 1개 추가.
//

import Foundation

public struct SpecialtyOption: Decodable, Sendable, Identifiable, Hashable {
    public let id: String
    public let label: String       // 한국어 라벨
    public let desc: String        // 한 줄 부연
    public let labelEn: String?    // 영어 라벨 (선택)
}

public enum SpecialtyRegistry {

    /// industry 별 specialty 옵션. 없으면 빈 배열.
    public static func options(for industryId: String) -> [SpecialtyOption] {
        all[industryId] ?? []
    }

    /// industry 가 specialty 선택을 필요로 하는지 (Step 2 노출 게이트).
    public static func requiresSpecialty(industryId: String) -> Bool {
        !(all[industryId] ?? []).isEmpty
    }

    public static let all: [String: [SpecialtyOption]] = loadFromBundle()

    private static func loadFromBundle() -> [String: [SpecialtyOption]] {
        guard let url = Bundle.module.url(forResource: "specialty-by-industry", withExtension: "json") else {
            #if DEBUG
            print("⚠️ specialty-by-industry.json 번들에 누락")
            #endif
            return [:]
        }
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([String: [SpecialtyOption]].self, from: data)
        } catch {
            #if DEBUG
            print("⚠️ specialty-by-industry.json 디코딩 실패: \(error)")
            #endif
            return [:]
        }
    }
}
