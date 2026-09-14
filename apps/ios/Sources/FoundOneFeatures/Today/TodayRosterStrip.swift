//
//  TodayRosterStrip.swift — 홈 "오늘 출근" 가로 카드 줄 (2026-09-14).
//
//  웹 미러: apps/web/app/lib/components/dashboard/sections/TodayRosterStrip.tsx
//  판정 SSOT: FoundOneCore/BUTodayRoster (웹 packages/shared/src/team/today-roster.ts)
//
//  왜 가로 카드인가 (사장님 요청):
//   종전 홈 직원 구획은 "함께 일하는 사람 3명" 한 줄이었다. 숫자는 오늘 무엇을 할지
//   알려주지 않는다. 사장이 아침에 알고 싶은 건 **누가 몇 시에 오는가**와
//   **왔는가** 둘뿐이다. 그래서 사람당 카드 하나, 이른 시간부터 왼쪽에 둔다.
//
//  각 카드는 세 줄로만 읽힌다: 이름 → 근무 시간 → 상태.
//   상태는 색이 아니라 **아이콘과 글자**로 구분한다(색맹·흑백 캡처에서도 읽히게).
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem

struct TodayRosterStrip: View {

    let entries: [BUTodayRosterEntry]
    /// 카드를 누르면 직원 관리로 — 명단/근무표 수정은 거기서 한다.
    var onTap: () -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: 10) {
                ForEach(entries) { entry in
                    Button(action: onTap) {
                        RosterCard(entry: entry)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, BUSpacing.screenMargin)
            .scrollTargetLayout()
        }
        .scrollTargetBehavior(.viewAligned)
        // 셀 가장자리가 화면 끝에서 잘려 보이도록 — "더 있다"는 신호.
        .scrollClipDisabled(false)
    }
}

// MARK: - 카드 한 장 = 직원 한 명

private struct RosterCard: View {

    let entry: BUTodayRosterEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {

            Text(entry.name)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)

            Text(timeLine)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .monospacedDigit()
                .lineLimit(1)

            HStack(spacing: 5) {
                Image(systemName: statusIcon)
                    .font(.system(size: 12, weight: .bold))
                Text(statusLabel)
                    .font(.system(size: 13, weight: .semibold))
            }
            .foregroundStyle(statusTint)
            .lineLimit(1)
        }
        .frame(width: 148, alignment: .leading)
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(BUColor.surfaceElevated)
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                .strokeBorder(BUColor.ink.opacity(0.07), lineWidth: 0.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
        .shadow(color: BUColor.ink.opacity(0.05), radius: 10, x: 0, y: 3)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(entry.name), \(timeLine), \(statusLabel)")
    }

    /// 근무 시간 — 배정이 없으면 실제 출근 시각을 보여준다(대타). 둘 다 없으면 지어내지 않는다.
    private var timeLine: String {
        if let s = entry.startTime, let e = entry.endTime {
            return "\(BUWorkSchedule.shortTime(s)) – \(BUWorkSchedule.shortTime(e))"
        }
        if let inAt = entry.clockInAt, let hhmm = Self.hhmm(inAt) {
            return "\(hhmm) 출근"
        }
        return "근무 시간 미정"
    }

    private var statusIcon: String {
        switch entry.status {
        case .working:   return "checkmark.circle.fill"
        case .done:      return "checkmark.circle"
        case .scheduled: return "clock"
        case .leave:     return "calendar"
        case .off:       return "moon"
        }
    }

    private var statusLabel: String {
        switch entry.status {
        case .working:   return "출근 완료"
        case .done:      return "퇴근"
        case .scheduled: return "출근 전"
        case .leave:     return "연차"
        case .off:       return "휴무"
        }
    }

    /// 출근한 사람만 강조색 — 나머지는 회색. 아침에 눈에 띄어야 하는 건 "왔다/안 왔다"다.
    private var statusTint: Color {
        switch entry.status {
        case .working: return BUColor.success
        case .done:    return BUColor.inkMuted
        default:       return BUColor.inkMuted
        }
    }

    /// ISO8601 timestamptz → 로컬 "HH:mm". 파싱 실패하면 nil (틀린 시각을 쓰지 않는다).
    static func hhmm(_ iso: String) -> String? {
        let withFrac = ISO8601DateFormatter()
        withFrac.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        guard let date = withFrac.date(from: iso) ?? plain.date(from: iso) else { return nil }
        let out = DateFormatter()
        out.dateFormat = "HH:mm"
        out.locale = Locale(identifier: "ko_KR")
        return out.string(from: date)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("오늘 출근") {
    ZStack {
        BUBackgroundSurface()
        VStack(alignment: .leading, spacing: 12) {
            BUSectionTitle("오늘 출근", actionLabel: "관리", action: {})
                .padding(.horizontal, BUSpacing.screenMargin)
            TodayRosterStrip(
                entries: [
                    .init(memberUserId: "1", name: "김미소", status: .working,
                          startTime: "09:00:00", endTime: "15:00:00", startMinutes: 540,
                          clockInAt: "2026-09-14T00:02:00Z", clockOutAt: nil),
                    .init(memberUserId: "2", name: "박준영", status: .scheduled,
                          startTime: "15:00:00", endTime: "22:00:00", startMinutes: 900,
                          clockInAt: nil, clockOutAt: nil),
                    .init(memberUserId: "3", name: "이하늘", status: .leave,
                          startTime: nil, endTime: nil, startMinutes: nil,
                          clockInAt: nil, clockOutAt: nil),
                ],
                onTap: {}
            )
        }
    }
}
#endif
