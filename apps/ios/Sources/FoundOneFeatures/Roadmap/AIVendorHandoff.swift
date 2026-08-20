//
//  AIVendorHandoff.swift — AI 위저드 공급처 추천 → vendor-setup 단계 프리필.
//
//  웹 SSOT 미러: apps/web/app/lib/hooks/useOnboardingHandlers.ts (2026-08-05 감사 후속).
//  step 구분은 VendorSetupStageView 섹션과 1:1 — 1 공급처 · 2 장비 · 3 POS·결제 · 4 인테리어·기타.
//  카탈로그(vendor-data.json)와 이름이 정확히 일치하면 해당 섹션 선택 배열에 프리체크,
//  카탈로그 밖 업체는 aiPicks 로 저장 → VendorSetupStageView 가 "AI 추천" 행으로 렌더.
//

import Foundation
import FoundOneCore
import FoundOneData

enum AIVendorHandoff {

    /// 카탈로그 밖 AI 추천 업체 1건 — VendorSetupStageView 의 "AI 추천" 행 소스.
    struct Pick: Codable, Equatable {
        let step: Int      // 1 공급처 · 2 장비 · 3 POS·결제 · 4 인테리어·기타
        let name: String
        let note: String   // 이유 · 가격대 (표시용)
    }

    static let picksKey = "stage.vendor.aiPicksJson"
    /// step → 선택 배열 UserDefaults 키 (1~3 은 VendorSetupStageView 기존 키, 4 는 인테리어·기타 신설).
    static let selectionKeys: [Int: String] = [
        1: "stage.vendor.suppliersJson",
        2: "stage.vendor.equipmentJson",
        3: "stage.vendor.posJson",
        4: "stage.vendor.otherJson",
    ]

    /// 위저드 완료 시 호출 — 추천 업체를 vendor-setup 선택 상태로 넘긴다.
    ///  selectedInteriorFirms: 리뷰 화면에서 사용자가 체크한 내 지역 인테리어 업체 (최대 3곳, 2026-08-21) —
    ///  step 4(인테리어·기타)에 이름+연락처 note 로 프리체크. 웹 buildAiVendorHandoff 미러.
    static func apply(
        result: AIRoadmapResult,
        subIndustryId: String,
        categoryId: String?,
        selectedInteriorFirms: [AIRoadmapResult.Recommendations.RegionalInteriorFirm] = []
    ) {
        let suppliers = result.recommendations.suppliers
        let interiorVendors = result.recommendations.interiorVendors ?? []
        guard !suppliers.isEmpty || !interiorVendors.isEmpty || !selectedInteriorFirms.isEmpty else { return }

        let bundle = VendorDataRegistry.bundle(forSubIndustry: subIndustryId, categoryId: categoryId)
        let catalogNames: [Int: Set<String>] = [
            1: Set((bundle?.suppliers ?? []).map { $0.name.trimmingCharacters(in: .whitespaces) }),
            2: Set((bundle?.equipment ?? []).map { $0.name.trimmingCharacters(in: .whitespaces) }),
            3: Set((bundle?.pos ?? []).map { $0.name.trimmingCharacters(in: .whitespaces) }),
            4: [],
        ]

        let ud = UserDefaults.standard
        var selected: [Int: [String]] = [:]
        for (step, key) in selectionKeys {
            selected[step] = decodeStrings(ud.string(forKey: key) ?? "[]")
        }
        var picks = decodePicks(ud.string(forKey: picksKey) ?? "[]")

        func add(step: Int, name: String, note: String) {
            let trimmed = name.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty else { return }
            // 카탈로그 밖 업체만 aiPicks 행 생성 — 카탈로그 업체는 네이티브 행이 대표.
            if !(catalogNames[step]?.contains(trimmed) ?? false),
               !picks.contains(where: { $0.step == step && $0.name == trimmed }) {
                picks.append(Pick(step: step, name: trimmed, note: note))
            }
            if selected[step]?.contains(trimmed) != true {
                selected[step, default: []].append(trimmed)
            }
        }

        for s in suppliers {
            let note = [s.reason, s.priceRange]
                .filter { !$0.isEmpty }
                .joined(separator: " · ")
            add(step: step(forCategory: s.category), name: s.name, note: note)
        }
        for iv in interiorVendors {
            add(step: 4, name: iv.title, note: "AI 추천 인테리어 시공 업체")
        }
        // 사용자가 리뷰에서 직접 체크한 내 지역 인테리어 업체 — 등록·영업 확인 실데이터 (2026-08-21, 최대 3곳 방어)
        for f in selectedInteriorFirms.prefix(3) {
            let note = [f.phone, f.address]
                .compactMap { $0 }
                .filter { !$0.isEmpty }
                .joined(separator: " · ")
            add(step: 4, name: f.name,
                note: note.isEmpty ? "리뷰에서 선택한 내 지역 인테리어 업체" : note)
        }

        for (step, key) in selectionKeys where !(selected[step] ?? []).isEmpty {
            ud.set(encodeStrings(selected[step] ?? []), forKey: key)
        }
        if !picks.isEmpty {
            ud.set(encodePicks(picks), forKey: picksKey)
        }
    }

    /// AI 응답 category 문자열 → 섹션 step. 키워드·순서 = 웹 stepForCategory 와 동일 유지.
    static func step(forCategory category: String) -> Int {
        if ["POS", "결제", "예약"].contains(where: category.contains) { return 3 }
        if ["장비", "설비", "기기", "집기", "진열", "주방", "운영"].contains(where: category.contains) { return 2 }
        if ["식재료", "식자재", "재료", "소싱", "포장", "소모품", "안전", "원두", "부자재"].contains(where: category.contains) { return 1 }
        return 4
    }

    // MARK: - JSON helpers

    static func decodePicks(_ json: String) -> [Pick] {
        guard let data = json.data(using: .utf8),
              let arr = try? JSONDecoder().decode([Pick].self, from: data) else { return [] }
        return arr
    }

    static func encodePicks(_ picks: [Pick]) -> String {
        guard let data = try? JSONEncoder().encode(picks),
              let str = String(data: data, encoding: .utf8) else { return "[]" }
        return str
    }

    private static func decodeStrings(_ json: String) -> [String] {
        guard let data = json.data(using: .utf8),
              let arr = try? JSONDecoder().decode([String].self, from: data) else { return [] }
        return arr
    }

    private static func encodeStrings(_ arr: [String]) -> String {
        guard let data = try? JSONEncoder().encode(arr),
              let str = String(data: data, encoding: .utf8) else { return "[]" }
        return str
    }
}
