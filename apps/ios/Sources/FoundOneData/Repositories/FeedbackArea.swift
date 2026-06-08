//
//  FeedbackArea.swift — 피드백 기능 영역(area) 레지스트리. 웹 app/lib/feedback/areas.ts 미러.
//   동일 key 사용(서버·관리자와 일치). 라벨도 웹과 1:1.
//

import Foundation

public struct FeedbackArea: Identifiable, Sendable, Hashable {
    public let key: String
    public let label: String
    public var id: String { key }
    public init(key: String, label: String) { self.key = key; self.label = label }
}

public enum FeedbackAreas {
    /// 웹 FEEDBACK_AREAS 와 동일 순서·키·라벨.
    public static let all: [FeedbackArea] = [
        FeedbackArea(key: "roadmap", label: "로드맵·창업단계"),
        FeedbackArea(key: "dashboard", label: "운영 대시보드"),
        FeedbackArea(key: "revenue", label: "매출·매출연동"),
        FeedbackArea(key: "franchise", label: "프랜차이즈 정보"),
        FeedbackArea(key: "location", label: "입지·상권"),
        FeedbackArea(key: "tax", label: "세무·간이과세"),
        FeedbackArea(key: "funding", label: "자금·4대보험"),
        FeedbackArea(key: "hiring", label: "인건비·고용"),
        FeedbackArea(key: "account_billing", label: "계정·결제·설정"),
        FeedbackArea(key: "other", label: "기타·앱 전반"),
    ]

    public static func label(_ key: String?) -> String {
        all.first { $0.key == key }?.label ?? "기타·앱 전반"
    }

    /// iOS 화면 키 → 영역 (웹 screenToArea 의 iOS 버전). 매칭 안 되면 other.
    public static func fromScreen(_ screen: String) -> String {
        let s = screen.lowercased()
        if s.contains("roadmap") { return "roadmap" }
        if s.contains("franchise") { return "franchise" }
        if s.contains("location") || s.contains("district") { return "location" }
        if s.contains("revenue") || s.contains("sales") { return "revenue" }
        if s.contains("profile") || s.contains("setting") || s.contains("account")
            || s.contains("billing") || s.contains("payment") { return "account_billing" }
        if s.contains("tax") { return "tax" }
        if s.contains("funding") || s.contains("insurance") { return "funding" }
        if s.contains("hiring") || s.contains("employee") { return "hiring" }
        if s.contains("today") || s.contains("dashboard") || s.contains("home") { return "dashboard" }
        return "other"
    }
}
