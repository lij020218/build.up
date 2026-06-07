//
//  EducationEnrollmentCard.swift — 학원·교습소 재등록 + Cohort 잔존율
//
//  웹 SSOT 1:1 포팅: EducationEnrollmentCard.tsx (dashboard/sections/)
//
//  한국 학원 특수성:
//    D-14 강조 (학부모 결정 시간), 월 단위 cycle
//    잔존 임계: 30d=80%·60d=70%·90d=60%·1y=50% (Spider Strategies)
//
//  데이터: BUMember (plan/fee/startDate/endDate 정합)
//  출처: 학원조아·공선학관·Spider Strategies Education KPI·Brightwheel (2026-05-13)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

// MARK: - Card

public struct EducationEnrollmentCard: View {

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
                cardHeader(activeCount: nil, feesManwon: nil)
                Text("학생 데이터를 입력하면 재등록 D-14 + cohort 잔존율 분석이 시작됩니다 (내 가게 > 회원 관리)")
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
        let todayStr = isoToday(now)
        let cohorts  = members.asCohortMembers()
        let active   = members.filter { !$0.endDate.isEmpty && $0.endDate >= todayStr }

        let d14Ids = CohortRetentionCalculator.expiringMemberIds(members: cohorts, daysAhead: 14, now: now)
        let d30Ids = CohortRetentionCalculator.expiringMemberIds(members: cohorts, daysAhead: 30, now: now)
        let d14    = members.filter { d14Ids.contains($0.id) }
        let d30    = members.filter { d30Ids.contains($0.id) && !d14Ids.contains($0.id) }

        // 학원 cohort 윈도우 = ±14일 (학부모 결정 시간 표준)
        let r30  = CohortRetentionCalculator.memberCohortRetention(members: cohorts, daysAgo: 30,  windowDays: 14, now: now)
        let r60  = CohortRetentionCalculator.memberCohortRetention(members: cohorts, daysAgo: 60,  windowDays: 14, now: now)
        let r90  = CohortRetentionCalculator.memberCohortRetention(members: cohorts, daysAgo: 90,  windowDays: 14, now: now)
        let r365 = CohortRetentionCalculator.memberCohortRetention(members: cohorts, daysAgo: 365, windowDays: 14, now: now)

        let newLast30    = CohortRetentionCalculator.newMemberCount(members: cohorts, daysAgo: 30, now: now)
        let monthlyFees  = active.reduce(0.0) { $0 + $1.fee }
        let feesManwon   = Int(monthlyFees / 10000)
        let action       = topAction(d14: d14, r90: r90, r365: r365, newLast30: newLast30, activeCount: active.count)

        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                cardHeader(activeCount: active.count, feesManwon: feesManwon > 0 ? feesManwon : nil)

                // ① Stats row — D-14 / D-30 / 신규
                HStack(spacing: 8) {
                    statTile(label: "D-14 임박", value: "\(d14.count)명",
                             tone: d14.count >= 5 ? .critical : d14.count >= 1 ? .caution : .healthy,
                             icon: "exclamationmark.triangle")
                    statTile(label: "D-30 예정", value: "\(d30.count)명",
                             tone: .unknown,
                             icon: "calendar")
                    statTile(label: "30일 신규", value: "\(newLast30)명",
                             tone: newLast30 >= 3 ? .healthy : newLast30 >= 1 ? .unknown : .caution,
                             icon: "person.badge.plus")
                }

                // ② Cohort 잔존율 4칸 (한국 학원 long retention)
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.down.right")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("COHORT 잔존율 (한국 학원 90d=60% / 1y=50%)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                            .tracking(0.4)
                    }
                    HStack(spacing: 6) {
                        cohortBox(label: "30일", cohort: r30,  threshold: 80)
                        cohortBox(label: "60일", cohort: r60,  threshold: 70)
                        cohortBox(label: "90일", cohort: r90,  threshold: 60)
                        cohortBox(label: "1년",  cohort: r365, threshold: 50)
                    }
                }

                // ③ 행동
                if let act = action {
                    actionBlock(act)
                }

                footerLabel
            }
        }
    }

    // MARK: Sub-views

    private func cardHeader(activeCount: Int?, feesManwon: Int?) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle().fill(BUColor.midnight.opacity(0.12)).frame(width: 36, height: 36)
                Image(systemName: "graduationcap")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("재등록 + 학생 잔존 · 교육")
                    .buSectionEyebrowStyle()
                if let c = activeCount {
                    let feeStr = feesManwon.map { " · \($0.formatted())만원/월" } ?? ""
                    Text("\(c)명\(feeStr)")
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
                .font(.system(size: 19, weight: .bold))
                .foregroundStyle(palette.text)
                .monospacedDigit()
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.dot.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(palette.dot.opacity(0.18), lineWidth: 1))
    }

    private func cohortBox(label: String, cohort: CohortResult, threshold: Int) -> some View {
        let tone: HealthGrade = cohort.total < 3 ? .unknown
            : cohort.rate >= threshold ? .healthy
            : cohort.rate >= threshold - 15 ? .caution
            : .critical
        let palette = HealthColors.palette(for: tone)
        return VStack(spacing: 3) {
            Text(label)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.inkMuted)
                .tracking(0.3)
            Text(cohort.total >= 3 ? "\(cohort.rate)%" : "—")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(palette.text)
                .monospacedDigit()
            Text(cohort.total > 0 ? "\(cohort.stillActive)/\(cohort.total)" : "—")
                .font(.system(size: 9.5, weight: .regular))
                .foregroundStyle(BUColor.inkMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 9)
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

    private var footerLabel: some View {
        HStack(spacing: 4) {
            Image(systemName: "sparkles")
                .font(.system(size: 10, weight: .regular))
                .foregroundStyle(BUColor.midnight.opacity(0.5))
            Text("학원조아·공선학관·Spider Strategies Education KPI 표준 + 한국 학원 D-14 월단위 cycle")
                .font(.system(size: 10.5, weight: .regular))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.ink.opacity(0.03), in: RoundedRectangle(cornerRadius: 8))
    }

    // MARK: Top Action logic (mirrors EducationEnrollmentCard.tsx)

    private struct TopAction {
        let grade: HealthGrade
        let headline: String
        let body: String
    }

    private func topAction(d14: [BUMember], r90: CohortResult, r365: CohortResult, newLast30: Int, activeCount: Int) -> TopAction? {
        if d14.count >= 5 {
            return TopAction(
                grade: .critical,
                headline: "재등록 D-14 임박 \(d14.count)명 — 학부모 컨택 필수",
                body: "이번 주: ① 재등록 임박 학부모 전체 카톡/문자 발송 ② 1:1 면담 (장기 등록 할인·다과목 묶음) ③ 형제·자매 등록 인센티브"
            )
        } else if r90.total >= 3 && r90.rate < 60 {
            return TopAction(
                grade: .critical,
                headline: "90일 잔존율 \(r90.rate)% — 한국 학원 표준 60% 미달",
                body: "이번 주: ① 이탈 학생 학부모 5명 인터뷰 (사유 파악) ② 성적 향상 보고서 자동화 ③ 학원장 직접 상담 introduce"
            )
        } else if !d14.isEmpty {
            return TopAction(
                grade: .caution,
                headline: "재등록 D-14 임박 \(d14.count)명",
                body: "이번 주: 학부모 카톡 발송 + 1:1 상담 가능 시간 안내"
            )
        } else if r365.total >= 5 && r365.rate >= 60 {
            return TopAction(
                grade: .healthy,
                headline: "1년 잔존율 \(r365.rate)% — 한국 학원 상위 30%",
                body: "이번 분기: 입소문 referral 캠페인 (형제·자매·친구 등록 시 1개월 무료)"
            )
        } else if newLast30 < 2 && activeCount > 5 {
            return TopAction(
                grade: .caution,
                headline: "지난 30일 신규 \(newLast30)명 — 신규 유입 부족",
                body: "이번 달: ① 네이버 플레이스 리뷰 5개+ 확보 ② 시범 수업 1주 무료 캠페인"
            )
        }
        return nil
    }

    // MARK: Private helpers

    private func isoToday(_ date: Date) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate]
        return f.string(from: Calendar.current.startOfDay(for: date))
    }
}

// MARK: - Preview

#if DEBUG
#Preview("EducationEnrollment — 데이터 있음") {
    // 날짜: 2026-06-07 기준 고정값 (D-14 임박 시나리오)
    let members: [BUMember] = [
        BUMember(name: "김민서", plan: "수학",     fee: 350000, startDate: "2026-05-11", endDate: "2026-06-19"),
        BUMember(name: "이준호", plan: "영어+수학", fee: 600000, startDate: "2026-03-10", endDate: "2026-06-16"),
        BUMember(name: "박서연", plan: "과학",     fee: 280000, startDate: "2026-04-12", endDate: "2026-07-12"),
        BUMember(name: "최도현", plan: "국어",     fee: 320000, startDate: "2025-06-11", endDate: "2026-06-12"),
    ]
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            EducationEnrollmentCard(members: members)
                .padding(BUSpacing.md)
        }
    }
}
#endif
