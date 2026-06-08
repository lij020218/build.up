//
//  RevenueBasisSheet.swift — 매출 집계 기준 선택 (매출 카드 "자동 N곳" 배지 탭 시 sheet).
//   웹 RevenueBasisChooser 미러. cashflow_settings.revenueBasis 저장 (웹·iOS 양방향 동기).
//   - 카드 라디오: 겹침(cardOverlap)일 때만.  - 현금 토글: 팝빌 연결 시.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct RevenueBasisSheet: View {
    let ko: Bool
    let cardOverlap: Bool
    let hasPopbill: Bool
    let cashflowStore: CashflowStore
    let onSaved: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var draftCard: String
    @State private var draftCash: Bool
    @State private var saving = false

    init(ko: Bool, cardOverlap: Bool, hasPopbill: Bool, basis: RevenueBasis, cashflowStore: CashflowStore, onSaved: @escaping () -> Void) {
        self.ko = ko
        self.cardOverlap = cardOverlap
        self.hasPopbill = hasPopbill
        self.cashflowStore = cashflowStore
        self.onSaved = onSaved
        _draftCard = State(initialValue: basis.card)
        _draftCash = State(initialValue: basis.countCashReceipt)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if cardOverlap {
                        infoLine
                        radioRow(
                            value: "individual",
                            title: ko ? "채널별 실시간" : "Per channel (real-time)",
                            desc: ko ? "포트원(온라인)·토스플레이스(매장)를 각각 실시간 합산" : "Sum PortOne (online) + TossPlace (in-store) live"
                        )
                        radioRow(
                            value: "codef",
                            title: ko ? "카드사 통합 (여신협회)" : "Card networks (CODEF)",
                            desc: ko ? "모든 카드매출을 빠짐없이 — 배달앱·타사 단말 포함 (하루 정도 지연)" : "All card sales incl. delivery/other terminals (~1 day lag)"
                        )
                    }

                    if hasPopbill {
                        cashToggle
                    }

                    saveButton
                }
                .padding(BUSpacing.lg)
            }
            .background(BUColor.appBackground.ignoresSafeArea())
            .navigationTitle(ko ? "매출 집계 기준" : "Revenue basis")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(ko ? "취소" : "Cancel") { dismiss() }
                }
            }
        }
    }

    private var infoLine: some View {
        HStack(alignment: .top, spacing: 7) {
            Image(systemName: "info.circle")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
            Text(ko
                 ? "같은 카드매출이 여러 곳에 잡혀요. 한 기준만 집계해 중복을 막아요."
                 : "The same card sales appear in multiple sources. Pick one to avoid double-counting.")
                .font(.system(size: 12))
                .foregroundStyle(BUColor.midnightInk)
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 10).fill(BUColor.midnight.opacity(0.05)))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(BUColor.midnight.opacity(0.14), lineWidth: 0.5))
    }

    private func radioRow(value: String, title: String, desc: String) -> some View {
        let selected = draftCard == value
        return Button { draftCard = value } label: {
            HStack(alignment: .top, spacing: 11) {
                Circle()
                    .strokeBorder(selected ? BUColor.midnight : Color.black.opacity(0.28), lineWidth: selected ? 5 : 1.5)
                    .frame(width: 18, height: 18)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.system(size: 14, weight: .bold)).foregroundStyle(BUColor.ink)
                    Text(desc).font(.system(size: 12)).foregroundStyle(BUColor.inkMuted)
                }
                Spacer(minLength: 0)
            }
            .padding(13)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 12).fill(selected ? BUColor.midnight.opacity(0.05) : Color.white.opacity(0.7)))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(selected ? BUColor.midnight : Color.black.opacity(0.10), lineWidth: selected ? 1.5 : 1))
        }
        .buttonStyle(.plain)
    }

    private var cashToggle: some View {
        Toggle(isOn: $draftCash) {
            VStack(alignment: .leading, spacing: 2) {
                Text(ko ? "현금영수증을 현금매출로 합산" : "Count cash receipts as cash sales")
                    .font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.ink)
                Text(ko ? "카드결제에도 현금영수증을 끊는다면 끄세요 (중복 방지)" : "Turn off if you issue cash receipts for card payments too")
                    .font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)
            }
        }
        .tint(BUColor.midnight)
        .padding(13)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.7)))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.10), lineWidth: 1))
    }

    private var saveButton: some View {
        Button { save() } label: {
            Text(saving ? (ko ? "저장 중…" : "Saving…") : (ko ? "저장" : "Save"))
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .background(RoundedRectangle(cornerRadius: 12).fill(BUColor.midnightInk))
        }
        .buttonStyle(.plain)
        .disabled(saving)
        .padding(.top, 4)
    }

    private func save() {
        saving = true
        Task {
            var s = cashflowStore.settings
            s.revenueBasis = RevenueBasis(card: draftCard, countCashReceipt: draftCash)
            await cashflowStore.save(s)
            onSaved()
            saving = false
            dismiss()
        }
    }
}
