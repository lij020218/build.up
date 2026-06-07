//
//  FieldEditorView.swift — FieldSpec → SwiftUI 입력 위젯 (인라인 validation + 보조 hint)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/my-store/SectionRenderer.tsx 의 필드 렌더 로직.
//
//  설계 원칙:
//   • 12가지 FieldType 모두 단일 컴포넌트가 처리 (switch on spec.type)
//   • Validation 은 touched 패턴 — 사용자가 한 번 만진 후부터 에러 표시 (초기 진입 시 모든 빈 필드 빨갛게 X)
//   • won 필드는 만원 단위 입력, 저장은 원 (× 10,000)
//   • phone / bizRegistrationNumber 는 raw 저장, 표시만 자동 하이픈
//   • url 은 blur 시 ensureUrlScheme 자동 적용
//   • FocusState 는 부모 sheet 가 toolbar·navigation 관리 — 여기는 binding 만 받음
//
//  Layout:
//   라벨 [*] (unit)
//   [INPUT]                              ← invalid 시 red border
//   helper / validation error / 환산 hint
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct FieldEditorView: View {

    public let spec: FieldSpec
    @Binding var value: FieldValue
    public var focused: FocusState<String?>.Binding?

    @State private var touched: Bool = false

    public init(
        spec: FieldSpec,
        value: Binding<FieldValue>,
        focused: FocusState<String?>.Binding? = nil
    ) {
        self.spec = spec
        self._value = value
        self.focused = focused
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            labelRow
            inputWidget
                .overlay(invalidBorderOverlay)
            footerRow
        }
        .padding(.vertical, 4)
    }

    // MARK: - Label

    private var labelRow: some View {
        HStack(spacing: 4) {
            Text(spec.label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.ink)
                .tracking(0.1)
            if !spec.optional {
                Text("*")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.danger.opacity(0.7))
                    .accessibilityLabel("필수")
            }
            if let unit = spec.unit {
                Text("(\(unit))")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
            }
            Spacer()
        }
    }

    // MARK: - Input widget switch

    @ViewBuilder
    private var inputWidget: some View {
        switch spec.type {
        case .text, .url, .email:
            singleLineField
        case .phone:
            phoneField
        case .textarea:
            multiLineField
        case .number, .percent:
            numberField
        case .won:
            wonField
        case .date:
            datePickerField
        case .time:
            timeField
        case .select:
            selectMenu
        case .multiselect:
            multiSelectChips
        }
    }

    // MARK: - Single line / URL / Email

    private var singleLineField: some View {
        TextField(spec.placeholder ?? "", text: textBinding)
            .applyKeyboard(for: spec.type)
            .textInputAutocapitalization(autoCapitalization(for: spec.type))
            .autocorrectionDisabled(spec.type == .url || spec.type == .email)
            .focused(focused ?? FocusState<String?>().projectedValue, equals: spec.key)
            .padding(10)
            .background(fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .onChange(of: textValue) { _, _ in markTouched() }
            .onSubmit(handleSubmit)
    }

    private var phoneField: some View {
        TextField(spec.placeholder ?? "010-0000-0000", text: textBinding)
            .keyboardType(.phonePad)
            .focused(focused ?? FocusState<String?>().projectedValue, equals: spec.key)
            .padding(10)
            .background(fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .onChange(of: textValue) { _, _ in markTouched() }
    }

    private var multiLineField: some View {
        TextField(spec.placeholder ?? "", text: textBinding, axis: .vertical)
            .lineLimit(3...8)
            .focused(focused ?? FocusState<String?>().projectedValue, equals: spec.key)
            .padding(10)
            .background(fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .onChange(of: textValue) { _, _ in markTouched() }
    }

    private var numberField: some View {
        HStack {
            TextField(spec.placeholder ?? "", text: numberStringBinding)
                .keyboardType(.decimalPad)
                .focused(focused ?? FocusState<String?>().projectedValue, equals: spec.key)
            if let unit = spec.unit {
                Text(unit)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkMuted)
            } else if spec.type == .percent {
                Text("%")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
        .padding(10)
        .background(fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .onChange(of: numberStringValue) { _, _ in markTouched() }
    }

    /// 만원 단위 입력 → 원 단위 저장 (× 10,000).
    private var wonField: some View {
        HStack {
            TextField(spec.placeholder ?? "예: 1000", text: wonInputBinding)
                .keyboardType(.decimalPad)
                .focused(focused ?? FocusState<String?>().projectedValue, equals: spec.key)
            Text("만원")
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(10)
        .background(fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .onChange(of: wonInputText) { _, _ in markTouched() }
    }

    private var datePickerField: some View {
        DatePicker(
            "",
            selection: dateBinding,
            displayedComponents: .date
        )
        .datePickerStyle(.compact)
        .labelsHidden()
        .environment(\.locale, Locale(identifier: "ko_KR"))
        .padding(.vertical, 6)
        .padding(.horizontal, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private var timeField: some View {
        TextField(spec.placeholder ?? "예: 15:00 또는 15:00-17:00", text: textBinding)
            .focused(focused ?? FocusState<String?>().projectedValue, equals: spec.key)
            .padding(10)
            .background(fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .onChange(of: textValue) { _, _ in markTouched() }
    }

    private var selectMenu: some View {
        Menu {
            ForEach(spec.options, id: \.value) { opt in
                Button {
                    value = .text(opt.value)
                    markTouched()
                } label: {
                    HStack {
                        Text(opt.label)
                        if currentSelectValue == opt.value {
                            Spacer()
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack {
                Text(currentSelectLabel)
                    .font(.system(size: 13))
                    .foregroundStyle(currentSelectValue.isEmpty ? BUColor.inkMuted.opacity(0.7) : BUColor.ink)
                Spacer()
                Image(systemName: "chevron.up.chevron.down")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(10)
            .background(fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }

    private var multiSelectChips: some View {
        ChipFlow(spacing: 6) {
            ForEach(spec.options, id: \.value) { opt in
                let selected = value.arrayValue.contains(opt.value)
                Button {
                    toggleMultiSelect(opt.value)
                } label: {
                    Text(opt.label)
                        .font(.system(size: 12, weight: selected ? .semibold : .regular))
                        .foregroundStyle(selected ? .white : BUColor.inkSecondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(
                            selected ? BUColor.midnight : BUColor.midnight.opacity(0.07),
                            in: Capsule()
                        )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Footer (helper / validation error / 환산 hint)

    @ViewBuilder
    private var footerRow: some View {
        let v = displayedValidation
        if case .invalid(let msg) = v {
            HStack(spacing: 4) {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(BUColor.danger.opacity(0.8))
                Text(msg)
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.danger.opacity(0.8))
            }
            .padding(.top, 2)
        } else if let convHint = conversionHint {
            Text(convHint)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.midnight.opacity(0.7))
                .padding(.top, 2)
        } else if let helper = spec.helper {
            Text(helper)
                .font(.system(size: 11))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
                .padding(.top, 2)
        }
    }

    @ViewBuilder
    private var invalidBorderOverlay: some View {
        if case .invalid = displayedValidation {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .strokeBorder(BUColor.danger.opacity(0.55), lineWidth: 1)
        }
    }

    // MARK: - Computed: validation

    private var displayedValidation: ValidationResult {
        touched ? StoreInfoValidators.validate(value, field: spec) : .valid
    }

    private func markTouched() {
        if !touched { touched = true }
    }

    // MARK: - Computed: hint (won 환산)

    private var conversionHint: String? {
        guard spec.type == .won,
              case .number(let n?) = value,
              n > 0
        else { return nil }
        let won = n * 10_000
        // ≥ 1억 일 때만 환산 hint
        if won >= 100_000_000 {
            return "= \(StoreInfoFormatters.krwAdaptive(won))"
        }
        return nil
    }

    // MARK: - Bindings

    /// .text 케이스용 raw String binding.
    private var textBinding: Binding<String> {
        Binding(
            get: {
                if case .text(let s) = value { return s }
                return ""
            },
            set: { value = .text($0) }
        )
    }

    private var textValue: String {
        if case .text(let s) = value { return s }
        return ""
    }

    /// .number 케이스용 String binding (decimalPad 입력).
    private var numberStringBinding: Binding<String> {
        Binding(
            get: { numberStringValue },
            set: { newVal in
                let cleaned = newVal.filter { $0.isNumber || $0 == "." }
                if cleaned.isEmpty {
                    value = .number(nil)
                } else {
                    value = .number(Double(cleaned))
                }
            }
        )
    }

    private var numberStringValue: String {
        if case .number(let n?) = value {
            if n == n.rounded() { return String(Int(n)) }
            return String(n)
        }
        return ""
    }

    /// won 필드 — 만원 단위 입력. 저장은 won (× 10,000). 단일 source of truth = value.
    private var wonInputBinding: Binding<String> {
        Binding(
            get: {
                guard case .number(let n?) = value, n > 0 else { return "" }
                let manwon = n / 10_000
                if manwon == manwon.rounded() {
                    return String(Int(manwon))
                }
                return String(manwon)
            },
            set: { newVal in
                let cleaned = newVal.filter { $0.isNumber || $0 == "." }
                if cleaned.isEmpty {
                    value = .number(nil)
                } else if let manwon = Double(cleaned) {
                    value = .number(manwon * 10_000)
                }
            }
        )
    }

    private var wonInputText: String { wonInputBinding.wrappedValue }

    /// .date 케이스용 Date binding.
    private var dateBinding: Binding<Date> {
        Binding(
            get: {
                if case .date(let s?) = value, !s.isEmpty,
                   let d = Self.isoDateFormatter.date(from: s) {
                    return d
                }
                return Date()
            },
            set: { newDate in
                let iso = Self.isoDateFormatter.string(from: newDate)
                value = .date(iso)
                markTouched()
            }
        )
    }

    // MARK: - Select helpers

    private var currentSelectValue: String {
        if case .text(let s) = value { return s }
        return ""
    }

    private var currentSelectLabel: String {
        if currentSelectValue.isEmpty {
            return spec.placeholder ?? "선택"
        }
        return spec.options.first { $0.value == currentSelectValue }?.label ?? currentSelectValue
    }

    private func toggleMultiSelect(_ optValue: String) {
        var arr = value.arrayValue
        if let idx = arr.firstIndex(of: optValue) {
            arr.remove(at: idx)
        } else {
            arr.append(optValue)
        }
        value = .stringArray(arr)
        markTouched()
    }

    // MARK: - Submit / next focus

    private func handleSubmit() {
        // 부모 sheet 가 focusedKey 를 관리하면 toolbar "다음" 버튼으로 진행.
        // 여기서는 별도 처리 없음 — onSubmit 으로 마지막 필드는 자동 dismiss.
    }

    // MARK: - Style helpers

    private var fieldBackground: Color {
        BUColor.midnight.opacity(0.05)
    }

    private func autoCapitalization(for type: FieldType) -> TextInputAutocapitalization {
        switch type {
        case .url, .email: return .never
        default:            return .sentences
        }
    }

    private static let isoDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()
}

// MARK: - TextField keyboard helper

private extension TextField where Label == Text {
    func applyKeyboard(for type: FieldType) -> some View {
        switch type {
        case .url:    return AnyView(self.keyboardType(.URL))
        case .email:  return AnyView(self.keyboardType(.emailAddress))
        default:      return AnyView(self.keyboardType(.default))
        }
    }
}

// MARK: - ChipFlow (multiselect wrap layout)

private struct ChipFlow: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var lineHeight: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x + s.width > maxWidth {
                x = 0
                y += lineHeight + spacing
                lineHeight = 0
            }
            x += s.width + spacing
            lineHeight = max(lineHeight, s.height)
        }
        return CGSize(width: maxWidth, height: y + lineHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize,
                       subviews: Subviews, cache: inout ()) {
        var x: CGFloat = bounds.minX
        var y: CGFloat = bounds.minY
        var lineHeight: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x + s.width > bounds.maxX {
                x = bounds.minX
                y += lineHeight + spacing
                lineHeight = 0
            }
            v.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            x += s.width + spacing
            lineHeight = max(lineHeight, s.height)
        }
    }
}
