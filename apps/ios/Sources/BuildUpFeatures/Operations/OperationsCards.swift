//
//  OperationsCards.swift — Tier 3 운영 관리 카드 (3 카드 통합)
//
//  웹 SSOT (Tier3Operations.tsx + 각 카드):
//   • InventoryOpsCard      — 재고 알림 / 재주문 임박
//   • TeamCard              — 직원 / 4대보험 / 인건비 예상
//   • CustomerSummaryCard   — 누적 고객 / 신규 / 단골
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents

// MARK: - InventoryOpsCard

public struct InventoryOpsCard: View {

    public struct Item: Identifiable, Sendable {
        public let id = UUID()
        public let name: String
        public let stock: Int
        public let daysUntilStockout: Int
        public let severity: Severity

        public enum Severity: Sendable {
            case alert, watch, normal
        }

        public init(name: String, stock: Int, daysUntilStockout: Int, severity: Severity) {
            self.name = name
            self.stock = stock
            self.daysUntilStockout = daysUntilStockout
            self.severity = severity
        }
    }

    let items: [Item]
    let ko: Bool

    public init(items: [Item], ko: Bool = true) {
        self.items = items
        self.ko = ko
    }

    private var alertCount: Int { items.filter { $0.severity == .alert }.count }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                // Header
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(alertCount > 0 ? BUColor.warn.opacity(0.14) : BUColor.midnight08)
                            .frame(width: 36, height: 36)
                        Image(systemName: "shippingbox.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(alertCount > 0 ? BUColor.warn : BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ko ? "재고 관리" : "Inventory")
                            .buSectionEyebrowStyle()
                        Text(alertCount > 0
                             ? (ko ? "재주문 \(alertCount)건" : "\(alertCount) reorder")
                             : (ko ? "정상" : "OK"))
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                    }
                    Spacer()
                }

                // Items
                VStack(spacing: 6) {
                    ForEach(items) { item in
                        itemRow(item)
                    }
                }
            }
        }
    }

    private func itemRow(_ item: Item) -> some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(item.name)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                    Spacer(minLength: 0)
                    severityBadge(item.severity)
                }
                Text(ko
                     ? "재고 \(item.stock)개 · \(item.daysUntilStockout)일 후 소진"
                     : "Stock \(item.stock) · \(item.daysUntilStockout)d left")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(BUColor.surfaceElevated.opacity(0.7), in: RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(BUColor.borderSubtle, lineWidth: 0.5)
        )
    }

    @ViewBuilder
    private func severityBadge(_ severity: Item.Severity) -> some View {
        switch severity {
        case .alert:
            Text(ko ? "재주문" : "Reorder")
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.warn)
                .padding(.horizontal, 6)
                .padding(.vertical, 1.5)
                .background(BUColor.warn.opacity(0.12), in: Capsule())
        case .watch:
            Text(ko ? "주의" : "Watch")
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.inkSecondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 1.5)
                .background(BUColor.midnight08, in: Capsule())
        case .normal:
            EmptyView()
        }
    }
}

// MARK: - TeamCard

public struct TeamCard: View {

    let employeeCount: Int
    let estimatedMonthlyPayroll: Double
    let insuredCount: Int
    let ko: Bool

    public init(
        employeeCount: Int,
        estimatedMonthlyPayroll: Double,
        insuredCount: Int,
        ko: Bool = true
    ) {
        self.employeeCount = employeeCount
        self.estimatedMonthlyPayroll = estimatedMonthlyPayroll
        self.insuredCount = insuredCount
        self.ko = ko
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(BUColor.midnight08)
                            .frame(width: 36, height: 36)
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ko ? "팀 관리" : "Team")
                            .buSectionEyebrowStyle()
                        Text(ko ? "직원 \(employeeCount)명" : "\(employeeCount) members")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                    }
                    Spacer()
                }

                HStack(spacing: 8) {
                    StatTile(
                        label: ko ? "월 인건비" : "Monthly",
                        value: formatKRWCompact(estimatedMonthlyPayroll),
                        unit: ko ? "원" : ""
                    )
                    StatTile(
                        label: ko ? "4대보험" : "Insured",
                        value: "\(insuredCount) / \(employeeCount)",
                        unit: ko ? "명" : ""
                    )
                }
            }
        }
    }
}

// MARK: - CustomerSummaryCard

public struct CustomerSummaryCard: View {

    let totalCustomers: Int
    let newThisMonth: Int
    let repeatRate: Double  // 0-100 %
    let ko: Bool

    public init(totalCustomers: Int, newThisMonth: Int, repeatRate: Double, ko: Bool = true) {
        self.totalCustomers = totalCustomers
        self.newThisMonth = newThisMonth
        self.repeatRate = repeatRate
        self.ko = ko
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(BUColor.midnight08)
                            .frame(width: 36, height: 36)
                        Image(systemName: "person.crop.circle.badge.checkmark")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ko ? "고객 변화" : "Customers")
                            .buSectionEyebrowStyle()
                        Text(ko ? "누적 \(totalCustomers.formatted())명" : "\(totalCustomers) total")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                    }
                    Spacer()
                }

                HStack(spacing: 8) {
                    StatTile(label: ko ? "신규" : "New", value: "+\(newThisMonth)", unit: ko ? "명" : "")
                    StatTile(label: ko ? "재방문" : "Repeat", value: String(format: "%.0f%%", repeatRate), unit: "")
                }
            }
        }
    }
}

// MARK: - shared StatTile

private struct StatTile: View {
    let label: String
    let value: String
    let unit: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .tracking(-0.5)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.65)
                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1))
    }
}

private func formatKRWCompact(_ value: Double) -> String {
    let v = Int(round(value))
    if v >= 100_000_000 { return "\(String(format: "%.1f", Double(v) / 100_000_000))억" }
    if v >= 10_000 { return "\(v / 10_000)만" }
    return v.formatted()
}

// MARK: - OperationsView (Tier 3 통합)

public struct OperationsView: View {

    let mock: MockData

    public init(mock: MockData) {
        self.mock = mock
    }

    private var sampleItems: [InventoryOpsCard.Item] {
        switch mock.category {
        case .restaurant, .cafe:
            return [
                .init(name: "식자재 — 양파", stock: 8, daysUntilStockout: 2, severity: .alert),
                .init(name: "포장재 — 종이백", stock: 24, daysUntilStockout: 5, severity: .watch),
                .init(name: "음료 — 콜라", stock: 120, daysUntilStockout: 18, severity: .normal),
            ]
        default:
            return [
                .init(name: "주력 상품 A", stock: 14, daysUntilStockout: 4, severity: .alert),
                .init(name: "주력 상품 B", stock: 38, daysUntilStockout: 12, severity: .normal),
            ]
        }
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: BUSpacing.shellGap) {
                HStack(spacing: 6) {
                    Image(systemName: "gearshape.2.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.midnight.opacity(0.7))
                    Text("운영 관리")
                        .buSectionEyebrowStyle()
                    Spacer()
                }
                .padding(.top, 4)

                InventoryOpsCard(items: sampleItems)

                TeamCard(
                    employeeCount: 3,
                    estimatedMonthlyPayroll: mock.costs.labor,
                    insuredCount: 2
                )

                CustomerSummaryCard(
                    totalCustomers: max(1, mock.entries.reduce(0) { $0 + $1.customers }),
                    newThisMonth: 12,
                    repeatRate: 42
                )

                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.md)
        }
        .background(BUBackgroundSurface())
    }
}

#if DEBUG
#Preview("OperationsView") {
    OperationsView(mock: .healthyRestaurant)
}
#endif
