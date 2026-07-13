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

// ─── DTO ─────────────────────────────────────────────────────────────

public struct TeamMember: Decodable, Sendable, Identifiable, Equatable {
    public let memberUserId: UUID
    public let name: String
    public let role: String
    public let joinedAt: String?
    public let hireDate: String?
    /// 시급(원) — 사장 설정. RLS 상 직원 본인 행만 조회 가능 (동료 시급 비노출).
    public let hourlyWage: Int?

    public var id: UUID { memberUserId }

    enum CodingKeys: String, CodingKey {
        case memberUserId = "member_user_id"
        case name, role
        case joinedAt = "joined_at"
        case hireDate = "hire_date"
        case hourlyWage = "hourly_wage"
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        memberUserId = try c.decode(UUID.self, forKey: .memberUserId)
        name = try c.decode(String.self, forKey: .name)
        role = try c.decode(String.self, forKey: .role)
        joinedAt = try c.decodeIfPresent(String.self, forKey: .joinedAt)
        hireDate = try c.decodeIfPresent(String.self, forKey: .hireDate)
        // 마이그레이션 20260713 미적용 환경(hourly_wage 키 부재)에서도 디코딩 안전
        hourlyWage = try c.decodeIfPresent(Int.self, forKey: .hourlyWage)
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

public struct TeamScheduleRule: Decodable, Sendable, Identifiable, Equatable {
    public let id: UUID
    public let memberUserId: UUID
    public let weekday: Int        // 0=일 … 6=토 (웹 WEEK_KO 와 동일)
    public let startTime: String   // "09:00:00"
    public let endTime: String
    public let active: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case memberUserId = "member_user_id"
        case weekday
        case startTime = "start_time"
        case endTime = "end_time"
        case active
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
        // 웹과 동일 규격: 대문자 영숫자 8자리 (혼동 문자 제외 없음 — 웹 미러 유지)
        let chars = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        return String((0..<8).map { _ in chars.randomElement()! })
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

    // ── 근무표 규칙 (사장) ──
    public func scheduleRules() async throws -> [TeamScheduleRule] {
        try await client
            .from("staff_schedule_rules")
            .select("id, member_user_id, weekday, start_time, end_time, active")
            .eq("active", value: true)
            .execute().value
    }

    // 웹 saveRules 미러: 해당 직원의 기존 규칙 전체 삭제 → 새 요일 세트 insert.
    //   (웹 후속과제와 동일하게 비원자적 — RPC 화는 웹과 함께 진행.)
    public func saveRules(memberId: UUID, weekdays: Set<Int>, start: String, end: String) async throws {
        struct RuleInsert: Encodable {
            let owner_user_id: UUID
            let member_user_id: UUID
            let weekday: Int
            let start_time: String
            let end_time: String
            let active: Bool
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
                       weekday: $0, start_time: start, end_time: end, active: true)
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

    // ── 입사일 지정 (사장 — 근속 계산 기준) ──
    public func setHireDate(memberId: UUID, date: String) async throws {
        struct Patch: Encodable { let hire_date: String }
        try await client
            .from("store_members")
            .update(Patch(hire_date: date))
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

    enum CodingKeys: String, CodingKey {
        case connected
        case ownerUserId = "owner_user_id"
        case role
        case storeName = "store_name"
        case joinedAt = "joined_at"
        case hireDate = "hire_date"
        case hourlyWage = "hourly_wage"
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        connected = try c.decode(Bool.self, forKey: .connected)
        ownerUserId = try c.decodeIfPresent(UUID.self, forKey: .ownerUserId)
        role = try c.decodeIfPresent(String.self, forKey: .role)
        storeName = try c.decodeIfPresent(String.self, forKey: .storeName)
        joinedAt = try c.decodeIfPresent(String.self, forKey: .joinedAt)
        hireDate = try c.decodeIfPresent(String.self, forKey: .hireDate)
        // 마이그레이션 20260713_000002 미적용 환경(hourly_wage 키 부재)에서도 안전
        hourlyWage = try c.decodeIfPresent(Int.self, forKey: .hourlyWage)
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

/// 날짜별 예외(override) — is_off 면 그 날 휴무, 아니면 그 날만 다른 시간 (웹 Schedule 미러)
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
            .select("id, member_user_id, weekday, start_time, end_time, active")
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
}
