//
//  AnnualLeaveCard.swift — 사장용 연차 관리 (2026-07-28)
//
//  웹 미러: apps/web/app/lib/components/surfaces/TeamSurface.tsx > AnnualLeaveSection
//  계산은 BUAnnualLeave SSOT (근로기준법 제60조). 5인 미만은 법정 의무가 없으므로
//  숫자를 만들어내지 않고 안내만 한다 (제11조) — 없는 의무를 있다고 하면 안 됨.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

struct AnnualLeaveCard: View {
    let members: [TeamMember]
    let leaves: [TeamLeaveRequest]
    let basis: BULeaveBasis
    let onChangeBasis: (BULeaveBasis) -> Void

    private var headcount: Int { members.count }
    private var statutory: Bool { headcount >= 5 }

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "calendar.badge.checkmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    Text("연차 관리")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                }

                // 5인 기준선 — 사장님 질문의 핵심
                Text(statutory
                     ? "등록 직원 \(headcount)명 — 상시 5인 이상이라 법정 연차(근로기준법 제60조)가 적용돼요. 1년 미만은 개근 1개월당 1일, 1년부터 15일, 3년째부터 2년마다 1일씩 늘어 최대 25일이에요."
                     : "등록 직원 \(headcount)명 — 5인 미만은 법정 연차 의무가 없어요 (근로기준법 제11조·제60조). 근로계약서·취업규칙에 연차를 정했다면 그 약속은 지켜야 해요.")
                    .font(.system(size: 12))
                    .foregroundStyle(statutory ? BUColor.midnight : BUColor.inkMuted)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(11)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        (statutory ? BUColor.midnight.opacity(0.06) : Color.black.opacity(0.035)),
                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                    )

                // 부여 기준 선택
                VStack(alignment: .leading, spacing: 7) {
                    Text("연차 부여 기준")
                        .font(.system(size: 11.5, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                    HStack(spacing: 8) {
                        ForEach(BULeaveBasis.allCases, id: \.self) { b in
                            let on = basis == b
                            Button {
                                if !on { onChangeBasis(b) }
                            } label: {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(b.labelKo)
                                        .font(.system(size: 13, weight: .heavy))
                                        .foregroundStyle(on ? BUColor.midnight : BUColor.ink)
                                    Text(b.descKo)
                                        .font(.system(size: 10.5, weight: .medium))
                                        .foregroundStyle(BUColor.inkMuted)
                                        .multilineTextAlignment(.leading)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(10)
                                .background(
                                    on ? BUColor.midnight.opacity(0.06) : Color.white.opacity(0.7),
                                    in: RoundedRectangle(cornerRadius: 11, style: .continuous)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 11, style: .continuous)
                                        .strokeBorder(on ? BUColor.midnight.opacity(0.5) : BUColor.midnight.opacity(0.12),
                                                      lineWidth: on ? 1.5 : 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                // 직원별 잔여
                if members.isEmpty {
                    Text("등록된 직원이 없어요.")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.inkMuted)
                } else {
                    VStack(spacing: 8) {
                        ForEach(members) { m in
                            memberRow(m)
                        }
                    }
                }

                Text("표시된 일수는 입사일 기준 예상치예요. 실제 일수는 직전 1년 출근율(80%)과 상시 근로자 수 산정에 따라 달라질 수 있어요 — 확정이 필요하면 노무사(1350)에게 확인하세요.")
                    .font(.system(size: 10.5))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    @ViewBuilder
    private func memberRow(_ m: TeamMember) -> some View {
        let result = BUAnnualLeave.calc(hireDate: m.hireDate, basis: basis, headcount: headcount)
        let range = BUAnnualLeave.yearRange(basis: basis, hireDate: m.hireDate)
        let used = BUAnnualLeave.usedDays(
            leaves.filter { $0.memberUserId == m.memberUserId }
                .map { (leaveType: $0.leaveType, startDate: $0.startDate, endDate: $0.endDate, status: $0.status) },
            yearStart: range.start, yearEnd: range.end
        )
        let left = BUAnnualLeave.remaining(granted: result.days, used: used)

        VStack(alignment: .leading, spacing: 5) {
            HStack(alignment: .firstTextBaseline, spacing: 7) {
                Text(m.name).font(.system(size: 13.5, weight: .heavy)).foregroundStyle(BUColor.ink)
                if result.statutory && result.days > 0 {
                    Text("잔여 \(fmt(left))일")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                        .monospacedDigit()
                    Text("(발생 \(result.days)일 · 사용 \(fmt(used))일)")
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .monospacedDigit()
                    Text("예상")
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Color.black.opacity(0.05), in: Capsule())
                } else {
                    Text(m.hireDate == nil ? "입사일 미입력" : "법정 의무 없음")
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Spacer(minLength: 0)
            }
            Text(result.basisNoteKo)
                .font(.system(size: 10.5))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 11, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
        )
    }

    /// 0.5 단위 표기 — 정수면 소수점 없이
    private func fmt(_ v: Double) -> String {
        v == v.rounded() ? String(Int(v)) : String(format: "%.1f", v)
    }
}
