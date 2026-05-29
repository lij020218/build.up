//
//  AccountResetRepository.swift — 진행 초기화 (Supabase 직접 호출, web API 의존성 X).
//
//  2026-05-20 변경: 기존 web /api/account/reset POST 방식 → Supabase 직접 delete.
//   이유: production 도메인 (foundone.dev) 미배포 상태에서 DNS 실패. RLS 정책이
//   본인 row delete 를 허용하므로 web 우회해도 안전 (auth.uid() = user_id 가드).
//
//  Cascade:
//   • roadmaps   → stage_decisions, stage_tasks (FK on delete cascade)
//   • auth.users → 모든 user_id 참조 테이블 (FK on delete cascade) — 단, 사용자는 유지
//
//  RLS 가드 (정책 충족 못 하면 단순 0 row 영향):
//   • business_profiles_delete_own
//   • user_store_data_delete_own
//   • roadmaps_delete_own
//   • marketing_coach_cache_delete_own (있다면)
//

import Foundation
import Supabase
import FoundOneCore

public struct AccountResetResult: Sendable {
    /// 성공적으로 시도된 테이블 수.
    public let attemptedTables: Int
    /// 실제 핵심 테이블 (3개) 중 실패한 것 — partial 판단에 사용.
    public let coreFailures: [String]

    public var isFullSuccess: Bool { coreFailures.isEmpty }
}

public enum AccountResetError: LocalizedError, Sendable {
    case notAuthenticated
    case partial(failures: [String])

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "로그인이 필요합니다."
        case .partial(let f):
            return "일부 데이터 삭제 실패: \(f.joined(separator: ", "))"
        }
    }
}

public actor AccountResetRepository {

    private let supabase: SupabaseClient

    public init(supabase: SupabaseClient) {
        self.supabase = supabase
    }

    /// 사장님 본인 데이터 일괄 삭제 (Supabase RLS 보호).
    ///
    /// 핵심 테이블 (business_profiles / user_store_data / roadmaps) 중 하나라도
    /// 실패하면 AccountResetError.partial throw. 비핵심 테이블 (마케팅 캐시 등) 실패는 무시.
    /// roadmap 삭제 시 stage_decisions / stage_tasks 는 cascade 로 자동 삭제됨.
    @discardableResult
    public func resetAccount() async throws -> AccountResetResult {
        // 인증 확인
        let session: Session
        do {
            session = try await supabase.auth.session
        } catch {
            throw AccountResetError.notAuthenticated
        }
        let userId = session.user.id

        var coreFailures: [String] = []
        var attempts = 0

        // ── 핵심 테이블 (실패 시 partial 처리) ──
        let coreTables = ["business_profiles", "user_store_data", "roadmaps"]
        for table in coreTables {
            attempts += 1
            do {
                try await deleteOwnRows(table: table, userId: userId)
            } catch {
                coreFailures.append(table)
                #if DEBUG
                print("[AccountReset] core table \(table) delete failed: \(error)")
                #endif
            }
        }

        // ── 비핵심 테이블 (실패해도 무시) ──
        let optionalTables = [
            "marketing_coach_cache",
            "saas_metrics_connections",
            "saas_funnel_manual_weekly",
            "saas_funnel_source_daily",
            "saas_funnel_events_raw",
        ]
        for table in optionalTables {
            attempts += 1
            try? await deleteOwnRows(table: table, userId: userId)
        }

        if !coreFailures.isEmpty {
            throw AccountResetError.partial(failures: coreFailures)
        }
        return AccountResetResult(attemptedTables: attempts, coreFailures: coreFailures)
    }

    // MARK: - Helper

    private func deleteOwnRows(table: String, userId: UUID) async throws {
        _ = try await supabase
            .from(table)
            .delete()
            .eq("user_id", value: userId)
            .execute()
    }
}
