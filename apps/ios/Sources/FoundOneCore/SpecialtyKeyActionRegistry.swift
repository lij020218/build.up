//
//  SpecialtyKeyActionRegistry.swift
//  특수업종(specialty)별 KEY ACTION — 웹 SSOT(stage-key-actions.ts) codegen → stage-key-actions.json 미러.
//
//  사장님 신고(2026-06-30): 업종(스터디카페·편의점·SaaS …)에 정확히 맞는 KEY ACTION이 나와야 함.
//  resolve(stageId, specialtyId, categoryId): specialty → category 순 조회, 없으면 nil
//  → 호출부가 기존 페이지별/글로벌 KEY ACTION으로 폴백(절대 빈 화면 X).
//

import Foundation

public struct SpecialtyKeyAction: Decodable, Sendable {
    public let title: String
    public let detail: String
    public let bullets: [String]?
}

public enum SpecialtyKeyActionRegistry {

    // [specialtyOrCategoryId: [stageId: SpecialtyKeyAction]]
    private static let all: [String: [String: SpecialtyKeyAction]] = load()

    private static func load() -> [String: [String: SpecialtyKeyAction]] {
        guard let url = Bundle.module.url(forResource: "stage-key-actions", withExtension: "json") else {
            #if DEBUG
            print("⚠️ stage-key-actions.json 번들에 누락")
            #endif
            return [:]
        }
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([String: [String: SpecialtyKeyAction]].self, from: data)
        } catch {
            #if DEBUG
            print("⚠️ stage-key-actions.json 디코딩 실패: \(error)")
            #endif
            return [:]
        }
    }

    /// specialty(세부업종) → category(대분류) 순 조회. 없으면 nil.
    public static func resolve(stageId: String, specialtyId: String?, categoryId: String?) -> SpecialtyKeyAction? {
        if let sid = specialtyId, !sid.isEmpty, let a = all[sid]?[stageId] { return a }
        if let cid = categoryId, !cid.isEmpty, let a = all[cid]?[stageId] { return a }
        return nil
    }
}
