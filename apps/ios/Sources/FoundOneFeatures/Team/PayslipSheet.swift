//
//  PayslipSheet.swift — 임금명세서 (2026-09-12).
//
//  왜: 근로기준법 §48② — 임금을 줄 때마다 명세서를 **교부할 의무**가 있다(2021-11-19 시행).
//   미교부·허위기재는 500만원 이하 과태료. 필수 기재사항은 아래 그대로:
//    · 근로자를 특정할 수 있는 정보 · 임금지급일 · 구성항목별 금액
//    · 출근일수·시간에 따라 달라지는 항목의 **계산방법** (연장·야간·휴일은 **시간 수** 포함)
//    · 공제 항목별 금액과 총액
//
//  계산은 BUPayroll(웹 SSOT 미러). 확정값과 추정값을 화면에서 구분해 보여준다.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

struct PayslipSheet: View {
    let memberName: String
    let period: String            // YYYY-MM
    let paydayLabel: String?      // "매월 10일" 등
    let result: BUPayrollResult
    /// 사업주 부담은 명세서 기재사항이 아니다 — 직원 화면에서는 숨긴다.
    var showsEmployerBurden: Bool = true

    @Environment(\.dismiss) private var dismiss
    @State private var showEmployerCost = false

    private func won(_ v: Int) -> String { "\(v.formatted())원" }

    var body: some View {
        NavigationStack {
            ZStack {
                BUCanvasBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.shellGap) {
                        header
                        violations
                        earningsSection
                        deductionsSection
                        netSection
                        employerSection
                        confidenceSection
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("임금명세서")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(item: plainText) { Image(systemName: "square.and.arrow.up") }
                        .accessibilityLabel("명세서 공유")
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnightInk)
                }
                #endif
            }
        }
    }

    // MARK: 머리말 — 근로자·기간·지급일 (필수 기재)

    private var header: some View {
        BUListSection("지급 대상") {
            BUListRow.value("성명", memberName)
            BUListRow.value("귀속 기간", periodLabel)
            if let paydayLabel {
                BUListRow.value("임금지급일", paydayLabel)
            }
            BUListRow.value("통상시급", won(result.ordinaryHourlyWage))
        }
    }

    private var periodLabel: String {
        let parts = period.split(separator: "-")
        guard parts.count == 2 else { return period }
        return "\(parts[0])년 \(Int(parts[1]) ?? 0)월"
    }

    // MARK: 위반·확인 경고 — 명세서보다 먼저 본다

    @ViewBuilder
    private var violations: some View {
        let v = result.warnings.filter { $0.level == .violation }
        let c = result.warnings.filter { $0.level == .check }
        if !v.isEmpty {
            BUListSection("바로잡아야 합니다") {
                v.map { w in
                    BUListRow.plain(w.message, subtitle: w.law)
                }
            }
        }
        if !c.isEmpty {
            BUListSection("확인할 것") {
                c.map { w in
                    BUListRow.plain(w.message, subtitle: w.law)
                }
            }
        }
    }

    // MARK: 지급 항목 — 계산방법·시간 수가 필수

    private var earningsSection: some View {
        BUListSection("지급") {
            result.earnings.map { item in
                BUListRow.value(item.label, won(item.amount), subtitle: methodLine(item))
            }
            BUListRow.value("지급 총액", won(result.grossPay))
        }
    }

    /// "10,320원 × 16시간 (주 4시간 × 개근 4주)" — 근기법 §48② 계산방법 기재.
    ///  계산방법에 이미 시간이 적혀 있으면 "시간 수"를 또 붙이지 않는다(같은 말 두 번 금지).
    private func methodLine(_ item: BUPayItem) -> String? {
        guard let m = item.method else { return nil }
        guard let h = item.hours, !m.contains("시간") else { return m }
        return "\(m) · 시간 수 \(h)시간"
    }

    // MARK: 공제 항목 — 항목별 금액 + 총액이 필수

    private var deductionsSection: some View {
        BUListSection("공제", footer: result.deductions.isEmpty ? "공제 항목이 없습니다." : nil) {
            result.deductions.map { item in
                BUListRow.value(item.label, won(item.amount), subtitle: item.method)
            }
            BUListRow.value("공제 총액", won(result.deductionTotal))
        }
    }

    private var netSection: some View {
        BUListSection("실지급액", footer: "이 금액을 직원에게 지급하고, 이 명세서를 함께 주세요(근로기준법 §48②).") {
            BUListRow.value("실지급액", won(result.netPay))
        }
    }

    // MARK: 사업주 부담 — 명세서에는 안 들어가지만 사장님이 알아야 하는 돈

    @ViewBuilder
    private var employerSection: some View {
        if showsEmployerBurden {
        BUListSection(
            "사업주 부담",
            actionLabel: showEmployerCost ? "접기" : "펼치기",
            action: { withAnimation(.snappy(duration: 0.2)) { showEmployerCost.toggle() } },
            footer: "명세서에는 들어가지 않습니다. 급여와 별도로 나가는 돈입니다."
        ) {
            if showEmployerCost {
                result.employerBurden.map { item in
                    BUListRow.value(item.label, won(item.amount), subtitle: item.method)
                }
            }
            BUListRow.value("사업주 부담 합계", won(result.employerBurdenTotal))
            BUListRow.value("이 직원 월 총비용", won(result.totalEmployerCost))
            if result.severanceReserve > 0 {
                BUListRow.value("퇴직급여 월 적립 권장", won(result.severanceReserve))
            }
        }
        }
    }

    // MARK: 정확도 — 무엇이 확정이고 무엇이 추정인지 숨기지 않는다

    private var confidenceSection: some View {
        BUListSection(
            "이 숫자의 근거",
            footer: "소득세는 국세청 홈택스의 근로소득 간이세액표가 법적 기준입니다. 확정 금액은 홈택스에서 조회해 주세요."
        ) {
            BUListRow.value("법정 계산식 그대로", "\(result.exactItems.count)개 항목",
                            subtitle: result.exactItems.joined(separator: " · "))
            result.estimatedItems.map { e in
                BUListRow.plain("추정 — \(e.item)", subtitle: e.why)
            }
        }
    }

    // MARK: 공유용 텍스트 — 카카오톡·문자로 그대로 보낼 수 있게

    private var plainText: String {
        var lines: [String] = []
        lines.append("임금명세서 — \(periodLabel)")
        lines.append("성명: \(memberName)")
        if let paydayLabel { lines.append("임금지급일: \(paydayLabel)") }
        lines.append("통상시급: \(won(result.ordinaryHourlyWage))")
        lines.append("")
        lines.append("[지급]")
        for e in result.earnings {
            var l = "· \(e.label) \(won(e.amount))"
            if let m = e.method { l += "\n   \(m)" }
            if let h = e.hours { l += " (시간 수 \(h)시간)" }
            lines.append(l)
        }
        lines.append("지급 총액 \(won(result.grossPay))")
        lines.append("")
        lines.append("[공제]")
        if result.deductions.isEmpty {
            lines.append("· 없음")
        } else {
            for d in result.deductions {
                lines.append("· \(d.label) \(won(d.amount))" + (d.method.map { "\n   \($0)" } ?? ""))
            }
        }
        lines.append("공제 총액 \(won(result.deductionTotal))")
        lines.append("")
        lines.append("실지급액 \(won(result.netPay))")
        lines.append("")
        lines.append("※ 소득세·지방소득세는 추정입니다. 확정 금액은 국세청 홈택스 근로소득 간이세액표를 확인하세요.")
        return lines.joined(separator: "\n")
    }
}
