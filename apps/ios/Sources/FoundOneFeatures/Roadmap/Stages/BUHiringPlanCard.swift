//
//  BUHiringPlanCard.swift — 내 채용 계획 입력 (iOS).
//
//  웹 SSOT: apps/web/.../offline/MyHiringPlanCard.tsx (hiring-setup interactive ref="hiringPlan").
//  상태(미고용/예정/완료) + 정직원·알바 인원·단가 → staffPlan → 월 인건비 미리보기.
//  저장: stage_decisions["hiring-setup"].inputs.staffPlan + hiringStatus (웹과 동일 위치·포맷).
//  소비: 재무검토(web 자동추정, iOS 프리필). web↔iOS 동일.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct BUHiringPlanCard: View {

    @Environment(RoadmapStore.self) private var roadmapStore

    @State private var status: HiringStatus = .notYet
    @State private var ftCount = 0
    @State private var ftMonthlyManwon = ""   // 만원 단위
    @State private var ptCount = 0
    @State private var ptHourly = ""          // 원
    @State private var ptHoursPerWeek = 25
    @State private var loaded = false

    public init() {}

    enum HiringStatus: String { case notYet = "not-yet", planned, hired }

    private var staffPlan: StaffPlan {
        if status == .notYet { return StaffPlan(fullTimeCount: 0, partTimeCount: 0) }
        return StaffPlan(
            fullTimeCount: max(0, ftCount),
            partTimeCount: max(0, ptCount),
            fullTimeMonthlyBase: Int(ftMonthlyManwon).map { max(0, $0) * 10_000 },
            partTimeHourlyWage: Int(ptHourly).map { max(0, $0) },
            partTimeHoursPerWeek: max(0, ptHoursPerWeek)
        )
    }
    private var cost: TeamLaborCost { calculateMonthlyTeamLaborCost(staffPlan) }

    private func fmt(_ n: Int) -> String {
        n >= 10_000 ? "\((n / 10_000).formatted())만원" : "\(n.formatted())원"
    }

    public var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    BUEyebrow("내 채용 계획")
                    Text("직원을 채용하셨거나 채용 예정이신가요?")
                        .font(.system(size: 15, weight: .bold)).foregroundStyle(BUColor.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }

                HStack(spacing: 8) {
                    statusButton(.notYet, "아직 채용 안 함", "1인 운영 / 본인만")
                    statusButton(.planned, "채용 예정", "오픈 전후 계획")
                    statusButton(.hired, "채용 완료", "근로계약 체결됨")
                }

                if status != .notYet {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("정직원").font(BUFont.eyebrow).foregroundStyle(BUColor.midnight.opacity(0.7))
                        HStack(spacing: BUSpacing.sm) {
                            stepper("인원", value: $ftCount)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("1인 월급 (만원)").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                                TextField("미입력 시 최저임금", text: $ftMonthlyManwon).buPlanFieldStyle().keyboardType(.numberPad)
                            }
                        }
                        Divider()
                        Text("알바·파트타임").font(BUFont.eyebrow).foregroundStyle(BUColor.midnight.opacity(0.7))
                        HStack(spacing: BUSpacing.sm) {
                            stepper("인원", value: $ptCount)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("시급 (원)").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                                TextField("미입력 시 최저시급", text: $ptHourly).buPlanFieldStyle().keyboardType(.numberPad)
                            }
                            stepper("주 시간", value: $ptHoursPerWeek, step: 5)
                        }
                    }
                }

                // 미리보기
                HStack(alignment: .firstTextBaseline) {
                    Text(status == .notYet ? "예상 월 인건비" : "사업주 월 총 부담 (4대보험·퇴직 포함)")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                    Spacer()
                    Text(fmt(cost.total))
                        .font(BUFont.cardTitle).foregroundStyle(BUColor.midnight).monospacedDigit()
                }
                .padding(12)
                .frame(maxWidth: .infinity)
                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .task {
            guard !loaded else { return }
            let (plan, savedStatus) = await roadmapStore.loadStaffPlan()
            if let savedStatus, let s = HiringStatus(rawValue: savedStatus) { status = s }
            if let plan {
                ftCount = plan.fullTimeCount ?? 0
                ptCount = plan.partTimeCount ?? 0
                if let b = plan.fullTimeMonthlyBase { ftMonthlyManwon = String(b / 10_000) }
                if let w = plan.partTimeHourlyWage { ptHourly = String(w) }
                if let h = plan.partTimeHoursPerWeek { ptHoursPerWeek = h }
            }
            loaded = true
        }
        .onChange(of: status) { persist() }
        .onChange(of: ftCount) { persist() }
        .onChange(of: ftMonthlyManwon) { persist() }
        .onChange(of: ptCount) { persist() }
        .onChange(of: ptHourly) { persist() }
        .onChange(of: ptHoursPerWeek) { persist() }
    }

    private func persist() {
        guard loaded else { return }   // 초기 로드 중 덮어쓰기 방지
        roadmapStore.saveStaffPlan(staffPlan, status: status.rawValue)
    }

    private func statusButton(_ s: HiringStatus, _ title: String, _ desc: String) -> some View {
        let sel = status == s
        return Button { status = s } label: {
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.system(size: 13, weight: .bold)).foregroundStyle(sel ? BUColor.midnight : BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(desc).font(.system(size: 10.5)).foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10).padding(.vertical, 10)
            .background((sel ? BUColor.midnight.opacity(0.07) : BUColor.surface), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(sel ? BUColor.midnight.opacity(0.5) : BUColor.midnight.opacity(0.08), lineWidth: sel ? 1.5 : 1))
        }
        .buttonStyle(.plain)
    }

    private func stepper(_ label: String, value: Binding<Int>, step: Int = 1) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
            HStack(spacing: 8) {
                Button { value.wrappedValue = max(0, value.wrappedValue - step) } label: {
                    Image(systemName: "minus.circle.fill").font(.system(size: 22)).foregroundStyle(BUColor.midnight.opacity(0.6))
                }.buttonStyle(.plain)
                Text("\(value.wrappedValue)").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink).monospacedDigit().frame(minWidth: 24)
                Button { value.wrappedValue += step } label: {
                    Image(systemName: "plus.circle.fill").font(.system(size: 22)).foregroundStyle(BUColor.midnight)
                }.buttonStyle(.plain)
            }
        }
    }
}

private extension View {
    func buPlanFieldStyle() -> some View {
        self.font(BUFont.body)
            .padding(.horizontal, 10).padding(.vertical, 8)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}
