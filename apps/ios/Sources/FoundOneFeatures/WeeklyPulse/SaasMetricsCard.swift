//
//  SaasMetricsCard.swift — SaaS 제품 사용자 지표 (스타트업 전용)
//
//  웹 SSOT 미러: useUnifiedSaasMetrics + DailyKpiStrip SaaS 셀.
//  데이터: 웹과 동일 Supabase saas_metrics_daily (GA4/웹훅은 웹에서 연동).
//
//  ⚠️ 가짜 숫자 금지: 연동 안 됐으면(데이터 0) 0/예시 숫자 대신 "연동 필요" 빈상태만 표시.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct SaasMetricsCard: View {

    @ObservedObject var store: SaasMetricsStore

    public init(store: SaasMetricsStore) {
        self.store = store
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                if store.isLoading && !store.isLoaded {
                    loadingRow
                } else if store.anyConnected {
                    metricsBody
                } else {
                    notConnectedBody
                }
            }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 11, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                Image(systemName: "person.3.sequence.fill").font(.system(size: 14, weight: .semibold)).foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("사용자 지표").buSectionEyebrowStyle()
                Text("제품 사용자 (자동 수집)").font(.system(size: 15, weight: .bold)).foregroundStyle(BUColor.ink)
            }
            Spacer(minLength: 0)
            if store.anyConnected, let src = store.latest?.source {
                Text(src.uppercased())
                    .font(.system(size: 9.5, weight: .heavy)).foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(BUColor.midnight08, in: Capsule())
            }
        }
    }

    private var loadingRow: some View {
        HStack(spacing: 8) {
            ProgressView().controlSize(.small)
            Text("불러오는 중…").font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 6)
    }

    // 미연동 — 정직한 빈상태 (가짜 숫자 0)
    private var notConnectedBody: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "link.badge.plus").font(.system(size: 16, weight: .semibold)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                VStack(alignment: .leading, spacing: 3) {
                    Text("사용자 지표 연동 필요").font(.system(size: 13.5, weight: .bold)).foregroundStyle(BUColor.ink)
                    Text("GA4 또는 웹훅을 웹 대시보드에서 연결하면 DAU·신규 가입·이탈이 매일 자동으로 표시됩니다. 앱은 연결된 데이터를 함께 봅니다.")
                        .font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            HStack(spacing: 6) {
                ForEach(["GA4", "웹훅", "Amplitude"], id: \.self) { ch in
                    Text(ch).font(.system(size: 10.5, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                        .padding(.horizontal, 9).padding(.vertical, 5)
                        .background(BUColor.midnight.opacity(0.04), in: Capsule())
                        .overlay(Capsule().strokeBorder(BUColor.inkSubtle.opacity(0.3), lineWidth: 1))
                }
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12))
    }

    // 연동됨 — 실데이터 타일 (nil 지표는 표시 안 함)
    private var metricsBody: some View {
        let latest = store.latest
        let tiles: [(String, String)] = {
            var t: [(String, String)] = []
            if let dau = latest?.activeUsers { t.append(("DAU", dau.formatted())) }
            if let avg = store.avg7DayDau { t.append(("7일 평균 DAU", avg.formatted())) }
            if let wau = latest?.weeklyActiveUsers { t.append(("WAU", wau.formatted())) }
            if let mau = latest?.monthlyActiveUsers { t.append(("MAU", mau.formatted())) }
            if let nu = store.totalNewUsers { t.append(("30일 신규", nu.formatted())) }
            if let cum = latest?.cumulativeUsers { t.append(("누적 사용자", cum.formatted())) }
            return t
        }()
        return VStack(alignment: .leading, spacing: 8) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(tiles, id: \.0) { label, value in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(label).font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.inkMuted).tracking(0.3).textCase(.uppercase)
                        Text(value).font(.system(size: 18, weight: .bold)).monospacedDigit().foregroundStyle(BUColor.midnightDeep)
                            .lineLimit(1).minimumScaleFactor(0.6)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 11).padding(.vertical, 10)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10))
                }
            }
            if let d = latest?.date {
                Text("최근 업데이트 \(d) · 출처 \(latest?.source ?? "-")")
                    .font(.system(size: 10, weight: .medium)).foregroundStyle(BUColor.inkSubtle)
            }
        }
    }
}
