//
//  OperationsCards.swift — 재고 관리 + 팀 관리 카드 (실데이터 버전)
//
//  웹 SSOT:
//   • InventoryOpsCard   ← InventoryManagementCard.tsx / InventoryOpsCard.tsx
//   • TeamCard           ← TeamCard.tsx / StaffLaborCard.tsx (calcEmployee 공식 동일)
//
//  급여 공식 (web SSOT: StaffLaborCard.tsx calcEmployee):
//   weeklyAllowance = weeklyHours >= 15 ? (weeklyHours/5) × hourlyWage : 0
//   monthlyWage     = (hourlyWage × weeklyHours + weeklyAllowance) × 4.345
//   insurance       = isInsured ? monthlyWage × 0.1041 : 0
//   burden          = monthlyWage + insurance
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneData

// MARK: - InventoryOpsCard

public struct InventoryOpsCard: View {

    let items: [BUInventoryItem]
    let onManage: (() -> Void)?
    let ko: Bool
    /// 메뉴(product) 항목 — 음식·카페·서비스에서 '메뉴·재료 관리'로 통합 표시 (2026-07-22, 웹 정합).
    let menuItems: [BUInventoryItem]
    /// 메뉴 관리(MenuRecipeSheet) 진입 — 전달되면 통합 카드 모드(제목·메뉴 섹션 활성).
    let onManageMenus: (() -> Void)?

    /// 헤더 eyebrow 오버라이드 — 오퍼링 페이지 분리 카드("재료 재고"/"소모품 재고")용 (2026-07-27)
    let titleOverride: String?

    public init(items: [BUInventoryItem], onManage: (() -> Void)? = nil, ko: Bool = true,
                menuItems: [BUInventoryItem] = [], onManageMenus: (() -> Void)? = nil,
                titleOverride: String? = nil) {
        self.items = items
        self.onManage = onManage
        self.ko = ko
        self.menuItems = menuItems
        self.onManageMenus = onManageMenus
        self.titleOverride = titleOverride
    }

    private var alertItems: [BUInventoryItem] { items.filter { $0.isLowStock } }
    private var watchItems: [BUInventoryItem] { items.filter { !$0.isLowStock && $0.daysUntilStockout <= 7 } }
    private var alertCount: Int { alertItems.count }

    private var displayItems: [BUInventoryItem] {
        let prioritized = alertItems + watchItems + items.filter { !$0.isLowStock && $0.daysUntilStockout > 7 }
        return Array(prioritized.prefix(5))
    }

    /// 원가율 황금률 초과 메뉴 수 (음식·카페 33% 고정 — 서비스 구분은 시트에서).
    private var overMenuCount: Int {
        menuItems.filter { m in
            guard m.sellingPrice > 0 else { return false }
            return RecipeCost.menuCostPerServing(m, materials: items) / m.sellingPrice * 100 > 33
        }.count
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                if let onManageMenus { menuSection(onManageMenus) }
                if items.isEmpty {
                    emptyState
                } else {
                    VStack(spacing: 6) {
                        ForEach(displayItems) { item in
                            itemRow(item)
                        }
                        if items.count > 5 {
                            Text(ko ? "+ \(items.count - 5)개 더" : "+ \(items.count - 5) more")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                }
            }
        }
    }

    private var header: some View {
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
                Text(titleOverride
                     ?? (onManageMenus != nil
                         ? (ko ? "메뉴·재료 관리" : "Menu & Ingredients")
                         : (ko ? "재고 관리" : "Inventory")))
                    .buSectionEyebrowStyle()
                Text(items.isEmpty
                     ? (ko ? "항목 없음" : "No items")
                     : (alertCount > 0
                        ? (ko ? "재주문 \(alertCount)건" : "\(alertCount) reorder")
                        : (ko ? "정상" : "OK")))
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(BUColor.ink)
            }
            Spacer()
            if let onManage {
                Button(ko ? "관리하기 →" : "Manage →", action: onManage)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
        }
    }

    /// 메뉴 요약 섹션 (2026-07-22 통합, 웹 InventoryOpsCard 메뉴 섹션 미러) —
    /// 원가율·판매 ±·레시피는 MenuRecipeSheet(메뉴 관리)에서.
    private func menuSection(_ manage: @escaping () -> Void) -> some View {
        Button(action: manage) {
            HStack(spacing: 8) {
                Image(systemName: "fork.knife")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                if menuItems.isEmpty {
                    Text(ko ? "메뉴 등록 → 원가율·판매·재고 자동차감" : "Add menus for cost ratio & auto-deduct")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.inkSecondary)
                } else {
                    Text(ko ? "메뉴 \(menuItems.count)개" : "\(menuItems.count) menus")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                    if overMenuCount > 0 {
                        Text(ko ? "원가율 초과 \(overMenuCount)" : "\(overMenuCount) over")
                            .font(.system(size: 10.5, weight: .bold))
                            .foregroundStyle(Color(red: 0.71, green: 0.30, blue: 0.30))
                            .padding(.horizontal, 7).padding(.vertical, 2)
                            .background(Color(red: 0.71, green: 0.30, blue: 0.30).opacity(0.08), in: Capsule())
                    }
                }
                Spacer()
                Text(ko ? "메뉴 관리 →" : "Manage →")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "shippingbox")
                .font(.system(size: 24, weight: .light))
                .foregroundStyle(BUColor.inkMuted)
            Text(ko ? "재고 항목을 추가하면\n소진 예상일을 자동 계산합니다" : "Add inventory items\nto track stockout days")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
            if let onManage {
                Button(ko ? "+ 재고 추가" : "+ Add item", action: onManage)
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 10))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    /// ABC 등급 (웹 InventoryManagementCard 패리티, 2026-08-05) — 매출기여 누적 80/95%
    private var abcById: [String: String] {
        let grades = InventoryInsights.abcClassify(items)
        var out: [String: String] = [:]
        for (idx, item) in items.enumerated() { if let g = grades[idx] { out[item.id] = g } }
        return out
    }

    private func itemRow(_ item: BUInventoryItem) -> some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(item.name)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                    if let g = abcById[item.id] {
                        Text("\(g)급")
                            .font(.system(size: 9.5, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6).padding(.vertical, 1)
                            .background(g == "A" ? BUColor.success : (g == "B" ? BUColor.accent : BUColor.inkMuted), in: RoundedRectangle(cornerRadius: 5, style: .continuous))
                    }
                    Spacer(minLength: 0)
                    severityBadge(item)
                }
                let stockText = ko
                    ? "재고 \(Int(item.quantity))\(item.unit) · \(item.daysUntilStockout < 999 ? "\(item.daysUntilStockout)일 후 소진" : "소진일 미설정")"
                    : "Stock \(Int(item.quantity))\(item.unit) · \(item.daysUntilStockout < 999 ? "\(item.daysUntilStockout)d left" : "no daily usage set")"
                Text(stockText)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                // 상품 회전일수 + 풀필먼트(로켓그로스) 무료보관 60일 초과 경고 (웹 패리티)
                if item.itemType == "product", let ds = InventoryInsights.daysOfStock(item) {
                    let over = ds > InventoryInsights.fulfillmentFreeStorageDays
                    Text(over ? "재고 \(ds)일치 — 풀필먼트 무료보관 60일 초과, 장기보관비 주의" : "재고 \(ds)일치")
                        .font(.system(size: 10.5, weight: over ? .bold : .medium))
                        .foregroundStyle(over ? BUColor.danger : BUColor.inkMuted)
                }
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(BUColor.surfaceElevated.opacity(0.7), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.borderSubtle, lineWidth: 0.5))
    }

    @ViewBuilder
    private func severityBadge(_ item: BUInventoryItem) -> some View {
        if item.isLowStock {
            Text(ko ? "재주문" : "Reorder")
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.warn)
                .padding(.horizontal, 6)
                .padding(.vertical, 1.5)
                .background(BUColor.warn.opacity(0.12), in: Capsule())
        } else if item.daysUntilStockout <= 7 {
            Text(ko ? "주의" : "Watch")
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.inkSecondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 1.5)
                .background(BUColor.midnight08, in: Capsule())
        } else {
            EmptyView()
        }
    }
}

// MARK: - TeamCard

public struct TeamCard: View {

    let employees: [BUEmployee]
    /// 초대 링크로 연결된 직원(store_members) 이름 — 팀카드 인원·명단 기준 (2026-07-14 버그픽스:
    /// 종전엔 employees[수동 급여 명단]만 세어 초대 직원이 안 잡혔음. 웹 TeamCard 와 동기).
    let invitedNames: [String]
    /// 직원 미등록 시 비용카드 인건비를 fallback으로 사용 (mock 혹은 수동 입력값)
    let manualLaborCost: Double
    let onManage: (() -> Void)?
    let ko: Bool

    public init(
        employees: [BUEmployee],
        invitedNames: [String] = [],
        manualLaborCost: Double = 0,
        onManage: (() -> Void)? = nil,
        ko: Bool = true
    ) {
        self.employees = employees
        self.invitedNames = invitedNames
        self.manualLaborCost = manualLaborCost
        self.onManage = onManage
        self.ko = ko
    }

    // 초대 직원 우선, 없으면 수동 급여 명단 수. 인건비·보험은 수동 급여 데이터 있을 때만 산정.
    private var teamCount: Int { invitedNames.count > 0 ? invitedNames.count : employees.count }
    private var hasPayroll: Bool { !employees.isEmpty }
    private var totalPayroll: Double {
        if employees.isEmpty { return manualLaborCost }
        return employees.reduce(0) { $0 + $1.monthlyBurden }
    }
    private var insuredCount: Int { employees.filter { $0.isInsured }.count }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                if teamCount == 0 {
                    emptyState
                } else {
                    if !invitedNames.isEmpty { rosterRow }
                    statsRow
                }
            }
        }
    }

    // 직원 명단 (초대 직원 이름) — 사장님 '팀카드에 명단 안 뜬다'. Text 로 자연 줄바꿈.
    private var rosterRow: some View {
        Text(invitedNames.joined(separator: " · "))
            .font(.system(size: 12.5, weight: .semibold))
            .foregroundStyle(BUColor.inkSecondary)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var header: some View {
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
                Text(teamCount == 0
                     ? (ko ? "직원 없음" : "No staff")
                     : (ko ? "직원 \(teamCount)명" : "\(teamCount) members"))
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(BUColor.ink)
            }
            Spacer()
            if let onManage {
                Button(ko ? "관리하기 →" : "Manage →", action: onManage)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
        }
    }

    private var statsRow: some View {
        // 인건비·4대보험은 수동 급여 명단(시급·보험)이나 비용카드 인건비가 있을 때만 산정 —
        //   초대 직원만 있고 급여 데이터 없으면 '—' (0 위장 금지, 웹과 동기).
        let hasLabor = hasPayroll || manualLaborCost > 0
        return HStack(spacing: 8) {
            StatTile(
                label: ko ? "월 인건비" : "Monthly",
                value: hasLabor ? formatKRWCompact(totalPayroll) : "—",
                unit: hasLabor ? (ko ? "원" : "") : ""
            )
            StatTile(
                label: ko ? "4대보험" : "Insured",
                value: hasPayroll ? "\(insuredCount) / \(employees.count)" : "—",
                unit: hasPayroll ? (ko ? "명" : "") : ""
            )
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "person.2")
                .font(.system(size: 24, weight: .light))
                .foregroundStyle(BUColor.inkMuted)
            Text(ko ? "직원을 등록하면\n월 인건비와 4대보험을 자동 계산합니다" : "Register staff to\nauto-calculate wages & insurance")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
            if let onManage {
                Button(ko ? "+ 직원 추가" : "+ Add staff", action: onManage)
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 10))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
}

// MARK: - CustomerSummaryCard
//
// 웹 SSOT: CustomerSummaryCard.tsx — mode 별 stats 구성 완전 동일
// membership  : 활성 회원 / 만료 임박 / 월 매출
// appointment : 고객 수 / 단골 / (이번 주 예약)
// repeat      : 등록 고객 / 활성 / 재방문율
// ecommerce   : 구매자 / 재구매 / 평균 객단가

public struct CustomerSummaryCard: View {

    let members: [BUMember]
    let mode: BUCustomerMode
    let label: String            // 카드 제목 (업종별)
    let onManage: (() -> Void)?
    let ko: Bool

    public init(
        members: [BUMember],
        mode: BUCustomerMode,
        label: String,
        onManage: (() -> Void)? = nil,
        ko: Bool = true
    ) {
        self.members = members
        self.mode = mode
        self.label = label
        self.onManage = onManage
        self.ko = ko
    }

    private var activeMembers: [BUMember]  { members.filter { $0.isActive } }
    private var expiringMembers: [BUMember] { members.filter { $0.isExpiringSoon } }
    private var totalRevenue: Double { activeMembers.reduce(0) { $0 + $1.fee } }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                if members.isEmpty {
                    emptyState
                } else {
                    statsRow
                }
            }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(expiringMembers.isEmpty ? BUColor.midnight08 : BUColor.warn.opacity(0.14))
                    .frame(width: 36, height: 36)
                Image(systemName: modeIcon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(expiringMembers.isEmpty ? BUColor.midnight : BUColor.warn)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .buSectionEyebrowStyle()
                Text(members.isEmpty
                     ? (ko ? "등록 없음" : "None")
                     : (ko ? "\(activeMembers.count)명 활성" : "\(activeMembers.count) active"))
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(BUColor.ink)
            }
            Spacer()
            if let onManage {
                Button(ko ? "관리하기 →" : "Manage →", action: onManage)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
        }
    }

    private var statsRow: some View {
        HStack(spacing: 8) {
            ForEach(modeStats, id: \.label) { stat in
                StatTile(
                    label: stat.label,
                    value: stat.value,
                    unit: "",
                    alert: stat.alert
                )
            }
        }
    }

    private struct ModeStatItem { let label: String; let value: String; var alert: Bool = false }

    private var modeStats: [ModeStatItem] {
        switch mode {
        case .membership:
            return [
                .init(label: ko ? "활성 회원" : "Active", value: "\(activeMembers.count)명"),
                .init(label: ko ? "만료 임박" : "Expiring",
                      value: expiringMembers.isEmpty ? "—" : "\(expiringMembers.count)명",
                      alert: !expiringMembers.isEmpty),
                .init(label: ko ? "월 매출" : "MRR",
                      value: totalRevenue > 0 ? formatKRWCompact(totalRevenue) + "원" : "—"),
            ]
        case .appointment:
            return [
                .init(label: ko ? "고객 수" : "Clients", value: "\(members.count)명"),
                .init(label: ko ? "단골" : "Regulars", value: "\(activeMembers.count)명"),
                .init(label: ko ? "만료 임박" : "Expiring",
                      value: expiringMembers.isEmpty ? "—" : "\(expiringMembers.count)명",
                      alert: !expiringMembers.isEmpty),
            ]
        case .repeat:
            return [
                .init(label: ko ? "등록 고객" : "Registered", value: "\(members.count)명"),
                .init(label: ko ? "활성" : "Active", value: "\(activeMembers.count)명"),
                .init(label: ko ? "재방문율" : "Return", value: members.isEmpty ? "—" : "\(Int(Double(activeMembers.count) / Double(members.count) * 100))%"),
            ]
        case .ecommerce:
            return [
                .init(label: ko ? "구매자" : "Buyers", value: "\(members.count)명"),
                .init(label: ko ? "활성" : "Active", value: "\(activeMembers.count)명"),
                .init(label: ko ? "월 매출" : "Revenue",
                      value: totalRevenue > 0 ? formatKRWCompact(totalRevenue) + "원" : "—"),
            ]
        default:
            return [
                .init(label: ko ? "고객 수" : "Customers", value: "\(members.count)명"),
                .init(label: ko ? "활성" : "Active", value: "\(activeMembers.count)명"),
                .init(label: ko ? "월 매출" : "Revenue",
                      value: totalRevenue > 0 ? formatKRWCompact(totalRevenue) + "원" : "—"),
            ]
        }
    }

    private var modeIcon: String {
        switch mode {
        case .membership:  return "person.crop.circle.badge.checkmark"
        case .appointment: return "calendar.badge.clock"
        case .repeat:      return "arrow.triangle.2.circlepath.circle"
        case .ecommerce:   return "bag.circle"
        default:           return "person.2.circle"
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: modeIcon)
                .font(.system(size: 24, weight: .light))
                .foregroundStyle(BUColor.inkMuted)
            Text(emptyMessage)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
            if let onManage {
                Button(ko ? "+ 추가" : "+ Add", action: onManage)
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 10))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var emptyMessage: String {
        switch mode {
        case .membership:  return ko ? "회원을 등록하면\n만료·갱신 현황을 추적합니다" : "Add members to track expiry & renewal"
        case .appointment: return ko ? "고객을 등록하면\n예약·방문 이력을 관리합니다" : "Add clients to track visits & services"
        case .repeat:      return ko ? "단골을 등록하면\n재방문 패턴을 볼 수 있습니다" : "Add regulars to see return patterns"
        case .ecommerce:   return ko ? "구매자를 등록하면\n재구매율을 추적합니다" : "Add buyers to track repeat purchases"
        default:           return ko ? "고객을 등록하세요" : "Add customers"
        }
    }
}

// MARK: - shared StatTile

struct StatTile: View {
    let label: String
    let value: String
    let unit: String
    var alert: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(alert ? BUColor.danger : BUColor.ink)
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
        .background(alert ? BUColor.danger.opacity(0.04) : BUColor.midnight.opacity(0.03),
                    in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12)
            .strokeBorder(alert ? BUColor.danger.opacity(0.15) : BUColor.midnight.opacity(0.06), lineWidth: 1))
    }
}

private func formatKRWCompact(_ value: Double) -> String {
    let v = Int(round(value))
    if v >= 100_000_000 { return "\(String(format: "%.1f", Double(v) / 100_000_000))억" }
    if v >= 10_000 { return "\(v / 10_000)만" }
    return v.formatted()
}

// MARK: - OperationsView (preview / standalone)

public struct OperationsView: View {

    let mock: MockData

    public init(mock: MockData) {
        self.mock = mock
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

                InventoryOpsCard(items: [])
                TeamCard(employees: [], manualLaborCost: mock.costs.labor)
                CustomerSummaryCard(members: [], mode: .membership, label: "회원 관리")
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
