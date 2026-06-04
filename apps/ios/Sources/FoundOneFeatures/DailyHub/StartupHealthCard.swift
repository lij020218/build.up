//
//  StartupHealthCard.swift — 스타트업 핵심 재무 지표 "점수판" (startup-tech 업종 핵심).
//
//  ── 왜 (2026-06-04) ───────────────────────────────────────────────
//  웹↔모바일 카드 종류 패리티 감사에서 "StartupHealth"가 iOS 누락(HIGH)으로 확인됨.
//  사장님 위임: "자료 조사로 더 좋은 방향으로".
//
//  ── 리서치 결론 (2025-2026 SaaS/시드 벤치마크) ─────────────────────
//  · 초기 스타트업($10M ARR 미만)에선 Rule of 40 은 변동성이 커 해석이 어려움 → 우선순위에서 내림.
//  · 시드 단계 우선 지표: 런웨이 · 월 순burn · 성장률(MoM) · ARR/직원 · 매출총이익률 · Burn Multiple.
//    (출처: Abacum 2026 Rule of 40 재정의, usehaven burn rate, upsilon SaaS investor metrics)
//
//  ── 정직성 원칙 ───────────────────────────────────────────────────
//  모든 값은 사장님 실데이터(매출·비용·현금·직원 수)에서 계산. 계산 불가하면 "—" 표시(가짜 금지).
//  특히 Burn Multiple 은 Net New ARR > 0 일 때만 계산(분모 음수/0 이면 "—").
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

/// 실데이터로 계산한 스타트업 지표. 계산 불가 항목은 nil → 카드가 "—" 로 정직하게 표시.
public struct StartupHealthMetrics: Sendable {
    public let runwayMonths: Double?      // 현금 ÷ 월 순burn
    public let netBurnMonthly: Double?    // 월 순burn (비용 − 매출). 음수면 흑자
    public let momGrowthPct: Double?      // 이번 달 vs 지난 달 매출 성장률
    public let arrPerEmployee: Double?    // (월매출×12) ÷ 직원 수
    public let grossMarginPct: Double?    // (매출 − COGS) ÷ 매출
    public let burnMultiple: Double?      // 월 순burn ÷ 월 Net New (ARR 증분). >0 일 때만

    public init(runwayMonths: Double?, netBurnMonthly: Double?, momGrowthPct: Double?,
                arrPerEmployee: Double?, grossMarginPct: Double?, burnMultiple: Double?) {
        self.runwayMonths = runwayMonths
        self.netBurnMonthly = netBurnMonthly
        self.momGrowthPct = momGrowthPct
        self.arrPerEmployee = arrPerEmployee
        self.grossMarginPct = grossMarginPct
        self.burnMultiple = burnMultiple
    }
}

public struct StartupHealthCard: View {
    let m: StartupHealthMetrics

    public init(metrics: StartupHealthMetrics) { self.m = metrics }

    private struct Tile: Identifiable {
        let id = UUID()
        let label: String
        let value: String
        let bench: String
        let grade: HealthGrade
    }

    private func won(_ v: Double) -> String {
        let man = v / 10_000
        if abs(man) >= 10_000 { return String(format: "%.1f억", man / 10_000) }
        return "\(Int(man).formatted())만"
    }

    private var tiles: [Tile] {
        var out: [Tile] = []
        // 런웨이 (18-24개월 안전)
        if let r = m.runwayMonths, r.isFinite {
            out.append(.init(label: "런웨이", value: String(format: "%.1f개월", r), bench: "안전 18-24개월",
                             grade: r < 6 ? .critical : r < 12 ? .warning : r < 18 ? .caution : .healthy))
        } else {
            out.append(.init(label: "런웨이", value: "—", bench: "현금·비용 입력 시", grade: .unknown))
        }
        // 월 순burn (음수=흑자 good)
        if let b = m.netBurnMonthly {
            out.append(.init(label: "월 순burn", value: b <= 0 ? "흑자" : won(b), bench: "낮을수록 좋음",
                             grade: b <= 0 ? .healthy : .caution))
        } else {
            out.append(.init(label: "월 순burn", value: "—", bench: "—", grade: .unknown))
        }
        // 성장률 MoM (YC 5-7%/주 ≈ 월 20%+)
        if let g = m.momGrowthPct {
            out.append(.init(label: "성장률(MoM)", value: String(format: "%@%.0f%%", g >= 0 ? "+" : "", g), bench: "시드 월 15%+",
                             grade: g >= 15 ? .healthy : g >= 0 ? .caution : .warning))
        } else {
            out.append(.init(label: "성장률(MoM)", value: "—", bench: "2개월+ 데이터", grade: .unknown))
        }
        // ARR/직원
        if let a = m.arrPerEmployee, a.isFinite, a > 0 {
            out.append(.init(label: "ARR/직원", value: won(a), bench: "높을수록 좋음", grade: .healthy))
        } else {
            out.append(.init(label: "ARR/직원", value: "—", bench: "직원 수 입력 시", grade: .unknown))
        }
        // 매출총이익률
        if let gm = m.grossMarginPct, gm.isFinite {
            out.append(.init(label: "매출총이익률", value: String(format: "%.0f%%", gm), bench: "SaaS 70%+",
                             grade: gm >= 70 ? .healthy : gm >= 50 ? .caution : .warning))
        } else {
            out.append(.init(label: "매출총이익률", value: "—", bench: "원가 입력 시", grade: .unknown))
        }
        // Burn Multiple (Net New ARR>0 일 때만)
        if let bm = m.burnMultiple, bm.isFinite {
            out.append(.init(label: "Burn Multiple", value: String(format: "%.1fx", bm), bench: "시드 <2x",
                             grade: bm < 1 ? .healthy : bm < 2 ? .caution : bm < 3 ? .warning : .critical))
        } else {
            out.append(.init(label: "Burn Multiple", value: "—", bench: "매출 성장 중일 때", grade: .unknown))
        }
        return out
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 11, style: .continuous)
                            .fill(LinearGradient(colors: [BUColor.midnight, BUColor.midnightDeep], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 36, height: 36)
                        Image(systemName: "waveform.path.ecg")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("스타트업 핵심 지표").buSectionEyebrowStyle()
                        Text("시드 단계 우선 지표 · 실데이터")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer(minLength: 0)
                }

                LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                    ForEach(tiles) { t in
                        let palette = HealthColors.palette(for: t.grade)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(t.label)
                                .font(.system(size: 10.5, weight: .semibold))
                                .foregroundStyle(BUColor.inkMuted)
                            Text(t.value)
                                .font(.system(size: 18, weight: .heavy))
                                .foregroundStyle(t.grade == .unknown ? BUColor.inkSubtle : palette.text)
                                .monospacedDigit()
                                .lineLimit(1)
                                .minimumScaleFactor(0.6)
                            Text(t.bench)
                                .font(.system(size: 9, weight: .medium))
                                .foregroundStyle(BUColor.inkSubtle)
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                }
            }
        }
    }
}
