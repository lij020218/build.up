//
//  FinancialSnapshotCard.swift — 재무 스냅샷 카드 (iOS 모바일)
//
//  웹 SSOT: apps/web/app/lib/components/my-store/FinancialSnapshotSection.tsx
//
//  4 stat row:
//    · 누적 매출  (sum entries.sales)
//    · 총 자본금  (placeholder — DashboardStore 에 미존재 → 0)
//    · 현재 잔고  (currentCash, 인라인 수정 가능)
//    · 런웨이     (잔고 ÷ 월 burn)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

// MARK: - 원화 포맷 헬퍼 (이전 MyStoreHero.swift 에서 분리)

internal func fmtWonShort(_ n: Double) -> String {
    guard n.isFinite else { return "—" }
    let abs = Swift.abs(n)
    if abs >= 100_000_000 {
        return String(format: "%.1f억", n / 100_000_000)
    }
    if abs >= 10_000 {
        return "\(Int(n / 10_000).formatted())만"
    }
    return "\(Int(n).formatted())원"
}

public struct FinancialSnapshotCard: View {

    @Bindable private var store: DashboardStore

    @State private var isEditing: Bool = false
    @State private var draft: String = ""
    @FocusState private var focused: Bool

    public init(store: DashboardStore) {
        self.store = store
    }

    // MARK: - Computed

    private var cumulativeSales: Double {
        store.entries.reduce(0) { $0 + $1.sales }
    }

    private var balance: Double {
        store.currentCash ?? 0
    }

    private var monthlyBurn: Double {
        store.costs.total
    }

    private var runwayMonths: Double? {
        guard monthlyBurn > 0 else { return nil }
        return balance / monthlyBurn
    }

    private var runwayLabel: String {
        guard let r = runwayMonths else { return "—" }
        return String(format: "%.1f개월", r)
    }

    private var runwayColor: Color {
        guard let r = runwayMonths else { return BUColor.midnightDeep }
        if r < 6 { return BUColor.danger }
        if r < 12 { return BUColor.warn }
        return BUColor.success
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            header
            statRow(label: "누적 매출", value: "₩\(fmtWonShort(cumulativeSales))", tone: .neutral)
            divider
            statRow(label: "총 자본금", value: "—", tone: .neutral)
            divider
            balanceRow
            divider
            statRow(label: "런웨이", value: runwayLabel, valueColor: runwayColor, tone: .neutral)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            BUEyebrow("재무 현황 · FINANCIAL")
            Text("회계 스냅샷")
                .font(.system(size: 17, weight: .bold))
                .tracking(-0.3)
                .foregroundStyle(BUColor.midnightDeep)
            Text("누적 매출 · 잔고 · 런웨이 — 운영 대시보드와 별개")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
        }
    }

    private var divider: some View {
        Rectangle()
            .fill(BUColor.cardBorder)
            .frame(height: 1)
    }

    // MARK: - Stat row

    private enum Tone { case neutral }

    private func statRow(label: String, value: String, valueColor: Color = BUColor.midnightDeep, tone: Tone) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.ink)
            Spacer()
            Text(value)
                .font(.system(size: 15, weight: .bold))
                .tracking(-0.2)
                .foregroundStyle(valueColor)
        }
        .frame(minHeight: 28)
    }

    // MARK: - Inline editable balance row

    private var balanceRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("현재 잔고")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Spacer()
                if !isEditing {
                    Text("₩\(fmtWonShort(balance))")
                        .font(.system(size: 15, weight: .bold))
                        .tracking(-0.2)
                        .foregroundStyle(BUColor.midnightDeep)
                    Button {
                        draft = balance > 0 ? String(Int(balance)) : ""
                        isEditing = true
                        focused = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "pencil")
                                .font(.system(size: 10, weight: .semibold))
                            Text("수정")
                                .font(.system(size: 11, weight: .semibold))
                        }
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule().fill(BUColor.midnight.opacity(0.08))
                        )
                    }
                    .buttonStyle(.plain)
                    .frame(minHeight: 30)
                }
            }
            if isEditing {
                HStack(spacing: 8) {
                    TextField("0", text: $draft)
                        .keyboardType(.numberPad)
                        .focused($focused)
                        .font(.system(size: 15, weight: .semibold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 10).fill(BUColor.midnight.opacity(0.04))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
                        )

                    Button("저장") {
                        commitBalance()
                    }
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(BUColor.midnight)
                    .clipShape(Capsule())
                    .frame(minHeight: 44)
                    .buttonStyle(.plain)

                    Button("취소") {
                        isEditing = false
                        draft = ""
                    }
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 10)
                    .frame(minHeight: 44)
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func commitBalance() {
        let cleaned = draft.filter { $0.isNumber }
        guard let v = Double(cleaned), v >= 0 else {
            isEditing = false
            return
        }
        // currentCash 만 갱신, 나머지 프로필 필드는 보존
        store.setProfile(
            storeName: store.storeName,
            userName: store.userName,
            daysSinceLaunch: store.daysSinceLaunch,
            category: store.category,
            currentCash: v,
            businessLaunched: store.businessLaunched
        )
        isEditing = false
        draft = ""
    }
}
