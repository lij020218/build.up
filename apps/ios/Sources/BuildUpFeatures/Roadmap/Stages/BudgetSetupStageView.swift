//
//  BudgetSetupStageView.swift — 자본·일정 설정 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/BudgetSetupStage.tsx
//  stageId: "budget-setup"
//
//  섹션 구조:
//    § 1 — 시작 자본금 (슬라이더 100만~3억 + 직접입력 + 프리셋)
//    § 2 — 운영자본금 (별도, 월 운영비 × 개월수 기반 + 런웨이 건강도 표시)
//    § 3 — 목표 오픈 시점 (프리셋 chip)
//    § 4 — Wrapup 체크리스트
//
//  외식 월 예상 운영비: 800만원/월 (웹 SSOT offlineMonthlyByCategory.food)
//  권장 운영자본 범위: 3~6개월 = 2400만~4800만원
//
//  데이터:
//    @AppStorage "stage.budget.startupWon"    — Int
//    @AppStorage "stage.budget.operatingWon"  — Int
//    @AppStorage "stage.budget.openDateId"    — String
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

// MARK: - BudgetSetupStageView

public struct BudgetSetupStageView: View {

    @Environment(\.dismiss) private var dismiss

    @AppStorage("stage.budget.startupWon")   private var startupWon   = 0
    @AppStorage("stage.budget.operatingWon") private var operatingWon = 0
    @AppStorage("stage.budget.openDateId")   private var openDateId   = ""

    // 슬라이더 바인딩용 Double 캐시
    @State private var startupSlider   = 30_000_000.0
    @State private var operatingSlider = 0.0

    @State private var startupText   = ""
    @State private var operatingText = ""

    private let monthlyEstimate = 8_000_000   // 외식 월 예상 운영비 (웹 SSOT 기준)

    private let startupPresets: [(String, Int)] = [
        ("1000만", 10_000_000),
        ("3000만", 30_000_000),
        ("5000만", 50_000_000),
        ("1억",   100_000_000),
        ("2억",   200_000_000),
        ("3억",   300_000_000),
    ]

    private let openDatePresets: [(id: String, labelKo: String)] = [
        ("1mo",   "1개월 내"),
        ("3mo",   "3개월 내"),
        ("6mo",   "6개월 내"),
        ("12mo",  "1년 내"),
        ("later", "1년 이상"),
    ]

    private var isDone: Bool { startupWon > 0 && !openDateId.isEmpty }

    // Runway health
    private var ratio: Double { monthlyEstimate > 0 ? Double(operatingWon) / Double(monthlyEstimate) : 0 }
    private var ratioLabel: String {
        if operatingWon == 0 { return "아직 미입력" }
        if ratio >= 6 { return "매우 여유 (6개월+)" }
        if ratio >= 3 { return "적정 (3~6개월)" }
        if ratio >= 1 { return "부족 (3개월 미만)" }
        return "매우 부족 (1개월 미만)"
    }
    private var ratioColor: Color {
        if operatingWon == 0 { return BUColor.inkMuted }
        if ratio >= 3 { return BUColor.success }
        if ratio >= 1 { return Color.orange }
        return Color.red
    }

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {

                        heroBanner
                            .padding(.horizontal, BUSpacing.md)

                        startupCapitalSection
                            .padding(.horizontal, BUSpacing.md)

                        operatingCapitalSection
                            .padding(.horizontal, BUSpacing.md)

                        openDateSection
                            .padding(.horizontal, BUSpacing.md)

                        wrapupSection
                            .padding(.horizontal, BUSpacing.md)

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("자본·일정 설정")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .onAppear {
            if startupWon > 0 {
                startupSlider = Double(startupWon)
                startupText = String(startupWon / 10_000)
            }
            if operatingWon > 0 {
                operatingSlider = Double(operatingWon)
                operatingText = String(operatingWon / 10_000)
            }
        }
    }

    // MARK: - Hero

    private var heroBanner: some View {
        BUCard(.hero) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("단계 5 · 자본·일정")
                Text("자본금과 오픈 시점을\n설정하세요")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .tracking(-0.3)
                    .lineSpacing(4)
                Text("자본 규모에 따라 로드맵 실행 속도와 우선순위가 달라집니다.")
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)

                HStack(spacing: BUSpacing.sm) {
                    budgetMini(icon: "banknote.fill",     value: "자본금",  label: "창업 총 비용")
                    budgetMini(icon: "calendar.badge.clock", value: "운영자본", label: "6개월 여유분")
                    budgetMini(icon: "flag.fill",         value: "오픈",    label: "목표 시점")
                }
                .padding(.top, 4)
            }
        }
    }

    private func budgetMini(icon: String, value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(BUColor.midnight)
            Text(value)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.midnightDeep)
            Text(label)
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
    }

    // MARK: - § 1 시작 자본금

    private var startupCapitalSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack {
                    BUEyebrow("시작 자본금")
                    Spacer()
                    Text(startupWon > 0 ? formatWon(startupWon) : "미입력")
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(startupWon > 0 ? BUColor.midnightDeep : BUColor.inkMuted)
                        .monospacedDigit()
                }

                Text("슬라이더로 대략적인 규모를 먼저 잡고, 아래에서 세밀하게 조정하세요.")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)

                Slider(
                    value: $startupSlider,
                    in: 1_000_000...300_000_000,
                    step: 1_000_000
                ) { _ in
                    startupWon = Int(startupSlider)
                    startupText = String(startupWon / 10_000)
                }
                .tint(BUColor.midnight)

                HStack {
                    Text("100만원")
                    Spacer()
                    Text("3억원")
                }
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)

                // 직접 입력
                HStack(spacing: BUSpacing.sm) {
                    TextField("예: 3000", text: $startupText)
                        .buTextFieldStyle()
                        .keyboardType(.numberPad)
                        .onChange(of: startupText) { _, v in
                            let n = Int(v) ?? 0
                            let won = max(1_000_000, min(300_000_000, n * 10_000))
                            startupWon = won
                            startupSlider = Double(won)
                        }
                    Text("만원")
                        .font(BUFont.body)
                        .foregroundStyle(BUColor.inkSecondary)
                }

                // 프리셋 chip 스크롤
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(startupPresets, id: \.0) { label, value in
                            BudgetChip(label: label, isSelected: abs(startupWon - value) < 500_000) {
                                startupWon = value
                                startupSlider = Double(value)
                                startupText = String(value / 10_000)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - § 2 운영자본금

    private var operatingCapitalSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack {
                    BUEyebrow("운영자본금 (별도)")
                    Spacer()
                    Text(operatingWon > 0 ? formatWon(operatingWon) : "미입력")
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(operatingWon > 0 ? BUColor.midnightDeep : BUColor.inkMuted)
                        .monospacedDigit()
                }

                Text("오픈 직후 매출이 비용을 덮기 전까지 월세·인건비·재료비로 쓸 현금입니다.")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)

                // 런웨이 건강도
                HStack(spacing: BUSpacing.sm) {
                    Circle()
                        .fill(ratioColor)
                        .frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(ratioLabel)
                            .font(BUFont.bodyCaption.weight(.semibold))
                            .foregroundStyle(ratioColor)
                        Text("권장: 월 예상 운영비 \(formatWon(monthlyEstimate)) × 3-6개월 = \(formatWon(monthlyEstimate * 3))~\(formatWon(monthlyEstimate * 6))")
                            .font(BUFont.eyebrow)
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
                .padding(10)
                .background(ratioColor.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                Slider(
                    value: $operatingSlider,
                    in: 0...200_000_000,
                    step: 500_000
                ) { _ in
                    operatingWon = Int(operatingSlider)
                    operatingText = String(operatingWon / 10_000)
                }
                .tint(ratioColor)

                HStack {
                    Text("0")
                    Spacer()
                    Text("2억원")
                }
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)

                HStack(spacing: BUSpacing.sm) {
                    TextField("예: 2400", text: $operatingText)
                        .buTextFieldStyle()
                        .keyboardType(.numberPad)
                        .onChange(of: operatingText) { _, v in
                            let n = Int(v) ?? 0
                            let won = max(0, min(200_000_000, n * 10_000))
                            operatingWon = won
                            operatingSlider = Double(won)
                        }
                    Text("만원")
                        .font(BUFont.body)
                        .foregroundStyle(BUColor.inkSecondary)
                }

                // 개월수 프리셋
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach([
                            ("3개월", monthlyEstimate * 3),
                            ("6개월", monthlyEstimate * 6),
                            ("1년",   monthlyEstimate * 12),
                        ], id: \.0) { label, value in
                            BudgetChip(label: "\(label) · \(formatWon(value))", isSelected: abs(operatingWon - value) < 500_000) {
                                operatingWon = value
                                operatingSlider = Double(value)
                                operatingText = String(value / 10_000)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - § 3 오픈 시점

    private var openDateSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("목표 오픈 시점")
                Text("로드맵 마감과 실행 속도를 이 일정에 맞춥니다.")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(openDatePresets, id: \.id) { preset in
                        DateChip(label: preset.labelKo, isSelected: openDateId == preset.id) {
                            openDateId = preset.id
                        }
                    }
                }
            }
        }
    }

    // MARK: - § 4 Wrapup

    private var wrapupSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("완료 체크리스트")
                BudgetCheckRow(label: "시작 자본금 설정",  done: startupWon > 0)
                BudgetCheckRow(label: "운영자본금 3개월+ 확보 계획", done: ratio >= 3)
                BudgetCheckRow(label: "목표 오픈 시점 설정", done: !openDateId.isEmpty)
                BudgetCheckRow(label: "예비비 10~15% 포함 확인", done: startupWon > 0)

                if isDone {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(BUColor.success)
                        Text("자본·일정 설정 완료!")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.success)
                    }
                    .padding(.top, 4)
                }
            }
        }
    }

    // MARK: - Helpers

    private func formatWon(_ won: Int) -> String {
        if won >= 100_000_000 {
            let eok = Double(won) / 100_000_000.0
            return eok == Double(Int(eok)) ? "\(Int(eok))억원" : String(format: "%.1f억원", eok)
        }
        return "\(won / 10_000)만원"
    }
}

// MARK: - Sub-views

private struct BudgetChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : BUColor.inkSecondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.07), in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct DateChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : BUColor.inkSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.07), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct BudgetCheckRow: View {
    let label: String
    let done: Bool
    var body: some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16))
                .foregroundStyle(done ? BUColor.success : BUColor.inkSubtle)
            Text(label)
                .font(BUFont.bodySmall)
                .foregroundStyle(done ? BUColor.ink : BUColor.inkMuted)
            Spacer()
        }
    }
}

// MARK: - TextField style

private extension View {
    func buTextFieldStyle() -> some View {
        self
            .font(BUFont.body)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BudgetSetup") {
    BudgetSetupStageView()
}

#Preview("BudgetSetup — Dark") {
    BudgetSetupStageView()
        .preferredColorScheme(.dark)
}
#endif
