//
//  CoachingHistoryCard.swift — 14일 코칭 누적 일지 (사장님 lock-in moat)
//
//  웹 SSOT 미러: apps/web/.../dashboard/CoachingHistoryCard.tsx
//  데이터: 웹과 동일 Supabase `coaching_history` 테이블 (CoachingHistoryStore).
//  매일 모닝 히어로 신호 1개 자동 기록 → 14일 누적 → 대응 패턴 가시화 + 전환비용.
//  (v1: 14일 타임라인 + 통계 + "했음" 토글. 30일 AI 메타 인사이트는 서버 뷰 연동 후속.)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct CoachingHistoryCard: View {

    @ObservedObject var store: CoachingHistoryStore

    public init(store: CoachingHistoryStore) {
        self.store = store
    }

    private var stats: CoachingStats { store.stats }
    private var entries: [CoachingEntry] { store.entries }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                if entries.isEmpty {
                    emptyBody
                } else {
                    statChips
                    timeline
                    footerNote
                }
            }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .fill(LinearGradient(colors: [BUColor.midnight, BUColor.midnightDeep], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 32, height: 32)
                Image(systemName: "clock.arrow.circlepath").font(.system(size: 14, weight: .bold)).foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("코칭 누적 일지 (14일)").buSectionEyebrowStyle()
                Text(entries.isEmpty
                     ? "매일 받는 신호와 대응을 누적합니다"
                     : "\(stats.totalDays)일 누적 · 액션 \(stats.takenRate)% · critical \(stats.criticalSignals)회")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }

    private var emptyBody: some View {
        Text("매일 「AI 운영 코치」 신호가 노출될 때 가장 중요한 신호 1개가 자동 기록됩니다. 14일 누적되면 사장님 의사결정 패턴이 보입니다.")
            .font(.system(size: 12.5, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12))
    }

    private var statChips: some View {
        HStack(spacing: 8) {
            chip(icon: "target", label: "기록", value: "\(stats.totalDays)일", color: BUColor.midnight)
            chip(icon: "checkmark.circle.fill", label: "액션", value: "\(stats.actionsTaken)회 (\(stats.takenRate)%)", color: BUColor.success)
            if stats.criticalSignals > 0 {
                chip(icon: "flame.fill", label: "위험", value: "\(stats.criticalSignals)회", color: BUColor.danger)
            }
            Spacer(minLength: 0)
        }
    }

    private func chip(icon: String, label: String, value: String, color: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 10, weight: .bold))
            Text(label).font(.system(size: 11, weight: .semibold)).opacity(0.8)
            Text(value).font(.system(size: 11.5, weight: .bold)).monospacedDigit()
        }
        .foregroundStyle(color)
        .padding(.horizontal, 9).padding(.vertical, 6)
        .background(color.opacity(0.10), in: Capsule())
    }

    private var timeline: some View {
        VStack(spacing: 8) {
            ForEach(entries.prefix(10)) { e in
                row(e)
            }
            if entries.count > 10 {
                Text("+\(entries.count - 10)일 더 (전체 14일)")
                    .font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                    .frame(maxWidth: .infinity).padding(.top, 2)
            }
        }
    }

    private func row(_ e: CoachingEntry) -> some View {
        let taken = e.responseTaken == true
        let kindColor = color(for: e.kind)
        return HStack(spacing: 12) {
            Button {
                Task { await store.markActionTaken(e, taken: !taken) }
            } label: {
                Image(systemName: taken ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(taken ? BUColor.success : BUColor.inkSubtle)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(formatDate(e.date)).font(.system(size: 10.5, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                    Text(e.kind.rawValue.uppercased())
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(kindColor)
                        .padding(.horizontal, 5).padding(.vertical, 1)
                        .background(kindColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                    Text(e.brief == .startup ? "스타트업" : "운영").font(.system(size: 10, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                }
                Text(e.headline)
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(taken ? BUColor.inkMuted : BUColor.ink)
                    .strikethrough(taken, color: BUColor.inkSubtle)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(taken ? BUColor.success.opacity(0.04) : BUColor.surface, in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(taken ? BUColor.success.opacity(0.18) : BUColor.inkSubtle.opacity(0.25), lineWidth: 1))
    }

    private var footerNote: some View {
        Text("30일 누적 시 AI 메타 인사이트(대응 패턴·요일 효과) 자동 활성화 — 서버 영구 보관")
            .font(.system(size: 10.5, weight: .medium)).foregroundStyle(BUColor.inkSubtle).lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.horizontal, 12).padding(.vertical, 9)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10))
    }

    /// 신호 종류별 색 — 심각도 의미색(코드베이스 기존 danger/success 사용). 일반 팔레트는 미드나잇.
    private func color(for kind: CoachingSignalKind) -> Color {
        switch kind {
        case .critical:  return BUColor.danger
        case .important: return BUColor.midnightDeep
        case .notable:   return BUColor.inkMuted
        case .good:      return BUColor.success
        }
    }

    /// "5/12 (월)"
    private func formatDate(_ date: String) -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = TimeZone(identifier: "Asia/Seoul")
        guard let d = f.date(from: date) else { return date }
        var cal = Calendar(identifier: .gregorian); cal.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        let m = cal.component(.month, from: d), day = cal.component(.day, from: d)
        let wd = ["일", "월", "화", "수", "목", "금", "토"][cal.component(.weekday, from: d) - 1]
        return "\(m)/\(day) (\(wd))"
    }
}
