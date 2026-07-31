//
//  TeamRepository.swift — 팀(초대·직원·근무표·연차) 데이터 계층 (2026-07-12)
//
//  웹 SSOT 미러:
//    apps/web/app/lib/components/surfaces/TeamSurface.tsx   (사장: 목록·근무표·연차 승인)
//    apps/web/app/lib/components/InviteLinkSection.tsx       (초대 생성 — store_invites insert)
//    apps/web/app/lib/components/profile/StoreConnectCard.tsx (직원: 코드 입력·받은 초대)
//
//  백엔드 계약:
//    RPC  get_store_members()          — 사장의 연결 직원 목록 (20260708_000003, _000005 확장)
//    RPC  accept_store_invite(p_code)  — 초대 수락 (20260708_000001, 20260712_000001 지정검증 확장)
//    RPC  my_pending_invites()         — 내 이메일로 온 지정 초대 (20260712_000001)
//    TBL  store_invites / store_members / staff_schedule_rules / leave_requests
//
//  ⚠️ 이 기능들은 해당 마이그레이션이 원격(prod) DB 에 적용돼야 동작한다.
//    미적용 환경에선 호출이 throw → 뷰가 정직한 빈 상태/오류 안내로 처리.
//

import Foundation
import Supabase
import FoundOneCore   // BUShiftSlot — 근무 시간대 저장 (2026-07-30)

// ─── DTO ─────────────────────────────────────────────────────────────

public struct TeamMember: Decodable, Sendable, Identifiable, Equatable {
    public let memberUserId: UUID
    public let name: String
    public let role: String
    public let joinedAt: String?
    public let hireDate: String?
    /// 시급(원) — 사장 설정. RLS 상 직원 본인 행만 조회 가능 (동료 시급 비노출).
    public let hourlyWage: Int?
    /// 고용형태 part_time|full_time|contract (2026-07-13)
    public let employmentType: String?
    /// 업무 직무 key 배열 (JobDutyRegistry 로 라벨 해석)
    public let jobDuties: [String]
    /// 퇴사일. nil = 재직 중. (2026-07-15 — 퇴사는 행 삭제가 아니라 상태 전환: 근로기록 법정 보존)
    public let leftAt: String?
    /// 퇴직금/최종 지급액(원). 정산 시 명시했을 때만.
    public let severanceAmount: Int?
    /// 금품청산 기한 = 퇴사일 + 14일 (근로기준법 §36). 서버 RPC 가 계산해 내려준다. 재직자는 nil.
    public let settleDueAt: String?

    public var id: UUID { memberUserId }
    /// 퇴사·미정산 여부 — 정산 완료(settled_at)된 사람은 RPC 가 아예 안 내려주므로 여기 오지 않는다.
    public var hasLeft: Bool { leftAt != nil }

    enum CodingKeys: String, CodingKey {
        case memberUserId = "member_user_id"
        case name, role
        case joinedAt = "joined_at"
        case hireDate = "hire_date"
        case hourlyWage = "hourly_wage"
        case employmentType = "employment_type"
        case jobDuties = "job_duties"
        case leftAt = "left_at"
        case severanceAmount = "severance_amount"
        case settleDueAt = "settle_due_at"
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        memberUserId = try c.decode(UUID.self, forKey: .memberUserId)
        name = try c.decode(String.self, forKey: .name)
        role = try c.decode(String.self, forKey: .role)
        joinedAt = try c.decodeIfPresent(String.self, forKey: .joinedAt)
        hireDate = try c.decodeIfPresent(String.self, forKey: .hireDate)
        // 마이그레이션 미적용 환경(키 부재)에서도 디코딩 안전
        hourlyWage = try c.decodeIfPresent(Int.self, forKey: .hourlyWage)
        employmentType = try c.decodeIfPresent(String.self, forKey: .employmentType)
        jobDuties = (try? c.decodeIfPresent([String].self, forKey: .jobDuties)) ?? []
        leftAt = try c.decodeIfPresent(String.self, forKey: .leftAt)
        severanceAmount = try c.decodeIfPresent(Int.self, forKey: .severanceAmount)
        settleDueAt = try c.decodeIfPresent(String.self, forKey: .settleDueAt)
    }
}

public struct TeamLeaveRequest: Decodable, Sendable, Identifiable, Equatable {
    public let id: UUID
    public let memberUserId: UUID
    public let leaveType: String   // annual | half | sick | other
    public let startDate: String   // YYYY-MM-DD
    public let endDate: String
    public let reason: String?
    public let status: String      // pending | approved | rejected

    enum CodingKeys: String, CodingKey {
        case id
        case memberUserId = "member_user_id"
        case leaveType = "leave_type"
        case startDate = "start_date"
        case endDate = "end_date"
        case reason, status
    }
}

/// 추가 수당 신청 (2026-07-13, 웹 allowance_requests 미러)
public struct TeamAllowanceRequest: Decodable, Sendable, Identifiable, Equatable {
    public let id: UUID
    public let memberUserId: UUID
    public let workDate: String        // YYYY-MM-DD
    public let allowanceType: String   // overtime | night | holiday | other
    public let minutes: Int
    public let reason: String?
    public let status: String          // pending | approved | rejected

    enum CodingKeys: String, CodingKey {
        case id
        case memberUserId = "member_user_id"
        case workDate = "work_date"
        case allowanceType = "allowance_type"
        case minutes, reason, status
    }
}

public struct TeamScheduleRule: Decodable, Sendable, Identifiable, Equatable {
    public let id: UUID
    public let memberUserId: UUID
    public let weekday: Int        // 0=일 … 6=토 (웹 WEEK_KO 와 동일)
    public let startTime: String   // "09:00:00"
    public let endTime: String
    public let active: Bool
    /// 적용 종료일. nil = 계속 (2026-07-31, 마이그레이션 20260731_000001 미적용 환경에서도 안전)
    public let effectiveUntil: String?

    enum CodingKeys: String, CodingKey {
        case id
        case memberUserId = "member_user_id"
        case weekday
        case startTime = "start_time"
        case endTime = "end_time"
        case active
        case effectiveUntil = "effective_until"
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(UUID.self, forKey: .id)
        memberUserId = try c.decode(UUID.self, forKey: .memberUserId)
        weekday = try c.decode(Int.self, forKey: .weekday)
        startTime = try c.decode(String.self, forKey: .startTime)
        endTime = try c.decode(String.self, forKey: .endTime)
        active = try c.decode(Bool.self, forKey: .active)
        effectiveUntil = try c.decodeIfPresent(String.self, forKey: .effectiveUntil)
    }
}

public struct TeamPendingInvite: Decodable, Sendable, Identifiable, Equatable {
    public let inviteCode: String
    public let role: String
    public let storeName: String
    public let expiresAt: String?

    public var id: String { inviteCode }

    enum CodingKeys: String, CodingKey {
        case inviteCode = "invite_code"
        case role
        case storeName = "store_name"
        case expiresAt = "expires_at"
    }
}

public struct InviteRPCResult: Decodable, Sendable {
    public let ok: Bool
    public let reason: String?
}

// ─── Repository ──────────────────────────────────────────────────────

public actor TeamRepository {

    private let client: SupabaseClient

    public init(supabase: SupabaseClient) {
        self.client = supabase
    }

    private func uid() async throws -> UUID {
        try await client.auth.session.user.id
    }

    /// 로그인한 사장 자신의 id — 사장 화면이 owner_user_id 로 써야 할 값
    public func currentUserId() async throws -> UUID {
        try await uid()
    }

    // ── 직원 목록 (사장) ──
    public func members() async throws -> [TeamMember] {
        try await client.rpc("get_store_members").execute().value
    }

    // ── 초대 생성 (사장) — 코드 반환. invitedEmail 지정 시 그 계정만 수락 가능. ──
    public func createInvite(invitedEmail: String?) async throws -> String {
        struct InviteInsert: Encodable {
            let owner_user_id: UUID
            let invite_code: String
            let role: String
            let invited_email: String?
        }
        let code = Self.generateCode()
        let email = invitedEmail?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let dto = InviteInsert(
            owner_user_id: try await uid(),
            invite_code: code,
            role: "staff",
            invited_email: (email?.contains("@") == true) ? email : nil
        )
        try await client.from("store_invites").insert(dto).execute()
        return code
    }

    private static func generateCode() -> String {
        // 웹 generateInviteCode 미러(2026-07-15 보안): Crockford base32(혼동 문자 I·L·O·U 제외)
        //   16자 = 80비트. randomElement() 는 SystemRandomNumberGenerator(암호학적 안전) 사용.
        //   종전 8자(36^8≈41비트)는 만료 전 열거 여지가 있어 강화.
        let chars = Array("0123456789ABCDEFGHJKMNPQRSTVWXYZ")
        return String((0..<16).map { _ in chars.randomElement()! })
    }

    // ── 초대 수락 (직원 — 코드 입력) ──
    public func acceptInvite(code: String) async throws -> InviteRPCResult {
        struct Params: Encodable { let p_code: String }
        return try await client
            .rpc("accept_store_invite", params: Params(p_code: code.trimmingCharacters(in: .whitespaces)))
            .execute().value
    }

    // ── 받은 초대 (직원 — 이메일 지정 초대) ──
    //   RPC 미배포(마이그레이션 미적용) 환경에선 throw → 호출부가 빈 목록 처리.
    public func pendingInvites() async throws -> [TeamPendingInvite] {
        struct Response: Decodable {
            let ok: Bool
            let invites: [TeamPendingInvite]?
        }
        let res: Response = try await client.rpc("my_pending_invites").execute().value
        return res.ok ? (res.invites ?? []) : []
    }

    // ── 연차 신청 목록 (사장 — RLS 가 내 가게 범위로 한정) ──
    public func leaveRequests(limit: Int = 30) async throws -> [TeamLeaveRequest] {
        try await client
            .from("leave_requests")
            .select("id, member_user_id, leave_type, start_date, end_date, reason, status")
            .order("created_at", ascending: false)
            .limit(limit)
            .execute().value
    }

    /// 연차 잔여 계산용 원장 — 승인된 연차·반차만, 최근 1년+ 전부 (2026-07-28).
    ///  ⚠️ 목록 표시용 leaveRequests(limit:)·myLeaves(limit:) 로 사용일수를 세면 안 된다.
    ///     limit 로 잘린 목록으로 세면 사용일수가 적게 나와 **잔여가 부풀려진다**(가짜 숫자).
    ///     연차 산정 구간은 최대 1년 전부터라 400일 컷오프면 입사일·회계연도 기준 모두 덮는다.
    public func leaveLedger(memberUserId: UUID? = nil) async throws -> [TeamLeaveRequest] {
        let cutoff = Self.kstDay(offsetDays: -400)
        var q = client
            .from("leave_requests")
            .select("id, member_user_id, leave_type, start_date, end_date, reason, status")
            .eq("status", value: "approved")
            .in("leave_type", values: ["annual", "half"])
            .gte("end_date", value: cutoff)
        if let memberUserId {
            q = q.eq("member_user_id", value: memberUserId.uuidString)
        }
        return try await q.order("start_date", ascending: false).limit(1000).execute().value
    }

    // ══ 희망 근무 신청 (2026-07-30) ══════════════════════════════════
    //   웹 미러: apps/web/app/lib/components/team/ShiftAvailabilityCalendar.tsx
    //   조회는 RPC 하나로 (동료 이름을 RLS 로 직접 못 읽는다 — RPC 가 근무 필드만 내려준다).

    public struct ShiftAvailabilityPayload: Decodable, Sendable {
        public let ok: Bool?
        public let period: String?
        public let deadlineDay: Int?
        public let rows: [Row]?
        public let submissions: [Sub]?
        /// 사장이 정한 근무 시간대 — 직원 신청 버튼이 이걸로 그려진다
        public let slots: [Slot]?

        public struct Slot: Decodable, Sendable {
            public let label: String?
            public let start: String?
            public let end: String?
        }

        public struct Row: Decodable, Sendable {
            public let memberUserId: String
            public let name: String
            public let workDate: String
            public let startTime: String?
            public let endTime: String?
            public let note: String?
            public let mine: Bool?
            enum CodingKeys: String, CodingKey {
                case memberUserId = "member_user_id"
                case name
                case workDate = "work_date"
                case startTime = "start_time"
                case endTime = "end_time"
                case note, mine
            }
        }
        public struct Sub: Decodable, Sendable {
            public let memberUserId: String
            public let name: String
            public let submittedAt: String?
            public let dayCount: Int?
            public let mine: Bool?
            enum CodingKeys: String, CodingKey {
                case memberUserId = "member_user_id"
                case name
                case submittedAt = "submitted_at"
                case dayCount = "day_count"
                case mine
            }
        }
        enum CodingKeys: String, CodingKey {
            case ok, period, rows, submissions, slots
            case deadlineDay = "deadline_day"
        }
    }

    /// 희망 근무 취합 — 사장·직원 공용. 권한은 RPC 안에서 검사한다.
    public func shiftAvailability(ownerUserId: UUID, period: String) async throws -> ShiftAvailabilityPayload {
        struct Params: Encodable { let p_owner: String; let p_period: String }
        return try await client
            .rpc("get_shift_availability", params: Params(p_owner: ownerUserId.uuidString, p_period: period))
            .execute().value
    }

    /// 내 희망 저장 (1일 1구간). start/end 가 nil 이면 "시간 무관".
    public func upsertMyAvailability(
        ownerUserId: UUID, workDate: String, startTime: String?, endTime: String?
    ) async throws {
        let uid = try await client.auth.session.user.id
        struct Row: Encodable {
            let owner_user_id: String
            let member_user_id: String
            let work_date: String
            let start_time: String?
            let end_time: String?
            let updated_at: String
        }
        try await client.from("shift_availability")
            .upsert(Row(
                owner_user_id: ownerUserId.uuidString,
                member_user_id: uid.uuidString,
                work_date: workDate,
                start_time: startTime,
                end_time: endTime,
                updated_at: ISO8601DateFormatter().string(from: Date())
            ), onConflict: "member_user_id,work_date")
            .execute()
    }

    public func deleteMyAvailability(workDate: String) async throws {
        let uid = try await client.auth.session.user.id
        try await client.from("shift_availability")
            .delete()
            .eq("member_user_id", value: uid.uuidString)
            .eq("work_date", value: workDate)
            .execute()
    }

    /// 제출 표시 — 희망 0건과 "아직 안 냄"을 구분하기 위한 별도 기록
    public func submitAvailability(ownerUserId: UUID, period: String) async throws {
        let uid = try await client.auth.session.user.id
        struct Row: Encodable {
            let owner_user_id: String
            let member_user_id: String
            let period: String
            let submitted_at: String
        }
        try await client.from("shift_availability_submissions")
            .upsert(Row(
                owner_user_id: ownerUserId.uuidString,
                member_user_id: uid.uuidString,
                period: period,
                submitted_at: ISO8601DateFormatter().string(from: Date())
            ), onConflict: "member_user_id,period")
            .execute()
    }

    /// 사장 확정 — 희망을 근무표(staff_schedules)로. 시간이 있는 희망만 넣는다.
    public func confirmAvailability(
        ownerUserId: UUID, workDate: String,
        entries: [(memberUserId: String, startTime: String, endTime: String)]
    ) async throws {
        guard !entries.isEmpty else { return }
        struct Row: Encodable {
            let owner_user_id: String
            let member_user_id: String
            let work_date: String
            let start_time: String
            let end_time: String
            let is_off: Bool
        }
        let rows = entries.map {
            Row(owner_user_id: ownerUserId.uuidString, member_user_id: $0.memberUserId,
                work_date: workDate, start_time: $0.startTime, end_time: $0.endTime, is_off: false)
        }
        try await client.from("staff_schedules")
            .upsert(rows, onConflict: "owner_user_id,member_user_id,work_date")
            .execute()
    }

    /// 근무 시간대 저장 (사장) — 업장마다 운영 시간이 달라 사장이 정한다 (2026-07-30)
    public func setShiftSlots(_ slots: [BUShiftSlot]) async throws {
        let uid = try await client.auth.session.user.id
        struct Row: Encodable { let owner_user_id: String; let shift_slots: [BUShiftSlot] }
        try await client.from("payroll_settings")
            .upsert(Row(owner_user_id: uid.uuidString, shift_slots: buNormalizeShiftSlots(slots)),
                    onConflict: "owner_user_id")
            .execute()
    }

    /// 사장 근무 캘린더 힌트용 — 보는 달의 희망 신청 (member, date 만).
    ///  마이그레이션(20260730_000001) 미적용이면 throw → 호출측이 빈 배열 폴백(힌트만 생략).
    public struct WishHint: Decodable, Sendable {
        public let memberUserId: UUID
        public let workDate: String
        enum CodingKeys: String, CodingKey {
            case memberUserId = "member_user_id"
            case workDate = "work_date"
        }
    }

    public func ownerMonthWishes(monthStart: String, monthEnd: String) async throws -> [WishHint] {
        let owner = try await uid()
        return try await client
            .from("shift_availability")
            .select("member_user_id, work_date")
            .eq("owner_user_id", value: owner.uuidString)
            .gte("work_date", value: monthStart)
            .lte("work_date", value: monthEnd)
            .execute().value
    }

    /// 희망 신청 마감일 (사장)
    public func setShiftDeadline(_ day: Int) async throws {
        let uid = try await client.auth.session.user.id
        struct Row: Encodable { let owner_user_id: String; let shift_request_deadline_day: Int }
        try await client.from("payroll_settings")
            .upsert(Row(owner_user_id: uid.uuidString, shift_request_deadline_day: day), onConflict: "owner_user_id")
            .execute()
    }

    // ── 연차 승인/반려 (사장) ──
    public func decideLeave(id: UUID, approved: Bool) async throws {
        struct Patch: Encodable {
            let status: String
            let decided_at: String
        }
        let iso = ISO8601DateFormatter().string(from: Date())
        try await client
            .from("leave_requests")
            .update(Patch(status: approved ? "approved" : "rejected", decided_at: iso))
            .eq("id", value: id.uuidString)
            .execute()
    }

    // ── 추가 수당 신청 목록 (사장 — RLS 가 내 가게 범위로 한정) ──
    public func allowanceRequests(limit: Int = 40) async throws -> [TeamAllowanceRequest] {
        try await client
            .from("allowance_requests")
            .select("id, member_user_id, work_date, allowance_type, minutes, reason, status")
            .order("created_at", ascending: false)
            .limit(limit)
            .execute().value
    }

    // ── 추가 수당 승인/반려 (사장) ──
    public func decideAllowance(id: UUID, approved: Bool) async throws {
        struct Patch: Encodable {
            let status: String
            let decided_at: String
        }
        let iso = ISO8601DateFormatter().string(from: Date())
        try await client
            .from("allowance_requests")
            .update(Patch(status: approved ? "approved" : "rejected", decided_at: iso))
            .eq("id", value: id.uuidString)
            .execute()
    }

    // ── 근무표 규칙 (사장) ──
    public func scheduleRules() async throws -> [TeamScheduleRule] {
        try await client
            .from("staff_schedule_rules")
            .select("id, member_user_id, weekday, start_time, end_time, active, effective_until")
            .eq("active", value: true)
            .execute().value
    }

    // 웹 saveRules 미러: 해당 직원의 기존 규칙 전체 삭제 → 새 요일 세트 insert.
    //   (웹 후속과제와 동일하게 비원자적 — RPC 화는 웹과 함께 진행.)
    public func saveRules(memberId: UUID, weekdays: Set<Int>, start: String, end: String, effectiveUntil: String? = nil) async throws {
        struct RuleInsert: Encodable {
            let owner_user_id: UUID
            let member_user_id: UUID
            let weekday: Int
            let start_time: String
            let end_time: String
            let active: Bool
            let effective_until: String?
        }
        let owner = try await uid()
        try await client
            .from("staff_schedule_rules")
            .delete()
            .eq("member_user_id", value: memberId.uuidString)
            .execute()
        guard !weekdays.isEmpty else { return }
        let rows = weekdays.sorted().map {
            RuleInsert(owner_user_id: owner, member_user_id: memberId,
                       weekday: $0, start_time: start, end_time: end, active: true,
                       effective_until: effectiveUntil)
        }
        try await client.from("staff_schedule_rules").insert(rows).execute()
    }

    // ── 시급 설정 (사장 — 마이그레이션 20260713_000001) ──
    public func setHourlyWage(memberId: UUID, wage: Int) async throws {
        struct Patch: Encodable { let hourly_wage: Int }
        try await client
            .from("store_members")
            .update(Patch(hourly_wage: wage))
            .eq("member_user_id", value: memberId.uuidString)
            .execute()
    }

    // ── 특정 직원의 이번 달 출근 기록 (사장 — att_owner_read RLS) ──
    public func memberAttendance(memberId: UUID, monthStart: String, monthEnd: String) async throws -> [StaffAttendance] {
        try await client
            .from("attendance_records")
            .select("id, work_date, clock_in_at, clock_out_at")
            .eq("member_user_id", value: memberId.uuidString)
            .gte("work_date", value: monthStart)
            .lte("work_date", value: monthEnd)
            .order("work_date", ascending: false)
            .execute().value
    }

    // ── 오늘 전 직원 출퇴근 (사장 — 직원별 "출근함/미출근" 배지용, att_owner_read RLS) 2026-07-14 ──
    public func ownerTodayAttendance() async throws -> [OwnerTodayAttendance] {
        try await client
            .from("attendance_records")
            .select("member_user_id, clock_in_at, clock_out_at")
            .eq("owner_user_id", value: try await uid().uuidString)
            .eq("work_date", value: Self.kstToday())
            .execute().value
    }

    // ── 사장 근무 캘린더용 월별 조회 (2026-07-28) — 전 직원 예외·출퇴근 ──
    //    사장 화면은 예외를 "오늘 이후"만 들고 있어 지난달 캘린더가 부정확해진다 → 월 범위 전용 조회.

    public func ownerMonthExceptions(monthStart: String, monthEnd: String) async throws -> [OwnerScheduleException] {
        try await client
            .from("staff_schedules")
            .select("member_user_id, work_date, start_time, end_time, is_off, note")
            .eq("owner_user_id", value: try await uid().uuidString)
            .gte("work_date", value: monthStart)
            .lte("work_date", value: monthEnd)
            .execute().value
    }

    /// 캘린더용 — 그 달과 **기간이 겹치는** 연차만 (웹 OwnerScheduleCalendar 와 동일 범위).
    ///   종전엔 최근 200건을 가져와 오래된 달의 연차를 놓칠 수 있었다 (2026-07-28 냉정 리뷰).
    public func ownerMonthLeaves(monthStart: String, monthEnd: String) async throws -> [TeamLeaveRequest] {
        try await client
            .from("leave_requests")
            .select("id, member_user_id, leave_type, start_date, end_date, reason, status")
            .eq("owner_user_id", value: try await uid().uuidString)
            .lte("start_date", value: monthEnd)
            .gte("end_date", value: monthStart)
            .execute().value
    }

    public func ownerMonthAttendance(monthStart: String, monthEnd: String) async throws -> [OwnerMonthAttendance] {
        try await client
            .from("attendance_records")
            .select("member_user_id, work_date, clock_in_at")
            .eq("owner_user_id", value: try await uid().uuidString)
            .gte("work_date", value: monthStart)
            .lte("work_date", value: monthEnd)
            .execute().value
    }

    /// KST 기준 오늘 (YYYY-MM-DD) — work_date 는 KST 자정 기준으로 저장/조회
    static func kstToday() -> String { kstDay(offsetDays: 0) }

    /// KST 기준 오늘 ± n일 (YYYY-MM-DD)
    static func kstDay(offsetDays: Int) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        let base = cal.date(byAdding: .day, value: offsetDays, to: Date()) ?? Date()
        let c = cal.dateComponents([.year, .month, .day], from: base)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    // ── 입사일 지정 (사장 — 근속 계산 기준) ──
    public func setHireDate(memberId: UUID, date: String) async throws {
        struct Patch: Encodable { let hire_date: String }
        try await client
            .from("store_members")
            .update(Patch(hire_date: date))
            .eq("member_user_id", value: memberId.uuidString)
            .execute()
    }

    // ── 고용형태·직무 설정 (사장 — 20260713_000006) ──
    // ── 급여일·퇴사 정산 (2026-07-15, 마이그레이션 20260715_000002) — 웹 TeamSurface 와 동일 계약 ──

    /// 급여일 조회 — 미설정이면 nil (그 경우 급여일 카드를 숨긴다).
    // ── 연차 부여 기준 (2026-07-28) — 일수는 근로기준법 제60조 계산이라 저장하지 않는다 ──
    public func leaveBasis() async throws -> String? {
        struct Row: Decodable { let leave_basis: String? }
        let rows: [Row] = try await client
            .from("payroll_settings")
            .select("leave_basis")
            .eq("owner_user_id", value: try await uid().uuidString)
            .limit(1)
            .execute().value
        return rows.first?.leave_basis
    }

    public func setLeaveBasis(_ basis: String) async throws {
        struct Row: Encodable { let owner_user_id: String; let leave_basis: String; let updated_at: String }
        try await client
            .from("payroll_settings")
            .upsert(Row(owner_user_id: try await uid().uuidString, leave_basis: basis,
                        updated_at: ISO8601DateFormatter().string(from: Date())),
                    onConflict: "owner_user_id")
            .execute()
    }

    public func payday() async throws -> Int? {
        struct Row: Decodable { let payday_day: Int }
        let rows: [Row] = try await client
            .from("payroll_settings")
            .select("payday_day")
            .eq("owner_user_id", value: try await uid().uuidString)
            .limit(1)
            .execute().value
        return rows.first?.payday_day
    }

    /// 급여일 설정(1~31). 31 = 말일 의도 — 실제 발화일은 서버 cron 이 그 달 말일로 보정한다.
    public func setPayday(_ day: Int) async throws {
        struct Row: Encodable { let owner_user_id: String; let payday_day: Int; let updated_at: String }
        try await client.from("payroll_settings")
            .upsert(Row(owner_user_id: try await uid().uuidString, payday_day: day,
                        updated_at: ISO8601DateFormatter().string(from: Date())),
                    onConflict: "owner_user_id")
            .execute()
    }

    /// 이번 달 "월급 보내셨습니까?" 응답 — nil = 무응답(서버가 3일 간격 재알림).
    public func payrollPaid(period: String) async throws -> Bool? {
        struct Row: Decodable { let paid: Bool }
        let rows: [Row] = try await client
            .from("payroll_confirmations")
            .select("paid")
            .eq("owner_user_id", value: try await uid().uuidString)
            .eq("period", value: period)
            .limit(1)
            .execute().value
        return rows.first?.paid
    }

    /// 지급 확인 응답. true=보냄(재알림 중단) / false=아직(재알림 계속).
    public func confirmPayroll(period: String, paid: Bool) async throws {
        struct Row: Encodable { let owner_user_id: String; let period: String; let paid: Bool; let confirmed_at: String }
        try await client.from("payroll_confirmations")
            .upsert(Row(owner_user_id: try await uid().uuidString, period: period, paid: paid,
                        confirmed_at: ISO8601DateFormatter().string(from: Date())),
                    onConflict: "owner_user_id,period")
            .execute()
    }

    /// 퇴사 처리 — 행을 지우지 않고 left_at 만 찍는다(근태·연차 기록 법정 보존).
    public func markLeft(memberId: UUID) async throws {
        struct Patch: Encodable { let left_at: String }
        try await client.from("store_members")
            .update(Patch(left_at: ISO8601DateFormatter().string(from: Date())))
            .eq("owner_user_id", value: try await uid().uuidString)
            .eq("member_user_id", value: memberId.uuidString)
            .execute()
    }

    /// 정산 완료 — 명부에서 사라진다(RPC 가 settled_at 있는 행을 제외). 금액은 입력했을 때만 기록.
    public func markSettled(memberId: UUID, severance: Int?) async throws {
        struct Patch: Encodable { let settled_at: String; let severance_amount: Int? }
        try await client.from("store_members")
            .update(Patch(settled_at: ISO8601DateFormatter().string(from: Date()), severance_amount: severance))
            .eq("owner_user_id", value: try await uid().uuidString)
            .eq("member_user_id", value: memberId.uuidString)
            .execute()
    }

    /// 직원 → 사장 "급여가 안 들어왔어요". DEFINER RPC 경유(직접 INSERT 정책 없음 = 위조 방지)이며
    /// RPC 가 사장에게 푸시+인앱 알림까지 보낸다. 같은 달 재문의는 서버가 duplicate 로 조용히 성공 처리.
    @discardableResult
    public func reportPayrollUnpaid(period: String) async throws -> Bool {
        struct Params: Encodable { let p_period: String }
        struct Result: Decodable { let ok: Bool?; let duplicate: Bool? }
        let r: Result = try await client
            .rpc("report_payroll_unpaid", params: Params(p_period: period))
            .execute().value
        return r.ok == true
    }

    public func setMemberJob(memberId: UUID, employmentType: String?, jobDuties: [String]) async throws {
        struct Patch: Encodable { let employment_type: String?; let job_duties: [String] }
        try await client
            .from("store_members")
            .update(Patch(employment_type: employmentType, job_duties: jobDuties))
            .eq("member_user_id", value: memberId.uuidString)
            .execute()
    }
}

// ═══ 직원측 (웹 StaffDashboard.tsx 미러) ═══════════════════════════════

public struct StaffStoreContext: Decodable, Sendable {
    public let connected: Bool
    public let ownerUserId: UUID?
    public let role: String?
    public let storeName: String?
    public let joinedAt: String?
    public let hireDate: String?
    public let hourlyWage: Int?   // 본인 시급 — 근로 권리 자가진단용 (2026-07-13, 마이그레이션 20260713_000002)
    public let employmentType: String?   // 고용형태 (2026-07-13, 20260713_000006)
    public let jobDuties: [String]        // 업무 직무 key 배열
    /// 사장이 정한 급여일(1~31). nil = 미설정 → 급여일 카드 자체를 숨긴다(가짜 정보 금지).
    public let paydayDay: Int?            // (2026-07-15, 20260715_000002)
    /// 내 퇴사일. nil = 재직 중.
    public let leftAt: String?
    /// 연차 부여 기준 (사장 설정) — 없으면 입사일 기준 (2026-07-28, 20260728_000003)
    public let leaveBasis: String?
    /// 재직 인원 — 연차 5인 기준선 판정용
    public let staffHeadcount: Int?

    enum CodingKeys: String, CodingKey {
        case connected
        case ownerUserId = "owner_user_id"
        case role
        case storeName = "store_name"
        case joinedAt = "joined_at"
        case hireDate = "hire_date"
        case hourlyWage = "hourly_wage"
        case employmentType = "employment_type"
        case jobDuties = "job_duties"
        case paydayDay = "payday_day"
        case leaveBasis = "leave_basis"
        case staffHeadcount = "staff_headcount"
        case leftAt = "left_at"
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        connected = try c.decode(Bool.self, forKey: .connected)
        ownerUserId = try c.decodeIfPresent(UUID.self, forKey: .ownerUserId)
        role = try c.decodeIfPresent(String.self, forKey: .role)
        storeName = try c.decodeIfPresent(String.self, forKey: .storeName)
        joinedAt = try c.decodeIfPresent(String.self, forKey: .joinedAt)
        hireDate = try c.decodeIfPresent(String.self, forKey: .hireDate)
        // 마이그레이션 미적용 환경(키 부재)에서도 안전
        hourlyWage = try c.decodeIfPresent(Int.self, forKey: .hourlyWage)
        employmentType = try c.decodeIfPresent(String.self, forKey: .employmentType)
        jobDuties = (try? c.decodeIfPresent([String].self, forKey: .jobDuties)) ?? []
        paydayDay = try c.decodeIfPresent(Int.self, forKey: .paydayDay)
        leftAt = try c.decodeIfPresent(String.self, forKey: .leftAt)
        // 20260728_000003 미적용 환경에서는 키가 없다 → nil 로 두고 화면이 스스로 숨긴다
        leaveBasis = try c.decodeIfPresent(String.self, forKey: .leaveBasis)
        staffHeadcount = try c.decodeIfPresent(Int.self, forKey: .staffHeadcount)
    }
}

public struct StaffAttendance: Decodable, Sendable, Identifiable, Equatable {
    public let id: UUID
    public let workDate: String       // YYYY-MM-DD
    public let clockInAt: String      // ISO timestamptz
    public let clockOutAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case workDate = "work_date"
        case clockInAt = "clock_in_at"
        case clockOutAt = "clock_out_at"
    }
}

/// 사장 — 오늘 전 직원 출퇴근 (출근여부 배지용, member_user_id 포함). 2026-07-14
public struct OwnerTodayAttendance: Decodable, Sendable, Equatable {
    public let memberUserId: UUID
    public let clockInAt: String
    public let clockOutAt: String?

    enum CodingKeys: String, CodingKey {
        case memberUserId = "member_user_id"
        case clockInAt = "clock_in_at"
        case clockOutAt = "clock_out_at"
    }
}

/// 날짜별 예외(override) — is_off 면 그 날 휴무, 아니면 그 날만 다른 시간 (웹 Schedule 미러)
/// 사장 캘린더용 — 직원 id 를 포함한 근무 예외 (staff_schedules)
public struct OwnerScheduleException: Decodable, Sendable, Equatable {
    public let memberUserId: UUID
    public let workDate: String
    public let startTime: String?
    public let endTime: String?
    public let isOff: Bool?
    public let note: String?

    enum CodingKeys: String, CodingKey {
        case memberUserId = "member_user_id"
        case workDate = "work_date"
        case startTime = "start_time"
        case endTime = "end_time"
        case isOff = "is_off"
        case note
    }
}

/// 사장 캘린더용 — 월별 전 직원 출근 기록
public struct OwnerMonthAttendance: Decodable, Sendable, Equatable {
    public let memberUserId: UUID
    public let workDate: String
    public let clockInAt: String?

    enum CodingKeys: String, CodingKey {
        case memberUserId = "member_user_id"
        case workDate = "work_date"
        case clockInAt = "clock_in_at"
    }
}

public struct StaffScheduleException: Decodable, Sendable, Equatable {
    public let workDate: String
    public let startTime: String?
    public let endTime: String?
    public let note: String?
    public let isOff: Bool?

    enum CodingKeys: String, CodingKey {
        case workDate = "work_date"
        case startTime = "start_time"
        case endTime = "end_time"
        case note
        case isOff = "is_off"
    }
}

public extension TeamRepository {

    /// 직원의 가게 컨텍스트 (SECURITY DEFINER RPC — user_store_data 는 owner 전용 RLS 우회)
    func staffContext() async throws -> StaffStoreContext {
        try await client.rpc("get_staff_store_context").execute().value
    }

    /// 내 주간 반복 규칙 (RLS: 본인 것만)
    func myScheduleRules() async throws -> [TeamScheduleRule] {
        let uid = try await client.auth.session.user.id
        return try await client
            .from("staff_schedule_rules")
            .select("id, member_user_id, weekday, start_time, end_time, active, effective_until")
            .eq("member_user_id", value: uid.uuidString)
            .eq("active", value: true)
            .execute().value
    }

    /// 내 날짜 예외 (해당 월)
    func myScheduleExceptions(monthStart: String, monthEnd: String) async throws -> [StaffScheduleException] {
        let uid = try await client.auth.session.user.id
        return try await client
            .from("staff_schedules")
            .select("work_date, start_time, end_time, note, is_off")
            .eq("member_user_id", value: uid.uuidString)
            .gte("work_date", value: monthStart)
            .lte("work_date", value: monthEnd)
            .execute().value
    }

    /// 내 출근 기록 (해당 월)
    func myAttendance(monthStart: String, monthEnd: String) async throws -> [StaffAttendance] {
        let uid = try await client.auth.session.user.id
        return try await client
            .from("attendance_records")
            .select("id, work_date, clock_in_at, clock_out_at")
            .eq("member_user_id", value: uid.uuidString)
            .gte("work_date", value: monthStart)
            .lte("work_date", value: monthEnd)
            .execute().value
    }

    /// 내 연차 신청 목록
    func myLeaves(limit: Int = 12) async throws -> [TeamLeaveRequest] {
        let uid = try await client.auth.session.user.id
        return try await client
            .from("leave_requests")
            .select("id, member_user_id, leave_type, start_date, end_date, reason, status")
            .eq("member_user_id", value: uid.uuidString)
            .order("start_date", ascending: false)
            .limit(limit)
            .execute().value
    }

    /// 내 연차 잔여 계산용 원장 — 승인된 연차·반차만 (myLeaves 는 표시용이라 limit 로 잘린다)
    func myLeaveLedger() async throws -> [TeamLeaveRequest] {
        let uid = try await client.auth.session.user.id
        return try await leaveLedger(memberUserId: uid)
    }

    /// 출근 — clock_in_at 은 DB default now() (웹 미러)
    func clockIn(ownerUserId: UUID, workDate: String) async throws -> StaffAttendance {
        struct Insert: Encodable {
            let owner_user_id: UUID
            let member_user_id: UUID
            let work_date: String
        }
        let uid = try await client.auth.session.user.id
        return try await client
            .from("attendance_records")
            .insert(Insert(owner_user_id: ownerUserId, member_user_id: uid, work_date: workDate))
            .select("id, work_date, clock_in_at, clock_out_at")
            .single()
            .execute().value
    }

    /// 퇴근
    func clockOut(attendanceId: UUID) async throws {
        struct Patch: Encodable { let clock_out_at: String }
        let iso = ISO8601DateFormatter().string(from: Date())
        try await client
            .from("attendance_records")
            .update(Patch(clock_out_at: iso))
            .eq("id", value: attendanceId.uuidString)
            .execute()
    }

    /// 연차 신청 (pending 으로 insert — 승인/반려는 사장)
    func submitLeave(ownerUserId: UUID, type: String, startDate: String, endDate: String, reason: String?) async throws {
        struct Insert: Encodable {
            let owner_user_id: UUID
            let member_user_id: UUID
            let leave_type: String
            let start_date: String
            let end_date: String
            let reason: String?
        }
        let uid = try await client.auth.session.user.id
        try await client
            .from("leave_requests")
            .insert(Insert(owner_user_id: ownerUserId, member_user_id: uid,
                           leave_type: type, start_date: startDate, end_date: endDate,
                           reason: (reason?.isEmpty == true) ? nil : reason))
            .execute()
    }

    /// 연차 신청 취소 (pending 본인 것 — RLS)
    func cancelLeave(id: UUID) async throws {
        try await client
            .from("leave_requests")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    /// 내 추가 수당 신청 목록 (2026-07-13)
    func myAllowances(limit: Int = 20) async throws -> [TeamAllowanceRequest] {
        let uid = try await client.auth.session.user.id
        return try await client
            .from("allowance_requests")
            .select("id, member_user_id, work_date, allowance_type, minutes, reason, status")
            .eq("member_user_id", value: uid.uuidString)
            .order("work_date", ascending: false)
            .limit(limit)
            .execute().value
    }

    /// 추가 수당 신청 (pending — 승인/반려는 사장). 신청 시 사장에게 push(트리거)
    @discardableResult
    func submitAllowance(ownerUserId: UUID, workDate: String, type: String, minutes: Int, reason: String?) async throws -> TeamAllowanceRequest {
        struct Insert: Encodable {
            let owner_user_id: UUID
            let member_user_id: UUID
            let work_date: String
            let allowance_type: String
            let minutes: Int
            let reason: String?
        }
        let uid = try await client.auth.session.user.id
        return try await client
            .from("allowance_requests")
            .insert(Insert(owner_user_id: ownerUserId, member_user_id: uid,
                           work_date: workDate, allowance_type: type, minutes: minutes,
                           reason: (reason?.isEmpty == true) ? nil : reason))
            .select("id, member_user_id, work_date, allowance_type, minutes, reason, status")
            .single()
            .execute().value
    }

    /// 추가 수당 신청 취소 (pending 본인 것 — RLS)
    func cancelAllowance(id: UUID) async throws {
        try await client
            .from("allowance_requests")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }
}
