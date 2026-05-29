//
//  DDayCalculator.swift — 모든 섹션의 expiresAt 통합 D-day 계산
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/my-store/DDayWidget.tsx
//
//  소스 (모두 schema 의 trackExpiry: true 또는 arrayItem.expiryKey 기반):
//   • permits[].expiresAt              → "법적 · 인허가"
//   • insurancePolicies[].expiresAt    → "보험"
//   • tenancy.leaseEndDate             → "임대차 · 거점"
//   • digitalFootprint[].expiresAt     → "디지털 거점"
//   • vehicles[].insuranceExpiresAt    → "차량"
//   • businessDocuments[].expiresAt    → "사업 서류"
//
//  Phase B: industrySpecifics 의 expiry tracked 항목 (kitchen-assets.replacementDate 등)
//

import Foundation

// MARK: - DDayItem

public struct DDayItem: Identifiable, Sendable, Hashable {
    public let id: String
    public let sectionId: String
    public let sectionLabel: String
    public let itemTitle: String
    public let kindLabel: String?
    public let expiresAt: String
    public let date: Date
    public let daysRemaining: Int
    public let urgency: StoreInfoFormatters.ExpiryUrgency

    /// 사람에게 보여줄 상대 시간 문자열 ("3일 후", "어제", "1개월 전").
    public var relativeLabel: String {
        StoreInfoFormatters.relativeDate(expiresAt)
    }

    /// 짧은 정렬용 라벨 ("D-3", "D+5" — overdue 는 +).
    public var dDayLabel: String {
        if daysRemaining == 0 { return "D-day" }
        if daysRemaining > 0  { return "D-\(daysRemaining)" }
        return "D+\(-daysRemaining)"
    }
}

// MARK: - Calculator

public enum DDayCalculator {

    /// 통합된 D-day 리스트 (가까운 만료 순).
    /// 만료일이 없거나 잘못된 ISO 형식 항목은 graceful 제외.
    public static func collect(
        from state: StoreInfoState,
        reference: Date = Date()
    ) -> [DDayItem] {
        var items: [DDayItem] = []

        // permits
        for p in state.permits {
            if let item = makeItem(
                sectionId: "legal",
                sectionLabel: "법적 · 인허가",
                entityId: p.id,
                title: p.name,
                kind: p.certNumber.map { "증서 \($0)" },
                expiresAt: p.expiresAt,
                reference: reference
            ) { items.append(item) }
        }

        // insurance policies
        for ins in state.insurancePolicies {
            if let item = makeItem(
                sectionId: "insurance",
                sectionLabel: "보험",
                entityId: ins.id,
                title: ins.name,
                kind: insuranceTypeLabel(ins.type),
                expiresAt: ins.expiresAt,
                reference: reference
            ) { items.append(item) }
        }

        // tenancy lease end
        if let item = makeItem(
            sectionId: "footprint",
            sectionLabel: "임대차 · 거점",
            entityId: "tenancy",
            title: "임대 종료",
            kind: state.tenancy.landlordName.map { "임대인: \($0)" },
            expiresAt: state.tenancy.leaseEndDate,
            reference: reference
        ) { items.append(item) }

        // digital footprint
        for d in state.digitalFootprint {
            if let item = makeItem(
                sectionId: "footprint",
                sectionLabel: "디지털 거점",
                entityId: d.id,
                title: d.name,
                kind: digitalKindLabel(d.kind),
                expiresAt: d.expiresAt,
                reference: reference
            ) { items.append(item) }
        }

        // vehicles
        for v in state.vehicles {
            if let item = makeItem(
                sectionId: "footprint",
                sectionLabel: "차량",
                entityId: v.id,
                title: v.name,
                kind: v.plateNumber,
                expiresAt: v.insuranceExpiresAt,
                reference: reference
            ) { items.append(item) }
        }

        // business documents
        for doc in state.businessDocuments {
            if let item = makeItem(
                sectionId: "documents",
                sectionLabel: "사업 서류",
                entityId: doc.id,
                title: doc.kind.labelKo,
                kind: doc.filename,
                expiresAt: doc.expiresAt,
                reference: reference
            ) { items.append(item) }
        }

        // 가까운 만료 순 → 같은 날짜는 sectionId 알파벳순으로 안정 정렬
        return items.sorted { lhs, rhs in
            if lhs.daysRemaining != rhs.daysRemaining {
                return lhs.daysRemaining < rhs.daysRemaining
            }
            return lhs.sectionId < rhs.sectionId
        }
    }

    // MARK: - Convenience filters

    /// 이미 만료된 항목 (daysRemaining < 0).
    public static func overdue(
        from state: StoreInfoState,
        reference: Date = Date()
    ) -> [DDayItem] {
        collect(from: state, reference: reference).filter { $0.daysRemaining < 0 }
    }

    /// 임박 항목 — 기본 7일 이내. overdue 도 포함.
    public static func urgent(
        within days: Int = 7,
        from state: StoreInfoState,
        reference: Date = Date()
    ) -> [DDayItem] {
        collect(from: state, reference: reference).filter { $0.daysRemaining <= days }
    }

    /// 30일 이내 — Hero pill 의 기본 임계.
    public static func soon(
        within days: Int = 30,
        from state: StoreInfoState,
        reference: Date = Date()
    ) -> [DDayItem] {
        collect(from: state, reference: reference).filter {
            $0.daysRemaining <= days && $0.daysRemaining >= 0
        }
    }

    /// Hero pill 용 한 줄 요약 — "갱신 임박 3건" / "만료 1건" / "안전".
    public static func summary(
        from state: StoreInfoState,
        reference: Date = Date()
    ) -> String {
        let all = collect(from: state, reference: reference)
        let over = all.filter { $0.daysRemaining < 0 }
        let urg = all.filter { $0.daysRemaining >= 0 && $0.daysRemaining <= 30 }
        if !over.isEmpty {
            return "만료 \(over.count)건"
        }
        if !urg.isEmpty {
            return "갱신 임박 \(urg.count)건"
        }
        return "안전"
    }

    // MARK: - Internal builders

    private static func makeItem(
        sectionId: String,
        sectionLabel: String,
        entityId: String,
        title: String,
        kind: String?,
        expiresAt: String?,
        reference: Date
    ) -> DDayItem? {
        guard let iso = expiresAt,
              !iso.isEmpty,
              let date = isoFormatter.date(from: iso)
        else { return nil }

        let cal = Calendar(identifier: .gregorian)
        let days = cal.dateComponents([.day],
                                      from: cal.startOfDay(for: reference),
                                      to: cal.startOfDay(for: date)).day ?? 0

        return DDayItem(
            id: "\(sectionId):\(entityId)",
            sectionId: sectionId,
            sectionLabel: sectionLabel,
            itemTitle: title.isEmpty ? "미입력" : title,
            kindLabel: kind,
            expiresAt: iso,
            date: date,
            daysRemaining: days,
            urgency: StoreInfoFormatters.expiryUrgency(iso, from: reference)
        )
    }

    private static func insuranceTypeLabel(_ raw: String) -> String? {
        switch raw {
        case "fire":              return "화재"
        case "general-liability": return "배상책임"
        case "workers-comp":      return "근로자재해"
        case "product-liability": return "생산물책임"
        case "auto":              return "자동차"
        case "property":          return "재산종합"
        case "professional":      return "전문직 책임"
        case "cyber":             return "사이버"
        case "other":             return "기타"
        default:                  return nil
        }
    }

    private static func digitalKindLabel(_ raw: String) -> String? {
        switch raw {
        case "domain":      return "도메인"
        case "hosting":     return "호스팅"
        case "platform":    return "플랫폼"
        case "cdn":         return "CDN"
        case "logistics":   return "물류"
        case "fulfillment": return "풀필먼트"
        default:            return nil
        }
    }

    private static let isoFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()
}
