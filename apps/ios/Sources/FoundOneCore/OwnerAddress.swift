//
//  OwnerAddress.swift — 사장님을 부르는 말 (웹 SSOT 미러).
//
//  웹 SSOT: packages/shared/src/owner-address.ts
//   (동기화 가드: apps/web/__tests__/owner-address-ios-sync.test.ts)
//
//  사장님 지시 2026-09-12: "김사장이라 하지 말고 님자를 꼭 붙여."
//   종전 인사말은 가입 시 이름을 그대로 출력해 "저녁이에요, 김사장" 이 됐다.
//

import Foundation

public enum OwnerAddress {

    /// 업종별 기본 호칭 — 온보딩 ownerTitle 과 같은 값.
    public static let defaultTitleKo = "사장님"
    public static let defaultTitleEn = "Founder"

    /// 존칭 접미사. 이미 붙어 있으면 다시 붙이지 않는다("김사장님님" 방지).
    public static let honorificKo = "님"

    /// 화면에서 사장님을 부를 때 쓰는 문자열.
    ///  - 이름이 없거나 이메일이면 호칭(사장님/대표님)
    ///  - 이미 "님"으로 끝나면 그대로
    ///  - 그 밖에는 이름 + "님"
    public static func ko(_ rawName: String?, fallbackTitle: String = defaultTitleKo) -> String {
        let name = (rawName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        // 이메일을 호칭으로 쓰면 "저녁이에요, a@b.com" 이 된다.
        if name.isEmpty || name.contains("@") { return fallbackTitle }
        if name.hasSuffix(honorificKo) { return name }
        return name + honorificKo
    }

    /// 영어 — 존칭 접미사가 없다. 이름이 없을 때만 호칭으로 대체.
    public static func en(_ rawName: String?, fallbackTitle: String = defaultTitleEn) -> String {
        let name = (rawName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if name.isEmpty || name.contains("@") { return fallbackTitle }
        return name
    }
}
