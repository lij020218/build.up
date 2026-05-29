//
//  SectionCard.swift — "내 가게" 한 섹션의 read view 카드 + "수정" 진입점
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/my-store/SectionRenderer.tsx (read mode)
//
//  렌더 규칙:
//   1) 전부 빈 상태 → emptyCTA (dashed border 처음 입력하기)
//   2) 단일 필드 영역: 값 있는 필드만 label/value 행으로 표시
//   3) 배열 영역: N건 + 만료 dot + 3개 preview + 외 N건
//   4) 둘 다 있는 섹션 (Legal): 단일 → Divider → 배열 순으로 표시
//
//  편집은 SectionEditSheet 가 담당 — 여기는 표시 + 수정 진입.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct SectionCard: View {

    public let spec: SectionSpec
    @ObservedObject var store: StoreInfoStore
    @State private var showEdit = false

    public init(spec: SectionSpec, store: StoreInfoStore) {
        self.spec = spec
        self.store = store
    }

    public var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                header
                Divider().background(BUColor.midnight.opacity(0.06))
                content
            }
        }
        .sheet(isPresented: $showEdit) {
            SectionEditSheet(spec: spec, store: store)
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(alignment: .center, spacing: BUSpacing.sm) {
            sectionIcon
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 6) {
                    Text(spec.title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                        .tracking(-0.1)
                    expiryDot
                }
                if let sub = spec.subtitle {
                    Text(sub)
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(1)
                }
            }
            Spacer()
            editButton
        }
    }

    private var sectionIcon: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(BUColor.midnight.opacity(0.08))
                .frame(width: 36, height: 36)
            Image(systemName: spec.icon)
                .font(.system(size: 15))
                .foregroundStyle(BUColor.midnight)
        }
    }

    @ViewBuilder
    private var expiryDot: some View {
        if let urgency = highestUrgency {
            Circle()
                .fill(urgency == .overdue ? .red.opacity(0.85) : .orange)
                .frame(width: 6, height: 6)
                .accessibilityLabel(urgency == .overdue ? "만료된 항목 있음" : "갱신 임박")
        }
    }

    private var editButton: some View {
        Button {
            showEdit = true
        } label: {
            Text(isFullyEmpty ? "입력" : "수정")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(BUColor.midnight.opacity(0.08), in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityHint("\(spec.title) 편집 화면 열기")
    }

    // MARK: - Content

    @ViewBuilder
    private var content: some View {
        if isFullyEmpty {
            emptyCTA
        } else {
            if hasAnyFieldValue {
                singleFieldsList
            }
            if spec.arrayItem != nil {
                if hasAnyFieldValue {
                    Divider()
                        .background(BUColor.midnight.opacity(0.06))
                        .padding(.vertical, 2)
                }
                arraySection
            }
        }
    }

    // MARK: - Empty CTA

    private var emptyCTA: some View {
        Button {
            showEdit = true
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "plus.circle")
                    .font(.system(size: 15))
                    .foregroundStyle(BUColor.midnight.opacity(0.7))
                Text("처음 입력하기")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(BUColor.midnight)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(
                BUColor.midnight.opacity(0.03),
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(
                        BUColor.midnight.opacity(0.18),
                        style: StrokeStyle(lineWidth: 1, dash: [5, 3])
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Single fields list

    private var singleFieldsList: some View {
        let visibleFields = spec.fields.filter { field in
            let v = StoreInfoAccessor.value(from: store.state, sectionId: spec.id, key: field.key)
            return !v.isEmpty
        }
        return VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(visibleFields.enumerated()), id: \.element.key) { idx, field in
                fieldRow(field)
                if idx < visibleFields.count - 1 {
                    Divider()
                        .background(BUColor.midnight.opacity(0.05))
                }
            }
        }
    }

    private func fieldRow(_ field: FieldSpec) -> some View {
        let v = StoreInfoAccessor.value(from: store.state, sectionId: spec.id, key: field.key)
        let display = StoreInfoAccessor.displayString(v, field: field)
        return HStack(alignment: .firstTextBaseline, spacing: BUSpacing.sm) {
            Text(field.label)
                .font(.system(size: 11))
                .foregroundStyle(BUColor.inkMuted)
                .frame(width: 96, alignment: .leading)
            Text(display.isEmpty ? "—" : display)
                .font(.system(size: 12.5, weight: field.optional ? .regular : .medium))
                .foregroundStyle(display.isEmpty ? BUColor.inkMuted.opacity(0.6) : BUColor.ink)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 7)
    }

    // MARK: - Array section

    private var arraySection: some View {
        let items = currentArrayItems
        let arrayLabel = spec.arrayItem?.addLabel
            .replacingOccurrences(of: "+ ", with: "")
            .replacingOccurrences(of: " 추가", with: "")
            ?? "항목"
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text(arrayLabel)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkSecondary)
                    .tracking(0.2)
                Spacer()
                Text("\(items.count)건")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .monospacedDigit()
            }

            if items.isEmpty {
                Text(spec.arrayItem?.emptyText ?? "")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .padding(.vertical, 4)
            } else {
                ForEach(items.prefix(3), id: \.id) { item in
                    arrayItemRow(item)
                }
                if items.count > 3 {
                    Text("외 \(items.count - 3)건")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(.top, 2)
                }
            }
        }
    }

    private func arrayItemRow(_ item: ArrayItem) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(arrayItemDot(for: item.expiresAt))
                .frame(width: 5, height: 5)
            Text(item.title)
                .font(.system(size: 12))
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)
            Spacer(minLength: 0)
            if let expIso = item.expiresAt, !expIso.isEmpty {
                Text(StoreInfoFormatters.relativeDate(expIso))
                    .font(.system(size: 10))
                    .foregroundStyle(BUColor.inkMuted)
                    .monospacedDigit()
            }
        }
        .padding(.vertical, 3)
    }

    private func arrayItemDot(for expIso: String?) -> Color {
        guard let expIso else { return BUColor.midnight.opacity(0.35) }
        switch StoreInfoFormatters.expiryUrgency(expIso) {
        case .overdue: return .red.opacity(0.85)
        case .urgent:  return .orange
        case .soon:    return BUColor.midnight.opacity(0.5)
        case .later:   return BUColor.midnight.opacity(0.35)
        case .none:    return BUColor.midnight.opacity(0.35)
        }
    }

    // MARK: - Computed state

    private struct ArrayItem: Identifiable {
        let id: String
        let title: String
        let expiresAt: String?
    }

    /// 섹션 id 기반으로 store 의 적절한 array 가져오기.
    private var currentArrayItems: [ArrayItem] {
        let st = store.state
        switch spec.id {
        case "legal":
            return st.permits.map {
                ArrayItem(id: $0.id, title: $0.name.isEmpty ? "미입력" : $0.name,
                          expiresAt: $0.expiresAt)
            }
        case "people":
            return st.peopleDirectory.map {
                ArrayItem(id: $0.id, title: $0.name.isEmpty ? "미입력" : $0.name,
                          expiresAt: nil)
            }
        case "insurance":
            return st.insurancePolicies.map {
                ArrayItem(id: $0.id, title: $0.name.isEmpty ? "미입력" : $0.name,
                          expiresAt: $0.expiresAt)
            }
        case "footprint":
            // Digital footprint mode 일 때만 배열 — Tenancy mode 는 단일 객체
            if spec.arrayItem != nil {
                // mobile mode 도 array — vehicles 사용
                if st.vehicles.isEmpty && !st.digitalFootprint.isEmpty {
                    return st.digitalFootprint.map {
                        ArrayItem(id: $0.id,
                                  title: $0.name.isEmpty ? "미입력" : $0.name,
                                  expiresAt: $0.expiresAt)
                    }
                }
                if !st.vehicles.isEmpty {
                    return st.vehicles.map {
                        ArrayItem(id: $0.id,
                                  title: $0.name.isEmpty ? "미입력" : $0.name,
                                  expiresAt: $0.insuranceExpiresAt)
                    }
                }
                return st.digitalFootprint.map {
                    ArrayItem(id: $0.id,
                              title: $0.name.isEmpty ? "미입력" : $0.name,
                              expiresAt: $0.expiresAt)
                }
            }
            return []
        default:
            // 카테고리별 동적 섹션 — industrySpecifics jsonb 에서 읽기
            if StoreInfoSchema.categorySectionIds.contains(spec.id),
               let titleField = spec.arrayItem?.titleField {
                let items = st.industryArray(spec.id)
                let expiryKey = spec.arrayItem?.expiryKey
                return items.enumerated().map { idx, obj in
                    let title = obj[titleField]?.stringValue ?? ""
                    let expiry = expiryKey.flatMap { obj[$0]?.stringValue }
                    let id = obj["id"]?.stringValue ?? "row-\(idx)"
                    return ArrayItem(
                        id: id,
                        title: title.isEmpty ? "미입력" : title,
                        expiresAt: expiry
                    )
                }
            }
            return []
        }
    }

    private var hasAnyFieldValue: Bool {
        spec.fields.contains { field in
            let v = StoreInfoAccessor.value(from: store.state, sectionId: spec.id, key: field.key)
            return !v.isEmpty
        }
    }

    private var isFullyEmpty: Bool {
        !hasAnyFieldValue && currentArrayItems.isEmpty
    }

    /// 섹션의 가장 임박한 만료 — header 의 dot 색 결정.
    private var highestUrgency: StoreInfoFormatters.ExpiryUrgency? {
        let urgs = DDayCalculator.collect(from: store.state)
            .filter { $0.sectionId == spec.id }
            .map(\.urgency)
        if urgs.contains(.overdue) { return .overdue }
        if urgs.contains(.urgent)  { return .urgent }
        if urgs.contains(.soon)    { return .soon }
        return nil
    }
}
