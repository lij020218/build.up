//
//  FranchiseBrandVisual.swift — 프랜차이즈 행의 브랜드 아이덴티티 (로고·모노그램·업종 색).
//
//  웹 SSOT: packages/shared/src/franchise-brand-visual.ts
//    (동기화 가드: apps/web/__tests__/franchise-brand-visual-ios-sync.test.ts)
//
//  로고 자산: scripts/gen-franchise-logos.mjs 가 브랜드 공식 사이트에서 받아
//    Resources/flogo-{id}.png 로 번들. 96px 미만·배너 비율은 수집 단계에서 걸러진다
//    → 여기서는 "있으면 쓰고 없으면 모노그램" 만 판단한다.
//
//  상표: 로고는 각사 상표이며 지칭(nominative use) 목적. 제휴·보증 의미 없음.
//

import Foundation

public enum FranchiseBrandVisual {

    /// 번들에 실제로 들어 있는 로고 brandId 집합 (번들 1회 스캔 후 캐시).
    public static let logoBrandIds: Set<String> = {
        guard let urls = Bundle.module.urls(forResourcesWithExtension: "png", subdirectory: nil) else { return [] }
        var ids = Set<String>()
        for url in urls {
            let name = url.deletingPathExtension().lastPathComponent
            if name.hasPrefix("flogo-") { ids.insert(String(name.dropFirst("flogo-".count))) }
        }
        return ids
    }()

    /// 이 브랜드의 번들 로고 리소스 이름. 없으면 nil → 모노그램.
    public static func logoResourceName(brandId: String) -> String? {
        logoBrandIds.contains(brandId) ? "flogo-\(brandId)" : nil
    }

    /// 번들 로고 파일 URL. 없으면 nil. (렌더: UIImage(contentsOfFile:) — InspirationBrandRegistry 와 동일 패턴)
    public static func logoURL(brandId: String) -> URL? {
        guard logoBrandIds.contains(brandId) else { return nil }
        return Bundle.module.url(forResource: "flogo-\(brandId)", withExtension: "png")
    }

    /// 모노그램 — 웹 franchiseMonogram 과 같은 규칙.
    ///  한글: 첫 글자 1개 / 영문·숫자: 3글자 이하는 통째로, 길면 앞 2글자.
    public static func monogram(_ name: String) -> String {
        var work = name.trimmingCharacters(in: .whitespaces)
        // "(주)한솥" "㈜교촌" 처럼 법인 형태가 앞에 붙는 상호 → 실제 상호부터
        if let close = work.firstIndex(where: { $0 == ")" || $0 == "）" }),
           let open = work.first, open == "(" || open == "（",
           work.distance(from: work.startIndex, to: close) <= 7 {
            work = String(work[work.index(after: close)...])
        }
        for prefix in ["㈜", "주식회사", "유한회사"] where work.hasPrefix(prefix) {
            work = String(work.dropFirst(prefix.count))
        }
        let trimmed = work.drop(while: { " ([{<'\"“”‘’·-–—".contains($0) }).trimmingCharacters(in: .whitespaces)
        guard let first = trimmed.first else { return "?" }
        if first.isLetter && first.isASCII || first.isNumber && first.isASCII {
            let latin = trimmed.filter { ($0.isLetter || $0.isNumber) && $0.isASCII }
            if latin.isEmpty { return String(first).uppercased() }
            // BBQ·CU·KFC 처럼 3글자 이하 상호는 잘라 쓰면 오히려 못 알아본다 → 통째로.
            let head: String = latin.count <= 3 ? latin : String(latin.prefix(2))
            return head.uppercased()
        }
        return String(first)
    }

    /// 업종 색 — 웹 FRANCHISE_CATEGORY_TINTS 미러 (hex 문자열 그대로 보관해 대조 가능).
    public struct Tint: Sendable, Hashable {
        public let bgHex: String
        public let fgHex: String
    }

    public static let categoryTints: [String: Tint] = [
        "food": Tint(bgHex: "#FFF1E8", fgHex: "#C2410C"),
        "cafe-dessert": Tint(bgHex: "#F7F0E6", fgHex: "#8B5E34"),
        "retail": Tint(bgHex: "#EAF1FF", fgHex: "#2451B8"),
        "beauty": Tint(bgHex: "#FCEEF4", fgHex: "#B23A72"),
        "fitness": Tint(bgHex: "#E9F6EE", fgHex: "#1F7A45"),
        "education": Tint(bgHex: "#EEEEFB", fgHex: "#3B3BA8"),
        "pet": Tint(bgHex: "#E8F5F4", fgHex: "#1F7A78"),
        "living-service": Tint(bgHex: "#EEF1F5", fgHex: "#445671"),
        "space": Tint(bgHex: "#F2EDFB", fgHex: "#6B3FA0"),
        "online-digital": Tint(bgHex: "#E7F5FB", fgHex: "#1E6E96"),
        "startup-tech": Tint(bgHex: "#ECEDFA", fgHex: "#191970"),
    ]

    public static let tintFallback = Tint(bgHex: "#EFEFF4", fgHex: "#3C3C43")

    public static func tint(categoryId: String?) -> Tint {
        guard let categoryId, let hit = categoryTints[categoryId] else { return tintFallback }
        return hit
    }

    /// 종합점수 등급 라벨 — 웹 getScoreLabel(ko) 미러. 숫자만으로는 "88이 좋은 건가"를 모른다.
    public static func scoreLabel(_ score: Int) -> String {
        if score >= 90 { return "최우수" }
        if score >= 80 { return "우수" }
        if score >= 70 { return "양호" }
        if score >= 60 { return "보통" }
        return "주의"
    }

    /// 폐점률 위험 밴드 — 웹 closureBand 미러.
    public enum ClosureBand: String, Sendable { case safe, watch, risk }

    public static func closureBand(_ ratePct: Double?) -> ClosureBand {
        guard let ratePct, ratePct > 0 else { return .safe }
        if ratePct >= 20 { return .risk }
        if ratePct >= 10 { return .watch }
        return .safe
    }
}
