//
//  FinanceView.swift — "재무" 탭 (2026-07-24 신설, 보고서와 완전 분리)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/FinanceSurface.tsx 미러.
//  ① 이번 달 손익분기 트래커 ② 생존 보드 + 13주 자금흐름 ③ 12개월 시뮬(What-If 레버 + FinanceSim)
//  ④ 매출 예측. 정직성: 투영은 "가정 유지 시 산술"(예측 아님), 데이터 없으면 잠금.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents

public struct FinanceView: View {

    let mock: MockData

    public init(mock: MockData) {
        self.mock = mock
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 0) {
                // 공통 페이지 헤더 (2026-08-19 통일)
                BUPageHeader(
                    title: "재무",
                    subtitle: "이번 달 손익분기 · 13주 자금흐름 · 12개월 시뮬레이션 — 모든 수치는 사장님 입력 데이터 기반"
                )
                VStack(spacing: BUSpacing.shellGap) {
                    bepTracker
                    financeCards
                    Color.clear.frame(height: 110)
                }
                .padding(.horizontal, BUSpacing.md)
            }
        }
        .background(BUBackgroundSurface())
    }

    // ── ① 이번 달 손익분기 트래커 (웹 BEP 트래커 미러) ──

    @ViewBuilder
    private var bepTracker: some View {
        // entries.date = ISO 문자열("yyyy-MM-dd") — 이번 달 접두사 필터 (웹 monthEntries 방식 미러)
        let monthPrefix: String = {
            let f = DateFormatter(); f.dateFormat = "yyyy-MM"; f.locale = Locale(identifier: "en_US_POSIX")
            return f.string(from: Date())
        }()
        let totalSales = mock.entries
            .filter { $0.date.hasPrefix(monthPrefix) }
            .reduce(0) { $0 + $1.sales }
        let bep = mock.costs.total
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 8) {
                if bep <= 0 {
                    Text("이번 달 손익분기")
                        .font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                        .textCase(.uppercase).kerning(0.6)
                    Text("월 비용(임대료·인건비 등)을 입력하면 손익분기 진행률이 계산돼요. — 내 가게 > 비용 관리")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    let pct = min(100, Int((totalSales / bep * 100).rounded()))
                    let over = totalSales >= bep
                    let cal = Calendar.current
                    let now = Date()
                    let range = cal.range(of: .day, in: .month, for: now)?.count ?? 30
                    let daysLeft = max(1, range - cal.component(.day, from: now))
                    let remaining = max(0, bep - totalSales)
                    let pace = remaining / Double(daysLeft)
                    HStack {
                        Text("이번 달 손익분기")
                            .font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                            .textCase(.uppercase).kerning(0.6)
                        Spacer()
                        Text("\(pct)%\(over ? " · 달성" : "")")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(over ? BUColor.success : BUColor.midnight)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(BUColor.midnight.opacity(0.08))
                            Capsule().fill(over ? BUColor.success : BUColor.midnight)
                                .frame(width: geo.size.width * CGFloat(pct) / 100)
                        }
                    }.frame(height: 8)
                    Text(over
                         ? "누적 매출이 이번 달 비용 합(\(Int(bep / 10_000).formatted())만원)을 넘었어요."
                         : "손익분기까지 \(Int(remaining / 10_000).formatted())만원 · 남은 \(daysLeft)일 기준 하루 \(Int(pace / 10_000).formatted())만원 페이스 필요")
                        .font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("기준 = 이번 달 비용 합계(사장님 입력). 원가는 판매 비례라 실제 분기점과 다를 수 있어요.")
                        .font(.system(size: 10)).foregroundStyle(BUColor.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    // ── ②③④ 생존 보드 · 13주 · 12개월 시뮬 · 매출 예측 ──

    @ViewBuilder
    private var financeCards: some View {
        let ratios = CostRatios.calculate(
            costs: mock.costs,
            totalRevenue: mock.entries.reduce(0) { $0 + $1.sales },
            days: mock.entries.count
        )
        let healthResult = HealthScore.calculate(
            entries: mock.entries, costs: mock.costs, category: mock.category,
            stage: mock.stage, currentCash: mock.currentCash
        )
        let weeklyBalances: [Double] = {
            guard let cash = mock.currentCash else { return [] }
            let weeklyNet = (ratios.monthlyRevenueEquivalent - mock.costs.total) / 4.33
            return (0..<13).map { week in cash + weeklyNet * Double(week) }
        }()
        let recent7: [Double] = Array(mock.entries.sorted { $0.date < $1.date }.suffix(7).map { $0.sales })
        let avgDaily = recent7.isEmpty ? 0 : recent7.reduce(0, +) / Double(recent7.count)
        let predicted7: [Double] = {
            guard !recent7.isEmpty else { return [] }
            let trend = recent7.last! / max(1, recent7.first!) - 1
            return (1...7).map { i in avgDaily * (1 + trend * Double(i) / 14) }
        }()

        SurvivalBoardCard(mock: mock, healthResult: healthResult)
        if !weeklyBalances.isEmpty {
            Cashflow13WeekCard(
                currentBalance: mock.currentCash ?? 0,
                weeklyBalances: weeklyBalances,
                isCrisis: weeklyBalances.contains(where: { $0 < 0 })
            )
        }
        WhatIfSimulator(
            baseSales: ratios.monthlyRevenueEquivalent,
            baseCosts: mock.costs.total,
            variableCosts: mock.costs.ingredients,
            startCash: mock.currentCash ?? 0,
            showProjection: true
        )
        if recent7.count >= 3 {
            ForecastCard(recent7: recent7, predicted7: predicted7, avgDailySales: avgDaily)
        }
    }
}
