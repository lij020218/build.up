//
//  JobDutyRegistry.swift — 직원 고용형태·업무 직무 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//     원본: packages/shared/src/team/job-duties.ts
//     재생성: npx tsx scripts/gen-job-duties-swift.mts
//

import Foundation

public struct BUJobDuty: Identifiable, Sendable, Equatable, Hashable {
    public let key: String
    public let ko: String
    public let en: String
    public var id: String { key }
    public init(key: String, ko: String, en: String) { self.key = key; self.ko = ko; self.en = en }
}

public struct BUEmploymentType: Identifiable, Sendable, Equatable {
    public let key: String
    public let ko: String
    public let en: String
    public var id: String { key }
    public init(key: String, ko: String, en: String) { self.key = key; self.ko = ko; self.en = en }
}

public enum JobDutyRegistry {

    public static let employmentTypes: [BUEmploymentType] = [
        .init(key: "part_time", ko: "단기 알바", en: "Part-time"),
        .init(key: "full_time", ko: "정직원", en: "Full-time"),
        .init(key: "contract", ko: "계약직", en: "Contract"),
    ]

    public static let commonDuties: [BUJobDuty] = [
        .init(key: "manager", ko: "매니저/점장", en: "Manager"),
        .init(key: "accounting", ko: "경리/회계", en: "Accounting"),
        .init(key: "marketing", ko: "마케팅/홍보", en: "Marketing"),
        .init(key: "hr_admin", ko: "인사/총무", en: "HR / Admin"),
        .init(key: "cs", ko: "고객응대/CS", en: "Customer service"),
    ]

    public static let dutiesByCategory: [String: [BUJobDuty]] = [
        "food": [
            .init(key: "hall", ko: "홀 서빙", en: "Hall service"),
            .init(key: "kitchen", ko: "주방/조리", en: "Kitchen"),
            .init(key: "prep_dish", ko: "설거지/주방보조", en: "Prep / dishwashing"),
            .init(key: "counter", ko: "카운터/포스", en: "Counter / POS"),
            .init(key: "delivery", ko: "배달", en: "Delivery"),
            .init(key: "cleaning", ko: "청소/마감", en: "Cleaning / closing"),
        ],
        "cafe-dessert": [
            .init(key: "barista", ko: "바리스타", en: "Barista"),
            .init(key: "baker", ko: "베이커/제과", en: "Baker"),
            .init(key: "hall", ko: "홀 서빙", en: "Hall service"),
            .init(key: "counter", ko: "카운터/포스", en: "Counter / POS"),
            .init(key: "cleaning", ko: "청소/마감", en: "Cleaning / closing"),
        ],
        "retail": [
            .init(key: "sales", ko: "판매/응대", en: "Sales"),
            .init(key: "cashier", ko: "계산/포스", en: "Cashier / POS"),
            .init(key: "stock", ko: "재고관리", en: "Inventory"),
            .init(key: "display", ko: "진열/디스플레이", en: "Display / merchandising"),
            .init(key: "shipping", ko: "배송/택배", en: "Shipping"),
        ],
        "beauty": [
            .init(key: "designer", ko: "디자이너/원장", en: "Designer"),
            .init(key: "assistant", ko: "스태프/인턴", en: "Assistant / intern"),
            .init(key: "reception", ko: "리셉션/예약", en: "Reception / booking"),
            .init(key: "nail_lash", ko: "네일/속눈썹", en: "Nail / lash"),
            .init(key: "cleaning", ko: "청소/소독", en: "Cleaning / sanitizing"),
        ],
        "fitness": [
            .init(key: "trainer", ko: "트레이너/PT", en: "Trainer / PT"),
            .init(key: "front_desk", ko: "프론트/데스크", en: "Front desk"),
            .init(key: "group_class", ko: "그룹 수업", en: "Group class"),
            .init(key: "membership", ko: "회원 관리", en: "Membership"),
            .init(key: "maintenance", ko: "청소/시설관리", en: "Cleaning / facility"),
        ],
        "education": [
            .init(key: "instructor", ko: "강사", en: "Instructor"),
            .init(key: "counsel_desk", ko: "상담/데스크", en: "Counsel / desk"),
            .init(key: "assistant", ko: "조교/보조", en: "Teaching assistant"),
            .init(key: "shuttle", ko: "차량 운행", en: "Shuttle driver"),
            .init(key: "material", ko: "교재/자료 관리", en: "Materials"),
        ],
        "pet": [
            .init(key: "groomer", ko: "미용사/그루머", en: "Groomer"),
            .init(key: "vet_tech", ko: "수의 보조/테크", en: "Vet tech"),
            .init(key: "care_hotel", ko: "돌봄/호텔링", en: "Care / hotel"),
            .init(key: "reception", ko: "리셉션/예약", en: "Reception / booking"),
            .init(key: "sales", ko: "용품 판매", en: "Supplies sales"),
        ],
        "living-service": [
            .init(key: "worker", ko: "기사/작업자", en: "Technician / worker"),
            .init(key: "reception", ko: "접수/상담", en: "Reception / intake"),
            .init(key: "pickup", ko: "수거/배송", en: "Pickup / delivery"),
            .init(key: "maintenance", ko: "관리/청소", en: "Maintenance / cleaning"),
        ],
        "space": [
            .init(key: "maintenance", ko: "관리/청소", en: "Maintenance / cleaning"),
            .init(key: "booking", ko: "예약/응대", en: "Booking / desk"),
            .init(key: "facility", ko: "시설 점검", en: "Facility check"),
        ],
        "online-digital": [
            .init(key: "cs", ko: "CS/문의 응대", en: "Customer service"),
            .init(key: "md", ko: "상품등록/MD", en: "Merchandising / MD"),
            .init(key: "fulfillment", ko: "포장/출고", en: "Packing / fulfillment"),
            .init(key: "content", ko: "콘텐츠/촬영", en: "Content / studio"),
            .init(key: "dev_ops", ko: "개발/운영", en: "Dev / ops"),
        ],
        "startup-tech": [
            .init(key: "dev", ko: "개발", en: "Engineering"),
            .init(key: "design", ko: "디자인", en: "Design"),
            .init(key: "pm", ko: "기획/PM", en: "Product / PM"),
            .init(key: "sales_bd", ko: "영업/BD", en: "Sales / BD"),
            .init(key: "growth", ko: "마케팅/그로스", en: "Growth"),
            .init(key: "ops", ko: "운영/CS", en: "Operations / CS"),
        ],
    ]

    /// 업종에 맞는 직무 목록 — category-specific 먼저, 공통 직무를 key 중복 없이 병합.
    public static func duties(for categoryId: String?) -> [BUJobDuty] {
        let specific = (categoryId.flatMap { dutiesByCategory[$0] }) ?? []
        let seen = Set(specific.map(\.key))
        return specific + commonDuties.filter { !seen.contains($0.key) }
    }

    private static let allDuties: [String: BUJobDuty] = {
        var map: [String: BUJobDuty] = [:]
        for d in commonDuties + dutiesByCategory.values.flatMap({ $0 }) where map[d.key] == nil {
            map[d.key] = d
        }
        return map
    }()

    public static func dutyLabel(_ key: String, ko: Bool) -> String {
        guard let d = allDuties[key] else { return key }
        return ko ? d.ko : d.en
    }

    public static func employmentLabel(_ key: String?, ko: Bool) -> String? {
        guard let key, let t = employmentTypes.first(where: { $0.key == key }) else { return nil }
        return ko ? t.ko : t.en
    }
}
