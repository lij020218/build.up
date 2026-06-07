//
//  FitnessRetentionCard.swift — 피트니스 회원 Retention + 만료 임박
//
//  웹 SSOT 1:1 포팅: FitnessRetentionCard.tsx (dashboard/sections/)
//
//  FIA Retention Report: 신규 회원 50% 가 90일 내 이탈.
//  핵심 KPI = 30/60/90일 cohort 잔존율 + D-7 만료 임박.
//
//  데이터: BUMember (plan/fee/startDate/endDate 정합)
//  출처: Mindbody·MarianaTek·Glofox·WellnessLiving·FIA Retention Report (2026-05-13)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

// MARK: - Card

public struct FitnessRetentionCard: View {

    let members: [BUMember]

    public init(members: [BUMember]) {
        self.members = members
    }

    public var body: some View {
        if members.isEmpty {
            emptyState
        } else {
            filledCard
        }
    }

    // MARK: Empty state

    private var emptyState: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                cardHeader(activeCount: nil)
                Text("회원 데이터를 입력하면 만료 임박 + cohort 잔존율 분석이 시작됩니다 (내 가게 > 회원 관리)")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: Filled card

    private var filledCard: some View {
        let now = Date()
        let cohorts = members.asCohortMembers()
        let activeCount = CohortRetentionCalculator.activeMemberCount(members: cohorts, now: now)
        let d7Ids       = CohortRetentionCalculator.expiringMemberIds(members: cohorts, daysAhead: 7, now: now)
        let d30Ids      = CohortRetentionCalculator.expiringMemberIds(members: cohorts, daysAhead: 30, now: now)
        let expiringD7  = members.filter { d7Ids.contains($0.id) }
        let expiringD30 = members.filter { d30Ids.contains($0.id) && !d7Ids.contains($0.id) }
        let r30 = CohortRetentionCalculator.memberCohortRetention(members: cohorts, daysAgo: 30, windowDays: 7, now: now)
        let r60 = CohortRetentionCalculator.memberCohortRetention(members: cohorts, daysAgo: 60, windowDays: 7, now: now)
        let r90 = CohortRetentionCalculator.memberCohortRetention(members: cohorts, daysAgo: 90, windowDays: 7, now: now)
        let newLast30 = CohortRetentionCalculator.newMemberCount(members: cohorts, daysAgo: 30, now: now)
        let action = topAction(d7: expiringD7, r90: r90, r30: r30)

        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                cardHeader(activeCount: activeCount)

                // ① D-7 / D-30 stats
                HStack(spacing: 10) {
                    statTile(label: "D-7 만료 임박", value: "\(expiringD7.count)명",
                             tone: expiringD7.count >= 5 ? .critical : expiringD7.count >= 1 ? .caution : .healthy,
                             icon: "exclamationmark.triangle")
                    statTile(label: "D-30 만료 예정", value: "\(expiringD30.count)명",
                             tone: .unknown,
                             icon: "calendar")
                }

                // ② Cohort 잔존율
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.down.right")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("COHORT 잔존율 (FIA 기준 90일 50%)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                            .tracking(0.4)
                    }
                    HStack(spacing: 8) {
                        cohortBox(days: 30, cohort: r30, threshold: 70)
                        cohortBox(days: 60, cohort: r60, threshold: 60)
                        cohortBox(days: 90, cohort: r90, threshold: 50)
                    }
                }

                // ③ 행동
                if let act = action {
                    actionBlock(act)
                }

                footerLabel(newLast30: newLast30)
            }
        }
    }

    // MARK: Sub-views

    private func cardHeader(activeCount: Int?) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle().fill(BUColor.midnight.opacity(0.12)).frame(width: 36, height: 36)
                Image(systemName: "person.2")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("회원 RETENTION · 피트니스")
                    .buSectionEyebrowStyle()
                if let c = activeCount {
                    Text("활성 \(c)명")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            Spacer()
        }
    }

    private func statTile(label: String, value: String, tone: HealthGrade, icon: String) -> some View {
        let palette = HealthColors.palette(for: tone)
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(palette.dot)
                Text(label.uppercased())
                    .font(.system(size: 9.5, weight: .bold))
                    .foregroundStyle(palette.dot)
                    .tracking(0.3)
            }
            Text(value)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(palette.text)
                .monospacedDigit()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.dot.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(palette.dot.opacity(0.18), lineWidth: 1))
    }

    private func cohortBox(days: Int, cohort: CohortResult, threshold: Int) -> some View {
        let tone: HealthGrade = cohort.total < 3 ? .unknown
            : cohort.rate >= threshold ? .healthy
            : cohort.rate >= threshold - 15 ? .caution
            : .critical
        let palette = HealthColors.palette(for: tone)
        return VStack(spacing: 3) {
            Text("\(days)일")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.inkMuted)
                .tracking(0.3)
            Text(cohort.total >= 3 ? "\(cohort.rate)%" : "—")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(palette.text)
                .monospacedDigit()
            Text(cohort.total > 0 ? "\(cohort.stillActive)/\(cohort.total)" : "—")
                .font(.system(size: 10, weight: .regular))
                .foregroundStyle(BUColor.inkMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(BUColor.ink.opacity(0.02), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(BUColor.midnight.opacity(0.08), lineWidth: 1))
    }

    private func actionBlock(_ act: TopAction) -> some View {
        let palette = HealthColors.palette(for: act.grade)
        return VStack(alignment: .leading, spacing: 6) {
            Text("오늘 가장 중요한 행동")
                .font(.system(size: 10.5, weight: .bold))
                .foregroundStyle(palette.dot)
                .tracking(0.5)
            Text(act.headline)
                .font(.system(size: 13.5, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            Text(act.body)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.dot.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(palette.dot.opacity(0.18), lineWidth: 1))
    }

    private func footerLabel(newLast30: Int) -> some View {
        HStack(spacing: 4) {
            Image(systemName: "sparkles")
                .font(.system(size: 10, weight: .regular))
                .foregroundStyle(BUColor.midnight.opacity(0.5))
            Text("지난 30일 신규 \(newLast30)명 · Mindbody·MarianaTek·FIA Retention 표준 적용")
                .font(.system(size: 10.5, weight: .regular))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.ink.opacity(0.03), in: RoundedRectangle(cornerRadius: 8))
    }

    // MARK: Top Action logic (mirrors FitnessRetentionCard.tsx)

    private struct TopAction {
        let grade: HealthGrade
        let headline: String
        let body: String
    }

    private func topAction(d7: [BUMember], r90: CohortResult, r30: CohortResult) -> TopAction? {
        if d7.count >= 5 {
            return TopAction(
                grade: .critical,
                headline: "회원권 D-7 임박 \(d7.count)명 — 갱신 캠페인 필수",
                body: "오늘: ① 만료 임박 회원 명단 확인 ② 갱신 할인 (15–20% off) 카톡/문자 발송 ③ 트레이너 1:1 컨택"
            )
        } else if r90.total >= 3 && r90.rate < 50 {
            return TopAction(
                grade: .critical,
                headline: "90일 잔존율 \(r90.rate)% — FIA 기준 50% 미달",
                body: "이번 주: ① 90일 이탈자 5명 인터뷰 (이탈 사유) ② 30·60·90일 체크인 자동화 도입"
            )
        } else if !d7.isEmpty {
            return TopAction(
                grade: .caution,
                headline: "회원권 D-7 임박 \(d7.count)명",
                body: "오늘: 만료 임박 회원에게 갱신 안내 발송"
            )
        } else if r30.rate >= 70 && r30.total >= 5 {
            return TopAction(
                grade: .healthy,
                headline: "30일 잔존율 \(r30.rate)% — Mindbody 표준 상위",
                body: "이번 분기: 단골 추천 캠페인 (referral 인센티브)"
            )
        }
        return nil
    }
}

// MARK: - Preview

#if DEBUG
#Preview("FitnessRetention — 데이터 있음") {
    // 날짜: 2026-06-07 기준 고정값 사용 (D-5 만료 임박 시나리오)
    let members: [BUMember] = [
        BUMember(name: "김철수",  plan: "3개월",  fee: 90000,  startDate: "2026-03-12", endDate: "2026-06-12"),
        BUMember(name: "이영희",  plan: "1개월",  fee: 50000,  startDate: "2026-05-10", endDate: "2026-06-10"),
        BUMember(name: "박민준",  plan: "PT 20회", fee: 300000, startDate: "2026-04-07", endDate: "2026-07-07"),
        BUMember(name: "최지은",  plan: "6개월",  fee: 180000, startDate: "2026-03-06", endDate: "2026-06-05"),
    ]
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            FitnessRetentionCard(members: members)
                .padding(BUSpacing.md)
        }
    }
}
#endif
