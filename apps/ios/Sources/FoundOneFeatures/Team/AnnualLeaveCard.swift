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
        // 2026-09-12 개편: 카드 안 제목 + 회색 안내 블록 + 2단 선택 카드 + **직원마다 상자**(카드 3중첩)
        //  → 섹션 제목은 밖으로, 선택은 체크마크 목록, 직원은 라벨/값 행.
        //  5인 미만일 때 직원마다 똑같은 문장("5인 미만은 법정 연차 의무가 없어요…")이 반복됐다.
        //  같은 말은 각주에서 한 번만 한다.
        // 성격이 다른 두 묶음이라 섹션을 나눈다 — 설정(기준 선택)과 현황(직원별 잔여).
        VStack(alignment: .leading, spacing: BUSpacing.shellGap) {
            BUListSection("연차 부여 기준") {
                BULeaveBasis.allCases.map { b in
                    BUListRow.select(b.labelKo, subtitle: b.descKo, isSelected: basis == b) {
                        if basis != b { onChangeBasis(b) }
                    }
                }
            }

            BUListSection("직원별 잔여", footer: footerText) {
                if members.isEmpty {
                    BUListRow.plain("등록된 직원이 없어요")
                } else {
                    members.map { leaveRow($0) }
                }
            }
        }
    }

    /// 각주 — 5인 기준선 + 예상치 단서를 한 번만. (직원 행마다 반복하지 않는다)
    private var footerText: String {
        let base = statutory
            ? "등록 직원 \(headcount)명 — 상시 5인 이상이라 법정 연차(근로기준법 제60조)가 적용돼요. 1년 미만은 개근 1개월당 1일, 1년부터 15일, 3년째부터 2년마다 1일씩 늘어 최대 25일이에요."
            : "등록 직원 \(headcount)명 — 5인 미만은 법정 연차 의무가 없어요(근로기준법 제11조·제60조). 근로계약서·취업규칙에 연차를 정했다면 그 약속은 지켜야 해요."
        let caveat = "표시된 일수는 입사일 기준 예상치예요. 실제 일수는 직전 1년 출근율(80%)과 상시 근로자 수 산정에 따라 달라질 수 있어요 — 확정이 필요하면 노무사(1350)에게 확인하세요."
        return statutory ? base + "\n\n" + caveat : base
    }

    /// 직원 한 줄 — 이름 + 잔여 일수(또는 사유). 법정 적용일 때만 기간 설명을 부제로.
    private func leaveRow(_ m: TeamMember) -> BUListRow {
        let result = BUAnnualLeave.calc(hireDate: m.hireDate, basis: basis, headcount: headcount)
        let range = BUAnnualLeave.yearRange(basis: basis, hireDate: m.hireDate)
        let used = BUAnnualLeave.usedDays(
            leaves.filter { $0.memberUserId == m.memberUserId }
                .map { (leaveType: $0.leaveType, startDate: $0.startDate, endDate: $0.endDate, status: $0.status) },
            yearStart: range.start, yearEnd: range.end
        )
        let left = BUAnnualLeave.remaining(granted: result.days, used: used)

        guard result.statutory, result.days > 0 else {
            // 5인 미만·입사일 미입력 — 사유만. 같은 설명을 사람마다 반복하지 않는다(각주에 한 번).
            return .value(m.name, m.hireDate == nil ? "입사일 미입력" : "법정 의무 없음")
        }
        return .value(
            m.name,
            "잔여 \(fmt(left))일",
            subtitle: "발생 \(result.days)일 · 사용 \(fmt(used))일 · \(result.basisNoteKo)"
        )
    }

    /// 0.5 단위 표기 — 정수면 소수점 없이
    private func fmt(_ v: Double) -> String {
        v == v.rounded() ? String(Int(v)) : String(format: "%.1f", v)
    }
}
