//
//  ShiftAvailabilityCard.swift — 희망 근무 신청/취합 (2026-07-30 사장님 요청)
//
//  웹 미러: apps/web/app/lib/components/team/ShiftAvailabilityCalendar.tsx (구성·문구 1:1)
//  계산은 BUShiftRequest SSOT — 웹과 같은 신청 창·같은 그룹핑 (복붙 금지).
//
//    · mode .staff — 내 희망 입력 + **동료 희망 동시 표시**
//    · mode .owner — 전원 취합 + 미제출자 + 근무표 확정
//
//  정직성: 희망은 확정 근무표가 아니다. 문구를 섞지 않는다.
//          필요 인원을 모르므로 "인원 부족" 판정은 하지 않는다.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

private let WISH_COLOR = Color(red: 139 / 255, green: 127 / 255, blue: 212 / 255) // #8b7fd4
private let PERSON_COLORS: [Color] = [
    Color(red: 29 / 255, green: 53 / 255, blue: 87 / 255),
    Color(red: 59 / 255, green: 92 / 255, blue: 140 / 255),
    Color(red: 107 / 255, green: 131 / 255, blue: 181 / 255),
    Color(red: 154 / 255, green: 171 / 255, blue: 208 / 255),
]
private let WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"]

struct ShiftAvailabilityCard: View {
    enum Mode { case staff, owner }
    /// 펼침 방식 (2026-08-19 IA 정리) — .inline = 카드 안에서 펼침(기존), .sheet = 요약 카드만 두고
    ///   탭하면 시트로 전체 캘린더. 사장 「근무표」 세그먼트처럼 한 화면 밀도를 낮출 때 쓴다.
    enum Presentation { case inline, sheet }

    let mode: Mode
    let ownerUserId: UUID?
    let repo: TeamRepository
    var presentation: Presentation = .inline

    @State private var deadlineDay = BU_DEFAULT_SHIFT_REQUEST_DEADLINE_DAY
    @State private var period = BUShiftRequest.currentWindow().period
    @State private var rows: [BUShiftAvailability] = []
    @State private var subs: [BUShiftSubmission] = []
    @State private var selected: String? = nil
    @State private var loading = false
    @State private var failed = false
    @State private var busy = false
    @State private var toast: String? = nil
    /// 사용자가 화살표로 달을 옮겼는가 — 옮긴 뒤엔 서버 마감일이 와도 그 달을 유지한다
    @State private var navigated = false
    /// 사장이 정한 근무 시간대 — 직원 신청 버튼이 이걸로 그려진다
    @State private var slots: [BUShiftSlot] = []
    @State private var editingSlots = false
    @State private var slotDraft: [BUShiftSlot] = []
    /// 고정 근무표로만 돌아가는 업장도 있어 기본은 접힘 (사장님 지적 2026-07-30)
    @State private var open = false
    @State private var openTouched = false
    @State private var sheetOpen = false   // presentation == .sheet 전용
    @State private var customStart = ""
    @State private var customEnd = ""

    private var reqWindow: BURequestWindow {
        BUShiftRequest.currentWindow(deadlineDay: deadlineDay)
    }
    private var editable: Bool {
        mode == .staff && BUShiftRequest.isEditable(period: period, deadlineDay: deadlineDay)
    }

    var body: some View {
        BUCard(.outer) {
            if presentation == .sheet || !open {
                collapsedBar
            } else {
                expandedContent
            }
        }
        // 🔴 ownerId 도 트리거에 포함 (2026-08-01): 부모가 members 를 먼저 세팅하고 ownerId 를
        //   나중에 채우는데, period 만 보면 그 사이 렌더의 .task 가 빈손으로 끝나고 재실행되지 않아
        //   카드가 "등록된 직원이 없어요"로 굳었다.
        .task(id: "\(ownerUserId?.uuidString ?? "-")|\(period)") { await load() }
        .onChange(of: reqWindow.urgent) { _, urgent in autoOpenIfUrgent(urgent) }
        .onAppear { autoOpenIfUrgent(reqWindow.urgent) }
        .sheet(isPresented: $sheetOpen) {
            NavigationStack {
                ZStack(alignment: .top) {
                    BUBackgroundSurface()
                    ScrollView {
                        BUCard(.outer) { expandedContent }
                            .padding(.horizontal, BUSpacing.md)
                            .padding(.vertical, BUSpacing.sm)
                    }
                }
                .navigationTitle("희망 근무 취합")
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("닫기") { sheetOpen = false }.foregroundStyle(BUColor.midnight)
                    }
                }
            }
        }
    }

    /// 펼친 본문 — 인라인 펼침과 시트가 같은 뷰를 공유한다 (상태 @State 공유).
    private var expandedContent: some View {
        let byDate = BUShiftRequest.groupByDate(rows)
        return VStack(alignment: .leading, spacing: 12) {
            header
            if failed {
                failureNotice
            } else {
                guide
                if mode == .owner { ownerStatusBar } else { staffStatusBar }
                calendarGrid(byDate)
                if let sel = selected { detail(for: sel, byDate: byDate) }
                if mode == .staff && !editable { closedNotice }
            }
            if let toast {
                Text(toast)
                    .font(.system(size: 11.5, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
        }
    }

    /// 마감이 임박했을 때만 스스로 펼친다 — 평소엔 접힌 채 자리를 차지하지 않는다.
    ///   시트 방식은 자동으로 띄우지 않는다(요약 카드의 D-day 강조로 충분, 시트 자동 팝업은 방해).
    private func autoOpenIfUrgent(_ urgent: Bool) {
        guard presentation == .inline, !openTouched, urgent, period == reqWindow.period else { return }
        open = true
    }

    private func toggle() {
        openTouched = true
        if presentation == .sheet { sheetOpen.toggle() } else { open.toggle() }
    }

    /// 접힌 상태 한 줄 요약 — 열지 않고도 "지금 뭘 해야 하나"가 보여야 접어둘 수 있다
    private var collapsedSummary: String {
        if failed { return "불러오지 못했어요 — 눌러서 다시 시도" }
        if mode == .owner {
            return "\(BUShiftRequest.submissionSummary(subs)) · 마감 \(reqWindow.closesOn)"
        }
        let submitted = subs.first(where: { $0.mine })?.submittedAt != nil
        let myCount = rows.filter(\.mine).count
        return submitted
            ? "제출 완료 · 내 신청 \(myCount)일"
            : "아직 제출 안 했어요 · \(reqWindow.closesOn) 마감"
    }

    private var collapsedBar: some View {
        Button(action: { if failed { Task { await load() } } else { toggle() } }) {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(BUShiftRequest.periodLabel(reqWindow.period)) 희망 근무")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text(collapsedSummary)
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                HStack(spacing: 4) {
                    Text(presentation == .sheet ? "자세히" : "열기").font(.system(size: 11.5, weight: .heavy))
                    Image(systemName: presentation == .sheet ? "chevron.right" : "chevron.down").font(.system(size: 11, weight: .bold))
                }
                .foregroundStyle(BUColor.midnight)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .buttonStyle(.plain)
        .accessibilityHint("희망 근무 신청 열기")
    }

    // ── 헤더 ──
    private var header: some View {
        HStack(spacing: 7) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
            Text("\(BUShiftRequest.periodLabel(period)) 희망 근무")
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            if period == reqWindow.period {
                Text(reqWindow.daysLeft == 0 ? "오늘 마감" : "마감 D-\(reqWindow.daysLeft)")
                    .font(.system(size: 10.5, weight: .heavy))
                    .foregroundStyle(reqWindow.urgent ? Color(red: 122 / 255, green: 46 / 255, blue: 46 / 255) : BUColor.midnight)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(
                        (reqWindow.urgent ? Color(red: 122 / 255, green: 46 / 255, blue: 46 / 255).opacity(0.08) : BUColor.midnight.opacity(0.06)),
                        in: Capsule()
                    )
            } else {
                Text("신청 마감")
                    .font(.system(size: 10.5, weight: .heavy))
                    .foregroundStyle(BUColor.inkSecondary)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(Color.black.opacity(0.05), in: Capsule())
            }
            Spacer(minLength: 0)
            HStack(spacing: 6) {
                navButton("chevron.up") { toggle() }
                navButton("chevron.left") { move(-1) }
                navButton("chevron.right") { move(1) }
            }
        }
    }

    private func navButton(_ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(BUColor.midnight)
                .frame(width: 28, height: 28)
                .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var guide: some View {
        Text(mode == .staff
             ? "날짜를 눌러 가능한 시간을 고르면 바로 저장돼요. 다 골랐으면 「제출」을 눌러 사장님께 알려주세요. 여기 적은 건 희망이고, 실제 근무는 사장님이 확정해요. (\(reqWindow.closesOn) 마감)"
             : "직원이 낸 희망이에요. 아직 근무표가 아니고, 「근무표에 넣기」를 누른 것만 확정됩니다.")
            .font(.system(size: 11.5))
            .foregroundStyle(BUColor.inkSecondary)
            .lineSpacing(3)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var failureNotice: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("희망 근무 신청을 불러오지 못했어요. 서버 준비(마이그레이션 20260730_000001)가 끝나면 표시됩니다.")
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
            Button("다시 시도") { Task { await load() } }
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
        }
    }

    private var closedNotice: some View {
        Text("\(BUShiftRequest.periodLabel(period))분은 신청 기간이 아니에요. 지금은 \(BUShiftRequest.periodLabel(reqWindow.period)) 희망을 \(reqWindow.closesOn)까지 받아요.")
            .font(.system(size: 11.5))
            .foregroundStyle(BUColor.inkSecondary)
            .lineSpacing(3)
            .fixedSize(horizontal: false, vertical: true)
    }

    // ── 상태 바 ──
    private var ownerStatusBar: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(BUShiftRequest.submissionSummary(subs))
                .font(.system(size: 12.5, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            let waiting = BUShiftRequest.pendingSubmitters(subs)
            if !waiting.isEmpty {
                Text("대기: " + waiting.map(\.name).joined(separator: ", "))
                    .font(.system(size: 11.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Button {
                slotDraft = slots.isEmpty ? buEffectiveShiftSlots([]) : slots
                editingSlots.toggle()
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "clock")
                    Text(buHasOwnerSlots(slots) ? "근무 시간대 \(slots.count)개" : "근무 시간대 정하기")
                }
                .font(.system(size: 11.5, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 9).padding(.vertical, 5)
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)

            if editingSlots { slotEditor }

            HStack(spacing: 6) {
                Text("매달 마감일")
                    .font(.system(size: 11.5))
                    .foregroundStyle(BUColor.inkSecondary)
                Picker("매달 마감일", selection: Binding(
                    get: { deadlineDay },
                    set: { newValue in
                        let prev = deadlineDay
                        deadlineDay = newValue
                        Task {
                            do { try await repo.setShiftDeadline(newValue); await load() }
                            catch { deadlineDay = prev }
                        }
                    }
                )) {
                    ForEach(BU_DEADLINE_DAY_CHOICES, id: \.self) { d in
                        Text(buDeadlineDayLabel(d)).tag(d)
                    }
                }
                .pickerStyle(.menu)
                .tint(BUColor.midnight)
            }
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
    }

    private var staffStatusBar: some View {
        let myCount = rows.filter(\.mine).count
        let submitted = subs.first(where: { $0.mine })?.submittedAt != nil
        return HStack(spacing: 9) {
            Text("내 신청 \(myCount)일")
                .font(.system(size: 12.5, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            if submitted {
                Text("제출 완료")
                    .font(.system(size: 10.5, weight: .heavy))
                    .foregroundStyle(WISH_COLOR)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(WISH_COLOR.opacity(0.14), in: Capsule())
            }
            Spacer(minLength: 0)
            Button {
                Task { await load() }
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BUColor.inkSecondary)
                    .frame(width: 28, height: 28)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1)
                    )
            }
            .buttonStyle(.plain)
            .disabled(loading)
            .accessibilityLabel("동료 신청 현황 새로 불러오기")
            if editable {
                Button {
                    Task { await submit() }
                } label: {
                    Text(submitted ? "다시 제출" : "제출")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(
                            LinearGradient(colors: [Color(red: 29 / 255, green: 43 / 255, blue: 122 / 255),
                                                    Color(red: 13 / 255, green: 13 / 255, blue: 77 / 255)],
                                           startPoint: .topLeading, endPoint: .bottomTrailing),
                            in: RoundedRectangle(cornerRadius: 9, style: .continuous)
                        )
                }
                .buttonStyle(.plain)
                .disabled(busy || myCount == 0)
                .opacity(myCount == 0 ? 0.45 : 1)
            }
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(WISH_COLOR.opacity(0.08), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
    }

    // ── 캘린더 ──
    private func calendarGrid(_ byDate: [String: BUDayAvailability]) -> some View {
        let dates = BUShiftRequest.periodDates(period)
        let lead = BUShiftRequest.firstWeekday(period)
        return VStack(spacing: 4) {
            HStack(spacing: 2) {
                ForEach(Array(WEEKDAYS_KO.enumerated()), id: \.offset) { i, w in
                    Text(w)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(i == 0 ? WISH_COLOR : BUColor.inkSecondary)
                        .frame(maxWidth: .infinity)
                }
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: 7), spacing: 3) {
                ForEach(0..<lead, id: \.self) { i in Color.clear.frame(height: 40).id("lead\(i)") }
                ForEach(dates, id: \.self) { date in
                    dayCell(date, day: byDate[date])
                }
            }
        }
    }

    private func dayCell(_ date: String, day: BUDayAvailability?) -> some View {
        let total = day?.entries.count ?? 0
        let isMine = day?.entries.contains(where: \.mine) ?? false
        let others = total - (isMine ? 1 : 0)
        let shown = mode == .owner ? total : others
        let isSelected = date == selected
        return Button {
            selected = isSelected ? nil : date
            syncCustomFields(for: date)
        } label: {
            VStack(spacing: 2) {
                Text(String(Int(date.suffix(2)) ?? 0))
                    .font(.system(size: 12.5, weight: isMine ? .heavy : .semibold))
                    .foregroundStyle(total > 0 ? BUColor.ink : BUColor.inkSecondary)
                if shown > 0 {
                    Text("\(shown)명")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(BUColor.midnight.opacity(0.75))
                }
            }
            .frame(maxWidth: .infinity, minHeight: 40)
            .background(
                isMine ? WISH_COLOR.opacity(0.16) : (total > 0 ? BUColor.midnight.opacity(0.06) : Color.clear),
                in: RoundedRectangle(cornerRadius: 10, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(isSelected ? BUColor.midnight : (isMine ? WISH_COLOR : Color.clear),
                                  lineWidth: isSelected ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
    }

    // ── 선택한 날 상세 ──
    @ViewBuilder
    private func detail(for date: String, byDate: [String: BUDayAvailability]) -> some View {
        let day = byDate[date]
        VStack(alignment: .leading, spacing: 9) {
            HStack {
                Text(dayTitle(date))
                    .font(.system(size: 12.5, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Spacer(minLength: 0)
                if mode == .owner, let day, !day.spans.isEmpty {
                    Button {
                        Task { await confirmDay(date, day: day) }
                    } label: {
                        Text("근무표에 넣기")
                            .font(.system(size: 11.5, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10).padding(.vertical, 5)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(busy)
                }
            }

            if let day, !day.spans.isEmpty { timeline(day) }

            if let day, !day.entries.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(Array(day.entries.enumerated()), id: \.element.id) { i, e in
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(PERSON_COLORS[i % PERSON_COLORS.count])
                                .frame(width: 8, height: 8)
                            Text(e.mine ? "나" : e.name)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(BUColor.ink)
                            Text(BUShiftRequest.timeLabel(start: e.startTime, end: e.endTime))
                                .font(.system(size: 12))
                                .foregroundStyle(BUColor.inkSecondary)
                                .monospacedDigit()
                            Spacer(minLength: 0)
                        }
                    }
                }
            } else {
                Text("아직 이 날 희망한 사람이 없어요.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.inkSecondary)
            }

            if mode == .staff && editable { staffInput(for: date, day: day) }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1)
        )
    }

    /// 하루 희망을 가로 막대로 — "3시부터는 나 말고 아무도 없네"가 보여야 조정이 된다
    private func timeline(_ day: BUDayAvailability) -> some View {
        let minStart = day.spans.map(\.span.startMin).min() ?? 0
        let maxEnd = day.spans.map(\.span.endMin).max() ?? 1
        let width = max(1, maxEnd - minStart)
        return VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(BUWorkSchedule.formatSpanTime(minStart))
                Spacer()
                Text(BUWorkSchedule.formatSpanTime(maxEnd))
            }
            .font(.system(size: 10))
            .foregroundStyle(BUColor.inkSecondary)
            .monospacedDigit()

            ForEach(Array(day.spans.enumerated()), id: \.offset) { i, s in
                GeometryReader { geo in
                    let full = geo.size.width
                    let x = CGFloat(s.span.startMin - minStart) / CGFloat(width) * full
                    let w = max(18, CGFloat(s.span.endMin - s.span.startMin) / CGFloat(width) * full)
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 5).fill(Color.black.opacity(0.04))
                        RoundedRectangle(cornerRadius: 5)
                            // 색은 spans 순번이 아니라 명단 순번(colorIndex) — 아래 점 색과 같아야 한다
                            .fill(PERSON_COLORS[s.colorIndex % PERSON_COLORS.count])
                            .frame(width: w)
                            .overlay(
                                Text(s.mine ? "나" : s.name)
                                    .font(.system(size: 9.5, weight: .bold))
                                    .foregroundStyle(.white)
                                    .padding(.leading, 5)
                                    .frame(width: w, alignment: .leading)
                                    .clipped()
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 5)
                                    .strokeBorder(s.mine ? WISH_COLOR : Color.clear, lineWidth: 1.5)
                                    .frame(width: w)
                            )
                            .offset(x: x)
                    }
                }
                .frame(height: 16)
            }

            if day.anyTimeCount > 0 {
                Text("시간 무관 \(day.anyTimeCount)명 (막대 없음)")
                    .font(.system(size: 10.5))
                    .foregroundStyle(BUColor.inkSecondary)
            }
        }
    }

    // ── 직원 입력 ──
    @ViewBuilder
    private func staffInput(for date: String, day: BUDayAvailability?) -> some View {
        let mine = day?.entries.first(where: \.mine)
        VStack(alignment: .leading, spacing: 8) {
            Divider().overlay(BUColor.midnight.opacity(0.12))
            Text("이 날 가능한 시간")
                .font(.system(size: 11.5, weight: .heavy))
                .foregroundStyle(BUColor.inkSecondary)

            // 프리셋 — 매일 시간 입력하게 하면 아무도 안 쓴다
            HStack(spacing: 6) {
                ForEach(buEffectiveShiftSlots(slots)) { ps in
                    presetButton(ps, date: date, on: isPresetOn(mine, ps))
                }
            }

            HStack(spacing: 6) {
                let anyOn = mine != nil && mine?.startTime == nil
                Button {
                    Task { await setMyDay(date, nil, nil) }
                } label: {
                    Text("시간 무관")
                        .font(.system(size: 11.5, weight: .heavy))
                        .foregroundStyle(anyOn ? BUColor.midnight : BUColor.ink)
                        .padding(.horizontal, 10).padding(.vertical, 7)
                        .background(anyOn ? BUColor.midnight.opacity(0.06) : Color.white.opacity(0.8),
                                    in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 9, style: .continuous)
                                .strokeBorder(anyOn ? BUColor.midnight : BUColor.midnight.opacity(0.16), lineWidth: anyOn ? 1.5 : 1)
                        )
                }
                .buttonStyle(.plain)
                .disabled(busy)

                if mine != nil {
                    Button {
                        Task { await clearMyDay(date) }
                    } label: {
                        Text("이 날 취소")
                            .font(.system(size: 11.5, weight: .heavy))
                            .foregroundStyle(BUColor.inkSecondary)
                            .padding(.horizontal, 10).padding(.vertical, 7)
                            .overlay(
                                RoundedRectangle(cornerRadius: 9, style: .continuous)
                                    .strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                    .disabled(busy)
                }
                Spacer(minLength: 0)
            }

            // 직접 입력 — 프리셋만 두면 실제 교대(06–11시)를 못 낸다
            HStack(spacing: 6) {
                Text("직접 입력")
                    .font(.system(size: 11.5))
                    .foregroundStyle(BUColor.inkSecondary)
                timeField("09:00", text: $customStart)
                Text("–").font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary)
                timeField("13:00", text: $customEnd)
                Button("적용") {
                    Task { await setMyDay(date, customStart, customEnd) }
                }
                .font(.system(size: 11.5, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .disabled(busy || !validCustom)
                .opacity(validCustom ? 1 : 0.45)
            }
        }
    }

    /// 프리셋 선택 여부 — Substring 비교를 인라인에 두면 타입체커가 폭발한다(빌드 실패 경험).
    private func isPresetOn(_ mine: BUShiftAvailability?, _ ps: BUShiftSlot) -> Bool {
        guard let mine, let s = mine.startTime, let e = mine.endTime else { return false }
        return String(s.prefix(5)) == ps.start && String(e.prefix(5)) == ps.end
    }

    private func presetButton(_ ps: BUShiftSlot, date: String, on: Bool) -> some View {
        Button {
            Task { await setMyDay(date, ps.start, ps.end) }
        } label: {
            VStack(spacing: 1) {
                Text(ps.label).font(.system(size: 11.5, weight: .heavy))
                Text("\(ps.start)–\(ps.end)")
                    .font(.system(size: 9.5, weight: .semibold))
                    .monospacedDigit()
                    .opacity(0.7)
            }
            .foregroundStyle(on ? BUColor.midnight : BUColor.ink)
            .padding(.horizontal, 9).padding(.vertical, 6)
            .background(on ? BUColor.midnight.opacity(0.06) : Color.white.opacity(0.8),
                        in: RoundedRectangle(cornerRadius: 9, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .strokeBorder(on ? BUColor.midnight : BUColor.midnight.opacity(0.16), lineWidth: on ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(busy)
    }

    // ── 근무 시간대 편집 (사장) ──
    //   "업장마다 운영 시간이 다 다르잖아" (2026-07-30). 저장하면 직원 신청 버튼이 이걸로 바뀐다.
    //   웹 미러: ShiftAvailabilityCalendar.tsx > SlotEditor
    @ViewBuilder
    private var slotEditor: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("우리 가게 근무 시간대")
                .font(.system(size: 12.5, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            Text("직원이 신청할 때 누를 버튼이에요. 이름은 가게에서 부르는 대로 적으세요 (오픈·미들·마감처럼). 자정을 넘기는 시간대도 됩니다.")
                .font(.system(size: 11))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)

            ForEach(Array(slotDraft.enumerated()), id: \.offset) { idx, _ in
                slotRow(idx)
            }

            HStack(spacing: 7) {
                if slotDraft.count < BU_MAX_SHIFT_SLOTS {
                    Button {
                        slotDraft.append(BUShiftSlot(label: "", start: "", end: ""))
                    } label: {
                        Text("+ 시간대 추가")
                            .font(.system(size: 11.5, weight: .heavy))
                            .foregroundStyle(BUColor.inkSecondary)
                    }
                    .buttonStyle(.plain)
                }
                Button("취소") { editingSlots = false }
                    .font(.system(size: 11.5, weight: .heavy))
                    .foregroundStyle(BUColor.inkSecondary)
                Spacer(minLength: 0)
                Button {
                    Task { await saveSlots() }
                } label: {
                    Text("저장")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(!canSaveSlots)
                .opacity(canSaveSlots ? 1 : 0.45)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1)
        )
    }

    private func slotRow(_ idx: Int) -> some View {
        HStack(spacing: 6) {
            TextField("이름 (오픈)", text: Binding(
                get: { idx < slotDraft.count ? slotDraft[idx].label : "" },
                set: { v in patchSlot(idx, label: String(v.prefix(10))) }
            ))
            .font(.system(size: 12, weight: .semibold))
            .frame(width: 84)
            .padding(.horizontal, 7).padding(.vertical, 5)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1))

            timeField("09:00", text: Binding(
                get: { idx < slotDraft.count ? slotDraft[idx].start : "" },
                set: { v in patchSlot(idx, start: v) }
            ))
            Text("–").font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary)
            timeField("13:00", text: Binding(
                get: { idx < slotDraft.count ? slotDraft[idx].end : "" },
                set: { v in patchSlot(idx, end: v) }
            ))
            Button {
                if idx < slotDraft.count { slotDraft.remove(at: idx) }
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(BUColor.inkSecondary)
                    .padding(6)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("이 시간대 삭제")
            Spacer(minLength: 0)
        }
    }

    private func patchSlot(_ idx: Int, label: String? = nil, start: String? = nil, end: String? = nil) {
        guard idx < slotDraft.count else { return }
        let cur = slotDraft[idx]
        slotDraft[idx] = BUShiftSlot(
            label: label ?? cur.label,
            start: start ?? cur.start,
            end: end ?? cur.end
        )
    }

    /// 저장 가능 = 채우기 시작한 항목에 오류가 없고, 유효한 항목이 하나 이상
    private var canSaveSlots: Bool {
        let touched = slotDraft.filter { !$0.label.isEmpty || !$0.start.isEmpty || !$0.end.isEmpty }
        let bad = touched.filter {
            $0.label.trimmingCharacters(in: .whitespaces).isEmpty
                || !buIsValidSlotTime($0.start) || !buIsValidSlotTime($0.end) || $0.start == $0.end
        }
        return bad.isEmpty && !buNormalizeShiftSlots(slotDraft).isEmpty
    }

    private func saveSlots() async {
        guard !busy else { return }
        busy = true
        defer { busy = false }
        do {
            // 웹과 동일하게 정규화 후 저장 — 빈 행이 payroll_settings 에 쌓이지 않게
            let clean = buNormalizeShiftSlots(slotDraft)
            try await repo.setShiftSlots(clean)
            slots = clean
            editingSlots = false
            toast = "근무 시간대를 저장했어요. 직원 신청 화면에 바로 반영돼요."
        } catch {
            toast = "시간대 저장에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }

    private func timeField(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .font(.system(size: 12, weight: .semibold))
            .keyboardType(.numbersAndPunctuation)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .frame(width: 62)
            .padding(.horizontal, 7).padding(.vertical, 5)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1))
    }

    private var validCustom: Bool {
        isHHMM(customStart) && isHHMM(customEnd) && customStart != customEnd
    }

    private func isHHMM(_ s: String) -> Bool {
        guard s.count == 5, s.dropFirst(2).first == ":" else { return false }
        guard let h = Int(s.prefix(2)), let m = Int(s.suffix(2)) else { return false }
        return h >= 0 && h <= 23 && m >= 0 && m <= 59
    }

    private func syncCustomFields(for date: String) {
        let mine = rows.first(where: { $0.mine && $0.workDate == date })
        customStart = mine?.startTime.map { String($0.prefix(5)) } ?? ""
        customEnd = mine?.endTime.map { String($0.prefix(5)) } ?? ""
    }

    private func dayTitle(_ date: String) -> String {
        let mm = Int(date.dropFirst(5).prefix(2)) ?? 0
        let dd = Int(date.suffix(2)) ?? 0
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = cal.timeZone
        let wd = f.date(from: date).map { cal.component(.weekday, from: $0) - 1 } ?? 0
        return "\(mm)월 \(dd)일 (\(WEEKDAYS_KO[max(0, min(6, wd))]))"
    }

    private func move(_ delta: Int) {
        selected = nil
        navigated = true
        period = BUShiftRequest.shiftPeriod(period, by: delta)
    }

    /// 첫 렌더는 기본 마감일(25)로 대상 달을 계산한다. 사장이 정한 마감일이 서버에서 오면
    /// 열린 달이 달라질 수 있어 **한 번 스냅**한다 — 안 하면 직원이 엉뚱한 달에 도착한다.
    private func snapToOpenPeriodIfNeeded() {
        guard !navigated else { return }
        let open = reqWindow.period
        if open != period { selected = nil; period = open }
    }

    // ── 데이터 ──
    private func load() async {
        guard let owner = ownerUserId else { return }
        loading = true
        defer { loading = false }
        do {
            let res = try await repo.shiftAvailability(ownerUserId: owner, period: period)
            // RPC 실패를 "신청 없음"으로 뭉개지 않는다 (2026-07-13 사고 교훈)
            guard res.ok == true else { failed = true; rows = []; subs = []; return }
            failed = false
            rows = (res.rows ?? []).map {
                BUShiftAvailability(memberUserId: $0.memberUserId, name: $0.name, workDate: $0.workDate,
                                    startTime: $0.startTime, endTime: $0.endTime, note: $0.note, mine: $0.mine == true)
            }
            subs = (res.submissions ?? []).map {
                BUShiftSubmission(memberUserId: $0.memberUserId, name: $0.name,
                                  submittedAt: $0.submittedAt, dayCount: $0.dayCount ?? 0, mine: $0.mine == true)
            }
            slots = buNormalizeShiftSlots((res.slots ?? []).map {
                BUShiftSlot(label: $0.label ?? "", start: $0.start ?? "", end: $0.end ?? "")
            })
            if let d = res.deadlineDay {
                deadlineDay = d
                snapToOpenPeriodIfNeeded()   // period 가 바뀌면 .task(id:) 가 다시 로드한다
            }
        } catch {
            failed = true
            rows = []; subs = []
        }
    }

    private func setMyDay(_ date: String, _ start: String?, _ end: String?) async {
        guard let owner = ownerUserId, !busy else { return }
        busy = true
        defer { busy = false }
        do {
            try await repo.upsertMyAvailability(ownerUserId: owner, workDate: date, startTime: start, endTime: end)
            await load()
        } catch {
            toast = "저장에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }

    private func clearMyDay(_ date: String) async {
        guard let owner = ownerUserId, !busy else { return }
        busy = true
        defer { busy = false }
        do {
            try await repo.deleteMyAvailability(ownerUserId: owner, workDate: date)
            await load()
        } catch {
            toast = "취소에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }

    private func submit() async {
        guard let owner = ownerUserId, !busy else { return }
        busy = true
        defer { busy = false }
        do {
            try await repo.submitAvailability(ownerUserId: owner, period: period)
            await load()
            toast = "사장님께 제출했어요."
        } catch {
            toast = "제출에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }

    private func confirmDay(_ date: String, day: BUDayAvailability) async {
        guard let owner = ownerUserId, !busy else { return }
        let timed = day.entries.compactMap { e -> (memberUserId: String, startTime: String, endTime: String)? in
            guard let s = e.startTime, let en = e.endTime else { return nil }
            return (e.memberUserId, s, en)
        }
        guard !timed.isEmpty else {
            toast = "시간을 적은 희망이 없어 근무표에 넣을 수 없어요."
            return
        }
        busy = true
        defer { busy = false }
        do {
            try await repo.confirmAvailability(ownerUserId: owner, workDate: date, entries: timed)
            toast = "\(timed.count)명을 \(Int(date.suffix(2)) ?? 0)일 근무표에 넣었어요. 위 근무 캘린더에 바로 반영돼요."
        } catch {
            toast = "근무표 저장에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }
}
