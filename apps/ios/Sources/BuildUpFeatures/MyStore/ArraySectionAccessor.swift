//
//  ArraySectionAccessor.swift — 섹션의 배열 항목 read/write 라우터
//
//  공통 5섹션의 typed 배열 (permits / peopleDirectory / insurancePolicies /
//  digitalFootprint / vehicles) 과 카테고리별 industrySpecifics jsonb 배열을
//  단일 인터페이스로 처리.
//
//  사용처: SectionEditSheet array editor + ArrayItemEditSheet field binding.
//

import Foundation
import SwiftUI
import BuildUpData

public enum ArraySectionAccessor {

    public struct Row: Identifiable, Hashable {
        public let id: String
        public let title: String
        public let expiresAt: String?
    }

    // MARK: - Read rows (display list)

    public static func rows(
        in state: StoreInfoState,
        sectionId: String,
        titleField: String,
        expiryKey: String?
    ) -> [Row] {
        switch sectionId {
        case "legal":
            return state.permits.map {
                Row(id: $0.id, title: $0.name, expiresAt: $0.expiresAt)
            }
        case "people":
            return state.peopleDirectory.map {
                Row(id: $0.id, title: $0.name, expiresAt: nil)
            }
        case "insurance":
            return state.insurancePolicies.map {
                Row(id: $0.id, title: $0.name, expiresAt: $0.expiresAt)
            }
        case "footprint":
            if !state.vehicles.isEmpty {
                return state.vehicles.map {
                    Row(id: $0.id, title: $0.name, expiresAt: $0.insuranceExpiresAt)
                }
            }
            return state.digitalFootprint.map {
                Row(id: $0.id, title: $0.name, expiresAt: $0.expiresAt)
            }
        default:
            // industrySpecifics jsonb 기반
            let items = state.industryArray(sectionId)
            return items.enumerated().map { idx, obj in
                let title = obj[titleField]?.stringValue ?? ""
                let expiry = expiryKey.flatMap { obj[$0]?.stringValue }
                let id = obj["id"]?.stringValue ?? "row-\(idx)"
                return Row(id: id, title: title, expiresAt: expiry)
            }
        }
    }

    // MARK: - Append item (returns new item id)

    @discardableResult
    public static func appendItem(
        in state: inout StoreInfoState,
        sectionId: String,
        fields: [FieldSpec]
    ) -> String {
        switch sectionId {
        case "legal":
            let p = Permit()
            state.permits.append(p)
            return p.id
        case "people":
            let p = Person()
            state.peopleDirectory.append(p)
            return p.id
        case "insurance":
            let p = InsurancePolicy()
            state.insurancePolicies.append(p)
            return p.id
        case "footprint":
            // Tenancy mode 는 single-object — array append 안 함.
            // Mobile (vehicles) vs Digital — vehicles 가 비어있고 digital 도 비어있으면
            // 일단 digital 로 추가. (적절한 footprint mode 는 MyStoreView 에서 결정.)
            // 현재 state 의 사용 패턴으로 결정.
            if !state.vehicles.isEmpty {
                let v = Vehicle()
                state.vehicles.append(v)
                return v.id
            }
            if !state.digitalFootprint.isEmpty {
                let d = DigitalFootprintItem()
                state.digitalFootprint.append(d)
                return d.id
            }
            // 빈 상태 — fields 의 키로 판단
            if fields.contains(where: { $0.key == "plateNumber" }) {
                let v = Vehicle()
                state.vehicles.append(v)
                return v.id
            }
            let d = DigitalFootprintItem()
            state.digitalFootprint.append(d)
            return d.id
        default:
            // industrySpecifics — 빈 객체 + id 부여
            var items = state.industryArray(sectionId)
            var obj: [String: AnyCodable] = [:]
            let newId = UUID().uuidString
            obj["id"] = .string(newId)
            items.append(obj)
            state.setIndustryArray(sectionId, items)
            return newId
        }
    }

    // MARK: - Remove item

    public static func removeItem(
        in state: inout StoreInfoState,
        sectionId: String,
        itemId: String
    ) {
        switch sectionId {
        case "legal":
            state.permits.removeAll { $0.id == itemId }
        case "people":
            state.peopleDirectory.removeAll { $0.id == itemId }
        case "insurance":
            state.insurancePolicies.removeAll { $0.id == itemId }
        case "footprint":
            state.vehicles.removeAll { $0.id == itemId }
            state.digitalFootprint.removeAll { $0.id == itemId }
        default:
            var items = state.industryArray(sectionId)
            items.removeAll { ($0["id"]?.stringValue ?? "") == itemId }
            state.setIndustryArray(sectionId, items)
        }
    }

    // MARK: - Field value read (for ArrayItemEditSheet)

    public static func itemFieldValue(
        in state: StoreInfoState,
        sectionId: String,
        itemId: String,
        fieldKey: String
    ) -> FieldValue {
        switch sectionId {
        case "legal":
            guard let p = state.permits.first(where: { $0.id == itemId }) else { return .text("") }
            return permitValue(p, key: fieldKey)
        case "people":
            guard let p = state.peopleDirectory.first(where: { $0.id == itemId }) else { return .text("") }
            return personValue(p, key: fieldKey)
        case "insurance":
            guard let p = state.insurancePolicies.first(where: { $0.id == itemId }) else { return .text("") }
            return insuranceValue(p, key: fieldKey)
        case "footprint":
            if let v = state.vehicles.first(where: { $0.id == itemId }) {
                return vehicleValue(v, key: fieldKey)
            }
            if let d = state.digitalFootprint.first(where: { $0.id == itemId }) {
                return digitalValue(d, key: fieldKey)
            }
            return .text("")
        default:
            let items = state.industryArray(sectionId)
            guard let obj = items.first(where: { ($0["id"]?.stringValue ?? "") == itemId }) else {
                return .text("")
            }
            return industryFieldValue(obj, key: fieldKey)
        }
    }

    // MARK: - Field value write

    public static func setItemFieldValue(
        _ value: FieldValue,
        in state: inout StoreInfoState,
        sectionId: String,
        itemId: String,
        fieldKey: String
    ) {
        switch sectionId {
        case "legal":
            guard let idx = state.permits.firstIndex(where: { $0.id == itemId }) else { return }
            setPermitValue(value, key: fieldKey, on: &state.permits[idx])
        case "people":
            guard let idx = state.peopleDirectory.firstIndex(where: { $0.id == itemId }) else { return }
            setPersonValue(value, key: fieldKey, on: &state.peopleDirectory[idx])
        case "insurance":
            guard let idx = state.insurancePolicies.firstIndex(where: { $0.id == itemId }) else { return }
            setInsuranceValue(value, key: fieldKey, on: &state.insurancePolicies[idx])
        case "footprint":
            if let idx = state.vehicles.firstIndex(where: { $0.id == itemId }) {
                setVehicleValue(value, key: fieldKey, on: &state.vehicles[idx])
                return
            }
            if let idx = state.digitalFootprint.firstIndex(where: { $0.id == itemId }) {
                setDigitalValue(value, key: fieldKey, on: &state.digitalFootprint[idx])
            }
        default:
            var items = state.industryArray(sectionId)
            guard let idx = items.firstIndex(where: { ($0["id"]?.stringValue ?? "") == itemId }) else { return }
            setIndustryFieldValue(value, key: fieldKey, on: &items[idx])
            state.setIndustryArray(sectionId, items)
        }
    }

    // MARK: - Typed permit/person/insurance/vehicle/digital read

    private static func permitValue(_ p: Permit, key: String) -> FieldValue {
        switch key {
        case "name":       return .text(p.name)
        case "issuedAt":   return .date(p.issuedAt)
        case "expiresAt":  return .date(p.expiresAt)
        case "issuedBy":   return .text(p.issuedBy ?? "")
        case "certNumber": return .text(p.certNumber ?? "")
        case "memo":       return .text(p.memo ?? "")
        default:           return .text("")
        }
    }

    private static func setPermitValue(_ v: FieldValue, key: String, on p: inout Permit) {
        switch key {
        case "name":       p.name = v.textValue
        case "issuedAt":   p.issuedAt = v.dateValue
        case "expiresAt":  p.expiresAt = v.dateValue
        case "issuedBy":   p.issuedBy = v.textValue.nilIfEmpty
        case "certNumber": p.certNumber = v.textValue.nilIfEmpty
        case "memo":       p.memo = v.textValue.nilIfEmpty
        default: break
        }
    }

    private static func personValue(_ p: Person, key: String) -> FieldValue {
        switch key {
        case "name":          return .text(p.name)
        case "kind":          return .text(p.kind)
        case "role":          return .text(p.role ?? "")
        case "phone":         return .text(p.phone ?? "")
        case "startDate":     return .date(p.startDate)
        case "fourInsurance": return .text(p.fourInsurance ?? "")
        case "wage":          return .number(p.wage)
        case "memo":          return .text(p.memo ?? "")
        default:              return .text("")
        }
    }

    private static func setPersonValue(_ v: FieldValue, key: String, on p: inout Person) {
        switch key {
        case "name":          p.name = v.textValue
        case "kind":          p.kind = v.textValue
        case "role":          p.role = v.textValue.nilIfEmpty
        case "phone":         p.phone = v.textValue.nilIfEmpty
        case "startDate":     p.startDate = v.dateValue
        case "fourInsurance": p.fourInsurance = v.textValue.nilIfEmpty
        case "wage":          p.wage = v.doubleValue
        case "memo":          p.memo = v.textValue.nilIfEmpty
        default: break
        }
    }

    private static func insuranceValue(_ p: InsurancePolicy, key: String) -> FieldValue {
        switch key {
        case "name":           return .text(p.name)
        case "type":           return .text(p.type)
        case "insurer":        return .text(p.insurer ?? "")
        case "policyNumber":   return .text(p.policyNumber ?? "")
        case "startDate":      return .date(p.startDate)
        case "expiresAt":      return .date(p.expiresAt)
        case "annualPremium":  return .number(p.annualPremium)
        case "coverageAmount": return .number(p.coverageAmount)
        case "memo":           return .text(p.memo ?? "")
        default:               return .text("")
        }
    }

    private static func setInsuranceValue(_ v: FieldValue, key: String, on p: inout InsurancePolicy) {
        switch key {
        case "name":           p.name = v.textValue
        case "type":           p.type = v.textValue
        case "insurer":        p.insurer = v.textValue.nilIfEmpty
        case "policyNumber":   p.policyNumber = v.textValue.nilIfEmpty
        case "startDate":      p.startDate = v.dateValue
        case "expiresAt":      p.expiresAt = v.dateValue
        case "annualPremium":  p.annualPremium = v.doubleValue
        case "coverageAmount": p.coverageAmount = v.doubleValue
        case "memo":           p.memo = v.textValue.nilIfEmpty
        default: break
        }
    }

    private static func vehicleValue(_ v: Vehicle, key: String) -> FieldValue {
        switch key {
        case "name":              return .text(v.name)
        case "plateNumber":       return .text(v.plateNumber ?? "")
        case "purchaseDate":      return .date(v.purchaseDate)
        case "purchasePriceKrw":  return .number(v.purchasePriceKrw)
        case "insuranceExpiresAt":return .date(v.insuranceExpiresAt)
        case "memo":              return .text(v.memo ?? "")
        default:                  return .text("")
        }
    }

    private static func setVehicleValue(_ val: FieldValue, key: String, on v: inout Vehicle) {
        switch key {
        case "name":              v.name = val.textValue
        case "plateNumber":       v.plateNumber = val.textValue.nilIfEmpty
        case "purchaseDate":      v.purchaseDate = val.dateValue
        case "purchasePriceKrw":  v.purchasePriceKrw = val.doubleValue
        case "insuranceExpiresAt":v.insuranceExpiresAt = val.dateValue
        case "memo":              v.memo = val.textValue.nilIfEmpty
        default: break
        }
    }

    private static func digitalValue(_ d: DigitalFootprintItem, key: String) -> FieldValue {
        switch key {
        case "name":          return .text(d.name)
        case "kind":          return .text(d.kind)
        case "vendorName":    return .text(d.vendorName ?? "")
        case "monthlyFeeKrw": return .number(d.monthlyFeeKrw)
        case "expiresAt":     return .date(d.expiresAt)
        case "memo":          return .text(d.memo ?? "")
        default:              return .text("")
        }
    }

    private static func setDigitalValue(_ v: FieldValue, key: String, on d: inout DigitalFootprintItem) {
        switch key {
        case "name":          d.name = v.textValue
        case "kind":          d.kind = v.textValue
        case "vendorName":    d.vendorName = v.textValue.nilIfEmpty
        case "monthlyFeeKrw": d.monthlyFeeKrw = v.doubleValue
        case "expiresAt":     d.expiresAt = v.dateValue
        case "memo":          d.memo = v.textValue.nilIfEmpty
        default: break
        }
    }

    // MARK: - industrySpecifics field read/write (generic jsonb object)

    private static func industryFieldValue(_ obj: [String: AnyCodable], key: String) -> FieldValue {
        guard let v = obj[key] else { return .text("") }
        switch v.value {
        case .string(let s): return .text(s)
        case .double(let d): return .number(d)
        case .int(let i):    return .number(Double(i))
        case .bool(let b):   return .text(b ? "true" : "false")
        case .null:          return .text("")
        case .array(let arr):
            return .stringArray(arr.compactMap { $0.stringValue })
        case .object:        return .text("")
        }
    }

    private static func setIndustryFieldValue(
        _ value: FieldValue,
        key: String,
        on obj: inout [String: AnyCodable]
    ) {
        switch value {
        case .text(let s):
            if s.isEmpty { obj.removeValue(forKey: key) }
            else { obj[key] = .string(s) }
        case .number(let n?):
            obj[key] = .double(n)
        case .number(nil):
            obj.removeValue(forKey: key)
        case .date(let s?):
            if s.isEmpty { obj.removeValue(forKey: key) }
            else { obj[key] = .string(s) }
        case .date(nil):
            obj.removeValue(forKey: key)
        case .stringArray(let arr):
            if arr.isEmpty { obj.removeValue(forKey: key) }
            else { obj[key] = AnyCodable(.array(arr.map { .string($0) })) }
        }
    }
}
