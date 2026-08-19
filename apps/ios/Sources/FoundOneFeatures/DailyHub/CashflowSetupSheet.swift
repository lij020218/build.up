//
//  CashflowSetupSheet.swift — 현금흐름 설정 시트 (웹 CashflowSetupSheet.tsx 미러)
//
//  웹 SSOT: apps/web/app/lib/components/dashboard/CashflowSetupSheet.tsx
//
//  4 섹션 (웹 구조 그대로):
//   1. 현재 통장 잔고 (만원 입력 → 원 저장)
//   2. 판매 채널 비율 (12채널 토글 + 비율 + 정산주기·수수료 칩 + rateNote ⓘ + 업종 평균 적용)
//   3. 월 고정비 (목록 토글/삭제 + 신규 추가)
//   4. 알림 및 옵션 (위기경고·매일아침·VAT 적립 토글 + 위기감지기간 슬라이더)
//   + 현금흐름 모델 점검 (접기 — 반영/미반영 항목 투명 공개)
//
//  저장: working copy 편집 → "저장/설정 완료" 버튼 → CashflowStore.save.
//   · 첫 설정이면 setupCompletedAt = now ISO. 잔고 변경 시 currentBalanceUpdatedAt 갱신.
//   · canSave = 잔고 입력됨 && 활성 채널 비율 합 99~101%.
//
//  디자인: BUCard 섹션 카드, lavender-mist 배경 + 미드나잇 네이비 액센트 (신호등 컬러 금지 —
//          수수료/위기/검증만 danger·success 의미색 사용, 나머지는 midnight 계열).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - CashflowSetupSheet

public struct CashflowSetupSheet: View {

    @ObservedObject var store: CashflowStore
    let ko: Bool
    @Environment(\.dismiss) private var dismiss

    public init(store: CashflowStore, ko: Bool = true) {
        self.store = store
        self.ko = ko
    }

    // working copy (snapshot 패턴) — onAppear 에서 store.settings 로 초기화.
    @State private var balanceText: String = ""           // 만원 단위 입력
    @State private var channels: [CashflowSalesChannel] = []
    @State private var expenses: [CashflowFixedExpense] = []
    @State private var crisisThresholdDays: Double = 3
    @State private var notifyOnCrisis: Bool = true
    @State private var dailyMorningBriefing: Bool = true
    @State private var vatReserveEnabled: Bool = false
    @State private var loadedFromStore = false

    // 신규 고정비 입력 draft
    @State private var newExpenseLabel = ""
    @State private var newExpenseAmount = ""        // 만원
    @State private var newExpenseDay = "25"
    @State private var newExpenseCategory = "rent"

    @State private var auditOpen = false
    @State private var expandedRateNote: String?     // 툴팁 열린 채널 id

    @FocusState private var focused: Field?
    private enum Field: Hashable {
        case balance, ratio(String), newLabel, newAmount, newDay
    }

    // 웹 allChannelIds 순서 그대로 (12채널 고정 노출).
    private let allChannelIds = [
        "cash", "card", "baemin", "coupangeats", "yogiyo", "ttanggyeoyo",
        "naverpay", "kakaopay", "naverbooking", "smartstore", "coupangwing", "other",
    ]

    public var body: some View {
        NavigationStack {
            ZStack {
                BUFlatBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        balanceSection
                        channelsSection
                        expensesSection
                        optionsSection
                        auditSection
                        disclaimer
                        Color.clear.frame(height: 32)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle(isFirstSetup ? "2분 빠른 설정" : "현금흐름 설정")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소") { dismiss() }
                        .foregroundStyle(BUColor.inkSecondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isFirstSetup ? "설정 완료" : "저장") { saveAndClose() }
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(canSave ? BUColor.midnight : BUColor.inkSubtle)
                        .disabled(!canSave)
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("완료") { focused = nil }
                        .foregroundStyle(BUColor.midnight)
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .interactiveDismissDisabled(hasChanges)
        .onAppear(perform: hydrateOnce)
    }

    // MARK: - Hydrate working copy

    private func hydrateOnce() {
        guard !loadedFromStore else { return }
        let s = store.settings
        balanceText = s.currentBalance > 0 ? String(Int((s.currentBalance / 10_000).rounded())) : ""
        channels = s.salesChannels
        expenses = s.fixedExpenses
        crisisThresholdDays = Double(s.crisisThresholdDays)
        notifyOnCrisis = s.notifyOnCrisis
        dailyMorningBriefing = s.dailyMorningBriefing
        vatReserveEnabled = s.vatReserveEnabled
        loadedFromStore = true
    }

    private var isFirstSetup: Bool { store.settings.setupCompletedAt == nil }

    // MARK: - 1. 통장 잔고

    private var balanceSection: some View {
        SetupSection(num: 1, icon: "wonsign.circle", title: "현재 통장 잔고",
                     desc: "사업 계좌에 있는 실제 가용 현금이에요. 만원 단위로 입력해 주세요.") {
            HStack(spacing: 8) {
                TextField("예: 300", text: $balanceText)
                    .keyboardType(.numberPad)
                    .focused($focused, equals: .balance)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .monospacedDigit()
                    .onChange(of: balanceText) { _, v in
                        balanceText = v.filter(\.isNumber)
                    }
                    .padding(.horizontal, 14).padding(.vertical, 12)
                    .background(Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                            .strokeBorder(focused == .balance ? BUColor.midnight.opacity(0.4) : BUColor.cardBorder, lineWidth: 1)
                    )
                Text("만원")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            if let won = parsedBalanceWon, won > 0 {
                Text("= \(won.formatted())원")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                    .padding(.top, 6)
            }
        }
    }

    // MARK: - 2. 판매 채널 비율

    private var channelsSection: some View {
        SetupSection(num: 2, icon: "chart.pie", title: "판매 채널 비율",
                     desc: "매출이 들어오는 경로를 비율로 입력하세요. 배민·쿠팡이츠는 정산이 늦고 수수료가 높아 현금흐름에 큰 영향을 줍니다.",
                     rightSlot: { sumBadge }) {
            VStack(spacing: 6) {
                ForEach(allChannelIds, id: \.self) { id in
                    if let preset = CashflowPresetsRegistry.preset(id) {
                        channelRow(id: id, preset: preset)
                    }
                }
            }
            if !channelRatioValid {
                Text("채널 비율 합계는 100%가 되어야 해요. 현재 \(Int(channelSum.rounded()))%")
                    .font(.system(size: 11.5, weight: .semibold))
                    .foregroundStyle(BUColor.danger)
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.danger08, in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous))
                    .padding(.top, 4)
            }
        }
    }

    private var sumBadge: some View {
        let ok = channelRatioValid
        return HStack(spacing: 4) {
            Image(systemName: ok ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .font(.system(size: 10, weight: .bold))
            Text("합계 \(Int(channelSum.rounded()))%")
                .font(.system(size: 11, weight: .bold))
                .monospacedDigit()
        }
        .foregroundStyle(ok ? BUColor.success : BUColor.danger)
        .padding(.horizontal, 9).padding(.vertical, 4)
        .background((ok ? BUColor.success : BUColor.danger).opacity(0.10), in: Capsule())
    }

    @ViewBuilder
    private func channelRow(id: String, preset: BUCashflowChannelPreset) -> some View {
        let isActive = channels.first(where: { $0.id == id })?.isActive ?? false
        let totalFee = preset.commissionRate + preset.paymentFeeRate
        let hasNote = preset.rateNoteKo != nil

        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 10) {
                Button { toggleChannel(id, preset: preset) } label: {
                    Image(systemName: isActive ? "checkmark.square.fill" : "square")
                        .font(.system(size: 18, weight: .regular))
                        .foregroundStyle(isActive ? BUColor.midnight : BUColor.inkSubtle)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isActive ? "\(ko ? preset.labelKo : preset.labelEn) 선택됨" : "\(ko ? preset.labelKo : preset.labelEn) 선택 안됨")

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 5) {
                        Text(ko ? preset.labelKo : preset.labelEn)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(BUColor.ink)
                        if hasNote {
                            Button {
                                expandedRateNote = (expandedRateNote == id) ? nil : id
                            } label: {
                                Image(systemName: "info.circle")
                                    .font(.system(size: 11, weight: .regular))
                                    .foregroundStyle(BUColor.midnight.opacity(0.6))
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("수수료 안내")
                        }
                    }
                    HStack(spacing: 4) {
                        DetailPill(text: "D+\(preset.settlementDays)", danger: false)
                        if totalFee > 0 {
                            DetailPill(text: "수수료 \(String(format: "%.1f", totalFee))%", danger: true)
                        }
                    }
                }
                Spacer(minLength: 0)
                if isActive {
                    HStack(spacing: 3) {
                        TextField("0", text: ratioBinding(id))
                            .keyboardType(.numberPad)
                            .focused($focused, equals: .ratio(id))
                            .multilineTextAlignment(.center)
                            .font(.system(size: 13, weight: .bold))
                            .monospacedDigit()
                            .foregroundStyle(BUColor.ink)
                            .frame(width: 44)
                            .padding(.vertical, 5)
                            .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .strokeBorder(focused == .ratio(id) ? BUColor.midnight.opacity(0.4) : BUColor.cardBorder, lineWidth: 1)
                            )
                        Text("%")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
            }
            if expandedRateNote == id, let note = ko ? preset.rateNoteKo : preset.rateNoteEn {
                Text(note)
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 8)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 11)
        .background(
            (isActive ? BUColor.midnight.opacity(0.05) : Color.white.opacity(0.5)),
            in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                .strokeBorder(isActive ? BUColor.midnight.opacity(0.18) : BUColor.borderSubtle, lineWidth: 1)
        )
    }

    // MARK: - 3. 월 고정비

    private var expensesSection: some View {
        SetupSection(num: 3, icon: "calendar", title: "월 고정비",
                     desc: "월세·급여·대출 이자 등 매월 정해진 날 나가는 돈을 등록하세요.",
                     rightSlot: { expenseTotalPill }) {
            if !expenses.isEmpty {
                VStack(spacing: 6) {
                    ForEach(expenses) { e in
                        expenseRow(e)
                    }
                }
                .padding(.bottom, 4)
            }
            addExpenseCard
        }
    }

    @ViewBuilder
    private var expenseTotalPill: some View {
        let total = expenses.filter(\.isActive).reduce(0.0) { $0 + $1.amount }
        if total > 0 {
            Text("월 합계 \(Int((total / 10_000).rounded()).formatted())만원")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(BUColor.midnight)
                .monospacedDigit()
                .padding(.horizontal, 9).padding(.vertical, 4)
                .background(BUColor.midnight08, in: Capsule())
        }
    }

    private func expenseRow(_ e: CashflowFixedExpense) -> some View {
        HStack(spacing: 10) {
            Button {
                if let idx = expenses.firstIndex(where: { $0.id == e.id }) {
                    expenses[idx].isActive.toggle()
                }
            } label: {
                Image(systemName: e.isActive ? "checkmark.square.fill" : "square")
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(e.isActive ? BUColor.midnight : BUColor.inkSubtle)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(e.isActive ? "\(e.label) 활성" : "\(e.label) 비활성")

            VStack(alignment: .leading, spacing: 1) {
                Text(e.label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Text("매월 \(e.dayOfMonth)일 · \(categoryLabel(e.category))")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            Spacer(minLength: 0)
            Text("\(Int((e.amount / 10_000).rounded()).formatted())만원")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(BUColor.danger)
                .monospacedDigit()
            Button {
                expenses.removeAll { $0.id == e.id }
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(BUColor.danger)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(e.label) 삭제")
        }
        .opacity(e.isActive ? 1 : 0.45)
        .padding(.horizontal, 14).padding(.vertical, 11)
        .background(Color.white.opacity(0.5), in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                .strokeBorder(BUColor.borderSubtle, lineWidth: 1)
        )
    }

    private var addExpenseCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("새 고정비 추가")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(BUColor.midnight)

            TextField("이름 (예: 월세)", text: $newExpenseLabel)
                .focused($focused, equals: .newLabel)
                .font(.system(size: 13))
                .padding(.horizontal, 12).padding(.vertical, 9)
                .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))

            HStack(spacing: 6) {
                TextField("만원", text: $newExpenseAmount)
                    .keyboardType(.numberPad)
                    .focused($focused, equals: .newAmount)
                    .font(.system(size: 13))
                    .monospacedDigit()
                    .onChange(of: newExpenseAmount) { _, v in newExpenseAmount = v.filter(\.isNumber) }
                    .padding(.horizontal, 12).padding(.vertical, 9)
                    .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))

                TextField("일", text: $newExpenseDay)
                    .keyboardType(.numberPad)
                    .focused($focused, equals: .newDay)
                    .font(.system(size: 13))
                    .monospacedDigit()
                    .onChange(of: newExpenseDay) { _, v in newExpenseDay = v.filter(\.isNumber) }
                    .frame(width: 56)
                    .padding(.horizontal, 12).padding(.vertical, 9)
                    .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))

                Menu {
                    ForEach(expenseCategories, id: \.0) { key, label in
                        Button(label) { newExpenseCategory = key }
                    }
                } label: {
                    HStack(spacing: 3) {
                        Text(categoryLabel(newExpenseCategory))
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(BUColor.ink)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 9)
                    .frame(maxWidth: .infinity)
                    .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
                }
            }

            Button(action: addExpense) {
                HStack(spacing: 5) {
                    Image(systemName: "plus")
                        .font(.system(size: 13, weight: .bold))
                    Text("추가")
                        .font(.system(size: 13, weight: .bold))
                }
                .foregroundStyle(canAddExpense ? .white : BUColor.inkSubtle)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(
                    canAddExpense ? AnyShapeStyle(LinearGradient(colors: [BUColor.midnight, BUColor.midnightDeep], startPoint: .leading, endPoint: .trailing))
                                  : AnyShapeStyle(BUColor.midnight08),
                    in: RoundedRectangle(cornerRadius: BURadius.button, style: .continuous)
                )
            }
            .buttonStyle(.plain)
            .disabled(!canAddExpense)
        }
        .padding(14)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
                .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [4, 3]))
                .foregroundStyle(BUColor.midnight.opacity(0.22))
        )
    }

    // MARK: - 4. 알림 및 옵션

    private var optionsSection: some View {
        SetupSection(num: 4, icon: "bell.badge", title: "알림 및 옵션",
                     desc: "위기 감지 기간과 부가세 적립 등 운영 옵션이에요.") {
            VStack(spacing: 8) {
                ToggleRow(label: "위기 경고",
                          desc: "\(Int(crisisThresholdDays))일 내 잔고가 마이너스로 갈 때 알림",
                          isOn: $notifyOnCrisis)
                ToggleRow(label: "매일 아침 요약",
                          desc: "오전 8~11시 어제 매출 + 오늘 잔고 요약 알림",
                          isOn: $dailyMorningBriefing)
                ToggleRow(label: "부가세 적립",
                          desc: "입금액의 일부를 세금으로 미리 빼고 예측해요. 적립률은 ‘내 가게 → 세무 설정’의 과세 유형을 따릅니다.",
                          isOn: $vatReserveEnabled)
                crisisSlider
            }
        }
    }

    private var crisisSlider: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("위기 감지 기간")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Spacer()
                Text("\(Int(crisisThresholdDays))일")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                    .monospacedDigit()
            }
            Slider(value: $crisisThresholdDays, in: 1...14, step: 1)
                .tint(BUColor.midnight)
            Text("이 기간 내 통장 마이너스 가능성이 있으면 경고해요.")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.5), in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                .strokeBorder(BUColor.borderSubtle, lineWidth: 1)
        )
    }

    // MARK: - Audit (접기)

    private var auditSection: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: auditOpen ? 12 : 0) {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { auditOpen.toggle() }
                } label: {
                    HStack {
                        Text("📐 이 현금흐름 모델은 무엇을 반영하나요?")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(BUColor.ink)
                            .multilineTextAlignment(.leading)
                        Spacer(minLength: 8)
                        Image(systemName: auditOpen ? "chevron.up" : "chevron.down")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
                .buttonStyle(.plain)

                if auditOpen {
                    auditBlock(title: "✓ 현재 반영되는 것", tint: BUColor.success, items: [
                        "통장 잔고 (수동 입력 또는 연동)",
                        "채널별 정산주기 (D+0~D+15)와 수수료",
                        "월 고정비 캘린더 (월세·급여·대출·공과금)",
                        "부가세 적립 (과세 유형 반영)",
                        "위기 감지 (잔고 < 0 도달 일수)",
                    ])
                    auditBlock(title: "⚠ 아직 반영되지 않은 실무 개념", tint: BUColor.warn, items: [
                        "외상 매입(AP) 결제일 — 공급처 결제일은 고정비로 직접 추가",
                        "비상금 — 월 운영비 1~3개월치 권장",
                        "기타 세금 — 종합소득세·법인세는 고정비 캘린더에 등록",
                    ])
                }
            }
        }
    }

    private func auditBlock(title: String, tint: Color, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(tint)
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: 6) {
                    Circle().fill(tint.opacity(0.5)).frame(width: 4, height: 4).padding(.top, 6)
                    Text(item)
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var disclaimer: some View {
        Text("ⓘ 입력한 정보는 계정에 안전하게 저장되며 웹·다른 기기에서도 동일하게 보입니다.")
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(BUColor.inkMuted)
            .lineSpacing(2)
            .padding(.horizontal, 4)
    }

    // MARK: - Derived

    private var parsedBalanceWon: Int? {
        guard let manwon = Int(balanceText) else { return nil }
        return manwon * 10_000
    }

    private var channelSum: Double {
        channels.filter(\.isActive).reduce(0) { $0 + $1.salesRatio }
    }

    private var channelRatioValid: Bool { channelSum >= 99 && channelSum <= 101 }

    private var canSave: Bool { (parsedBalanceWon ?? 0) > 0 && channelRatioValid }

    private var canAddExpense: Bool {
        !newExpenseLabel.trimmingCharacters(in: .whitespaces).isEmpty
            && (Int(newExpenseAmount) ?? 0) > 0
    }

    private var hasChanges: Bool {
        guard loadedFromStore else { return false }
        let s = store.settings
        if channels != s.salesChannels { return true }
        if expenses != s.fixedExpenses { return true }
        if Int(crisisThresholdDays) != s.crisisThresholdDays { return true }
        if notifyOnCrisis != s.notifyOnCrisis { return true }
        if dailyMorningBriefing != s.dailyMorningBriefing { return true }
        if vatReserveEnabled != s.vatReserveEnabled { return true }
        if (parsedBalanceWon ?? 0) != Int(s.currentBalance) { return true }
        return false
    }

    // MARK: - Bindings & mutations

    private func ratioBinding(_ id: String) -> Binding<String> {
        Binding(
            get: {
                let r = channels.first(where: { $0.id == id })?.salesRatio ?? 0
                return r > 0 ? String(Int(r)) : ""
            },
            set: { newValue in
                let v = min(100, max(0, Int(newValue.filter(\.isNumber)) ?? 0))
                if let idx = channels.firstIndex(where: { $0.id == id }) {
                    channels[idx].salesRatio = Double(v)
                }
            }
        )
    }

    private func toggleChannel(_ id: String, preset: BUCashflowChannelPreset) {
        if let idx = channels.firstIndex(where: { $0.id == id }) {
            channels[idx].isActive.toggle()
        } else {
            // working 에 없던 채널 — 프리셋으로 신규 생성 후 활성.
            channels.append(CashflowSalesChannel(
                id: preset.id,
                label: BULocalizedText(ko: preset.labelKo, en: preset.labelEn),
                salesRatio: 0,
                settlementDays: preset.settlementDays,
                commissionRate: preset.commissionRate,
                paymentFeeRate: preset.paymentFeeRate,
                isActive: true,
                rateNote: (preset.rateNoteKo != nil && preset.rateNoteEn != nil)
                    ? BULocalizedText(ko: preset.rateNoteKo!, en: preset.rateNoteEn!) : nil
            ))
        }
    }

    private func addExpense() {
        guard canAddExpense else { return }
        let amount = (Int(newExpenseAmount) ?? 0) * 10_000
        let day = min(31, max(1, Int(newExpenseDay) ?? 25))
        expenses.append(CashflowFixedExpense(
            id: "exp-\(UUID().uuidString.prefix(8))",
            label: newExpenseLabel.trimmingCharacters(in: .whitespaces),
            amount: Double(amount),
            dayOfMonth: day,
            category: newExpenseCategory,
            isActive: true
        ))
        newExpenseLabel = ""; newExpenseAmount = ""; newExpenseDay = "25"; newExpenseCategory = "rent"
        focused = nil
    }

    private func saveAndClose() {
        guard canSave else { return }
        let now = ISO8601DateFormatter().string(from: Date())
        let prev = store.settings
        let newBalance = Double(parsedBalanceWon ?? 0)
        let balanceChanged = Int(newBalance) != Int(prev.currentBalance)

        var s = prev
        s.currentBalance = newBalance
        if balanceChanged { s.currentBalanceUpdatedAt = now }
        s.salesChannels = channels
        s.fixedExpenses = expenses
        s.crisisThresholdDays = min(14, max(1, Int(crisisThresholdDays)))
        s.notifyOnCrisis = notifyOnCrisis
        s.dailyMorningBriefing = dailyMorningBriefing
        s.vatReserveEnabled = vatReserveEnabled
        if s.setupCompletedAt == nil { s.setupCompletedAt = now }

        Task {
            await store.save(s)
            dismiss()
        }
    }

    // MARK: - Category labels (웹 CATEGORY_LABEL 미러)

    private let expenseCategories: [(String, String)] = [
        ("rent", "월세"), ("payroll", "급여"), ("loan", "대출 이자"),
        ("utilities", "공과금"), ("supplies", "정기 재료비"), ("insurance", "보험"),
        ("subscription", "구독료"), ("other", "기타"),
    ]

    private func categoryLabel(_ key: String) -> String {
        expenseCategories.first { $0.0 == key }?.1 ?? "기타"
    }
}

// MARK: - SetupSection (번호 배지 + 아이콘 + 제목 + 설명 + 우측 슬롯)

private struct SetupSection<RightSlot: View, Content: View>: View {
    let num: Int
    let icon: String
    let title: String
    let desc: String
    let rightSlot: RightSlot
    let content: Content

    init(num: Int, icon: String, title: String, desc: String,
         @ViewBuilder rightSlot: () -> RightSlot = { EmptyView() },
         @ViewBuilder content: () -> Content) {
        self.num = num; self.icon = icon; self.title = title; self.desc = desc
        self.rightSlot = rightSlot(); self.content = content()
    }

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Text("\(num)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 22, height: 22)
                        .background(
                            LinearGradient(colors: [BUColor.midnight, BUColor.midnightDeep], startPoint: .topLeading, endPoint: .bottomTrailing),
                            in: RoundedRectangle(cornerRadius: 7, style: .continuous)
                        )
                    Image(systemName: icon)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(BUColor.midnight)
                    Text(title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                    Spacer(minLength: 4)
                    rightSlot
                }
                Text(desc)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                content
            }
        }
    }
}

// MARK: - DetailPill (정산주기 / 수수료 칩)

private struct DetailPill: View {
    let text: String
    let danger: Bool
    var body: some View {
        Text(text)
            .font(.system(size: 9.5, weight: .bold))
            .monospacedDigit()
            .foregroundStyle(danger ? BUColor.danger : BUColor.inkMuted)
            .padding(.horizontal, 7).padding(.vertical, 2)
            .background((danger ? BUColor.danger.opacity(0.07) : BUColor.midnight.opacity(0.05)), in: Capsule())
    }
}

// MARK: - ToggleRow

private struct ToggleRow: View {
    let label: String
    let desc: String
    @Binding var isOn: Bool

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Text(desc)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 8)
            Toggle("", isOn: $isOn)
                .labelsHidden()
                .tint(BUColor.midnight)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(Color.white.opacity(0.5), in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                .strokeBorder(BUColor.borderSubtle, lineWidth: 1)
        )
    }
}

// MARK: - Preview

#if DEBUG
#Preview("CashflowSetup — 첫 설정") {
    CashflowSetupSheet(
        store: CashflowStore(repository: nil, defaultCategoryKey: "food")
    )
}
#endif
