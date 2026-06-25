//
//  BUHiringCalculator.swift — 채용 비용 시뮬레이터 (iOS).
//
//  웹 SSOT: apps/web/.../knowledge/HiringCostCalculator.tsx (hiring-setup interactive ref="hiringCalculator").
//  시급·주간 시간 → 주급·주휴수당·월 총지급 + 사업주 4대보험 포함 실부담. web↔iOS 동일.
//
//  4대보험 사업주 요율(2026): 국민연금 4.75% + 건강 3.595% + 장기요양 사업주분 0.4724%
//    + 산재(업종별 100%) + 고용 실업급여 사업주분 0.9% + 고용안정·직능 0.25%.
//  (요율 SSOT: 웹 finance/hiring-cost.ts + iOS IndustryCluster.accidentInsuranceRatePct)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore

public struct BUHiringCalculator: View {

    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var wageText = "\(10_320)"
    @State private var hoursText = "30"

    private let minWage = 10_320

    public init() {}

    private var wage: Int { Int(wageText) ?? minWage }
    private var hours: Double { Double(hoursText) ?? 30 }
    private var weeklyBase: Int { Int(hours) * wage }
    private var weeklyHoliday: Int { Int(hours) >= 15 ? wage * 8 : 0 }
    private var weeklyTotal: Int { weeklyBase + weeklyHoliday }
    private var monthlyTotal: Int { Int(Double(weeklyTotal) * 4.345) }

    private var employerInsurance: Int {
        let cluster = IndustryCluster.from(industryId: industryId)
        let accidentDec = cluster.accidentInsuranceRatePct / 100.0
        let totalRate = 0.0475 + 0.03595 + 0.004724 + accidentDec + 0.009 + 0.0025
        return Int(Double(monthlyTotal) * totalRate)
    }

    public var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("실제 사업주 부담 시뮬레이션")

                HStack(spacing: BUSpacing.md) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("시급 (원)").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("시급", text: $wageText).buHiringCalcFieldStyle().keyboardType(.numberPad)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("주간 시간").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("시간", text: $hoursText).buHiringCalcFieldStyle().keyboardType(.numberPad)
                    }
                }

                Divider()

                HStack {
                    resultRow(label: "주급 (기본)", value: weeklyBase)
                    Spacer()
                    resultRow(label: "주휴수당", value: weeklyHoliday)
                    Spacer()
                    resultRow(label: "월 총 지급", value: monthlyTotal, highlight: true)
                }

                HStack {
                    resultRow(label: "사업주 4대보험", value: employerInsurance)
                    Spacer()
                    resultRow(label: "실제 월 부담", value: monthlyTotal + employerInsurance, highlight: true)
                }

                if wage < minWage {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(BUColor.danger).font(.system(size: 12))
                        Text("최저임금 미달! 2026 최저시급 \(minWage.formatted())원 이상으로 수정하세요.")
                            .font(BUFont.eyebrow).foregroundStyle(BUColor.danger)
                    }
                }
            }
        }
    }

    private func resultRow(label: String, value: Int, highlight: Bool = false) -> some View {
        VStack(alignment: .center, spacing: 2) {
            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
            Text("\(value.formatted())원")
                .font(highlight ? BUFont.cardTitleSmall : BUFont.bodySmall)
                .foregroundStyle(highlight ? BUColor.midnight : BUColor.ink)
                .monospacedDigit()
        }
    }
}

private extension View {
    func buHiringCalcFieldStyle() -> some View {
        self.font(BUFont.body)
            .padding(.horizontal, 10).padding(.vertical, 8)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}
