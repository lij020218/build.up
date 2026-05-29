//
//  CostManagementCard.swift — 월 비용 8항목 인라인 편집 + 저장.
//
//  웹 SSOT: apps/web/app/lib/components/my-store/CostManagementCard.tsx
//  Supabase: user_store_data.monthly_costs (jsonb) — MonthlyCostsRepository 가 처리.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

struct CostManagementCard: View {

    @Bindable var store: DashboardStore

    @State private var editing: Bool = false
    @State private var draft: DraftCosts = DraftCosts()
    @State private var saving: Bool = false

    private struct DraftCosts {
        var ingredients: String = ""
        var labor: String = ""
        var rent: String = ""
        var utilities: String = ""
        var sga: String = ""
        var marketing: String = ""
        var other: String = ""
        var interest: String = ""

        static func from(_ c: MonthlyCosts) -> DraftCosts {
            var d = DraftCosts()
            d.ingredients = c.ingredients > 0 ? String(Int(c.ingredients)) : ""
            d.labor       = c.labor       > 0 ? String(Int(c.labor))       : ""
            d.rent        = c.rent        > 0 ? String(Int(c.rent))        : ""
            d.utilities   = c.utilities   > 0 ? String(Int(c.utilities))   : ""
            d.sga         = c.sga         > 0 ? String(Int(c.sga))         : ""
            d.marketing   = c.marketing   > 0 ? String(Int(c.marketing))   : ""
            d.other       = c.other       > 0 ? String(Int(c.other))       : ""
            d.interest    = c.interest    > 0 ? String(Int(c.interest))    : ""
            return d
        }

        func toCosts() -> MonthlyCosts {
            MonthlyCosts(
                ingredients: Double(ingredients) ?? 0,
                labor:       Double(labor) ?? 0,
                rent:        Double(rent) ?? 0,
                utilities:   Double(utilities) ?? 0,
                sga:         Double(sga) ?? 0,
                marketing:   Double(marketing) ?? 0,
                other:       Double(other) ?? 0,
                interest:    Double(interest) ?? 0
            )
        }
    }

    private let fields: [(key: WritableKeyPath<DraftCosts, String>, label: String, icon: String, color: String)] = [
        (\.ingredients, "재료비",   "leaf.fill",            "#0a84ff"),
        (\.labor,       "인건비",   "person.2.fill",        "#34c759"),
        (\.rent,        "임대료",   "building.2.fill",      "#ff9f0a"),
        (\.utilities,   "공과금",   "bolt.fill",            "#5ac8fa"),
        (\.marketing,   "마케팅",   "megaphone.fill",       "#bf5af2"),
        (\.sga,         "SGA",     "doc.text.fill",        "#ff375f"),
        (\.interest,    "이자",     "wonsign.circle.fill",  "#cc6680"),
        (\.other,       "기타",     "ellipsis.circle.fill", "#8e8e93"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            header

            if editing {
                editingRows
                saveCancelButtons
            } else {
                readonlyRows
                editButton
            }

            Rectangle().fill(BUColor.inkMuted.opacity(0.08)).frame(height: 1)
            totalRow
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("월 비용 관리 · COST MANAGEMENT")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            Text("8개 항목 월 환산")
                .font(.system(size: 17, weight: .bold))
                .tracking(-0.3)
                .foregroundStyle(BUColor.ink)
            Text("정확히 입력할수록 마진·런웨이·이상 신호 분석이 정밀해집니다")
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .padding(.top, 2)
        }
    }

    // MARK: - Read-only rows

    private var readonlyRows: some View {
        VStack(spacing: 6) {
            ForEach(Array(fields.enumerated()), id: \.offset) { _, f in
                let value = currentCosts.value(forKey: f.label)
                HStack(spacing: 10) {
                    Image(systemName: f.icon)
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(Color(buHexLocal: f.color))
                        .frame(width: 18)
                    Text(f.label)
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Spacer(minLength: 0)
                    Text(value > 0 ? formatWonShort(Int(value)) : "—")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(value > 0 ? BUColor.ink : BUColor.inkMuted.opacity(0.45))
                }
                .padding(.horizontal, 10).padding(.vertical, 7)
                .background(BUColor.inkMuted.opacity(0.02), in: RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    private var editButton: some View {
        Button {
            draft = DraftCosts.from(currentCosts)
            withAnimation(.easeInOut(duration: 0.18)) { editing = true }
        } label: {
            HStack(spacing: 5) {
                Image(systemName: "pencil")
                    .font(.system(size: 11, weight: .heavy))
                Text("비용 수정")
                    .font(.system(size: 13, weight: .heavy))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 14).padding(.vertical, 9)
            .frame(maxWidth: .infinity)
            .background(BUColor.midnight, in: Capsule())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Editing rows

    private var editingRows: some View {
        VStack(spacing: 6) {
            ForEach(Array(fields.enumerated()), id: \.offset) { _, f in
                HStack(spacing: 8) {
                    Image(systemName: f.icon)
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(Color(buHexLocal: f.color))
                        .frame(width: 18)
                    Text(f.label)
                        .font(.system(size: 12.5, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                        .frame(width: 60, alignment: .leading)
                    TextField("0", text: Binding(
                        get: { draft[keyPath: f.key] },
                        set: { draft[keyPath: f.key] = $0 }
                    ))
                    .keyboardType(.numberPad)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                    .padding(.horizontal, 10).padding(.vertical, 7)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .strokeBorder(BUColor.cardBorder, lineWidth: 1)
                    )
                    Text("원")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
        }
    }

    private var saveCancelButtons: some View {
        HStack(spacing: 8) {
            Button {
                withAnimation(.easeInOut(duration: 0.18)) { editing = false }
            } label: {
                Text("취소")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(BUColor.inkMuted.opacity(0.06), in: Capsule())
            }
            .buttonStyle(.plain)
            .disabled(saving)

            Button {
                Task { await save() }
            } label: {
                HStack(spacing: 4) {
                    if saving { ProgressView().scaleEffect(0.8).tint(.white) }
                    Text(saving ? "저장 중" : "저장")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(.white)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(BUColor.midnight, in: Capsule())
            }
            .buttonStyle(.plain)
            .disabled(saving)
        }
    }

    // MARK: - Total

    private var currentCosts: MonthlyCosts { store.costs }

    private var totalRow: some View {
        HStack {
            Text("월 총 비용")
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
            Spacer(minLength: 0)
            Text(formatWonShort(Int(currentCosts.total)))
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(BUColor.ink)
        }
    }

    // MARK: - Save

    private func save() async {
        saving = true
        defer { saving = false }
        await store.upsertCosts(draft.toCosts())
        withAnimation(.easeInOut(duration: 0.18)) { editing = false }
    }

    private func formatWonShort(_ won: Int) -> String {
        if abs(won) >= 100_000_000 {
            return String(format: "%.1f억", Double(won) / 100_000_000)
        }
        if abs(won) >= 10_000 {
            return "\(Int(Double(won) / 10_000.0).formatted())만"
        }
        return "\(won.formatted())"
    }
}

// 같은 파일 안에서만 쓰는 helper
fileprivate extension Color {
    init(buHexLocal: String) {
        var s = buHexLocal.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        var rgb: UInt64 = 0
        Scanner(string: s).scanHexInt64(&rgb)
        let r = Double((rgb >> 16) & 0xFF) / 255.0
        let g = Double((rgb >>  8) & 0xFF) / 255.0
        let b = Double( rgb        & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

fileprivate extension MonthlyCosts {
    func value(forKey label: String) -> Double {
        switch label {
        case "재료비": return ingredients
        case "인건비": return labor
        case "임대료": return rent
        case "공과금": return utilities
        case "마케팅": return marketing
        case "SGA":   return sga
        case "이자":   return interest
        case "기타":   return other
        default: return 0
        }
    }
}
