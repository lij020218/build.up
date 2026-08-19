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
        // 2026-08-19 IA: 컴팩트 3숫자 스트립 (누적 매출 · 현재 잔고 · 런웨이) — 손익·재무 탭과 겹치는 지표라 축약.
        //   잔고 수정은 스트립 아래 인라인 (수정/저장 패턴 유지).
        VStack(alignment: .leading, spacing: 12) {
            header
            HStack(spacing: 0) {
                stripCell(label: "누적 매출", value: "₩\(fmtWonShort(cumulativeSales))")
                stripDivider
                stripCell(label: "현재 잔고", value: "₩\(fmtWonShort(balance))", editable: true)
                stripDivider
                stripCell(label: "런웨이", value: runwayLabel, valueColor: runwayColor)
            }
            if isEditing {
                balanceEditor
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    // MARK: - Strip cells

    private var stripDivider: some View {
        Rectangle().fill(BUColor.cardBorder).frame(width: 1, height: 34)
    }

    private func stripCell(label: String, value: String, valueColor: Color = BUColor.midnightDeep, editable: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Text(label)
                    .font(.system(size: 10.5, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                if editable && !isEditing {
                    Button {
                        draft = balance > 0 ? String(Int(balance)) : ""
                        isEditing = true
                        focused = true
                    } label: {
                        Image(systemName: "pencil")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(BUColor.midnight)
                            .frame(width: 18, height: 18)
                            .background(BUColor.midnight.opacity(0.08), in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("현재 잔고 수정")
                }
            }
            Text(value)
                .font(.system(size: 15, weight: .bold))
                .tracking(-0.2)
                .foregroundStyle(valueColor)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
    }

    // MARK: - Header

    private var header: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            BUEyebrow("재무 현황 · FINANCIAL")
            Spacer(minLength: 0)
            Text("운영 대시보드와 별개")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
        }
    }

    // MARK: - Inline balance editor (수정 탭 시 스트립 아래)

    private var balanceEditor: some View {
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
