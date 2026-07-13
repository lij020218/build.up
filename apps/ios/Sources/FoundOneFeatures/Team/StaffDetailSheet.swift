//
//  StaffDetailSheet.swift — 직원 상세 시트 (사장 전용, 2026-07-13)
//
//  웹 SSOT 미러: apps/web/app/lib/components/surfaces/StaffDetailModal.tsx
//    ① 프로필 — 이름·역할·근속·입사일
//    ② 급여 — 시급(사장 편집) → 주 근무시간(근무표)·주휴수당(15h↑)·예상 월급(×4.345)
//    ③ 이번 달 근태 — 출근 일수·총 근무시간 + 최근 5건
//    ④ 연차 요약
//  정직성: 시급 미설정 시 파생값 "—". 개인정보: hourly_wage 는 RLS 상 직원 본인만 조회.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct StaffDetailSheet: View {

    @Environment(\.dismiss) private var dismiss

    private let member: TeamMember
    private let rules: [TeamScheduleRule]
    private let leaves: [TeamLeaveRequest]
    private let onWageSaved: () -> Void

    public init(member: TeamMember, rules: [TeamScheduleRule], leaves: [TeamLeaveRequest], onWageSaved: @escaping () -> Void) {
        self.member = member
        self.rules = rules
        self.leaves = leaves
        self.onWageSaved = onWageSaved
        _wageInput = State(initialValue: member.hourlyWage.map(String.init) ?? "")
    }

    @State private var editingWage = false
    @State private var wageInput: String
    @State private var savedWage: Int? = nil   // 저장 직후 즉시 반영용
    @State private var wageState: WageState = .idle
    @State private var monthAtt: [StaffAttendance]? = nil

    private enum WageState { case idle, saving, saved, error }

    /// 2026 최저시급 — 웹 MINIMUM_WAGE_2026(LEGAL.MINIMUM_WAGE_HOURLY) 미러
    private static let minimumWage2026 = 10_320

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }
    private var wage: Int? { savedWage ?? member.hourlyWage }

    // 급여 파생 (웹 StaffDetailModal 공식 미러 — 주휴수당 포함, 직원 지급액 관점)
    private var weeklyMin: Int {
        rules.reduce(0) { sum, r in
            let s = r.startTime.prefix(5).split(separator: ":").compactMap { Int($0) }
            let e = r.endTime.prefix(5).split(separator: ":").compactMap { Int($0) }
            guard s.count == 2, e.count == 2 else { return sum }
            var d = e[0] * 60 + e[1] - (s[0] * 60 + s[1])
            if d <= 0 { d += 1440 }
            return sum + d
        }
    }
    private var weeklyHours: Double { Double(weeklyMin) / 60 }
    private var hasJuhyu: Bool { weeklyHours >= 15 }
    private var weeklyAllowance: Double { (wage != nil && hasJuhyu) ? (weeklyHours / 5) * Double(wage!) : 0 }
    private var monthlyPay: Int? {
        guard let wage else { return nil }
        return Int(((Double(wage) * weeklyHours + weeklyAllowance) * 4.345).rounded())
    }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        profileHeader
                        payCard
                        attendanceCard
                        leaveCard
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("직원 상세")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #endif
            }
            .task {
                let cal = Calendar.current
                let c = cal.dateComponents([.year, .month], from: Date())
                let y = c.year ?? 2026, m = c.month ?? 1
                let last = cal.range(of: .day, in: .month, for: Date())?.count ?? 28
                monthAtt = (try? await repo.memberAttendance(
                    memberId: member.memberUserId,
                    monthStart: String(format: "%04d-%02d-01", y, m),
                    monthEnd: String(format: "%04d-%02d-%02d", y, m, last)
                )) ?? []
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // ── ① 프로필 ──
    private var profileHeader: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text(member.name).font(.system(size: 19, weight: .heavy)).foregroundStyle(BUColor.ink)
                    Text(member.role == "manager" ? "매니저" : "직원")
                        .font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 8).padding(.vertical, 2)
                        .background(BUColor.midnight.opacity(0.07), in: Capsule())
                    if let t = tenure, t >= 1 {
                        Text("근속 \(t)일차")
                            .font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
                    }
                }
                if let hire = member.hireDate {
                    Text("입사일 \(hire)").font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary)
                }
            }
        }
    }

    private var tenure: Int? {
        let base = member.hireDate ?? member.joinedAt.map { String($0.prefix(10)) }
        guard let base else { return nil }
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        guard let d = f.date(from: String(base.prefix(10))) else { return nil }
        return max(1, (Calendar.current.dateComponents([.day], from: d, to: Date()).day ?? 0) + 1)
    }

    // ── ② 급여 ──
    private var payCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text("급여").font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                HStack(spacing: 8) {
                    Text("시급").font(.system(size: 12, weight: .heavy)).foregroundStyle(BUColor.inkMuted)
                    if editingWage {
                        TextField("10320", text: $wageInput)
                            .font(.system(size: 14, weight: .semibold))
                            .keyboardType(.numberPad)
                            .textFieldStyle(.roundedBorder)
                        Button {
                            Task { await saveWage() }
                        } label: {
                            Text(wageState == .saving ? "저장 중…" : "저장")
                                .font(.system(size: 12.5, weight: .heavy)).foregroundStyle(.white)
                                .padding(.horizontal, 14).padding(.vertical, 8)
                                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 9))
                        }
                        .disabled(wageState == .saving)
                    } else {
                        Text(wage.map { "\($0.formatted())원" } ?? "—")
                            .font(.system(size: 17, weight: .heavy)).foregroundStyle(BUColor.ink)
                        if wageState == .saved {
                            Text("저장됨").font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                        }
                        Spacer(minLength: 0)
                        Button {
                            wageInput = wage.map(String.init) ?? ""
                            editingWage = true
                        } label: {
                            Text(wage != nil ? "수정" : "시급 설정")
                                .font(.system(size: 12, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 12).padding(.vertical, 6)
                                .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }
                if wageState == .error {
                    Text("저장 실패 — 값을 확인하거나 잠시 후 다시 시도해 주세요.")
                        .font(.system(size: 11.5)).foregroundStyle(BUColor.danger)
                }
                if let w = wage, w < Self.minimumWage2026 {
                    Text("⚠ 2026 최저시급 \(Self.minimumWage2026.formatted())원 미달")
                        .font(.system(size: 11.5, weight: .heavy)).foregroundStyle(BUColor.danger)
                }
                HStack(spacing: 6) {
                    statCell(weeklyMin > 0 ? durLabel(weeklyMin) : "—", "주 근무 (근무표)")
                    statCell(wage != nil && weeklyMin > 0 ? (hasJuhyu ? "\(Int(weeklyAllowance.rounded()).formatted())원" : "해당 없음") : "—", "주휴수당 (주 15h↑)")
                    statCell(monthlyPay != nil && weeklyMin > 0 ? "\(monthlyPay!.formatted())원" : "—", "예상 월급")
                }
                Text("근무표 기준 추정치 (주휴수당 포함, 4대보험·세금 미반영).")
                    .font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)
            }
        }
    }

    private func saveWage() async {
        guard let w = Int(wageInput.trimmingCharacters(in: .whitespaces)), w > 0 else {
            wageState = .error
            return
        }
        wageState = .saving
        do {
            try await repo.setHourlyWage(memberId: member.memberUserId, wage: w)
            savedWage = w
            wageState = .saved
            editingWage = false
            onWageSaved()
        } catch {
            wageState = .error
        }
    }

    // ── ③ 이번 달 근태 ──
    private var attendanceCard: some View {
        let att = monthAtt ?? []
        let totalMin = att.compactMap { rec -> Int? in
            guard let out = rec.clockOutAt, let i = iso(rec.clockInAt), let o = iso(out) else { return nil }
            return max(0, Int(o.timeIntervalSince(i) / 60))
        }.reduce(0, +)

        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text("이번 달 근태").font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                HStack(spacing: 6) {
                    statCell(monthAtt == nil ? "…" : "\(att.count)일", "출근")
                    statCell(monthAtt == nil ? "…" : (totalMin > 0 ? durLabel(totalMin) : "—"), "총 근무 (퇴근 완료분)")
                }
                if !att.isEmpty {
                    ForEach(att.prefix(5)) { rec in
                        HStack(spacing: 8) {
                            Text(String(rec.workDate.dropFirst(5)).replacingOccurrences(of: "-", with: "."))
                                .font(.system(size: 12, weight: .heavy).monospacedDigit()).foregroundStyle(BUColor.ink)
                            Text("\(hm(rec.clockInAt)) → \(rec.clockOutAt.map(hm) ?? "근무 중")")
                                .font(.system(size: 12).monospacedDigit()).foregroundStyle(BUColor.inkSecondary)
                            Spacer(minLength: 0)
                        }
                    }
                } else if monthAtt != nil {
                    Text("아직 이번 달 출근 기록이 없어요.").font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary)
                }
            }
        }
    }

    // ── ④ 연차 요약 ──
    private var leaveCard: some View {
        let approved = leaves.filter { $0.status == "approved" }.count
        let pending = leaves.filter { $0.status == "pending" }.count
        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text("연차 · 휴가").font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                HStack(spacing: 6) {
                    statCell("\(approved)", "승인")
                    statCell("\(pending)", "대기")
                }
            }
        }
    }

    // ── 헬퍼 ──
    private func statCell(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 15, weight: .heavy)).foregroundStyle(BUColor.ink)
            Text(label).font(.system(size: 10, weight: .heavy)).foregroundStyle(BUColor.inkMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
    }

    private func iso(_ s: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: s)
    }
    private func hm(_ s: String) -> String {
        guard let d = iso(s) else { return "—" }
        let f = DateFormatter(); f.dateFormat = "HH:mm"; return f.string(from: d)
    }
    private func durLabel(_ min: Int) -> String {
        let h = min / 60, m = min % 60
        if h > 0 && m > 0 { return "\(h)시간 \(m)분" }
        if h > 0 { return "\(h)시간" }
        return "\(m)분"
    }
}
